/**
 * Constants used throughout the CommandCode OpenCode plugin
 * Centralized for clean maintenance and consistency
 */

/** Plugin and Provider Identifier */
export const PLUGIN_ID = "commandcode";
export const PROVIDER_NAME = "CommandCode (GOAT Plan)";

/** CommandCode Base and Endpoint URLs */
export const COMMANDCODE_BASE_URL = "https://api.commandcode.ai/provider/v1";
export const COMMANDCODE_CHAT_ENDPOINT = `${COMMANDCODE_BASE_URL}/chat/completions`;
export const COMMANDCODE_RESPONSES_ENDPOINT = `${COMMANDCODE_BASE_URL}/responses`;
export const COMMANDCODE_MODELS_ENDPOINT = `${COMMANDCODE_BASE_URL}/models`;

/** Custom HTTP Headers */
export const HEADERS = {
  ZDR: "x-cmd-zdr",
  AUTHORIZATION: "authorization",
  CONTENT_TYPE: "content-type",
} as const;

export const ZERO_DATA_RETENTION_VALUE = "1";

/** Environment variable names checked for API keys */
export const ENV_API_KEYS = ["CMD_API_KEY", "COMMANDCODE_API_KEY"] as const;

/** Environment variable names checked for enabling Zero Data Retention */
export const ENV_ZDR_KEYS = ["CMD_ZDR", "COMMANDCODE_ZDR"] as const;

/** Dummy fallback key for unauthenticated initialization */
export const DUMMY_API_KEY = "dummy-key";

/** Interactive Auth Labels */
export const AUTH_LABELS = {
  API_KEY: "CommandCode Studio API Key (GOAT Plan)",
  INSTRUCTIONS: "Enter your CommandCode API Key generated from CommandCode Studio (starts with user_...)",
} as const;

