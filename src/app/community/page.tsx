"use client";

import { useRouter } from "next/navigation";

export default function CommunityPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <span>←</span> 返回首页
        </button>

        <div className="bg-card border border-border rounded-2xl p-6">
          <h1 className="text-2xl font-bold mb-2">社群运营与共创</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            MVP 阶段先做高质量社群互动，不做 UGC 上线审核。你可以在群内收集真实匿名对话样本，
            每周更新评测集与回归集，持续优化训练效果。
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-3">本周运营清单</h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>1. 每日发布 1 条「场景拆解」+ 1 条「应对话术」</li>
            <li>2. 邀请用户提交匿名对话（需口头同意与隐私脱敏）</li>
            <li>3. 每周整理 20 条样本进入评测集</li>
            <li>4. 每次改 prompt 后跑固定回归集并记录结果</li>
          </ul>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-3">入群方式</h2>
          <p className="text-sm text-muted-foreground mb-3">
            在这里放你的社群二维码图片或邀请链接（建议用短链并区分渠道参数）。
          </p>
          <div className="rounded-xl bg-muted p-8 text-center text-sm text-muted-foreground">
            社群二维码占位区
          </div>
        </div>
      </div>
    </main>
  );
}
