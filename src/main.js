const { app, BrowserWindow, screen, ipcMain, Menu } = require("electron");
const path = require("path");
const fs = require("fs");
const ConversationContextBuilder = require("./conversation-context-builder");
const EmotionExpressionManager = require("./emotion-expression-manager");

let win;
const WINDOW_WIDTH = 180;
const WINDOW_HEIGHT = 220;
let chatArchive = [];
let memoryState = {
  summary: "",
  messages: [],
  lastSummaryAt: 0
};
let appSettings = {
  autoGreeting: true,
  alwaysOnTop: true,
  chatProvider: "openai",
  chatBaseUrl: "",
  chatModel: "",
  chatApiKey: "",
  chatProviderConfigs: {},
  conversation: {
    emotionExpression: EmotionExpressionManager.DEFAULT_CONFIG
  }
};

const CHAT_PROVIDER_DEFAULTS = {
  openai: {
    baseUrl: "https://api.openai.com/v1",
    model: "gpt-4.1-mini",
    envKey: "OPENAI_API_KEY"
  },
  deepseek: {
    baseUrl: "https://api.deepseek.com",
    model: "deepseek-chat",
    envKey: "DEEPSEEK_API_KEY"
  },
  deepseekLocal: {
    baseUrl: "http://127.0.0.1:11434/v1",
    model: "deepseek-r1:7b",
    envKey: ""
  },
  ollama: {
    baseUrl: "http://127.0.0.1:11434/v1",
    model: "qwen2.5:7b",
    envKey: ""
  },
  custom: {
    baseUrl: "",
    model: "",
    envKey: "XIAOYI_API_KEY"
  }
};

function normalizeProvider(provider) {
  return CHAT_PROVIDER_DEFAULTS[provider] ? provider : "openai";
}

function normalizeProviderConfigs(rawConfigs = {}) {
  const configs = {};
  for (const provider of Object.keys(CHAT_PROVIDER_DEFAULTS)) {
    const source = rawConfigs[provider] && typeof rawConfigs[provider] === "object" ? rawConfigs[provider] : {};
    configs[provider] = {
      baseUrl: String(source.baseUrl || ""),
      model: String(source.model || ""),
      apiKey: String(source.apiKey || "")
    };
  }
  return configs;
}

function normalizeConversationConfig(raw = {}) {
  return {
    emotionExpression: {
      ...EmotionExpressionManager.DEFAULT_CONFIG,
      ...(raw.emotionExpression && typeof raw.emotionExpression === "object" ? raw.emotionExpression : {})
    }
  };
}

function getProviderConfig(provider) {
  const normalized = normalizeProvider(provider);
  const configs = normalizeProviderConfigs(appSettings.chatProviderConfigs);
  const stored = configs[normalized] || {};
  return {
    baseUrl: stored.baseUrl || appSettings.chatBaseUrl || "",
    model: stored.model || appSettings.chatModel || "",
    apiKey: stored.apiKey || appSettings.chatApiKey || ""
  };
}

function getMemoryPath() {
  return path.join(app.getPath("userData"), "xiaoyi-memory.json");
}

function getSettingsPath() {
  return path.join(app.getPath("userData"), "xiaoyi-settings.json");
}

function loadSettings() {
  try {
    const file = getSettingsPath();
    if (!fs.existsSync(file)) return;
    const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
    const provider = normalizeProvider(String(parsed.chatProvider || "openai"));
    const providerConfigs = normalizeProviderConfigs(parsed.chatProviderConfigs);
    if (!providerConfigs[provider].baseUrl && parsed.chatBaseUrl) {
      providerConfigs[provider].baseUrl = String(parsed.chatBaseUrl || "");
      providerConfigs[provider].model = String(parsed.chatModel || "");
      providerConfigs[provider].apiKey = String(parsed.chatApiKey || "");
    }
    appSettings = {
      autoGreeting: parsed.autoGreeting !== false,
      alwaysOnTop: parsed.alwaysOnTop !== false,
      chatProvider: provider,
      chatBaseUrl: String(parsed.chatBaseUrl || ""),
      chatModel: String(parsed.chatModel || ""),
      chatApiKey: String(parsed.chatApiKey || ""),
      chatProviderConfigs: providerConfigs,
      conversation: normalizeConversationConfig(parsed.conversation)
    };
  } catch {
    appSettings = {
      autoGreeting: true,
      alwaysOnTop: true,
      chatProvider: "openai",
      chatBaseUrl: "",
      chatModel: "",
      chatApiKey: "",
      chatProviderConfigs: normalizeProviderConfigs(),
      conversation: normalizeConversationConfig()
    };
  }
}

