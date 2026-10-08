import type { CommandCodeModelDefinition } from "./lib/types";
export * from "./lib/constants";
export * from "./lib/types";
export * from "./lib/models";
export * from "./lib/auth";
export * from "./lib/fetch";
/**
 * OpenCode JSON schema used in the generated config.
 */
export declare const OPENCODE_SCHEMA = "https://opencode.ai/config.json";
/**
 * AI SDK package opencode uses to talk to CommandCode's OpenAI-compatible endpoint.
 */
export declare const PROVIDER_PACKAGE = "@ai-sdk/openai-compatible";
/**
 * Config files opencode reads from `~/.config/opencode`, in precedence order.
 */
export declare const CONFIG_CANDIDATES: readonly ["opencode.jsonc", "opencode.json", "config.json"];
export type JsonObject = Record<string, unknown>;
/**
 * The `provider.commandcode` block for the opencode config.
 */
export declare function buildProviderConfig(models?: Record<string, CommandCodeModelDefinition>): JsonObject;
/**
 * Merges the CommandCode provider block into an existing opencode config,
 * preserving every other key (plugin, instructions, other providers, ...).
 */
export declare function renderOpencodeConfig(existing: unknown, models?: Record<string, CommandCodeModelDefinition>): JsonObject;
/**
 * Resolves the opencode config file to write, preferring one that already exists.
 */
export declare function resolveConfigPath(): string;
/**
 * Regenerates the `provider.commandcode.models` block from GOAT_MODELS and writes
 * it back to the opencode config, but only when the content actually changed
 * (so it never fights the config file watcher).
 */
export declare function syncOpencodeConfig(models?: Record<string, CommandCodeModelDefinition>): {
    path: string;
    changed: boolean;
};
/**
 * CommandCode Provider Plugin for OpenCode.
 *
 * opencode declares providers from config only, so on every start the plugin
 * regenerates `provider.commandcode.models` in the opencode config from
 * GOAT_MODELS. Model lineup updates therefore propagate on the next start.
 */
export declare const CommandCodePlugin: {
    id: string;
    setup: () => Promise<void>;
};
export default CommandCodePlugin;
