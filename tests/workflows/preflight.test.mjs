import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync, mkdirSync, rmSync, existsSync } from 'fs';
import { join } from 'path';

import { Preflight } from '../../scripts/preflight/preflight.mjs';

const TEST_ROOT = join(process.cwd(), 'tests', '.test-workspace-pf');

describe('Preflight', () => {
  beforeEach(() => {
    if (existsSync(TEST_ROOT)) rmSync(TEST_ROOT, { recursive: true, force: true });
    mkdirSync(join(TEST_ROOT, 'docs', 'registry'), { recursive: true });
    mkdirSync(join(TEST_ROOT, 'docs', 'features', 'gameplay.inventory'), { recursive: true });
    mkdirSync(join(TEST_ROOT, 'docs', 'design-changes'), { recursive: true });
    mkdirSync(join(TEST_ROOT, '.ai'), { recursive: true });

    writeFileSync(join(TEST_ROOT, 'docs', 'registry', 'features.yaml'), `features:

  - id: gameplay.inventory
    name: Inventory System
    status: READY
    spec:
      path: docs/features/gameplay.inventory/spec.md
`);

    // Create spec file
    writeFileSync(join(TEST_ROOT, 'docs', 'features', 'gameplay.inventory', 'spec.md'), '# Inventory Spec');

    // Create fresh GDD state
    writeFileSync(join(TEST_ROOT, '.ai', 'gdd-state.json'), JSON.stringify({
      documents: {}
    }));
  });

  afterEach(() => {
    if (existsSync(TEST_ROOT)) rmSync(TEST_ROOT, { recursive: true, force: true });
  });

  it('should pass preflight for valid feature', () => {
    const pf = new Preflight(TEST_ROOT);
    const result = pf.check('gameplay.inventory');
    assert.ok(result.checks.featureExists);
    assert.ok(result.checks.specExists);
    assert.ok(result.checks.statusValid);
    assert.ok(result.checks.noDesignChanges);
  });

  it('should fail for unknown feature', () => {
    const pf = new Preflight(TEST_ROOT);
    const result = pf.check('unknown.feature');
    assert.equal(result.passed, false);
    assert.ok(result.blockers.some(b => b.includes('not found')));
  });

  it('should fail for wrong status', () => {
    writeFileSync(join(TEST_ROOT, 'docs', 'registry', 'features.yaml'), `features:

  - id: gameplay.inventory
    name: Inventory
    status: PLANNED
    spec:
      path: docs/features/gameplay.inventory/spec.md
`);
    const pf = new Preflight(TEST_ROOT);
    const result = pf.check('gameplay.inventory');
    assert.equal(result.checks.statusValid, false);
    assert.ok(result.blockers.some(b => b.includes('status')));
  });

  it('should fail when spec is missing', () => {
    rmSync(join(TEST_ROOT, 'docs', 'features', 'gameplay.inventory', 'spec.md'));
    const pf = new Preflight(TEST_ROOT);
    const result = pf.check('gameplay.inventory');
    assert.equal(result.checks.specExists, false);
  });

  it('should detect pending design changes', () => {
    writeFileSync(join(TEST_ROOT, 'docs', 'design-changes', 'DC-001.md'), `# Design Change

## Identity
- **ID:** DC-001
- **Status:** PENDING

## Affected Features
- gameplay.inventory
`);
    const pf = new Preflight(TEST_ROOT);
    const result = pf.check('gameplay.inventory');
    assert.equal(result.checks.noDesignChanges, false);
    assert.ok(result.blockers.some(b => b.includes('DC-001')));
  });
});
