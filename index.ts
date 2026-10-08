import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import {
  COMMANDCODE_BASE_URL,
  PLUGIN_ID,
  PROVIDER_NAME,
} from "./lib/constants";
import { GOAT_MODELS } from "./lib/models";
import type { CommandCodeModelDefinition } from "./lib/types";

export * from "./lib/constants";
export * from "./lib/types";
export * from "./lib/models";
export * from "./lib/auth";
export * from "./lib/fetch";

/**
 * OpenCode JSON schema used in the generated config.
 */
export const OPENCODE_SCHEMA = "https://opencode.ai/config.json";

/**
 * AI SDK package opencode uses to talk to CommandCode's OpenAI-compatible endpoint.
 */
export const PROVIDER_PACKAGE = "@ai-sdk/openai-compatible";

/**
 * Config files opencode reads from `~/.config/opencode`, in precedence order.
 */
export const CONFIG_CANDIDATES = ["opencode.jsonc", "opencode.json", "config.json"] as const;

export type JsonObject = Record<string, unknown>;

/**
 * The `provider.commandcode` block for the opencode config.
 */
export function buildProviderConfig(
  models: Record<string, CommandCodeModelDefinition> = GOAT_MODELS,
): JsonObject {
  return {
    name: PROVIDER_NAME,
    npm: PROVIDER_PACKAGE,
    options: { baseURL: COMMANDCODE_BASE_URL },
    models,
  };
}

/**
 * Merges the CommandCode provider block into an existing opencode config,
 * preserving every other key (plugin, instructions, other providers, ...).
 */
export function renderOpencodeConfig(
  existing: unknown,
  models: Record<string, CommandCodeModelDefinition> = GOAT_MODELS,
): JsonObject {
  const prev = existing && typeof existing === "object" ? (existing as JsonObject) : {};
  const next: JsonObject = { $schema: (prev.$schema as string) ?? OPENCODE_SCHEMA };

  for (const [key, value] of Object.entries(prev)) {
    if (key === "$schema" || key === "provider") continue;
    next[key] = value;
  }

  const providers = { ...((prev.provider as JsonObject) ?? {}) };
  providers[PLUGIN_ID] = buildProviderConfig(models);
  next.provider = providers;

  return next;
}

/**
 * Resolves the opencode config file to write, preferring one that already exists.
 */
export function resolveConfigPath(): string {
  const dir = join(homedir(), ".config", "opencode");
  for (const name of CONFIG_CANDIDATES) {
    const candidate = join(dir, name);
    if (existsSync(candidate)) return candidate;
  }
  return join(dir, "opencode.jsonc");
}

/**
 * Regenerates the `provider.commandcode.models` block from GOAT_MODELS and writes
 * it back to the opencode config, but only when the content actually changed
 * (so it never fights the config file watcher).
 */
export function syncOpencodeConfig(
  models: Record<string, CommandCodeModelDefinition> = GOAT_MODELS,
): { path: string; changed: boolean } {
  const path = resolveConfigPath();
  let existing: unknown = {};

  if (existsSync(path)) {
    const raw = readFileSync(path, "utf8").replace(/^\uFEFF/, "");
    try {
      existing = JSON.parse(raw);
    } catch {
      // Config is JSONC (comments) or otherwise unparseable: never overwrite it.
      return { path, changed: false };
    }
  }

  const text = `${JSON.stringify(renderOpencodeConfig(existing, models), null, 2)}\n`;
  const current = existsSync(path) ? readFileSync(path, "utf8") : "";
  const changed = current !== text;

  if (changed) {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, text);
  }

  return { path, changed };
}

/**
 * CommandCode Provider Plugin for OpenCode.
 *
 * opencode declares providers from config only, so on every start the plugin
 * regenerates `provider.commandcode.models` in the opencode config from
 * GOAT_MODELS. Model lineup updates therefore propagate on the next start.
 */
export const CommandCodePlugin = {
  id: PLUGIN_ID,
  setup: async (): Promise<void> => {
    try {
      syncOpencodeConfig();
    } catch {
      // Best effort: a failed sync must never break opencode startup.
    }
  },
};

export default CommandCodePlugin;
