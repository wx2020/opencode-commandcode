# Project Rules & Model Selection Strategy for opencode-commandcode

## Model Selection & Pruning Strategy (同家族 Pro/Flash 双旗舰原则)

1. **5 小时配额门槛 (>= 4000 次)**：
   - 过滤 5 小时用量低于 4000 次（以 GOAT 计划配额为准）的模型，防止密集自动编程中快速耗尽额度。

2. **配额优先倒挂规则 (旧版本配额高于新版本则保留旧版)**：
   - **如果旧版本 5 小时配额高于新版本，保留旧版本**（实用高可用优先！例如 `Step 3.5 Flash` 配额高达 8,770 次，高于新版 `Step 3.7 Flash` 的 4,180 次，此时**保留高配额的旧版本 Step 3.5 Flash，淘汰新版 3.7**）。
   - 若新旧版本配额相等或新版本更高，则正常保留新版本、淘汰旧版本。

3. **同家族最多保留 1 到 2 个模型 (Pro / Flash 双旗舰)**：
   - 区分层级：
     - **Pro 级（主力旗舰）**：负责复杂推理、长思考、极限长上下文与长输出。
     - **Flash 级（极速轻量）**：负责高并发、低延迟或全模态感知。
   - 同家族内各最多保留 1 个。

4. **上下文充足原则**：
   - 优先选取家族内上下文容量最大（如 100 万 token 级别）的版本。
   - 淘汰同家族内功能重叠的次级切片变体（如 UltraSpeed, FlashX, 27B 等）。

5. **其他厂商对比席位 (各厂商仅限 1 款最新旗舰)**：
   - 对于配额低于 4000 的其他厂商（如 Google、Moonshot Kimi、xAI Grok、ThinkingMachines 等），不受 4000 门槛硬性淘汰。
   - 每个其他厂商**仅保留 1 款**最新一代最具代表性的旗舰模型，方便对比评测使用。

7. **Anthropic 家族全部排除**：`parseModelMetadata` 里 claude → family="anthropic"，`selectCuratedLineup` 直接 `filter(m => m.family !== "anthropic")`（claude 系列仅 `/messages` 端点，openai-compatible 不适用）。

## 匿名模型 (stealth/*) 已完整支持（v1.1.0，2026-09-26）

