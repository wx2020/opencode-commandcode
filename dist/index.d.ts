import type { Hooks, PluginInput } from "@opencode-ai/plugin";
export * from "./lib/constants";
export * from "./lib/types";
export * from "./lib/models";
export * from "./lib/auth";
export * from "./lib/fetch";
/**
 * CommandCode Provider Plugin for OpenCode
 * Integrates CommandCode GOAT Plan high-capacity models with verified reasoning effort variants.
 */
export declare const CommandCodePlugin: (_input: PluginInput) => Promise<Hooks>;
declare const _default: {
    id: string;
    server: typeof CommandCodePlugin;
};
export default _default;
