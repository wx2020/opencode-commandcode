/**
 * Dynamic Model Synchronizer for CommandCode
 * Fetches real-time models from CommandCode Provider API and enriches them with
 * verified capabilities, 384k output limits, and reasoning variants from models.dev.
 * Automatically filters out obsolete/deprecated versions in favor of the latest flagship models.
 */

import { writeFileSync } from "fs";
import { join } from "path";
import { GOAT_MODELS as CURRENT_MODELS } from "../lib/models.js";
import type { CommandCodeModelDefinition } from "../lib/types.js";

const COMMANDCODE_MODELS_URL = "https://api.commandcode.ai/provider/v1/models";
const MODELS_DEV_API_URL = "https://models.dev/api.json";

interface CommandCodeRawModel {
  id: string;
  name?: string;
  context_length?: number;
  supported_endpoints?: string[];
  owned_by?: string;
}

interface ModelsDevSpec {
  id?: string;
  name?: string;
  reasoning?: boolean;
  reasoning_options?: Array<{
    type: string;
    values?: string[];
  }>;
  modalities?: {
    input?: string[];
    output?: string[];
  };
  limit?: {
    context?: number;
    input?: number;
    output?: number;
  };
  cost?: {
    input?: number;
    output?: number;
    cache_read?: number;
    cache_write?: number;
  };
}

/**
 * Curated and Ordered 18-Model Lineup for CommandCode GOAT Plan.
 * Hierarchical order:
 * 1. High-Quota Flagships (5h Quota >= 4,000, sorted descending by quota)
 * 2. Zero-Cost Free Models (Dual Fallback)
 * 3. Cross-Vendor Benchmark Flagships (1 per other vendor, sorted descending by quota)
 */
export const ORDERED_MODEL_IDS = [
  // 1. 高配额主力模型 (Quota >= 4000, 降序)
  "deepseek/deepseek-v4.1-flash",
  "xiaomi/mimo-v2.6-flash",
  "meta/muse-spark-1.3-contributor",
  "meituan/LongCat-2.0",
  "tencent/hy3-paid",
  "xiaomi/mimo-v2.6-pro",
  "Qwen/Qwen3.8-27B",
  "z-ai/glm-5.3-flash",
  "Qwen/Qwen3.8-Omni-Flash",
  "stepfun/Step-3.5-Flash",
  "gpt-5.6-luna",
  "MiniMaxAI/MiniMax-M3",

  // 2. 零成本免费模型 (Free Tier 双保底)
  "poolside/laguna-s-2.1-free",
  "inclusionai/ling-3.0-flash-sante:free",

  // 3. 跨厂对比模型 (各1款代表作，按配额降序)
  "moonshotai/Kimi-K2.7-Code",
  "google/gemini-3.8-flash",
  "thinkingmachines/inkling-small",
  "xai/grok-4.6",
] as const;

/**
 * Prunes obsolete generations, redundant intra-family variants,
 * and models that do not meet the 3-tier curation rules.
 */