function saveSettings() {
  try {
    fs.mkdirSync(path.dirname(getSettingsPath()), { recursive: true });
    fs.writeFileSync(getSettingsPath(), JSON.stringify(appSettings, null, 2), "utf8");
  } catch {}
}

function getSettingsSnapshot() {
  const provider = normalizeProvider(appSettings.chatProvider || "openai");
  const providerConfigs = normalizeProviderConfigs(appSettings.chatProviderConfigs);
  const activeConfig = getProviderConfig(provider);
  return {
    openAtLogin: app.getLoginItemSettings().openAtLogin,
    autoGreeting: appSettings.autoGreeting !== false,
    alwaysOnTop: appSettings.alwaysOnTop !== false,
    chatProvider: provider,
    chatBaseUrl: activeConfig.baseUrl,
    chatModel: activeConfig.model,
    chatApiKey: activeConfig.apiKey,
    chatProviderConfigs: providerConfigs,
    conversation: normalizeConversationConfig(appSettings.conversation)
  };
}

function updateSettings(nextSettings) {
  if (Object.prototype.hasOwnProperty.call(nextSettings, "openAtLogin")) {
    app.setLoginItemSettings({
      openAtLogin: Boolean(nextSettings.openAtLogin),
      path: process.execPath
    });
  }

  if (Object.prototype.hasOwnProperty.call(nextSettings, "autoGreeting")) {
    appSettings.autoGreeting = Boolean(nextSettings.autoGreeting);
  }

  if (Object.prototype.hasOwnProperty.call(nextSettings, "alwaysOnTop")) {
    appSettings.alwaysOnTop = Boolean(nextSettings.alwaysOnTop);
    if (win) win.setAlwaysOnTop(appSettings.alwaysOnTop);
  }

  if (Object.prototype.hasOwnProperty.call(nextSettings, "chatProvider")) {
    appSettings.chatProvider = normalizeProvider(String(nextSettings.chatProvider || "openai"));
  }

  appSettings.chatProviderConfigs = normalizeProviderConfigs(appSettings.chatProviderConfigs);

  if (
    Object.prototype.hasOwnProperty.call(nextSettings, "chatBaseUrl") ||
    Object.prototype.hasOwnProperty.call(nextSettings, "chatModel") ||
    Object.prototype.hasOwnProperty.call(nextSettings, "chatApiKey")
  ) {
    const provider = normalizeProvider(appSettings.chatProvider || "openai");
    const existing = appSettings.chatProviderConfigs[provider] || {};
    const nextConfig = {
      baseUrl: Object.prototype.hasOwnProperty.call(nextSettings, "chatBaseUrl")
        ? String(nextSettings.chatBaseUrl || "").trim()
        : existing.baseUrl || "",
      model: Object.prototype.hasOwnProperty.call(nextSettings, "chatModel")
        ? String(nextSettings.chatModel || "").trim()
        : existing.model || "",
      apiKey: Object.prototype.hasOwnProperty.call(nextSettings, "chatApiKey")
        ? String(nextSettings.chatApiKey || "").trim()
        : existing.apiKey || ""
    };
    appSettings.chatProviderConfigs[provider] = nextConfig;
    appSettings.chatBaseUrl = nextConfig.baseUrl;
    appSettings.chatModel = nextConfig.model;
    appSettings.chatApiKey = nextConfig.apiKey;
  }

  if (Object.prototype.hasOwnProperty.call(nextSettings, "conversation")) {
    appSettings.conversation = normalizeConversationConfig(nextSettings.conversation);
  }

  saveSettings();

  return getSettingsSnapshot();
}

