const CELL_W = 192;
const CELL_H = 208;

const SPRITES = {
  idle: { row: 0, frames: 6, durations: [180, 150, 180, 150, 180, 240] },
  walkRight: { row: 2, frames: 6, durations: [120, 120, 120, 120, 120, 220] },
  walkLeft: { row: 1, frames: 6, durations: [120, 120, 120, 120, 120, 220] },
  wave: { row: 3, frames: 8, durations: [220, 220, 240, 250, 260, 280, 300, 420] },
  wakeup: { row: 4, frames: 5, durations: [260, 280, 320, 380, 520] },
  surprise: { row: 5, frames: 6, durations: [240, 240, 260, 300, 280, 420] },
  sleep: { row: 6, frames: 1, durations: [360] },
  drag: { row: 7, frames: 6, durations: [160, 160, 180, 180, 160, 220] },
  work: { row: 8, frames: 6, durations: [150, 120, 150, 120, 150, 260] }
};

const ACTIONS = {
  idle_breathe: { priority: 1, sprite: "idle", duration: 0, loop: true },
  idle_blink: { priority: 3, sprite: "work", duration: [6000, 15000] },
  idle_sleep: { priority: 2, sprite: "sleep", duration: 0, loop: true },
  idle_wakeup: { priority: 7, sprite: "wakeup", duration: 2200 },
  walk_left: { priority: 4, sprite: "walkLeft", duration: 0, direction: "left" },
  walk_right: { priority: 4, sprite: "walkRight", duration: 0, direction: "right" },
  click_surprise: { priority: 6, sprite: "surprise", duration: 1900 },
  drag_struggle: { priority: 8, sprite: "drag", duration: 0, loop: true },
  happy_wave: { priority: 5, sprite: "wave", duration: 2400 }
};

const RANDOM_IDLE_ACTIONS = ["idle_breathe", "idle_breathe", "idle_blink", "happy_wave"];
const WALK_ACTIONS = ["walk_left", "walk_right"];
const CHAT_REPLY_ACTIONS = ["idle_breathe", "click_surprise", "idle_blink"];
const CHAT_PROVIDER_DEFAULTS = {
  openai: { baseUrl: "https://api.openai.com/v1", model: "gpt-4.1-mini" },
  deepseek: { baseUrl: "https://api.deepseek.com", model: "deepseek-chat" },
  deepseekLocal: { baseUrl: "http://127.0.0.1:11434/v1", model: "deepseek-r1:7b" },
  ollama: { baseUrl: "http://127.0.0.1:11434/v1", model: "qwen2.5:7b" },
  custom: { baseUrl: "", model: "" }
};

const INTERACTION_LINES = {
  daily: [
    "好困呀，想偷偷睡一会儿……",
    "有点饿了，可以投喂我吗？",
    "今天也要加油哦。",
    "我刚刚在发呆，你发现了吗？",
    "刚刚偷偷看了你一眼。",
    "你忙完了吗？陪我说说话嘛。",
    "今天的我也在认真陪着你。"
  ],
  clingy: [
    "想你了。",
    "不要一直不理我嘛。",
    "你终于回来了！",
    "你在的时候，我会安心一点。",
    "再陪我一会儿嘛。",
    "你一出现，我就开心啦。"
  ],
  focus: [
    "休息一下吧，眼睛会累的。",
    "你已经很努力啦。",
    "再坚持一下，我陪你。",
    "要不要喝点水？",
    "我会安静一点，不打扰你。",
    "完成一点点也是进步呀。"
  ],
  cute: [
    "哼哼，我刚刚在练习卖萌。",
    "今天的心情是草莓味的。",
    "如果我能跳出来就好了。",
    "我发现你今天有点可爱。",
    "欸？刚才是不是有人在叫我？"
  ],
  clicked: [
    "呀！你戳到我啦。",
    "嘿嘿，好痒。",
    "再摸一下嘛。",
    "不要突然点我啦，会吓到我的。",
    "你是在和我玩吗？",
    "嗯……感觉不错。"
  ],
  idle: [
    "你去哪儿了呀？",
    "我等得有点困了。",
    "是不是忙起来就忘记我了？",
    "我还在这里哦。",
    "没人理我的时候，我会自己发呆。"
  ]
};

