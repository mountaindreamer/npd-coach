import { appendEvent, upsertUser } from "@/lib/server-store";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const userId: string | undefined = body.userId;
    const event: string = body.event;
    if (!event) return new Response("event required", { status: 400 });

    if (userId) {
      await upsertUser({
        id: userId,
        consentDialogueCollection:
          typeof body.consentDialogueCollection === "boolean"
            ? body.consentDialogueCollection
            : undefined,
        channel: typeof body.channel === "string" ? body.channel : undefined,
      });
    }

    const saved = await appendEvent({
      userId,
      sessionId: typeof body.sessionId === "string" ? body.sessionId : undefined,
      event,
      props: typeof body.props === "object" && body.props ? body.props : undefined,
    });

    return Response.json({ ok: true, id: saved.id });
  } catch {
    return new Response("bad request", { status: 400 });
  }
}
