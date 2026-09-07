#!/usr/bin/env node

/**
 * Game AI Workflows — Plugin Installer
 *
 * Installs as a proper Claude Code plugin:
 * 1. Copies to ~/.claude/plugins/marketplaces/game-ai-workflows/
 * 2. Registers in settings.json (extraKnownMarketplaces + enabledPlugins)
 * 3. Creates skills-lock.json
 * 4. Copies slash commands to project .claude/commands/
 *
 * Usage:
 *   npx github:Cuvara/game-ai-workflows          # Install plugin
 *   node bin/install.cjs                           # Same, from local clone
 *   node bin/install.cjs --uninstall               # Remove plugin
 */

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

const PLUGIN_NAME = 'game-ai-workflows';
const MARKETPLACE_ID = 'game-ai-workflows';
const REPO = 'Cuvara/game-ai-workflows';

const home = os.homedir();
const claudeDir = path.join(home, '.claude');
const pluginDir = path.join(claudeDir, 'plugins', 'marketplaces', PLUGIN_NAME);
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

function copyDirRecursive(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const dstPath = path.join(dst, entry.name);
    if (['.git', 'node_modules', 'tests', 'plugins', '.claude', '.ai'].includes(entry.name)) continue;
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, dstPath);
    } else {
      fs.copyFileSync(srcPath, dstPath);
    }
  }
}

function hashFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  return crypto.createHash('sha256').update(content).digest('hex');
}

function install() {
  console.log(`\nInstalling ${PLUGIN_NAME} plugin...\n`);

  // 1. Copy plugin to ~/.claude/plugins/marketplaces/
  console.log('  Installing plugin files...');
  if (fs.existsSync(pluginDir)) {
    fs.rmSync(pluginDir, { recursive: true, force: true });
  }
  copyDirRecursive(packageRoot, pluginDir);
  console.log(`  ✓ Plugin installed to ${pluginDir}`);

  // 2. Create skills-lock.json
  const skillsDir = path.join(pluginDir, 'skills');
  const skillsLock = { version: 1, skills: {} };

  if (fs.existsSync(skillsDir)) {
    for (const skillName of fs.readdirSync(skillsDir)) {
      const skillMd = path.join(skillsDir, skillName, 'SKILL.md');
      if (fs.existsSync(skillMd)) {
        skillsLock.skills[skillName] = {
          source: REPO,
          sourceType: 'github',
          skillPath: `skills/${skillName}/SKILL.md`,
          computedHash: hashFile(skillMd)
        };
      }
    }
  }
  fs.writeFileSync(
    path.join(pluginDir, 'skills-lock.json'),
    JSON.stringify(skillsLock, null, 2)
  );
  console.log(`  ✓ ${Object.keys(skillsLock.skills).length} skills registered`);

  // 3. Register in settings.json
  const settings = readSettings();

  if (!settings.extraKnownMarketplaces) settings.extraKnownMarketplaces = {};
  settings.extraKnownMarketplaces[MARKETPLACE_ID] = {
    source: {
      source: 'github',
      repo: REPO
    }
  };

  if (!settings.enabledPlugins) settings.enabledPlugins = {};
  settings.enabledPlugins[`${PLUGIN_NAME}@${MARKETPLACE_ID}`] = true;

  writeSettings(settings);
  console.log('  ✓ Plugin registered and enabled in settings.json');

  // 4. Copy slash commands to project if in a git repo
  const cwd = process.cwd();
  const srcCommandsDir = path.join(packageRoot, '.claude', 'commands');
  if (fs.existsSync(path.join(cwd, '.git')) && fs.existsSync(srcCommandsDir)) {
    const cwdCommandsDir = path.join(cwd, '.claude', 'commands');
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
    if (copied > 0) console.log(`  ✓ ${copied} slash commands → .claude/commands/`);
  }

  // 5. Remove .mcp.json entry if exists (no longer needed)
  const mcpPath = path.join(cwd, '.mcp.json');
  if (fs.existsSync(mcpPath)) {
    try {
      const mcpConfig = JSON.parse(fs.readFileSync(mcpPath, 'utf-8'));
      if (mcpConfig.mcpServers && mcpConfig.mcpServers[PLUGIN_NAME]) {
        delete mcpConfig.mcpServers[PLUGIN_NAME];
        if (Object.keys(mcpConfig.mcpServers).length === 0) {
          fs.unlinkSync(mcpPath);
          console.log('  ✓ Removed empty .mcp.json (MCP no longer needed)');
        } else {
          fs.writeFileSync(mcpPath, JSON.stringify(mcpConfig, null, 2) + '\n');
          console.log('  ✓ Removed MCP entry from .mcp.json');
        }
      }
    } catch {}
  }

  console.log(`\n✓ ${PLUGIN_NAME} installed!\n`);
  console.log('Restart Claude Code to activate. Then try:');
  console.log('  /list-features');
  console.log('  /ai-workflow-setup');
  console.log('  /find-feature <query>\n');
}

function uninstall() {
  console.log(`\nUninstalling ${PLUGIN_NAME}...\n`);

  // Remove plugin directory
  if (fs.existsSync(pluginDir)) {
    fs.rmSync(pluginDir, { recursive: true, force: true });
    console.log('  ✓ Plugin files removed');
  }

  // Remove from settings
  const settings = readSettings();
  if (settings.enabledPlugins) {
    delete settings.enabledPlugins[`${PLUGIN_NAME}@${MARKETPLACE_ID}`];
  }
  if (settings.extraKnownMarketplaces) {
    delete settings.extraKnownMarketplaces[MARKETPLACE_ID];
  }
  writeSettings(settings);
  console.log('  ✓ Plugin unregistered');

  console.log(`\n✓ ${PLUGIN_NAME} uninstalled.\n`);
}

// CLI
const args = process.argv.slice(2);
if (args.includes('--uninstall') || args.includes('uninstall')) {
  uninstall();
} else {
  install();
}