const pet = document.getElementById("pet");
const closeButton = document.getElementById("close");
const historyToggle = document.getElementById("history-toggle");
const actionToggle = document.getElementById("action-toggle");
const settingsToggle = document.getElementById("settings-toggle");
const actionPanel = document.getElementById("action-panel");
const settingsPanel = document.getElementById("settings-panel");
const openAtLoginInput = document.getElementById("open-at-login");
const autoGreetingInput = document.getElementById("auto-greeting");
const alwaysOnTopInput = document.getElementById("always-on-top");
const chatProviderInput = document.getElementById("chat-provider");
const chatBaseUrlInput = document.getElementById("chat-base-url");
const chatModelInput = document.getElementById("chat-model");
const chatApiKeyInput = document.getElementById("chat-api-key");
const saveChatModelButton = document.getElementById("save-chat-model");
const clearMemoryButton = document.getElementById("clear-memory");
const historyPanel = document.getElementById("history-panel");
const replyBubble = document.getElementById("reply-bubble");
const messages = document.getElementById("messages");
const chatForm = document.getElementById("chat-form");
const chatInput = document.getElementById("chat-input");

const STARTUP_GREETINGS = [
  "老板，你回来啦～",
  "老板，今天也辛苦啦。",
  "老板，我刚刚还在等你呢。",
  "老板，欢迎回来呀～",
  "老板，今天也要加油哦。",
  "老板，我好像有点想你了。",
  "老板，终于看到你啦。",
  "老板，工作别太累啦。",
  "老板，要记得喝水哦。",
  "老板，今天也陪着你。",
  "老板，你来了我就不无聊啦。",
  "老板，欸嘿，又见面啦。",
  "老板，我已经准备好陪你啦。",
  "老板，偷偷看你好久了。",
  "老板，今天心情怎么样呀？",
  "老板，我会乖乖陪着你的。",
  "老板，你终于打开电脑啦。",
  "老板，今天也要开心一点。",
  "老板，回来得比我想的早呢。",
  "老板，我一直都在这里哦。"
];

const TIME_AWARE_LINES = {
  morning: [
    "老板，早上好呀～",
    "老板，新的一天开始啦。",
    "老板，今天也要元气满满哦。",
    "老板，起床了吗？我已经醒啦。"
  ],
  forenoon: [
    "老板，上午好，今天也要加油。",
    "老板，工作别太着急，慢慢来。",
    "老板，记得喝点水哦。",
    "老板，我陪你一起认真工作。"
  ],
  noon: [
    "老板，中午啦，要记得吃饭。",
    "老板，别只顾着忙，先吃点东西吧。",
    "老板，午饭时间到～",
    "老板，吃饱了才有力气继续呀。"
  ],
  afternoon: [
    "老板，下午容易困，要不要休息一下？",
    "老板，再坚持一下，很快就完成啦。",
    "老板，喝口水，放松一下眼睛吧。",
    "老板，我还在陪着你哦。"
  ],
  evening: [
    "老板，晚上好，今天辛苦啦。",
    "老板，忙了一天，要对自己好一点。",
    "老板，晚上可以稍微放松一下啦。",
    "老板，我会安静陪着你的。"
  ],
  lateNight: [
    "老板，这么晚还没睡呀……",
    "老板，别熬太晚哦。",
    "老板，我都有点困了，你也休息一下吧。",
    "老板，深夜工作也要注意身体。"
  ]
};

const MEAL_REMINDER_LINES = {
  lunch: [
    "老板，中午啦，要记得吃饭。",
    "老板，别只顾着忙，先吃点东西吧。",
    "老板，午饭时间到～",
    "老板，吃饱了才有力气继续呀。"
  ],
  dinner: [
    "老板，晚饭时间到啦，先吃点东西吧。",
    "老板，忙了一天，晚上要好好吃饭哦。",
    "老板，先放松一下，吃完饭再继续也可以。",
    "老板，晚饭别忘了，我会乖乖等你的。"
  ],
  lateNight: [
    "老板，这么晚还没睡呀……",
    "老板，别熬太晚哦。",
    "老板，我都有点困了，你也休息一下吧。",
    "老板，深夜工作也要注意身体。"
  ]
};

const REMINDER_STORAGE_KEY = "xiaoyi.timeReminderState.v1";

