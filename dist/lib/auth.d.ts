/**
 * Resolves the active CommandCode API key from priority order:
 * 1. Explicit key stored in OpenCode auth state
 * 2. Environment variables (`CMD_API_KEY`, `COMMANDCODE_API_KEY`)
 * 3. Fallback dummy key
 */
export declare function resolveApiKey(keyFromAuth?: string): string;
/**
 * Validates whether an API key is provided and non-dummy.
 */
export declare function isApiKeyValid(apiKey?: string): boolean;
/**
 * Interactive authentication methods exposed to the OpenCode CLI
 */
export declare const AUTH_METHODS: {
    type: "api";
    label: "CommandCode Studio API Key (GOAT Plan)";
}[];
