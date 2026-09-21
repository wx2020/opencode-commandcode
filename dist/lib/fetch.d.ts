/**
 * Normalizes input request to URL string and rewrites it to point to CommandCode Base URL if necessary.
 */
export declare function rewriteUrlForCommandCode(requestInput: RequestInfo | URL): string;
/**
 * Checks if Zero Data Retention (ZDR) is requested via environment variable or custom headers.
 */
export declare function shouldEnableZdr(headers?: Headers): boolean;
/**
 * Injects required authorization and optional ZDR headers for CommandCode.
 */
export declare function createCommandCodeHeaders(existingHeaders: HeadersInit | undefined, apiKey?: string): Headers;
/**
 * Creates a custom fetch wrapper tailored for OpenCode SDK integration with CommandCode.
 * Intercepts requests to inject real credentials and rewrite routing dynamically.
 */
export declare function createCommandCodeFetch(getAuth: () => Promise<{
    type: string;
    key?: string;
} | undefined>, fallbackApiKey?: string): (requestInput: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
