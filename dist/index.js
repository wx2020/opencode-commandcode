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

// lib/models.ts
var GOAT_MODELS = {
  "deepseek/deepseek-v4.1-flash": {
    name: "DeepSeek V4.1 Flash (GOAT 7x)",
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
  "Qwen/Qwen3.8-Omni-Flash": {
    name: "Qwen 3.8 Omni Flash (GOAT 7x)",
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
      }
    }
  },
  "z-ai/glm-5.3-flash": {
    name: "GLM 5.3 Flash (GOAT 7x)",
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
      high: {
        reasoningEffort: "high"
      },
      max: {
        reasoningEffort: "max"
      }
    }
  },
  "meituan/LongCat-2.0": {
    name: "LongCat 2.0 (GOAT 7x)",
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
    reasoning: false,
    variants: {
      high: {
        reasoningEffort: "high"
      }
    }
  },
  "MiniMaxAI/MiniMax-M3": {
    name: "MiniMax M3 (GOAT 7x + 2x Deal)",
    limit: {
      context: 1e6,
      output: 1048576
    },
    cost: {
      input: 0.015,
      output: 0.045,
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
  "tencent/hy4-preview": {
    name: "Tencent Hy4 Preview (GOAT 7x)",
    limit: {
      context: 1048576,
      output: 64000
    },
    cost: {
      input: 0.03,
      output: 0.09,
      cache_read: 0.003,
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
  "moonshotai/Kimi-K2.7-Code": {
    name: "Kimi K2.7 Code (GOAT 7x)",
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
  "stepfun/Step-3.7-Flash": {
    name: "Step 3.7 Flash (GOAT 7x)",
    limit: {
      context: 256000,
      output: 262144
    },
    cost: {
      input: 0.025,
      output: 0.08,
      cache_read: 0.002,
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
    name: "Gemini 3.8 Flash (GOAT 7x)",
    limit: {
      context: 1e6,
      output: 65536
    },
    cost: {
      input: 0.075,
      output: 0.3,
      cache_read: 0.01,
      cache_write: 0
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
  "gpt-5.6-luna": {
    name: "GPT-5.6 Luna (GOAT 7x)",
    limit: {
      context: 1050000,
      output: 128000
    },
    cost: {
      input: 0.15,
      output: 0.6,
      cache_read: 0.02,
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
      },
      max: {
        reasoningEffort: "max"
      }
    }
  },
  "meta/muse-spark-1.3-contributor": {
    name: "Muse Spark 1.3 Contributor (GOAT 7x)",
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
  "inclusionai/ling-3.0-flash-sante:free": {
    name: "Ling 3.0 Flash Sante (Free Tier)",
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
    reasoning: false,
    variants: {
      high: {
        reasoningEffort: "high"
      }
    }
  },
  "poolside/laguna-s-2.1-free": {
    name: "Laguna S 2.1 (Free Tier)",
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
  "moonshotai/Kimi-K3": {
    name: "Kimi K3",
    limit: {
      context: 1e6,
      output: 131072
    },
    cost: {
      input: 0.4286,
      output: 2.1429,
      cache_read: 0.0429,
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
      high: {
        reasoningEffort: "high"
      },
      max: {
        reasoningEffort: "max"
      }
    }
  },
  "moonshotai/Kimi-K2.7-Code-Highspeed": {
    name: "Kimi K2.7 Code HighSpeed",
    limit: {
      context: 262000,
      output: 65536
    },
    cost: {
      input: 0.2714,
      output: 1.1429,
      cache_read: 0.0457,
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
    }
  },
  "z-ai/glm-5.3-flashx": {
    name: "GLM-5.3 FlashX",
    limit: {
      context: 1e6,
      output: 131072
    },
    cost: {
      input: 0.0529,
      output: 0.1786,
      cache_read: 0.0107,
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
      high: {
        reasoningEffort: "high"
      },
      max: {
        reasoningEffort: "max"
      }
    }
  },
  "zai-org/GLM-5.3": {
    name: "GLM-5.3",
    limit: {
      context: 1e6,
      output: 1024000
    },
    cost: {
      input: 0.2,
      output: 0.6286,
      cache_read: 0.2,
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
      },
      max: {
        reasoningEffort: "max"
      }
    }
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
        "video",
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
      high: {
        reasoningEffort: "high"
      }
    }
  },
  "xiaomi/mimo-v2.6-pro-ultraspeed": {
    name: "MiMo V2.6 Pro UltraSpeed",
    limit: {
      context: 1048576,
      output: 131072
    },
    cost: {
      input: 0.6214,
      output: 1.2429,
      cache_read: 0.0051,
      cache_write: 0
    },
    modalities: {
      input: [
        "text",
        "image",
        "video",
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
      high: {
        reasoningEffort: "high"
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
        "video",
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
      high: {
        reasoningEffort: "high"
      }
    }
  },
  "Qwen/Qwen3.8-Max-0902": {
    name: "Qwen 3.8 Max 0902",
    limit: {
      context: 1e6,
      output: 131072
    },
    cost: {
      input: 0.2857,
      output: 0.8571,
      cache_read: 0.0243,
      cache_write: 0.3571
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
  "Qwen/Qwen3.8-Max": {
    name: "Qwen 3.8 Max",
    limit: {
      context: 1e6,
      output: 65536
    },
    cost: {
      input: 0.2857,
      output: 0.8571,
      cache_read: 0.0357,
      cache_write: 0.3571
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
    }
  },
  "Qwen/Qwen3.8-Flash": {
    name: "Qwen 3.8 Flash",
    limit: {
      context: 1e6,
      output: 131072
    },
    cost: {
      input: 0.02,
      output: 0.06,
      cache_read: 0.0023,
      cache_write: 0.0286
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
      high: {
        reasoningEffort: "high"
      }
    }
  }
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
function shouldEnableZdr(headers) {
  for (const key of ENV_ZDR_KEYS) {
    if (process.env[key] === "1" || process.env[key]?.toLowerCase() === "true") {
      return true;
    }
  }
  return headers ? headers.has(HEADERS.ZDR) : false;
}
function createCommandCodeHeaders(existingHeaders, apiKey) {
  const headers = new Headers(existingHeaders);
  if (apiKey && apiKey !== DUMMY_API_KEY) {
    headers.set(HEADERS.AUTHORIZATION, `Bearer ${apiKey}`);
  }
  if (shouldEnableZdr(headers) && !headers.has(HEADERS.ZDR)) {
    headers.set(HEADERS.ZDR, ZERO_DATA_RETENTION_VALUE);
  }
  return headers;
}
function createCommandCodeFetch(getAuth, fallbackApiKey) {
  return async (requestInput, init) => {
    const currentAuth = await getAuth();
    const resolvedKey = resolveApiKey(currentAuth?.type === "api" ? currentAuth.key : fallbackApiKey);
    const headers = createCommandCodeHeaders(init?.headers, resolvedKey);
    const targetUrl = rewriteUrlForCommandCode(requestInput);
    return fetch(targetUrl, {
      ...init,
      headers
    });
  };
}

// index.ts
var CommandCodePlugin = async (_input) => {
  return {
    config: async (cfg) => {
      cfg.provider ??= {};
      const existing = cfg.provider[PLUGIN_ID] ?? {};
      cfg.provider[PLUGIN_ID] = {
        name: PROVIDER_NAME,
        api: COMMANDCODE_BASE_URL,
        npm: "@ai-sdk/openai-compatible",
        env: [...ENV_API_KEYS],
        ...existing,
        options: {
          baseURL: COMMANDCODE_BASE_URL,
          ...existing.options ?? {}
        },
        models: {
          ...GOAT_MODELS,
          ...existing.models ?? {}
        }
      };
    },
    auth: {
      provider: PLUGIN_ID,
      async loader(getAuth) {
        const auth2 = await getAuth();
        const apiKey = resolveApiKey(auth2?.type === "api" ? auth2.key : undefined);
        return {
          apiKey,
          baseURL: COMMANDCODE_BASE_URL,
          fetch: createCommandCodeFetch(getAuth, apiKey)
        };
      },
      methods: AUTH_METHODS
    },
    provider: {
      id: PLUGIN_ID,
      async models(provider, _ctx) {
        return provider.models;
      }
    }
  };
};
var opencode_commandcode_default = {
  id: PLUGIN_ID,
  server: CommandCodePlugin
};
export {
  shouldEnableZdr,
  rewriteUrlForCommandCode,
  resolveApiKey,
  isApiKeyValid,
  opencode_commandcode_default as default,
  createCommandCodeHeaders,
  createCommandCodeFetch,
  ZERO_DATA_RETENTION_VALUE,
  PROVIDER_NAME,
  PLUGIN_ID,
  HEADERS,
  GOAT_MODELS,
  ENV_ZDR_KEYS,
  ENV_API_KEYS,
  DUMMY_API_KEY,
  CommandCodePlugin,
  COMMANDCODE_RESPONSES_ENDPOINT,
  COMMANDCODE_MODELS_ENDPOINT,
  COMMANDCODE_CHAT_ENDPOINT,
  COMMANDCODE_BASE_URL,
  AUTH_METHODS,
  AUTH_LABELS
};

//# debugId=D3E7F3451D0D578564756E2164756E21
