import { getOpsSummary } from "@/lib/server-store";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const daysRaw = Number(searchParams.get("days") ?? 30);
  const days = Number.isFinite(daysRaw) ? Math.min(90, Math.max(1, daysRaw)) : 30;
  const summary = await getOpsSummary(days);
  return Response.json(summary);
}
