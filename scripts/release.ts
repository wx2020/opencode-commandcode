/**
 * Automated Release Pipeline for opencode-commandcode
 * Bumps semver, executes tests & builds, commits changes, creates Git tags,
 * and publishes official GitHub releases with updated model lineups.
 */

import { spawnSync } from "child_process";
import { readFileSync, writeFileSync, existsSync, rmSync } from "fs";
import { join } from "path";
import { syncModels } from "./sync-models.js";

const rootDir = join(__dirname, "..");
const pkgPath = join(rootDir, "package.json");
const summaryPath = join(rootDir, "sync-summary.json");

function runCommand(cmd: string, args: string[], options: { cwd?: string } = {}) {
  const formattedArgs = args.map((a) => (a.includes(" ") && !a.startsWith('"') ? `"${a}"` : a));
  console.log(`> ${cmd} ${formattedArgs.join(" ")}`);
  const res = spawnSync(cmd, formattedArgs, {
    cwd: options.cwd || rootDir,
    stdio: "inherit",
    shell: true,
  });
  if (res.status !== 0) {
    throw new Error(`Command failed with exit code ${res.status}: ${cmd} ${formattedArgs.join(" ")}`);
  }
}

function getAvailableTags(): Set<string> {
  const res = spawnSync("git", ["tag", "-l"], { cwd: rootDir, encoding: "utf8" });
  if (res.status === 0 && res.stdout) {
    return new Set(res.stdout.split("\n").map((t) => t.trim()).filter(Boolean));
  }
  return new Set();
}

function bumpVersion(currentVersion: string, type: "patch" | "minor" | "major" = "patch"): string {
  const parts = currentVersion.split(".").map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) {
    throw new Error(`Invalid semver version: ${currentVersion}`);
  }
  if (type === "major") {
    parts[0] += 1;
    parts[1] = 0;
    parts[2] = 0;
  } else if (type === "minor") {
    parts[1] += 1;
    parts[2] = 0;
  } else {
    parts[2] += 1;
  }
  return parts.join(".");
}