- 上游 `GET /provider/v1/models` 返回两个匿名模型：`stealth/space-bunny-alpha`（1M 上下文）、`stealth/pixel-canary`（262k 上下文）（隐身评测，身份保密）。
- **v1.1.0 实现要点**：
  1. `parseModelMetadata` 家族识别链加 `lower.startsWith("stealth/") → family="stealth"` 分支；`KNOWN_QUOTAS` 补两款条目 quota=4000（Tier1 门槛），通过 Tier1 路径入列。
  2. `selectCuratedLineup` 对 `fam === "stealth"` 走双席位豁免分支：保留该家族全部 highQuota 模型，不受"1 Pro + 1 Flash"上限与 Tier3 各厂商 1 款限制。
  3. `lib/fetch.ts` 新增 `isStealthModel`/`extractRequestModel`：`createCommandCodeHeaders` 第三参收 request body，解析 `model` 字段，stealth/* 一律 `headers.delete("x-cmd-zdr")`（即使 CMD_ZDR=1 或显式带头）；非 stealth 行为不变。`createCommandCodeFetch` 透传 `init.body`。
  4. sync 的 `isReasoning` fallback 列表加 `stealth/` 前缀（无 models.dev spec 时默认开推理）。
- **验证（2026-09-26 实测）**：带 `x-cmd-zdr: 1` 直调 stealth → 422 `cmd_zdr_no_providers`（根因复现）；剥离该头后 space-bunny-alpha 3/3 次 200（~1.4s）、pixel-canary 200（118s，深度推理较慢）；CMD_ZDR=1 下经插件 dist fetch 层调 stealth 200、非 stealth（glm-5.3-flash）仍带 ZDR 200。bun test 22 pass。
- 历史 bug 记录（已修复）：stealth 曾因家族识别盲区（family="other"、quota=0）被 lineup 完全过滤，属纯筛选逻辑缺陷，与 ZDR 开关无关。
- 回归提示：新增 stealth 款式时仅需补 `KNOWN_QUOTAS` 条目（quota ≥ 4000），双席位豁免分支会自动全保留。

## 每日自动发版机制分析（2026-09-26 实测）

- **发版来源**：`.github/workflows/auto-release.yml` cron 每日 00:00 UTC 跑 `sync-models.ts`；`git status --porcelain` 非空即跑 `release.ts` 发版。
- **judge（parseModelMetadata/selectCuratedLineup）没有问题**：对比 v1.0.6→v1.0.9 各版 `lib/models.ts` 模型清单，成员完全稳定（仅 9-23 上游新增 `gpt-6-astra` 替换 `gpt-5.6-luna` 属真实变化）；2026-09-26 本地 dry-run 实测 added/updated/pruned 全 0（当日未发版吻合）。
- **每日 diff 的真实来源是 models.dev 社区数据日常更新**（非 judge 误判）：v1.0.9 全部变更均为 spec 字段——`limit.context/output` 修正（Step 3.5 Flash 1M→262k）、`modalities` 增删（glm 去 pdf、MiniMax 加 image/video）、`reasoning_options` variants 新增。属"上游每日都在变"的正常同步行为。
- **潜在隐患（未发作）**：`specMap` 按 shortId（去 provider 前缀）索引且**首见 provider 永久胜出**（`if (!specMap.has(lowerId))`），若 models.dev provider 遍历顺序变化，同名 short id 会匹配到错误 spec 造成元数据抖动；`extractModelVersion` 正则取 id 中首个数字也较脆弱。 lineup 选型逻辑本身未见缺陷。
- `sync-summary.json` 与 `scripts/sync-models.ts` 都在 `.gitignore`… 实为**误配**：`scripts/sync-models.ts` 写在 .gitignore 但文件已被 git 跟踪（ignore 对已跟踪文件无效），workflow 能正常使用。

6. **免费模型双席位全部保留 (Zero-Cost 双保底)**：
   - 免费模型不消耗 5 小时配额，不受 4000 门槛限制。
   - 全部保留平台提供的两款免费模型：
     1. `poolside/laguna-s-2.1-free` (Laguna S 2.1 Free Tier，256k 上下文，支持推理思考)
     2. `inclusionai/ling-3.0-flash-sante:free` (Ling 3.0 Flash Sante Free Tier，262k 上下文)
   - 绝不淘汰任何一款免费模型，供零成本任务、额度耗尽双保底与白嫖使用。

## v1.3.0：V2 运行时注册架构（2026-10-12）

- **背景**：v1.2.0 为适配 V2 改成在 `setup()` 里直接读写 `~/.config/opencode/opencode.jsonc` 注入 `provider.commandcode`（V1 形状），与 OpenChamber 的归一化写入乒乓，导致同一 provider 存两份、日志刷 conflict。**v1.3.0 彻底改写为运行时注册，零文件 IO。**
- **代码结构**：
  - `index.ts` → `setupCommandCode(ctx)`：`ctx.provider.transform`（`editor.update(PLUGIN_ID, …)` + `editor.models.set(PLUGIN_ID, buildModelInfos())`）→ `ctx.integration.transform`（key 方法 + env 方法 `ENV_API_KEYS`，并设 `name`）→ `ctx.session.hook("model.request", …, { providerID })`（ZDR/stealth）。`CommandCodePlugin` 仍是普通 `{ id, setup }` 对象（**不引用 `@opencode/plugin` 运行时**，只有 type-only import，dist 无任何 import）。
  - `lib/provider.ts` → `buildProviderRuntimeInfo()` / `toModelInfo()` / `buildModelInfos()` 纯函数；`package` 用 `aisdk:@ai-sdk/openai-compatible`（核心在注册时重写为 `@opencode/ai/providers/openai-compatible`）。
  - `lib/fetch.ts` → 新增 `applyCommandCodeRequestHeaders(headers, model)`（供 V2 hook 用，record 版，按 `event.model.id` 判 stealth，不必读 body）；旧的 `createCommandCodeHeaders`/`createCommandCodeFetch`/`rewriteUrlForCommandCode` 保留导出但已无调用方。
- **GOAT_MODELS(V1 形状) → V2 `Model.Info` 映射**（严格对齐核心 `packages/core/src/v1/config/migrate.ts` 的 `migrateModel`，已验证与 OpenChamber 归一化产物一致）：
  - `id`/`modelID` = 模型键；`limit` 原样；`capabilities = { tools: true, input: modalities.input, output: modalities.output }`
  - `interleaved.field` → `compatibility.reasoningField`；`variants` **记录** → `[{ id, settings }]` **数组**；`cost` → `[{ input, output, cache: { read: cache_read ?? 0, write: cache_write ?? 0 } }]`（**数组**，schema 要求 cache 必填）
  - **`reasoning` 字段是 V2 unsupported，直接丢弃**（V1 时代靠它自动生成推理档位）；无显式 `variants` 的推理模型就输出空数组（与核心 `Variant.resolve` 对未知 package 的行为一致）
  - 必填字段：`id/modelID/providerID/name/capabilities/variants/time/cost/status/enabled/limit`，`additionalProperties: false`
- **鉴权**：凭据存 SQLite（`credential.integration_id = "commandcode"`）；`model-resolver.ts` 用 `provider.integrationID ?? providerID` 找 connection，集成条目即使缺失也能命中已存凭据；`/connect` 与 env 回退则依赖我们用 `ctx.integration.transform` 注册的 key/env 方法。
- **已删除的 API**：`renderOpencodeConfig` / `syncOpencodeConfig` / `resolveConfigPath` / `buildProviderConfig` / `CONFIG_CANDIDATES`（破坏性变更，故版本号 1.2.0 → 1.3.0）。
- **依赖**：`package.json` 的 peer/dev 依赖已由 `@opencode-ai/plugin ^1.0.0` 改为 **`@opencode/plugin ^2.0.0`**；`scripts/build.ts` external 同步；`scripts/install.js` 写 V2 `plugins: [...]`（原 `plugin`）。
- **本机验证方法（隔离环境，不碰真实配置）**：`OPENCODE_CONFIG_DIR=<repo>/.tmp/verify/config` + `XDG_DATA_HOME=<repo>/.tmp/verify/data`，配置里只写 `plugins: ["<repo 绝对路径>"]`；V2 二进制在 `C:\Users\J6001887\AppData\Local\Programs\@openchamberelectron\resources\opencode-cli\opencode`。有效探针：`opencode run --standalone --model commandcode/<id> "hi"`（能发请求即为注册成功）、`opencode auth list --standalone`（看集成的 env 方法）。
- **升级注意**：装新版本后**必须重启 server**（`opencode service restart` 或重启 OpenChamber）——热重载不会替换 ESM 模块缓存，实测旧代码仍会写配置。
- **本机验收结果（2026-10-12）**：配置里 commandcode 份数 **0**（2762 字节，mtime 停在清理时刻不再变化）；两个 server（OpenChamber managed 30354 与重启后的后台 service 49374）均显示 `commandcode / CommandCode (GOAT Plan) / @opencode/ai/providers/openai-compatible / enabled` 且仅一份，`models | grep -c '^commandcode/'` = **22**；免费模型 `poolside/laguna-s-2.1-free` 实调返回 `ok`；无 commandcode 相关的 normalization diagnostic/conflict；插件 `state: active`。
- **查询注意**：后台 service 的 HTTP API 需要口令（`opencode service get password` → 环境变量 `OPENCODE_PASSWORD`），否则 `models`/`api` 会输出 0 行/空 JSON 造成"未注册"的误判；managed server 通常无需口令。
- **⚠️ 两个 server 的坑**：本机 OpenChamber managed server（`~/.config/openchamber/managed-opencode/<pid>.json` 里有 port）与后台 service（`opencode service status`）是**两个独立进程**；只重启 OpenChamber 会出现「聊天界面正常、CLI 报 `Model unavailable`」的分裂（详见全局 AGENTS.md）。

- **新设备安装（V2 写法，2026-10-12 起）**：**v1.3.0 已发布**（commit `c32aa6c`，tag `v1.3.0`）。⚠️ **Windows 上 `github:` 规格装不上**（opencode 用 npm arborist/pacote，pacote 在克隆里 `spawn("npm")` 在 Windows 必失败：ENOENT/EINVAL → `git dep preparation failed`），因此 `opencode plugin add github:wx2020/opencode-commandcode` 与配置里 `"plugins": ["github:..."]` 都不可用。可用路径：**① 配置里写绝对路径**（`"plugins": ["<repo 绝对路径>"]`，已端到端实测）；**② 拷贝包到 `<config>/node_modules/opencode-commandcode` + 在 `<config>/plugins/` 放加载器**；③ npm registry 规格（本包 npm 名 `opencode-commandcode` 已被他人占用，需自有 scope）。**切勿**再往配置里写 `provider.commandcode`（v1.2.0 时代遗留，会遮蔽运行时清单）。

## Maintenance
- 每次改完代码或完成新的分析后，必须调用 `memory-update` skill 检查并更新本文件。
- 发现本文件与代码不符时，以代码为准同步修正。
- 模型清单由 `scripts/sync-models.ts` 每日同步（见上文筛选策略），改动 `lib/models.ts` 的结构时须同步更新 `lib/provider.ts` 的映射与 `test/index.test.ts` 的断言。

