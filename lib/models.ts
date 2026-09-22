import type { CommandCodeModelDefinition } from "./types.js";

/**
 * Curated Latest-Generation Model Lineup for CommandCode GOAT Plan
 * Automatically synchronized with CommandCode API & models.dev specifications.
 * Previous-generation obsolete versions are automatically filtered out.
 * Last updated: 2026-09-22T00:32:23.460Z
 */
export const GOAT_MODELS: Record<string, CommandCodeModelDefinition> = {
  "deepseek/deepseek-v4.1-flash": {
    "name": "DeepSeek V4.1 Flash (GOAT 7x)",
    "limit": {
      "context": 1000000,
      "output": 384000
    },
    "cost": {
      "input": 0.021,
      "output": 0.085,
      "cache_read": 0.0004,
      "cache_write": 0
    },
    "modalities": {
      "input": [
        "text",
        "image"
      ],
      "output": [
        "text"
      ]
    },
    "reasoning": true,
    "interleaved": {
      "field": "reasoning_content"
    },
    "variants": {
      "low": {
        "reasoningEffort": "low"
      },
      "high": {
        "reasoningEffort": "high"
      },
      "max": {
        "reasoningEffort": "max"
      }
    }
  },
  "Qwen/Qwen3.8-Omni-Flash": {
    "name": "Qwen 3.8 Omni Flash (GOAT 7x)",
    "limit": {
      "context": 1000000,
      "output": 131072
    },
    "cost": {
      "input": 0.021,
      "output": 0.067,
      "cache_read": 0.002,
      "cache_write": 0
    },
    "modalities": {
      "input": [
        "text",
        "image",
        "audio",
        "video"
      ],
      "output": [
        "text"
      ]
    },
    "reasoning": true,
    "interleaved": {
      "field": "reasoning_content"
    },
    "variants": {
      "high": {
        "reasoningEffort": "high"
      }
    }
  },
  "z-ai/glm-5.3-flash": {
    "name": "GLM 5.3 Flash (GOAT 7x)",
    "limit": {
      "context": 1048576,
      "output": 131072
    },
    "cost": {
      "input": 0.052,
      "output": 0.178,
      "cache_read": 0.01,
      "cache_write": 0
    },
    "modalities": {
      "input": [
        "text",
        "image",
        "video",
        "pdf"
      ],
      "output": [
        "text"
      ]
    },
    "reasoning": true,
    "interleaved": {
      "field": "reasoning_content"
    },
    "variants": {
      "low": {
        "reasoningEffort": "low"
      },
      "high": {
        "reasoningEffort": "high"
      },
      "max": {
        "reasoningEffort": "max"
      }
    }
  },
  "meituan/LongCat-2.0": {
    "name": "LongCat 2.0 (GOAT 7x)",
    "limit": {
      "context": 1048576,
      "output": 262144
    },
    "cost": {
      "input": 0.025,
      "output": 0.075,
      "cache_read": 0.002,
      "cache_write": 0
    },
    "modalities": {
      "input": [
        "text"
      ],
      "output": [
        "text"
      ]
    },
    "reasoning": false
  },
  "MiniMaxAI/MiniMax-M3": {
    "name": "MiniMax M3 (GOAT 7x + 2x Deal)",
    "limit": {
      "context": 1000000,
      "output": 1048576
    },
    "cost": {
      "input": 0.015,
      "output": 0.045,
      "cache_read": 0.001,
      "cache_write": 0
    },
    "modalities": {
      "input": [
        "text"
      ],
      "output": [
        "text"
      ]
    },
    "reasoning": true,
    "interleaved": {
      "field": "reasoning_content"
    },
    "variants": {
      "low": {
        "reasoningEffort": "low"
      },
      "medium": {
        "reasoningEffort": "medium"
      },
      "high": {
        "reasoningEffort": "high"
      },
      "max": {
        "reasoningEffort": "max"
      }
    }
  },
  "tencent/hy4-preview": {
    "name": "Tencent Hy4 Preview (GOAT 7x)",
    "limit": {
      "context": 1048576,
      "output": 64000
    },
    "cost": {
      "input": 0.03,
      "output": 0.09,
      "cache_read": 0.003,
      "cache_write": 0
    },
    "modalities": {
      "input": [
        "text"
      ],
      "output": [
        "text"
      ]
    },
    "reasoning": true,
    "interleaved": {
      "field": "reasoning_content"
    },
    "variants": {
      "low": {
        "reasoningEffort": "low"
      },
      "high": {
        "reasoningEffort": "high"
      }
    }
  },
  "moonshotai/Kimi-K2.7-Code": {
    "name": "Kimi K2.7 Code (GOAT 7x)",
    "limit": {
      "context": 256000,
      "output": 262144
    },
    "cost": {
      "input": 0.035,
      "output": 0.11,
      "cache_read": 0.005,
      "cache_write": 0
    },
    "modalities": {
      "input": [
        "text",
        "image",
        "video"
      ],
      "output": [
        "text"
      ]
    },
    "reasoning": true,
    "interleaved": {
      "field": "reasoning_content"
    },
    "variants": {
      "low": {
        "reasoningEffort": "low"
      },
      "medium": {
        "reasoningEffort": "medium"
      },
      "high": {
        "reasoningEffort": "high"
      }
    }
  },
  "stepfun/Step-3.7-Flash": {
    "name": "Step 3.7 Flash (GOAT 7x)",
    "limit": {
      "context": 256000,
      "output": 262144
    },
    "cost": {
      "input": 0.025,
      "output": 0.08,
      "cache_read": 0.002,
      "cache_write": 0
    },
    "modalities": {
      "input": [
        "text",
        "image",
        "video"
      ],
      "output": [
        "text"
      ]
    },
    "reasoning": true,
    "interleaved": {
      "field": "reasoning_content"
    },
    "variants": {
      "low": {
        "reasoningEffort": "low"
      },
      "medium": {
        "reasoningEffort": "medium"
      },
      "high": {
        "reasoningEffort": "high"
      }
    }
  },
  "google/gemini-3.8-flash": {
    "name": "Gemini 3.8 Flash (GOAT 7x)",
    "limit": {
      "context": 1000000,
      "output": 65536
    },
    "cost": {
      "input": 0.075,
      "output": 0.3,
      "cache_read": 0.01,
      "cache_write": 0
    },
    "modalities": {
      "input": [
        "text",
        "image",
        "video",
        "audio",
        "pdf"
      ],
      "output": [
        "text"
      ]
    },
    "reasoning": true,
    "interleaved": {
      "field": "reasoning_content"
    },
    "variants": {
      "low": {
        "reasoningEffort": "low"
      },
      "medium": {
        "reasoningEffort": "medium"
      },
      "high": {
        "reasoningEffort": "high"
      }
    }
  },
  "gpt-5.6-luna": {
    "name": "GPT-5.6 Luna (GOAT 7x)",
    "limit": {
      "context": 1050000,
      "output": 128000
    },
    "cost": {
      "input": 0.15,
      "output": 0.6,
      "cache_read": 0.02,
      "cache_write": 0
    },
    "modalities": {
      "input": [
        "text",
        "image",
        "pdf"
      ],
      "output": [
        "text"
      ]
    },
    "reasoning": true,
    "interleaved": {
      "field": "reasoning_content"
    },
    "variants": {
      "low": {
        "reasoningEffort": "low"
      },
      "medium": {
        "reasoningEffort": "medium"
      },
      "high": {
        "reasoningEffort": "high"
      },
      "max": {
        "reasoningEffort": "max"
      }
    }
  },
  "meta/muse-spark-1.3-contributor": {
    "name": "Muse Spark 1.3 Contributor (GOAT 7x)",
    "limit": {
      "context": 1048576,
      "output": 943718
    },
    "cost": {
      "input": 0.018,
      "output": 0.054,
      "cache_read": 0.001,
      "cache_write": 0
    },
    "modalities": {
      "input": [
        "text",
        "image",
        "video",
        "audio",
        "pdf"
      ],
      "output": [
        "text"
      ]
    },
    "reasoning": true,
    "interleaved": {
      "field": "reasoning_content"
    },
    "variants": {
      "low": {
        "reasoningEffort": "low"
      },
      "medium": {
        "reasoningEffort": "medium"
      },
      "high": {
        "reasoningEffort": "high"
      }
    }
  },
  "poolside/laguna-s-2.1-free": {
    "name": "Laguna S 2.1 (Free Tier)",
    "limit": {
      "context": 256000,
      "output": 32768
    },
    "cost": {
      "input": 0,
      "output": 0,
      "cache_read": 0,
      "cache_write": 0
    },
    "modalities": {
      "input": [
        "text"
      ],
      "output": [
        "text"
      ]
    },
    "reasoning": true,
    "interleaved": {
      "field": "reasoning_content"
    },
    "variants": {
      "low": {
        "reasoningEffort": "low"
      },
      "high": {
        "reasoningEffort": "high"
      }
    }
  },
  "moonshotai/Kimi-K3": {
    "name": "Kimi K3",
    "limit": {
      "context": 1000000,
      "output": 131072
    },
    "cost": {
      "input": 0.4286,
      "output": 2.1429,
      "cache_read": 0.0429,
      "cache_write": 0
    },
    "modalities": {
      "input": [
        "text",
        "image",
        "video"
      ],
      "output": [
        "text"
      ]
    },
    "reasoning": true,
    "interleaved": {
      "field": "reasoning_content"
    },
    "variants": {
      "low": {
        "reasoningEffort": "low"
      },
      "high": {
        "reasoningEffort": "high"
      },
      "max": {
        "reasoningEffort": "max"
      }
    }
  },
  "zai-org/GLM-5.3": {
    "name": "GLM-5.3",
    "limit": {
      "context": 1000000,
      "output": 1024000
    },
    "cost": {
      "input": 0.2,
      "output": 0.6286,
      "cache_read": 0.2,
      "cache_write": 0
    },
    "modalities": {
      "input": [
        "text"
      ],
      "output": [
        "text"
      ]
    },
    "reasoning": true,
    "interleaved": {
      "field": "reasoning_content"
    },
    "variants": {
      "low": {
        "reasoningEffort": "low"
      },
      "high": {
        "reasoningEffort": "high"
      },
      "max": {
        "reasoningEffort": "max"
      }
    }
  },
  "xiaomi/mimo-v2.6-pro": {
    "name": "MiMo V2.6 Pro",
    "limit": {
      "context": 1048576,
      "output": 131072
    },
    "cost": {
      "input": 0.0621,
      "output": 0.1243,
      "cache_read": 0.0005,
      "cache_write": 0
    },
    "modalities": {
      "input": [
        "text",
        "image",
        "video",
        "audio"
      ],
      "output": [
        "text"
      ]
    },
    "reasoning": true,
    "interleaved": {
      "field": "reasoning_content"
    },
    "variants": {
      "high": {
        "reasoningEffort": "high"
      }
    }
  },
  "xiaomi/mimo-v2.6-flash": {
    "name": "MiMo V2.6 Flash",
    "limit": {
      "context": 1048576,
      "output": 131072
    },
    "cost": {
      "input": 0.02,
      "output": 0.04,
      "cache_read": 0.0004,
      "cache_write": 0
    },
    "modalities": {
      "input": [
        "text",
        "image",
        "video",
        "audio"
      ],
      "output": [
        "text"
      ]
    },
    "reasoning": true,
    "interleaved": {
      "field": "reasoning_content"
    },
    "variants": {
      "high": {
        "reasoningEffort": "high"
      }
    }
  },
  "Qwen/Qwen3.8-Max-0902": {
    "name": "Qwen 3.8 Max 0902",
    "limit": {
      "context": 1000000,
      "output": 131072
    },
    "cost": {
      "input": 0.2857,
      "output": 0.8571,
      "cache_read": 0.0243,
      "cache_write": 0.3571
    },
    "modalities": {
      "input": [
        "text",
        "image",
        "video",
        "pdf"
      ],
      "output": [
        "text"
      ]
    },
    "reasoning": true,
    "interleaved": {
      "field": "reasoning_content"
    },
    "variants": {
      "low": {
        "reasoningEffort": "low"
      },
      "medium": {
        "reasoningEffort": "medium"
      },
      "high": {
        "reasoningEffort": "high"
      },
      "max": {
        "reasoningEffort": "max"
      }
    }
  }
};
