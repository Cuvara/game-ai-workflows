#!/usr/bin/env node

/**
 * Game AI Workflows - Installer
 *
 * Installs workflow into a target project:
 * 1. Copies .claude/commands/ for Claude Code slash commands
 * 2. Runs bootstrap to initialize project state
 * 3. Validates setup
 *
 * Usage:
 *   node scripts/install.mjs [target-project-path]
 *
 * If no path given, installs into current directory.
 */

import { existsSync, mkdirSync, copyFileSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const WORKFLOW_ROOT = resolve(__dirname, '..');

export class Installer {
  constructor(targetPath, sourceRoot) {
    this.target = resolve(targetPath || process.cwd());
    this.source = sourceRoot || WORKFLOW_ROOT;
  }

  install() {
    console.log(`Installing Game AI Workflows into: ${this.target}\n`);

    // 1. Copy .claude/commands/
    this.installCommands();

    // 2. Copy core scripts
    this.installScripts();

    // 3. Copy providers
    this.installProviders();

    // 4. Copy schemas and contracts
    this.installSchemas();
    this.installContracts();

    // 5. Copy skills
    this.installSkills();

    // 6. Copy adapters
    this.installAdapters();

    // 7. Copy agent roles
    this.installAgents();

    // 8. Initialize project structure
    this.initProject();

    // 9. Update .gitignore
    this.updateGitignore();

    console.log('\n--- Installation Complete ---\n');
    console.log('Next steps:');
    console.log('  1. Run: node scripts/bootstrap/bootstrap.mjs');
    console.log('  2. Populate docs/registry/features.yaml with your features');
    console.log('  3. Use /ai-workflow-setup in Claude Code to verify');
    console.log('  4. Use /list-features to see registered features');
  }

  installCommands() {
    const sourceDir = join(this.source, '.claude', 'commands');
    const targetDir = join(this.target, '.claude', 'commands');

    if (!existsSync(sourceDir)) {
      console.log('  ⚠ No .claude/commands/ found in source');
      return;
    }

    mkdirSync(targetDir, { recursive: true });
    const files = readdirSync(sourceDir).filter(f => f.endsWith('.md'));

    for (const file of files) {
      const targetFile = join(targetDir, file);
      if (!existsSync(targetFile)) {
        copyFileSync(join(sourceDir, file), targetFile);
        console.log(`  ✓ Command: /` + file.replace('.md', ''));
      } else {
        console.log(`  — Command: /${file.replace('.md', '')} (exists, skipped)`);
      }
    }
  }

  installScripts() {
    const dirs = ['bootstrap', 'validate', 'registry', 'sync', 'preflight', 'discovery'];
    for (const dir of dirs) {
      const sourceDir = join(this.source, 'scripts', dir);
      if (!existsSync(sourceDir)) continue;

      const targetDir = join(this.target, 'scripts', dir);
      mkdirSync(targetDir, { recursive: true });

      for (const file of readdirSync(sourceDir)) {
        const targetFile = join(targetDir, file);
        if (!existsSync(targetFile)) {
          copyFileSync(join(sourceDir, file), targetFile);
        }
      }
    }
    console.log('  ✓ Core scripts');
  }

  installProviders() {
    const dirs = ['google-drive', 'local', 'generic'];
    const targetBase = join(this.target, 'providers');
    mkdirSync(targetBase, { recursive: true });

    // Copy interface and factory
    for (const file of ['provider-interface.mjs', 'provider-factory.mjs']) {
      const src = join(this.source, 'providers', file);
      const dst = join(targetBase, file);
      if (existsSync(src) && !existsSync(dst)) copyFileSync(src, dst);
    }

    for (const dir of dirs) {
      const sourceDir = join(this.source, 'providers', dir);
      if (!existsSync(sourceDir)) continue;
      const targetDir = join(targetBase, dir);
      mkdirSync(targetDir, { recursive: true });
      for (const file of readdirSync(sourceDir)) {
        const dst = join(targetDir, file);
        if (!existsSync(dst)) copyFileSync(join(sourceDir, file), dst);
      }
    }
    console.log('  ✓ Providers');
  }

  installSchemas() {
    const sourceDir = join(this.source, 'schemas');
    const targetDir = join(this.target, 'schemas');
    if (!existsSync(sourceDir)) return;
    mkdirSync(targetDir, { recursive: true });
    for (const file of readdirSync(sourceDir)) {
      const dst = join(targetDir, file);
      if (!existsSync(dst)) copyFileSync(join(sourceDir, file), dst);
    }
    console.log('  ✓ Schemas');
  }

  installContracts() {
    const sourceDir = join(this.source, 'contracts');
    const targetDir = join(this.target, 'contracts');
    if (!existsSync(sourceDir)) return;
    mkdirSync(targetDir, { recursive: true });
    for (const file of readdirSync(sourceDir)) {
      const dst = join(targetDir, file);
      if (!existsSync(dst)) copyFileSync(join(sourceDir, file), dst);
    }
    console.log('  ✓ Contracts');
  }

  installSkills() {
    const sourceDir = join(this.source, 'skills');
    if (!existsSync(sourceDir)) return;
    for (const skillDir of readdirSync(sourceDir)) {
      const src = join(sourceDir, skillDir);
      const dst = join(this.target, 'skills', skillDir);
      mkdirSync(dst, { recursive: true });
      for (const file of readdirSync(src)) {
        const dstFile = join(dst, file);
        if (!existsSync(dstFile)) copyFileSync(join(src, file), dstFile);
      }
    }
    console.log('  ✓ Skills');
  }

  installAdapters() {
    const dirs = ['claude-code', 'codex', 'generic'];
    for (const dir of dirs) {
      const src = join(this.source, 'adapters', dir);
      if (!existsSync(src)) continue;
      const dst = join(this.target, 'adapters', dir);
      mkdirSync(dst, { recursive: true });
      for (const file of readdirSync(src)) {
        const dstFile = join(dst, file);
        if (!existsSync(dstFile)) copyFileSync(join(src, file), dstFile);
      }
    }
    console.log('  ✓ Adapters');
  }

  installAgents() {
    const sourceDir = join(this.source, 'agents');
    const targetDir = join(this.target, 'agents');
    if (!existsSync(sourceDir)) return;
    mkdirSync(targetDir, { recursive: true });
    for (const file of readdirSync(sourceDir)) {
      const dst = join(targetDir, file);
      if (!existsSync(dst)) copyFileSync(join(sourceDir, file), dst);
    }
    console.log('  ✓ Agent roles');
  }

  initProject() {
    const dirs = [
      '.ai/config', '.ai/cache',
      'docs/gdd/snapshots', 'docs/features',
      'docs/registry', 'docs/design-changes',
    ];
    for (const dir of dirs) {
      mkdirSync(join(this.target, dir), { recursive: true });
    }

    // Copy example registries if empty
    const regDir = join(this.target, 'docs', 'registry');
    for (const file of ['features.yaml', 'systems.yaml', 'gdd.yaml']) {
      const dst = join(regDir, file);
      if (!existsSync(dst)) {
        const exampleKey = file.replace('.yaml', '');
        const header = exampleKey.charAt(0).toUpperCase() + exampleKey.slice(1);
        writeFileSync(dst, `# ${header} Registry\n\n${exampleKey}: []\n`);
      }
    }

    // Copy GDD config template
    const configDst = join(this.target, '.ai', 'config', 'gdd.yaml');
    const configSrc = join(this.source, '.ai', 'config', 'gdd.yaml');
    if (!existsSync(configDst) && existsSync(configSrc)) {
      copyFileSync(configSrc, configDst);
    }

    console.log('  ✓ Project structure');
  }

  updateGitignore() {
    const gitignorePath = join(this.target, '.gitignore');
    const entries = [
      '# AI Workflow local state',
      '.ai/cache/',
      '.ai/gdd-state.json',
      '.ai/setup-state.json',
    ];

    if (existsSync(gitignorePath)) {
      const content = readFileSync(gitignorePath, 'utf-8');
      const missing = entries.filter(e => !e.startsWith('#') && !content.includes(e));
      if (missing.length > 0) {
        writeFileSync(gitignorePath, content + '\n' + entries.join('\n') + '\n');
        console.log('  ✓ .gitignore updated');
      } else {
        console.log('  — .gitignore (already configured)');
      }
    } else {
      writeFileSync(gitignorePath, entries.join('\n') + '\n');
      console.log('  ✓ .gitignore created');
    }
  }
}

// CLI
const targetPath = process.argv[2] || process.cwd();
const installer = new Installer(targetPath);
installer.install();
