"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  RelationshipType,
  RELATIONSHIP_LABELS,
  UGCScenario,
  UGC_STATUS_LABELS,
} from "@/lib/types";
import {
  getUGCScenarios,
  saveUGCScenario,
  deleteUGCScenario,
  generateUGCId,
  ugcToCustomScenario,
} from "@/lib/ugc-storage";

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

  useEffect(() => {
    setScenarios(getUGCScenarios());
  }, []);

  const isValid = title.trim().length >= 2 && content.trim().length >= 10;

  const handleSubmit = () => {
    if (!isValid) return;
    const newScenario: UGCScenario = {
      id: generateUGCId(),
      title: title.trim(),
      content: content.trim(),
      relationshipType: relType,
      createdAt: new Date().toISOString(),
      plays: 0,
      status: "pending",
    };
    saveUGCScenario(newScenario);
    setScenarios(getUGCScenarios());
    setTitle("");
    setContent("");
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setTab("list");
    }, 2000);
  };

  const handleDelete = (id: string) => {
    if (!confirm("确定删除这个场景吗？")) return;
    deleteUGCScenario(id);
    setScenarios(getUGCScenarios());
  };

  const handlePlay = (ugc: UGCScenario) => {
    const custom = ugcToCustomScenario(ugc);
    custom.opening = "";
    const encoded = encodeURIComponent(JSON.stringify(custom));
    router.push(`/chat?mode=simulation&custom=${encoded}&difficulty=beginner`);
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

        <h1 className="text-2xl font-bold mb-2">用户创作</h1>
        <p className="text-muted-foreground mb-6">
          把你的真实经历变成训练题目。提交后需经审核通过，才会在平台公开展示。
        </p>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setTab("list")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === "list"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-border"
            }`}
          >
            我的场景 ({scenarios.length})
          </button>
          <button
            onClick={() => setTab("create")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === "create"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-border"
            }`}
          >
            + 创建新场景
          </button>
        </div>

        {tab === "create" && (
          <div className="space-y-5 animate-fade-in">
            {submitted ? (
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6 text-center">
                <div className="text-3xl mb-3">✅</div>
                <h3 className="font-semibold text-green-600 mb-2">提交成功！</h3>
                <p className="text-sm text-muted-foreground">
                  你的场景已提交审核，审核通过后将展示在平台上。在审核期间你仍可自己训练。
                </p>
              </div>
            ) : (
              <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="font-semibold mb-4">写下你的真实经历</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">
                      给场景起个名字
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder='例如："每次出门都要检查我手机"'
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1.5">
                      关系类型
                    </label>
                    <div className="flex gap-2">
                      {(
                        Object.entries(RELATIONSHIP_LABELS) as [
                          RelationshipType,
                          string,
                        ][]
                      ).map(([key, label]) => (
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
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1.5">
                      描述你遇到的情况
                    </label>
                    <p className="text-xs text-muted-foreground mb-2">
                      越具体越好——当时是什么场景、ta说了什么、做了什么。AI
                      会根据你的描述还原这个角色。
                    </p>
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder={`例如：辛苦做了一年的项目终于上线了，结果小组长拿着我的成果去给领导汇报，PPT上全写的他的名字。现在他微信找我要原始数据和方案文档，语气还特别理所当然，说"这是团队的成果"...`}
                      rows={6}
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground resize-none"
                    />
                    <p className="text-xs text-muted-foreground mt-1 text-right">
                      {content.length} 字{content.length < 10 && content.length > 0 && " (至少10字)"}
                    </p>
                  </div>

                  <button
                    onClick={handleSubmit}
                    disabled={!isValid}
                    className="w-full py-3 rounded-xl bg-sim-accent text-white font-medium transition-all hover:opacity-90 disabled:opacity-40"
                  >
                    提交审核
                  </button>

                  <div className="bg-muted rounded-lg p-3 text-xs text-muted-foreground space-y-1">
                    <p>提交须知：</p>
                    <p>· 内容需经审核后才会在平台公开展示</p>
                    <p>· 审核期间你仍可用自己的场景进行训练</p>
                    <p>· 请勿包含真实姓名、电话等个人隐私信息</p>
                    <p>· 涉及暴力、违法内容将不予通过</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "list" && (
          <div className="animate-fade-in">
            {scenarios.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-4xl mb-4">✏️</p>
                <p className="text-muted-foreground mb-4">
                  还没有创建过场景。把你的真实经历写下来，变成训练题目吧！
                </p>
                <button
                  onClick={() => setTab("create")}
                  className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
                >
                  创建第一个场景
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {scenarios.map((ugc) => (
                  <div
                    key={ugc.id}
                    className="bg-card border border-border rounded-xl p-5 transition-all"
                  >
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
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {ugc.content}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span className="px-2 py-0.5 bg-muted rounded-full">
                            {RELATIONSHIP_LABELS[ugc.relationshipType]}
                          </span>
                          <span>{formatDate(ugc.createdAt)}</span>
                          {ugc.plays > 0 && (
                            <span>{ugc.plays} 次训练</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {ugc.status === "pending" && (
                      <div className="mt-3 bg-yellow-500/5 border border-yellow-500/10 rounded-lg p-2.5 text-xs text-yellow-600">
                        内容正在审核中，审核通过后将在平台公开展示。你可以先自行训练。
                      </div>
                    )}

                    {ugc.status === "rejected" && (
                      <div className="mt-3 bg-red-500/5 border border-red-500/10 rounded-lg p-2.5 text-xs text-red-600">
                        内容未通过审核，可能包含敏感信息。你可以修改后重新提交。
                      </div>
                    )}

                    <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                      <button
                        onClick={() => handlePlay(ugc)}
                        className="flex-1 py-2 rounded-lg bg-sim-accent text-white text-sm font-medium hover:opacity-90 transition-opacity"
                      >
                        自己训练
                      </button>
                      <button
                        onClick={() => handleDelete(ugc.id)}
                        className="px-4 py-2 rounded-lg bg-muted text-muted-foreground text-sm hover:bg-danger hover:text-white transition-all"
                      >
                        删除
                      </button>
                    </div>
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
