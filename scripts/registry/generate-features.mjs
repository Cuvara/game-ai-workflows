#!/usr/bin/env node

/**
 * Generate Features Registry from GDD
 *
 * Reads GDD documents (from provider or local snapshots),
 * extracts sections, maps them to features, and generates
 * docs/registry/features.yaml.
 *
 * Preserves existing features — only adds new ones from GDD.
 * Never removes or overwrites existing feature entries.
 */

import { existsSync, readFileSync, writeFileSync, readdirSync, mkdirSync } from 'fs';
import { join } from 'path';
import { parseSimpleYaml } from '../validate/validate.mjs';

class FeatureGenerator {
  constructor(projectRoot = process.cwd()) {
    this.root = projectRoot;
    this.featuresPath = join(this.root, 'docs', 'registry', 'features.yaml');
    this.gddRegistryPath = join(this.root, 'docs', 'registry', 'gdd.yaml');
    this.snapshotsDir = join(this.root, 'docs', 'gdd', 'snapshots');
    this.gddDir = join(this.root, 'docs', 'gdd');
  }

  /**
   * Generate features.yaml from all available GDD sources
   * @returns {{created: string[], skipped: string[], total: number}}
   */
  generate() {
    console.log('Generating features from GDD...\n');

    // 1. Load existing features (preserve them)
    const existing = this.loadExistingFeatures();
    const existingIds = new Set(existing.map(f => f.id));
    console.log(`Existing features: ${existing.length}`);

    // 2. Collect GDD sections from all sources
    const gddSections = this.collectGDDSections();
    console.log(`GDD sections found: ${gddSections.length}\n`);

    if (gddSections.length === 0) {
      console.log('No GDD sections found. Check:');
      console.log('  - docs/registry/gdd.yaml (GDD registry with sections)');
      console.log('  - docs/gdd/snapshots/*.md (GDD snapshot files)');
      console.log('  - docs/gdd/*.md (local GDD files)');
      return { created: [], skipped: [], total: existing.length };
    }

    // 3. Generate feature entries for unmapped sections
    const created = [];
    const skipped = [];

    for (const section of gddSections) {
      const featureId = this.sectionToFeatureId(section);

      if (existingIds.has(featureId)) {
        skipped.push(featureId);
        continue;
      }

      const feature = {
        id: featureId,
        name: section.name,
        category: this.inferCategory(section.id, section.name),
        status: 'PLANNED',
      };

      // Add GDD mapping if document info available
      if (section.documentId) {
        feature.gdd_document = section.documentId;
        feature.gdd_section = section.id;
      }

      existing.push(feature);
      existingIds.add(featureId);
      created.push(featureId);
      console.log(`  + ${featureId} (${section.name})`);
    }

    if (skipped.length > 0) {
      console.log(`\nSkipped (already exist): ${skipped.length}`);
    }

    // 4. Write features.yaml
    this.writeFeatures(existing);
    console.log(`\nFeatures registry: ${existing.length} total (${created.length} new)`);

    // 5. Create feature directories for new features
    for (const id of created) {
      const featureDir = join(this.root, 'docs', 'features', id);
      if (!existsSync(featureDir)) {
        mkdirSync(featureDir, { recursive: true });
      }
    }

    return { created, skipped, total: existing.length };
  }

  /**
   * Collect sections from all GDD sources
   */
  collectGDDSections() {
    const sections = [];
    const seenIds = new Set();

    // Source 1: GDD registry (docs/registry/gdd.yaml)
    if (existsSync(this.gddRegistryPath)) {
      const gddData = parseSimpleYaml(readFileSync(this.gddRegistryPath, 'utf-8'));
      for (const doc of (gddData.documents || [])) {
        for (const section of (doc.sections || [])) {
          if (!seenIds.has(section.id)) {
            sections.push({
              id: section.id,
              name: section.name || section.id,
              documentId: doc.id,
            });
            seenIds.add(section.id);
          }
        }
      }
    }

    // Source 2: GDD snapshot files (docs/gdd/snapshots/*.md)
    if (existsSync(this.snapshotsDir)) {
      const snapshotFiles = readdirSync(this.snapshotsDir).filter(f => f.endsWith('.md'));
      // Use most recent snapshot per document
      const latestSnapshots = {};
      for (const file of snapshotFiles.sort().reverse()) {
        const docId = file.replace(/-rev-.*$/, '').replace(/\.md$/, '');
        if (!latestSnapshots[docId]) {
          latestSnapshots[docId] = file;
        }
      }

      for (const [docId, file] of Object.entries(latestSnapshots)) {
        const content = readFileSync(join(this.snapshotsDir, file), 'utf-8');
        const extracted = this.extractSectionsFromMarkdown(content, docId);
        for (const section of extracted) {
          if (!seenIds.has(section.id)) {
            sections.push(section);
            seenIds.add(section.id);
          }
        }
      }
    }

    // Source 3: Local GDD files (docs/gdd/*.md, not in snapshots/)
    if (existsSync(this.gddDir)) {
      const gddFiles = readdirSync(this.gddDir).filter(f => f.endsWith('.md'));
      for (const file of gddFiles) {
        const content = readFileSync(join(this.gddDir, file), 'utf-8');
        const docId = file.replace(/\.md$/, '');
        const extracted = this.extractSectionsFromMarkdown(content, docId);
        for (const section of extracted) {
          if (!seenIds.has(section.id)) {
            sections.push(section);
            seenIds.add(section.id);
          }
        }
      }
    }

    return sections;
  }

