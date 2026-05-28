# 小怡桌宠

小怡桌宠是一款 Windows 桌面陪伴应用。她会以透明悬浮窗的形式停留在桌面上，支持动作切换、随机气泡、时间提醒、AI 聊天、知识库自定义和开机自启动。

## 直接下载运行

如果只是想使用桌宠，推荐直接下载整个仓库：

1. 点击 GitHub 页面右上角绿色 `Code`。
2. 选择 `Download ZIP`。
3. 解压后打开：

```text
windows-portable/xiaoyi-desktop-pet-v1.0.0-win-portable.exe
```

同目录下已经放好了：

```text
windows-portable/小怡知识库.txt
```

这个文件就是桌宠会读取的外置知识库。修改后重启桌宠即可生效。

## 便携包内容

```text
windows-portable/
  xiaoyi-desktop-pet-v1.0.0-win-portable.exe  Windows 便携版桌宠
  小怡知识库.txt                               可编辑知识库
  使用说明.txt                                简短使用说明
```

便携版 exe 已经包含 Electron 运行环境，普通用户不需要安装 Node.js、Electron 或开发依赖。

## 主要功能

- 透明悬浮桌宠窗口。
- 支持拖拽移动和双屏工作区适配。
- 支持始终置顶开关。
- 支持开机自启动开关。
- 启动后随机问候。
- 单击触发互动动作。
- 双击打开聊天框。
- 长按拖动时播放拖拽动作。
- 聊天框、设置菜单、动作菜单支持鼠标移出后自动隐藏。
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

## 知识库填写

知识库文件路径：

```text
windows-portable/小怡知识库.txt
```

知识库适合填写长期稳定的信息，例如：

- 用户希望桌宠怎么称呼自己。
- 桌宠自己的昵称。
- 用户偏好的回复风格。
- 用户喜欢或不喜欢的事情。
- 需要桌宠记住的长期背景。
- 不希望桌宠触碰的话题边界。

不建议写入：

- 临时聊天内容。
- 密码、令牌、身份证号等敏感信息。
- 不希望被 AI 请求读取的隐私内容。

修改知识库后，请重启桌宠。

## AI 模型配置

打开桌宠设置菜单后，可以配置聊天模型。

### OpenAI

```text
Provider: OpenAI
Base URL: https://api.openai.com/v1
Model: 你要使用的模型名
API Key: 你的 OpenAI API Key
```

### DeepSeek 官方 API

```text
Provider: DeepSeek
Base URL: https://api.deepseek.com
Model: deepseek-chat
API Key: 你的 DeepSeek API Key
```

如果返回 `402`，通常代表账号余额不足或额度不可用。

### Ollama 本地模型

先安装并启动 Ollama，然后在设置中填写：

```text
Provider: Ollama
Base URL: http://127.0.0.1:11434/v1
Model: 本地模型名，例如 qwen2.5:7b
API Key: 可留空或填写任意文本
```

### 自定义兼容 OpenAI 的服务

```text
Provider: Custom
Base URL: 你的服务地址
Model: 服务支持的模型名
API Key: 服务需要的 Key
```

## 聊天记忆位置

桌宠的聊天记忆和设置不会写入仓库目录，而是保存在系统用户数据目录中：

```text
%APPDATA%/小怡桌宠/xiaoyi-memory.json
%APPDATA%/小怡桌宠/xiaoyi-settings.json
```

在聊天框或设置中清除聊天记录后，会重置本地聊天记忆。

## 本地开发

安装依赖：

```bash
npm install
```

启动开发版：

```bash
npm start
```

打包 Windows 便携版：

```bash
npx electron-builder --win portable --x64 --config.win.signAndEditExecutable=false
```

打包 Windows 解压目录：

```bash
npm run pack:win
```

## 发布说明

当前仓库同时提供：

- 源码。
- 可编辑知识库模板。
- `windows-portable/` 目录下的 Windows 便携版 exe。
- GitHub Release 中的单独 exe 下载。

普通用户可以直接下载仓库 ZIP 使用；开发者可以克隆源码后自行运行或打包。
