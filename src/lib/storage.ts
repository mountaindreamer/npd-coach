import { TrainingRecord } from "./types";

const STORAGE_KEYS = {
  records: "npd-coach-records",
  preferences: "npd-coach-prefs",
} as const;

export function saveTrainingRecord(record: TrainingRecord): void {
  if (typeof window === "undefined") return;
  const records = getTrainingRecords();
  records.unshift(record);
  localStorage.setItem(STORAGE_KEYS.records, JSON.stringify(records));
}

export function getTrainingRecords(): TrainingRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.records);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function clearTrainingRecords(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEYS.records);
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
