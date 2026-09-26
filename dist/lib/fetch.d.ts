/**
 * Normalizes input request to URL string and rewrites it to point to CommandCode Base URL if necessary.
 */
export declare function rewriteUrlForCommandCode(requestInput: RequestInfo | URL): string;
/**
 * Checks if the given model id belongs to the anonymous stealth family.
 * Stealth models do not support Zero Data Retention upstream (422 cmd_zdr_no_providers).
 */
export declare function isStealthModel(model?: string | null): boolean;
/**
 * Extracts the "model" field from a request body without consuming streams.
 */
export declare function extractRequestModel(body?: unknown): string | undefined;
/**
 * Checks if Zero Data Retention (ZDR) is requested via environment variable or custom headers.
 */
export declare function shouldEnableZdr(headers?: Headers): boolean;
/**
 * Injects required authorization and optional ZDR headers for CommandCode.
 * Strips the ZDR header for stealth/* models even when ZDR is globally enabled,
 * because anonymous stealth models have no zero-data-retention upstream.
 */
export declare function createCommandCodeHeaders(existingHeaders: HeadersInit | undefined, apiKey?: string, body?: unknown): Headers;
/**
 * Creates a custom fetch wrapper tailored for OpenCode SDK integration with CommandCode.
 * Intercepts requests to inject real credentials and rewrite routing dynamically.
 */
export declare function createCommandCodeFetch(getAuth: () => Promise<{
    type: string;
    key?: string;
} | undefined>, fallbackApiKey?: string): (requestInput: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