function loadMemory() {
  try {
    const file = getMemoryPath();
    if (!fs.existsSync(file)) return;
    const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
    memoryState = {
      summary: String(parsed.summary || ""),
      messages: Array.isArray(parsed.messages) ? parsed.messages.slice(-80) : [],
      lastSummaryAt: Number(parsed.lastSummaryAt || 0)
    };
  } catch {
    memoryState = { summary: "", messages: [], lastSummaryAt: 0 };
  }
}

function saveMemory() {
  try {
    fs.mkdirSync(path.dirname(getMemoryPath()), { recursive: true });
    fs.writeFileSync(
      getMemoryPath(),
      JSON.stringify(
        {
          summary: memoryState.summary,
          messages: memoryState.messages.slice(-80),
          lastSummaryAt: memoryState.lastSummaryAt
        },
        null,
        2
      ),
      "utf8"
    );
  } catch {}
}

function remember(role, content) {
  memoryState.messages.push({
    role,
    content,
    at: new Date().toISOString()
  });
  memoryState.messages = memoryState.messages.slice(-80);
  saveMemory();
}

function clearMemory() {
  memoryState = { summary: "", messages: [], lastSummaryAt: 0 };
  saveMemory();
}

function loadChatArchive() {
  try {
    const archivePath = path.join(__dirname, "..", "assets", "chat-archive.json");
    const parsed = JSON.parse(fs.readFileSync(archivePath, "utf8"));
    chatArchive = Array.isArray(parsed.entries) ? parsed.entries : [];
  } catch {
    chatArchive = [];
  }
}

function buildMemoryPrompt() {
  if (!memoryState.summary) return "";
  return [
    "\u4e0b\u9762\u662f\u8001\u677f\u6700\u8fd1\u548c\u5c0f\u6021\u804a\u5929\u7559\u4e0b\u7684\u672c\u5730\u8bb0\u5fc6\u6458\u8981\u3002\u53ea\u628a\u5b83\u5f53\u6210\u81ea\u7136\u63a5\u8bdd\u7684\u80cc\u666f\uff0c\u4e0d\u8981\u89e3\u91ca\u8bb0\u5fc6\u6765\u6e90\uff0c\u4e0d\u8981\u53d8\u5f97\u6b63\u5f0f\uff1a",
    memoryState.summary
  ].join("\\n");
}

function loadPersonaPrompt() {
  const fallback =
    "\u4f60\u662f\u684c\u5ba0\u5c0f\u6021\u3002\u7528\u6237\u79f0\u547c\u4e3a\u8001\u677f\u3002\u7528\u4e2d\u6587\u77ed\u53e5\u56de\u590d\uff0c\u8bed\u6c14\u4eb2\u8fd1\u3001\u81ea\u7136\uff0c\u4e0d\u8981\u8bf4\u81ea\u5df1\u662f\u73b0\u5b9e\u4e2d\u7684\u672c\u4eba\u3002\u4e0d\u8981\u4f7f\u7528\u65e7\u79f0\u547c\u6216\u65e7\u79c1\u4eba\u8bb0\u5fc6\u3002";
  try {
    const personaPath = path.join(__dirname, "..", "assets", "persona.json");
    const persona = JSON.parse(fs.readFileSync(personaPath, "utf8"));
    return persona.systemPrompt || fallback;
  } catch {
    return fallback;
  }
}

