import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, rmSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';

import { DesignChangeManager } from '../../scripts/registry/design-change.mjs';

const TEST_ROOT = join(process.cwd(), 'tests', '.test-workspace-dc');

describe('Design Change Manager', () => {
  beforeEach(() => {
    if (existsSync(TEST_ROOT)) rmSync(TEST_ROOT, { recursive: true, force: true });
    mkdirSync(join(TEST_ROOT, 'docs', 'design-changes'), { recursive: true });
  });

  afterEach(() => {
    if (existsSync(TEST_ROOT)) rmSync(TEST_ROOT, { recursive: true, force: true });
  });

  it('should create a design change', () => {
    const mgr = new DesignChangeManager(TEST_ROOT);
    const id = mgr.create({
      document: 'game-gdd',
      section: 'gameplay.inventory',
      oldBehavior: 'Max 20 items',
      newBehavior: 'Max 50 items',
    });
    assert.equal(id, 'DC-001');
    assert.ok(existsSync(join(TEST_ROOT, 'docs', 'design-changes', 'DC-001.md')));
  });

  it('should list design changes', () => {
    const mgr = new DesignChangeManager(TEST_ROOT);
    mgr.create({ document: 'gdd', section: 'sec1', oldBehavior: 'a', newBehavior: 'b' });
    mgr.create({ document: 'gdd', section: 'sec2', oldBehavior: 'c', newBehavior: 'd' });

    const all = mgr.list();
    assert.equal(all.length, 2);
  });

  it('should filter by status', () => {
    const mgr = new DesignChangeManager(TEST_ROOT);
    mgr.create({ document: 'gdd', section: 'sec1' });

    const pending = mgr.list('PENDING');
    assert.equal(pending.length, 1);

    const approved = mgr.list('APPROVED');
    assert.equal(approved.length, 0);
  });

  it('should update status', () => {
    const mgr = new DesignChangeManager(TEST_ROOT);
    mgr.create({ document: 'gdd', section: 'sec1' });

    const origLog = console.log;
    console.log = () => {};
    mgr.updateStatus('DC-001', 'APPROVED');
    console.log = origLog;

    const change = mgr.get('DC-001');
    assert.equal(change.status, 'APPROVED');
  });

  it('should count pending changes', () => {
    const mgr = new DesignChangeManager(TEST_ROOT);
    mgr.create({ document: 'gdd', section: 'sec1' });
    mgr.create({ document: 'gdd', section: 'sec2' });

    assert.equal(mgr.pendingCount(), 2);

    const origLog = console.log;
    console.log = () => {};
    mgr.updateStatus('DC-001', 'APPROVED');
    console.log = origLog;

    assert.equal(mgr.pendingCount(), 1);
  });

  it('should auto-increment IDs', () => {
    const mgr = new DesignChangeManager(TEST_ROOT);
    const id1 = mgr.create({ section: 's1' });
    const id2 = mgr.create({ section: 's2' });
    const id3 = mgr.create({ section: 's3' });
    assert.equal(id1, 'DC-001');
    assert.equal(id2, 'DC-002');
    assert.equal(id3, 'DC-003');
  });
});
