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
 * Baseline 5-hour quotas from CommandCode official plan metrics.
 * Future unlisted models automatically estimate quota based on model type & tier.
 */
export const KNOWN_QUOTAS: Record<string, number> = {
  "deepseek/deepseek-v4.1-flash": 76900,
  "deepseek/deepseek-v4-flash": 76900,
  "deepseek/deepseek-v4-pro": 4940,
  "deepseek/deepseek-v4-flash-vision-exp": 25600,
  "deepseek/deepseek-v4-flash-fast": 2610,
  "xiaomi/mimo-v2.6-flash": 48700,
  "xiaomi/mimo-v2.6-pro": 14200,
  "xiaomi/mimo-v2.5": 48700,
  "xiaomi/mimo-v2.5-pro": 14200,
  "meta/muse-spark-1.3-contributor": 45500,
  "meta/muse-spark-1.2-contributor": 45500,
  "meta/muse-spark-1.3": 1070,
  "meta/muse-spark-1.2": 1070,
  "meituan/LongCat-2.0": 32100,
  "tencent/hy3-paid": 17700,
  "tencent/hy4-preview": 3060,
  "Qwen/Qwen3.8-27B": 12000,
  "Qwen/Qwen3.8-Omni-Flash": 9860,
  "Qwen/Qwen3.8-Flash": 9780,
  "Qwen/Qwen3.8-Max": 654,
  "Qwen/Qwen3.8-Max-0902": 654,
  "Qwen/Qwen3.7-Plus": 3560,
  "Qwen/Qwen3.7-Max": 579,
  "Qwen/Qwen3.6-Plus": 2750,
  "z-ai/glm-5.3-flash": 11800,
  "z-ai/glm-5.3-flashx": 2360,
  "zai-org/GLM-5.3": 677,
  "zai-org/GLM-5.2": 2370,
  "zai-org/GLM-5.2-Fast": 346,
  "stepfun/Step-3.5-Flash": 8770,
  "stepfun/Step-3.7-Flash": 4180,
  "gpt-5.6-luna": 7400,
  "gpt-5.6-sol": 1040,
  "MiniMaxAI/MiniMax-M3": 6930,
  "moonshotai/Kimi-K2.7-Code": 2710,
  "moonshotai/Kimi-K3": 490,
  "moonshotai/Kimi-K2.7-Code-Highspeed": 452,
  "google/gemini-3.8-flash": 1960,
  "google/gemini-3.7-flash": 1960,
  "thinkingmachines/inkling-small": 1770,
  "thinkingmachines/inkling": 989,
  "xai/grok-4.6": 360,
  "xai/grok-4.5": 360,
};

/**
 * Baseline quotas and latest generation anchors for recognized families.
 * Unlisted future generations (e.g. v4.2, 3.9) automatically inherit family quota benchmarks.
 */
export const FAMILY_BASE_QUOTAS: Record<string, { latestVer: number; quota: number }> = {
  deepseek: { latestVer: 4.1, quota: 76900 },
  mimo: { latestVer: 2.6, quota: 48700 },
  meta: { latestVer: 1.3, quota: 45500 },
  meituan: { latestVer: 2.0, quota: 32100 },
  tencent: { latestVer: 3.0, quota: 17700 },
  qwen: { latestVer: 3.8, quota: 10000 },
  glm: { latestVer: 5.3, quota: 11800 },
  stepfun: { latestVer: 3.5, quota: 8770 },
  openai: { latestVer: 5.6, quota: 7400 },
  minimax: { latestVer: 3.0, quota: 6930 },
  google: { latestVer: 3.8, quota: 1960 },
  kimi: { latestVer: 2.7, quota: 2710 },
  thinkingmachines: { latestVer: 1.0, quota: 1770 },
  xai: { latestVer: 4.6, quota: 360 },
};

export interface ModelMetadata {
  id: string;
  family: string;
  isFree: boolean;
  type: "Pro" | "Flash";
  version: number;
  quota: number;
}

