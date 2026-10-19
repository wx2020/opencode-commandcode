// lib/constants.ts
var PLUGIN_ID = "commandcode";
var PROVIDER_NAME = "CommandCode (GOAT Plan)";
var COMMANDCODE_BASE_URL = "https://api.commandcode.ai/provider/v1";
var COMMANDCODE_CHAT_ENDPOINT = `${COMMANDCODE_BASE_URL}/chat/completions`;
var COMMANDCODE_RESPONSES_ENDPOINT = `${COMMANDCODE_BASE_URL}/responses`;
var COMMANDCODE_MODELS_ENDPOINT = `${COMMANDCODE_BASE_URL}/models`;
var HEADERS = {
  ZDR: "x-cmd-zdr",
  AUTHORIZATION: "authorization",
  CONTENT_TYPE: "content-type"
};
var ZERO_DATA_RETENTION_VALUE = "1";
var ENV_API_KEYS = ["CMD_API_KEY", "COMMANDCODE_API_KEY"];
var ENV_ZDR_KEYS = ["CMD_ZDR", "COMMANDCODE_ZDR"];
var DUMMY_API_KEY = "dummy-key";
var AUTH_LABELS = {
  API_KEY: "CommandCode Studio API Key (GOAT Plan)",
  INSTRUCTIONS: "Enter your CommandCode API Key generated from CommandCode Studio (starts with user_...)"
};

// lib/auth.ts
function resolveApiKey(keyFromAuth) {
  if (keyFromAuth && keyFromAuth.trim().length > 0 && keyFromAuth !== DUMMY_API_KEY) {
    return keyFromAuth.trim();
  }
  for (const envVar of ENV_API_KEYS) {
    const val = process.env[envVar];
    if (val && val.trim().length > 0) {
      return val.trim();
    }
  }
  return DUMMY_API_KEY;
}
function isApiKeyValid(apiKey) {
  if (!apiKey)
    return false;
  return apiKey !== DUMMY_API_KEY && apiKey.trim().length > 0;
}
var AUTH_METHODS = [
  {
    type: "api",
    label: AUTH_LABELS.API_KEY
  }
];

