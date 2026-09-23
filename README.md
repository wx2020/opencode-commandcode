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

## 🚀 跨设备安装与正确配置方案 (Installation & Setup)

### 1. 插件配置（全局 `~/.config/opencode/opencode.json` 或 `opencode.jsonc`）

**正确写法（官方推荐，首选）：**
```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": [
    "github:wx2020/opencode-commandcode"
  ]
}
```

**钉版本（可选，注意缓存目录会带 `#`）：**
```jsonc
{
  "plugin": [
    "github:wx2020/opencode-commandcode#v1.0.7"
  ]
}
```

> [!CAUTION]
> **常见错误写法（踩坑预警）：**
> ```jsonc
> "plugin": ["opencode-commandcode@github:wx2020/opencode-commandcode#v1.0.7"]  // ✗ 错误写法，请勿添加别名前缀
> ```

**核心要点：**
- 必须是 **`github:owner/repo`**，不要带 `包名@github:...`；
- 首选**不带 `#tag`**，少一个带有 `#` 特殊字符的本地缓存路径坑；
- 严禁使用 `file://` 绕过（确保插件规范化安装与加载）。

---

### 2. API Key 配置（三选一，优先级从高到低）

1. **推荐：命令行交互式登录**
   ```bash
   opencode auth login
   ```
   在终端选项中选择 **`CommandCode Studio API Key (GOAT Plan)`**，粘贴您的 `user_...` 密钥。
2. **环境变量**：
   ```bash
   # Bash / Zsh
   export CMD_API_KEY="user_..."       # 或 COMMANDCODE_API_KEY

   # PowerShell
   $env:CMD_API_KEY="user_..."
   ```
3. **已有凭据直接继承**：
   已在 `~/.local/share/opencode/auth.json` 中配置过 `commandcode` 的设备，安装后直接继承已有 key，无需重复输入。

---

### 3. 安装后自检与验证

```bash
# 1. 检查插件缓存主包（路径里可能含 #tag）
ls ~/.cache/opencode/packages/github:wx2020/opencode-commandcode*/node_modules/opencode-commandcode/package.json

# 2. 检查配置与 Provider 是否成功注册
opencode models commandcode
# 或通过 HTTP 接口检查 GET /config → 确认 provider.commandcode 及其 18 款模型非空
```

> [!TIP]
> **排查日志提醒**：如果终端出现 `Failed to install plugin` 错误，该错误**只记录进 OpenCode `Session.Error` 事件中，不会写入普通的 `opencode.log` 文件**，排查时切勿只盯文件日志。

---

### 4. 改动插件字段后必须重启客户端

OpenCode **不热载**全局 config（会无限期内存缓存）。修改 `opencode.json` / `opencode.jsonc` 之后：
- **OpenChamber 用户**：在 `Settings` 中点击重启 managed OpenCode，或请求 `POST /api/config/reload`（会触发子进程重启）；
- **独立 OpenCode CLI/TUI 用户**：完全退出终端进程后重新启动。

---

### 5. 若安装卡死或缓存残缺的恢复方法

```bash
# 清掉该插件的本地缓存目录后重启 opencode
rm -rf ~/.cache/opencode/packages/github:wx2020
```

> [!WARNING]
> **切忌在 OpenCode 正在安装时执行 `rm -rf` 缓存**，否则会引发读写竞态导致缓存文件损坏残缺。

---

### 📌 一句话快速清单

```text
plugin: ["github:wx2020/opencode-commandcode"]
key:    opencode auth login → CommandCode，或 CMD_API_KEY
然后:   重启 OpenCode / OpenChamber
验:     /config 或 opencode models commandcode 确认 18 个模型完整加载
```

---

## 📋 内置精选主力模型矩阵 (18 Curated Models)

