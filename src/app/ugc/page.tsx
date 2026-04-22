"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  RelationshipType,
  RELATIONSHIP_LABELS,
  UGCScenario,
  UGC_STATUS_LABELS,
} from "@/lib/types";
import { getOrCreateUserId } from "@/lib/client-identity";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  approved: "bg-green-500/10 text-green-600 border-green-500/20",
  rejected: "bg-red-500/10 text-red-600 border-red-500/20",
};

export default function UGCPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"create" | "list">("list");
  const [scenarios, setScenarios] = useState<UGCScenario[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [relType, setRelType] = useState<RelationshipType>("intimate");
  const [submitted, setSubmitted] = useState(false);
  const [adminMode, setAdminMode] = useState(false);
  const [reviewKey, setReviewKey] = useState("");

  const userId = useMemo(() => getOrCreateUserId(), []);

  const isValid = title.trim().length >= 2 && content.trim().length >= 10;

  const load = async () => {
    const res = await fetch("/api/ugc?status=all");
    const data = await res.json();
    setScenarios(data.items ?? []);
  };

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async () => {
    if (!isValid) return;
    await fetch("/api/ugc", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        title: title.trim(),
        content: content.trim(),
        relationshipType: relType,
      }),
    });
    setTitle("");
    setContent("");
    setSubmitted(true);
    await load();
    setTimeout(() => {
      setSubmitted(false);
      setTab("list");
    }, 1200);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定删除这个场景吗？")) return;
    await fetch(`/api/ugc/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    await load();
  };

  const handlePlay = async (ugc: UGCScenario) => {
    await fetch(`/api/ugc/${ugc.id}`, { method: "POST" });
    const custom = {
      name: ugc.title,
      description: ugc.content,
      relType: ugc.relationshipType,
      traits: "",
      opening: "",
    };
    const encoded = encodeURIComponent(JSON.stringify(custom));
    router.push(`/chat?mode=simulation&custom=${encoded}&difficulty=beginner`);
  };

  const review = async (id: string, status: "approved" | "rejected") => {
    const res = await fetch(`/api/ugc/${id}/review`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(reviewKey ? { "x-review-key": reviewKey } : {}),
      },
      body: JSON.stringify({
        status,
        reviewer: "ops",
      }),
    });
    if (!res.ok) {
      alert("审核失败：请检查管理员 key");
      return;
    }
    await load();
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString("zh-CN", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <span>←</span> 返回首页
        </button>

        <h1 className="text-2xl font-bold mb-2">用户共创场景</h1>
        <p className="text-muted-foreground mb-6">
          真实经历可提交到服务端，默认进入待审核。通过后可在运营侧统一管理。
        </p>

        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setTab("list")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === "list"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-border"
            }`}
          >
            场景列表 ({scenarios.length})
          </button>
          <button
            onClick={() => setTab("create")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === "create"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-border"
            }`}
          >
            + 创建场景
          </button>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 mb-6">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={adminMode}
              onChange={(e) => setAdminMode(e.target.checked)}
            />
            启用审核模式（运营）
          </label>
          {adminMode && (
            <input
              type="password"
              value={reviewKey}
              onChange={(e) => setReviewKey(e.target.value)}
              placeholder="输入 REVIEW_ADMIN_KEY（生产环境必填）"
              className="mt-3 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          )}
        </div>

        {tab === "create" && (
          <div className="space-y-4 bg-card border border-border rounded-xl p-5">
            {submitted && (
              <div className="text-sm rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-green-700">
                提交成功，已进入待审核。
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-1.5">场景标题</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">关系类型</label>
              <div className="flex gap-2">
                {(Object.entries(RELATIONSHIP_LABELS) as [RelationshipType, string][]).map(
                  ([key, label]) => (
                    <button
                      key={key}
                      onClick={() => setRelType(key)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        relType === key
                          ? "bg-sim-accent text-white shadow-md"
                          : "bg-muted text-muted-foreground hover:bg-border"
                      }`}
                    >
                      {label}
                    </button>
                  )
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">场景内容</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={6}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm"
              />
            </div>
            <button
              onClick={handleSubmit}
              disabled={!isValid}
              className="w-full py-3 rounded-xl bg-sim-accent text-white font-medium transition-all hover:opacity-90 disabled:opacity-40"
            >
              提交审核
            </button>
          </div>
        )}

        {tab === "list" && (
          <div className="space-y-3">
            {scenarios.map((ugc) => (
              <div key={ugc.id} className="bg-card border border-border rounded-xl p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold truncate">{ugc.title}</h3>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_COLORS[ugc.status]}`}
                      >
                        {UGC_STATUS_LABELS[ugc.status]}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{ugc.content}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="px-2 py-0.5 bg-muted rounded-full">
                        {RELATIONSHIP_LABELS[ugc.relationshipType]}
                      </span>
                      <span>{formatDate(ugc.createdAt)}</span>
                      {ugc.plays > 0 && <span>{ugc.plays} 次训练</span>}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                  <button
                    onClick={() => handlePlay(ugc)}
                    className="flex-1 py-2 rounded-lg bg-sim-accent text-white text-sm font-medium hover:opacity-90 transition-opacity"
                  >
                    用此场景训练
                  </button>
                  <button
                    onClick={() => handleDelete(ugc.id)}
                    className="px-4 py-2 rounded-lg bg-muted text-muted-foreground text-sm hover:bg-danger hover:text-white transition-all"
                  >
                    删除
                  </button>
                  {adminMode && (
                    <>
                      <button
                        onClick={() => review(ugc.id, "approved")}
                        className="px-3 py-2 rounded-lg bg-green-500/15 text-green-700 text-sm"
                      >
                        通过
                      </button>
                      <button
                        onClick={() => review(ugc.id, "rejected")}
                        className="px-3 py-2 rounded-lg bg-red-500/15 text-red-700 text-sm"
                      >
                        驳回
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
            {scenarios.length === 0 && (
              <div className="text-sm text-muted-foreground text-center py-10">暂无场景</div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
