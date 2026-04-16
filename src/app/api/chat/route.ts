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

  if (mode === "simulation" && customScenario) {
    systemPrompt = buildCustomSimulationPrompt(customScenario, difficulty);
    relType = customScenario.relType;
  } else if (mode === "simulation" && scenarioId) {
    const scenario = getScenarioById(scenarioId);
    if (!scenario) {
      return new Response("Scenario not found", { status: 404 });
    }
    systemPrompt = buildSimulationPrompt(scenario, difficulty);
    relType = scenario.relationshipType;
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
      const chunks = await retrieveRelevantChunks(recentContext, {
        topK: 3,
        tags: [relType],
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
