import type { Hooks, PluginInput } from "@opencode-ai/plugin";
import {
  COMMANDCODE_BASE_URL,
  ENV_API_KEYS,
  PLUGIN_ID,
  PROVIDER_NAME,
} from "./lib/constants";
import { GOAT_MODELS } from "./lib/models";
import { AUTH_METHODS, resolveApiKey } from "./lib/auth";
import { createCommandCodeFetch } from "./lib/fetch";

export * from "./lib/constants";
export * from "./lib/types";
export * from "./lib/models";
export * from "./lib/auth";
export * from "./lib/fetch";

/**
 * CommandCode Provider Plugin for OpenCode
 * Integrates CommandCode GOAT Plan high-capacity models with verified reasoning effort variants.
 */
export const CommandCodePlugin = async (_input: PluginInput): Promise<Hooks> => {
  return {
    config: async (cfg: any) => {
      cfg.provider ??= {};
      const existing = cfg.provider[PLUGIN_ID] ?? {};

      cfg.provider[PLUGIN_ID] = {
        name: PROVIDER_NAME,
        api: COMMANDCODE_BASE_URL,
        npm: "@ai-sdk/openai-compatible",
        env: [...ENV_API_KEYS],
        ...existing,
        options: {
          baseURL: COMMANDCODE_BASE_URL,
          ...(existing.options ?? {}),
        },
        models: {
          ...GOAT_MODELS,
          ...(existing.models ?? {}),
        },
      };
    },

    auth: {
      provider: PLUGIN_ID,
      async loader(getAuth: any) {
        const auth = await getAuth();
        const apiKey = resolveApiKey(auth?.type === "api" ? auth.key : undefined);

        return {
          apiKey,
          baseURL: COMMANDCODE_BASE_URL,
          fetch: createCommandCodeFetch(getAuth, apiKey),
        };
      },
      methods: AUTH_METHODS,
    },

    provider: {
      id: PLUGIN_ID,
      async models(provider: any, _ctx: any) {
        return provider.models;
      },
    },
  };
};

export default {
  id: PLUGIN_ID,
  server: CommandCodePlugin,
};