let currentAction = "idle_breathe";
let currentSprite = "idle";
let currentPriority = ACTIONS.idle_breathe.priority;
let actionStartedAt = performance.now();
let frame = 0;
let frameTimer = 0;
let actionTimer = 0;
let idleTimer = 0;
let moveTimer = 0;
let sleepTimer = 0;
let chatSleepTimer = 0;
let bubbleTimer = 0;
let ambientTimer = 0;
let timeReminderTimer = 0;
let clickTimer = 0;
let walkingTimer = 0;
let dragStart = null;
let wasPointerDragging = false;
let chatOpen = false;
let isChatting = false;
let isSleeping = false;
let lastInteractionAt = Date.now();
let timeReminderState = loadTimeReminderState();
let chatProviderConfigs = {};
let isSelectingText = false;

function randomChoice(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function randomDelay(minMs, maxMs) {
  return minMs + Math.random() * (maxMs - minMs);
}

function todayKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function createEmptyReminderState(date = new Date()) {
  return {
    date: todayKey(date),
    lastGreetingTime: 0,
    lastGreetingMessage: "",
    dailyReminderFlags: {}
  };
}

function loadTimeReminderState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(REMINDER_STORAGE_KEY) || "null");
    if (!parsed || typeof parsed !== "object") return createEmptyReminderState();
    return {
      date: typeof parsed.date === "string" ? parsed.date : todayKey(),
      lastGreetingTime: Number(parsed.lastGreetingTime) || 0,
      lastGreetingMessage: typeof parsed.lastGreetingMessage === "string" ? parsed.lastGreetingMessage : "",
      dailyReminderFlags: parsed.dailyReminderFlags && typeof parsed.dailyReminderFlags === "object"
        ? parsed.dailyReminderFlags
        : {}
    };
  } catch {
    return createEmptyReminderState();
  }
}

function saveTimeReminderState() {
  try {
    localStorage.setItem(REMINDER_STORAGE_KEY, JSON.stringify(timeReminderState));
  } catch {}
}

function ensureTodayReminderState(date = new Date()) {
  const key = todayKey(date);
  if (timeReminderState.date !== key) {
    timeReminderState = createEmptyReminderState(date);
    saveTimeReminderState();
  }
}

function minutesOfDay(date = new Date()) {
  return date.getHours() * 60 + date.getMinutes();
}

function getTimeSegment(date = new Date()) {
  const minute = minutesOfDay(date);
  if (minute >= 360 && minute <= 539) return "morning";
  if (minute >= 540 && minute <= 689) return "forenoon";
  if (minute >= 690 && minute <= 809) return "noon";
  if (minute >= 810 && minute <= 1079) return "afternoon";
  if (minute >= 1080 && minute <= 1379) return "evening";
  return "lateNight";
}

function pickNonRepeatingLine(lines) {
  const candidates = lines.filter((line) => line !== timeReminderState.lastGreetingMessage);
  return randomChoice(candidates.length ? candidates : lines);
}

function rememberTimeLine(message, flagName = "") {
  timeReminderState.lastGreetingTime = Date.now();
  timeReminderState.lastGreetingMessage = message;
  if (flagName) timeReminderState.dailyReminderFlags[flagName] = true;
  saveTimeReminderState();
}

function setFrame(spriteName, index) {
  const sprite = SPRITES[spriteName] || SPRITES.idle;
  pet.style.backgroundPosition = `-${index * CELL_W}px -${sprite.row * CELL_H}px`;
}

function tickFrame() {
  const sprite = SPRITES[currentSprite] || SPRITES.idle;
  setFrame(currentSprite, frame);
  const duration = sprite.durations[frame] || 140;
  frame = (frame + 1) % sprite.frames;
  frameTimer = setTimeout(tickFrame, duration);
}

function playSprite(spriteName) {
  currentSprite = spriteName;
  frame = 0;
  clearTimeout(frameTimer);
  tickFrame();
}

function clearActionTimers() {
  clearTimeout(actionTimer);
  clearInterval(walkingTimer);
  walkingTimer = 0;
}

function setPetActionClass(actionName) {
  for (const name of Object.keys(ACTIONS)) pet.classList.remove(`action-${name}`);
  pet.classList.add(`action-${actionName}`);
}

