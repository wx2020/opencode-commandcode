#!/usr/bin/env node
/**
 * One-click installer for opencode-commandcode
 * Automatically configures ~/.config/opencode/opencode.jsonc to include the plugin.
 */

const fs = require("fs");
const path = require("path");
const os = require("os");

const PLUGIN_IDENTIFIER = "github:wx2020/opencode-commandcode";

function getOpenCodeConfigDir() {
  const homeDir = os.homedir();
  return path.join(homeDir, ".config", "opencode");
}

function findOrCreateConfigFile() {
  const configDir = getOpenCodeConfigDir();
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }

  const jsoncPath = path.join(configDir, "opencode.jsonc");
  const jsonPath = path.join(configDir, "opencode.json");

  if (fs.existsSync(jsoncPath)) return jsoncPath;
  if (fs.existsSync(jsonPath)) return jsonPath;

  // Default to creating opencode.jsonc
  const initialContent = JSON.stringify(
    {
      $schema: "https://opencode.ai/config.json",
      plugin: [PLUGIN_IDENTIFIER],
    },
    null,
    2
  );
  fs.writeFileSync(jsoncPath, initialContent, "utf8");
  return jsoncPath;
}

function stripJsonComments(jsonString) {
  return jsonString.replace(
    /\\"|"(?:\\"|[^"])*"|(\/\/.*|\/\*[\s\S]*?\*\/)/g,
    (m, g) => (g ? "" : m)
  );
}

function install() {
  console.log("\n🚀 Installing opencode-commandcode plugin...");

  const configFilePath = findOrCreateConfigFile();
  console.log(`📁 Target config: ${configFilePath}`);

  let content = fs.readFileSync(configFilePath, "utf8");
  let configObj;

  try {
    const cleanJson = stripJsonComments(content);
    configObj = JSON.parse(cleanJson);
  } catch (err) {
    console.warn("⚠️ Could not strictly parse JSONC as JSON, attempting regex injection...");
    if (content.includes("opencode-commandcode")) {
      console.log("✅ opencode-commandcode is already registered in your configuration!");
      return;
    }
    // Fallback regex insertion
    if (content.includes('"plugin"')) {
      content = content.replace(/"plugin"\s*:\s*\[/, `"plugin": [\n    "${PLUGIN_IDENTIFIER}",`);
    } else {
      content = content.replace(/\{/, `{\n  "plugin": ["${PLUGIN_IDENTIFIER}"],`);
    }
    fs.writeFileSync(configFilePath, content, "utf8");
    console.log("✅ Successfully injected opencode-commandcode into configuration!");
    printPostInstallTips();
    return;
  }

  // Object manipulation
  configObj.plugin = configObj.plugin || [];
  const alreadyInstalled = configObj.plugin.some(
    (p) => typeof p === "string" && (p.includes("opencode-commandcode") || p === PLUGIN_IDENTIFIER)
  );

  if (alreadyInstalled) {
    console.log("✅ opencode-commandcode is already registered in your configuration!");
  } else {
    configObj.plugin.push(PLUGIN_IDENTIFIER);
    fs.writeFileSync(configFilePath, JSON.stringify(configObj, null, 2), "utf8");
    console.log("✅ Successfully added opencode-commandcode to your plugin list!");
  }

  printPostInstallTips();
}

function printPostInstallTips() {
  console.log("\n🔑 Next Steps:");
  console.log("  1. Set your API key via environment variable:");
  console.log('     export CMD_API_KEY="user_your_commandcode_api_key"');
  console.log("     (Or in PowerShell: $env:CMD_API_KEY=\"user_your_commandcode_api_key\")");
  console.log("  2. Or run interactive login:");
  console.log("     opencode auth login");
  console.log("  3. Start using top-tier models with 384k output capacity:");
  console.log("     opencode run 'Hello' --model=commandcode/deepseek/deepseek-v4.1-flash\n");
}

install();

