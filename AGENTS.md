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

6. **免费模型双席位全部保留 (Zero-Cost 双保底)**：
   - 免费模型不消耗 5 小时配额，不受 4000 门槛限制。
   - 全部保留平台提供的两款免费模型：
     1. `poolside/laguna-s-2.1-free` (Laguna S 2.1 Free Tier，256k 上下文，支持推理思考)
     2. `inclusionai/ling-3.0-flash-sante:free` (Ling 3.0 Flash Sante Free Tier，262k 上下文)
   - 绝不淘汰任何一款免费模型，供零成本任务、额度耗尽双保底与白嫖使用。

