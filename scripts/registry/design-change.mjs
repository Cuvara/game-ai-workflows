#!/usr/bin/env node

/**
 * Design Change Manager
 * Create, list, and resolve design change records.
 */

import { existsSync, readFileSync, writeFileSync, readdirSync, mkdirSync } from 'fs';
import { join } from 'path';

class DesignChangeManager {
  constructor(projectRoot = process.cwd()) {
    this.root = projectRoot;
    this.changesDir = join(this.root, 'docs', 'design-changes');
  }

  /**
   * List all design changes, optionally filtered by status
   * @param {string} statusFilter - Optional status filter (PENDING, APPROVED, REJECTED, DEFERRED, IMPLEMENTED)
   * @returns {Array<{id: string, status: string, section: string, type: string, document: string}>}
   */
  list(statusFilter) {
    if (!existsSync(this.changesDir)) return [];

    const files = readdirSync(this.changesDir).filter(f => f.startsWith('DC-') && f.endsWith('.md'));
    const changes = files.map(f => this.parseChangeFile(join(this.changesDir, f))).filter(Boolean);

    if (statusFilter) {
      return changes.filter(c => c.status === statusFilter.toUpperCase());
    }
    return changes;
  }

  /**
   * Get a specific design change by ID
   * @param {string} changeId
   * @returns {object|null}
   */
  get(changeId) {
    const filePath = join(this.changesDir, `${changeId}.md`);
    if (!existsSync(filePath)) return null;
    return this.parseChangeFile(filePath);
  }

  /**
   * Update the status of a design change
   * @param {string} changeId
   * @param {string} newStatus - PENDING, APPROVED, REJECTED, DEFERRED, IMPLEMENTED
   * @returns {boolean}
   */
  updateStatus(changeId, newStatus) {
    const validStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'DEFERRED', 'IMPLEMENTED'];
    if (!validStatuses.includes(newStatus.toUpperCase())) {
      console.error(`Invalid status: ${newStatus}. Valid: ${validStatuses.join(', ')}`);
      return false;
    }

    const filePath = join(this.changesDir, `${changeId}.md`);
    if (!existsSync(filePath)) {
      console.error(`Design change not found: ${changeId}`);
      return false;
    }

    let content = readFileSync(filePath, 'utf-8');
    content = content.replace(
      /\*\*Status:\*\*\s*\w+/,
      `**Status:** ${newStatus.toUpperCase()}`
    );
    writeFileSync(filePath, content);
    console.log(`${changeId}: status → ${newStatus.toUpperCase()}`);
    return true;
  }

  /**
   * Create a manual design change record
   * @param {object} change
   * @returns {string} The created change ID
   */
  create(change) {
    mkdirSync(this.changesDir, { recursive: true });

    const existingFiles = readdirSync(this.changesDir).filter(f => f.startsWith('DC-'));
    const nextNum = existingFiles.length + 1;
    const changeId = `DC-${String(nextNum).padStart(3, '0')}`;

    const record = `# Design Change

## Identity
- **ID:** ${changeId}
- **Created:** ${new Date().toISOString()}
- **Status:** PENDING

## Source
- **Document:** ${change.document || 'manual'}
- **Section:** ${change.section || 'unspecified'}
- **Previous Revision:** ${change.previousRevision || 'N/A'}
- **Current Revision:** ${change.currentRevision || 'N/A'}
- **Type:** ${change.type || 'manual'}

## Change
### Old Behavior
${change.oldBehavior || '(not specified)'}

### New Behavior
${change.newBehavior || '(not specified)'}

## Impact
${change.impact || '(to be determined)'}

## Affected Features
${(change.affectedFeatures || []).map(f => `- ${f}`).join('\n') || '- (to be determined)'}

## Affected Systems
${(change.affectedSystems || []).map(s => `- ${s}`).join('\n') || '- (to be determined)'}

## Affected Code
- (to be determined)

## Affected Tests
- (to be determined)

## Resolution
(pending review)
`;

    writeFileSync(join(this.changesDir, `${changeId}.md`), record);
    return changeId;
  }

  /**
   * Get pending changes count
   */
  pendingCount() {
    return this.list('PENDING').length;
  }

  /**
   * Parse a design change markdown file into structured data
   */
  parseChangeFile(filePath) {
    try {
      const content = readFileSync(filePath, 'utf-8');
      const extract = (pattern) => {
        const match = content.match(pattern);
        return match ? match[1].trim() : null;
      };

      return {
        id: extract(/\*\*ID:\*\*\s*(\S+)/),
        status: extract(/\*\*Status:\*\*\s*(\S+)/),
        created: extract(/\*\*Created:\*\*\s*(.+)/),
        document: extract(/\*\*Document:\*\*\s*(\S+)/),
        section: extract(/\*\*Section:\*\*\s*(.+)/),
        type: extract(/\*\*Type:\*\*\s*(\S+)/),
        previousRevision: extract(/\*\*Previous Revision:\*\*\s*(\S+)/),
        currentRevision: extract(/\*\*Current Revision:\*\*\s*(\S+)/),
        filePath,
      };
    } catch {
      return null;
    }
  }
}

// CLI entry point
if (process.argv[1]?.endsWith('design-change.mjs')) {
  const mgr = new DesignChangeManager();
  const command = process.argv[2];

  switch (command) {
    case 'list': {
      const status = process.argv[3];
      const changes = mgr.list(status);
      if (changes.length === 0) {
        console.log(status ? `No ${status} design changes.` : 'No design changes.');
      } else {
        console.log('Design Changes:\n');
        for (const c of changes) {
          console.log(`  ${c.id}  ${(c.status || '').padEnd(12)} ${c.type || ''} in ${c.section || '?'} (${c.document || '?'})`);
        }
      }
      break;
    }
    case 'approve':
    case 'reject':
    case 'defer': {
      const id = process.argv[3];
      if (!id) { console.error(`Usage: design-change.mjs ${command} <DC-NNN>`); process.exit(1); }
      const statusMap = { approve: 'APPROVED', reject: 'REJECTED', defer: 'DEFERRED' };
      mgr.updateStatus(id, statusMap[command]);
      break;
    }
    case 'pending': {
      const count = mgr.pendingCount();
      console.log(`Pending design changes: ${count}`);
      break;
    }
    default:
      console.log(`design-change.mjs <command>

Commands:
  list [status]     List design changes (optional: PENDING, APPROVED, REJECTED, DEFERRED, IMPLEMENTED)
  approve <id>      Approve a design change
  reject <id>       Reject a design change
  defer <id>        Defer a design change
  pending           Show count of pending changes
`);
  }
}

export { DesignChangeManager };
