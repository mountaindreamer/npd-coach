"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RelationshipType, DifficultyLevel, RELATIONSHIP_LABELS, DIFFICULTY_LABELS } from "@/lib/types";

export default function CustomScenarioPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [relType, setRelType] = useState<RelationshipType>("intimate");
  const [difficulty, setDifficulty] = useState<DifficultyLevel>("beginner");
  const [traits, setTraits] = useState("");
  const [opening, setOpening] = useState("");

  const isValid = name.trim() && description.trim() && opening.trim();

  const handleStart = () => {
    if (!isValid) return;
    const customData = {
      name: name.trim(),
      description: description.trim(),
      relType,
      traits: traits.trim(),
      opening: opening.trim(),
    };
    const encoded = encodeURIComponent(JSON.stringify(customData));
    router.push(
      `/chat?mode=simulation&custom=${encoded}&difficulty=${difficulty}`
    );
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

        <h1 className="text-2xl font-bold mb-2">自定义训练场景</h1>
        <p className="text-muted-foreground mb-8">
          描述你遇到的真实情况，AI
          将根据你的描述生成一个定制化的模拟训练场景。
        </p>

        <div className="space-y-6">
          {/* Scene name */}
          <div>
            <label className="block text-sm font-medium mb-2">
              场景名称
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：伴侣的情感冷暴力"
              className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground"
            />
          </div>

          {/* Relationship type */}
          <div>
            <label className="block text-sm font-medium mb-2">
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

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2">
              情境描述
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="描述你经常遇到的具体情境。例如：每次我提出自己的需求时，对方就会冷嘲热讽，说我太敏感，然后沉默冷暴力好几天..."
              rows={4}
              className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground resize-none"
            />
          </div>

          {/* Traits */}
          <div>
            <label className="block text-sm font-medium mb-2">
              对方的特征（可选）
            </label>
            <textarea
              value={traits}
              onChange={(e) => setTraits(e.target.value)}
              placeholder="描述对方常用的操控手法或性格特点。例如：喜欢在别人面前表现得很好，私下里却经常贬低我；总是把问题归咎于我..."
              rows={3}
              className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground resize-none"
            />
          </div>

          {/* Opening message */}
          <div>
            <label className="block text-sm font-medium mb-2">
              对方的开场白
            </label>
            <textarea
              value={opening}
              onChange={(e) => setOpening(e.target.value)}
              placeholder="写一句对方可能会说的典型的话。例如：你又怎么了？我什么都没做，你就不能别这么玻璃心吗？"
              rows={2}
              className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground resize-none"
            />
          </div>

          {/* Difficulty */}
          <div>
            <label className="block text-sm font-medium mb-2">
              难度级别
            </label>
            <div className="flex gap-2">
              {(
                Object.entries(DIFFICULTY_LABELS) as [DifficultyLevel, string][]
              ).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setDifficulty(key)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    difficulty === key
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "bg-muted text-muted-foreground hover:bg-border"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleStart}
            disabled={!isValid}
            className="w-full py-3 rounded-xl bg-sim-accent text-white font-medium transition-all hover:opacity-90 disabled:opacity-40"
          >
            开始自定义训练
          </button>

          <p className="text-xs text-muted-foreground text-center">
            你的自定义场景数据不会上传到服务器，仅在本地使用。
          </p>
        </div>
      </div>
    </main>
  );
}
