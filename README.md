# opencode-commandcode

<p align="center">
  <a href="https://github.com/wx2020/opencode-commandcode/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/wx2020/opencode-commandcode/ci.yml?branch=main&label=CI&style=flat-square" alt="CI Status"></a>
  <a href="https://github.com/wx2020/opencode-commandcode/blob/main/LICENSE"><img src="https://img.shields.io/github/license/wx2020/opencode-commandcode?style=flat-square" alt="License"></a>
  <a href="https://github.com/wx2020/opencode-commandcode"><img src="https://img.shields.io/badge/OpenCode-Plugin%20V1-blue?style=flat-square" alt="OpenCode Plugin V1"></a>
  <a href="https://github.com/wx2020/opencode-commandcode"><img src="https://img.shields.io/badge/Output-384k-orange?style=flat-square" alt="384k Output"></a>
</p>

> 标准化 OpenCode Provider 与 Auth 插件，专为 **CommandCode AI (GOAT 算力计划)** 深度定制。参照社区经典规范 [`numman-ali/opencode-openai-codex-auth`](https://github.com/numman-ali/opencode-openai-codex-auth) 的解耦与分发架构构建。

---

## 🌟 核心特性

- 🚀 **超高输出容量**：官方实测支持 **384,000 token 输出**（如 `deepseek-v4.1-flash`），远超一般网关 8k/64k 限制。
- 🧠 **真实推理强度控制 (Reasoning Effort)**：对齐 models.dev 真实能力，支持 `low` / `medium` / `high` / `max` 灵活切换。
- 🔒 **安全与零数据驻留 (Zero Data Retention)**：按需支持 `x-cmd-zdr: 1`，避免对无 ZDR 支持模型的错误拦截。
- 📦 **开箱即用零配置**：内置 14 款高性价比主力模型定义，无需在客户端手动维护繁杂的 JSON 参数。
- 🛠️ **多端无缝部署**：支持 GitHub 协议直接引入、一键脚本自动注入与 NPM 包分发。

---

## 🚀 快速部署与使用 (Installation & Deployment)

### 方式 A：GitHub 直接引用 (最推荐，即开即用)

无需本地打包或预装任何包，只需在全局配置文件 `~/.config/opencode/opencode.jsonc`（Windows 下为 `%USERPROFILE%\.config\opencode\opencode.jsonc`）中添加一行：

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": [
    "github:wx2020/opencode-commandcode"
  ]
}
```
OpenCode 启动时将自动下载并挂载本插件。

---

### 方式 B：一键自动化安装脚本 (Zero Config)

克隆本项目后，在仓库根目录下运行：

```bash
# Node.js 或 Bun 均可执行
node ./scripts/install.js
# 或
bun ./scripts/install.js
```
该脚本会自动查找您系统中的 `opencode.jsonc` 并将插件自动注入到 `plugin` 列表中。

---

### 方式 C：本地克隆/子模块引用

在您本地的 `opencode.jsonc` 中直接指定本地路径：

```jsonc
{
  "plugin": [
    "./path/to/opencode-commandcode"
  ]
}
```

---

## 🔑 配置 API Key

插件支持以下三种方式提供密钥（优先级从高到低自动解析）：

1. **交互式安全登录 (推荐)**：
   ```bash
   opencode auth login
   ```
   在终端列表中选择 **`CommandCode Studio API Key (GOAT Plan)`**，粘贴您的 Key（如 `user_...`）。密钥将安全保存在本地凭据库中。

2. **环境变量**：
   ```bash
   # Bash / Zsh
   export CMD_API_KEY="user_your_commandcode_api_key"

   # PowerShell
   $env:CMD_API_KEY="user_your_commandcode_api_key"
   ```

3. **配置文件静态参数**：
   在 `opencode.jsonc` 的 `provider.commandcode.options` 中指定：
   ```jsonc
   {
     "provider": {
       "commandcode": {
         "options": {
           "apiKey": "user_your_commandcode_api_key"
         }
       }
     }
   }
   ```

---

## 📋 内置主力模型矩阵 (Model Capabilities)

| 模型标识 (Model ID) | 最大上下文 (Context) | 最大输出容量 (Output) | 支持推理强度 (Reasoning Effort) |
|---|---|---|---|
| `deepseek/deepseek-v4.1-flash` | 1,000,000 | **384,000** | `low`, `medium`, `high`, `max` |
| `Qwen/Qwen3.8-Omni-Flash` | 1,000,000 | 131,072 | `low`, `medium`, `high`, `max` |
| `z-ai/glm-5.3-flash` | 1,000,000 | 131,072 | `low`, `high`, `max` |
| `xiaomi/mimo-v2.5` | 1,048,576 | 131,072 | `low`, `high` |
| `meituan/LongCat-2.0` | 1,048,576 | 262,144 | *(不支持推理)* |
| `MiniMaxAI/MiniMax-M3` | 524,288 | 131,072 | `low`, `medium`, `high`, `max` |
| `tencent/hy4-preview` | 1,048,576 | 64,000 | `low`, `high` |
| `moonshotai/Kimi-K2.7-Code` | 262,144 | 262,144 | `low`, `medium`, `high` |
| `stepfun/Step-3.7-Flash` | 262,144 | 256,000 | `low`, `medium`, `high` |
| `google/gemini-3.8-flash` | 1,048,576 | 65,536 | `low`, `high`, `max` |
| `gpt-5.6-luna` | 1,050,000 | 128,000 | `low`, `medium`, `high`, `max` |
| `meta/muse-spark-1.3-contributor` | 1,048,576 | 131,072 | `low`, `medium`, `high`, `max` |
| `inclusionai/ling-3.0-flash-sante:free` | 262,144 | 32,768 | *(免费层模型)* |
| `poolside/laguna-s-2.1-free` | 262,144 | 32,768 | `low`, `high` |

---

## 🏗️ 项目架构解析

参照 `opencode-openai-codex-auth` 规范的分层架构：

```text
opencode-commandcode/
├── dist/                    # 预编译分发产物 (ESM Bundle + d.ts)
├── lib/
│   ├── constants.ts         # 统一管理 Base URL (https://api.commandcode.ai/provider/v1)、标头与环境变量
│   ├── types.ts             # 强类型契约 (ModelLimit, Variants 等)
│   ├── models.ts            # 14 款主力模型规格定义
│   ├── auth.ts              # API Key 解析优先级与交互式认证声明
│   └── fetch.ts             # 请求中继、URL 动态重写与安全标头注入器
├── scripts/
│   ├── build.ts             # Bun 构建与类型生成脚本
│   └── install.js           # 跨平台一键部署脚本
├── test/
│   └── index.test.ts        # 完整单元测试集
├── index.ts                 # 插件主入口 (Default Export Hooks)
├── package.json
└── tsconfig.json
```

---

## 🛠️ 本地开发与测试

```bash
# 运行单元测试
bun test

# 构建产物
bun run build

# 类型检查
bun run typecheck
```

---

## 📄 开源许可证

本项目基于 [MIT 许可证](LICENSE) 开源。
