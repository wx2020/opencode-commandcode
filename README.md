# opencode-commandcode

<p align="center">
  <a href="https://github.com/wx2020/opencode-commandcode/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/wx2020/opencode-commandcode/ci.yml?branch=main&label=CI&style=flat-square" alt="CI Status"></a>
  <a href="https://github.com/wx2020/opencode-commandcode/blob/main/LICENSE"><img src="https://img.shields.io/github/license/wx2020/opencode-commandcode?style=flat-square" alt="License"></a>
  <a href="https://github.com/wx2020/opencode-commandcode"><img src="https://img.shields.io/badge/OpenCode-Plugin%20V2-blue?style=flat-square" alt="OpenCode Plugin V2"></a>
  <a href="https://github.com/wx2020/opencode-commandcode"><img src="https://img.shields.io/badge/Output-384k-orange?style=flat-square" alt="384k Output"></a>
</p>

> 标准化 OpenCode Provider 与 Auth 插件，专为 **CommandCode AI (GOAT 算力计划)** 深度定制。参照社区经典规范 [`numman-ali/opencode-openai-codex-auth`](https://github.com/numman-ali/opencode-openai-codex-auth) 的解耦与分发架构构建。

---

## 🌟 核心特性

- 🚀 **超高输出容量**：官方实测支持 **384,000 token 输出**（如 `deepseek-v4.1-flash`），远超一般网关 8k/64k 限制。
- 🧠 **真实推理强度控制 (Reasoning Effort)**：对齐 models.dev 真实能力，支持 `low` / `medium` / `high` / `max` 灵活切换。
- 🔒 **安全与零数据驻留 (Zero Data Retention)**：按需支持 `x-cmd-zdr: 1`，避免对无 ZDR 支持模型的错误拦截。
- 📦 **开箱即用零配置**：内置精选主力模型定义，无需在客户端手动维护繁杂的 JSON 参数。
- 🧩 **运行时注册，不写用户配置**：通过 OpenCode V2 官方 `ctx.provider.transform` / `ctx.integration.transform` 在运行时注册 Provider、模型与认证方式，**从不读写 `opencode.json(c)`**，因此不会与任何其他配置写入方（如 OpenChamber）互相覆盖。
- 🛠️ **多端无缝部署**：支持 GitHub 协议直接引入、一键脚本自动注入与 NPM 包分发。

---

## 🚀 跨设备安装与正确配置方案 (Installation & Setup)

### 1. 安装插件

> [!IMPORTANT]
> V2 的配置键是 **`plugins`（复数）**；V1 的 `plugin` 仅为兼容旧写法。

#### 方案 A（推荐，跨平台可用）：指向本地仓库的绝对路径

```bash
git clone https://github.com/wx2020/opencode-commandcode.git ~/opencode-commandcode
```

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": ["/home/you/opencode-commandcode"]
  // Windows 写 "C:/Users/you/opencode-commandcode"（或 "C:\\Users\\you\\opencode-commandcode"）
}
```

仓库自带 `dist/` 构建产物，克隆后**无需**再执行 `bun run build`。

#### 方案 B：按“已安装包”处理

```text
① 把 dist/ lib/ index.ts package.json 拷到
   ~/.config/opencode/node_modules/opencode-commandcode/
② 新建 ~/.config/opencode/plugins/commandcode.ts：
   import plugin from "opencode-commandcode";
   export default plugin;
```

#### 方案 C：npm registry 规格

若发布到自己的 scope（如 `@yourname/opencode-commandcode`），可直接：

```bash
opencode plugin add @yourname/opencode-commandcode
```

> [!WARNING]
> **`github:` 规格目前在 Windows 上装不上（OpenCode 侧 bug，与本插件无关）**
> `opencode plugin add github:wx2020/opencode-commandcode` 与配置里 `"plugins": ["github:owner/repo"]` 都会失败：
> - `plugin add` → `NpmInstallFailedError: git dep preparation failed`
> - 配置写法 → 插件加载不出来，调用模型时报 `Model unavailable`
>
> 原因：OpenCode V2 改用 npm arborist/pacote 安装 git 依赖，pacote 会在克隆目录里 `spawn("npm", ["install", …])`；而 Windows 上 bare `npm` 是 shell 脚本（`spawn` 报 `ENOENT`），`npm.cmd` 在 Node 20+ 下无 shell 直接 spawn 会报 `EINVAL`，子进程零输出退出，git 准备步骤必然失败。
> 另：npm 上 `opencode-commandcode` 这个名称**已被他人占用**（0.1.0，维护者 dmytrokyrychuk），不要用 `opencode plugin add opencode-commandcode`。

**核心要点（无论选哪种方案）：**
- 不要再用 V1 的 `"plugin": [...]` 键；不要写 `包名@github:...` 这类别名前缀；
- **不要把 provider 写进配置**：自 v1.3.0 起 Provider / 模型 / 认证方式全部在运行时注册；
- 配置里若出现 `provider.commandcode` 或 `providers.commandcode` 都属于 v1.2.0 时代遗留，会遮蔽运行时模型清单，应删除。

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
3. **已有凭据自动继承**：凭据存放于 OpenCode 的 SQLite（`opencode auth list` 显示 `stored`）。从 V1 迁移过来的 `commandcode` 凭据依然有效，无需重新输入——注意 V2 已**不再读取** `~/.local/share/opencode/auth.json`。

---

### 3. 安装后自检与验证

```bash
# 1. 确认插件已被加载（V2）
opencode plugin list

