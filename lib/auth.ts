import { AUTH_LABELS, DUMMY_API_KEY, ENV_API_KEYS } from "./constants";

/**
 * Resolves the active CommandCode API key from priority order:
 * 1. Explicit key stored in OpenCode auth state
 * 2. Environment variables (`CMD_API_KEY`, `COMMANDCODE_API_KEY`)
 * 3. Fallback dummy key
 */
export function resolveApiKey(keyFromAuth?: string): string {
  if (keyFromAuth && keyFromAuth.trim().length > 0 && keyFromAuth !== DUMMY_API_KEY) {
    return keyFromAuth.trim();
  }

  for (const envVar of ENV_API_KEYS) {
    const val = process.env[envVar];
    if (val && val.trim().length > 0) {
      return val.trim();
    }
  }

  return DUMMY_API_KEY;
}

/**
 * Validates whether an API key is provided and non-dummy.
 */
export function isApiKeyValid(apiKey?: string): boolean {
  if (!apiKey) return false;
  return apiKey !== DUMMY_API_KEY && apiKey.trim().length > 0;
}

/**
 * Interactive authentication methods exposed to the OpenCode CLI
 */
export const AUTH_METHODS = [
  {
    type: "api" as const,
    label: AUTH_LABELS.API_KEY,
  },
];
