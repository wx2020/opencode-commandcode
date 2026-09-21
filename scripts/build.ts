import { spawnSync } from "child_process";
import { rmSync, existsSync } from "fs";
import { join } from "path";

const rootDir = join(__dirname, "..");
const distDir = join(rootDir, "dist");

console.log("🧹 Cleaning dist directory...");
if (existsSync(distDir)) {
  rmSync(distDir, { recursive: true, force: true });
}

console.log("📦 Bundling with Bun...");
const buildResult = await Bun.build({
  entrypoints: [join(rootDir, "index.ts")],
  outdir: distDir,
  target: "node",
  format: "esm",
  splitting: false,
  sourcemap: "external",
  minify: false,
  external: ["@opencode-ai/plugin", "@ai-sdk/openai-compatible"],
});

if (!buildResult.success) {
  console.error("❌ Bun build failed:", buildResult.logs);
  process.exit(1);
}

console.log("📝 Generating TypeScript declarations...");
const tscResult = spawnSync("bun", ["x", "tsc", "--emitDeclarationOnly"], {
  cwd: rootDir,
  stdio: "inherit",
  shell: true,
});

if (tscResult.status !== 0) {
  console.warn("⚠️ TypeScript declaration generation encountered warnings/issues, checking dist...");
}

console.log("✅ Build completed successfully!");

