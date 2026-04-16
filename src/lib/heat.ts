const PLAYS_KEY = "npd-coach-plays";

function getStoredPlays(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(PLAYS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function recordPlay(scenarioId: string): void {
  if (typeof window === "undefined") return;
  const stored = getStoredPlays();
  stored[scenarioId] = (stored[scenarioId] ?? 0) + 1;
  localStorage.setItem(PLAYS_KEY, JSON.stringify(stored));
}

export function getPlayCounts(): Record<string, number> {
  return getStoredPlays();
}

export function getPlayCount(scenarioId: string): number {
  return getStoredPlays()[scenarioId] ?? 0;
}

export function formatPlays(n: number): string {
  if (n === 0) return "暂无训练";
  if (n >= 10000) return (n / 10000).toFixed(1) + "w 人已训练";
  if (n >= 1000) return (n / 1000).toFixed(1) + "k 人已训练";
  return n + " 人已训练";
}
