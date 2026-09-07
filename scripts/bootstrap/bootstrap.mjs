#!/usr/bin/env node

/**
 * Workflow Bootstrap
 * Detects environment, installs dependencies, configures providers.
 * Idempotent - safe to run multiple times.
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

class Bootstrap {
  constructor(projectRoot) {
    this.projectRoot = projectRoot || process.cwd();
    this.results = {};
    this.errors = [];
  }

  async run() {
    console.log('Checking workflow environment...\n');

    // Step 1: Detect project
    this.detectProject();

    // Step 2: Detect OS
    this.detectOS();

    // Step 3: Detect runtime dependencies
    this.detectRuntimes();

    // Step 4: Detect existing configuration
    this.detectExistingConfig();

    // Step 5: Detect GDD provider
    this.detectGDDProvider();

    // Step 6: Ensure directory structure
    this.ensureDirectories();

    // Step 7: Ensure registry files
    this.ensureRegistries();

    // Step 8: Initialize state
    this.initializeState();

    // Step 9: Validate
    this.validate();

    // Report
    this.report();

    return this.errors.length === 0;
  }

  detectProject() {
    const hasGit = existsSync(join(this.projectRoot, '.git'));
    const isUnity = existsSync(join(this.projectRoot, 'Assets')) && existsSync(join(this.projectRoot, 'ProjectSettings'));

    this.results.project = {
      root: this.projectRoot,
      git: hasGit,
      unity: isUnity,
    };

    console.log(`Project root       ${hasGit ? '✓' : '✗'} ${this.projectRoot}`);
    console.log(`Git                ${hasGit ? '✓' : '✗'}`);
    if (isUnity) console.log(`Unity project      ✓`);
  }

  detectOS() {
    this.results.os = {
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
    };
    console.log(`Platform           ✓ ${process.platform} ${process.arch}`);
    console.log(`Node.js            ✓ ${process.version}`);
  }

  detectRuntimes() {
    const runtimes = {};

    // Check for package managers
    for (const pm of ['npm', 'pnpm', 'yarn']) {
      try {
        const version = execSync(`${pm} --version`, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
        runtimes[pm] = version;
      } catch {
        runtimes[pm] = null;
      }
    }

    // Check for Python
    for (const py of ['python3', 'python']) {
      try {
        const version = execSync(`${py} --version`, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
        runtimes.python = version;
        break;
      } catch {
        // continue
      }
    }

    // Check for dotnet
    try {
      const version = execSync('dotnet --version', { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
      runtimes.dotnet = version;
    } catch {
      runtimes.dotnet = null;
    }

    this.results.runtimes = runtimes;

    const pm = runtimes.npm || runtimes.pnpm || runtimes.yarn;
    console.log(`Package manager    ${pm ? '✓' : '✗'} ${pm ? Object.entries(runtimes).filter(([k,v]) => ['npm','pnpm','yarn'].includes(k) && v).map(([k,v]) => `${k}@${v}`).join(', ') : 'none found'}`);
  }

  detectExistingConfig() {
    const configPath = join(this.projectRoot, '.ai', 'config', 'gdd.yaml');
    const statePath = join(this.projectRoot, '.ai', 'setup-state.json');

    this.results.config = {
      gddConfig: existsSync(configPath),
      setupState: existsSync(statePath),
    };

    console.log(`Workflow config     ${existsSync(configPath) ? '✓' : '—'}`);
    console.log(`Setup state        ${existsSync(statePath) ? '✓' : '—'}`);
  }

  detectGDDProvider() {
    // Check for Google Drive MCP
    const home = process.env.HOME || process.env.USERPROFILE;
    let googleDriveDetected = false;

    const mcpConfigPaths = [
      join(home, '.claude', 'settings.json'),
      join(home, '.claude', 'settings.local.json'),
      join(this.projectRoot, '.mcp.json'),
    ];

    for (const p of mcpConfigPaths) {
      if (existsSync(p)) {
        try {
          const content = readFileSync(p, 'utf-8');
          if (content.includes('google-drive') || content.includes('Google_Drive') || content.includes('gdrive')) {
            googleDriveDetected = true;
            break;
          }
        } catch { /* skip unreadable */ }
      }
    }

    // Check for local GDD files
    const localGDDExists = existsSync(join(this.projectRoot, 'docs', 'gdd'));

    this.results.providers = {
      googleDrive: googleDriveDetected,
      local: localGDDExists,
    };

    console.log(`Google Drive MCP   ${googleDriveDetected ? '✓' : '✗'}`);
    console.log(`Local GDD          ${localGDDExists ? '✓' : '—'}`);
  }

  ensureDirectories() {
    const dirs = [
      '.ai/config',
      '.ai/cache',
      'docs/gdd/snapshots',
      'docs/features',
      'docs/registry',
      'docs/design-changes',
    ];

    for (const dir of dirs) {
      const fullPath = join(this.projectRoot, dir);
      if (!existsSync(fullPath)) {
        mkdirSync(fullPath, { recursive: true });
      }
    }

    console.log(`Directories        ✓`);
  }

  ensureRegistries() {
    // GDD Registry
    const gddRegistryPath = join(this.projectRoot, 'docs', 'registry', 'gdd.yaml');
    if (!existsSync(gddRegistryPath)) {
      writeFileSync(gddRegistryPath, `# GDD Registry\n# Maps GDD documents and their sections to stable IDs\n\ndocuments: []\n`);
    }

    // Feature Registry
    const featureRegistryPath = join(this.projectRoot, 'docs', 'registry', 'features.yaml');
    if (!existsSync(featureRegistryPath)) {
      writeFileSync(featureRegistryPath, `# Feature Registry\n# Authoritative index of all project features\n\nfeatures: []\n`);
    }

    // System Registry
    const systemRegistryPath = join(this.projectRoot, 'docs', 'registry', 'systems.yaml');
    if (!existsSync(systemRegistryPath)) {
      writeFileSync(systemRegistryPath, `# System Registry\n# Maps technical systems to features and code\n\nsystems: []\n`);
    }

    console.log(`Registries         ✓`);
  }

  initializeState() {
    // GDD state
    const gddStatePath = join(this.projectRoot, '.ai', 'gdd-state.json');
    if (!existsSync(gddStatePath)) {
      writeFileSync(gddStatePath, JSON.stringify({ documents: {} }, null, 2));
    }

    // Setup state
    const setupStatePath = join(this.projectRoot, '.ai', 'setup-state.json');
    const setupState = existsSync(setupStatePath)
      ? JSON.parse(readFileSync(setupStatePath, 'utf-8'))
      : { version: 1, providers: {}, adapters: {}, lastBootstrap: null };

    setupState.lastBootstrap = new Date().toISOString();
    setupState.providers['local'] = { configured: this.results.providers?.local || false };
    setupState.providers['google-drive'] = { configured: this.results.providers?.googleDrive || false, authenticated: false, documentSelected: false };

    writeFileSync(setupStatePath, JSON.stringify(setupState, null, 2));

    console.log(`State              ✓`);
  }

  validate() {
    const checks = {
      'Project root': !!this.results.project?.root,
      'Git': this.results.project?.git,
      'Node.js': !!this.results.runtimes,
      'Registries': existsSync(join(this.projectRoot, 'docs', 'registry', 'features.yaml')),
      'State': existsSync(join(this.projectRoot, '.ai', 'gdd-state.json')),
    };

    this.results.validation = checks;

    for (const [name, ok] of Object.entries(checks)) {
      if (!ok) this.errors.push(`Validation failed: ${name}`);
    }
  }

  report() {
    console.log('\n--- Bootstrap Validation ---\n');
    for (const [name, ok] of Object.entries(this.results.validation || {})) {
      console.log(`${name.padEnd(20)} ${ok ? '✓' : '✗'}`);
    }

    if (this.errors.length > 0) {
      console.log('\nIssues:');
      for (const err of this.errors) {
        console.log(`  ✗ ${err}`);
      }
    } else {
      console.log('\nBootstrap complete. ✓');
    }
  }
}

// CLI entry point
if (process.argv[1] && process.argv[1].endsWith('bootstrap.mjs')) {
  const bootstrap = new Bootstrap(process.cwd());
  bootstrap.run().then(ok => {
    process.exit(ok ? 0 : 1);
  });
}

export { Bootstrap };
