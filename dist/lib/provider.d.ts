import type { CommandCodeModelDefinition } from "./types.js";
/**
 * AI SDK specifier for the runtime OpenCode resolves into its bundled
 * OpenAI-compatible provider. OpenCode rewrites `aisdk:@ai-sdk/openai-compatible`
 * to `@opencode/ai/providers/openai-compatible` when the provider is registered.
 */
export declare const PROVIDER_PACKAGE = "aisdk:@ai-sdk/openai-compatible";
/** Provider metadata consumed by `ctx.provider.transform`'s `editor.update`. */
export interface RuntimeProviderInfo {
    id: string;
    name: string;
    activation: "auto" | "enabled" | "disabled";
    package: string;
    integrationID: string;
    settings: {
        baseURL: string;
    };
}
/** Model metadata consumed by `ctx.provider.transform`'s `editor.models.set`. */
export interface RuntimeModelInfo {
    id: string;
    modelID: string;
    providerID: string;
    name: string;
    capabilities: {
        tools: boolean;
        input: string[];
        output: string[];
    };
    variants: Array<{
        id: string;
        settings: Record<string, unknown>;
    }>;
    time: {
        released: number;
    };
    cost: Array<{
        input: number;
        output: number;
        cache: {
            read: number;
            write: number;
        };
    }>;
    status: "alpha" | "beta" | "deprecated" | "active";
    enabled: boolean;
    limit: {
        context: number;
        input?: number;
        output: number;
    };
    compatibility?: {
        reasoningField: string;
    };
}
/**
 * The runtime `Provider.Info` for CommandCode.
 *
 * `integrationID` is the provider ID so the stored API-key credential
 * (`credential.integration_id = "commandcode"`) and the env fallback registered
 * on the same integration are both picked up by model resolution.
 */
export declare function buildProviderRuntimeInfo(id?: string, name?: string, baseURL?: string): RuntimeProviderInfo;
/**
 * Maps a single GOAT model definition (V1 config shape) onto the V2 runtime
 * `Model.Info` shape. Mirrors core's V1 -> V2 migration:
 * `interleaved.field` -> `compatibility.reasoningField`, the `variants` record
 * -> a variant array, `cost.cache_read|write` -> the cost tier's cache, and
 * `modalities` -> `capabilities`. The legacy `reasoning` flag is dropped: V2
 * expresses reasoning through variants and compatibility.
 */
export declare function toModelInfo(id: string, definition: CommandCodeModelDefinition, providerID?: string, released?: number): RuntimeModelInfo;
/** Maps the whole curated lineup onto runtime model definitions. */
export declare function buildModelInfos(models?: Record<string, CommandCodeModelDefinition>, providerID?: string, released?: number): RuntimeModelInfo[];
