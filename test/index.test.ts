import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import {
  PLUGIN_ID,
  COMMANDCODE_BASE_URL,
  GOAT_MODELS,
  rewriteUrlForCommandCode,
  createCommandCodeHeaders,
  applyCommandCodeRequestHeaders,
  resolveApiKey,
  isStealthModel,
  extractRequestModel,
  CommandCodePlugin,
  setupCommandCode,
  buildProviderRuntimeInfo,
  buildModelInfos,
  toModelInfo,
  PROVIDER_PACKAGE,
  PROVIDER_NAME,
  isTransientGatewayError,
  retryDecisionFor,
  parseMaxAttempts,
  parseRetryDelayMs,
  DEFAULT_RETRY_DELAY_MS,
  DEFAULT_RETRY_MAX_ATTEMPTS,
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

  describe("Runtime Provider Registration", () => {
    test("module exports the v2 { id, setup } shape", () => {
      expect(CommandCodePlugin.id).toBe(PLUGIN_ID);
      expect(typeof CommandCodePlugin.setup).toBe("function");
      expect(typeof setupCommandCode).toBe("function");
    });

    test("provider info registers the CommandCode endpoint and integration", () => {
      const info = buildProviderRuntimeInfo();
      expect(info.id).toBe(PLUGIN_ID);
      expect(info.name).toBe(PROVIDER_NAME);
      expect(info.activation).toBe("enabled");
      expect(info.package).toBe(PROVIDER_PACKAGE);
      expect(info.integrationID).toBe(PLUGIN_ID);
      expect(info.settings.baseURL).toBe(COMMANDCODE_BASE_URL);
    });

    test("every GOAT model maps to a complete V2 model definition", () => {
      const models = buildModelInfos();
      expect(models.length).toBe(Object.keys(GOAT_MODELS).length);

      for (const model of models) {
        expect(model.id).toBe(model.modelID);
        expect(model.providerID).toBe(PLUGIN_ID);
        expect(model.name.trim().length).toBeGreaterThan(0);
        expect(model.capabilities.tools).toBe(true);
        expect(model.capabilities.input.length).toBeGreaterThan(0);
        expect(model.capabilities.output.length).toBeGreaterThan(0);
        expect(model.cost).toHaveLength(1);
        expect(model.cost[0].input).toBeGreaterThanOrEqual(0);
        expect(model.cost[0].output).toBeGreaterThanOrEqual(0);
        expect(model.cost[0].cache.read).toBeGreaterThanOrEqual(0);
        expect(model.cost[0].cache.write).toBeGreaterThanOrEqual(0);
        expect(model.limit.context).toBeGreaterThan(0);
        expect(model.limit.output).toBeGreaterThan(0);
        expect(model.status).toBe("active");
        expect(model.enabled).toBe(true);
        expect(Array.isArray(model.variants)).toBe(true);
        expect(model.time.released).toBe(0);

        // Legacy V1 fields must not leak into the runtime definition.
        expect(model as unknown as Record<string, unknown>).not.toHaveProperty("reasoning");
        expect(model as unknown as Record<string, unknown>).not.toHaveProperty("modalities");
        expect(model as unknown as Record<string, unknown>).not.toHaveProperty("interleaved");
      }
    });

    test("maps interleaved, variants and cost cache into the V2 fields", () => {
      const source = GOAT_MODELS["stealth/pixel-canary"];
      const model = toModelInfo("stealth/pixel-canary", source);

      expect(model.compatibility).toEqual({ reasoningField: source.interleaved!.field });
      expect(model.variants.map((variant) => variant.id)).toEqual(Object.keys(source.variants!));
      expect(model.variants[0].settings).toEqual(source.variants!.low);
      expect(model.cost[0].cache.read).toBe(source.cost.cache_read ?? 0);
      expect(model.cost[0].cache.write).toBe(source.cost.cache_write ?? 0);
      expect(model.capabilities.input).toEqual(source.modalities.input);
      expect(model.limit).toEqual({
        context: source.limit.context,
        output: source.limit.output,
      });
    });

    test("reasoning models without explicit variants get an empty variant list", () => {
      const model = toModelInfo("stealth/glyph-cluster:free", GOAT_MODELS["stealth/glyph-cluster:free"]);
      expect(model.variants).toEqual([]);
      expect(model.compatibility).toEqual({ reasoningField: "reasoning_content" });
    });

    test("builders are deterministic, so re-registering produces no diff", () => {
      expect(JSON.stringify(buildModelInfos())).toBe(JSON.stringify(buildModelInfos()));
      expect(buildProviderRuntimeInfo()).toEqual(buildProviderRuntimeInfo());
    });

    test("setup registers provider, integration and request hook without touching config files", async () => {
      const providerTransforms: Array<(editor: any) => void> = [];
      const integrationTransforms: Array<(editor: any) => void> = [];
      const hooks: Array<{ name: string; callback: (event: any) => void; options?: any }> = [];

      const ctx = {
        provider: {
          transform: async (callback: (editor: any) => void) => {
            providerTransforms.push(callback);
          },
        },
        integration: {
          transform: async (callback: (editor: any) => void) => {
            integrationTransforms.push(callback);
          },
        },
        session: {
          hook: async (name: string, callback: (event: any) => void, options?: any) => {
            hooks.push({ name, callback, options });
          },
        },
      };

      await setupCommandCode(ctx as any);

      expect(providerTransforms).toHaveLength(1);
      expect(integrationTransforms).toHaveLength(1);
      expect(hooks).toHaveLength(2);
      expect(hooks.map((entry) => entry.name).sort()).toEqual(["model.request", "retry"]);
      expect(hooks.find((entry) => entry.name === "retry")?.options?.providerID).toBe(PLUGIN_ID);

      const providerUpdates: Array<{ id: string; provider: any }> = [];
      const modelSets: Array<{ id: string; models: any[] }> = [];
      providerTransforms[0]({
        update: (id: string, update: (provider: any) => void) => {
          const provider: any = {};
          update(provider);
          providerUpdates.push({ id, provider });
        },
        models: {
          set: (id: string, models: any[]) => {
            modelSets.push({ id, models });
          },
        },
      });

      expect(providerUpdates).toHaveLength(1);
      expect(providerUpdates[0].id).toBe(PLUGIN_ID);
      expect(providerUpdates[0].provider.package).toBe(PROVIDER_PACKAGE);
      expect(providerUpdates[0].provider.settings.baseURL).toBe(COMMANDCODE_BASE_URL);
      expect(providerUpdates[0].provider.activation).toBe("enabled");
      expect(modelSets).toHaveLength(1);
      expect(modelSets[0].id).toBe(PLUGIN_ID);
      expect(modelSets[0].models).toHaveLength(Object.keys(GOAT_MODELS).length);

      const methodUpdates: any[] = [];
      integrationTransforms[0]({
        update: (id: string, update: (integration: any) => void) => {
          const integration: any = {};
          update(integration);
          expect(id).toBe(PLUGIN_ID);
          expect(integration.name).toBe(PROVIDER_NAME);
        },
        method: {
          update: (input: any) => {
            methodUpdates.push(input);
          },
        },
      });

      expect(methodUpdates.map((input) => input.method.type).sort()).toEqual(["env", "key"]);
      expect(methodUpdates.find((input) => input.method.type === "env").method.names).toEqual([
        "CMD_API_KEY",
        "COMMANDCODE_API_KEY",
      ]);

      const hook = hooks[0];
      expect(hook.name).toBe("model.request");
      expect(hook.options).toEqual({ providerID: PLUGIN_ID });
    });

    test("request hook enables ZDR for normal models and strips it for stealth", () => {
      const headers: Record<string, string> = {};
      applyCommandCodeRequestHeaders(headers, "z-ai/glm-5.3-flash");
      expect(headers["x-cmd-zdr"]).toBeUndefined();

      process.env.CMD_ZDR = "1";
      try {
        const normal: Record<string, string> = {};
        applyCommandCodeRequestHeaders(normal, "z-ai/glm-5.3-flash");
        expect(normal["x-cmd-zdr"]).toBe("1");

        const stealth: Record<string, string> = { "x-cmd-zdr": "1" };
        applyCommandCodeRequestHeaders(stealth, "stealth/space-bunny-alpha");
        expect(stealth["x-cmd-zdr"]).toBeUndefined();
      } finally {
        delete process.env.CMD_ZDR;
      }
    });
  });
});


