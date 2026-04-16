import { UGCScenario, RelationshipType, UGCStatus } from "./types";

const UGC_KEY = "npd-coach-ugc";

export function getUGCScenarios(): UGCScenario[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(UGC_KEY);
    if (!raw) return [];
    const list: UGCScenario[] = JSON.parse(raw);
    return list.map((s) => ({ ...s, status: s.status ?? "pending" }));
  } catch {
    return [];
  }
}

export function getApprovedUGC(): UGCScenario[] {
  return getUGCScenarios().filter((s) => s.status === "approved");
}

export function saveUGCScenario(scenario: UGCScenario): void {
  const list = getUGCScenarios();
  list.unshift(scenario);
  localStorage.setItem(UGC_KEY, JSON.stringify(list));
}

export function deleteUGCScenario(id: string): void {
  const list = getUGCScenarios().filter((s) => s.id !== id);
  localStorage.setItem(UGC_KEY, JSON.stringify(list));
}

export function updateUGCStatus(id: string, status: UGCStatus): void {
  const list = getUGCScenarios();
  const item = list.find((s) => s.id === id);
  if (item) {
    item.status = status;
    localStorage.setItem(UGC_KEY, JSON.stringify(list));
  }
}

export function incrementUGCPlays(id: string): void {
  const list = getUGCScenarios();
  const item = list.find((s) => s.id === id);
  if (item) {
    item.plays += 1;
    localStorage.setItem(UGC_KEY, JSON.stringify(list));
  }
}

export function generateUGCId(): string {
  return "ugc-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export function ugcToCustomScenario(ugc: UGCScenario) {
  return {
    name: ugc.title,
    description: ugc.content,
    relType: ugc.relationshipType as string,
    traits: "",
    opening: "",
  };
}
