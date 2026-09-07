/**
 * Claude Code Adapter
 *
 * Maps portable skill capabilities to Claude Code's tool system.
 * This adapter is loaded by Claude Code skill definitions to provide
 * the implementation bridge between portable workflow and Claude Code.
 */

import { Bootstrap } from '../../scripts/bootstrap/bootstrap.mjs';
import { WorkflowValidator } from '../../scripts/validate/validate.mjs';
import { resolveFeature, listFeatures, loadFeatures } from '../../scripts/registry/feature-lookup.mjs';
import { createProvider } from '../../providers/provider-factory.mjs';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const PROJECT_ROOT = process.cwd();

/**
 * Capability implementations for Claude Code
 */
export const capabilities = {
  /**
   * Read a file from the project
   */
  readFile(path) {
    const fullPath = path.startsWith('/') ? path : join(PROJECT_ROOT, path);
    if (!existsSync(fullPath)) return null;
    return readFileSync(fullPath, 'utf-8');
  },

  /**
   * Write a file to the project
   */
  writeFile(path, content) {
    const fullPath = path.startsWith('/') ? path : join(PROJECT_ROOT, path);
    const dir = join(fullPath, '..');
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(fullPath, content);
  },

  /**
   * Resolve a feature query
   */
  resolveFeature(query, options) {
    return resolveFeature(query, { projectRoot: PROJECT_ROOT, ...options });
  },

  /**
   * List features
   */
  listFeatures(options) {
    return listFeatures({ projectRoot: PROJECT_ROOT, ...options });
  },

  /**
   * Run bootstrap
   */
  async bootstrap() {
    const bs = new Bootstrap();
    return bs.run();
  },

  /**
   * Run validation
   */
  validate() {
    const v = new WorkflowValidator(PROJECT_ROOT);
    return v.validate();
  },

  /**
   * Get GDD provider
   */
  getProvider(providerType, config) {
    return createProvider(providerType || 'local', config);
  },

  /**
   * Load configuration
   */
  loadConfig() {
    const configPath = join(PROJECT_ROOT, '.ai', 'config', 'gdd.yaml');
    if (!existsSync(configPath)) return null;
    return readFileSync(configPath, 'utf-8');
  },

  /**
   * Load GDD state
   */
  loadGDDState() {
    const statePath = join(PROJECT_ROOT, '.ai', 'gdd-state.json');
    if (!existsSync(statePath)) return { documents: {} };
    return JSON.parse(readFileSync(statePath, 'utf-8'));
  },

  /**
   * Save GDD state
   */
  saveGDDState(state) {
    const statePath = join(PROJECT_ROOT, '.ai', 'gdd-state.json');
    writeFileSync(statePath, JSON.stringify(state, null, 2));
  },

  /**
   * Load feature registry
   */
  loadFeatureRegistry() {
    return loadFeatures(PROJECT_ROOT);
  },
};

export default capabilities;
