import type { Plugin } from "@opencode/plugin";
export * from "./lib/constants";
export * from "./lib/types";
export * from "./lib/models";
export * from "./lib/auth";
export * from "./lib/fetch";
export * from "./lib/provider";
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
export declare const setupCommandCode: (ctx: Plugin.Context) => Promise<void>;
/**
 * CommandCode Provider Plugin for OpenCode.
 *
 * Registers the provider at runtime instead of writing it into the user
 * config, so it can no longer collide with another config writer.
 */
export declare const CommandCodePlugin: Plugin.Plugin;
export default CommandCodePlugin;
