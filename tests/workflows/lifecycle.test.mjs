import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { VALID_STATUSES, VALID_TRANSITIONS } from '../../scripts/validate/validate.mjs';

describe('Feature Lifecycle', () => {
  it('all statuses should have transition rules', () => {
    for (const status of VALID_STATUSES) {
      assert.ok(status in VALID_TRANSITIONS, `Missing transitions for ${status}`);
    }
  });

  it('happy path should be valid', () => {
    const happyPath = ['PLANNED', 'DESIGN_REVIEW', 'READY', 'IN_PROGRESS', 'IMPLEMENTED', 'TESTING', 'PLAYTEST', 'VERIFIED'];

    for (let i = 0; i < happyPath.length - 1; i++) {
      const from = happyPath[i];
      const to = happyPath[i + 1];
      assert.ok(
        VALID_TRANSITIONS[from].includes(to),
        `Invalid transition: ${from} → ${to}`
      );
    }
  });

  it('CANCELLED should be reachable from most states', () => {
    const cancellable = ['PLANNED', 'DESIGN_REVIEW', 'READY', 'IN_PROGRESS', 'BLOCKED', 'NEEDS_REVIEW', 'DESIGN_CHANGED'];
    for (const status of cancellable) {
      assert.ok(
        VALID_TRANSITIONS[status].includes('CANCELLED'),
        `${status} should be cancellable`
      );
    }
  });

  it('VERIFIED and CANCELLED should be terminal or near-terminal', () => {
    assert.ok(VALID_TRANSITIONS['CANCELLED'].length === 0);
    assert.ok(VALID_TRANSITIONS['VERIFIED'].length <= 1); // Can only deprecate
  });

  it('BLOCKED should be recoverable', () => {
    assert.ok(VALID_TRANSITIONS['BLOCKED'].length > 0);
    assert.ok(VALID_TRANSITIONS['BLOCKED'].includes('IN_PROGRESS'));
  });

  it('DESIGN_CHANGED should route to DESIGN_REVIEW', () => {
    assert.ok(VALID_TRANSITIONS['DESIGN_CHANGED'].includes('DESIGN_REVIEW'));
  });
});