export function extractModelVersion(id: string): number {
  const lower = id.toLowerCase();
  const m = lower.match(/(?:[vmk]|\b)(\d+(?:\.\d+)?)/i);
  if (m) return parseFloat(m[1]);
  const anyNum = lower.match(/(\d+(?:\.\d+)?)/);
  return anyNum ? parseFloat(anyNum[1]) : 1.0;
}

export function parseModelMetadata(id: string): ModelMetadata {
  const lower = id.toLowerCase();
  let family = "other";
  if (lower.includes("deepseek")) family = "deepseek";
  else if (lower.includes("mimo") || lower.includes("xiaomi")) family = "mimo";
  else if (lower.includes("muse") || lower.includes("meta/")) family = "meta";
  else if (lower.includes("longcat") || lower.includes("meituan")) family = "meituan";
  else if (lower.includes("hy") || lower.includes("tencent")) family = "tencent";
  else if (lower.includes("qwen")) family = "qwen";
  else if (lower.includes("glm") || lower.includes("z-ai") || lower.includes("zai-org")) family = "glm";
  else if (lower.includes("step")) family = "stepfun";
  else if (lower.includes("gpt") || lower.includes("openai")) family = "openai";
  else if (lower.includes("minimax")) family = "minimax";
  else if (lower.includes("kimi") || lower.includes("moonshot")) family = "kimi";
  else if (lower.includes("gemini") || lower.includes("google")) family = "google";
  else if (lower.includes("inkling") || lower.includes("thinkingmachines")) family = "thinkingmachines";
  else if (lower.includes("grok") || lower.includes("xai")) family = "xai";
  else if (lower.includes("laguna") || lower.includes("poolside")) family = "poolside";
  else if (lower.includes("ling") || lower.includes("inclusionai")) family = "inclusionai";
  else if (lower.includes("claude")) family = "anthropic";

  const isFree = lower.includes("free");
  let type: "Pro" | "Flash" = "Pro";
  if (
    lower.includes("flash") ||
    lower.includes("27b") ||
    lower.includes("small") ||
    lower.includes("fast") ||
    lower.includes("hy3") ||
    lower.includes("longcat")
  ) {
    type = "Flash";
  }

  const version = extractModelVersion(id);

  // Resolve quota:
  // 1. Free models = 0
  // 2. Known model = exact known quota
  // 3. New flagship generation in recognized family = inherits family base quota
  // 4. Otherwise = 0
  let quota = 0;
  if (!isFree) {
    if (KNOWN_QUOTAS[id] !== undefined) {
      quota = KNOWN_QUOTAS[id];
    } else {
      const base = FAMILY_BASE_QUOTAS[family];
      // Only inherit if strictly newer generation of high-quota family
      if (base && version > base.latestVer && base.quota >= 4000) {
        quota = base.quota;
      }
    }
  }

  return { id, family, isFree, type, version, quota };
}

/**
 * Dynamically selects and orders the optimal model lineup from any available model IDs.
 * Rules:
 * 1. Tier 1: High-quota flagships (quota >= 4000, reverse-quota logic, 1 Pro + 1 Flash, sorted descending)
 * 2. Tier 2: Free models (Zero cost dual fallback)
 * 3. Tier 3: Cross-vendor benchmarks (quota < 4000, 1 per other vendor, reverse-quota logic, sorted descending)
 */
