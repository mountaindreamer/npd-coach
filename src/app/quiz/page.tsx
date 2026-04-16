"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Question {
  id: number;
  text: string;
  category: "grandiosity" | "empathy" | "exploitation" | "entitlement" | "envy";
}

const QUESTIONS: Question[] = [
  { id: 1, text: "ta 经常夸大自己的成就和才能", category: "grandiosity" },
  { id: 2, text: "ta 认为自己很特别，只有同样特别的人才能理解 ta", category: "grandiosity" },
  { id: 3, text: "ta 经常幻想无限的成功、权力或完美的爱情", category: "grandiosity" },
  { id: 4, text: "ta 需要过度的赞美和关注", category: "grandiosity" },
  { id: 5, text: "ta 有一种特权感，觉得自己应该被特殊对待", category: "entitlement" },
  { id: 6, text: "ta 会利用别人来达到自己的目的", category: "exploitation" },
  { id: 7, text: "ta 缺乏对他人感受的理解和共情", category: "empathy" },
  { id: 8, text: "ta 经常嫉妒别人，或者认为别人嫉妒 ta", category: "envy" },
  { id: 9, text: "ta 表现出傲慢和自大的行为或态度", category: "grandiosity" },
  { id: 10, text: "当你表达自己的感受时，ta 会说你太敏感了", category: "empathy" },
  { id: 11, text: "ta 经常否认说过的话或做过的事", category: "exploitation" },
  { id: 12, text: "ta 在公开场合表现得很好，但私下完全不同", category: "exploitation" },
  { id: 13, text: "ta 会用冷暴力来惩罚你", category: "exploitation" },
  { id: 14, text: "ta 贬低你的成就、外貌或能力", category: "empathy" },
  { id: 15, text: "ta 经常把自己的错误归咎于你或别人", category: "entitlement" },
  { id: 16, text: "ta 在你设定边界时会发怒或惩罚你", category: "entitlement" },
  { id: 17, text: "ta 会用'你看我为你做了多少'来控制你", category: "exploitation" },
  { id: 18, text: "ta 不允许你有自己的朋友圈或个人空间", category: "entitlement" },
  { id: 19, text: "ta 经常提起其他人有多好来对比你", category: "envy" },
  { id: 20, text: "和 ta 在一起后你的自信心明显下降了", category: "empathy" },
];

const SCORE_OPTIONS = [
  { value: 0, label: "完全不符合" },
  { value: 1, label: "偶尔如此" },
  { value: 2, label: "有时如此" },
  { value: 3, label: "经常如此" },
  { value: 4, label: "非常符合" },
];

const CATEGORY_LABELS: Record<string, string> = {
  grandiosity: "自大夸张",
  empathy: "共情缺失",
  exploitation: "利用操控",
  entitlement: "特权意识",
  envy: "嫉妒比较",
};

function getResultLevel(score: number): { level: string; color: string; description: string; advice: string } {
  const percent = (score / (QUESTIONS.length * 4)) * 100;
  if (percent < 25) {
    return {
      level: "低风险",
      color: "text-green-500",
      description: "根据你的描述，对方展现的 NPD 特征较少。但如果你仍然感到不舒服，你的感受是有效的。",
      advice: "建议：关注自己的感受，学习健康关系的边界设定技巧。如果某些行为让你不安，可以和教练聊聊。",
    };
  }
  if (percent < 50) {
    return {
      level: "中等风险",
      color: "text-yellow-500",
      description: "对方展现了一些 NPD 相关的行为模式。这些行为可能会在关系中造成压力和不安。",
      advice: "建议：学习识别操控模式，练习灰岩法和边界设定。可以通过模拟训练来提升应对能力。",
    };
  }
  if (percent < 75) {
    return {
      level: "较高风险",
      color: "text-orange-500",
      description: "对方展现了较多的 NPD 行为特征。这些行为模式可能正在显著影响你的心理健康和自我认知。",
      advice: "建议：建立安全边界是优先事项。考虑寻求专业心理咨询师的帮助。使用模拟训练来练习应对策略。",
    };
  }
  return {
    level: "高风险",
    color: "text-red-500",
    description: "对方展现了大量典型的 NPD 行为特征。你可能正在经历严重的情感操控。这不是你的错。",
    advice: "强烈建议：尽快寻求专业心理咨询师的帮助。建立安全网络，确保自己有支持系统。心理危机热线：400-161-9995",
  };
}

