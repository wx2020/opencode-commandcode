import type { Plugin } from "@opencode/plugin";
import { AUTH_LABELS, ENV_API_KEYS, PLUGIN_ID, PROVIDER_NAME } from "./lib/constants";
import { applyCommandCodeRequestHeaders } from "./lib/fetch";
import { parseMaxAttempts, parseRetryDelayMs, retryDecisionFor } from "./lib/retry";
import { buildModelInfos, buildProviderRuntimeInfo } from "./lib/provider";

export * from "./lib/constants";
export * from "./lib/types";
export * from "./lib/models";
export * from "./lib/auth";
export * from "./lib/fetch";
export * from "./lib/provider";
export * from "./lib/retry";

/**
 * Registers CommandCode through the OpenCode V2 plugin API:
 *
 * - `ctx.provider.transform` publishes the provider and its full model lineup,
 *   so the lineup follows `GOAT_MODELS` on every start without reading or
 *   writing the user's `opencode.json(c)`.
 * - `ctx.integration.transform` publishes the key and environment auth methods,
 *   keeping `/connect`, `auth login` and the `CMD_API_KEY` fallback working.
 *   The stored credential lives in OpenCode's database keyed by
 *   `integration_id = "commandcode"` and resolves through `integrationID`.
 * - `ctx.session.hook("model.request", …)` restores the ZDR header injection and
 *   the stealth-model ZDR opt-out that the V1 fetch wrapper used to provide.
 *
 * Everything here is idempotent: transforms are deterministic and no file is
 * touched, so running setup repeatedly produces no diff.
 */
export const setupCommandCode = async (ctx: Plugin.Context): Promise<void> => {
  await ctx.provider.transform((editor) => {
    editor.update(PLUGIN_ID, (provider) => {
      Object.assign(provider, buildProviderRuntimeInfo());
    });
    editor.models.set(PLUGIN_ID, buildModelInfos() as unknown as Parameters<typeof editor.models.set>[1]);
  });

  await ctx.integration.transform((editor) => {
    editor.update(PLUGIN_ID, (integration) => {
      integration.name = PROVIDER_NAME;
    });
    editor.method.update({
      integrationID: PLUGIN_ID,
      method: { type: "key", label: AUTH_LABELS.API_KEY },
    });
    editor.method.update({
      integrationID: PLUGIN_ID,
      method: { type: "env", names: [...ENV_API_KEYS] },
    });
  });

  await ctx.session.hook(
    "model.request",
    (event) => {
      applyCommandCodeRequestHeaders(event.headers, event.model.id);
    },
    { providerID: PLUGIN_ID },
  );

  // 上游网关偶发 HTTP 400 invalid_request_error 属瞬时时序故障（见 lib/retry.ts），
  // 默认不重试会让整轮对话失败、让 Goal 判 blocked。这里只对该特征给出重试决策。
  const maxAttempts = parseMaxAttempts(process.env.CMD_RETRY_MAX_ATTEMPTS);
  const delayMs = parseRetryDelayMs(process.env.CMD_RETRY_DELAY_MS);
  if (process.env.CMD_RETRY !== "0" && maxAttempts > 1) {
    await ctx.session.hook(
      "retry",
      (event: { error: unknown; attempt: number; decision: { retry: boolean; delay: number } }) => {
        const decision = retryDecisionFor(event.error, event.attempt, maxAttempts, delayMs);
        if (decision) event.decision = decision;
      },
      { providerID: PLUGIN_ID },
    );
  }
};

/**
 * CommandCode Provider Plugin for OpenCode.
 *
 * Registers the provider at runtime instead of writing it into the user
 * config, so it can no longer collide with another config writer.
 */
export const CommandCodePlugin: Plugin.Plugin = {
  id: PLUGIN_ID,
  setup: setupCommandCode,
};

export default CommandCodePlugin;