# 2. 确认 Provider / 模型在运行时注册成功（期望 commandcode/... 共 22 个）
opencode models | grep commandcode

# 3. 确认凭据可用
opencode auth list | grep -i "CommandCode"

# 4. 确认配置里没有遗留的 commandcode provider 块（应为 0）
python -c "import json;d=json.load(open('opencode.jsonc'));print(d.get('provider',{}).keys(), d.get('providers',{}).keys())"
```

> [!TIP]
> **排查日志提醒**：如果终端出现 `Failed to install plugin` 错误，该错误**只记录进 OpenCode `Session.Error` 事件中，不会写入普通的 `opencode.log` 文件**，排查时切勿只盯文件日志。

---

### 4. 升级插件后必须重启客户端

OpenCode **不热载**已加载的插件模块（ESM 模块会被进程缓存）。升级 `opencode-commandcode` 版本后：
- **OpenChamber 用户**：在 `Settings` 中重启 managed OpenCode，或请求 `POST /api/config/reload`（会触发子进程重启）；
- **独立 OpenCode CLI/TUI 用户**：执行 `opencode service restart`，或完全退出后重新启动。

> 自 v1.3.0 起插件不再读写配置，因此修改 `lib/models.ts` 之外的运行参数无需再动配置文件；只有**升级插件本身**才需要重启。

---

### 5. 若安装卡死或缓存残缺的恢复方法

- **方案 A/B（本地路径）**：删掉 `plugins` 里那条失效路径、或重命名 `plugins/commandcode.ts`，重启后重新指向新的仓库目录/重新拷贝包即可；
- **方案 C（npm registry）**：清掉该插件的本地缓存后重启 OpenCode：
  ```bash
  rm -rf ~/.cache/opencode/packages/<包名>
  ```

> [!WARNING]
> **切忌在 OpenCode 正在安装时执行 `rm -rf` 缓存**，否则会引发读写竞态导致缓存文件损坏残缺。

---

### 📌 一句话快速清单

```text
装:  git clone 仓库 → 配置里写 "plugins": ["<仓库绝对路径>"]
key: opencode auth login → CommandCode，或 CMD_API_KEY
然后: 重启 OpenCode / OpenChamber
验:  opencode models | grep commandcode（模型由插件在运行时注册，共 22 个）
```

---

## 📋 内置精选模型矩阵 (自动同步)

> 模型清单由 `lib/models.ts` 的筛选引擎每日随上游同步（`bun run sync-models`），下表仅示意当前主力阵容，具体成员以 `opencode models` 输出为准。

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
│   ├── models.ts            # 精选模型规格定义（每日自动同步）
│   ├── provider.ts          # GOAT_MODELS → 运行时 Provider.Info / Model.Info 映射（纯函数）
│   ├── auth.ts              # API Key 解析优先级与交互式认证声明
│   └── fetch.ts             # URL 重写、安全标头注入器（ZDR / stealth 剥离）
├── scripts/
│   ├── build.ts             # Bun 构建与类型生成脚本
│   ├── install.js           # 跨平台一键部署脚本
│   ├── sync-models.ts       # CommandCode 与 models.dev 模型实时同步脚本
│   └── release.ts           # 自动版本递增、测试打包与 GitHub Release 发布脚本
├── test/
│   └── index.test.ts        # 完整单元测试集
├── index.ts                 # 插件主入口（V2 setup：provider / integration / model.request hook）
├── package.json
└── tsconfig.json
```

> **注册流程**：`setup(ctx)` → `ctx.provider.transform`（注册 Provider + 全量模型）→ `ctx.integration.transform`（注册 key/env 认证方式）→ `ctx.session.hook("model.request")`（ZDR 与 stealth 头部处理）。全程零文件写入，可重复执行且无副作用。

---

## 🛡️ 上游瞬时 400 的自动重试（稳定性）

`api.commandcode.ai` 偶发返回 `HTTP 400 {"type":"invalid_request_error"}`：网关把上游（模型后端）的错误原样包了一层，`trace_id` 即响应头 `x-trace-id`。

实测定性（2026-10-14）：这与请求体积/形态**无关**——375k tokens、3MB body、流式、tools、`x-cmd-zdr` 全部返回 200；210k tokens 连发 8/8 不复现；而**同一时刻两个不同会话会一起失败** ⇒ 站方瞬时时序故障。

危害在于放大：OpenCode 默认**不重试 400** ⇒ 该轮以 `finish:"error"` 结束；在 OpenChamber 的 Goal 模式下更会被判 `blocked`，自动运行就此终止。

插件用 OpenCode V2 官方钩子 `ctx.session.hook("retry")`，**只对这类错误**给出重试决策（其它 400 / 429 / 5xx 一律不干预，交给客户端自身的重试策略）：

| 环境变量 | 默认 | 说明 |
|---|---|---|
| `CMD_RETRY` | `1` | 置 `0` 关闭该重试 |
| `CMD_RETRY_MAX_ATTEMPTS` | `3` | 最多尝试次数（含首次，1–5） |
| `CMD_RETRY_DELAY_MS` | `800` | 重试前等待毫秒（0–10000） |

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