function playAction(actionName, options = {}) {
  const action = ACTIONS[actionName] || ACTIONS.idle_breathe;
  if (!options.force && action.priority < currentPriority) return false;

  clearActionTimers();
  currentAction = actionName;
  currentSprite = action.sprite;
  currentPriority = action.priority;
  actionStartedAt = performance.now();
  setPetActionClass(actionName);
  playSprite(action.sprite);

  if (action.direction) {
    startWalk(actionName);
    return true;
  }

  if (!action.loop && action.duration) {
    const duration = Array.isArray(action.duration) ? randomDelay(action.duration[0], action.duration[1]) : action.duration;
    actionTimer = setTimeout(() => {
      if (currentAction === actionName) returnToBreathe();
    }, duration);
  }

  return true;
}

function returnToBreathe() {
  if (chatOpen || isChatting || dragStart) return;
  currentPriority = ACTIONS.idle_breathe.priority;
  isSleeping = false;
  playAction("idle_breathe", { force: true });
  scheduleIdleAction();
  scheduleMoveAction();
}

function playManualAction(actionName) {
  if (!ACTIONS[actionName]) return;
  markInteraction();
  clearTimeout(idleTimer);
  clearTimeout(moveTimer);
  actionPanel.classList.remove("open");
  settingsPanel.classList.remove("open");
  historyPanel.classList.remove("open");

  isSleeping = actionName === "idle_sleep";
  if (actionName !== "idle_sleep") isSleeping = false;

  playAction(actionName, { force: true });
  if (actionName === "drag_struggle") {
    actionTimer = setTimeout(returnToBreathe, 1500);
    return;
  }
  if (ACTIONS[actionName].direction) return;
  if (actionName === "idle_breathe" || actionName === "idle_sleep") return;
}

function closePanelOnMouseLeave(panel) {
  let closeTimer = 0;
  panel.addEventListener("mouseenter", () => {
    clearTimeout(closeTimer);
  });
  panel.addEventListener("mouseleave", () => {
    clearTimeout(closeTimer);
    closeTimer = setTimeout(() => {
      if (isSelectingText) return;
      panel.classList.remove("open");
    }, 180);
  });
}

function markInteraction() {
  lastInteractionAt = Date.now();
  resetLongIdleSleep();
  if (isSleeping) {
    isSleeping = false;
    playAction("idle_wakeup", { force: true });
  }
}

function resetLongIdleSleep() {
  clearTimeout(sleepTimer);
  sleepTimer = setTimeout(() => {
    if (!chatOpen && !isChatting && !dragStart) {
      isSleeping = true;
      playAction("idle_sleep", { force: true });
    }
  }, 60000);
}

async function startWalk(actionName) {
  const action = ACTIONS[actionName];
  const direction = action.direction === "right" ? 1 : -1;
  const speed = direction * 10;
  const steps = 8 + Math.floor(Math.random() * 8);
  let count = 0;

  walkingTimer = setInterval(() => {
    const nextX = window.screenX + speed;
    window.petHost.moveWindow({ x: nextX, y: window.screenY });
    count += 1;
    if (count >= steps) returnToBreathe();
  }, 130);
}

function scheduleIdleAction() {
  clearTimeout(idleTimer);
  if (chatOpen || isChatting || dragStart || isSleeping) return;
  idleTimer = setTimeout(() => {
    if (!chatOpen && !isChatting && !dragStart && !isSleeping) {
      playAction(randomChoice(RANDOM_IDLE_ACTIONS), { force: true });
    }
  }, randomDelay(10000, 20000));
}

function scheduleMoveAction() {
  clearTimeout(moveTimer);
  if (chatOpen || isChatting || dragStart || isSleeping) return;
  moveTimer = setTimeout(() => {
    if (!chatOpen && !isChatting && !dragStart && !isSleeping) {
      playAction(randomChoice(WALK_ACTIONS), { force: true });
    }
  }, randomDelay(20000, 40000));
}

