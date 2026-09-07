#!/usr/bin/env node

/**
 * Feature Lookup
 * Resolves feature queries to stable IDs.
 * Supports: exact ID, name, alias, fuzzy/typo matching, natural language.
 */

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

// Import shared YAML parser
import { parseSimpleYaml } from '../validate/validate.mjs';

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshtein(a, b) {
  const matrix = Array.from({ length: b.length + 1 }, (_, i) => [i]);
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      const cost = a[j - 1] === b[i - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[b.length][a.length];
}

/**
 * Load features from registry
 */
function loadFeatures(projectRoot = process.cwd()) {
  const path = join(projectRoot, 'docs', 'registry', 'features.yaml');
  if (!existsSync(path)) return [];
  const content = readFileSync(path, 'utf-8');
  return parseSimpleYaml(content).features || [];
}

/**
 * Resolve a query to feature matches
 * @param {string} query - User query (ID, name, natural language, typo)
 * @param {object} options
 * @param {string} options.projectRoot - Project root path
 * @param {string} options.status - Filter by status
 * @returns {{exact: object|null, candidates: Array<{feature: object, score: number, reason: string}>}}
 */
function resolveFeature(query, options = {}) {
  const projectRoot = options.projectRoot || process.cwd();
  const features = loadFeatures(projectRoot);
  const q = query.toLowerCase().trim();

  // 1. Exact ID match
  const exactId = features.find(f => f.id === q);
  if (exactId) return { exact: exactId, candidates: [] };

  // 2. Exact name match (case-insensitive)
  const exactName = features.find(f => f.name?.toLowerCase() === q);
  if (exactName) return { exact: exactName, candidates: [] };

  // 3. Alias match
  const aliasMatch = features.find(f => {
    const aliases = f.aliases || [];
    return Array.isArray(aliases) && aliases.some(a => a.toLowerCase() === q);
  });
  if (aliasMatch) return { exact: aliasMatch, candidates: [] };

  // 4. Partial ID match
  const partialId = features.filter(f => f.id?.includes(q));
  if (partialId.length === 1) return { exact: partialId[0], candidates: [] };

  // 5. Partial name match
  const partialName = features.filter(f => f.name?.toLowerCase().includes(q));

  // 6. Fuzzy matching on ID, ID suffix, name, and name words
  const scored = features.map(f => {
    const id = f.id || '';
    const name = (f.name || '').toLowerCase();
    const idSuffix = id.includes('.') ? id.split('.').pop() : id;
    const nameWords = name.split(/\s+/);

    const idDist = levenshtein(q, id);
    const idSuffixDist = levenshtein(q, idSuffix);
    const nameDist = levenshtein(q, name);
    const nameWordDist = Math.min(...nameWords.map(w => levenshtein(q, w)), 100);
    const idPartial = id.includes(q) ? 0 : 100;
    const namePartial = name.includes(q) ? 0 : 100;

    const score = Math.min(idDist, idSuffixDist, nameDist, nameWordDist, idPartial, namePartial);
    let reason = 'fuzzy match';
    if (idPartial === 0) reason = 'partial ID match';
    else if (namePartial === 0) reason = 'partial name match';
    else if (idDist <= nameDist) reason = `ID similarity (distance: ${idDist})`;
    else reason = `name similarity (distance: ${nameDist})`;

    return { feature: f, score, reason };
  });

  // Filter reasonable matches (distance <= 5 or 40% of query length)
  const threshold = Math.max(3, Math.floor(q.length * 0.4));
  const candidates = scored
    .filter(s => s.score <= threshold)
    .sort((a, b) => a.score - b.score)
    .slice(0, 5);

  // Apply status filter if requested
  const filtered = options.status
    ? candidates.filter(c => c.feature.status === options.status.toUpperCase())
    : candidates;

  return { exact: null, candidates: filtered };
}

/**
 * List features with optional status filter
 */
function listFeatures(options = {}) {
  const features = loadFeatures(options.projectRoot);
  if (options.status) {
    return features.filter(f => f.status?.toUpperCase() === options.status.toUpperCase());
  }
  return features;
}

// CLI entry point
if (process.argv[1] && process.argv[1].endsWith('feature-lookup.mjs')) {
  const query = process.argv[2];
  if (!query) {
    console.log('Usage: feature-lookup.mjs <query> [--status STATUS]');
    process.exit(1);
  }

  const statusIdx = process.argv.indexOf('--status');
  const status = statusIdx !== -1 ? process.argv[statusIdx + 1] : undefined;

  const result = resolveFeature(query, { status });

  if (result.exact) {
    console.log(`Resolved: ${result.exact.id} (${result.exact.name})`);
  } else if (result.candidates.length > 0) {
    console.log('Feature not found.\n\nPossible matches:');
    result.candidates.forEach((c, i) => {
      console.log(`  ${i + 1}. ${c.feature.id} (${c.feature.name}) — ${c.reason}`);
    });
  } else {
    console.log('Feature not found. No similar features in registry.');
  }
}

export { resolveFeature, listFeatures, loadFeatures, levenshtein };
