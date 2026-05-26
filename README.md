# 小怡桌宠

小怡桌宠是一款基于 Electron 的 Windows 桌面陪伴应用。她会以透明悬浮窗的形式停留在桌面上，支持拖拽、动作切换、随机气泡、时间提醒和 AI 聊天，也可以通过外置知识库自定义长期记忆与对话风格。

## 功能介绍

- 透明无边框桌宠窗口，支持拖拽移动。
- 支持双屏工作区适配，拖动时尽量避免窗口跑出屏幕或被异常拉伸。
- 支持始终置顶开关。
- 支持开机自启动开关。
- 启动后可随机打招呼。
- 单击桌宠触发互动动作。
- 双击桌宠打开聊天框。
- 长按拖动时播放拖拽动作。
- 聊天框、设置菜单和动作菜单支持鼠标移出后自动隐藏。
- 长时间未操作会进入休眠或自然待机状态。
- 支持随机气泡互动语言。
- 支持时间感知提醒，按早晨、上午、中午、下午、晚上、深夜调整话术。
- 支持 AI 聊天、聊天历史记忆和清除聊天记录。
- 支持 OpenAI、DeepSeek、Ollama、本地兼容 OpenAI 格式的模型服务。
- 支持为不同模型保存 API 配置。
- 支持外置知识库 `小怡知识库.txt`。
- 支持颜文字/表情表达，让回复更自然。

## 动作系统

当前桌宠包含 9 类核心动作：

- 弹唱待机
- 工作
- 睡觉
- 醒来
- 向左走
- 向右走
- 飞吻
- 拖拽
- 拥抱

动作会在用户互动、随机待机、时间提醒和聊天回复中触发。

## 下载与运行

如果你只是想使用桌宠，推荐下载 Release 中的 Windows 便携版压缩包：

```text
xiaoyi-desktop-pet-windows-x64-portable.zip
```

解压后运行：

```text
小怡桌宠.exe
```

请不要只单独复制 exe 文件，运行时需要保留同目录下的 `resources`、`locales`、dll、pak 等文件。

## 本地开发

安装依赖：

```bash
npm install
```

启动开发版：

```bash
npm start
```

打包 Windows x64 便携目录：

```bash
npx electron-builder --win dir --x64 --config.win.signAndEditExecutable=false
```

构建完成后，产物通常位于：

```text
dist/win-unpacked/
```

## AI 模型配置

打开桌宠设置菜单后，可以配置聊天模型。

### OpenAI

- Provider 选择 `OpenAI`
- Base URL 通常使用：

```text
https://api.openai.com/v1
```

- Model 填写你要使用的模型名。
- API Key 填写自己的 OpenAI API Key。

### DeepSeek 官方 API

- Provider 选择 `DeepSeek`
- Base URL 通常使用：

```text
https://api.deepseek.com
```

- Model 可填写：

```text
deepseek-chat
```

- API Key 填写自己的 DeepSeek API Key。

如果返回 402，通常代表账号余额不足或额度不可用。

### Ollama 本地模型

先安装 Ollama，然后拉取模型，例如：

```bash
ollama pull qwen2.5:7b
```

设置中选择 `Ollama`，Base URL 使用：

```text
http://127.0.0.1:11434/v1
```

Model 填写本地模型名，例如：

```text
qwen2.5:7b
```

本地模型不需要 API Key。

### 自定义兼容接口

如果你有兼容 OpenAI Chat Completions 格式的服务，可以选择自定义接口，并填写：

- Base URL
- Model
- API Key，可选

接口路径会按以下格式请求：

```text
{Base URL}/chat/completions
```

## 知识库填写

桌宠会优先读取可执行文件同目录下的：

```text
小怡知识库.txt
```

如果没有这个文件，则读取打包内置的：

```text
assets/relationship-memory.txt
```

修改知识库后，重启桌宠生效。

### 建议写什么

知识库适合写稳定、长期有效的信息：

- 用户希望桌宠如何称呼自己。
- 桌宠的名字、人设和说话风格。
- 用户偏好，例如回复长短、是否喜欢提醒、是否喜欢表情。
- 重要长期记忆，例如正在做的项目、固定习惯、常见压力。
- 禁止使用的内容，例如不要引用某些旧设定或旧记忆。

### 不建议写什么

- 不要把整段聊天记录原样粘进去。
- 不要写太多临时情绪。
- 不要写不希望模型长期记住的敏感隐私。
- 不要写互相矛盾的设定。

### 示例

```text
## 身份边界
- 用户称呼：老板
- 桌宠称呼：小怡
- 小怡是桌面陪伴助手，不是现实中的某个人。

## 用户偏好
- 老板喜欢简短自然的回复。
- 老板问技术问题时，希望回答清楚，不要过度卖萌。

## 对话风格
- 回复要像日常聊天，不要像正式报告。
- 不要每句话都叫“老板”。
```

## 聊天历史记忆

运行时聊天记忆保存在用户数据目录中，Windows 下通常是：

```text
C:\Users\<你的用户名>\AppData\Roaming\小怡桌宠\xiaoyi-memory.json
```

设置菜单里可以清除聊天记录。清除后，小怡会按新的聊天重新开始，不读取之前的运行时记忆。

## 项目结构

```text
assets/                 桌宠图集、内置知识库、persona 和空聊天归档
src/                    Electron 主进程、预加载脚本、渲染层和样式
小怡知识库.txt           可编辑的外置知识库模板
package.json            项目配置和打包配置
package-lock.json        依赖锁定文件
```

## 发布说明

普通 GitHub 仓库不建议直接提交打包 zip，因为便携包包含 Electron 运行时，体积较大。推荐：

1. 仓库中保存源码和知识库模板。
2. 在 GitHub Release 中上传 `xiaoyi-desktop-pet-windows-x64-portable.zip`。

## 许可证

当前项目未设置开源许可证。公开发布前，请根据你的需求选择合适的许可证。
