import { Scenario } from "./types";

export const SCENARIOS: Scenario[] = [
  // ============ 情侣/伴侣 ============
  {
    id: "never-wrong",
    title: "永远没有错的人",
    description:
      "他迟到了一小时没道歉。你提出来他反而发火，说你太作。你明明是对的，但他说着说着你开始怀疑是不是自己太计较了。",
    scene:
      "周六晚上八点。你和阿明约好了七点在商场见面吃饭，你准时到了，一个人站在商场门口等了整整一小时。期间你发了三条消息他都没回。他到了之后不仅没道歉，还嫌你脸色不好看。你深吸一口气，决定把这件事说清楚。",
    relationshipType: "intimate",
    npdPattern: "拒绝认错 + 反向归因",
    difficulty: "beginner",
    npdName: "阿明",
    icon: "🙄",
    openingMessage:
      "迟到一个小时怎么了？我在外面跑了一天为了谁？你倒好，在家待着还嫌这嫌那。你就不能体谅一下我吗？每次都要搞成这样，累不累？",
  },
  {
    id: "you-are-fat",
    title: "你胖了 你丑了 你不行",
    description:
      "你穿了新买的裙子想给他看，他上来就说你胖了。你化了妆他说不好看。你升职了他说运气好。打压从不停。",
    scene:
      "你刚拿到上个月的工资，给自己买了一条心仪很久的碎花裙子，398块。你穿上它站在卧室的全身镜前，觉得挺好看的。阿明正好从客厅走过来，靠在门框上看了你一眼。",
    relationshipType: "intimate",
    npdPattern: "贬低打压 + 自信瓦解",
    difficulty: "beginner",
    npdName: "阿明",
    icon: "💀",
    openingMessage:
      "你又买衣服了？说实话，你最近是不是胖了？不是我说你啊，你看看你那个肚子。你以前那个身材多好，现在...算了不说了。你同事小张穿裙子就挺好看的，她是不是在健身？",
  },
  {
    id: "triangulation-jealousy",
    title: "他总提别的女生",
    description:
      "他嘴里永远有一个'别人家的女朋友'。女同事温柔体贴，前任善解人意，就你一身毛病。你反应了还怪你敏感。",
    scene:
      "工作日的晚上，你做好了饭等他回来。两个人坐下来吃饭，他突然放下筷子，拿起手机翻了一下，然后开始兴致勃勃地讲他今天在公司发生的事。",
    relationshipType: "intimate",
    npdPattern: "三角测量 + 贬低组合拳",
    difficulty: "intermediate",
    npdName: "阿明",
    icon: "🔺",
    openingMessage:
      "今天和部门的小刘一起吃的午饭，人家那个厨艺真是没话说，自带便当还给我带了一份。不像有些人在家等我回来热个外卖都嫌麻烦。你别那个表情啊，我就说个事而已，你至于吗？你这占有欲太重了。",
  },
  {
    id: "hot-cold-cycle",
    title: "他突然就不理你了",
    description:
      "昨天还叫你宝贝今天就已读不回。你问怎么了他说'没事'。你不问了他又说你不关心他。冷暴力让你觉得是自己做错了什么。",
    scene:
      "昨天晚上阿明还在微信上发了一大段情话给你，说想你、说以后要带你去旅行。今天你发了三条消息——早安、中午吃了什么、下班了要不要一起吃饭——他只回了一个字。你盯着屏幕看了很久，小心翼翼地打了一行字发过去。",
    relationshipType: "intimate",
    npdPattern: "冷暴力 + 情绪操控循环",
    difficulty: "intermediate",
    npdName: "阿明",
    icon: "🧊",
    openingMessage: "嗯。",
  },
  {
    id: "all-fancy",
    title: "所有人都好 就你不行",
    description:
      "在他嘴里所有人都有光环——同事能干、朋友有趣、前任体贴。就你什么都不是。你好像永远达不到他的标准。",
    scene:
      "周末下午，你们在家。你在沙发上看书，阿明刚放下手机，开始聊起他今天和大学同学聚会的事。他的语气很兴奋，但你渐渐发现他说的每一句话，都在拿别人和你做对比。",
    relationshipType: "intimate",
    npdPattern: "物化他人 + 持续贬低",
    difficulty: "advanced",
    npdName: "阿明",
    icon: "✨",
    openingMessage:
      "你知道我今天跟谁吃饭了吗？我大学同学叶子，人家现在年薪百万了。她老公也特别会过日子，会做饭会带娃还会修东西。你看看人家再看看你，你说你到底行不行啊？我都不好意思跟他们提你。",
  },

  // ============ 职场/上级 ============
  {
    id: "unreasonable-pressure",
    title: "周五6点发 周一要",
    description:
      "每次deadline都不合理，加班是常态。你做完了他说不行重做，你没做完他说你效率低。怎么都是你的错。",
    scene:
      "周五下午五点半，你正在收拾东西准备下班。这周你已经加了两天班了。微信上张总发来了一条消息，你点开一看，心凉了半截。",
    relationshipType: "workplace",
    npdPattern: "不合理施压 + 鸡蛋里挑骨头",
    difficulty: "beginner",
    npdName: "张总",
    icon: "💼",
    openingMessage:
      "这个方案周一早上开会要用，你今天加个班弄一下。对了上次那个PPT里面有个图表数据好像差了零点几个百分点，你做事能不能仔细点？年轻人不要老想着准时下班，多付出才有成长。",
  },
  {
    id: "goalpost-shift",
    title: "他永远在改需求",
    description:
      "你按他说的做完了，他说不是这样的。你问他到底要什么，他说'你自己想'。做什么都不对，因为标准一直在变。",
    scene:
      "你花了三天时间，按照张总的口头要求做了一版方案。反复对照了他说的每个要求点。今天终于发到了工作群里，信心满满地等他回复。五分钟后，张总在群里回了一句话。",
    relationshipType: "workplace",
    npdPattern: "前后矛盾 + 移动目标",
    difficulty: "intermediate",
    npdName: "张总",
    icon: "🔄",
    openingMessage:
      "不是，我要的不是这个效果。我上次说的是简洁大方，你这做的是什么？你的理解能力需要提升一下。算了我来改吧。",
  },
  {
    id: "obedience-test",
    title: "不管对错 先服从",
    description:
      "他明明说错了方向，你指出来他不但不改还让你执行。不是讨论对错，而是'你听不听我的'。",
    scene:
      "项目讨论会上，你发现张总提出的技术方案有一个明显的逻辑漏洞——他建议用的方法上个季度已经被证明行不通了。你礼貌地提了出来，其他同事也点了点头。散会后，张总把你单独叫到了他的办公室，关上了门。",
    relationshipType: "workplace",
    npdPattern: "服从性测试 + 权力压制",
    difficulty: "advanced",
    npdName: "张总",
    icon: "👊",
    openingMessage:
      "我知道你有你的想法，但现在按我说的来。我在这个行业十几年了，你才来几年？你觉得你比我更懂？先把我说的做了，有意见可以保留，但执行不能打折扣。这是团队的规矩。",
  },
  {
    id: "credit-steal",
    title: "你做的项目 他拿去汇报",
    description:
      "你辛苦做了一年的项目终于上线了。结果小组长拿着你的成果去给领导汇报，PPT上写着他的名字。现在他微信找你要原始资料。",
    scene:
      "你在一家互联网公司做了整整一年的核心项目，从需求分析到方案设计到落地执行全是你一个人扛的。项目上线后效果很好，数据涨了40%。你刚准备在月会上汇报，却发现张总已经把这个项目的成果写进了他的季度述职PPT，并且标注为'本人主导'。现在他发来微信，语气很随意地找你要所有的原始数据和方案文档。",
    relationshipType: "workplace",
    npdPattern: "抢夺功劳 + 利用关系",
    difficulty: "intermediate",
    npdName: "张总",
    icon: "🏆",
    openingMessage:
      "小刘啊，你把那个项目的数据报告和方案文档整理一下发我邮箱，周三之前要。领导那边要看看我们组的成果。对了你那个项目的用户数据后台截图也给我一份，我汇报的时候用得上。",
  },

  // ============ 家庭/父母 ============
  {
    id: "nitpick-everything",
    title: "你做什么都不对",
    description:
      "回家吃个饭能被挑十个毛病——工作不好、对象不行、脸色不好、坐姿不对。你做什么都达不到标准，而标准永远在变。",
    scene:
      "国庆节你坐了三个小时的高铁回家。一进门，妈从你头顶看到脚底。你换了拖鞋、放下行李，刚在沙发上坐下来喝口水，她就开始了。",
    relationshipType: "parent-child",
    npdPattern: "处处挑毛病 + 否定一切",
    difficulty: "beginner",
    npdName: "妈",
    icon: "🔍",
    openingMessage:
      "你这脸色怎么这么差？是不是又熬夜了？你看看你穿的什么，回家也不知道穿正经点。你那个工作到底怎么样了？一个月挣那点钱够干什么的？你看你表姐，人家年终奖都好几万。",
  },
  {
    id: "emotional-vampire",
    title: "情绪黑洞 永远在诉苦",
    description:
      "你妈的电话永远是抱怨——身体不好、爸爸不行、邻居欺负她、你不孝顺。你是她唯一的情绪垃圾桶。你挂电话都有罪恶感。",
    scene:
      "晚上十点，你刚加完班回到出租屋，累得只想躺着。手机响了，是妈打来的。你犹豫了一下，想着上次没接她念了你两天，还是接了。电话那头传来她熟悉的叹气声。",
    relationshipType: "parent-child",
    npdPattern: "情绪吸血 + 内疚绑架",
    difficulty: "intermediate",
    npdName: "妈",
    icon: "🩸",
    openingMessage:
      "你好久没给我打电话了啊。我昨天去医院检查，医生说血压又高了。你爸也不管我，整天就知道打牌。隔壁李阿姨女儿每周都回来看她，人家还给她妈买了个按摩椅。我也不指望你什么，我就是跟你说说。你别嫌我烦。",
  },
  {
    id: "helpless-burden",
    title: "什么都不会 全靠你",
    description:
      "手机不会用找你、水管漏了找你、跟物业吵架了找你。好像全世界只有你能解决问题。你不帮就是不孝顺。",
    scene:
      "周三下午三点，你正在公司和同事开会讨论方案。手机震了三次。会后你一看，是妈连发了三条60秒的语音消息，外加两个未接电话。你叹了口气，回拨了过去。",
    relationshipType: "parent-child",
    npdPattern: "无能化依赖 + 道德绑架",
    difficulty: "intermediate",
    npdName: "妈",
    icon: "📞",
    openingMessage:
      "你赶紧帮我看看这个手机怎么又上不了网了！我昨天就弄了半天弄不好。你爸更指望不上，连开机都不会。你就不能回来一趟帮我弄弄吗？你说你在外面工作忙，忙到连你妈的电话都没空接？",
  },
];

export function getScenarioById(id: string): Scenario | undefined {
  return SCENARIOS.find((s) => s.id === id);
}

export function getScenariosByRelationship(type: string): Scenario[] {
  return SCENARIOS.filter((s) => s.relationshipType === type);
}
