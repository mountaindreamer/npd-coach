import { CoachModule } from "./types";

export const COACH_MODULES: CoachModule[] = [
  {
    id: "identify-patterns",
    title: "识别NPD行为模式",
    description: "学会辨认常见的自恋型操控策略",
    icon: "🔍",
    topics: [
      "什么是NPD（自恋型人格障碍）",
      "煤气灯效应：如何识别",
      "爱轰炸与贬低的循环",
      "三角化操控",
      "沉默处罚与冷暴力",
      "飞猴（Flying Monkeys）",
    ],
  },
  {
    id: "coping-strategies",
    title: "应对策略工具箱",
    description: "掌握实用的应对NPD操控的方法",
    icon: "🛡️",
    topics: [
      "灰岩法（Gray Rock Method）",
      "JADE原则：不辩解不争论",
      "设定边界的话术模板",
      "低接触与无接触策略",
      "记录法：保存证据保护自己",
    ],
  },
  {
    id: "emotional-management",
    title: "情绪管理",
    description: "学习管理被触发时的情绪反应",
    icon: "🌊",
    topics: [
      "识别情绪触发点",
      "5-4-3-2-1 感官着陆法",
      "认知重构：改变思维陷阱",
      "自我安抚技巧",
      "创伤反应的理解与接纳",
    ],
  },
  {
    id: "boundary-setting",
    title: "边界设定练习",
    description: "练习如何坚定而温和地表达自己的底线",
    icon: "🚧",
    topics: [
      "什么是健康的边界",
      "边界设定的具体话术",
      "当边界被试探时怎么办",
      "内疚感管理：设立边界不等于不孝/不爱",
      "渐进式边界建立",
    ],
  },
  {
    id: "self-worth",
    title: "自我价值重建",
    description: "修复被NPD关系损伤的自我认知",
    icon: "🌱",
    topics: [
      "识别内化的负面信念",
      "建立自我肯定练习",
      "区分 '我是谁' 和 '他们说我是谁'",
      "重建信任：对自己和他人",
      "创伤后成长",
    ],
  },
];

export function getModuleById(id: string): CoachModule | undefined {
  return COACH_MODULES.find((m) => m.id === id);
}

export function buildModulePrompt(module: CoachModule, topic: string): string {
  return `用户选择了学习模块"${module.title}"中的话题"${topic}"。请以温暖、专业的方式讲解这个话题。

要求：
1. 先简要解释概念
2. 提供 1-2 个具体的现实案例
3. 给出可操作的建议
4. 以一个引导性问题结尾，鼓励用户思考自己的经历

保持回复在 300 字以内，避免信息过载。`;
}