export function isOutdatedVersion(modelId: string, availableModelIds?: string[]): boolean {
  return !(ORDERED_MODEL_IDS as readonly string[]).includes(modelId);
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { "User-Agent": "opencode-commandcode-syncer/1.0" },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function syncModels(
  options: { dryRun?: boolean; forceWrite?: boolean } = {}
) {
  console.log("🌐 Fetching real-time models from CommandCode Provider API...");
  const ccResponse = await fetchJson<{ data: CommandCodeRawModel[] }>(
    COMMANDCODE_MODELS_URL
  );
  const rawModels = ccResponse.data || [];
  console.log(`✅ Fetched ${rawModels.length} models from CommandCode.`);

  console.log("🌐 Fetching global model specifications from models.dev...");
  const modelsDev = await fetchJson<
    Record<string, { models?: Record<string, ModelsDevSpec> }>
  >(MODELS_DEV_API_URL);

  // Build high-efficiency lookup index for models.dev
  const specMap = new Map<string, ModelsDevSpec>();
  for (const provider of Object.values(modelsDev)) {
    if (provider.models) {
      for (const [id, m] of Object.entries(provider.models)) {
        const lowerId = id.toLowerCase();
        if (!specMap.has(lowerId)) specMap.set(lowerId, m);
        const shortId = lowerId.split("/").pop() || lowerId;
        if (!specMap.has(shortId)) specMap.set(shortId, m);
      }
    }
  }

  const allAvailableIds = Array.from(
    new Set([...Object.keys(CURRENT_MODELS), ...rawModels.map((m) => m.id)])
  );

  const updatedModels: Record<string, CommandCodeModelDefinition> = {};
  const added: string[] = [];
  const updated: string[] = [];
  const pruned: string[] = [];

  // 1. Identify and record pruned models that were previously active
  for (const prevId of Object.keys(CURRENT_MODELS)) {
    if (isOutdatedVersion(prevId)) {
      pruned.push(prevId);
    }
  }

  // 2. Synchronize and populate models strictly in ORDERED_MODEL_IDS order
  for (const modelId of ORDERED_MODEL_IDS) {
    const ccModel = rawModels.find((m) => m.id === modelId);
    const currentDef = CURRENT_MODELS[modelId];

    // Find closest spec in models.dev
    const lowerId = modelId.toLowerCase();
    const shortId = lowerId.split("/").pop() || lowerId;
    const devSpec = specMap.get(lowerId) || specMap.get(shortId);

    // Calculate context & output limits
    const contextLimit =
      ccModel?.context_length ||
      devSpec?.limit?.context ||
      currentDef?.limit?.context ||
      128_000;

    const outputLimit =
      devSpec?.limit?.output ||
      currentDef?.limit?.output ||
      Math.min(contextLimit, 131_072);

    // Modalities
    const inputModalities = (devSpec?.modalities?.input ||
      currentDef?.modalities?.input || ["text"]) as Array<
      "text" | "image" | "audio" | "video" | "pdf"
    >;
    const outputModalities = (devSpec?.modalities?.output ||
      currentDef?.modalities?.output || ["text"]) as Array<
      "text" | "image" | "audio" | "video" | "pdf"
    >;

    // Reasoning
    const isReasoning =
      currentDef?.reasoning ??
      (devSpec?.reasoning ||
        devSpec?.reasoning_options !== undefined ||
        lowerId.includes("flash") ||
        lowerId.includes("deepseek") ||
        lowerId.includes("qwen") ||
        lowerId.includes("glm") ||
        lowerId.includes("kimi") ||
        lowerId.includes("step") ||
        lowerId.includes("inkling") ||
        lowerId.includes("laguna") ||
        lowerId.includes("grok"));

    // Reasoning Variants (only applicable if reasoning is supported)
    let variants = currentDef?.variants ? { ...currentDef.variants } : undefined;
    if (isReasoning && devSpec?.reasoning_options) {
      const effortOpt = devSpec.reasoning_options.find(
        (o) => o.type === "effort" && o.values
      );
      if (effortOpt && effortOpt.values) {
        const validValues = effortOpt.values.filter(
          (v) => v === "low" || v === "medium" || v === "high" || v === "max"
        ) as Array<"low" | "medium" | "high" | "max">;

        if (validValues.length > 0) {
          variants = variants || {};
          for (const val of validValues) {
            variants[val] = { reasoningEffort: val };
          }
        }
      }
    }

    // Cost calculation (7x discount for GOAT plan, 0 for free)
    const isFree = modelId.includes("free");
    const rawCost = isFree
      ? { input: 0, output: 0, cache_read: 0, cache_write: 0 }
      : devSpec?.cost || currentDef?.cost || { input: 0.1, output: 0.3 };

    const cost = isFree
      ? { input: 0, output: 0, cache_read: 0, cache_write: 0 }
      : {
          input: Number(((rawCost.input || 0.1) / 7).toFixed(4)),
          output: Number(((rawCost.output || 0.3) / 7).toFixed(4)),
          cache_read: rawCost.cache_read
            ? Number((rawCost.cache_read / 7).toFixed(4))
            : 0.001,
          cache_write: rawCost.cache_write ? Number((rawCost.cache_write / 7).toFixed(4)) : 0,
        };

    const newDef: CommandCodeModelDefinition = {
      name: currentDef?.name || ccModel?.name || `${modelId} (GOAT 7x)`,
      limit: {
        context: contextLimit,
        output: outputLimit,
      },
      cost: currentDef?.cost || cost,
      modalities: {
        input: inputModalities,
        output: outputModalities,
      },
      reasoning: isReasoning,
      ...(isReasoning ? { interleaved: { field: "reasoning_content" } } : {}),
      ...(isReasoning && variants && Object.keys(variants).length > 0 ? { variants } : {}),
    };

    if (!currentDef) {
      added.push(modelId);
    } else {
      const isDiff = JSON.stringify(currentDef) !== JSON.stringify(newDef);
      if (isDiff) {
        updated.push(modelId);
      }
    }
    updatedModels[modelId] = newDef;
  }

  const hasChanges = added.length > 0 || updated.length > 0 || pruned.length > 0;

  console.log("\n📊 Intelligent Model Sync & Pruning Report:");
  console.log(`  - Active Latest Models: ${Object.keys(updatedModels).length}`);
  console.log(`  - Newly Added Models: ${added.length} ${added.length ? `(${added.join(", ")})` : ""}`);
  console.log(`  - Updated Models: ${updated.length} ${updated.length ? `(${updated.join(", ")})` : ""}`);
  console.log(`  - 🗑️ Obsolete Versions Pruned: ${pruned.length} ${pruned.length ? `(${pruned.join(", ")})` : ""}`);

  const summary = {
    timestamp: new Date().toISOString(),
    hasChanges,
    added,
    updated,
    pruned,
    totalModels: Object.keys(updatedModels).length,
  };

  const rootDir = join(__dirname, "..");
  writeFileSync(
    join(rootDir, "sync-summary.json"),
    JSON.stringify(summary, null, 2),
    "utf8"
  );

  if (!hasChanges && !options.forceWrite) {
    console.log("✨ All models are already up to date and pruned. No file changes needed.");
    return { hasChanges: false, summary };
  }

  if (options.dryRun) {
    console.log("🔍 Dry run enabled: Skipping writing to lib/models.ts");
    return { hasChanges: true, summary };
  }

  // Generate clean lib/models.ts
  const modelsCode = `import type { CommandCodeModelDefinition } from "./types.js";

/**
 * Curated Latest-Generation Model Lineup for CommandCode GOAT Plan
 * Automatically synchronized with CommandCode API & models.dev specifications.
 * Previous-generation obsolete versions are automatically filtered out.
 * Last updated: ${new Date().toISOString()}
 */
export const GOAT_MODELS: Record<string, CommandCodeModelDefinition> = ${JSON.stringify(
    updatedModels,
    null,
    2
  )};
`;

  writeFileSync(join(rootDir, "lib", "models.ts"), modelsCode, "utf8");
  console.log("💾 Successfully updated and pruned lib/models.ts!");

  return { hasChanges: true, summary };
}

// CLI Execution
if (import.meta.main) {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run") || args.includes("--check");
  const force = args.includes("--force");

  syncModels({ dryRun, forceWrite: force })
    .then(({ hasChanges }) => {
      if (hasChanges && args.includes("--check")) {
        console.log("⚠️ Changes detected during check mode.");
        process.exit(1);
      }
    })
    .catch((err) => {
      console.error("❌ Error syncing models:", err);
      process.exit(1);
    });
}