describe("Transient gateway 400 retry policy", () => {
  const gatewayError = {
    type: "provider.invalid-request",
    status: 400,
    message: '{"message":"invalid request error trace_id: abc","type":"invalid_request_error"}',
    response: { body: '{"error":{"message":"invalid request error trace_id: abc"}}' },
  };

  test("detects the wrapped gateway invalid-request error", () => {
    expect(isTransientGatewayError(gatewayError)).toBe(true);
    expect(isTransientGatewayError({ status: 400, message: '{"type":"invalid_request_error"}' })).toBe(true);
  });

  test("ignores other 400s and non-400 statuses", () => {
    expect(isTransientGatewayError({ status: 400, message: "bad parameter" })).toBe(false);
    expect(isTransientGatewayError({ status: 422, message: "invalid request error" })).toBe(false);
    expect(isTransientGatewayError({ status: 503, message: "invalid request error" })).toBe(false);
    expect(isTransientGatewayError(undefined)).toBe(false);
  });

  test("retries the transient 400 until the attempt cap", () => {
    expect(retryDecisionFor(gatewayError, 1)).toEqual({ retry: true, delay: DEFAULT_RETRY_DELAY_MS });
    expect(retryDecisionFor(gatewayError, 2, 3, 10)).toEqual({ retry: true, delay: 10 });
    expect(retryDecisionFor(gatewayError, 3)).toBeNull();
  });

  test("does not retry other errors", () => {
    expect(retryDecisionFor({ status: 400, message: "nope" }, 1)).toBeNull();
    expect(retryDecisionFor({ status: 429, message: "rate limited" }, 1)).toBeNull();
  });

  test("env parsing falls back safely", () => {
    expect(parseMaxAttempts(undefined)).toBe(DEFAULT_RETRY_MAX_ATTEMPTS);
    expect(parseMaxAttempts("2")).toBe(2);
    expect(parseMaxAttempts("99")).toBe(DEFAULT_RETRY_MAX_ATTEMPTS);
    expect(parseRetryDelayMs(undefined)).toBe(DEFAULT_RETRY_DELAY_MS);
    expect(parseRetryDelayMs("0")).toBe(0);
    expect(parseRetryDelayMs("-5")).toBe(DEFAULT_RETRY_DELAY_MS);
  });

  test("setup registers a retry hook scoped to the provider", async () => {
    const hooks: Record<string, { callback: (input: any) => void; options?: { providerID?: string } }> = {};
    const ctx: any = {
      provider: { transform: async () => {} },
      integration: { transform: async () => {}, method: { update: async () => {} } },
      session: { hook: async (name: string, callback: any, options: any) => { hooks[name] = { callback, options }; } },
    };
    await setupCommandCode(ctx);
    expect(hooks.retry?.options?.providerID).toBe(PLUGIN_ID);
    const event: any = { attempt: 1, error: gatewayError, decision: { retry: false } };
    hooks.retry.callback(event);
    expect(event.decision).toEqual({ retry: true, delay: DEFAULT_RETRY_DELAY_MS });
  });
});
