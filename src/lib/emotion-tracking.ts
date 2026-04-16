export interface EmotionEntry {
  id: string;
  date: string;
  before: EmotionLevel;
  after: EmotionLevel;
  sessionId: string;
  notes?: string;
}

export type EmotionLevel = 1 | 2 | 3 | 4 | 5;

export const EMOTION_LABELS: Record<EmotionLevel, string> = {
  1: "非常低落",
  2: "有些低落",
  3: "平静",
  4: "还不错",
  5: "很好",
};

export const EMOTION_EMOJIS: Record<EmotionLevel, string> = {
  1: "😞",
  2: "😔",
  3: "😐",
  4: "🙂",
  5: "😊",
};

const STORAGE_KEY = "npd-coach-emotions";

export function saveEmotionEntry(entry: EmotionEntry): void {
  if (typeof window === "undefined") return;
  const entries = getEmotionEntries();
  entries.unshift(entry);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function getEmotionEntries(): EmotionEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