export default function QuizPage() {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showResult, setShowResult] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);

  const questionsPerPage = 5;
  const totalPages = Math.ceil(QUESTIONS.length / questionsPerPage);
  const pageQuestions = QUESTIONS.slice(
    currentPage * questionsPerPage,
    (currentPage + 1) * questionsPerPage
  );

  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === QUESTIONS.length;
  const totalScore = Object.values(answers).reduce((sum, v) => sum + v, 0);

  const handleAnswer = (questionId: number, value: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = () => {
    if (allAnswered) setShowResult(true);
  };

  const categoryScores = () => {
    const scores: Record<string, { total: number; count: number }> = {};
    for (const q of QUESTIONS) {
      if (!scores[q.category]) scores[q.category] = { total: 0, count: 0 };
      scores[q.category].total += answers[q.id] ?? 0;
      scores[q.category].count += 1;
    }
    return Object.entries(scores).map(([key, val]) => ({
      category: key,
      label: CATEGORY_LABELS[key],
      avg: val.total / val.count,
      max: val.count * 4,
      total: val.total,
    }));
  };

  if (showResult) {
    const result = getResultLevel(totalScore);
    const cats = categoryScores();

    return (
      <main className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold mb-6">测评结果</h1>

          <div className="bg-card border border-border rounded-2xl p-6 mb-6">
            <div className="text-center mb-6">
              <div className={`text-4xl font-bold ${result.color} mb-2`}>
                {result.level}
              </div>
              <div className="text-lg font-medium">
                总分：{totalScore} / {QUESTIONS.length * 4}
              </div>
            </div>

            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
              {result.description}
            </p>
            <div className="bg-muted rounded-xl p-4 text-sm">
              {result.advice}
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 mb-6">
            <h3 className="font-semibold mb-4">维度分析</h3>
            <div className="space-y-4">
              {cats.map((cat) => (
                <div key={cat.category}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{cat.label}</span>
                    <span className="text-muted-foreground">
                      {cat.total}/{cat.max}
                    </span>
                  </div>
                  <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        cat.avg > 2.5
                          ? "bg-red-500"
                          : cat.avg > 1.5
                            ? "bg-yellow-500"
                            : "bg-green-500"
                      }`}
                      style={{ width: `${(cat.total / cat.max) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-muted rounded-xl p-4 text-xs text-muted-foreground mb-6">
            <p className="font-medium mb-1">重要声明</p>
            <p>
              此问卷不是临床诊断工具。NPD（自恋型人格障碍）只能由持证心理健康专业人员进行诊断。本问卷仅帮助你初步了解对方行为模式中是否存在潜在的NPD特征。如果你正在经历困扰，请寻求专业帮助。
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                setAnswers({});
                setShowResult(false);
                setCurrentPage(0);
              }}
              className="flex-1 py-3 rounded-xl bg-muted text-foreground font-medium hover:bg-border transition-colors"
            >
              重新测评
            </button>
            <button
              onClick={() => router.push("/")}
              className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
            >
              去训练
            </button>
          </div>
        </div>
      </main>
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

        <h1 className="text-2xl font-bold mb-2">ta 是 NPD 吗？</h1>
        <p className="text-muted-foreground mb-6">
          回想和 ta 相处的经历，选择最符合 ta
          的行为表现的选项。这不是诊断，而是帮你识别潜在的操控模式。
        </p>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>已完成 {answeredCount}/{QUESTIONS.length}</span>
            <span>
              第 {currentPage + 1}/{totalPages} 页
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{
                width: `${(answeredCount / QUESTIONS.length) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-4 mb-6">
          {pageQuestions.map((q, idx) => (
            <div
              key={q.id}
              className="bg-card border border-border rounded-xl p-5 animate-fade-in"
            >
              <p className="text-sm font-medium mb-3">
                <span className="text-muted-foreground mr-2">
                  {currentPage * questionsPerPage + idx + 1}.
                </span>
                {q.text}
              </p>
              <div className="flex flex-wrap gap-2">
                {SCORE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleAnswer(q.id, opt.value)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      answers[q.id] === opt.value
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "bg-muted text-muted-foreground hover:bg-border"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex gap-3">
          {currentPage > 0 && (
            <button
              onClick={() => setCurrentPage((p) => p - 1)}
              className="flex-1 py-3 rounded-xl bg-muted text-foreground font-medium hover:bg-border transition-colors"
            >
              上一页
            </button>
          )}
          {currentPage < totalPages - 1 ? (
            <button
              onClick={() => setCurrentPage((p) => p + 1)}
              className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
            >
              下一页
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!allAnswered}
              className="flex-1 py-3 rounded-xl bg-sim-accent text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-40"
            >
              {allAnswered
                ? "查看结果"
                : `还有 ${QUESTIONS.length - answeredCount} 题未答`}
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
