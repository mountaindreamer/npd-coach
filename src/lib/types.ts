export type ChatMode = "simulation" | "coach";

export type DifficultyLevel = "beginner" | "intermediate" | "advanced";

export type RelationshipType = "intimate" | "parent-child" | "workplace";
export type UGCStatus = "pending" | "approved" | "rejected";

export interface Scenario {
  id: string;
  title: string;
  description: string;
  scene: string;
  relationshipType: RelationshipType;
  npdPattern: string;
  difficulty: DifficultyLevel;
  icon: string;
  openingMessage: string;
  npdName: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export interface FeedbackResult {
  overallScore: number;
  boundaryScore: number;
  emotionalRegulation: number;
  strategyEffectiveness: number;
  strengths: string[];
  improvements: string[];
  suggestedResponses: string[];
}

export interface CoachModule {
  id: string;
  title: string;
  description: string;
  icon: string;
  topics: string[];
}

export interface TrainingRecord {
  id: string;
  date: string;
  scenarioId: string;
  scenarioTitle: string;
  mode: ChatMode;
  duration: number;
  feedback?: FeedbackResult;
  messageCount: number;
}

export interface UGCScenario {
  id: string;
  title: string;
  content: string;
  relationshipType: RelationshipType;
  createdAt: string;
  plays: number;
  status: UGCStatus;
}

export const RELATIONSHIP_LABELS: Record<RelationshipType, string> = {
  intimate: "情侣/伴侣",
  "parent-child": "家庭/父母",
  workplace: "职场/上级",
};

export const DIFFICULTY_LABELS: Record<DifficultyLevel, string> = {
  beginner: "初级",
  intermediate: "中级",
  advanced: "高级",
};

export const DIFFICULTY_DESCRIPTIONS: Record<DifficultyLevel, string> = {
  beginner: "明显的操控模式，容易识别",
  intermediate: "隐蔽的操控手法，需要细心分辨",
  advanced: "混合策略，高度伪装",
};

export const UGC_STATUS_LABELS: Record<UGCStatus, string> = {
  pending: "审核中",
  approved: "已通过",
  rejected: "未通过",
};