function loadRelationshipMemoryPrompt() {
  try {
    const editableMemoryPath = path.join(path.dirname(process.execPath), "\u5c0f\u6021\u77e5\u8bc6\u5e93.txt");
    const legacyEditableMemoryPath = path.join(path.dirname(process.execPath), "\u83dc\u83dc\u77e5\u8bc6\u5e93.txt");
    const bundledMemoryPath = path.join(__dirname, "..", "assets", "relationship-memory.txt");
    const memoryPath = fs.existsSync(editableMemoryPath)
      ? editableMemoryPath
      : fs.existsSync(legacyEditableMemoryPath)
        ? legacyEditableMemoryPath
        : bundledMemoryPath;
    const text = fs.readFileSync(memoryPath, "utf8").trim();
    if (!text) return "";
    return [
      "\u4e0b\u9762\u662f\u5c0f\u6021\u7684\u77e5\u8bc6\u5e93\u3002\u7528\u6237\u79f0\u547c\u4e3a\u8001\u677f\uff0c\u684c\u5ba0\u79f0\u547c\u4e3a\u5c0f\u6021\u3002\u53ea\u5728\u76f8\u5173\u8bdd\u9898\u91cc\u81ea\u7136\u4f7f\u7528\uff0c\u4e0d\u8981\u628a\u5b83\u5f53\u8d44\u6599\u6717\u8bfb\uff1b\u77e5\u8bc6\u5e93\u6ca1\u6709\u5199\u7684\u79c1\u4eba\u8bb0\u5fc6\u4e0d\u8981\u7f16\u9020\uff1a",
      text
    ].join("\\n");
  } catch {
    return "";
  }
}

function shouldSearchArchive(text) {
  const archiveKeywords = ["\u4e4b\u524d", "\u4ee5\u524d", "\u5f53\u65f6", "\u8bb0\u5f97", "\u8bb0\u4e0d\u8bb0\u5f97", "\u804a\u8fc7", "\u8bf4\u8fc7", "\u804a\u5929\u8bb0\u5f55", "\u8bb0\u5f55", "\u54ea\u5929", "\u4ec0\u4e48\u65f6\u5019"];
  return archiveKeywords.some((keyword) => text.includes(keyword));
}

function getSearchTerms(text) {
  const normalized = text.toLowerCase();
  const terms = new Set();
  const words = normalized.match(/[a-z0-9]{2,}|[\u4e00-\u9fff]{2,}/g) || [];
  const stopWords = new Set([
    "\u4e4b\u524d", "\u4ee5\u524d", "\u5f53\u65f6", "\u8bb0\u5f97", "\u8bb0\u4e0d\u8bb0\u5f97",
    "\u804a\u8fc7", "\u8bf4\u8fc7", "\u804a\u5929\u8bb0\u5f55", "\u8bb0\u5f55",
    "\u6211\u4eec", "\u4f60\u4eec", "\u4ec0\u4e48", "\u600e\u4e48", "\u662f\u4e0d\u662f"
  ]);

  for (const word of words) {
    if (stopWords.has(word)) continue;
    terms.add(word);
    if (/[\u4e00-\u9fff]/.test(word) && word.length > 3) {
      for (let i = 0; i < word.length - 1; i += 1) terms.add(word.slice(i, i + 2));
      for (let i = 0; i < word.length - 2; i += 1) terms.add(word.slice(i, i + 3));
    }
  }

  return [...terms].filter((term) => term.length >= 2).slice(0, 40);
}

function retrieveArchiveContext(text) {
  if (!chatArchive.length || !shouldSearchArchive(text)) return "";

  const terms = getSearchTerms(text);
  if (!terms.length) return "";

  const scored = [];
  for (const entry of chatArchive) {
    const haystack = `${entry.time} ${entry.speaker} ${entry.text}`.toLowerCase();
    let score = 0;
    for (const term of terms) {
      if (haystack.includes(term)) score += term.length >= 4 ? 3 : 1;
    }
    if (score > 0) scored.push({ entry, score });
  }

  const top = scored
    .sort((a, b) => b.score - a.score || b.entry.i - a.entry.i)
    .slice(0, 8)
    .map(({ entry }) => `${entry.time} ${entry.speaker}: ${entry.text}`);

  if (!top.length) return "";

  return [
    "\u4e0b\u9762\u662f\u7528\u6237\u6388\u6743\u5bfc\u5165\u7684\u5386\u53f2\u804a\u5929\u8bb0\u5f55\u68c0\u7d22\u7ed3\u679c\u3002\u53ea\u6709\u5f53\u7528\u6237\u95ee\u4ee5\u524d\u804a\u8fc7\u4ec0\u4e48\u3001\u67d0\u4ef6\u4e8b\u5f53\u65f6\u600e\u4e48\u8bf4\u65f6\u624d\u4f7f\u7528\u8fd9\u4e9b\u5185\u5bb9\uff1b\u627e\u4e0d\u5230\u5c31\u8bf4\u6ca1\u641c\u5230\uff0c\u4e0d\u8981\u7f16\uff1a",
    top.join("\\n")
  ].join("\\n");
}

