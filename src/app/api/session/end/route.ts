import { appendMessages, endSession } from "@/lib/server-store";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const sessionId: string = body.sessionId;
    const userId: string = body.userId;
    if (!sessionId || !userId) {
      return new Response("sessionId and userId required", { status: 400 });
    }

    if (Array.isArray(body.messages) && body.messages.length > 0 && body.consentDialogueCollection) {
      const messages = body.messages
        .filter((m: { role: string; content: string }) => m?.role && m?.content)
        .map((m: { role: string; content: string }) => ({
          role: m.role === "assistant" ? "assistant" : "user",
          content: String(m.content),
        }));
      await appendMessages(sessionId, userId, messages);
    }

    await endSession({
      sessionId,
      durationSec: Number(body.durationSec) || 0,
      messageCount: Number(body.messageCount) || 0,
      feedbackSummary:
        body.feedbackSummary && typeof body.feedbackSummary === "object"
          ? body.feedbackSummary
          : undefined,
    });

    return Response.json({ ok: true });
  } catch {
    return new Response("bad request", { status: 400 });
  }
}