export async function runRelease(options: {
  bumpType?: "patch" | "minor" | "major";
  sync?: boolean;
  force?: boolean;
} = {}) {
  console.log("🚀 Starting Automated Release Pipeline...\n");

  let hasModelChanges = false;
  let summary: any = null;

  if (options.sync) {
    console.log("🔄 Synchronizing models before release...");
    const syncRes = await syncModels({ forceWrite: options.force });
    hasModelChanges = syncRes.hasChanges;
    summary = syncRes.summary;
  } else if (existsSync(summaryPath)) {
    try {
      summary = JSON.parse(readFileSync(summaryPath, "utf8"));
      hasModelChanges = summary.hasChanges;
    } catch {}
  }

  if (!hasModelChanges && !options.force) {
    console.log("✨ No model changes detected and --force is not specified. Skipping release.");
    return;
  }

  // Read current package.json and ensure tag uniqueness
  const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
  const prevVersion = pkg.version;
  const existingTags = getAvailableTags();
  let candidateVersion = bumpVersion(prevVersion, options.bumpType || "patch");
  while (existingTags.has(`v${candidateVersion}`)) {
    candidateVersion = bumpVersion(candidateVersion, "patch");
  }
  const newVersion = candidateVersion;
  const newTag = `v${newVersion}`;

  console.log(`📦 Bumping version: ${prevVersion} -> ${newVersion} (${newTag})`);
  pkg.version = newVersion;
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf8");

  // Run tests
  console.log("\n🧪 Running unit test suite...");
  runCommand("bun", ["test"]);

  // Run build
  console.log("\n🔨 Building distribution bundle & types...");
  runCommand("bun", ["run", "build"]);

  // Generate Release Notes
  let notes = `## OpenCode CommandCode Plugin ${newTag}\n\n`;
  notes += `### 🔄 Model Lineup & Capabilities Updates\n`;
  if (summary && (summary.added?.length || summary.updated?.length || summary.pruned?.length)) {
    if (summary.added?.length) {
      notes += `\n**✨ Newly Added Models:**\n`;
      summary.added.forEach((m: string) => (notes += `- \`${m}\`\n`));
    }
    if (summary.updated?.length) {
      notes += `\n**⚡ Updated Models & Capabilities:**\n`;
      summary.updated.forEach((m: string) => (notes += `- \`${m}\`\n`));
    }
    if (summary.pruned?.length) {
      notes += `\n**🗑️ Obsolete Previous-Generation Versions Pruned:**\n`;
      summary.pruned.forEach((m: string) => (notes += `- \`${m}\`\n`));
    }
  } else {
    notes += `- 🎨 **Unified Clean Display Names**: Stripped all promotional suffixes such as \`(GOAT 7x)\` and \`(2x Deal)\`, restoring standard clean official model names.\n`;
    notes += `- 🎁 **Standardized Free Tier Badging**: Strictly labeled zero-cost models as \`(Free)\` (\`Laguna S 2.1 (Free)\` & \`Ling 3.0 Flash Sante (Free)\`).\n`;
    notes += `- 🎯 **Dynamic Lineup**: Maintained 18 curated high-capacity flagship, free, and cross-provider models with generation quota inversion handling.\n`;
  }
  notes += `\n### 📦 Installation\n`;
  notes += `**方案 A（推荐，跨平台）**：克隆仓库后把**绝对路径**写进全局配置 \`plugins\`：\n`;
  notes += `\`\`\`bash\ngit clone https://github.com/wx2020/opencode-commandcode.git ~/opencode-commandcode\n\`\`\`\n`;
  notes += `\`\`\`jsonc\n{\n  "$schema": "https://opencode.ai/config.json",\n  "plugins": ["/home/you/opencode-commandcode"]\n}\n\`\`\`\n`;
  notes += `**方案 B**：把 \`dist/ lib/ index.ts package.json\` 拷到 \`~/.config/opencode/node_modules/opencode-commandcode/\`，并在 \`~/.config/opencode/plugins/commandcode.ts\` 写 \`import plugin from "opencode-commandcode"; export default plugin;\`。\n`;
  notes += `\n> ⚠️ \`github:\` 规格目前在 **Windows** 上装不上（OpenCode 侧 bug：pacote 准备 git 依赖时无法 spawn \`npm\`/\`npm.cmd\`），\`opencode plugin add github:...\` 会报 \`git dep preparation failed\`。请使用方案 A/B。\n`;
  notes += `\n随后 \`opencode auth login\`（选择 CommandCode）或设置 \`CMD_API_KEY\`，最后重启 OpenCode / OpenChamber；用 \`opencode models | grep commandcode\` 校验。\n`;

  const notesPath = join(rootDir, "RELEASE_NOTES.tmp.md");
  writeFileSync(notesPath, notes, "utf8");

  // Package asset archive
  const archiveName = `opencode-commandcode-${newTag}.tar.gz`;
  const archivePath = join(rootDir, archiveName);
  console.log(`\n📦 Creating asset archive: ${archiveName}...`);
  runCommand("tar", ["-czvf", archiveName, "dist", "package.json", "README.md", "LICENSE", "scripts"]);

  // Git operations
  console.log("\n📝 Committing changes and tagging...");
  runCommand("git", ["add", "."]);
  runCommand("git", ["commit", "-m", `chore(release): bump version to ${newTag}`]);
  runCommand("git", ["tag", "-a", newTag, "-m", `Release ${newTag}`]);

  console.log("\n⬆️ Pushing changes & tags to GitHub...");
  runCommand("git", ["push", "origin", "main"]);
  runCommand("git", ["push", "origin", newTag]);

  // Create GitHub Release
  console.log("\n🎉 Creating GitHub Release...");
  try {
    runCommand("gh", [
      "release",
      "create",
      newTag,
      archiveName,
      "--title",
      `${newTag}: Automated Model Sync Release`,
      "--notes-file",
      notesPath,
    ]);
    console.log(`✅ Successfully published GitHub Release: https://github.com/wx2020/opencode-commandcode/releases/tag/${newTag}`);
  } catch (err) {
    console.warn("⚠️ Skipped gh CLI release (git tag push is the primary release mechanism).");
  } finally {
    if (existsSync(notesPath)) rmSync(notesPath, { force: true });
    if (existsSync(archivePath)) rmSync(archivePath, { force: true });
  }

  console.log(`\n🎊 Pipeline finished successfully! Version ${newTag} is live.`);
}

if (import.meta.main) {
  const args = process.argv.slice(2);
  const force = args.includes("--force");
  const sync = args.includes("--sync") || !args.includes("--no-sync");
  const isMinor = args.includes("--minor");
  const isMajor = args.includes("--major");

  const bumpType = isMajor ? "major" : isMinor ? "minor" : "patch";

  runRelease({ force, sync, bumpType }).catch((err) => {
    console.error("❌ Release pipeline failed:", err);
    process.exit(1);
  });
}

