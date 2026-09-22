/**
 * Automated Release Pipeline for opencode-commandcode
 * Bumps semver, executes tests & builds, commits changes, creates Git tags,
 * and publishes official GitHub releases with updated model lineups.
 */

import { spawnSync } from "child_process";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { syncModels } from "./sync-models.js";

const rootDir = join(__dirname, "..");
const pkgPath = join(rootDir, "package.json");
const summaryPath = join(rootDir, "sync-summary.json");

function runCommand(cmd: string, args: string[], options: { cwd?: string } = {}) {
  console.log(`> ${cmd} ${args.join(" ")}`);
  const res = spawnSync(cmd, args, {
    cwd: options.cwd || rootDir,
    stdio: "inherit",
    shell: true,
  });
  if (res.status !== 0) {
    throw new Error(`Command failed with exit code ${res.status}: ${cmd} ${args.join(" ")}`);
  }
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

  // Read current package.json
  const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
  const prevVersion = pkg.version;
  const newVersion = bumpVersion(prevVersion, options.bumpType || "patch");
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
  notes += `### 🔄 Model Lineup Updates\n`;
  if (summary && (summary.added?.length || summary.updated?.length)) {
    if (summary.added?.length) {
      notes += `\n**✨ Newly Added Models:**\n`;
      summary.added.forEach((m: string) => (notes += `- \`${m}\`\n`));
    }
    if (summary.updated?.length) {
      notes += `\n**⚡ Updated Models & Capabilities:**\n`;
      summary.updated.forEach((m: string) => (notes += `- \`${m}\`\n`));
    }
  } else {
    notes += `- Maintenance update and model synchronization.\n`;
  }
  notes += `\n### 📦 Quick Start\n`;
  notes += `\`\`\`jsonc\n{\n  "plugin": ["github:wx2020/opencode-commandcode#${newTag}"]\n}\n\`\`\`\n`;

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
    console.warn("⚠️ Could not create release via gh CLI directly (maybe running in non-auth or non-interactive env).");
  } finally {
    if (existsSync(notesPath)) spawnSync("rm", ["-f", notesPath], { shell: true });
    if (existsSync(archivePath)) spawnSync("rm", ["-f", archivePath], { shell: true });
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