  /**
   * Extract ## headings from markdown as sections
   */
  extractSectionsFromMarkdown(content, documentId) {
    const sections = [];
    for (const line of content.split('\n')) {
      const match = line.match(/^##\s+(.+)/);
      if (match) {
        const name = match[1].trim();
        const id = this.headingToSectionId(name);
        // Skip generic headings
        if (['overview', 'introduction', 'table-of-contents', 'toc', 'references', 'appendix', 'changelog'].includes(id)) {
          continue;
        }
        sections.push({ id, name, documentId });
      }
    }
    return sections;
  }

  /**
   * Convert heading text to section ID
   */
  headingToSectionId(heading) {
    return heading.toLowerCase()
      .replace(/[^a-z0-9\s.-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * Convert GDD section to feature ID (category.name format)
   */
  sectionToFeatureId(section) {
    const sectionId = section.id;

    // If already has category prefix (e.g. "gameplay.inventory")
    if (sectionId.match(/^[a-z]+\.[a-z]/)) {
      return sectionId;
    }

    // Infer category + create ID
    const category = this.inferCategory(sectionId, section.name);
    const name = sectionId.replace(/^(gameplay|system|ui|infrastructure|meta)[.-]?/, '');
    return `${category}.${name || sectionId}`;
  }

  /**
   * Infer feature category from section ID and name
   */
  inferCategory(sectionId, name) {
    const lower = `${sectionId} ${name}`.toLowerCase();

    if (lower.match(/\b(ui|hud|menu|screen|button|panel|dialog|interface|display)\b/)) return 'ui';
    if (lower.match(/\b(system|manager|controller|service|handler|engine)\b/)) return 'system';
    if (lower.match(/\b(infra|network|server|auth|database|storage|deploy|ci|cd)\b/)) return 'infrastructure';
    if (lower.match(/\b(meta|config|setting|option|preference)\b/)) return 'meta';

    return 'gameplay'; // default
  }

  /**
   * Load existing features from registry
   */
  loadExistingFeatures() {
    if (!existsSync(this.featuresPath)) return [];
    const content = readFileSync(this.featuresPath, 'utf-8');
    const data = parseSimpleYaml(content);
    return data.features || [];
  }

  /**
   * Write features to YAML registry
   */
  writeFeatures(features) {
    mkdirSync(join(this.root, 'docs', 'registry'), { recursive: true });

    let yaml = '# Feature Registry\n';
    yaml += '# Authoritative index of all project features\n';
    yaml += '# Auto-generated from GDD — safe to edit manually\n\n';

    if (features.length === 0) {
      yaml += 'features: []\n';
    } else {
      yaml += 'features:\n';
      for (const f of features) {
        yaml += `\n  - id: ${f.id}\n`;
        yaml += `    name: ${f.name}\n`;
        yaml += `    category: ${f.category}\n`;
        yaml += `    status: ${f.status}\n`;
        if (f.gdd_document) {
          yaml += `    document: ${f.gdd_document}\n`;
          yaml += `    section: ${f.gdd_section || f.id}\n`;
        }
        if (f.systems && Array.isArray(f.systems) && f.systems.length > 0) {
          yaml += `    systems:\n`;
          for (const s of f.systems) {
            yaml += `      - ${s}\n`;
          }
        }
        if (f.dependencies && Array.isArray(f.dependencies) && f.dependencies.length > 0) {
          yaml += `    dependencies:\n`;
          for (const d of f.dependencies) {
            yaml += `      - ${d}\n`;
          }
        }
      }
    }

    writeFileSync(this.featuresPath, yaml);
  }
}

// CLI entry point
if (process.argv[1]?.endsWith('generate-features.mjs')) {
  const gen = new FeatureGenerator();
  const result = gen.generate();

  if (result.created.length > 0) {
    console.log(`\n✓ Created ${result.created.length} features from GDD`);
    console.log('\nNext: review docs/registry/features.yaml and adjust if needed');
  } else {
    console.log('\nNo new features to create.');
  }
}

export { FeatureGenerator };
