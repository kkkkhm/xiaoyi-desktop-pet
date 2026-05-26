const DEFAULT_CONFIG = {
  enabled: true,
  preferKaomoji: true,
  normalProbability: 0.3,
  strongEmotionProbability: 0.6,
  maxExpressionPerReply: 1,
  disableForTechnicalAnswer: true
};

const kaomojiMap = {
  happy: ["(｡･ω･｡)", "ฅ(>ω<*ฅ)", "ヾ(≧▽≦*)o", "(*´▽｀*)", "✧٩(ˊωˋ*)و✧"],
  shy: ["(*/ω＼*)", "(｡•́︿•̀｡)", "(つω`｡)", "(〃ω〃)", "(⁄ ⁄•⁄ω⁄•⁄ ⁄)"],
  sleepy: ["(´-ωก`)", "(。-ω-)zzz", "(¦3[▓▓]", "(｡ρω-｡)", "(つ＿－*)｡οΟ"],
  worried: ["(｡•́︿•̀｡)", "(´･_･`)", "(；′⌒`)", "(｡ŏ﹏ŏ)", "(´•̥̯•̥`)"],
  encourage: ["٩(๑•̀ω•́๑)۶", "✧٩(ˊωˋ*)و✧", "加油呀～", "我陪你！", "冲一下下！"],
  clingy: ["ฅ( ̳• ◡ • ̳)ฅ", "(๑•́ ₃ •̀๑)", "(｡>﹏<｡)", "(つ≧▽≦)つ", "(｡･ω･｡)ﾉ♡"],
  calm: ["( ˘ω˘ )", "(｡･ω･｡)", "(´｡• ᵕ •｡`)", "( ˶ˆ꒳ˆ˵ )", "(๑′ᴗ‵๑)"]
};

const emojiMap = {
  happy: ["😊", "✨"],
  shy: ["☺️"],
  sleepy: ["😴"],
  worried: ["🥺"],
  encourage: ["✨"],
  clingy: ["💕"],
  calm: ["🌙"]
};

function mergeConfig(config = {}) {
  return {
    ...DEFAULT_CONFIG,
    ...config
  };
}

function hasExpression(text) {
  return /[\u{1f300}-\u{1faff}]|[\u2600-\u27bf]|[ฅヾ٩๑｡ω▽≧˘꒳ᵕᴗ•︿ก▓♡]/u.test(text);
}

function isTechnicalOrSerious(userText, reply, config) {
  if (!config.disableForTechnicalAnswer) return false;
  const combined = `${userText}\n${reply}`;
  if (/代码|报错|接口|API|模型|配置|安装|路径|文件|bug|exe|Ollama|DeepSeek|PowerShell|http|json|function|const|class/i.test(combined)) {
    return true;
  }
  if (/严重|危险|违法|隐私|密码|key|生病|自杀|崩溃|报警|医院|法律|财务/i.test(combined)) {
    return true;
  }
  return false;
}

function detectEmotion(userText, reply, timeInfo = {}) {
  const text = `${userText}\n${reply}`;
  if (/开心|高兴|完成|搞定|成功|好消息|太好了|喜欢|可爱|回来|见到/.test(text)) return { type: "happy", strong: true };
  if (/想你|抱抱|陪我|亲亲|贴贴|老公|撒娇|不要不理/.test(text)) return { type: "clingy", strong: true };
  if (/害羞|脸红|不好意思|羞|夸我/.test(text)) return { type: "shy", strong: true };
  if (/困|想睡|睡不着|熬夜|好晚|累了|疲惫/.test(text)) return { type: "sleepy", strong: true };
  if (/难过|委屈|压力|焦虑|不开心|害怕|担心|烦|崩|哭/.test(text)) return { type: "worried", strong: true };
  if (/学习|写代码|实验|论文|工作|复习|加班|任务|努力|坚持/.test(text)) return { type: "encourage", strong: false };
  if (timeInfo.currentPeriod === "lateNight") return { type: "sleepy", strong: false };
  if (timeInfo.currentPeriod === "evening") return { type: "calm", strong: false };
  return { type: "calm", strong: false };
}

function pick(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function appendExpression(reply, userText, options = {}) {
  const config = mergeConfig(options.config);
  if (!config.enabled || config.maxExpressionPerReply < 1) return reply;
  if (!reply || hasExpression(reply)) return reply;
  if (isTechnicalOrSerious(userText, reply, config)) return reply;

  const emotion = detectEmotion(userText, reply, options.timeInfo);
  const probability = emotion.strong ? config.strongEmotionProbability : config.normalProbability;
  if (Math.random() > probability) return reply;

  const source = config.preferKaomoji ? kaomojiMap : emojiMap;
  const fallback = config.preferKaomoji ? emojiMap : kaomojiMap;
  const expression = pick(source[emotion.type] || fallback[emotion.type] || kaomojiMap.calm);
  return `${reply.replace(/\s+$/, "")} ${expression}`;
}

function buildPrompt() {
  return [
    "情绪表情表达规则：",
    "你可以偶尔用颜文字或少量 emoji 表达情绪，但不要用文字括号描述情绪。",
    "错误：我很开心。",
    "错误：我会陪你的（开心）",
    "正确：我会陪你的 ฅ(>ω<*ฅ)",
    "规则：表情不是必需品；一条回复最多 1 个颜文字或 emoji；普通聊天约 30% 概率使用表情；情绪明显时可以提高到 60%；技术解释、严肃问题、长篇回答时尽量不用表情；不要把情绪写成“开心、害羞、难过”等标签；回复要像自然聊天，不要像客服。"
  ].join("\n");
}

module.exports = {
  DEFAULT_CONFIG,
  emotionEmojiMap: emojiMap,
  kaomojiMap,
  appendExpression,
  buildPrompt
};
