import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { buildFeedbackPrompt, CustomScenario } from "@/lib/prompts";
import { getScenarioById } from "@/lib/scenarios";

export const maxDuration = 60;

export async function POST(req: Request) {
  const {
    scenarioId,
    scenarioTitle,
    customScenario,
    messages,
  }: {
    scenarioId: string;
    scenarioTitle?: string;
    customScenario?: CustomScenario;
    messages: { role: string; content: string }[];
  } = await req.json();

  let feedbackScenario: { title: string; npdPattern: string };

  if (customScenario) {
    feedbackScenario = {
      title: customScenario.name,
      npdPattern: customScenario.description,
    };
  } else {
    const scenario = getScenarioById(scenarioId);
    if (!scenario) {
      feedbackScenario = {
        title: scenarioTitle || "自定义场景",
        npdPattern: "NPD操控行为",
      };
    } else {
      feedbackScenario = scenario;
    }
  }

  const modelName = process.env.GOOGLE_MODEL || "gemini-2.5-flash";

  const { text } = await generateText({
    model: google(modelName),
    prompt: buildFeedbackPrompt(feedbackScenario, messages),
  });

  try {
    const cleaned = text.replace(/```json\n?|\n?```/g, "").trim();
    const feedback = JSON.parse(cleaned);
    return Response.json(feedback);
  } catch {
    return Response.json({
      overallScore: 5,
      boundaryScore: 5,
      emotionalRegulation: 5,
      strategyEffectiveness: 5,
      strengths: ["你尝试了应对操控行为"],
      improvements: ["可以尝试使用更坚定的边界设定话术"],
      suggestedResponses: ["我理解你的感受，但我需要你尊重我的决定。"],
    });
  }
}