function updatePlaceholderMotion(now) {
  const elapsed = now - actionStartedAt;
  const t = elapsed / 1000;
  let x = 0;
  let y = 0;
  let rotate = 0;
  let scale = 1;
  let brightness = 1;
  let opacity = 1;

  if (currentAction === "idle_breathe") {
    y = Math.sin(t * 2.4) * 2;
    rotate = Math.sin(t * 3.1) * 1.4;
    scale = 1 + Math.sin(t * 2.4) * 0.006;
  } else if (currentAction === "idle_blink") {
    y = Math.sin(t * 4.2) * 0.8;
    rotate = Math.sin(t * 3.6) * 0.35;
    scale = 1;
  } else if (currentAction === "idle_sleep") {
    y = 6 + Math.sin(t * 0.62) * 3.2;
    scale = 1;
    brightness = 0.82;
    opacity = 0.96;
  } else if (currentAction === "idle_wakeup") {
    const p = Math.min(1, elapsed / ACTIONS.idle_wakeup.duration);
    y = -Math.sin(p * Math.PI) * 4;
    scale = 1 + Math.sin(p * Math.PI) * 0.035;
    brightness = 0.85 + p * 0.15;
  } else if (currentAction === "walk_left" || currentAction === "walk_right") {
    const dir = currentAction === "walk_right" ? 1 : -1;
    y = Math.abs(Math.sin(t * 9)) * -3;
    rotate = Math.sin(t * 9) * 3.5 * dir;
  } else if (currentAction === "click_surprise") {
    const p = Math.min(1, elapsed / ACTIONS.click_surprise.duration);
    y = -Math.sin(p * Math.PI) * 3;
    rotate = Math.sin(p * Math.PI * 2) * 1.4;
    scale = 1 + Math.sin(p * Math.PI) * 0.018;
  } else if (currentAction === "drag_struggle") {
    x = Math.sin(t * 8) * 3;
    y = Math.sin(t * 6) * 2;
    rotate = Math.sin(t * 7) * 2.5;
    scale = 1.01;
  } else if (currentAction === "happy_wave") {
    y = Math.sin(t * 6) * 2;
    rotate = Math.sin(t * 5) * 1.2;
    scale = 1 + Math.sin(t * 4) * 0.018;
  }

  pet.style.setProperty("--pet-x", `${x.toFixed(2)}px`);
  pet.style.setProperty("--pet-y", `${y.toFixed(2)}px`);
  pet.style.setProperty("--pet-rotate", `${rotate.toFixed(2)}deg`);
  pet.style.setProperty("--pet-scale", scale.toFixed(3));
  pet.style.setProperty("--pet-brightness", brightness.toFixed(3));
  pet.style.setProperty("--pet-opacity", opacity.toFixed(3));
  requestAnimationFrame(updatePlaceholderMotion);
}

function showReply(text, persistent = false) {
  replyBubble.textContent = text;
  replyBubble.classList.add("show");
  clearTimeout(bubbleTimer);
  if (!persistent) {
    bubbleTimer = setTimeout(() => {
      if (!chatOpen) replyBubble.classList.remove("show");
    }, 8000);
  }
}

function showAmbientLine(text) {
  if (chatOpen || isChatting || dragStart) return;
  replyBubble.textContent = text;
  replyBubble.classList.add("show");
  clearTimeout(bubbleTimer);
  bubbleTimer = setTimeout(() => {
    if (!chatOpen) replyBubble.classList.remove("show");
  }, randomDelay(5000, 10000));
}

function showTimeAwareLine(text, actionName = "click_surprise") {
  if (chatOpen || isChatting || dragStart) return false;
  isSleeping = actionName === "idle_sleep";
  playAction(actionName, { force: true });
  replyBubble.textContent = text;
  replyBubble.classList.add("show");
  clearTimeout(bubbleTimer);
  bubbleTimer = setTimeout(() => {
    if (!chatOpen) replyBubble.classList.remove("show");
  }, randomDelay(5000, 10000));
  return true;
}

function showStartupGreeting() {
  if (chatOpen || isChatting || dragStart) return;
  const now = new Date();
  ensureTodayReminderState(now);
  const lines = TIME_AWARE_LINES[getTimeSegment(now)];
  const message = pickNonRepeatingLine(lines);
  if (showTimeAwareLine(message, "click_surprise")) {
    rememberTimeLine(message, "startupGreeting");
  }
}

