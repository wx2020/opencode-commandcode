import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import {
  PLUGIN_ID,
  COMMANDCODE_BASE_URL,
  GOAT_MODELS,
  rewriteUrlForCommandCode,
  createCommandCodeHeaders,
  resolveApiKey,
  isStealthModel,
  extractRequestModel,
  CommandCodePlugin,
  buildProviderConfig,
  renderOpencodeConfig,
  PROVIDER_NAME,
} from "../index";
import {
  FAMILY_BASE_QUOTAS,
  KNOWN_QUOTAS,
  parseModelMetadata,
  selectCuratedLineup,
} from "../scripts/sync-models";

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

    describe("ZDR stripping for stealth models", () => {
      const ENV_BACKUP = { ...process.env };

      beforeEach(() => {
        delete process.env.CMD_ZDR;
        delete process.env.COMMANDCODE_ZDR;
      });

      afterEach(() => {
        for (const k of Object.keys(process.env)) {
          if (!(k in ENV_BACKUP)) delete process.env[k];
          else process.env[k] = ENV_BACKUP[k];
        }
      });

      test("strips explicit x-cmd-zdr header for stealth models", () => {
        const initial = new Headers({ "x-cmd-zdr": "1" });
        const headers = createCommandCodeHeaders(
          initial,
          "test-key",
          JSON.stringify({ model: "stealth/space-bunny-alpha" }),
        );
        expect(headers.get("x-cmd-zdr")).toBeNull();
      });

      test("strips x-cmd-zdr for stealth even when CMD_ZDR=1", () => {
        process.env.CMD_ZDR = "1";
        const headers = createCommandCodeHeaders(
          undefined,
          "test-key",
          JSON.stringify({ model: "stealth/pixel-canary" }),
        );
        expect(headers.get("x-cmd-zdr")).toBeNull();
      });

      test("keeps ZDR injection for non-stealth requests (behavior unchanged)", () => {
        process.env.CMD_ZDR = "1";
        const headers = createCommandCodeHeaders(
          undefined,
          "test-key",
          JSON.stringify({ model: "z-ai/glm-5.3-flash" }),
        );
        expect(headers.get("x-cmd-zdr")).toBe("1");
      });

      test("keeps explicit x-cmd-zdr for non-stealth requests", () => {
        const initial = new Headers({ "x-cmd-zdr": "1" });
        const headers = createCommandCodeHeaders(
          initial,
          "test-key",
          JSON.stringify({ model: "deepseek/deepseek-v4.1-flash" }),
        );
        expect(headers.get("x-cmd-zdr")).toBe("1");
      });
    });
  });

  describe("Model Matrix & Capabilities", () => {
  test("every registered model is well-formed", () => {
    const entries = Object.entries(GOAT_MODELS);
    expect(entries.length).toBeGreaterThan(0);

    const seen = new Set<string>();
    for (const [id, model] of entries) {
      expect(id.trim().length).toBeGreaterThan(0);
      expect(seen.has(id)).toBe(false);
      seen.add(id);

      expect(typeof model.name).toBe("string");
      expect(model.name.trim().length).toBeGreaterThan(0);

      expect(model.limit.context).toBeGreaterThan(0);
      expect(model.limit.output).toBeGreaterThan(0);

      expect(model.cost.input).toBeGreaterThanOrEqual(0);
      expect(model.cost.output).toBeGreaterThanOrEqual(0);

      expect(model.modalities.input.length).toBeGreaterThan(0);
      expect(model.modalities.output.length).toBeGreaterThan(0);
    }
  });

  test("anonymous stealth models are reasoning-capable tier-1 seats", () => {
    const stealthIds = Object.keys(GOAT_MODELS).filter((id) => id.startsWith("stealth/"));
    for (const id of stealthIds) {
      const meta = parseModelMetadata(id);
      expect(meta.family).toBe("stealth");
      expect(GOAT_MODELS[id].reasoning).toBe(true);
      // Paid anonymous seats must clear the tier-1 quota bar; free seats have quota 0 by design.
      if (!meta.isFree) {
        expect(meta.quota).toBeGreaterThanOrEqual(4000);
      }
    }
  });

  test("curated lineup never drops a currently selected model", () => {
    const upstream = [...new Set([...Object.keys(KNOWN_QUOTAS), ...Object.keys(GOAT_MODELS)])];
    const lineup = selectCuratedLineup(upstream);
    for (const id of Object.keys(GOAT_MODELS)) {
      expect(lineup).toContain(id);
    }
  });

  test("detects stealth model requests from bodies", () => {
    expect(isStealthModel("stealth/next-codename")).toBe(true);
    expect(isStealthModel("STEALTH/Whatever")).toBe(true);
    expect(isStealthModel("z-ai/glm-5.3-flash")).toBe(false);
    expect(isStealthModel(undefined)).toBe(false);
    expect(extractRequestModel('{"model":"stealth/next-codename"}')).toBe("stealth/next-codename");
    expect(extractRequestModel("{bad json")).toBeUndefined();
  });

  describe("curation engine rules", () => {
    test("newer generations inherit their family's quota benchmark", () => {
      const next = parseModelMetadata("deepseek/deepseek-v5-flash");
      expect(next.family).toBe("deepseek");
      expect(next.quota).toBe(FAMILY_BASE_QUOTAS.deepseek.quota);
      expect(parseModelMetadata("Qwen/Qwen9-Next-Flash").quota).toBe(FAMILY_BASE_QUOTAS.qwen.quota);
    });

    test("a generation older than the family anchor gets no quota", () => {
      expect(parseModelMetadata("deepseek/deepseek-v3-flash").quota).toBe(0);
    });

    test("reverse-quota rule keeps the older, higher-quota generation", () => {
      const lineup = selectCuratedLineup(["stepfun/Step-3.5-Flash", "stepfun/Step-3.7-Flash"]);
      expect(lineup).toContain("stepfun/Step-3.5-Flash");
      expect(lineup).not.toContain("stepfun/Step-3.7-Flash");
    });

    test("redundant variants are pruned", () => {
      const lineup = selectCuratedLineup(["z-ai/glm-5.3-flash", "z-ai/glm-5.3-flashx"]);
      expect(lineup).toContain("z-ai/glm-5.3-flash");
      expect(lineup).not.toContain("z-ai/glm-5.3-flashx");
    });

    test("free models are always retained", () => {
      const free = ["poolside/laguna-s-9-free", "inclusionai/ling-9-flash:free"];
      const lineup = selectCuratedLineup(free);
      for (const id of free) {
        expect(lineup).toContain(id);
      }
    });

    test("anthropic models are never selected", () => {
      const lineup = selectCuratedLineup(["anthropic/claude-opus-9", "deepseek/deepseek-v4.1-flash"]);
      expect(lineup).not.toContain("anthropic/claude-opus-9");
      expect(lineup).toContain("deepseek/deepseek-v4.1-flash");
    });

    test("strips promotional (GOAT 7x) suffixes and only labels Free models", () => {
      for (const [id, model] of Object.entries(GOAT_MODELS)) {
        expect(model.name).not.toContain("GOAT");
        expect(model.name).not.toContain("7x");
        expect(model.name).not.toContain("Deal");

        if (id.includes("free")) {
          expect(model.name).toContain("(Free)");
        } else {
          expect(model.name).not.toContain("(Free)");
        }
      }
    });
  });
  });

  describe("Config Generation", () => {
    test("module exports the v2 { id, setup } shape", () => {
      expect(CommandCodePlugin.id).toBe(PLUGIN_ID);
      expect(typeof CommandCodePlugin.setup).toBe("function");
    });

    test("buildProviderConfig targets the CommandCode base URL with all models", () => {
      const provider = buildProviderConfig();
      expect(provider.name).toBe(PROVIDER_NAME);
      expect(provider.npm).toBe("@ai-sdk/openai-compatible");
      expect((provider.options as any).baseURL).toBe(COMMANDCODE_BASE_URL);
      expect(Object.keys(provider.models as any).length).toBe(Object.keys(GOAT_MODELS).length);
    });

    test("renderOpencodeConfig preserves unrelated keys and injects the provider", () => {
      const existing = {
        $schema: "custom",
        instructions: ["AGENTS.md"],
        plugin: ["some-plugin"],
        provider: { other: { name: "Other" } },
      };
      const next = renderOpencodeConfig(existing, {
        "m/1": GOAT_MODELS["deepseek/deepseek-v4.1-flash"],
      });

      expect(next.$schema).toBe("custom");
      expect(next.instructions).toEqual(["AGENTS.md"]);
      expect(next.plugin).toEqual(["some-plugin"]);

      const providers = next.provider as any;
      expect(providers.other.name).toBe("Other");
      expect(providers.commandcode.name).toBe(PROVIDER_NAME);
      expect(Object.keys(providers.commandcode.models)).toEqual(["m/1"]);
    });

    test("renderOpencodeConfig is deterministic for stable output", () => {
      const a = renderOpencodeConfig({ plugin: ["p"] });
      const b = renderOpencodeConfig({ plugin: ["p"] });
      expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    });
  });
});

