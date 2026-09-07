/**
 * Codex Adapter
 *
 * Provides workflow capabilities for Codex CLI and Codex-style agents.
 * Wraps the portable core scripts with Codex-friendly interfaces.
 */

import { Bootstrap } from '../../scripts/bootstrap/bootstrap.mjs';
import { WorkflowValidator } from '../../scripts/validate/validate.mjs';
import { resolveFeature, listFeatures } from '../../scripts/registry/feature-lookup.mjs';
import { createProvider } from '../../providers/provider-factory.mjs';

export class CodexWorkflow {
  constructor(projectRoot = process.cwd()) {
    this.projectRoot = projectRoot;
  }

  async bootstrap() {
    const bs = new Bootstrap();
    return bs.run();
  }

  validate() {
    const v = new WorkflowValidator(this.projectRoot);
    return v.validate();
  }

  listFeatures(status) {
    return listFeatures({ projectRoot: this.projectRoot, status });
  }

  findFeature(query, options) {
    return resolveFeature(query, { projectRoot: this.projectRoot, ...options });
  }

  getProvider(type, config) {
    return createProvider(type || 'local', config);
  }
}

export default CodexWorkflow;