function applyChatModelSettings(settings) {
  const provider = settings.chatProvider || "openai";
  const defaults = CHAT_PROVIDER_DEFAULTS[provider] || CHAT_PROVIDER_DEFAULTS.openai;
  chatProviderConfigs = settings.chatProviderConfigs || chatProviderConfigs || {};
  const providerConfig = chatProviderConfigs[provider] || {};
  chatProviderInput.value = provider;
  chatBaseUrlInput.value = providerConfig.baseUrl || settings.chatBaseUrl || defaults.baseUrl;
  chatModelInput.value = providerConfig.model || settings.chatModel || defaults.model;
  chatApiKeyInput.value = providerConfig.apiKey || settings.chatApiKey || "";
}

function fillProviderDefaults() {
  const provider = chatProviderInput.value;
  const defaults = CHAT_PROVIDER_DEFAULTS[provider] || CHAT_PROVIDER_DEFAULTS.custom;
  const providerConfig = chatProviderConfigs[provider] || {};
  chatBaseUrlInput.value = providerConfig.baseUrl || defaults.baseUrl;
  chatModelInput.value = providerConfig.model || defaults.model;
  chatApiKeyInput.value = providerConfig.apiKey || "";
  if (chatProviderInput.value === "ollama" || chatProviderInput.value === "deepseekLocal") {
    chatApiKeyInput.value = providerConfig.apiKey || "";
  }
}

async function loadSettings() {
  try {
    const settings = await window.petHost.getSettings();
    openAtLoginInput.checked = Boolean(settings.openAtLogin);
    autoGreetingInput.checked = settings.autoGreeting !== false;
    alwaysOnTopInput.checked = settings.alwaysOnTop !== false;
    applyChatModelSettings(settings);
    if (autoGreetingInput.checked) {
      setTimeout(showStartupGreeting, 900);
    }
  } catch {
    openAtLoginInput.checked = false;
    autoGreetingInput.checked = true;
    alwaysOnTopInput.checked = true;
    applyChatModelSettings({ chatProvider: "openai" });
    setTimeout(showStartupGreeting, 900);
  }
}

async function saveSettingPatch(patch) {
  try {
    const settings = await window.petHost.setSettings(patch);
    openAtLoginInput.checked = Boolean(settings.openAtLogin);
    autoGreetingInput.checked = settings.autoGreeting !== false;
    alwaysOnTopInput.checked = settings.alwaysOnTop !== false;
    applyChatModelSettings(settings);
  } catch {}
}

function pickAmbientLine() {
  const idleMs = Date.now() - lastInteractionAt;
  ensureTodayReminderState();
  if (idleMs > 180000 && Math.random() < 0.55) {
    const line = pickNonRepeatingLine(INTERACTION_LINES.idle);
    rememberTimeLine(line);
    return line;
  }
  const scene = randomChoice(["daily", "daily", "clingy", "focus", "focus", "cute", "cute"]);
  const line = pickNonRepeatingLine(INTERACTION_LINES[scene]);
  rememberTimeLine(line);
  return line;
}

function scheduleAmbientLine() {
  clearTimeout(ambientTimer);
  ambientTimer = setTimeout(() => {
    showAmbientLine(pickAmbientLine());
    scheduleAmbientLine();
  }, randomDelay(30000, 120000));
}

function maybeShowTimeReminder(lines, flagName, probability = 1, actionName = "click_surprise") {
  const now = new Date();
  ensureTodayReminderState(now);
  if (flagName && timeReminderState.dailyReminderFlags[flagName]) return false;
  if (Math.random() > probability) {
    if (flagName) {
      timeReminderState.dailyReminderFlags[flagName] = true;
      saveTimeReminderState();
    }
    return false;
  }
  const message = pickNonRepeatingLine(lines);
  if (!showTimeAwareLine(message, actionName)) return false;
  rememberTimeLine(message, flagName);
  return true;
}

function checkTimeReminders() {
  const now = new Date();
  ensureTodayReminderState(now);
  const minute = minutesOfDay(now);
  const hourFlag = `hour-${now.getHours()}`;

  if (now.getMinutes() === 0) {
    maybeShowTimeReminder(TIME_AWARE_LINES[getTimeSegment(now)], hourFlag, 0.4, "click_surprise");
    return;
  }

  if (minute >= 690 && minute <= 780) {
    maybeShowTimeReminder(MEAL_REMINDER_LINES.lunch, "lunch", 1, "idle_blink");
    return;
  }

  if (minute >= 1080 && minute <= 1170) {
    maybeShowTimeReminder(MEAL_REMINDER_LINES.dinner, "dinner", 1, "happy_wave");
    return;
  }

  if (minute >= 1380 || minute <= 359) {
    maybeShowTimeReminder(MEAL_REMINDER_LINES.lateNight, "lateNight", 1, "idle_sleep");
  }
}

