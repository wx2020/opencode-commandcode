import {
  COMMANDCODE_BASE_URL,
  DUMMY_API_KEY,
  ENV_ZDR_KEYS,
  HEADERS,
  ZERO_DATA_RETENTION_VALUE,
} from "./constants";
import { resolveApiKey } from "./auth";

/**
 * Normalizes input request to URL string and rewrites it to point to CommandCode Base URL if necessary.
 */
export function rewriteUrlForCommandCode(requestInput: RequestInfo | URL): string {
  const originalUrl =
    requestInput instanceof URL
      ? requestInput.toString()
      : typeof requestInput === "string"
        ? requestInput
        : requestInput.url;

  if (originalUrl.includes("api.commandcode.ai")) {
    return originalUrl;
  }

  // Rewrite base URL while preserving the endpoint path (e.g. /chat/completions, /models, etc.)
  return originalUrl.replace(/^https?:\/\/[^/]+(\/v1)?/, COMMANDCODE_BASE_URL);
}

/**
 * Checks if the given model id belongs to the anonymous stealth family.
 * Stealth models do not support Zero Data Retention upstream (422 cmd_zdr_no_providers).
 */
export function isStealthModel(model?: string | null): boolean {
  return typeof model === "string" && model.toLowerCase().startsWith("stealth/");
}

/**
 * Extracts the "model" field from a request body without consuming streams.
 */
export function extractRequestModel(body?: unknown): string | undefined {
  try {
    if (typeof body === "string") {
      return (JSON.parse(body) as { model?: string })?.model;
    }
    if (body && typeof body === "object") {
      return (body as { model?: string }).model;
    }
  } catch {
    // Malformed JSON: treat as non-stealth
  }
  return undefined;
}

/**
 * Checks if Zero Data Retention (ZDR) is requested via environment variable or custom headers.
 */
export function shouldEnableZdr(headers?: Headers): boolean {
  for (const key of ENV_ZDR_KEYS) {
    if (process.env[key] === "1" || process.env[key]?.toLowerCase() === "true") {
      return true;
    }
  }
  return headers ? headers.has(HEADERS.ZDR) : false;
}

/**
 * Injects required authorization and optional ZDR headers for CommandCode.
 * Strips the ZDR header for stealth/* models even when ZDR is globally enabled,
 * because anonymous stealth models have no zero-data-retention upstream.
 */
export function createCommandCodeHeaders(
  existingHeaders: HeadersInit | undefined,
  apiKey?: string,
  body?: unknown,
): Headers {
  const headers = new Headers(existingHeaders);

  if (apiKey && apiKey !== DUMMY_API_KEY) {
    headers.set(HEADERS.AUTHORIZATION, `Bearer ${apiKey}`);
  }

  if (isStealthModel(extractRequestModel(body))) {
    headers.delete(HEADERS.ZDR);
    return headers;
  }

  if (shouldEnableZdr(headers) && !headers.has(HEADERS.ZDR)) {
    headers.set(HEADERS.ZDR, ZERO_DATA_RETENTION_VALUE);
  }

  return headers;
}

/**
 * Creates a custom fetch wrapper tailored for OpenCode SDK integration with CommandCode.
 * Intercepts requests to inject real credentials and rewrite routing dynamically.
 */
export function createCommandCodeFetch(
  getAuth: () => Promise<{ type: string; key?: string } | undefined>,
  fallbackApiKey?: string,
): (requestInput: RequestInfo | URL, init?: RequestInit) => Promise<Response> {
  return async (requestInput: RequestInfo | URL, init?: RequestInit) => {
    const currentAuth = await getAuth();
    const resolvedKey = resolveApiKey(
      currentAuth?.type === "api" ? currentAuth.key : fallbackApiKey,
    );

    const headers = createCommandCodeHeaders(init?.headers, resolvedKey, init?.body);
    const targetUrl = rewriteUrlForCommandCode(requestInput);

    return fetch(targetUrl, {
      ...init,
      headers,
    });
  };
}