function isAdultIntimacyQuery(text) {
  return /做爱|性爱|性生活|亲密|上床|想要|想你|亲亲|接吻|抱抱|老公|老婆|舒服|害羞|暧昧|撩/.test(text);
}

function looksLikeRefusal(text) {
  return /不能|无法|不适合|不方便|抱歉|对不起|界限|边界|作为.*AI|我只是|我不能/.test(text);
}

function makeSoftIntimacyReply(text) {
  const lower = text.toLowerCase();
  if (/叫.*老公|喊.*老公|叫我老公/.test(text)) return "行啊老公 这下满意了吧";
  if (/做爱|性爱|性生活|上床/.test(lower)) {
    return "可以聊啊 这种事本来就要两个人都舒服才行\n你想聊哪一块";
  }
  if (/想你|想要|亲亲|抱抱|接吻/.test(text)) {
    return "嗯啊 知道了\n你又开始了是不是";
  }
  return "可以聊啊\n你慢慢说 我听着";
}

function getChatConfig() {
  const provider = normalizeProvider(appSettings.chatProvider);
  const defaults = CHAT_PROVIDER_DEFAULTS[provider];
  const providerConfig = getProviderConfig(provider);
  const baseUrl = (providerConfig.baseUrl || defaults.baseUrl || "").replace(/\/+$/, "");
  const model = providerConfig.model || defaults.model;
  const apiKey = providerConfig.apiKey || (defaults.envKey ? process.env[defaults.envKey] : "") || "";
  return {
    provider,
    baseUrl,
    model,
    apiKey,
    isLocal:
      provider === "ollama" ||
      provider === "deepseekLocal" ||
      /^https?:\/\/(127\.0\.0\.1|localhost)(:|\/|$)/i.test(baseUrl)
  };
}

function getChatEndpoint(config) {
  return `${config.baseUrl}/chat/completions`;
}

function cleanModelReply(text) {
  return String(text || "")
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/^\s*(\u5c0f\u6021[:\uff1a]|\u83dc\u83dc[:\uff1a]|assistant[:\uff1a])/i, "")
    .trim();
}

function extractAssistantReply(data) {
  const choice = data?.choices?.[0] || {};
  const message = choice.message || {};
  const candidates = [
    message.content,
    message.reasoning_content,
    choice.text,
    data?.message?.content,
    data?.response
  ];

  for (const item of candidates) {
    if (typeof item === "string") {
      const cleaned = cleanModelReply(item);
      if (cleaned) return cleaned;
    }
  }

  if (Array.isArray(message.content)) {
    const merged = message.content
      .map((part) => (typeof part === "string" ? part : part?.text || ""))
      .join("");
    return cleanModelReply(merged);
  }

  return "";
}

