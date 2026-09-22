import { describe, expect, test } from "bun:test";
import {
  PLUGIN_ID,
  COMMANDCODE_BASE_URL,
  GOAT_MODELS,
  rewriteUrlForCommandCode,
  createCommandCodeHeaders,
  resolveApiKey,
  CommandCodePlugin,
} from "../index";

describe("CommandCode OpenCode Plugin", () => {
  describe("URL Rewriting", () => {
    test("preserves existing commandcode url", () => {
      const url = "https://api.commandcode.ai/provider/v1/chat/completions";
      expect(rewriteUrlForCommandCode(url)).toBe(url);
    });

    test("rewrites standard provider URL to CommandCode base endpoint", () => {
      const input = "https://example.com/v1/chat/completions";
      const rewritten = rewriteUrlForCommandCode(input);
      expect(rewritten).toBe("https://api.commandcode.ai/provider/v1/chat/completions");
    });
  });

  describe("Header Injection & Auth", () => {
    test("injects bearer token if provided", () => {
      const headers = createCommandCodeHeaders(undefined, "test-secret-key");
      expect(headers.get("authorization")).toBe("Bearer test-secret-key");
    });

    test("does not inject authorization if key is dummy or empty", () => {
      const headers = createCommandCodeHeaders(undefined, "dummy-key");
      expect(headers.get("authorization")).toBeNull();
    });

    test("respects explicit ZDR header and preserves it", () => {
      const initial = new Headers({ "x-cmd-zdr": "1" });
      const headers = createCommandCodeHeaders(initial, "test-key");
      expect(headers.get("x-cmd-zdr")).toBe("1");
    });

    test("resolves API key with fallback order", () => {
      const key = resolveApiKey("custom-auth-key");
      expect(key).toBe("custom-auth-key");
    });
  });

  describe("Model Matrix & Capabilities", () => {
    test("has registered GOAT models with core lineup included", () => {
      const modelKeys = Object.keys(GOAT_MODELS);
      expect(modelKeys.length).toBeGreaterThanOrEqual(14);
    });

    test("deepseek-v4.1-flash has authentic 384k output capacity and reasoning levels", () => {
      const ds = GOAT_MODELS["deepseek/deepseek-v4.1-flash"];
      expect(ds).toBeDefined();
      expect(ds.limit.context).toBe(1_000_000);
      expect(ds.limit.output).toBe(384_000);
      expect(ds.reasoning).toBe(true);
    });

    test("xiaomi/mimo-v2.5 has authentic reasoning capability", () => {
      const mimo = GOAT_MODELS["xiaomi/mimo-v2.5"];
      expect(mimo).toBeDefined();
      expect(mimo.reasoning).toBe(true);
    });
  });

  describe("Plugin Hooks Lifecycle", () => {
    test("registers provider into config object", async () => {
      const hooks = await CommandCodePlugin({} as any);
      const cfg: any = {};
      await hooks.config?.(cfg);

      expect(cfg.provider[PLUGIN_ID]).toBeDefined();
      expect(cfg.provider[PLUGIN_ID].api).toBe(COMMANDCODE_BASE_URL);
      expect(cfg.provider[PLUGIN_ID].models["deepseek/deepseek-v4.1-flash"]).toBeDefined();
    });

    test("auth loader returns valid configuration", async () => {
      const hooks = await CommandCodePlugin({} as any);
      const authResult = await hooks.auth?.loader?.(async () => ({
        type: "api",
        key: "test-user-key",
      }));

      expect(authResult?.baseURL).toBe(COMMANDCODE_BASE_URL);
      expect(authResult?.apiKey).toBe("test-user-key");
      expect(typeof authResult?.fetch).toBe("function");
    });
  });
});

