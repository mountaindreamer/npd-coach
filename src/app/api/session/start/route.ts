import { createSession, upsertUser } from "@/lib/server-store";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const userId: string = body.userId;
    if (!userId) return new Response("userId required", { status: 400 });

    await upsertUser({
      id: userId,
      consentDialogueCollection: !!body.consentDialogueCollection,
      channel: typeof body.channel === "string" ? body.channel : undefined,
    });

    const session = await createSession({
      userId,
      mode: body.mode === "coach" ? "coach" : "simulation",
      scenarioId: typeof body.scenarioId === "string" ? body.scenarioId : undefined,
      difficulty: typeof body.difficulty === "string" ? body.difficulty : undefined,
    });

    return Response.json({ sessionId: session.id });
  } catch {
    return new Response("bad request", { status: 400 });
  }
}