export function selectCuratedLineup(availableModelIds: string[]): string[] {
  const all = availableModelIds
    .map(parseModelMetadata)
    .filter((m) => m.family !== "anthropic");

  // Tier 2: Free models
  const freeModels = all.filter((m) => m.isFree);

  // Paid Models (Tier 1 & 3 candidates)
  const paidModels = all.filter((m) => !m.isFree);

  const familyGroups = new Map<string, ModelMetadata[]>();
  for (const m of paidModels) {
    const list = familyGroups.get(m.family) || [];
    list.push(m);
    familyGroups.set(m.family, list);
  }

  const highQuotaFlagships: ModelMetadata[] = [];
  const crossVendorBenchmarks: ModelMetadata[] = [];

  for (const [fam, models] of familyGroups.entries()) {
    const highQuotaModels = models.filter((m) => m.quota >= 4000);

    if (highQuotaModels.length > 0) {
      // High Quota family:
      // Check reverse-quota rule: if older version has higher quota than newer version, retain older!
      const versions = [...new Set(highQuotaModels.map((m) => m.version))].sort((a, b) => b - a);
      let selectedVersion = versions[0];

      for (let i = 1; i < versions.length; i++) {
        const olderVer = versions[i];
        const newerVer = versions[i - 1];
        const olderMaxQuota = Math.max(...highQuotaModels.filter((m) => m.version === olderVer).map((m) => m.quota));
        const newerMaxQuota = Math.max(...highQuotaModels.filter((m) => m.version === newerVer).map((m) => m.quota));
        if (olderMaxQuota > newerMaxQuota) {
          selectedVersion = olderVer;
          break;
        }
      }

      const candidateModels = highQuotaModels.filter((m) => m.version === selectedVersion);
      // Exclude redundant variants
      const filtered = candidateModels.filter((m) => {
        const lid = m.id.toLowerCase();
        if (lid.includes("flashx") || lid.includes("ultraspeed") || lid.includes("fast") || lid.includes("vision-exp")) return false;
        if (lid.includes("qwen3.8-flash") && !lid.includes("omni")) return false;
        return true;
      });

      // Keep at most 1 Pro and 1 Flash
      const pros = filtered.filter((m) => m.type === "Pro").sort((a, b) => b.quota - a.quota);
      const flashes = filtered.filter((m) => m.type === "Flash").sort((a, b) => b.quota - a.quota);
      if (pros.length > 0) highQuotaFlagships.push(pros[0]);
      if (flashes.length > 0) {
        if (fam === "qwen") {
          flashes.forEach((f) => highQuotaFlagships.push(f));
        } else {
          highQuotaFlagships.push(flashes[0]);
        }
      }
    } else {
      // Cross-vendor benchmark candidate: pick 1 model per family with quota > 0
      const validModels = models.filter((m) => m.quota > 0);
      if (validModels.length === 0) continue;

      // Apply reverse-quota rule among models in family
      const versions = [...new Set(validModels.map((m) => m.version))].sort((a, b) => b - a);
      let selectedVersion = versions[0];
      for (let i = 1; i < versions.length; i++) {
        const olderVer = versions[i];
        const newerVer = versions[i - 1];
        const olderMaxQuota = Math.max(...validModels.filter((m) => m.version === olderVer).map((m) => m.quota));
        const newerMaxQuota = Math.max(...validModels.filter((m) => m.version === newerVer).map((m) => m.quota));
        if (olderMaxQuota > newerMaxQuota) {
          selectedVersion = olderVer;
          break;
        }
      }
      const candidates = validModels.filter(
        (m) => m.version === selectedVersion && !m.id.toLowerCase().includes("highspeed")
      );
      candidates.sort((a, b) => b.quota - a.quota);
      if (candidates.length > 0) {
        crossVendorBenchmarks.push(candidates[0]);
      }
    }
  }

  // Tier 1 descending by quota
  highQuotaFlagships.sort((a, b) => b.quota - a.quota);
  // Tier 3 descending by quota
  crossVendorBenchmarks.sort((a, b) => b.quota - a.quota);

  return [...highQuotaFlagships, ...freeModels, ...crossVendorBenchmarks].map((m) => m.id);
}

export function isOutdatedVersion(modelId: string, availableModelIds?: string[]): boolean {
  const ids = availableModelIds || Object.keys(KNOWN_QUOTAS);
  const curated = selectCuratedLineup(ids);
  return !curated.includes(modelId);
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

  const curatedModelIds = selectCuratedLineup(allAvailableIds);

  const updatedModels: Record<string, CommandCodeModelDefinition> = {};
  const added: string[] = [];
  const updated: string[] = [];
  const pruned: string[] = [];

  // 1. Identify and record pruned models that were previously active
  for (const prevId of Object.keys(CURRENT_MODELS)) {
    if (!curatedModelIds.includes(prevId)) {
      pruned.push(prevId);
    }
  }

  // 2. Synchronize and populate models strictly in dynamically curated order
  for (const modelId of curatedModelIds) {
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
