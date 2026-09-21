export interface ModelLimit {
  context: number;
  input?: number;
  output: number;
}

export interface ModelCost {
  input: number;
  output: number;
  cache_read?: number;
  cache_write?: number;
}

export interface ModelModalities {
  input: Array<"text" | "image" | "audio" | "video" | "pdf">;
  output: Array<"text" | "image" | "audio" | "video" | "pdf">;
}

export interface ModelVariantConfig {
  reasoningEffort?: "low" | "medium" | "high" | "max";
  [key: string]: unknown;
}

export interface CommandCodeModelDefinition {
  name: string;
  limit: ModelLimit;
  cost: ModelCost;
  modalities: ModelModalities;
  reasoning?: boolean;
  interleaved?: { field: string };
  variants?: Record<string, ModelVariantConfig>;
}

export interface AuthMethodDefinition {
  type: "api" | "oauth";
  label: string;
}
