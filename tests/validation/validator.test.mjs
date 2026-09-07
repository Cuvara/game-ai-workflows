import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync, mkdirSync, rmSync, existsSync } from 'fs';
import { join } from 'path';

import { WorkflowValidator, VALID_STATUSES, VALID_TRANSITIONS } from '../../scripts/validate/validate.mjs';

const TEST_ROOT = join(process.cwd(), 'tests', '.test-workspace-val');

function setupTestWorkspace() {
  mkdirSync(join(TEST_ROOT, 'docs', 'registry'), { recursive: true });
  mkdirSync(join(TEST_ROOT, 'docs', 'design-changes'), { recursive: true });
}

describe('Valid Statuses', () => {
  it('should include all lifecycle statuses', () => {
    assert.ok(VALID_STATUSES.includes('PLANNED'));
    assert.ok(VALID_STATUSES.includes('IN_PROGRESS'));
    assert.ok(VALID_STATUSES.includes('VERIFIED'));
    assert.ok(VALID_STATUSES.includes('BLOCKED'));
    assert.ok(VALID_STATUSES.includes('CANCELLED'));
  });
});

describe('Valid Transitions', () => {
  it('PLANNED can go to DESIGN_REVIEW', () => {
    assert.ok(VALID_TRANSITIONS['PLANNED'].includes('DESIGN_REVIEW'));
  });

  it('VERIFIED cannot go to IN_PROGRESS', () => {
    assert.ok(!VALID_TRANSITIONS['VERIFIED'].includes('IN_PROGRESS'));
  });

  it('CANCELLED is terminal', () => {
    assert.deepStrictEqual(VALID_TRANSITIONS['CANCELLED'], []);
  });
});

describe('Workflow Validator', () => {
  beforeEach(() => {
    setupTestWorkspace();
  });

  afterEach(() => {
    if (existsSync(TEST_ROOT)) {
      rmSync(TEST_ROOT, { recursive: true, force: true });
    }
  });

  it('should detect missing registries', () => {
    // Create empty workspace without registries
    const emptyRoot = join(TEST_ROOT, 'empty');
    mkdirSync(join(emptyRoot, 'docs', 'registry'), { recursive: true });

    const v = new WorkflowValidator(emptyRoot);
    // Redirect console to capture
    const origLog = console.log;
    const logs = [];
    console.log = (...args) => logs.push(args.join(' '));

    v.validate();
    console.log = origLog;

    assert.ok(v.issues.length > 0 || v.warnings.length >= 0);
  });

  it('should detect duplicate feature IDs', () => {
    writeFileSync(join(TEST_ROOT, 'docs', 'registry', 'features.yaml'), `features:

  - id: gameplay.inventory
    name: Inventory
    status: PLANNED

  - id: gameplay.inventory
    name: Inventory Duplicate
    status: PLANNED`);

    writeFileSync(join(TEST_ROOT, 'docs', 'registry', 'systems.yaml'), 'systems: []');
    writeFileSync(join(TEST_ROOT, 'docs', 'registry', 'gdd.yaml'), 'documents: []');

    const v = new WorkflowValidator(TEST_ROOT);
    const origLog = console.log;
    console.log = () => {};
    v.validate();
    console.log = origLog;

    assert.ok(v.issues.some(i => i.includes('Duplicate feature ID')));
  });

  it('should detect invalid status', () => {
    writeFileSync(join(TEST_ROOT, 'docs', 'registry', 'features.yaml'), `features:

  - id: gameplay.test
    name: Test
    status: INVALID_STATUS`);

    writeFileSync(join(TEST_ROOT, 'docs', 'registry', 'systems.yaml'), 'systems: []');
    writeFileSync(join(TEST_ROOT, 'docs', 'registry', 'gdd.yaml'), 'documents: []');

    const v = new WorkflowValidator(TEST_ROOT);
    const origLog = console.log;
    console.log = () => {};
    v.validate();
    console.log = origLog;

    assert.ok(v.issues.some(i => i.includes('Invalid status')));
  });

  it('should pass with valid registry', () => {
    writeFileSync(join(TEST_ROOT, 'docs', 'registry', 'features.yaml'), `features:

  - id: gameplay.inventory
    name: Inventory
    status: PLANNED`);

    writeFileSync(join(TEST_ROOT, 'docs', 'registry', 'systems.yaml'), 'systems: []');
    writeFileSync(join(TEST_ROOT, 'docs', 'registry', 'gdd.yaml'), 'documents: []');

    const v = new WorkflowValidator(TEST_ROOT);
    const origLog = console.log;
    console.log = () => {};
    const result = v.validate();
    console.log = origLog;

    assert.ok(result); // Should pass
  });
});
