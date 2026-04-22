import { google } from "@ai-sdk/google";
import { streamText, UIMessage, convertToModelMessages } from "ai";
import {
  buildSimulationPrompt,
  buildCoachPrompt,
  buildCustomSimulationPrompt,
  CustomScenario,
} from "@/lib/prompts";
import { buildModulePrompt } from "@/lib/coach-modules";
import { getScenarioById } from "@/lib/scenarios";
import { COACH_MODULES } from "@/lib/coach-modules";
import { ChatMode, DifficultyLevel } from "@/lib/types";
import { retrieveRelevantChunks } from "@/lib/rag/retriever";

export const maxDuration = 60;

function getTextFromMessages(messages: UIMessage[]): string {
  return messages
    .slice(-4)
    .map((m) =>
      m.parts
        .filter((p) => p.type === "text")
        .map((p) => p.text)
        .join("")
    )
    .join("\n");
}

function inferIntentTags(text: string): string[] {
  const t = text.toLowerCase();
  const map: Array<{ tag: string; keywords: string[] }> = [
    { tag: "gaslighting", keywords: ["记错", "没说过", "你太敏感", "脑补", "煤气灯"] },
    { tag: "lovebomb", keywords: ["突然很好", "忽冷忽热", "情话", "挽回", "爱轰炸"] },
    { tag: "triangulation", keywords: ["前任", "别人家", "同事", "比较", "三角"] },
    { tag: "silent-treatment", keywords: ["不回", "冷暴力", "已读不回", "沉默"] },
    { tag: "workplace", keywords: ["领导", "老板", "加班", "kpi", "开会", "汇报"] },
    { tag: "parent-child", keywords: ["爸", "妈", "父母", "不孝", "别人家孩子"] },
    { tag: "differentiation", keywords: ["是不是npd", "区分", "普通矛盾", "正常吵架"] },
  ];
  return map
    .filter((it) => it.keywords.some((k) => t.includes(k)))
    .map((it) => it.tag);
}

function topKByDifficulty(difficulty: DifficultyLevel): number {
  if (difficulty === "advanced") return 5;
  if (difficulty === "intermediate") return 4;
  return 3;
}

function buildRetrievalQuery(params: {
  recentContext: string;
  relType: string;
  difficulty: DifficultyLevel;
  scenarioTitle?: string;
  npdPattern?: string;
}): string {
  const { recentContext, relType, difficulty, scenarioTitle, npdPattern } = params;
  return [
    `关系类型:${relType}`,
    `难度:${difficulty}`,
    scenarioTitle ? `场景:${scenarioTitle}` : "",
    npdPattern ? `操控模式:${npdPattern}` : "",
    `最近对话:${recentContext}`,
  ]
    .filter(Boolean)
    .join("\n");
}

export async function POST(req: Request) {
  const body = await req.json();

  const mode: ChatMode = body.mode ?? "coach";
  const scenarioId: string = body.scenarioId ?? "";
  const difficulty: DifficultyLevel = body.difficulty ?? "beginner";
  const moduleId: string = body.moduleId ?? "";
  const topic: string = body.topic ?? "";
  const customScenario: CustomScenario | undefined = body.customScenario;
  const messages: UIMessage[] = body.messages ?? [];

  let systemPrompt: string;
  let relType = "intimate";
  let retrievalScenarioTitle = "";
  let retrievalPattern = "";

  if (mode === "simulation" && customScenario) {
    systemPrompt = buildCustomSimulationPrompt(customScenario, difficulty);
    relType = customScenario.relType;
    retrievalScenarioTitle = customScenario.name;
    retrievalPattern = customScenario.traits || customScenario.description;
  } else if (mode === "simulation" && scenarioId) {
    const scenario = getScenarioById(scenarioId);
    if (!scenario) {
      return new Response("Scenario not found", { status: 404 });
    }
    systemPrompt = buildSimulationPrompt(scenario, difficulty);
    relType = scenario.relationshipType;
    retrievalScenarioTitle = scenario.title;
    retrievalPattern = scenario.npdPattern;
  } else {
    systemPrompt = buildCoachPrompt();
    if (moduleId && topic) {
      const mod = COACH_MODULES.find((m) => m.id === moduleId);
      if (mod) {
        systemPrompt += "\n\n" + buildModulePrompt(mod, topic);
      }
    }
  }

  // RAG: retrieve relevant knowledge for simulation mode
  if (mode === "simulation" && messages.length > 0) {
    try {
      const recentContext = getTextFromMessages(messages);
      const retrievalQuery = buildRetrievalQuery({
        recentContext,
        relType,
        difficulty,
        scenarioTitle: retrievalScenarioTitle,
        npdPattern: retrievalPattern,
      });
      const intentTags = inferIntentTags(recentContext);
      const chunks = await retrieveRelevantChunks(retrievalQuery, {
        topK: topKByDifficulty(difficulty),
        tags: [relType, ...intentTags, "all"],
        priorityTags: ["differentiation", ...intentTags],
      });

      if (chunks.length > 0) {
        const ragContext = chunks.map((c) => c.content).join("\n\n---\n\n");
        systemPrompt += `\n\n## 参考素材（从中汲取灵感，不要照抄，用你自己的方式表达）\n\n${ragContext}`;
      }
    } catch (e) {
      console.warn("[RAG] Retrieval failed, proceeding without:", e);
    }
  }

  const modelName = process.env.GOOGLE_MODEL || "gemini-2.5-flash";
  const modelMessages = await convertToModelMessages(messages);

  const result = streamText({
    model: google(modelName),
    system: systemPrompt,
    messages: modelMessages,
  });

  return result.toUIMessageStreamResponse();
}
