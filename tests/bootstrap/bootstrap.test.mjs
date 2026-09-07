import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, rmSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

import { Bootstrap } from '../../scripts/bootstrap/bootstrap.mjs';

const TEST_ROOT = join(process.cwd(), 'tests', '.test-workspace-bs');

describe('Bootstrap', () => {
  beforeEach(() => {
    if (existsSync(TEST_ROOT)) rmSync(TEST_ROOT, { recursive: true, force: true });
    mkdirSync(TEST_ROOT, { recursive: true });
    execSync('git init', { cwd: TEST_ROOT, stdio: 'pipe' });
  });

  afterEach(() => {
    if (existsSync(TEST_ROOT)) {
      rmSync(TEST_ROOT, { recursive: true, force: true });
    }
  });

  it('should create .ai directory structure', async () => {
    const origLog = console.log;
    console.log = () => {};
    try {
      const bs = new Bootstrap(TEST_ROOT);
      await bs.run();
    } finally {
      console.log = origLog;
    }

    assert.ok(existsSync(join(TEST_ROOT, '.ai', 'config')));
    assert.ok(existsSync(join(TEST_ROOT, '.ai', 'gdd-state.json')));
    assert.ok(existsSync(join(TEST_ROOT, '.ai', 'setup-state.json')));
  });

  it('should create registry files', async () => {
    const origLog = console.log;
    console.log = () => {};
    try {
      const bs = new Bootstrap(TEST_ROOT);
      await bs.run();
    } finally {
      console.log = origLog;
    }

    assert.ok(existsSync(join(TEST_ROOT, 'docs', 'registry', 'features.yaml')));
    assert.ok(existsSync(join(TEST_ROOT, 'docs', 'registry', 'systems.yaml')));
    assert.ok(existsSync(join(TEST_ROOT, 'docs', 'registry', 'gdd.yaml')));
  });

  it('should be idempotent (second run safe)', async () => {
    const origLog = console.log;
    console.log = () => {};
    try {
      // First run
      const bs1 = new Bootstrap(TEST_ROOT);
      await bs1.run();

      // Second run
      const bs2 = new Bootstrap(TEST_ROOT);
      await bs2.run();
    } finally {
      console.log = origLog;
    }

    const state = JSON.parse(readFileSync(join(TEST_ROOT, '.ai', 'setup-state.json'), 'utf-8'));
    assert.equal(state.version, 1);
  });

  it('should detect missing git', async () => {
    const noGitRoot = join(TEST_ROOT, 'no-git');
    mkdirSync(noGitRoot, { recursive: true });

    const origLog = console.log;
    console.log = () => {};
    try {
      const bs = new Bootstrap(noGitRoot);
      await bs.run();
      assert.equal(bs.results.project.git, false);
    } finally {
      console.log = origLog;
    }
  });

  it('setup-state should track provider detection', async () => {
    const origLog = console.log;
    console.log = () => {};
    try {
      const bs = new Bootstrap(TEST_ROOT);
      await bs.run();
    } finally {
      console.log = origLog;
    }

    const state = JSON.parse(readFileSync(join(TEST_ROOT, '.ai', 'setup-state.json'), 'utf-8'));
    assert.ok('providers' in state);
    assert.ok('google-drive' in state.providers);
    assert.ok('local' in state.providers);
  });
});