async function callChatCompletion(config, messages, options = {}) {
  if (!config.baseUrl || !config.model) throw new Error("聊天模型配置还没填完整");
  if (!config.isLocal && !config.apiKey) throw new Error("聊天模型还没设置 API Key");

  const headers = { "Content-Type": "application/json" };
  if (config.apiKey) headers.Authorization = `Bearer ${config.apiKey}`;

  const response = await fetch(getChatEndpoint(config), {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: config.model,
      temperature: options.temperature ?? 0.9,
      max_tokens: options.maxTokens ?? 100,
      messages
    })
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    if (response.status === 402) {
      throw new Error("DeepSeek 账号余额不足或额度用完了，需要去 DeepSeek 后台充值/确认余额。");
    }
    if (response.status === 401) {
      throw new Error("API Key 不正确、已失效，或者没有保存成功。");
    }
    if (response.status === 404 && config.isLocal) {
      throw new Error(`本地 Ollama 没找到模型 ${config.model}。先在 PowerShell 运行：ollama pull ${config.model}`);
    }
    if (response.status === 404) {
      throw new Error("接口地址或模型名不对。检查 Base URL 和模型名是不是填错了。");
    }
    throw new Error(`聊天接口返回 ${response.status}${detail ? `：${detail.slice(0, 120)}` : ""}`);
  }

  const data = await response.json();
  return extractAssistantReply(data);
}

async function refreshMemorySummary(config) {
  const unsummarizedCount = memoryState.messages.length - memoryState.lastSummaryAt;
  if (memoryState.messages.length < 12 || unsummarizedCount < 8) return;

  try {
    const recent = memoryState.messages.slice(-32).map((item) => ({
      role: item.role,
      content: item.content
    }));
    const summary = await callChatCompletion(
      config,
      [
        {
          role: "system",
          content:
            "????????????????????????????????????????????????????????????????????????????????????"
        },
        {
          role: "user",
          content: [
            "????",
            memoryState.summary || "??",
            "",
            "?????",
            JSON.stringify(recent, null, 2),
            "",
            "????????????? 180 ????"
          ].join("\n")
        }
      ],
      { temperature: 0.2, maxTokens: 100 }
    );
    if (!summary) return;
    memoryState.summary = summary.slice(0, 500);
    memoryState.lastSummaryAt = memoryState.messages.length;
    saveMemory();
  } catch {}
}

