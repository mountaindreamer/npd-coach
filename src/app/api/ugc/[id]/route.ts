import { deleteUGC, incrementUGCPlay } from "@/lib/server-store";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const userId: string = body.userId;
    if (!userId) return new Response("userId required", { status: 400 });
    const ok = await deleteUGC(id, userId);
    if (!ok) return new Response("not found", { status: 404 });
    return Response.json({ ok: true });
  } catch {
    return new Response("bad request", { status: 400 });
  }
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await incrementUGCPlay(id);
  return Response.json({ ok: true });
}
