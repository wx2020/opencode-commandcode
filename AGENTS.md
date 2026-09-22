# Project Rules & Model Selection Strategy for opencode-commandcode

## Model Selection & Pruning Strategy (同家族 Pro/Flash 双旗舰原则)

1. **同家族最多保留 1 到 2 个模型**：
   - 区分层级：
     - **Pro 级（主力旗舰）**：负责复杂推理、长思考、极限长上下文与长输出。
     - **Flash 级（极速轻量）**：负责高并发、低延迟或全模态感知。
   - 同家族内各最多保留 1 个。

2. **上下文充足原则**：
   - 优先选取家族内上下文容量最大（如 100 万 token 级别）的版本。

3. **智能淘汰机制**：
   - 淘汰所有非最新一代的陈旧历史版本（例如 Qwen 3.7/3.6、GLM 5.2/5.1/5.0、DeepSeek v4 早期版、Kimi 2.6/2.5、Gemini 3.7 及以下）。
   - 淘汰同家族内功能重叠的次级切片变体（如 UltraSpeed, FlashX, 27B 等）。
