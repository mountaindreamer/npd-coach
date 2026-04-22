"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SCENARIOS } from "@/lib/scenarios";
import { COACH_MODULES } from "@/lib/coach-modules";
import { DISCLAIMER, CRISIS_RESOURCES } from "@/lib/safety";
import {
  RELATIONSHIP_LABELS,
  DIFFICULTY_LABELS,
  DIFFICULTY_DESCRIPTIONS,
  RelationshipType,
  DifficultyLevel,
} from "@/lib/types";
import { getPlayCounts, formatPlays } from "@/lib/heat";
import AdWall from "@/components/ad-wall";
import { getDialogueConsent, getOrCreateUserId } from "@/lib/client-identity";
import { trackEvent } from "@/lib/telemetry";

type View = "home" | "simulation-setup" | "coach-setup";

const HOT_THRESHOLD = 5;

export default function HomePage() {
  const router = useRouter();
  const [view, setView] = useState<View>("home");
  const [selectedRelType, setSelectedRelType] =
    useState<RelationshipType>("intimate");
  const [selectedDifficulty, setSelectedDifficulty] =
    useState<DifficultyLevel>("beginner");
  const [plays, setPlays] = useState<Record<string, number>>({});
  const [showAd, setShowAd] = useState(false);
  const [pendingScenarioId, setPendingScenarioId] = useState<string | null>(null);

  useEffect(() => {
    setPlays(getPlayCounts());
    const userId = getOrCreateUserId();
    const consent = getDialogueConsent();
    void trackEvent({
      event: "page_view_home",
      userId,
      props: { consentDialogueCollection: consent },
    });
  }, []);

  const filteredScenarios = SCENARIOS.filter(
    (s) => s.relationshipType === selectedRelType
  );

  const sortedScenarios = [...filteredScenarios].sort(
    (a, b) => (plays[b.id] ?? 0) - (plays[a.id] ?? 0)
  );

  useEffect(() => {
    const userId = getOrCreateUserId();
    void trackEvent({
      event: "scenario_card_exposure",
      userId,
      props: {
        relType: selectedRelType,
        scenarioIds: sortedScenarios.map((s) => s.id),
      },
    });
  }, [selectedRelType, sortedScenarios]);

  const handleScenarioClick = (scenarioId: string) => {
    const userId = getOrCreateUserId();
    void trackEvent({
      event: "scenario_card_click",
      userId,
      props: { scenarioId, difficulty: selectedDifficulty, relType: selectedRelType },
    });
    const count = plays[scenarioId] ?? 0;
    if (count >= HOT_THRESHOLD) {
      setPendingScenarioId(scenarioId);
      setShowAd(true);
    } else {
      router.push(
        `/chat?mode=simulation&scenario=${scenarioId}&difficulty=${selectedDifficulty}`
      );
    }
  };

  const handleAdComplete = () => {
    setShowAd(false);
    if (pendingScenarioId) {
      router.push(
        `/chat?mode=simulation&scenario=${pendingScenarioId}&difficulty=${selectedDifficulty}`
      );
      setPendingScenarioId(null);
    }
  };

  if (view === "simulation-setup") {
    return (
      <main className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <button
            onClick={() => setView("home")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <span>←</span> 返回
          </button>

          <h1 className="text-2xl font-bold mb-2">选择训练场景</h1>
          <p className="text-muted-foreground mb-8">
            选择一个你想练习应对的场景
          </p>

          {/* Relationship type tabs */}
          <div className="flex gap-2 mb-6">
            {(
              Object.entries(RELATIONSHIP_LABELS) as [
                RelationshipType,
                string,
              ][]
            ).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setSelectedRelType(key)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedRelType === key
                    ? "bg-sim-accent text-white shadow-md"
                    : "bg-muted text-muted-foreground hover:bg-border"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Scenario cards */}
          <div className="space-y-3 mb-8">
            {sortedScenarios.map((scenario) => {
              const count = plays[scenario.id] ?? 0;
              const isHot = count >= HOT_THRESHOLD;
              return (
                <button
                  key={scenario.id}
                  onClick={() => handleScenarioClick(scenario.id)}
                  className="block w-full text-left bg-card border border-border rounded-xl p-5 hover:border-sim-accent hover:shadow-lg transition-all group"
                >
                  <div className="flex items-start gap-4">
                    <span className="text-2xl">{scenario.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-card-foreground group-hover:text-sim-accent transition-colors truncate">
                          {scenario.title}
                        </h3>
                        {isHot && (
                          <span className="text-xs px-1.5 py-0.5 bg-red-500/10 text-red-500 rounded-full whitespace-nowrap">
                            HOT
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {scenario.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                          {scenario.npdPattern}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatPlays(count)}
                        </span>
                      </div>
                    </div>
                    <span className="text-muted-foreground group-hover:text-sim-accent transition-colors">
                      →
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Difficulty selector */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="font-semibold mb-3">难度选择</h3>
            <div className="space-y-2">
              {(
                Object.entries(DIFFICULTY_LABELS) as [DifficultyLevel, string][]
              ).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setSelectedDifficulty(key)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                    selectedDifficulty === key
                      ? "bg-sim-accent/10 border border-sim-accent text-foreground"
                      : "bg-muted text-muted-foreground hover:bg-border"
                  }`}
                >
                  <span className="font-medium">{label}</span>
                  <span className="text-sm ml-2 opacity-70">
                    — {DIFFICULTY_DESCRIPTIONS[key]}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {showAd && (
          <AdWall
            onComplete={handleAdComplete}
            onCancel={() => {
              setShowAd(false);
              setPendingScenarioId(null);
            }}
            reason="该场景为热门场景，观看广告后即可开始训练"
          />
        )}
      </main>
    );
  }

  if (view === "coach-setup") {
    return (
      <main className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <button
            onClick={() => setView("home")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <span>←</span> 返回
          </button>

          <h1 className="text-2xl font-bold mb-2">教练指导</h1>
          <p className="text-muted-foreground mb-8">
            选择一个学习模块，或直接开始自由对话
          </p>

          <Link
            href="/chat?mode=coach"
            className="block bg-coach-accent/10 border-2 border-coach-accent rounded-xl p-5 mb-6 hover:shadow-lg transition-all group"
          >
            <div className="flex items-center gap-4">
              <span className="text-2xl">💬</span>
              <div className="flex-1">
                <h3 className="font-semibold text-coach-accent">自由对话</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  和 AI 教练自由交流，讨论你的任何疑问或经历
                </p>
              </div>
              <span className="text-coach-accent">→</span>
            </div>
          </Link>

          <h3 className="font-semibold mb-3 text-muted-foreground text-sm uppercase tracking-wider">
            结构化学习模块
          </h3>
          <div className="space-y-3">
            {COACH_MODULES.map((mod) => (
              <Link
                key={mod.id}
                href={`/chat?mode=coach&module=${mod.id}`}
                className="block bg-card border border-border rounded-xl p-5 hover:border-coach-accent hover:shadow-lg transition-all group"
              >
                <div className="flex items-start gap-4">
                  <span className="text-2xl">{mod.icon}</span>
                  <div className="flex-1">
                    <h3 className="font-semibold text-card-foreground group-hover:text-coach-accent transition-colors">
                      {mod.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {mod.description}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {mod.topics.slice(0, 3).map((t) => (
                        <span
                          key={t}
                          className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
                        >
                          {t}
                        </span>
                      ))}
                      {mod.topics.length > 3 && (
                        <span className="text-xs px-2 py-0.5 text-muted-foreground">
                          +{mod.topics.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-muted-foreground group-hover:text-coach-accent transition-colors">
                    →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 pt-16 pb-8 text-center">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-6">
          <span className="w-2 h-2 bg-primary rounded-full animate-pulse-soft" />
          AI 心理自助训练工具
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
          NPD 应对教练
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
          在安全的环境中练习识别和应对自恋型人格操控模式。
          <br />
          像飞行模拟器一样，帮助你为现实中的挑战做好准备。
        </p>
      </div>

      <div className="max-w-3xl mx-auto px-4 pb-8">
        <div className="grid md:grid-cols-2 gap-4">
          <button
            onClick={() => {
              void trackEvent({
                event: "click_start_simulation",
                userId: getOrCreateUserId(),
              });
              setView("simulation-setup");
            }}
            className="bg-card border border-border rounded-2xl p-6 text-left hover:border-sim-accent hover:shadow-xl transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-sim-accent/10 flex items-center justify-center text-2xl mb-4">
              🎭
            </div>
            <h2 className="text-xl font-semibold mb-2 group-hover:text-sim-accent transition-colors">
              模拟对话训练
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              AI 真实还原 NPD 对话场景，在安全环境中练习应对策略，获得实时反馈。
            </p>
            <div className="flex items-center gap-2 mt-4 text-sim-accent text-sm font-medium">
              选择场景开始 <span>→</span>
            </div>
          </button>

          <button
            onClick={() => {
              void trackEvent({
                event: "click_start_coach",
                userId: getOrCreateUserId(),
              });
              setView("coach-setup");
            }}
            className="bg-card border border-border rounded-2xl p-6 text-left hover:border-coach-accent hover:shadow-xl transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-coach-accent/10 flex items-center justify-center text-2xl mb-4">
              🤝
            </div>
            <h2 className="text-xl font-semibold mb-2 group-hover:text-coach-accent transition-colors">
              教练指导
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              和 AI
              心理教练交流，学习识别操控行为模式，掌握实用的应对策略和情绪管理技巧。
            </p>
            <div className="flex items-center gap-2 mt-4 text-coach-accent text-sm font-medium">
              开始学习 <span>→</span>
            </div>
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 pb-8 space-y-3">
        <Link
          href="/quiz"
          className="flex items-center justify-between bg-card border-2 border-primary/30 rounded-xl p-4 hover:border-primary hover:shadow-lg transition-all"
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">🔍</span>
            <div>
              <span className="font-medium">ta 是 NPD 吗？</span>
              <p className="text-xs text-muted-foreground">
                20道题快速评估，识别潜在的操控行为模式
              </p>
            </div>
          </div>
          <span className="text-primary font-medium">测一测 →</span>
        </Link>

        <Link
          href="/community"
          onClick={() =>
            void trackEvent({
              event: "community_join_click",
              userId: getOrCreateUserId(),
            })
          }
          className="flex items-center justify-between bg-card border border-border rounded-xl p-4 hover:border-coach-accent transition-all"
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">👥</span>
            <div>
              <span className="font-medium">社群运营与共创</span>
              <p className="text-xs text-muted-foreground">
                加入社群、参与共创，提交匿名对话样本用于优化模型
              </p>
            </div>
          </div>
          <span className="text-muted-foreground">→</span>
        </Link>

        <Link
          href="/ugc"
          onClick={() =>
            void trackEvent({
              event: "ugc_entry_click",
              userId: getOrCreateUserId(),
            })
          }
          className="flex items-center justify-between bg-card border border-border rounded-xl p-4 hover:border-sim-accent transition-all"
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">✏️</span>
            <div>
              <span className="font-medium">用户共创场景</span>
              <p className="text-xs text-muted-foreground">
                服务端收集与审核 UGC 场景，审核通过后可用于训练
              </p>
            </div>
          </div>
          <span className="text-muted-foreground">→</span>
        </Link>

        <Link
          href="/custom"
          className="flex items-center justify-between bg-card border border-border rounded-xl p-4 hover:border-sim-accent transition-all"
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">🎯</span>
            <div>
              <span className="font-medium">自定义训练场景</span>
              <p className="text-xs text-muted-foreground">
                详细定制模拟对话的角色和情境
              </p>
            </div>
          </div>
          <span className="text-muted-foreground">→</span>
        </Link>

        <Link
          href="/history"
          className="flex items-center justify-between bg-card border border-border rounded-xl p-4 hover:border-primary transition-all"
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">📊</span>
            <span className="font-medium">训练记录</span>
          </div>
          <span className="text-muted-foreground">→</span>
        </Link>

        <Link
          href="/ops"
          className="flex items-center justify-between bg-card border border-border rounded-xl p-4 hover:border-coach-accent transition-all"
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">📈</span>
            <span className="font-medium">运营看板</span>
          </div>
          <span className="text-muted-foreground">→</span>
        </Link>
      </div>

      <div className="max-w-3xl mx-auto px-4 pb-8">
        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="font-semibold mb-4">它是如何工作的？</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center p-4">
              <div className="text-3xl mb-2">1</div>
              <h4 className="font-medium mb-1">选择场景</h4>
              <p className="text-sm text-muted-foreground">
                挑一个你最有共鸣的场景
              </p>
            </div>
            <div className="text-center p-4">
              <div className="text-3xl mb-2">2</div>
              <h4 className="font-medium mb-1">代入情境</h4>
              <p className="text-sm text-muted-foreground">
                阅读场景设定，和 AI 对话
              </p>
            </div>
            <div className="text-center p-4">
              <div className="text-3xl mb-2">3</div>
              <h4 className="font-medium mb-1">获得反馈</h4>
              <p className="text-sm text-muted-foreground">
                AI 分析你的应对质量并给建议
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 pb-16">
        <div className="bg-muted rounded-xl p-4 text-center">
          <p className="text-sm text-muted-foreground">{DISCLAIMER}</p>
          <p className="text-sm text-muted-foreground mt-2">
            紧急心理援助：
            <a
              href={`tel:${CRISIS_RESOURCES.hotline}`}
              className="text-primary hover:underline ml-1"
            >
              {CRISIS_RESOURCES.hotlineName} {CRISIS_RESOURCES.hotline}
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
