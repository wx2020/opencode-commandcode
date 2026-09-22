/**
 * Dynamic Model Synchronizer for CommandCode
 * Fetches real-time models from CommandCode Provider API and enriches them with
 * verified capabilities, 384k output limits, and reasoning variants from models.dev.
 */

import { writeFileSync, readFileSync, existsSync } from "fs";
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

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { "User-Agent": "opencode-commandcode-syncer/1.0" } });
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function syncModels(options: { dryRun?: boolean; forceWrite?: boolean } = {}) {
  console.log("🌐 Fetching real-time models from CommandCode Provider API...");
  const ccResponse = await fetchJson<{ data: CommandCodeRawModel[] }>(COMMANDCODE_MODELS_URL);
  const rawModels = ccResponse.data || [];
  console.log(`✅ Fetched ${rawModels.length} models from CommandCode.`);

  console.log("🌐 Fetching global model specifications from models.dev...");
  const modelsDev = await fetchJson<Record<string, { models?: Record<string, ModelsDevSpec> }>>(
    MODELS_DEV_API_URL
  );

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

  const updatedModels: Record<string, CommandCodeModelDefinition> = {};
  const added: string[] = [];
  const updated: string[] = [];

  // Focus on currently curated models + newly detected high-value models
  // To preserve precision, start with CURRENT_MODELS as baseline
  const targetIds = new Set([
    ...Object.keys(CURRENT_MODELS),
    ...rawModels.map((m) => m.id),
  ]);

  for (const modelId of targetIds) {
    const ccModel = rawModels.find((m) => m.id === modelId);
    // If model is in CURRENT_MODELS but no longer in CommandCode raw list, retain or handle
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
    const inputModalities = (devSpec?.modalities?.input || currentDef?.modalities?.input || [
      "text",
    ]) as Array<"text" | "image" | "audio" | "video" | "pdf">;
    const outputModalities = (devSpec?.modalities?.output || currentDef?.modalities?.output || [
      "text",
    ]) as Array<"text" | "image" | "audio" | "video" | "pdf">;

    // Reasoning
    const isReasoning =
      currentDef?.reasoning ??
      (devSpec?.reasoning ||
        devSpec?.reasoning_options !== undefined ||
        lowerId.includes("flash") ||
        lowerId.includes("deepseek") ||
        lowerId.includes("qwen") ||
        lowerId.includes("glm"));

    // Reasoning Variants
    let variants = currentDef?.variants;
    if (devSpec?.reasoning_options) {
      const effortOpt = devSpec.reasoning_options.find((o) => o.type === "effort" && o.values);
      if (effortOpt && effortOpt.values) {
        const validValues = effortOpt.values.filter(
          (v) => v === "low" || v === "medium" || v === "high" || v === "max"
        ) as Array<"low" | "medium" | "high" | "max">;

        if (validValues.length > 0) {
          variants = {};
          for (const val of validValues) {
            variants[val] = { reasoningEffort: val };
          }
        }
      }
    }

    // Cost calculation (7x discount for GOAT plan)
    const rawCost = devSpec?.cost || currentDef?.cost || { input: 0.1, output: 0.3 };
    const cost = {
      input: Number(((rawCost.input || 0.1) / 7).toFixed(4)),
      output: Number(((rawCost.output || 0.3) / 7).toFixed(4)),
      cache_read: rawCost.cache_read ? Number((rawCost.cache_read / 7).toFixed(4)) : 0.001,
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
      ...(variants ? { variants } : {}),
    };

    // Check changes against current
    if (!currentDef) {
      // Only add to default GOAT lineup if it is a major coding/reasoning model
      if (
        lowerId.includes("deepseek") ||
        lowerId.includes("qwen") ||
        lowerId.includes("glm") ||
        lowerId.includes("kimi") ||
        lowerId.includes("mimo") ||
        lowerId.includes("gemini")
      ) {
        added.push(modelId);
        updatedModels[modelId] = newDef;
      }
    } else {
      const isDiff = JSON.stringify(currentDef) !== JSON.stringify(newDef);
      if (isDiff) {
        updated.push(modelId);
      }
      updatedModels[modelId] = newDef;
    }
  }

  const hasChanges = added.length > 0 || updated.length > 0;

  console.log("\n📊 Model Synchronization Analysis:");
  console.log(`  - Existing Models Checked: ${Object.keys(CURRENT_MODELS).length}`);
  console.log(`  - Newly Added Models: ${added.length} ${added.length ? `(${added.join(", ")})` : ""}`);
  console.log(`  - Updated Models: ${updated.length} ${updated.length ? `(${updated.join(", ")})` : ""}`);

  const summary = {
    timestamp: new Date().toISOString(),
    hasChanges,
    added,
    updated,
    totalModels: Object.keys(updatedModels).length,
  };

  const rootDir = join(__dirname, "..");
  writeFileSync(join(rootDir, "sync-summary.json"), JSON.stringify(summary, null, 2), "utf8");

  if (!hasChanges && !options.forceWrite) {
    console.log("✨ All models are already up to date. No file changes needed.");
    return { hasChanges: false, summary };
  }

  if (options.dryRun) {
    console.log("🔍 Dry run enabled: Skipping writing to lib/models.ts");
    return { hasChanges: true, summary };
  }

  // Generate updated lib/models.ts
  const modelsCode = `import type { CommandCodeModelDefinition } from "./types.js";

/**
 * Curated Model Lineup for CommandCode GOAT Plan
 * Automatically synchronized with CommandCode API & models.dev specifications.
 * Last updated: ${new Date().toISOString()}
 */
export const GOAT_MODELS: Record<string, CommandCodeModelDefinition> = ${JSON.stringify(
    updatedModels,
    null,
    2
  )};
`;

  writeFileSync(join(rootDir, "lib", "models.ts"), modelsCode, "utf8");
  console.log("💾 Successfully updated lib/models.ts!");

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
