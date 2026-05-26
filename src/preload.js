const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("petHost", {
  getBounds: () => ipcRenderer.invoke("get-bounds"),
  getSettings: () => ipcRenderer.invoke("get-settings"),
  setSettings: (settings) => ipcRenderer.invoke("set-settings", settings),
  getChatHistory: () => ipcRenderer.invoke("get-chat-history"),
  clearChatMemory: () => ipcRenderer.invoke("clear-chat-memory"),
  chat: (message) => ipcRenderer.invoke("chat", message),
  moveWindow: (position) => ipcRenderer.send("move-window", position),
  quit: () => ipcRenderer.send("quit")
});
