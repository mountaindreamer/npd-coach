const CRISIS_KEYWORDS = [
  "自杀",
  "不想活",
  "活不下去",
  "自残",
  "割腕",
  "结束生命",
  "跳楼",
  "去死",
  "了结",
  "服药自杀",
  "想死",
  "不如死",
  "没有活着的意义",
];

const DANGER_KEYWORDS = [
  "打我",
  "揍我",
  "家暴",
  "被打",
  "殴打",
  "身体暴力",
  "威胁我的生命",
  "要杀",
];

export interface SafetyCheckResult {
  isCrisis: boolean;
  isDanger: boolean;
  triggered: boolean;
  message?: string;
}

export function checkMessageSafety(text: string): SafetyCheckResult {
  const normalizedText = text.toLowerCase();

  for (const keyword of CRISIS_KEYWORDS) {
    if (normalizedText.includes(keyword)) {
      return {
        isCrisis: true,
        isDanger: false,
        triggered: true,
        message: "crisis",
      };
    }
  }

  for (const keyword of DANGER_KEYWORDS) {
    if (normalizedText.includes(keyword)) {
      return {
        isCrisis: false,
        isDanger: true,
        triggered: true,
        message: "danger",
      };
    }
  }

  return { isCrisis: false, isDanger: false, triggered: false };
}

export const CRISIS_RESOURCES = {
  hotline: "400-161-9995",
  hotlineName: "全国24小时心理危机干预热线",
  hotline2: "010-82951332",
  hotlineName2: "北京心理危机研究与干预中心",
  hotline3: "12320-5",
  hotlineName3: "全国卫生热线心理援助",
  message:
    "如果你正在经历情绪危机，请立即拨打以下热线寻求专业帮助。你并不孤独，有人可以帮助你。",
};

export const DISCLAIMER =
  "本工具仅供心理自助训练使用，不能替代专业心理咨询或治疗。如果你正在经历严重的心理困扰，请寻求专业心理健康服务。";
