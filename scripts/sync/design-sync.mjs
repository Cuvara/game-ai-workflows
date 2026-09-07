#!/usr/bin/env node

/**
 * Design Sync
 * Fetches GDD from provider, creates snapshots, detects changes,
 * creates design change records, maps impact to features.
 * Idempotent — running twice with no GDD changes produces no new artifacts.
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync } from 'fs';
import { join, basename } from 'path';
import { createHash } from 'crypto';
import { createProvider } from '../../providers/provider-factory.mjs';
import { parseSimpleYaml } from '../validate/validate.mjs';

class DesignSync {
  constructor(projectRoot = process.cwd()) {
    this.root = projectRoot;
    this.stateFile = join(this.root, '.ai', 'gdd-state.json');
    this.snapshotsDir = join(this.root, 'docs', 'gdd', 'snapshots');
    this.changesDir = join(this.root, 'docs', 'design-changes');
    this.gddRegistryPath = join(this.root, 'docs', 'registry', 'gdd.yaml');
    this.featureRegistryPath = join(this.root, 'docs', 'registry', 'features.yaml');
  }

  /**
   * Run full design sync
   * @param {object} options
   * @param {string} options.providerType - Provider type (google-drive, local, generic)
   * @param {object} options.providerConfig - Provider configuration
   * @param {string} options.documentId - Specific document ID to sync (optional, syncs all if omitted)
   * @returns {Promise<{synced: boolean, changes: Array, report: string}>}
   */
  async sync(options = {}) {
    const results = { synced: false, changes: [], snapshots: [], report: '' };

    // 1. Load state
    const state = this.loadState();

    // 2. Determine provider
    const providerType = options.providerType || this.detectProviderType();
    const providerConfig = options.providerConfig || this.loadProviderConfig();

    let provider;
    try {
      provider = createProvider(providerType, providerConfig);
    } catch (err) {
      results.report = `Provider error: ${err.message}`;
      return results;
    }

    // 3. Check provider status
    const status = await provider.checkStatus();
    if (!status.available) {
      results.report = `Provider unavailable: ${status.reason || 'unknown'}`;
      return results;
    }
    if (!status.authenticated) {
      results.report = `Authentication required: ${status.reason || 'Please authenticate with provider'}`;
      return results;
    }

    // 4. Get documents to sync
    const gddRegistry = this.loadGDDRegistry();
    const documents = gddRegistry.documents || [];

    if (documents.length === 0) {
      results.report = 'No GDD documents registered. Add documents to docs/registry/gdd.yaml first.';
      return results;
    }

    const docsToSync = options.documentId
      ? documents.filter(d => d.id === options.documentId)
      : documents;

    if (docsToSync.length === 0) {
      results.report = `Document "${options.documentId}" not found in GDD registry.`;
      return results;
    }

    // 5. Sync each document
    for (const doc of docsToSync) {
      const docState = state.documents[doc.id] || {};
      const docId = doc.drive_file_id || doc.id;

      try {
        // Check for changes
        const changeCheck = await provider.hasChanges(docId, docState.lastKnownRevision || '');

        if (!changeCheck.changed && docState.lastKnownRevision) {
          console.log(`${doc.name}: No changes since revision ${docState.lastKnownRevision}`);
          continue;
        }

        // Fetch content
        const content = await provider.getContent(docId);
        const contentHash = this.computeHash(content.content);

        // Check content hash to avoid duplicate processing
        if (contentHash === docState.contentHash) {
          console.log(`${doc.name}: Content unchanged (hash match)`);
          continue;
        }

        // Create snapshot
        const snapshotName = `${doc.id}-rev-${content.revision.substring(0, 8)}.md`;
        const snapshotPath = join(this.snapshotsDir, snapshotName);

        if (!existsSync(snapshotPath)) {
          mkdirSync(this.snapshotsDir, { recursive: true });
          writeFileSync(snapshotPath, content.content);
          results.snapshots.push(snapshotPath);
          console.log(`Snapshot: ${snapshotName}`);
        }

        // Diff against previous snapshot
        if (docState.contentHash) {
          const previousSnapshot = this.findPreviousSnapshot(doc.id, content.revision);
          if (previousSnapshot) {
            const oldContent = readFileSync(previousSnapshot, 'utf-8');
            const changes = this.detectChanges(doc, oldContent, content.content, docState.lastKnownRevision || 'unknown', content.revision);

            for (const change of changes) {
              const created = this.createDesignChange(change);
              if (created) {
                results.changes.push(change);
              }
            }
          }
        }

        // Update state
        state.documents[doc.id] = {
          driveFileId: docId,
          lastKnownModifiedTime: content.modifiedTime,
          lastKnownRevision: content.revision,
          contentHash: contentHash,
          lastSyncedAt: new Date().toISOString()
        };

        results.synced = true;
        console.log(`${doc.name}: Synced (revision: ${content.revision.substring(0, 8)})`);

      } catch (err) {
        console.error(`${doc.name}: Sync failed — ${err.message}`);
      }
    }

    // 6. Save state
    this.saveState(state);

    // 7. Impact analysis
    if (results.changes.length > 0) {
      const impact = this.analyzeImpact(results.changes);
      results.report = this.formatReport(results, impact);
    } else {
      results.report = results.synced
        ? 'Design sync complete. No design changes detected.'
        : 'No documents needed syncing.';
    }

    console.log('\n' + results.report);
    return results;
  }

  /**
   * Detect section-level changes between two GDD versions
   */
  detectChanges(doc, oldContent, newContent, oldRevision, newRevision) {
    const changes = [];
    const oldSections = this.parseSections(oldContent);
    const newSections = this.parseSections(newContent);

    // Find modified sections
    for (const [sectionId, newText] of Object.entries(newSections)) {
      const oldText = oldSections[sectionId];
      if (oldText === undefined) {
        // New section
        changes.push({
          document: doc.id,
          section: sectionId,
          previousRevision: oldRevision,
          currentRevision: newRevision,
          type: 'added',
          oldBehavior: '(section did not exist)',
          newBehavior: newText.substring(0, 200) + (newText.length > 200 ? '...' : ''),
        });
      } else if (oldText !== newText) {
        // Modified section
        changes.push({
          document: doc.id,
          section: sectionId,
          previousRevision: oldRevision,
          currentRevision: newRevision,
          type: 'modified',
          oldBehavior: oldText.substring(0, 200) + (oldText.length > 200 ? '...' : ''),
          newBehavior: newText.substring(0, 200) + (newText.length > 200 ? '...' : ''),
        });
      }
    }

    // Find removed sections
    for (const sectionId of Object.keys(oldSections)) {
      if (!(sectionId in newSections)) {
        changes.push({
          document: doc.id,
          section: sectionId,
          previousRevision: oldRevision,
          currentRevision: newRevision,
          type: 'removed',
          oldBehavior: oldSections[sectionId].substring(0, 200),
          newBehavior: '(section removed)',
        });
      }
    }

    return changes;
  }

  /**
   * Parse markdown content into sections (by ## headings)
   */
  parseSections(content) {
    const sections = {};
    const lines = content.split('\n');
    let currentSection = null;
    let currentContent = [];

    for (const line of lines) {
      const headingMatch = line.match(/^##\s+(.+)/);
      if (headingMatch) {
        if (currentSection) {
          sections[currentSection] = currentContent.join('\n').trim();
        }
        currentSection = this.sectionToId(headingMatch[1]);
        currentContent = [];
      } else if (currentSection) {
        currentContent.push(line);
      }
    }
    if (currentSection) {
      sections[currentSection] = currentContent.join('\n').trim();
    }
    return sections;
  }

  /**
   * Convert section heading to stable ID
   */
  sectionToId(heading) {
    return heading.toLowerCase()
      .replace(/[^a-z0-9\s.-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * Create a design change record file
   * Returns true if created, false if duplicate
   */
  createDesignChange(change) {
    mkdirSync(this.changesDir, { recursive: true });

    // Generate ID
    const existingFiles = existsSync(this.changesDir)
      ? readdirSync(this.changesDir).filter(f => f.startsWith('DC-'))
      : [];
    const nextNum = existingFiles.length + 1;
    const changeId = `DC-${String(nextNum).padStart(3, '0')}`;

    // Check for duplicate (same document, section, revision pair)
    for (const file of existingFiles) {
      const filePath = join(this.changesDir, file);
      const content = readFileSync(filePath, 'utf-8');
      if (content.includes(`**Section:** ${change.section}`) &&
          content.includes(`**Previous Revision:** ${change.previousRevision}`) &&
          content.includes(`**Current Revision:** ${change.currentRevision}`)) {
        return false; // Duplicate
      }
    }

    // Map affected features
    const affectedFeatures = this.findAffectedFeatures(change.document, change.section);

    const record = `# Design Change

## Identity
- **ID:** ${changeId}
- **Created:** ${new Date().toISOString()}
- **Status:** PENDING

## Source
- **Document:** ${change.document}
- **Section:** ${change.section}
- **Previous Revision:** ${change.previousRevision}
- **Current Revision:** ${change.currentRevision}
- **Type:** ${change.type}

## Change
### Old Behavior
${change.oldBehavior}

### New Behavior
${change.newBehavior}

## Impact
Design ${change.type} in section "${change.section}"

## Affected Features
${affectedFeatures.length > 0 ? affectedFeatures.map(f => `- ${f}`).join('\n') : '- (none mapped)'}

## Affected Systems
- (to be determined)

## Affected Code
- (to be determined)

## Affected Tests
- (to be determined)

## Resolution
(pending review)
`;

    writeFileSync(join(this.changesDir, `${changeId}.md`), record);
    console.log(`Design change: ${changeId} — ${change.type} in ${change.section}`);
    return true;
  }

  /**
   * Find features affected by a change to a GDD section
   */
  findAffectedFeatures(documentId, sectionId) {
    if (!existsSync(this.featureRegistryPath)) return [];
    const content = readFileSync(this.featureRegistryPath, 'utf-8');
    const data = parseSimpleYaml(content);
    const features = data.features || [];

    return features
      .filter(f => {
        const doc = f.document || (f.gdd && typeof f.gdd === 'string' ? f.gdd : f.gdd?.document);
        const sec = f.section || f.gdd?.section;
        return doc === documentId && (sec === sectionId || sectionId.includes(sec) || sec?.includes(sectionId));
      })
      .map(f => f.id);
  }

  /**
   * Analyze impact of design changes on features/systems
   */
  analyzeImpact(changes) {
    const features = new Set();
    const sections = new Set();

    for (const change of changes) {
      sections.add(change.section);
      const affected = this.findAffectedFeatures(change.document, change.section);
      affected.forEach(f => features.add(f));
    }

    // Check for new sections with no feature mapping
    const unmapped = changes.filter(c => {
      return this.findAffectedFeatures(c.document, c.section).length === 0;
    });

    return { features: [...features], sections: [...sections], unmapped };
  }

  /**
   * Format sync report
   */
  formatReport(results, impact) {
    let report = 'DESIGN SYNC REPORT\n\n';
    report += `Snapshots created: ${results.snapshots.length}\n`;
    report += `Design changes: ${results.changes.length}\n\n`;

    if (impact.features.length > 0) {
      report += `Affected features:\n`;
      impact.features.forEach(f => { report += `  - ${f}\n`; });
      report += '\n';
    }

    if (impact.unmapped.length > 0) {
      report += `New/unmapped sections (no feature assigned):\n`;
      impact.unmapped.forEach(u => { report += `  - ${u.section} (${u.type})\n`; });
      report += '\nConsider creating features for these sections.\n';
    }

    return report;
  }

  // --- Helpers ---

  loadState() {
    if (!existsSync(this.stateFile)) return { documents: {} };
    return JSON.parse(readFileSync(this.stateFile, 'utf-8'));
  }

  saveState(state) {
    mkdirSync(join(this.root, '.ai'), { recursive: true });
    writeFileSync(this.stateFile, JSON.stringify(state, null, 2));
  }

  loadGDDRegistry() {
    if (!existsSync(this.gddRegistryPath)) return { documents: [] };
    return parseSimpleYaml(readFileSync(this.gddRegistryPath, 'utf-8'));
  }

  loadProviderConfig() {
    const configPath = join(this.root, '.ai', 'config', 'gdd.yaml');
    if (!existsSync(configPath)) return {};
    // Simple key-value extraction from YAML
    const content = readFileSync(configPath, 'utf-8');
    const config = {};
    for (const line of content.split('\n')) {
      const match = line.match(/^\s*(\w+):\s*"?([^"#]+)"?\s*$/);
      if (match) config[match[1].trim()] = match[2].trim();
    }
    return config;
  }

  detectProviderType() {
    const config = this.loadProviderConfig();
    return config.provider || 'local';
  }

  computeHash(content) {
    return createHash('sha256').update(content).digest('hex').substring(0, 12);
  }

  findPreviousSnapshot(docId, currentRevision) {
    if (!existsSync(this.snapshotsDir)) return null;
    const files = readdirSync(this.snapshotsDir)
      .filter(f => f.startsWith(docId) && !f.includes(currentRevision.substring(0, 8)))
      .sort()
      .reverse();
    return files.length > 0 ? join(this.snapshotsDir, files[0]) : null;
  }
}

// CLI entry point
if (process.argv[1]?.endsWith('design-sync.mjs')) {
  const sync = new DesignSync();
  sync.sync().then(result => {
    process.exit(result.synced || result.changes.length === 0 ? 0 : 1);
  }).catch(err => {
    console.error(`Sync error: ${err.message}`);
    process.exit(1);
  });
}

export { DesignSync };
