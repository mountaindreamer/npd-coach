export async function trackEvent(input: {
  event: string;
  userId?: string;
  sessionId?: string;
  props?: Record<string, unknown>;
}): Promise<void> {
  try {
    await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  } catch {
    // no-op for MVP
  }
}
