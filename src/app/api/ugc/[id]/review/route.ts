import { reviewUGC } from "@/lib/server-store";
import { UGCStatus } from "@/lib/types";

function isAllowedReview(req: Request): boolean {
  const key = req.headers.get("x-review-key");
  const expected = process.env.REVIEW_ADMIN_KEY;
  if (expected) return key === expected;
  return process.env.NODE_ENV !== "production";
}

function normalizeStatus(v: string): UGCStatus | null {
  if (v === "pending" || v === "approved" || v === "rejected") return v;
  return null;
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAllowedReview(req)) return new Response("forbidden", { status: 403 });
  try {
    const { id } = await params;
    const body = await req.json();
    const status = normalizeStatus(String(body.status ?? ""));
    if (!status) return new Response("invalid status", { status: 400 });
    const reviewed = await reviewUGC({
      id,
      status,
      note: typeof body.note === "string" ? body.note : undefined,
      reviewedBy: typeof body.reviewer === "string" ? body.reviewer : "admin",
    });
    if (!reviewed) return new Response("not found", { status: 404 });
    return Response.json(reviewed);
  } catch {
    return new Response("bad request", { status: 400 });
  }
}
