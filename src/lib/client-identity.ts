const USER_ID_KEY = "npd-coach-user-id";
const CONSENT_KEY = "npd-coach-consent-dialogue";

function makeId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function getOrCreateUserId(): string {
  if (typeof window === "undefined") return "server-anon";
  const existing = localStorage.getItem(USER_ID_KEY);
  if (existing) return existing;
  const id = makeId("user");
  localStorage.setItem(USER_ID_KEY, id);
  return id;
}

export function getDialogueConsent(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(CONSENT_KEY) === "1";
}

export function setDialogueConsent(consent: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(CONSENT_KEY, consent ? "1" : "0");
}
