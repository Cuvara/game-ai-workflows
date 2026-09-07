#!/usr/bin/env node

/**
 * Game AI Workflows — Plugin Installer
 *
 * Registers the plugin in Claude Code settings.json and copies
 * slash commands + MCP server config into the target project.
 *
 * Usage:
 *   npx github:Cuvara/game-ai-workflows          # Install plugin
 *   node bin/install.js                            # Same, from local clone
 *   node bin/install.js --uninstall                # Remove plugin
 */

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const PLUGIN_NAME = 'game-ai-workflows';
const MARKETPLACE_ID = 'game-ai-workflows';
const REPO = 'Cuvara/game-ai-workflows';

// Paths
const home = os.homedir();
const claudeDir = path.join(home, '.claude');
const settingsPath = path.join(claudeDir, 'settings.json');
const packageRoot = path.resolve(__dirname, '..');

function readSettings() {
  if (!fs.existsSync(settingsPath)) return {};
  return JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
}

function writeSettings(settings) {
  fs.mkdirSync(claudeDir, { recursive: true });
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n');
}

function install() {
  console.log(`\nInstalling ${PLUGIN_NAME}...\n`);

  const settings = readSettings();

  // 1. Register in extraKnownMarketplaces
  if (!settings.extraKnownMarketplaces) settings.extraKnownMarketplaces = {};
  settings.extraKnownMarketplaces[MARKETPLACE_ID] = {
    source: {
      source: 'github',
      repo: REPO
    }
  };
  console.log('  ✓ Registered in marketplace');

  // 2. Enable plugin
  if (!settings.enabledPlugins) settings.enabledPlugins = {};
  settings.enabledPlugins[`${PLUGIN_NAME}@${MARKETPLACE_ID}`] = true;
  console.log('  ✓ Plugin enabled');

  // 3. Save settings
  writeSettings(settings);
  console.log('  ✓ Settings saved');

  // 4. Copy slash commands to project if cwd has .git
  const cwd = process.cwd();
  const cwdCommandsDir = path.join(cwd, '.claude', 'commands');
  const srcCommandsDir = path.join(packageRoot, '.claude', 'commands');

  if (fs.existsSync(path.join(cwd, '.git')) && fs.existsSync(srcCommandsDir)) {
    fs.mkdirSync(cwdCommandsDir, { recursive: true });
    const commands = fs.readdirSync(srcCommandsDir).filter(f => f.endsWith('.md'));
    let copied = 0;
    for (const cmd of commands) {
      const dst = path.join(cwdCommandsDir, cmd);
      if (!fs.existsSync(dst)) {
        fs.copyFileSync(path.join(srcCommandsDir, cmd), dst);
        copied++;
      }
    }
    console.log(`  ✓ ${copied} slash commands installed to .claude/commands/`);
  }

  // 5. Create .mcp.json for MCP server if not exists
  const mcpPath = path.join(cwd, '.mcp.json');
  if (fs.existsSync(path.join(cwd, '.git'))) {
    let mcpConfig = {};
    if (fs.existsSync(mcpPath)) {
      try { mcpConfig = JSON.parse(fs.readFileSync(mcpPath, 'utf-8')); } catch {}
    }
    if (!mcpConfig.mcpServers) mcpConfig.mcpServers = {};
    if (!mcpConfig.mcpServers[PLUGIN_NAME]) {
      mcpConfig.mcpServers[PLUGIN_NAME] = {
        command: 'node',
        args: [path.join(packageRoot, 'src', 'mcp-server.mjs')],
        env: {
          GAME_AI_WORKFLOWS_ROOT: cwd
        }
      };
      fs.writeFileSync(mcpPath, JSON.stringify(mcpConfig, null, 2) + '\n');
      console.log('  ✓ MCP server configured in .mcp.json');
    } else {
      console.log('  — MCP server already in .mcp.json');
    }
  }

  // 6. Run bootstrap
  console.log('\n  Running bootstrap...\n');
  try {
    const { execSync } = require('child_process');
    execSync(`node "${path.join(packageRoot, 'scripts', 'bootstrap', 'bootstrap.mjs')}"`, {
      cwd: cwd,
      stdio: 'inherit'
    });
  } catch {
    console.log('  ⚠ Bootstrap had issues (run /ai-workflow-setup to retry)');
  }

  console.log(`\n✓ ${PLUGIN_NAME} installed!\n`);
  console.log('Restart Claude Code to activate. Then try:');
  console.log('  /list-features');
  console.log('  /ai-workflow-setup');
  console.log('  /find-feature <query>\n');
}

function uninstall() {
  console.log(`\nUninstalling ${PLUGIN_NAME}...\n`);

  const settings = readSettings();

  if (settings.enabledPlugins) {
    delete settings.enabledPlugins[`${PLUGIN_NAME}@${MARKETPLACE_ID}`];
    console.log('  ✓ Plugin disabled');
  }

  if (settings.extraKnownMarketplaces) {
    delete settings.extraKnownMarketplaces[MARKETPLACE_ID];
    console.log('  ✓ Removed from marketplace');
  }

  writeSettings(settings);
  console.log('  ✓ Settings saved');
  console.log(`\n✓ ${PLUGIN_NAME} uninstalled.\n`);
}

// CLI
const args = process.argv.slice(2);
if (args.includes('--uninstall') || args.includes('uninstall')) {
  uninstall();
} else {
  install();
}
