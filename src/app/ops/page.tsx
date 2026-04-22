"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type OpsSummary = {
  generatedAt: string;
  windowDays: number;
  totals: {
    users: number;
    sessions: number;
    endedSessions: number;
    endRatePct: number;
    messages: number;
    events: number;
    ugcPending: number;
    ugcApproved: number;
    ugcRejected: number;
  };
  funnel: {
    homeUv: number;
    clickUv: number;
    firstMsgUv: number;
    endedUv: number;
  };
  topScenarios: Array<{ scenarioId: string; clicks: number }>;
  dailySessions: Array<{ day: string; sessions: number; endedSessions: number }>;
};

function pct(n: number, d: number): string {
  if (d <= 0) return "0%";
  return `${((n / d) * 100).toFixed(1)}%`;
}

export default function OpsPage() {
  const router = useRouter();
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<OpsSummary | null>(null);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      setLoading(true);
      const res = await fetch(`/api/ops/summary?days=${days}`, { cache: "no-store" });
      const data = await res.json();
      if (mounted) setSummary(data);
      setLoading(false);
    };
    run();
    return () => {
      mounted = false;
    };
  }, [days]);

  const maxSessions = useMemo(
    () =>
      Math.max(
        1,
        ...(summary?.dailySessions.map((d) => Math.max(d.sessions, d.endedSessions)) ?? [1])
      ),
    [summary]
  );

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <span>←</span> 返回首页
          </button>
          <div className="flex items-center gap-2">
            {[7, 30, 60, 90].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-3 py-1.5 rounded-lg text-sm ${
                  days === d ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                {d}天
              </button>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6">
          <h1 className="text-2xl font-bold mb-2">运营可视化看板</h1>
          <p className="text-sm text-muted-foreground">
            覆盖曝光、点击、开聊、完训、UGC审核。数据来源于 Postgres（若未配置则回退文件存储）。
          </p>
          {summary && (
            <p className="text-xs text-muted-foreground mt-2">
              最近更新时间：{new Date(summary.generatedAt).toLocaleString("zh-CN")}
            </p>
          )}
        </div>

        {loading && <div className="text-sm text-muted-foreground">加载中...</div>}

        {summary && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                ["新增用户", summary.totals.users],
                ["会话数", summary.totals.sessions],
                ["完训数", summary.totals.endedSessions],
                ["完训率", `${summary.totals.endRatePct}%`],
                ["消息数", summary.totals.messages],
                ["埋点数", summary.totals.events],
                ["UGC待审", summary.totals.ugcPending],
                ["UGC通过", summary.totals.ugcApproved],
              ].map(([label, value]) => (
                <div key={String(label)} className="bg-card border border-border rounded-xl p-4">
                  <div className="text-xs text-muted-foreground">{label}</div>
                  <div className="text-2xl font-semibold mt-1">{value}</div>
                </div>
              ))}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-card border border-border rounded-xl p-5">
                <h2 className="font-semibold mb-4">漏斗（UV）</h2>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span>首页曝光</span>
                    <span>{summary.funnel.homeUv}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>点击场景</span>
                    <span>
                      {summary.funnel.clickUv} ({pct(summary.funnel.clickUv, summary.funnel.homeUv)})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>发送首条消息</span>
                    <span>
                      {summary.funnel.firstMsgUv} (
                      {pct(summary.funnel.firstMsgUv, summary.funnel.clickUv)})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>完成训练</span>
                    <span>
                      {summary.funnel.endedUv} (
                      {pct(summary.funnel.endedUv, summary.funnel.firstMsgUv)})
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-xl p-5">
                <h2 className="font-semibold mb-4">UGC 审核状态</h2>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span>待审核</span>
                    <span>{summary.totals.ugcPending}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>已通过</span>
                    <span>{summary.totals.ugcApproved}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>已驳回</span>
                    <span>{summary.totals.ugcRejected}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-5">
              <h2 className="font-semibold mb-4">每日会话趋势（最近{days}天）</h2>
              <div className="space-y-2">
                {summary.dailySessions.map((d) => (
                  <div key={d.day} className="grid grid-cols-[76px_1fr_56px_56px] gap-3 items-center text-xs">
                    <span className="text-muted-foreground">{d.day.slice(5)}</span>
                    <div className="h-3 bg-muted rounded overflow-hidden">
                      <div
                        className="h-full bg-primary/70"
                        style={{ width: `${(d.sessions / maxSessions) * 100}%` }}
                      />
                    </div>
                    <span className="text-right">{d.sessions}</span>
                    <span className="text-right text-green-600">{d.endedSessions}</span>
                  </div>
                ))}
                {summary.dailySessions.length === 0 && (
                  <div className="text-sm text-muted-foreground">暂无数据</div>
                )}
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-5">
              <h2 className="font-semibold mb-4">场景点击 Top10</h2>
              <div className="space-y-2 text-sm">
                {summary.topScenarios.map((s, idx) => (
                  <div key={s.scenarioId} className="flex items-center justify-between">
                    <span>
                      {idx + 1}. {s.scenarioId}
                    </span>
                    <span className="text-muted-foreground">{s.clicks}</span>
                  </div>
                ))}
                {summary.topScenarios.length === 0 && (
                  <div className="text-sm text-muted-foreground">暂无点击数据</div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
