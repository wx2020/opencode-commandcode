/**
 * Constants used throughout the CommandCode OpenCode plugin
 * Centralized for clean maintenance and consistency
 */
/** Plugin and Provider Identifier */
export declare const PLUGIN_ID = "commandcode";
export declare const PROVIDER_NAME = "CommandCode (GOAT Plan)";
/** CommandCode Base and Endpoint URLs */
export declare const COMMANDCODE_BASE_URL = "https://api.commandcode.ai/provider/v1";
export declare const COMMANDCODE_CHAT_ENDPOINT = "https://api.commandcode.ai/provider/v1/chat/completions";
export declare const COMMANDCODE_RESPONSES_ENDPOINT = "https://api.commandcode.ai/provider/v1/responses";
export declare const COMMANDCODE_MODELS_ENDPOINT = "https://api.commandcode.ai/provider/v1/models";
/** Custom HTTP Headers */
export declare const HEADERS: {
    readonly ZDR: "x-cmd-zdr";
    readonly AUTHORIZATION: "authorization";
    readonly CONTENT_TYPE: "content-type";
};
export declare const ZERO_DATA_RETENTION_VALUE = "1";
/** Environment variable names checked for API keys */
export declare const ENV_API_KEYS: readonly ["CMD_API_KEY", "COMMANDCODE_API_KEY"];
/** Environment variable names checked for enabling Zero Data Retention */
export declare const ENV_ZDR_KEYS: readonly ["CMD_ZDR", "COMMANDCODE_ZDR"];
/** Dummy fallback key for unauthenticated initialization */
export declare const DUMMY_API_KEY = "dummy-key";
/** Interactive Auth Labels */
export declare const AUTH_LABELS: {
    readonly API_KEY: "CommandCode Studio API Key (GOAT Plan)";
    readonly INSTRUCTIONS: "Enter your CommandCode API Key generated from CommandCode Studio (starts with user_...)";
};