| 层级分类 | 模型唯一 ID (Model ID) | 显示名称 (Display Name) | 上下文 (Context) | 最大输出容量 (Output) | 支持深度推理 |
|---|---|---|---|---|:---:|
| **🏆 高配额主力** | `deepseek/deepseek-v4.1-flash` | **DeepSeek V4.1 Flash** | 1,000,000 | **384,000** | ✅ (`low`, `high`, `max`) |
| *(配额 $\ge 4000$)* | `xiaomi/mimo-v2.6-flash` | **MiMo V2.6 Flash** | 1,048,576 | 131,072 | ✅ (`high`) |
| *(按配额降序)* | `meta/muse-spark-1.3-contributor` | **Muse Spark 1.3 Contributor** | 1,048,576 | 943,718 | ✅ (`low`, `high`, `max`) |
| | `meituan/LongCat-2.0` | **LongCat 2.0** | **2,000,000** | 262,144 | ❌ 标准输出 |
| | `tencent/hy3-paid` | **Tencent Hy3** | 256,000 | 64,000 | ✅ (`low`, `high`) |
| | `xiaomi/mimo-v2.6-pro` | **MiMo V2.6 Pro** | 1,048,576 | 131,072 | ✅ (`high`) |
| | `Qwen/Qwen3.8-27B` | **Qwen 3.8 27B** | 128,000 | 131,072 | ✅ (`low`, `high`, `max`) |
| | `z-ai/glm-5.3-flash` | **GLM 5.3 Flash** | 1,048,576 | 131,072 | ✅ (`low`, `high`, `max`) |
| | `Qwen/Qwen3.8-Omni-Flash` | **Qwen 3.8 Omni Flash** | 1,000,000 | 131,072 | ✅ (`low`, `high`, `max`) |
| | `stepfun/Step-3.5-Flash` | **Step 3.5 Flash** | 256,000 | 262,144 | ✅ (`low`, `high`) |
| | `gpt-5.6-luna` | **GPT-5.6 Luna** | 1,050,000 | 128,000 | ✅ (`low`, `high`, `max`) |
| | `MiniMaxAI/MiniMax-M3` | **MiniMax M3** | 1,000,000 | **1,048,576** | ✅ (`low`, `high`, `max`) |
| ── | ────────────────────────────────── | ───────────────────────────── | ─────────── | ─────────── | ─── |
| **🎁 免费双保底** | `poolside/laguna-s-2.1-free` | **Laguna S 2.1 (Free)** | 256,000 | 32,768 | ✅ (`low`, `high`) |
| *(Zero-Cost)* | `inclusionai/ling-3.0-flash-sante:free` | **Ling 3.0 Flash Sante (Free)** | 262,144 | 4,096 | ✅ (`low`, `high`) |
| ── | ────────────────────────────────── | ───────────────────────────── | ─────────── | ─────────── | ─── |
| **🔍 跨厂对比** | `moonshotai/Kimi-K2.7-Code` | **Kimi K2.7 Code** | 256,000 | 262,144 | ✅ (`low`, `high`) |
| *(各厂限 1 款)* | `google/gemini-3.8-flash` | **Gemini 3.8 Flash** | 1,000,000 | 65,536 | ✅ (`low`, `high`, `max`) |
| *(按配额降序)* | `thinkingmachines/inkling-small` | **Inkling Small** | 128,000 | 32,768 | ✅ (`low`, `high`) |
| | `xai/grok-4.6` | **Grok 4.6** | 128,000 | 32,768 | ✅ (`low`, `high`) |

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
│   ├── install.js           # 跨平台一键部署脚本
│   ├── sync-models.ts       # CommandCode 与 models.dev 模型实时同步脚本
│   └── release.ts           # 自动版本递增、测试打包与 GitHub Release 发布脚本
├── test/
│   └── index.test.ts        # 完整单元测试集
├── index.ts                 # 插件主入口 (Default Export Hooks)
├── package.json
└── tsconfig.json
```

---

## 🤖 自动化模型同步与发版机制 (Continuous Sync & Release)

本项目配置了端到端的 **模型自动探测与版本自动发布流水线**（GitHub Actions [`.github/workflows/auto-release.yml`](.github/workflows/auto-release.yml)）：

1. **自动巡检与数据融合**：
   - 定时从 `api.commandcode.ai/provider/v1/models` 抓取最新支持模型；
   - 自动关联 `models.dev` 补齐真实的 384k 输出上限、多模态支持与 reasoning effort 分级档位。
2. **自动化触发源**：
   - **每日自动定时任务**：每日 UTC 00:00 自动比对上游更新；
   - **手动一键触发 (Workflow Dispatch)**：支持在 GitHub 仓库界面随时点击 `Run workflow` 触发；
   - **推送触发**：修改 `lib/models.ts` 推送至 `main` 分支时自动触发。
3. **全自动发版闭环**：
   检测到变动 -> 重新生成模型代码 -> 递增语义化版本号 -> 运行测试与产物编译 -> 创建 Git Tag -> 自动发布官方 GitHub Release 并上传独立资产包。

---

## 🛠️ 本地开发与测试

```bash
# 运行单元测试
bun test

# 检查/同步最新 CommandCode 模型矩阵
bun run sync-models

# 执行自动化版本发布流水线 (测试 + 打包 + 打 Tag + 发布)
bun run release

# 构建产物
bun run build

# 类型检查
bun run typecheck
```

---

## 📄 开源许可证

本项目基于 [MIT 许可证](LICENSE) 开源。