function scheduleTimeReminders() {
  clearInterval(timeReminderTimer);
  checkTimeReminders();
  timeReminderTimer = setInterval(checkTimeReminders, 60000);
}

function resetChatSleepTimer() {
  clearTimeout(chatSleepTimer);
  if (!chatOpen || isChatting) return;
  chatSleepTimer = setTimeout(closeChat, 10000);
}

function appendMessage(text, who) {
  const bubble = document.createElement("p");
  bubble.className = `bubble ${who === "user" ? "user-bubble" : "pet-bubble"}`;
  bubble.textContent = text;
  messages.appendChild(bubble);
  while (messages.children.length > 40) messages.removeChild(messages.firstElementChild);
  messages.scrollTop = messages.scrollHeight;
}

function clearVisibleChat() {
  messages.textContent = "";
  showReply("新的聊天开始啦");
}

async function restoreChatHistory() {
  try {
    const history = await window.petHost.getChatHistory();
    history.forEach((item) => appendMessage(item.content, item.role === "user" ? "user" : "pet"));
  } catch {}
}

function openChat() {
  chatOpen = true;
  isSleeping = false;
  actionPanel.classList.remove("open");
  chatForm.classList.add("open");
  clearTimeout(idleTimer);
  clearTimeout(moveTimer);
  settingsPanel.classList.remove("open");
  playAction("click_surprise", { force: true });
  resetChatSleepTimer();
  setTimeout(() => chatInput.focus(), 30);
}

function closeChat() {
  chatOpen = false;
  clearTimeout(chatSleepTimer);
  clearTimeout(bubbleTimer);
  chatForm.classList.remove("open");
  historyPanel.classList.remove("open");
  actionPanel.classList.remove("open");
  settingsPanel.classList.remove("open");
  replyBubble.classList.remove("show");
  chatInput.blur();
  if (!isChatting) returnToBreathe();
}

closeButton.addEventListener("click", () => window.petHost.quit());

closePanelOnMouseLeave(historyPanel);
closePanelOnMouseLeave(settingsPanel);
closePanelOnMouseLeave(actionPanel);

messages.addEventListener("pointerdown", () => {
  isSelectingText = true;
});

window.addEventListener("pointerup", () => {
  isSelectingText = false;
});

actionToggle.addEventListener("click", () => {
  markInteraction();
  resetChatSleepTimer();
  actionPanel.classList.toggle("open");
  settingsPanel.classList.remove("open");
  historyPanel.classList.remove("open");
});

settingsToggle.addEventListener("click", () => {
  markInteraction();
  resetChatSleepTimer();
  settingsPanel.classList.toggle("open");
  actionPanel.classList.remove("open");
  historyPanel.classList.remove("open");
});

actionPanel.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  playManualAction(button.dataset.action);
});

historyToggle.addEventListener("click", () => {
  markInteraction();
  resetChatSleepTimer();
  actionPanel.classList.remove("open");
  settingsPanel.classList.remove("open");
  historyPanel.classList.toggle("open");
  if (historyPanel.classList.contains("open")) messages.scrollTop = messages.scrollHeight;
});

openAtLoginInput.addEventListener("change", () => {
  markInteraction();
  saveSettingPatch({ openAtLogin: openAtLoginInput.checked });
});

autoGreetingInput.addEventListener("change", () => {
  markInteraction();
  saveSettingPatch({ autoGreeting: autoGreetingInput.checked });
});

alwaysOnTopInput.addEventListener("change", () => {
  markInteraction();
  saveSettingPatch({ alwaysOnTop: alwaysOnTopInput.checked });
});

chatProviderInput.addEventListener("change", () => {
  markInteraction();
  fillProviderDefaults();
});