// lib/fetch.ts
function rewriteUrlForCommandCode(requestInput) {
  const originalUrl = requestInput instanceof URL ? requestInput.toString() : typeof requestInput === "string" ? requestInput : requestInput.url;
  if (originalUrl.includes("api.commandcode.ai")) {
    return originalUrl;
  }
  return originalUrl.replace(/^https?:\/\/[^/]+(\/v1)?/, COMMANDCODE_BASE_URL);
}
function isStealthModel(model) {
  return typeof model === "string" && model.toLowerCase().startsWith("stealth/");
}
function extractRequestModel(body) {
  try {
    if (typeof body === "string") {
      return JSON.parse(body)?.model;
    }
    if (body && typeof body === "object") {
      return body.model;
    }
  } catch {}
  return;
}
function shouldEnableZdr(headers) {
  for (const key of ENV_ZDR_KEYS) {
    if (process.env[key] === "1" || process.env[key]?.toLowerCase() === "true") {
      return true;
    }
  }
  return headers ? headers.has(HEADERS.ZDR) : false;
}
function createCommandCodeHeaders(existingHeaders, apiKey, body) {
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
function applyCommandCodeRequestHeaders(headers, model) {
  if (isStealthModel(model)) {
    delete headers[HEADERS.ZDR];
    return;
  }
  if (!headers[HEADERS.ZDR] && shouldEnableZdr()) {
    headers[HEADERS.ZDR] = ZERO_DATA_RETENTION_VALUE;
  }
}
function createCommandCodeFetch(getAuth, fallbackApiKey) {
  return async (requestInput, init) => {
    const currentAuth = await getAuth();
    const resolvedKey = resolveApiKey(currentAuth?.type === "api" ? currentAuth.key : fallbackApiKey);
    const headers = createCommandCodeHeaders(init?.headers, resolvedKey, init?.body);
    const targetUrl = rewriteUrlForCommandCode(requestInput);
    return fetch(targetUrl, {
      ...init,
      headers
    });
  };
}

// lib/retry.ts
var DEFAULT_RETRY_MAX_ATTEMPTS = 3;
var DEFAULT_RETRY_DELAY_MS = 800;
function isTransientGatewayError(error) {
  if (!error || typeof error !== "object")
    return false;
  const err = error;
  const status = Number(err.status ?? err.statusCode);
  if (status !== 400)
    return false;
  const blob = [err.type, err.message, err.response?.body].map((value) => typeof value === "string" ? value : "").join(" ");
  return /invalid[ _-]?request/i.test(blob);
}
function parseMaxAttempts(raw) {
  const value = Number(raw);
  if (!Number.isFinite(value))
    return DEFAULT_RETRY_MAX_ATTEMPTS;
  const int = Math.floor(value);
  if (int < 1 || int > 5)
    return DEFAULT_RETRY_MAX_ATTEMPTS;
  return int;
}
function parseRetryDelayMs(raw) {
  const value = Number(raw);
  if (!Number.isFinite(value))
    return DEFAULT_RETRY_DELAY_MS;
  const int = Math.floor(value);
  if (int < 0 || int > 1e4)
    return DEFAULT_RETRY_DELAY_MS;
  return int;
}
function retryDecisionFor(error, attempt, maxAttempts = DEFAULT_RETRY_MAX_ATTEMPTS, delayMs = DEFAULT_RETRY_DELAY_MS) {
  if (!isTransientGatewayError(error))
    return null;
  if (!(Number(attempt) < maxAttempts))
    return null;
  return { retry: true, delay: delayMs };
}

// lib/models.ts
var GOAT_MODELS = {
  "deepseek/deepseek-v4.1-flash": {
    name: "DeepSeek V4.1 Flash",
    limit: {
      context: 1e6,
      output: 384000
    },
    cost: {
      input: 0.021,
      output: 0.085,
      cache_read: 0.0004,
      cache_write: 0
    },
    modalities: {
      input: [
        "text",
        "image"
      ],
      output: [
        "text"
      ]
    },
    reasoning: true,
    interleaved: {
      field: "reasoning_content"
    },
    variants: {
      low: {
        reasoningEffort: "low"
      },
      high: {
        reasoningEffort: "high"
      },
      max: {
        reasoningEffort: "max"
      }
    }
  },
  "xiaomi/mimo-v2.6-flash": {
    name: "MiMo V2.6 Flash",
    limit: {
      context: 1048576,
      output: 131072
    },
    cost: {
      input: 0.02,
      output: 0.04,
      cache_read: 0.0004,
      cache_write: 0
    },
    modalities: {
      input: [
        "text",
        "image",
        "audio",
        "video"
      ],
      output: [
        "text"
      ]
    },
    reasoning: true,
    interleaved: {
      field: "reasoning_content"
    },
    variants: {
      high: {
        reasoningEffort: "high"
      },
      low: {
        reasoningEffort: "low"
      },
      medium: {
        reasoningEffort: "medium"
      },
      max: {
        reasoningEffort: "max"
      }
    }
  },
  "meta/muse-spark-1.3-contributor": {
    name: "Muse Spark 1.3 Contributor",
    limit: {
      context: 1048576,
      output: 943718
    },
    cost: {
      input: 0.018,
      output: 0.054,
      cache_read: 0.001,
      cache_write: 0
    },
    modalities: {
      input: [
        "text",
        "image",
        "video",
        "pdf"
      ],
      output: [
        "text"
      ]
    },
    reasoning: true,
    interleaved: {
      field: "reasoning_content"
    },
    variants: {
      low: {
        reasoningEffort: "low"
      },
      medium: {
        reasoningEffort: "medium"
      },
      high: {
        reasoningEffort: "high"
      },
      max: {
        reasoningEffort: "max"
      }
    }
  },
  "meituan/LongCat-2.0": {
    name: "LongCat 2.0",
    limit: {
      context: 1048576,
      output: 262144
    },
    cost: {
      input: 0.025,
      output: 0.075,
      cache_read: 0.002,
      cache_write: 0
    },
    modalities: {
      input: [
        "text"
      ],
      output: [
        "text"
      ]
    },
    reasoning: false
  },
  "tencent/hy3-paid": {
    name: "Tencent Hy3",
    limit: {
      context: 262144,
      output: 128000
    },
    cost: {
      input: 0.0143,
      output: 0.0429,
      cache_read: 0.001,
      cache_write: 0
    },
    modalities: {
      input: [
        "text"
      ],
      output: [
        "text"
      ]
    },
    reasoning: false
  },
  "xiaomi/mimo-v2.6-pro": {
    name: "MiMo V2.6 Pro",
    limit: {
      context: 1048576,
      output: 131072
    },
    cost: {
      input: 0.0621,
      output: 0.1243,
      cache_read: 0.0005,
      cache_write: 0
    },
    modalities: {
      input: [
        "text",
        "image",
        "audio",
        "video"
      ],
      output: [
        "text"
      ]
    },
    reasoning: true,
    interleaved: {
      field: "reasoning_content"
    },
    variants: {
      high: {
        reasoningEffort: "high"
      },
      low: {
        reasoningEffort: "low"
      },
      medium: {
        reasoningEffort: "medium"
      },
      max: {
        reasoningEffort: "max"
      }
    }
  },
  "Qwen/Qwen3.8-27B": {
    name: "Qwen 3.8 27B",
    limit: {
      context: 262144,
      output: 32768
    },
    cost: {
      input: 0.0214,
      output: 0.1,
      cache_read: 0.0057,
      cache_write: 0
    },
    modalities: {
      input: [
        "text",
        "image",
        "video"
      ],
      output: [
        "text"
      ]
    },
    reasoning: true,
    interleaved: {
      field: "reasoning_content"
    },
    variants: {
      low: {
        reasoningEffort: "low"
      },
      medium: {
        reasoningEffort: "medium"
      }
    }
  },
  "z-ai/glm-5.3-flash": {
    name: "GLM 5.3 Flash",
    limit: {
      context: 1048576,
      output: 131072
    },
    cost: {
      input: 0.052,
      output: 0.178,
      cache_read: 0.01,
      cache_write: 0
    },
    modalities: {
      input: [
        "text",
        "image"
      ],
      output: [
        "text"
      ]
    },
    reasoning: true,
    interleaved: {
      field: "reasoning_content"
    },
    variants: {
      low: {
        reasoningEffort: "low"
      },
      high: {
        reasoningEffort: "high"
      },
      max: {
        reasoningEffort: "max"
      }
    }
  },
  "Qwen/Qwen3.8-Max-Prime": {
    name: "Qwen 3.8 Max Prime",
    limit: {
      context: 1e6,
      output: 131072
    },
    cost: {
      input: 0.5714,
      output: 1.7143,
      cache_read: 0.0714,
      cache_write: 0
    },
    modalities: {
      input: [
        "text",
        "image",
        "video"
      ],
      output: [
        "text"
      ]
    },
    reasoning: true,
    interleaved: {
      field: "reasoning_content"
    },
    variants: {
      low: {
        reasoningEffort: "low"
      },
      medium: {
        reasoningEffort: "medium"
      },
      high: {
        reasoningEffort: "high"
      }
    }
  },
  "Qwen/Qwen3.8-Omni-Flash": {
    name: "Qwen 3.8 Omni Flash",
    limit: {
      context: 1e6,
      output: 131072
    },
    cost: {
      input: 0.021,
      output: 0.067,
      cache_read: 0.002,
      cache_write: 0
    },
    modalities: {
      input: [
        "text",
        "image",
        "audio",
        "video"
      ],
      output: [
        "text"
      ]
    },
    reasoning: true,
    interleaved: {
      field: "reasoning_content"
    },
    variants: {
      high: {
        reasoningEffort: "high"
      },
      low: {
        reasoningEffort: "low"
      },
      medium: {
        reasoningEffort: "medium"
      }
    }
  },
  "stepfun/Step-3.5-Flash": {
    name: "Step 3.5 Flash",
    limit: {
      context: 262144,
      output: 64000
    },
    cost: {
      input: 0.0143,
      output: 0.0429,
      cache_read: 0.001,
      cache_write: 0
    },
    modalities: {
      input: [
        "text"
      ],
      output: [
        "text"
      ]
    },
    reasoning: true,
    interleaved: {
      field: "reasoning_content"
    },
    variants: {
      high: {
        reasoningEffort: "high"
      }
    }
  },
  "gpt-6.1-sol": {
    name: "GPT-6.1 Sol",
    limit: {
      context: 1050000,
      output: 128000
    },
    cost: {
      input: 0.2857,
      output: 1.4286,
      cache_read: 0.0143,
      cache_write: 0.3571
    },
    modalities: {
      input: [
        "text",
        "image",
        "pdf"
      ],
      output: [
        "text"
      ]
    },
    reasoning: true,
    interleaved: {
      field: "reasoning_content"
    },
    variants: {
      low: {
        reasoningEffort: "low"
      },
      medium: {
        reasoningEffort: "medium"
      },
      high: {
        reasoningEffort: "high"
      },
      max: {
        reasoningEffort: "max"
      }
    }
  },
  "MiniMaxAI/MiniMax-M3": {
    name: "MiniMax M3",
    limit: {
      context: 1e6,
      output: 512000
    },
    cost: {
      input: 0.015,
      output: 0.045,
      cache_read: 0.001,
      cache_write: 0
    },
    modalities: {
      input: [
        "text",
        "image"
      ],
      output: [
        "text"
      ]
    },
    reasoning: true,
    interleaved: {
      field: "reasoning_content"
    },
    variants: {
      low: {
        reasoningEffort: "low"
      },
      medium: {
        reasoningEffort: "medium"
      },
      high: {
        reasoningEffort: "high"
      },
      max: {
        reasoningEffort: "max"
      }
    }
  },
  "stealth/space-bunny-alpha": {
    name: "Space Bunny Alpha",
    limit: {
      context: 1e6,
      output: 524288
    },
    cost: {
      input: 0.0071,
      output: 0.0214,
      cache_read: 0.001,
      cache_write: 0
    },
    modalities: {
      input: [
        "text",
        "image",
        "video"
      ],
      output: [
        "text"
      ]
    },
    reasoning: true,
    interleaved: {
      field: "reasoning_content"
    },
    variants: {
      low: {
        reasoningEffort: "low"
      },
      medium: {
        reasoningEffort: "medium"
      },
      high: {
        reasoningEffort: "high"
      },
      max: {
        reasoningEffort: "max"
      }
    }
  },
  "stealth/pixel-canary": {
    name: "Pixel Canary",
    limit: {
      context: 262144,
      output: 131072
    },
    cost: {
      input: 0.0143,
      output: 0.0429,
      cache_read: 0.001,
      cache_write: 0
    },
    modalities: {
      input: [
        "text",
        "image"
      ],
      output: [
        "text"
      ]
    },
    reasoning: true,
    interleaved: {
      field: "reasoning_content"
    },
    variants: {
      low: {
        reasoningEffort: "low"
      },
      medium: {
        reasoningEffort: "medium"
      }
    }
  },
  "poolside/laguna-s-2.1-free": {
    name: "Laguna S 2.1 (Free)",
    limit: {
      context: 256000,
      output: 32768
    },
    cost: {
      input: 0,
      output: 0,
      cache_read: 0,
      cache_write: 0
    },
    modalities: {
      input: [
        "text"
      ],
      output: [
        "text"
      ]
    },
    reasoning: true,
    interleaved: {
      field: "reasoning_content"
    },
    variants: {
      low: {
        reasoningEffort: "low"
      },
      high: {
        reasoningEffort: "high"
      }
    }
  },
  "inclusionai/ling-3.0-flash-sante:free": {
    name: "Ling 3.0 Flash Sante (Free)",
    limit: {
      context: 262144,
      output: 32768
    },
    cost: {
      input: 0,
      output: 0,
      cache_read: 0,
      cache_write: 0
    },
    modalities: {
      input: [
        "text"
      ],
      output: [
        "text"
      ]
    },
    reasoning: true,
    interleaved: {
      field: "reasoning_content"
    },
    variants: {
      high: {
        reasoningEffort: "high"
      }
    }
  },
  "stealth/glyph-cluster:free": {
    name: "Glyph Cluster (Free)",
    limit: {
      context: 256000,
      output: 131072
    },
    cost: {
      input: 0,
      output: 0,
      cache_read: 0,
      cache_write: 0
    },
    modalities: {
      input: [
        "text"
      ],
      output: [
        "text"
      ]
    },
    reasoning: true,
    interleaved: {
      field: "reasoning_content"
    }
  },
  "inclusionai/ling-3.1-flash:free": {
    name: "Ling 3.1 Flash (Free)",
    limit: {
      context: 262144,
      output: 32768
    },
    cost: {
      input: 0,
      output: 0,
      cache_read: 0,
      cache_write: 0
    },
    modalities: {
      input: [
        "text"
      ],
      output: [
        "text"
      ]
    },
    reasoning: true,
    interleaved: {
      field: "reasoning_content"
    },
    variants: {
      low: {
        reasoningEffort: "low"
      },
      medium: {
        reasoningEffort: "medium"
      },
      high: {
        reasoningEffort: "high"
      }
    }
  },
  "stealth/cat-jam:free": {
    name: "Cat Jam (Free)",
    limit: {
      context: 1048576,
      output: 131072
    },
    cost: {
      input: 0,
      output: 0,
      cache_read: 0,
      cache_write: 0
    },
    modalities: {
      input: [
        "text"
      ],
      output: [
        "text"
      ]
    },
    reasoning: true,
    interleaved: {
      field: "reasoning_content"
    }
  },
  "reflection/beam:free": {
    name: "Beam 1.0 (Free)",
    limit: {
      context: 1048576,
      output: 131072
    },
    cost: {
      input: 0,
      output: 0,
      cache_read: 0,
      cache_write: 0
    },
    modalities: {
      input: [
        "text"
      ],
      output: [
        "text"
      ]
    },
    reasoning: false
  },
  "moonshotai/Kimi-K2.7-Code": {
    name: "Kimi K2.7 Code",
    limit: {
      context: 256000,
      output: 262144
    },
    cost: {
      input: 0.035,
      output: 0.11,
      cache_read: 0.005,
      cache_write: 0
    },
    modalities: {
      input: [
        "text",
        "image",
        "video"
      ],
      output: [
        "text"
      ]
    },
    reasoning: true,
    interleaved: {
      field: "reasoning_content"
    },
    variants: {
      low: {
        reasoningEffort: "low"
      },
      medium: {
        reasoningEffort: "medium"
      },
      high: {
        reasoningEffort: "high"
      }
    }
  },
  "google/gemini-3.8-flash": {
    name: "Gemini 3.8 Flash",
    limit: {
      context: 1e6,
      output: 65536
    },
    cost: {
      input: 0.1071,
      output: 0.5357,
      cache_read: 0.0107,
      cache_write: 0.006
    },
    modalities: {
      input: [
        "text",
        "image",
        "video",
        "audio",
        "pdf"
      ],
      output: [
        "text"
      ]
    },
    reasoning: true,
    interleaved: {
      field: "reasoning_content"
    },
    variants: {
      low: {
        reasoningEffort: "low"
      },
      medium: {
        reasoningEffort: "medium"
      },
      high: {
        reasoningEffort: "high"
      }
    }
  },
  "thinkingmachines/inkling-small": {
    name: "Inkling Small",
    limit: {
      context: 1e6,
      output: 262144
    },
    cost: {
      input: 0.0714,
      output: 0.1714,
      cache_read: 0.0143,
      cache_write: 0
    },
    modalities: {
      input: [
        "text",
        "image",
        "audio"
      ],
      output: [
        "text"
      ]
    },
    reasoning: true,
    interleaved: {
      field: "reasoning_content"
    },
    variants: {
      low: {
        reasoningEffort: "low"
      },
      medium: {
        reasoningEffort: "medium"
      },
      high: {
        reasoningEffort: "high"
      },
      max: {
        reasoningEffort: "max"
      }
    }
  },
  "xai/grok-4.6": {
    name: "Grok 4.6",
    limit: {
      context: 500000,
      output: 500000
    },
    cost: {
      input: 0.2857,
      output: 0.8571,
      cache_read: 0.0714,
      cache_write: 0
    },
    modalities: {
      input: [
        "text",
        "image",
        "pdf"
      ],
      output: [
        "text"
      ]
    },
    reasoning: true,
    interleaved: {
      field: "reasoning_content"
    },
    variants: {
      low: {
        reasoningEffort: "low"
      },
      medium: {
        reasoningEffort: "medium"
      },
      high: {
        reasoningEffort: "high"
      }
    }
  }
};

// lib/provider.ts
var PROVIDER_PACKAGE = "aisdk:@ai-sdk/openai-compatible";
function buildProviderRuntimeInfo(id = PLUGIN_ID, name = PROVIDER_NAME, baseURL = COMMANDCODE_BASE_URL) {
  return {
    id,
    name,
    activation: "enabled",
    package: PROVIDER_PACKAGE,
    integrationID: id,
    settings: { baseURL }
  };
}
function toModelInfo(id, definition, providerID = PLUGIN_ID, released = 0) {
  const variants = definition.variants ? Object.entries(definition.variants).map(([variantID, settings]) => ({
    id: variantID,
    settings: { ...settings }
  })) : [];
  const model = {
    id,
    modelID: id,
    providerID,
    name: definition.name,
    capabilities: {
      tools: true,
      input: [...definition.modalities.input],
      output: [...definition.modalities.output]
    },
    variants,
    time: { released },
    cost: [
      {
        input: definition.cost.input,
        output: definition.cost.output,
        cache: {
          read: definition.cost.cache_read ?? 0,
          write: definition.cost.cache_write ?? 0
        }
      }
    ],
    status: "active",
    enabled: true,
    limit: {
      context: definition.limit.context,
      ...definition.limit.input === undefined ? {} : { input: definition.limit.input },
      output: definition.limit.output
    }
  };
  if (definition.interleaved?.field) {
    model.compatibility = { reasoningField: definition.interleaved.field };
  }
  return model;
}
function buildModelInfos(models = GOAT_MODELS, providerID = PLUGIN_ID, released = 0) {
  return Object.entries(models).map(([id, definition]) => toModelInfo(id, definition, providerID, released));
}

// index.ts
var setupCommandCode = async (ctx) => {
  await ctx.provider.transform((editor) => {
    editor.update(PLUGIN_ID, (provider2) => {
      Object.assign(provider2, buildProviderRuntimeInfo());
    });
    editor.models.set(PLUGIN_ID, buildModelInfos());
  });
  await ctx.integration.transform((editor) => {
    editor.update(PLUGIN_ID, (integration) => {
      integration.name = PROVIDER_NAME;
    });
    editor.method.update({
      integrationID: PLUGIN_ID,
      method: { type: "key", label: AUTH_LABELS.API_KEY }
    });
    editor.method.update({
      integrationID: PLUGIN_ID,
      method: { type: "env", names: [...ENV_API_KEYS] }
    });
  });
  await ctx.session.hook("model.request", (event) => {
    applyCommandCodeRequestHeaders(event.headers, event.model.id);
  }, { providerID: PLUGIN_ID });
  const maxAttempts = parseMaxAttempts(process.env.CMD_RETRY_MAX_ATTEMPTS);
  const delayMs = parseRetryDelayMs(process.env.CMD_RETRY_DELAY_MS);
  if (process.env.CMD_RETRY !== "0" && maxAttempts > 1) {
    await ctx.session.hook("retry", (event) => {
      const decision = retryDecisionFor(event.error, event.attempt, maxAttempts, delayMs);
      if (decision)
        event.decision = decision;
    }, { providerID: PLUGIN_ID });
  }
};
var CommandCodePlugin = {
  id: PLUGIN_ID,
  setup: setupCommandCode
};
var opencode_commandcode_default = CommandCodePlugin;
export {
  AUTH_LABELS,
  AUTH_METHODS,
  COMMANDCODE_BASE_URL,
  COMMANDCODE_CHAT_ENDPOINT,
  COMMANDCODE_MODELS_ENDPOINT,
  COMMANDCODE_RESPONSES_ENDPOINT,
  CommandCodePlugin,
  DEFAULT_RETRY_DELAY_MS,
  DEFAULT_RETRY_MAX_ATTEMPTS,
  DUMMY_API_KEY,
  ENV_API_KEYS,
  ENV_ZDR_KEYS,
  GOAT_MODELS,
  HEADERS,
  PLUGIN_ID,
  PROVIDER_NAME,
  PROVIDER_PACKAGE,
  ZERO_DATA_RETENTION_VALUE,
  applyCommandCodeRequestHeaders,
  buildModelInfos,
  buildProviderRuntimeInfo,
  createCommandCodeFetch,
  createCommandCodeHeaders,
  opencode_commandcode_default as default,
  extractRequestModel,
  isApiKeyValid,
  isStealthModel,
  isTransientGatewayError,
  parseMaxAttempts,
  parseRetryDelayMs,
  resolveApiKey,
  retryDecisionFor,
  rewriteUrlForCommandCode,
  setupCommandCode,
  shouldEnableZdr,
  toModelInfo
};

//# debugId=8149416C5FC5959B64756E2164756E21
