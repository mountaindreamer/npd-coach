import { createUGC, listUGC } from "@/lib/server-store";
import { RelationshipType, UGCStatus } from "@/lib/types";

function normalizeStatus(v: string | null): UGCStatus | "all" {
  if (v === "approved" || v === "rejected" || v === "pending") return v;
  return "all";
}

function normalizeRel(v: string | null): RelationshipType | undefined {
  if (v === "intimate" || v === "parent-child" || v === "workplace") return v;
  return undefined;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const status = normalizeStatus(searchParams.get("status"));
  const relationshipType = normalizeRel(searchParams.get("relType"));
  const data = await listUGC({ status, relationshipType });
  return Response.json({ items: data });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const userId: string = body.userId;
    const title = String(body.title ?? "").trim();
    const content = String(body.content ?? "").trim();
    const relationshipType = normalizeRel(body.relationshipType);
    if (!userId || !title || !content || !relationshipType) {
      return new Response("invalid payload", { status: 400 });
    }
    const created = await createUGC({
      userId,
      title,
      content,
      relationshipType,
    });
    return Response.json(created);
  } catch {
    return new Response("bad request", { status: 400 });
  }
}