saveChatModelButton.addEventListener("click", () => {
  markInteraction();
  chatProviderConfigs[chatProviderInput.value] = {
    baseUrl: chatBaseUrlInput.value.trim(),
    model: chatModelInput.value.trim(),
    apiKey: chatApiKeyInput.value.trim()
  };
  saveSettingPatch({
    chatProvider: chatProviderInput.value,
    chatBaseUrl: chatBaseUrlInput.value,
    chatModel: chatModelInput.value,
    chatApiKey: chatApiKeyInput.value
  });
  showAmbientLine("聊天模型保存好啦");
});

clearMemoryButton.addEventListener("click", async () => {
  markInteraction();
  resetChatSleepTimer();
  clearMemoryButton.disabled = true;
  try {
    await window.petHost.clearChatMemory();
    clearVisibleChat();
  } finally {
    clearMemoryButton.disabled = false;
  }
});

document.addEventListener("mousemove", markInteraction);
document.addEventListener("keydown", (event) => {
  markInteraction();
  resetChatSleepTimer();
  if (event.key === "Escape") closeChat();
});

chatInput.addEventListener("input", () => {
  markInteraction();
  resetChatSleepTimer();
});

chatInput.addEventListener("focus", () => {
  markInteraction();
  resetChatSleepTimer();
});

pet.addEventListener("pointerdown", (event) => {
  markInteraction();
  wasPointerDragging = false;
  dragStart = {
    pointerId: event.pointerId,
    startX: event.screenX,
    startY: event.screenY,
    windowX: window.screenX,
    windowY: window.screenY,
    moved: false
  };
  clearTimeout(clickTimer);
  clearTimeout(idleTimer);
  clearTimeout(moveTimer);
  pet.setPointerCapture(event.pointerId);
});

pet.addEventListener("pointermove", (event) => {
  if (!dragStart || dragStart.pointerId !== event.pointerId) return;
  const dx = event.screenX - dragStart.startX;
  const dy = event.screenY - dragStart.startY;
  if (Math.abs(dx) + Math.abs(dy) > 4) {
    dragStart.moved = true;
    if (!wasPointerDragging) {
      wasPointerDragging = true;
      playAction("drag_struggle", { force: true });
      pet.classList.add("dragging");
    }
  }
  if (!dragStart.moved) return;
  window.petHost.moveWindow({
    x: dragStart.windowX + dx,
    y: dragStart.windowY + dy
  });
});

pet.addEventListener("pointerup", (event) => {
  if (!dragStart || dragStart.pointerId !== event.pointerId) return;
  const wasDrag = dragStart.moved;
  dragStart = null;
  pet.classList.remove("dragging");
  try {
    pet.releasePointerCapture(event.pointerId);
  } catch {}

  if (wasDrag) {
    returnToBreathe();
    return;
  }

  clickTimer = setTimeout(() => {
    markInteraction();
    showAmbientLine(randomChoice(INTERACTION_LINES.clicked));
    playAction("click_surprise", { force: true });
  }, 220);
});

pet.addEventListener("dblclick", (event) => {
  event.preventDefault();
  clearTimeout(clickTimer);
  markInteraction();
  playAction("click_surprise", { force: true });
  openChat();
});

chatForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  markInteraction();
  resetChatSleepTimer();
  const text = chatInput.value.trim();
  if (!text || isChatting) return;
  chatInput.value = "";
  appendMessage(text, "user");
  appendMessage("我想一下...", "pet");
  showReply("我想一下...", true);
  isChatting = true;
  playAction("idle_blink", { force: true });
  try {
    const result = await window.petHost.chat(text);
    messages.lastElementChild.textContent = result.message;
    showReply(result.message);
    playAction(result.ok ? randomChoice(CHAT_REPLY_ACTIONS) : "click_surprise", { force: true });
  } catch {
    const fallback = "我刚刚没听清，再来一次嘛";
    messages.lastElementChild.textContent = fallback;
    showReply(fallback);
    playAction("click_surprise", { force: true });
  } finally {
    isChatting = false;
    resetChatSleepTimer();
  }
});

playAction("idle_breathe", { force: true });
loadSettings();
restoreChatHistory();
scheduleIdleAction();
scheduleMoveAction();
scheduleAmbientLine();
scheduleTimeReminders();
resetLongIdleSleep();
requestAnimationFrame(updatePlaceholderMotion);
