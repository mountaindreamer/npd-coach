"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, UIMessage } from "ai";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, useRef, useEffect, useCallback, Suspense, useMemo } from "react";
import { getScenarioById } from "@/lib/scenarios";
import { COACH_MODULES } from "@/lib/coach-modules";
import { checkMessageSafety, CRISIS_RESOURCES, DISCLAIMER } from "@/lib/safety";
import { DIFFICULTY_LABELS, DifficultyLevel, FeedbackResult } from "@/lib/types";
import { saveTrainingRecord, generateId } from "@/lib/storage";
import { CustomScenario } from "@/lib/prompts";
import { generateShareImage, shareOrDownload, copyLink } from "@/lib/share";
import { recordPlay } from "@/lib/heat";

function getMessageText(message: UIMessage): string {
  return message.parts
    .filter((p) => p.type === "text")
    .map((p) => p.text)
    .join("");
}

function parseHP(text: string): { cleanText: string; hp: number | null } {
  const match = text.match(/\[HP:(\d+)\]\s*$/);
  if (match) {
    return {
      cleanText: text.replace(/\n?\[HP:\d+\]\s*$/, "").trim(),
      hp: Math.min(100, Math.max(0, parseInt(match[1]))),
    };
  }
  return { cleanText: text, hp: null };
}

function getHPColor(hp: number): string {
  if (hp > 70) return "bg-red-500";
  if (hp > 30) return "bg-yellow-500";
  return "bg-green-500";
}

function getHPTextColor(hp: number): string {
  if (hp > 70) return "text-red-400";
  if (hp > 30) return "text-yellow-400";
  return "text-green-400";
}

function getHPLabel(hp: number): string {
  if (hp > 80) return "气焰嚣张";
  if (hp > 60) return "掌控局面";
  if (hp > 40) return "有些动摇";
  if (hp > 20) return "明显退缩";
  if (hp > 0) return "即将崩溃";
  return "已放弃操控";
}

const MAX_ROUNDS = 10;
const SESSION_SECONDS = 300; // 5 minutes

function ChatContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const mode = (searchParams.get("mode") || "coach") as "simulation" | "coach";
  const scenarioId = searchParams.get("scenario") || "";
  const difficulty = (searchParams.get("difficulty") || "beginner") as DifficultyLevel;
  const moduleId = searchParams.get("module") || "";
  const customParam = searchParams.get("custom") || "";

  const scenario = scenarioId ? getScenarioById(scenarioId) : null;
  const coachModule = moduleId
    ? COACH_MODULES.find((m) => m.id === moduleId)
    : null;

  const customScenario: CustomScenario | null = useMemo(() => {
    if (!customParam) return null;
    try {
      return JSON.parse(decodeURIComponent(customParam));
    } catch {
      return null;
    }
  }, [customParam]);

  const npdName = useMemo(() => {
    if (scenario) return scenario.npdName;
    if (customScenario) {
      const names: Record<string, string> = {
        intimate: "阿明",
        "parent-child": "妈",
        workplace: "张总",
      };
      return names[customScenario.relType] || "对方";
    }
    return "对方";
  }, [scenario, customScenario]);

  const [showCrisis, setShowCrisis] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackResult | null>(null);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [showDecompression, setShowDecompression] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [startTime] = useState(Date.now());
  const [npdHP, setNpdHP] = useState(100);
  const [timeLeft, setTimeLeft] = useState(mode === "simulation" ? SESSION_SECONDS : -1);
  const [linkCopied, setLinkCopied] = useState(false);
  const [sharing, setSharing] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const autoEndTriggered = useRef(false);
  const playRecorded = useRef(false);

  useEffect(() => {
    if (mode === "simulation" && scenarioId && !playRecorded.current) {
      playRecorded.current = true;
      recordPlay(scenarioId);
    }
  }, [mode, scenarioId]);

  const initialMessages: UIMessage[] = useMemo(() => {
    if (mode === "simulation" && customScenario) {
      return [
        {
          id: "opening",
          role: "assistant" as const,
          parts: [{ type: "text" as const, text: customScenario.opening }],
        },
      ];
    }
    if (mode === "simulation" && scenario) {
      return [
        {
          id: "opening",
          role: "assistant" as const,
          parts: [{ type: "text" as const, text: scenario.openingMessage }],
        },
      ];
    }
    if (coachModule) {
      return [
        {
          id: "coach-greeting",
          role: "assistant" as const,
          parts: [
            {
              type: "text" as const,
              text: `你好！欢迎来到「${coachModule.title}」学习模块。请选择一个你感兴趣的话题，我会为你详细讲解。\n\n你也可以直接描述你遇到的困扰，我们一起来探讨。`,
            },
          ],
        },
      ];
    }
    return [
      {
        id: "coach-greeting",
        role: "assistant" as const,
        parts: [
          {
            type: "text" as const,
            text: "你好！我是你的应对教练。你可以和我聊聊你的困扰、学习应对策略，或者让我帮你分析遇到的具体情况。一切交流都是安全和保密的。你想先聊些什么？",
          },
        ],
      },
    ];
  }, [mode, scenario, coachModule, customScenario]);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: {
          mode,
          scenarioId,
          difficulty,
          moduleId,
          topic: selectedTopic,
          customScenario: customScenario ?? undefined,
        },
      }),
    [mode, scenarioId, difficulty, moduleId, selectedTopic, customScenario]
  );

  const { messages, sendMessage, status } = useChat({
    transport,
    messages: initialMessages,
  });

  const isLoading = status === "submitted" || status === "streaming";

  const userMessageCount = useMemo(
    () => messages.filter((m) => m.role === "user").length,
    [messages]
  );

  // Parse HP from latest completed assistant message
  useEffect(() => {
    if (mode !== "simulation" || isLoading) return;
    const assistantMessages = messages.filter((m) => m.role === "assistant");
    if (assistantMessages.length === 0) return;
    const latest = assistantMessages[assistantMessages.length - 1];
    const text = getMessageText(latest);
    const { hp } = parseHP(text);
    if (hp !== null) setNpdHP(hp);
  }, [messages, isLoading, mode]);

  // Timer countdown
  useEffect(() => {
    if (mode !== "simulation" || timeLeft <= 0 || sessionEnded) return;
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [mode, sessionEnded, timeLeft]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!isLoading) inputRef.current?.focus();
  }, [isLoading]);

  // Auto-end: time up, rounds exceeded, or HP depleted
  useEffect(() => {
    if (mode !== "simulation" || sessionEnded || autoEndTriggered.current || isLoading) return;
    const shouldEnd =
      timeLeft === 0 ||
      userMessageCount >= MAX_ROUNDS ||
      npdHP <= 0;
    if (shouldEnd) {
      autoEndTriggered.current = true;
      endSession();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userMessageCount, isLoading, sessionEnded, mode, timeLeft, npdHP]);

  const handleSend = useCallback(() => {
    if (!input.trim() || isLoading || sessionEnded) return;
    const safety = checkMessageSafety(input);
    if (safety.triggered) {
      setShowCrisis(true);
      return;
    }
    const text = input;
    setInput("");
    sendMessage({ text });
  }, [input, isLoading, sessionEnded, sendMessage]);

  const handleTopicSelect = (topic: string) => {
    setSelectedTopic(topic);
    const text = `我想学习关于「${topic}」的内容。`;
    sendMessage({ text });
  };

  const endSession = async () => {
    setSessionEnded(true);

    const sessionId = generateId();
    const scenarioTitle =
      customScenario?.name || scenario?.title || coachModule?.title || "自由对话";

    if (mode === "simulation" && (scenario || customScenario) && messages.length > 1) {
      setLoadingFeedback(true);
      try {
        const feedbackScenarioId = scenarioId || "custom";
        const cleanMessages = messages.map((m) => {
          const text = getMessageText(m);
          const { cleanText } = parseHP(text);
          return { role: m.role, content: cleanText };
        });
        const res = await fetch("/api/feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            scenarioId: feedbackScenarioId,
            scenarioTitle,
            customScenario,
            messages: cleanMessages,
          }),
        });
        const data = await res.json();
        setFeedback(data);

        saveTrainingRecord({
          id: sessionId,
          date: new Date().toISOString(),
          scenarioId: feedbackScenarioId,
          scenarioTitle,
          mode,
          duration: Math.round((Date.now() - startTime) / 1000),
          feedback: data,
          messageCount: messages.length,
        });
      } catch {
        setFeedback(null);
      }
      setLoadingFeedback(false);
      setShowDecompression(true);
    } else {
      saveTrainingRecord({
        id: sessionId,
        date: new Date().toISOString(),
        scenarioId: moduleId || "free-chat",
        scenarioTitle,
        mode,
        duration: Math.round((Date.now() - startTime) / 1000),
        messageCount: messages.length,
      });
    }
  };

  const handleShare = async () => {
    if (!feedback) return;
    setSharing(true);
    try {
      const blob = await generateShareImage({
        scenarioTitle: customScenario?.name || scenario?.title || "自定义场景",
        npdName,
        feedback,
        npdHP,
        duration: Math.round((Date.now() - startTime) / 1000),
      });
      await shareOrDownload(blob, `npd-training-${Date.now()}.png`);
    } catch (e) {
      console.error("Share failed:", e);
    }
    setSharing(false);
  };

  const handleCopyLink = () => {
    if (scenarioId) {
      copyLink(scenarioId, difficulty);
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const accentColor = mode === "simulation" ? "sim-accent" : "coach-accent";
  const roundsLeft = MAX_ROUNDS - userMessageCount;

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="flex-shrink-0 border-b border-border bg-card px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/")}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              ← 返回
            </button>
            <div className="h-4 w-px bg-border" />
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-block w-2 h-2 rounded-full ${
                    accentColor === "sim-accent"
                      ? "bg-sim-accent"
                      : "bg-coach-accent"
                  }`}
                />
                <span className="text-sm font-medium">
                  {mode === "simulation" ? "模拟对话训练" : "教练指导"}
                </span>
              </div>
              {scenario && (
                <p className="text-xs text-muted-foreground">
                  {scenario.icon} {scenario.title} ·{" "}
                  {DIFFICULTY_LABELS[difficulty]}
                </p>
              )}
              {customScenario && (
                <p className="text-xs text-muted-foreground">
                  🎯 {customScenario.name} · {DIFFICULTY_LABELS[difficulty]}
                </p>
              )}
              {coachModule && (
                <p className="text-xs text-muted-foreground">
                  {coachModule.icon} {coachModule.title}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {mode === "simulation" && !sessionEnded && (
              <>
                <span
                  className={`text-xs font-mono px-2 py-1 rounded-lg ${
                    timeLeft <= 60
                      ? "bg-red-500/10 text-red-400"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {formatTime(timeLeft)}
                </span>
                <span className="text-xs text-muted-foreground px-2 py-1 bg-muted rounded-lg">
                  {roundsLeft > 0 ? `${roundsLeft}轮` : "最后"}
                </span>
              </>
            )}
            {!sessionEnded && (
              <button
                onClick={endSession}
                className="px-3 py-1.5 text-sm rounded-lg bg-muted text-muted-foreground hover:bg-danger hover:text-white transition-all"
              >
                结束
              </button>
            )}
            <button
              onClick={() => setShowCrisis(true)}
              className="px-3 py-1.5 text-sm rounded-lg border border-danger text-danger hover:bg-danger hover:text-white transition-all"
              title="紧急求助"
            >
              SOS
            </button>
          </div>
        </div>
      </header>

      {/* HP Bar - simulation mode only */}
      {mode === "simulation" && (
        <div className="flex-shrink-0 bg-card/50 border-b border-border px-4 py-2">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">
                {npdName}的心理防线
              </span>
              <span className={`text-xs font-medium ${getHPTextColor(npdHP)}`}>
                {npdHP}% · {getHPLabel(npdHP)}
              </span>
            </div>
            <div className="h-2.5 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ease-out ${getHPColor(npdHP)}`}
                style={{ width: `${npdHP}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Disclaimer banner for simulation mode */}
      {mode === "simulation" && !sessionEnded && (
        <div className="flex-shrink-0 bg-sim-accent/10 border-b border-sim-accent/20 px-4 py-1.5">
          <p className="max-w-3xl mx-auto text-xs text-center text-sim-accent">
            ⚠️ AI 正在扮演角色，仅供训练。随时可点击&quot;结束&quot;退出。
          </p>
        </div>
      )}

      {/* Topic selector for coach modules */}
      {coachModule && !selectedTopic && messages.length <= 1 && (
        <div className="flex-shrink-0 bg-card border-b border-border px-4 py-4">
          <div className="max-w-3xl mx-auto">
            <p className="text-sm text-muted-foreground mb-3">
              选择一个话题开始学习：
            </p>
            <div className="flex flex-wrap gap-2">
              {coachModule.topics.map((topic) => (
                <button
                  key={topic}
                  onClick={() => handleTopicSelect(topic)}
                  className="px-3 py-1.5 text-sm rounded-full bg-muted text-foreground hover:bg-coach-accent hover:text-white transition-all"
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-4">
          {/* Scene context card */}
          {mode === "simulation" && (scenario || customScenario) && (
            <div className="bg-gradient-to-br from-card to-muted/50 border border-border rounded-2xl p-5 mb-2 animate-fade-in">
              <div className="flex items-start gap-3">
                <span className="text-2xl mt-0.5">📖</span>
                <div className="flex-1">
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                    场景设定
                  </h4>
                  <p className="text-sm leading-relaxed text-card-foreground">
                    {scenario?.scene || customScenario?.description || ""}
                  </p>
                  <div className="flex items-center gap-2 mt-3">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-sim-accent/10 text-sim-accent border border-sim-accent/20">
                      {scenario?.npdPattern || "自定义场景"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {DIFFICULTY_LABELS[difficulty]}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {messages.map((message) => {
            const rawText = getMessageText(message);
            if (!rawText) return null;
            const { cleanText } = parseHP(rawText);
            return (
              <div
                key={message.id}
                className={`flex animate-fade-in ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : mode === "simulation"
                        ? "bg-card border border-border text-card-foreground rounded-bl-md"
                        : "bg-coach-accent/10 text-card-foreground rounded-bl-md"
                  }`}
                >
                  {message.role === "assistant" && (
                    <p className="text-xs font-medium mb-1 opacity-60">
                      {mode === "simulation" ? npdName : "教练"}
                    </p>
                  )}
                  <div className="text-sm leading-relaxed whitespace-pre-wrap">
                    {cleanText}
                  </div>
                </div>
              </div>
            );
          })}

          {isLoading && messages[messages.length - 1]?.role === "user" && (
            <div className="flex justify-start animate-fade-in">
              <div
                className={`rounded-2xl px-4 py-3 rounded-bl-md ${
                  mode === "simulation"
                    ? "bg-card border border-border"
                    : "bg-coach-accent/10"
                }`}
              >
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Feedback panel */}
      {sessionEnded && feedback && (
        <div className="flex-shrink-0 border-t border-border bg-card px-4 py-6 animate-slide-up max-h-[60vh] overflow-y-auto">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">训练反馈报告</h3>
              <div className="flex gap-2">
                <button
                  onClick={handleCopyLink}
                  className="px-3 py-1.5 text-xs rounded-lg bg-muted text-muted-foreground hover:bg-border transition-colors"
                >
                  {linkCopied ? "✓ 已复制" : "复制链接"}
                </button>
                <button
                  onClick={handleShare}
                  disabled={sharing}
                  className="px-3 py-1.5 text-xs rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-40"
                >
                  {sharing ? "生成中..." : "生成分享图"}
                </button>
              </div>
            </div>

            {/* Victory / defeat banner */}
            {mode === "simulation" && (
              <div
                className={`rounded-xl p-4 mb-4 text-center ${
                  npdHP <= 30
                    ? "bg-green-500/10 border border-green-500/20"
                    : npdHP >= 80
                      ? "bg-red-500/10 border border-red-500/20"
                      : "bg-yellow-500/10 border border-yellow-500/20"
                }`}
              >
                <div className="text-2xl mb-1">
                  {npdHP <= 30 ? "🎉" : npdHP >= 80 ? "😞" : "💪"}
                </div>
                <div className={`text-sm font-medium ${getHPTextColor(npdHP)}`}>
                  {npdHP <= 30
                    ? `${npdName}的心理防线已被你击穿！`
                    : npdHP >= 80
                      ? `${npdName}依然占据主导`
                      : `${npdName}有所动摇，继续加油！`}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {npdName}的心理防线剩余 {npdHP}%
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {[
                { label: "总体评分", score: feedback.overallScore },
                { label: "边界设定", score: feedback.boundaryScore },
                { label: "情绪调节", score: feedback.emotionalRegulation },
                { label: "策略运用", score: feedback.strategyEffectiveness },
              ].map((item) => (
                <div
                  key={item.label}
                  className="bg-muted rounded-xl p-3 text-center"
                >
                  <div className="text-2xl font-bold text-primary">
                    {item.score}
                    <span className="text-sm text-muted-foreground">/10</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {item.label}
                  </div>
                </div>
              ))}
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <h4 className="text-sm font-medium text-coach-accent mb-2">
                  做得好的地方
                </h4>
                <ul className="space-y-1">
                  {feedback.strengths.map((s, i) => (
                    <li
                      key={i}
                      className="text-sm text-muted-foreground flex items-start gap-2"
                    >
                      <span className="text-coach-accent mt-0.5">✓</span> {s}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-medium text-sim-accent mb-2">
                  可以改进的地方
                </h4>
                <ul className="space-y-1">
                  {feedback.improvements.map((s, i) => (
                    <li
                      key={i}
                      className="text-sm text-muted-foreground flex items-start gap-2"
                    >
                      <span className="text-sim-accent mt-0.5">→</span> {s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {feedback.suggestedResponses.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium mb-2">推荐回应方式</h4>
                <div className="space-y-2">
                  {feedback.suggestedResponses.map((s, i) => (
                    <div
                      key={i}
                      className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-sm"
                    >
                      &ldquo;{s}&rdquo;
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Decompression guide */}
      {showDecompression && (
        <div className="flex-shrink-0 border-t border-coach-accent/30 bg-coach-accent/5 px-4 py-4">
          <div className="max-w-3xl mx-auto text-center">
            <h4 className="font-medium text-coach-accent mb-2">
              减压小练习
            </h4>
            <p className="text-sm text-muted-foreground mb-3">
              模拟对话可能会唤起一些情绪。花一分钟做个简单的着陆练习：
            </p>
            <div className="bg-card rounded-xl p-4 text-sm text-card-foreground inline-block text-left">
              <p className="mb-2">深呼吸三次，然后注意：</p>
              <p>
                👁️ 看到的 5 样东西 · 👂 听到的 4 种声音 · ✋ 能触摸到的 3 个物品
              </p>
              <p className="mt-2 text-muted-foreground">
                这个 5-4-3-2-1 感官着陆法可以帮助你回到当下。
              </p>
            </div>

            <div className="mt-4">
              <button
                onClick={() => router.push("/")}
                className="px-6 py-2 bg-coach-accent text-white rounded-lg hover:opacity-90 transition-opacity"
              >
                返回首页
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading feedback */}
      {loadingFeedback && (
        <div className="flex-shrink-0 border-t border-border bg-card px-4 py-6">
          <div className="max-w-3xl mx-auto text-center">
            <div className="animate-pulse-soft text-muted-foreground">
              正在分析你的对话表现...
            </div>
          </div>
        </div>
      )}

      {/* Session ended, no simulation feedback */}
      {sessionEnded && !feedback && !loadingFeedback && (
        <div className="flex-shrink-0 border-t border-border bg-card px-4 py-4">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-muted-foreground text-sm mb-3">
              对话已结束。训练记录已保存。
            </p>
            <button
              onClick={() => router.push("/")}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
            >
              返回首页
            </button>
          </div>
        </div>
      )}

      {/* Input area */}
      {!sessionEnded && (
        <div className="flex-shrink-0 border-t border-border bg-card px-4 py-3">
          <div className="max-w-3xl mx-auto flex gap-2 items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={
                mode === "simulation"
                  ? "输入你的回应..."
                  : "输入你想聊的内容..."
              }
              rows={1}
              className="flex-1 resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className={`px-4 py-3 rounded-xl text-white text-sm font-medium transition-all disabled:opacity-40 ${
                mode === "simulation"
                  ? "bg-sim-accent hover:bg-sim-accent/90"
                  : "bg-coach-accent hover:bg-coach-accent/90"
              }`}
            >
              发送
            </button>
          </div>
        </div>
      )}

      {/* Crisis modal */}
      {showCrisis && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl p-6 max-w-md w-full animate-slide-up shadow-2xl">
            <h3 className="text-lg font-semibold text-danger mb-3">
              紧急心理援助
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {CRISIS_RESOURCES.message}
            </p>
            <div className="space-y-3 mb-6">
              {[
                {
                  name: CRISIS_RESOURCES.hotlineName,
                  number: CRISIS_RESOURCES.hotline,
                },
                {
                  name: CRISIS_RESOURCES.hotlineName2,
                  number: CRISIS_RESOURCES.hotline2,
                },
                {
                  name: CRISIS_RESOURCES.hotlineName3,
                  number: CRISIS_RESOURCES.hotline3,
                },
              ].map((item) => (
                <a
                  key={item.number}
                  href={`tel:${item.number}`}
                  className="flex items-center justify-between bg-danger/10 rounded-lg p-3 hover:bg-danger/20 transition-colors"
                >
                  <span className="text-sm font-medium">{item.name}</span>
                  <span className="text-danger font-bold">{item.number}</span>
                </a>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mb-4">{DISCLAIMER}</p>
            <button
              onClick={() => setShowCrisis(false)}
              className="w-full py-2 rounded-lg bg-muted text-foreground hover:bg-border transition-colors text-sm"
            >
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen flex items-center justify-center bg-background">
          <div className="animate-pulse-soft text-muted-foreground">
            加载中...
          </div>
        </div>
      }
    >
      <ChatContent />
    </Suspense>
  );
}
