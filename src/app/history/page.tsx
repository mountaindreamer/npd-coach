"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getTrainingRecords, clearTrainingRecords } from "@/lib/storage";
import { getEmotionEntries } from "@/lib/emotion-tracking";
import { EMOTION_EMOJIS, EmotionEntry } from "@/lib/emotion-tracking";
import { TrainingRecord } from "@/lib/types";

type Tab = "records" | "progress";

export default function HistoryPage() {
  const router = useRouter();
  const [records, setRecords] = useState<TrainingRecord[]>([]);
  const [emotions, setEmotions] = useState<EmotionEntry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState<Tab>("records");

  useEffect(() => {
    setRecords(getTrainingRecords());
    setEmotions(getEmotionEntries());
    setLoaded(true);
  }, []);

  const handleClear = () => {
    if (confirm("确定要清除所有训练记录吗？此操作不可撤销。")) {
      clearTrainingRecords();
      setRecords([]);
    }
  };

  const totalSessions = records.length;
  const simSessions = records.filter((r) => r.mode === "simulation").length;
  const coachSessions = records.filter((r) => r.mode === "coach").length;
  const scoredRecords = records.filter((r) => r.feedback);
  const avgScore =
    scoredRecords.length > 0
      ? (
          scoredRecords.reduce(
            (sum, r) => sum + (r.feedback?.overallScore || 0),
            0
          ) / scoredRecords.length
        ).toFixed(1)
      : "—";

  const totalMinutes = Math.round(
    records.reduce((sum, r) => sum + r.duration, 0) / 60
  );

  const avgBoundary =
    scoredRecords.length > 0
      ? (
          scoredRecords.reduce(
            (sum, r) => sum + (r.feedback?.boundaryScore || 0),
            0
          ) / scoredRecords.length
        ).toFixed(1)
      : "—";

  const avgEmotional =
    scoredRecords.length > 0
      ? (
          scoredRecords.reduce(
            (sum, r) => sum + (r.feedback?.emotionalRegulation || 0),
            0
          ) / scoredRecords.length
        ).toFixed(1)
      : "—";

  const avgStrategy =
    scoredRecords.length > 0
      ? (
          scoredRecords.reduce(
            (sum, r) => sum + (r.feedback?.strategyEffectiveness || 0),
            0
          ) / scoredRecords.length
        ).toFixed(1)
      : "—";

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}秒`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0 ? `${mins}分${secs}秒` : `${mins}分钟`;
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("zh-CN", {
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse-soft text-muted-foreground">
          加载中...
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <span>←</span> 返回首页
        </button>

        <h1 className="text-2xl font-bold mb-6">训练记录</h1>

        {/* Stats overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: "总训练次数", value: totalSessions },
            { label: "累计时长", value: `${totalMinutes}分` },
            { label: "模拟对话", value: simSessions },
            { label: "平均评分", value: avgScore },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-card border border-border rounded-xl p-4 text-center"
            >
              <div className="text-2xl font-bold text-primary">
                {stat.value}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Skill breakdown */}
        {scoredRecords.length > 0 && (
          <div className="bg-card border border-border rounded-xl p-5 mb-6">
            <h3 className="font-semibold mb-4">能力成长概览</h3>
            <div className="space-y-3">
              {[
                { label: "边界设定", value: avgBoundary, color: "bg-coach-accent" },
                { label: "情绪调节", value: avgEmotional, color: "bg-primary" },
                { label: "策略运用", value: avgStrategy, color: "bg-sim-accent" },
              ].map((skill) => (
                <div key={skill.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{skill.label}</span>
                    <span className="font-medium">{skill.value}/10</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${skill.color} transition-all`}
                      style={{
                        width: `${(parseFloat(skill.value as string) / 10) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          {[
            { key: "records" as Tab, label: "训练记录" },
            { key: "progress" as Tab, label: "情绪追踪" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === t.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-border"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "records" && (
          <>
            {records.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-4xl mb-4">📊</p>
                <p className="text-muted-foreground">
                  还没有训练记录。开始你的第一次训练吧！
                </p>
                <button
                  onClick={() => router.push("/")}
                  className="mt-4 px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
                >
                  开始训练
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-3 mb-8">
                  {records.map((record) => (
                    <div
                      key={record.id}
                      className="bg-card border border-border rounded-xl p-4 animate-fade-in"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              record.mode === "simulation"
                                ? "bg-sim-accent"
                                : "bg-coach-accent"
                            }`}
                          />
                          <span className="text-sm font-medium">
                            {record.scenarioTitle}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(record.date)}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>
                          {record.mode === "simulation"
                            ? "模拟对话"
                            : "教练指导"}
                        </span>
                        <span>{formatDuration(record.duration)}</span>
                        <span>{record.messageCount} 条消息</span>
                        {record.feedback && (
                          <span className="text-primary font-medium">
                            评分: {record.feedback.overallScore}/10
                          </span>
                        )}
                      </div>
                      {record.feedback && (
                        <div className="mt-3 pt-3 border-t border-border">
                          <div className="grid grid-cols-3 gap-2 text-xs text-center">
                            <div>
                              <span className="text-muted-foreground">
                                边界
                              </span>
                              <span className="block font-medium text-sm">
                                {record.feedback.boundaryScore}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">
                                情绪
                              </span>
                              <span className="block font-medium text-sm">
                                {record.feedback.emotionalRegulation}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">
                                策略
                              </span>
                              <span className="block font-medium text-sm">
                                {record.feedback.strategyEffectiveness}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleClear}
                  className="text-sm text-danger hover:underline"
                >
                  清除所有记录
                </button>
              </>
            )}
          </>
        )}

        {tab === "progress" && (
          <div>
            {emotions.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-4xl mb-4">🌊</p>
                <p className="text-muted-foreground">
                  情绪追踪数据将在你完成训练时自动记录。
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {emotions.map((entry) => (
                  <div
                    key={entry.id}
                    className="bg-card border border-border rounded-xl p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">
                          {EMOTION_EMOJIS[entry.before]}
                        </span>
                        <span className="text-muted-foreground">→</span>
                        <span className="text-xl">
                          {EMOTION_EMOJIS[entry.after]}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(entry.date)}
                      </span>
                    </div>
                    {entry.notes && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {entry.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
