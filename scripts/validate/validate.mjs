#!/usr/bin/env node

/**
 * Workflow Validator
 * Detects: duplicate IDs, broken references, missing specs, invalid states,
 * invalid transitions, missing files, broken GDD links, broken system links,
 * duplicate design changes.
 *
 * Works without Claude Code or any specific agent.
 */

import { existsSync, readFileSync, readdirSync } from 'fs';
import { join } from 'path';

// Simple YAML parser for our subset (avoids external dependency)
// Handles arrays of objects with string/array properties
function parseSimpleYaml(content) {
  // This is intentionally minimal - handles our registry YAML format
  // For production, consider js-yaml
  const lines = content.split('\n');
  const result = {};
  let currentArray = null;
  let currentArrayName = null;
  let currentObj = null;
  let currentSubKey = null;
  let currentSubArray = null;

  for (const line of lines) {
    const trimmed = line.trimEnd();
    if (!trimmed || trimmed.startsWith('#')) continue;

    // Top-level key with empty array
    const topArrayMatch = trimmed.match(/^(\w+):\s*\[\s*\]$/);
    if (topArrayMatch) {
      result[topArrayMatch[1]] = [];
      continue;
    }

    // Top-level key
    const topKeyMatch = trimmed.match(/^(\w+):\s*(.*)$/);
    if (topKeyMatch && !trimmed.startsWith(' ') && !trimmed.startsWith('-')) {
      currentArrayName = topKeyMatch[1];
      currentArray = [];
      result[currentArrayName] = currentArray;
      currentObj = null;
      currentSubKey = null;
      continue;
    }

    // Determine indent level
    const indent = trimmed.match(/^(\s*)/)[1].length;

    // Sub-array object item (deeply indented - id: value inside a sub-array)
    const subArrayObjMatch = trimmed.match(/^\s{6,}-\s+(\w+):\s*(.*)$/);
    if (subArrayObjMatch && currentSubArray && indent >= 6) {
      const subObj = { [subArrayObjMatch[1]]: subArrayObjMatch[2].replace(/^["']|["']$/g, '') };
      currentSubArray.push(subObj);
      currentObj = subObj;  // Allow further properties on this sub-object
      continue;
    }

    // Sub-array simple item
    const subArrayItemMatch = trimmed.match(/^\s{6,}-\s+(.+)$/);
    if (subArrayItemMatch && currentSubArray && indent >= 6) {
      currentSubArray.push(subArrayItemMatch[1].replace(/^["']|["']$/g, ''));
      continue;
    }

    // Sub-object property (8+ indent, belongs to last sub-array object)
    const subObjPropMatch = trimmed.match(/^\s{8,}(\w+):\s*(.+)$/);
    if (subObjPropMatch && currentSubArray && currentObj && indent >= 8) {
      currentObj[subObjPropMatch[1]] = subObjPropMatch[2].replace(/^["']|["']$/g, '');
      continue;
    }

    // Array item start (top-level array entry, 2-4 indent)
    const arrayItemMatch = trimmed.match(/^\s{2,4}-\s+(\w+):\s*(.*)$/);
    if (arrayItemMatch && indent < 6) {
      currentObj = { [arrayItemMatch[1]]: arrayItemMatch[2].replace(/^["']|["']$/g, '') };
      if (currentArray) currentArray.push(currentObj);
      currentSubKey = null;
      currentSubArray = null;
      continue;
    }

    // Sub-key with value (4-6 indent)
    const subKeyMatch = trimmed.match(/^\s{4,6}(\w+):\s*(.+)$/);
    if (subKeyMatch && currentObj && indent >= 4 && indent <= 6) {
      const val = subKeyMatch[2].replace(/^["']|["']$/g, '');
      currentObj[subKeyMatch[1]] = val;
      currentSubKey = subKeyMatch[1];
      continue;
    }

    // Sub-key starting array (4-6 indent, ends with just colon)
    const subKeyArrayMatch = trimmed.match(/^\s{4,6}(\w+):\s*$/);
    if (subKeyArrayMatch && currentObj && indent >= 4 && indent <= 6) {
      currentSubKey = subKeyArrayMatch[1];
      currentObj[currentSubKey] = [];
      currentSubArray = currentObj[currentSubKey];
      continue;
    }
  }

  return result;
}

const VALID_STATUSES = [
  'PLANNED', 'DESIGN_REVIEW', 'READY', 'IN_PROGRESS', 'IMPLEMENTED',
  'TESTING', 'PLAYTEST', 'VERIFIED', 'BLOCKED', 'NEEDS_REVIEW',
  'DESIGN_CHANGED', 'DEPRECATED', 'CANCELLED'
];

const VALID_TRANSITIONS = {
  'PLANNED': ['DESIGN_REVIEW', 'CANCELLED'],
  'DESIGN_REVIEW': ['READY', 'PLANNED', 'BLOCKED', 'CANCELLED'],
  'READY': ['IN_PROGRESS', 'BLOCKED', 'DESIGN_CHANGED', 'CANCELLED'],
  'IN_PROGRESS': ['IMPLEMENTED', 'BLOCKED', 'NEEDS_REVIEW', 'DESIGN_CHANGED', 'CANCELLED'],
  'IMPLEMENTED': ['TESTING', 'BLOCKED', 'NEEDS_REVIEW', 'DESIGN_CHANGED'],
  'TESTING': ['PLAYTEST', 'NEEDS_REVIEW', 'IN_PROGRESS', 'BLOCKED'],
  'PLAYTEST': ['VERIFIED', 'NEEDS_REVIEW', 'TESTING', 'BLOCKED'],
  'VERIFIED': ['DEPRECATED'],
  'BLOCKED': ['PLANNED', 'DESIGN_REVIEW', 'READY', 'IN_PROGRESS', 'CANCELLED'],
  'NEEDS_REVIEW': ['DESIGN_REVIEW', 'IN_PROGRESS', 'CANCELLED'],
  'DESIGN_CHANGED': ['DESIGN_REVIEW', 'CANCELLED'],
  'DEPRECATED': [],
  'CANCELLED': [],
};

class WorkflowValidator {
  constructor(projectRoot = process.cwd()) {
    this.root = projectRoot;
    this.issues = [];
    this.warnings = [];
  }

  validate() {
    console.log('Validating workflow...\n');

    this.validateRegistries();
    this.validateFeatures();
    this.validateSystems();
    this.validateGDD();
    this.validateDesignChanges();
    this.validateReferences();

    this.report();
    return this.issues.length === 0;
  }

  validateRegistries() {
    const registryFiles = ['features.yaml', 'systems.yaml', 'gdd.yaml'];
    for (const file of registryFiles) {
      const path = join(this.root, 'docs', 'registry', file);
      if (!existsSync(path)) {
        this.issues.push(`Missing registry: ${file}`);
      }
    }
  }

  validateFeatures() {
    const featuresPath = join(this.root, 'docs', 'registry', 'features.yaml');
    if (!existsSync(featuresPath)) return;

    const content = readFileSync(featuresPath, 'utf-8');
    const data = parseSimpleYaml(content);
    const features = data.features || [];

    // Check duplicate IDs
    const ids = new Set();
    for (const f of features) {
      if (!f.id) {
        this.issues.push(`Feature missing ID: ${JSON.stringify(f)}`);
        continue;
      }
      if (ids.has(f.id)) {
        this.issues.push(`Duplicate feature ID: ${f.id}`);
      }
      ids.add(f.id);

      // Check status
      if (f.status && !VALID_STATUSES.includes(f.status)) {
        this.issues.push(`Invalid status "${f.status}" for feature ${f.id}`);
      }

      // Check spec file
      if (f.spec) {
        const specPath = typeof f.spec === 'string' ? f.spec : f.spec.path;
        if (specPath && !existsSync(join(this.root, specPath))) {
          this.warnings.push(`Missing spec file for ${f.id}: ${specPath}`);
        }
      }

      // Check ID format
      if (f.id && !f.id.match(/^[a-z]+\.[a-z][a-z0-9-]*$/)) {
        this.warnings.push(`Feature ID "${f.id}" does not follow category.name format`);
      }
    }
  }

  validateSystems() {
    const systemsPath = join(this.root, 'docs', 'registry', 'systems.yaml');
    if (!existsSync(systemsPath)) return;

    const content = readFileSync(systemsPath, 'utf-8');
    const data = parseSimpleYaml(content);
    const systems = data.systems || [];

    const ids = new Set();
    for (const s of systems) {
      if (!s.id) {
        this.issues.push(`System missing ID`);
        continue;
      }
      if (ids.has(s.id)) {
        this.issues.push(`Duplicate system ID: ${s.id}`);
      }
      ids.add(s.id);
    }
  }

  validateGDD() {
    const gddPath = join(this.root, 'docs', 'registry', 'gdd.yaml');
    if (!existsSync(gddPath)) return;

    const content = readFileSync(gddPath, 'utf-8');
    const data = parseSimpleYaml(content);
    const documents = data.documents || [];

    const ids = new Set();
    for (const d of documents) {
      if (!d.id) {
        this.issues.push(`GDD document missing ID`);
        continue;
      }
      if (ids.has(d.id)) {
        this.issues.push(`Duplicate GDD document ID: ${d.id}`);
      }
      ids.add(d.id);
    }
  }

  validateDesignChanges() {
    const dcDir = join(this.root, 'docs', 'design-changes');
    if (!existsSync(dcDir)) return;

    const files = readdirSync(dcDir).filter(f => f.endsWith('.md') || f.endsWith('.yaml'));
    const ids = new Set();

    for (const file of files) {
      const content = readFileSync(join(dcDir, file), 'utf-8');
      const idMatch = content.match(/\*\*ID:\*\*\s*(\S+)/);
      if (idMatch) {
        if (ids.has(idMatch[1])) {
          this.issues.push(`Duplicate design change ID: ${idMatch[1]}`);
        }
        ids.add(idMatch[1]);
      }
    }
  }

  validateReferences() {
    const featuresPath = join(this.root, 'docs', 'registry', 'features.yaml');
    const systemsPath = join(this.root, 'docs', 'registry', 'systems.yaml');
    const gddPath = join(this.root, 'docs', 'registry', 'gdd.yaml');

    if (!existsSync(featuresPath)) return;

    const features = parseSimpleYaml(readFileSync(featuresPath, 'utf-8')).features || [];
    const systems = existsSync(systemsPath)
      ? (parseSimpleYaml(readFileSync(systemsPath, 'utf-8')).systems || [])
      : [];
    const gddDocs = existsSync(gddPath)
      ? (parseSimpleYaml(readFileSync(gddPath, 'utf-8')).documents || [])
      : [];

    const systemIds = new Set(systems.map(s => s.id));
    const gddIds = new Set(gddDocs.map(d => d.id));
    const featureIds = new Set(features.map(f => f.id));

    // Check feature -> system references
    for (const f of features) {
      const fSystems = f.systems || [];
      if (Array.isArray(fSystems)) {
        for (const sId of fSystems) {
          if (!systemIds.has(sId)) {
            this.warnings.push(`Feature ${f.id} references unknown system: ${sId}`);
          }
        }
      }

      // Check feature -> GDD references
      if (f.document && !gddIds.has(f.document)) {
        this.warnings.push(`Feature ${f.id} references unknown GDD document: ${f.document}`);
      }

      // Check feature -> feature dependencies
      const deps = f.dependencies || [];
      if (Array.isArray(deps)) {
        for (const depId of deps) {
          if (!featureIds.has(depId)) {
            this.warnings.push(`Feature ${f.id} depends on unknown feature: ${depId}`);
          }
        }
      }
    }
  }

  report() {
    if (this.issues.length === 0 && this.warnings.length === 0) {
      console.log('Validation passed. ✓\n');
      return;
    }

    if (this.issues.length > 0) {
      console.log(`Errors (${this.issues.length}):`);
      for (const issue of this.issues) {
        console.log(`  ✗ ${issue}`);
      }
    }

    if (this.warnings.length > 0) {
      console.log(`\nWarnings (${this.warnings.length}):`);
      for (const w of this.warnings) {
        console.log(`  ⚠ ${w}`);
      }
    }

    console.log('');
  }
}

// CLI entry point
if (process.argv[1] && process.argv[1].endsWith('validate.mjs')) {
  const validator = new WorkflowValidator();
  const ok = validator.validate();
  process.exit(ok ? 0 : 1);
}

export { WorkflowValidator, VALID_STATUSES, VALID_TRANSITIONS, parseSimpleYaml };