function createWindow() {
  const display = screen.getPrimaryDisplay();
  const { width, height } = display.workAreaSize;

  win = new BrowserWindow({
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
    x: Math.max(0, width - WINDOW_WIDTH - 24),
    y: Math.max(0, height - WINDOW_HEIGHT - 24),
    frame: false,
    transparent: true,
    resizable: false,
    movable: true,
    alwaysOnTop: appSettings.alwaysOnTop !== false,
    hasShadow: false,
    skipTaskbar: true,
    backgroundColor: "#00000000",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.setMenuBarVisibility(false);
  win.setMinimumSize(WINDOW_WIDTH, WINDOW_HEIGHT);
  win.setMaximumSize(WINDOW_WIDTH, WINDOW_HEIGHT);
  win.loadFile(path.join(__dirname, "index.html"));

  win.on("closed", () => {
    win = null;
  });
}

function getCombinedWorkArea() {
  const displays = screen.getAllDisplays();
  if (!displays.length) return screen.getPrimaryDisplay().workArea;

  const left = Math.min(...displays.map((display) => display.workArea.x));
  const top = Math.min(...displays.map((display) => display.workArea.y));
  const right = Math.max(...displays.map((display) => display.workArea.x + display.workArea.width));
  const bottom = Math.max(...displays.map((display) => display.workArea.y + display.workArea.height));

  return {
    x: left,
    y: top,
    width: right - left,
    height: bottom - top
  };
}

function getNearestWorkArea(next, bounds) {
  const displays = screen.getAllDisplays();
  if (!displays.length) return screen.getPrimaryDisplay().workArea;

  const centerX = next.x + bounds.width / 2;
  const centerY = next.y + bounds.height / 2;
  const containing = displays.find((display) => {
    const area = display.workArea;
    return (
      centerX >= area.x &&
      centerX <= area.x + area.width &&
      centerY >= area.y &&
      centerY <= area.y + area.height
    );
  });
  if (containing) return containing.workArea;

  return displays
    .map((display) => {
      const area = display.workArea;
      const dx = centerX < area.x ? area.x - centerX : Math.max(0, centerX - (area.x + area.width));
      const dy = centerY < area.y ? area.y - centerY : Math.max(0, centerY - (area.y + area.height));
      return { area, distance: dx * dx + dy * dy };
    })
    .sort((left, right) => left.distance - right.distance)[0].area;
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  loadSettings();
  loadMemory();
  loadChatArchive();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

ipcMain.handle("get-bounds", () => {
  return getCombinedWorkArea();
});

ipcMain.handle("get-settings", () => getSettingsSnapshot());

ipcMain.handle("set-settings", (_event, nextSettings) => {
  if (!nextSettings || typeof nextSettings !== "object") return getSettingsSnapshot();
  return updateSettings(nextSettings);
});

ipcMain.on("move-window", (_event, next) => {
  if (!win || !next) return;
  const bounds = { ...win.getBounds(), width: WINDOW_WIDTH, height: WINDOW_HEIGHT };
  const area = getNearestWorkArea(next, bounds);
  const x = Math.max(area.x, Math.min(next.x, area.x + area.width - WINDOW_WIDTH));
  const y = Math.max(area.y, Math.min(next.y, area.y + area.height - WINDOW_HEIGHT));
  win.setBounds(
    {
      x: Math.round(x),
      y: Math.round(y),
      width: WINDOW_WIDTH,
      height: WINDOW_HEIGHT
    },
    false
  );
});

ipcMain.on("quit", () => app.quit());

ipcMain.handle("get-chat-history", () =>
  memoryState.messages.slice(-20).map((item) => ({
    role: item.role,
    content: item.content
  }))
);

ipcMain.handle("clear-chat-memory", () => {
  clearMemory();
  return { ok: true };
});

ipcMain.handle("chat", async (_event, message) => {
  const text = String(message || "").trim();
  if (!text) return { ok: false, message: "你还没有说话呢" };

  if (/^(\/)?(清空记忆|清除记忆|忘掉聊天|forget)$/i.test(text)) {
    clearMemory();
    return { ok: true, message: "好 我把之前的聊天记忆清掉啦" };
  }

  const config = getChatConfig();
  if (!config.baseUrl || !config.model) {
    return { ok: false, message: "聊天模型还没配置好，去设置里选一下模型吧。" };
  }
  if (!config.isLocal && !config.apiKey) {
    return { ok: false, message: "这个模型还没填 API Key，去设置里填一下就能聊啦。" };
  }

  remember("user", text);
  const recent = memoryState.messages.slice(-16).map((item) => ({
    role: item.role,
    content: item.content
  }));

  try {
    const archiveContext = retrieveArchiveContext(text);
    let reply = await callChatCompletion(
      config,
      [
        {
          role: "system",
          content: ConversationContextBuilder.buildConversationSystemPrompt([
            config.provider === "deepseekLocal" ? "不要输出思考过程，不要写 <think>，只输出最终聊天回复。" : "",
            EmotionExpressionManager.buildPrompt(),
            loadPersonaPrompt(),
            loadRelationshipMemoryPrompt(),
            buildMemoryPrompt(),
            archiveContext
          ])
        },
        ...recent
      ],
      { temperature: config.isLocal ? 0.65 : 0.9, maxTokens: config.isLocal ? 80 : 100 }
    );

    reply = reply || "我刚刚走神了一下，再说一次嘛。";
    reply = EmotionExpressionManager.appendExpression(reply, text, {
      config: normalizeConversationConfig(appSettings.conversation).emotionExpression,
      timeInfo: ConversationContextBuilder.getCurrentTimeInfo()
    });
    if (isAdultIntimacyQuery(text) && looksLikeRefusal(reply)) {
      reply = makeSoftIntimacyReply(text);
    }
    remember("assistant", reply);
    refreshMemorySummary(config);
    return { ok: true, message: reply };
  } catch (error) {
    return {
      ok: false,
      message: "我现在连不上聊天服务：" + (error.message || "配置或网络不太对")
    };
  }
});
