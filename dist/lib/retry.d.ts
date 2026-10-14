/**
 * CommandCode 上游瞬时错误的自动重试策略。
 *
 * 背景（2026-10-14 实测定性）：api.commandcode.ai 偶发返回 HTTP 400
 * `{"error":{"message":"{\"message\":\"invalid request error trace_id: <x-trace-id>\",\"type\":\"invalid_request_error\"}"}}`
 * —— 网关把上游（模型后端）的 invalid_request_error 原样包了一层，trace id 即网关的 x-trace-id。
 * 该错误与请求体积/形态无关（375k tokens / 3MB body、流式、tools、ZDR 头均 200；210k tokens 8/8 不复现），
 * 且同一时刻两个不同会话会一起失败 ⇒ 站方瞬时时序故障。
 *
 * 危害：OpenCode 默认不重试 400 ⇒ 该轮对话以 error 结束；OpenChamber 的 Goal 运行时据此判 blocked，
 * 自动运行就此终止（statusReason="provider.invalid-request"）。
 *
 * 修复：OpenCode V2 插件 API 的 `ctx.session.hook("retry")` 允许插件给出重试决策
 * （`{retry: true, delay}`），这里只对上述特征生效，其它 400/4xx/5xx 一律不干预。
 */
/** 只读取结构字段，避免为类型引入额外依赖。 */
export interface GatewayErrorLike {
    type?: unknown;
    message?: unknown;
    status?: unknown;
    statusCode?: unknown;
    response?: {
        body?: unknown;
    };
}
export interface RetryDecision {
    retry: true;
    delay: number;
}
/** 默认最多尝试次数（含首次）与重试前等待毫秒。 */
export declare const DEFAULT_RETRY_MAX_ATTEMPTS = 3;
export declare const DEFAULT_RETRY_DELAY_MS = 800;
/** 命中"上游网关瞬时 400"特征：status=400 且正文/消息含 invalid request error（含下划线/连字符变体）。 */
export declare function isTransientGatewayError(error: unknown): boolean;
/** 解析 `CMD_RETRY_MAX_ATTEMPTS`（1..5，非法值回落默认）。 */
export declare function parseMaxAttempts(raw?: string | null): number;
/** 解析 `CMD_RETRY_DELAY_MS`（0..10000，非法值回落默认）。 */
export declare function parseRetryDelayMs(raw?: string | null): number;
/**
 * 给定错误与当前尝试次数返回重试决策；不该重试时返回 `null`（调用方保持运行时的默认决策）。
 */
export declare function retryDecisionFor(error: unknown, attempt: number, maxAttempts?: number, delayMs?: number): RetryDecision | null;
