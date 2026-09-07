/**
 * GDD Provider Interface
 * All GDD providers must implement these operations.
 * The workflow core depends on this interface, not on specific providers.
 */

export class GDDProviderError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'GDDProviderError';
    this.code = code;
  }
}

export class GDDProvider {
  constructor(config) {
    if (new.target === GDDProvider) {
      throw new Error('GDDProvider is abstract. Use a concrete provider.');
    }
    this.config = config;
  }

  /** @returns {string} Provider identifier */
  get id() { throw new Error('Not implemented'); }

  /** @returns {string} Human-readable name */
  get name() { throw new Error('Not implemented'); }

  /**
   * Check if provider is available and configured
   * @returns {Promise<{available: boolean, authenticated: boolean, reason?: string}>}
   */
  async checkStatus() { throw new Error('Not implemented'); }

  /**
   * List available documents
   * @returns {Promise<Array<{id: string, name: string, modifiedTime: string}>>}
   */
  async getDocuments() { throw new Error('Not implemented'); }

  /**
   * Get document metadata without content
   * @param {string} documentId
   * @returns {Promise<{id: string, name: string, modifiedTime: string, revision: string}>}
   */
  async getMetadata(documentId) { throw new Error('Not implemented'); }

  /**
   * Get document content
   * @param {string} documentId
   * @returns {Promise<{content: string, revision: string, modifiedTime: string}>}
   */
  async getContent(documentId) { throw new Error('Not implemented'); }

  /**
   * Get specific revision content
   * @param {string} documentId
   * @param {string} revision
   * @returns {Promise<{content: string, revision: string}>}
   */
  async getRevision(documentId, revision) { throw new Error('Not implemented'); }

  /**
   * Check if document changed since given revision
   * @param {string} documentId
   * @param {string} sinceRevision
   * @returns {Promise<{changed: boolean, currentRevision: string}>}
   */
  async hasChanges(documentId, sinceRevision) { throw new Error('Not implemented'); }
}
