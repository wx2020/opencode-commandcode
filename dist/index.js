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
      }
    }
  },
  "stepfun/Step-3.5-Flash": {
    name: "Step 3.5 Flash",
    limit: {
      context: 1e6,
      output: 4096
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
    }
  },
  "gpt-6-astra": {
    name: "GPT-6 Astra",
    limit: {
      context: 1050000,
      output: 128000
    },
    cost: {
      input: 1.4286,
      output: 7.1429,
      cache_read: 0.1429,
      cache_write: 1.7857
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
      output: 32768
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
  AUTH_LABELS,
  AUTH_METHODS,
  COMMANDCODE_BASE_URL,
  COMMANDCODE_CHAT_ENDPOINT,
  COMMANDCODE_MODELS_ENDPOINT,
  COMMANDCODE_RESPONSES_ENDPOINT,
  CommandCodePlugin,
  DUMMY_API_KEY,
  ENV_API_KEYS,
  ENV_ZDR_KEYS,
  GOAT_MODELS,
  HEADERS,
  PLUGIN_ID,
  PROVIDER_NAME,
  ZERO_DATA_RETENTION_VALUE,
  createCommandCodeFetch,
  createCommandCodeHeaders,
  opencode_commandcode_default as default,
  isApiKeyValid,
  resolveApiKey,
  rewriteUrlForCommandCode,
  shouldEnableZdr
};

//# debugId=DEC2C93D00EA4FC864756E2164756E21
