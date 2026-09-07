import { GDDProvider, GDDProviderError } from '../provider-interface.mjs';

/**
 * Generic GDD Provider
 * Base implementation for custom providers.
 * Extend this for Notion, Confluence, or other document sources.
 */
export class GenericProvider extends GDDProvider {
  get id() { return 'generic'; }
  get name() { return 'Generic Provider'; }

  async checkStatus() {
    return { available: false, authenticated: false, reason: 'Generic provider requires custom implementation' };
  }

  async getDocuments() {
    throw new GDDProviderError('Generic provider not implemented. Extend GenericProvider for your use case.', 'NOT_IMPLEMENTED');
  }

  async getMetadata(documentId) {
    throw new GDDProviderError('Not implemented', 'NOT_IMPLEMENTED');
  }

  async getContent(documentId) {
    throw new GDDProviderError('Not implemented', 'NOT_IMPLEMENTED');
  }

  async getRevision(documentId, revision) {
    throw new GDDProviderError('Not implemented', 'NOT_IMPLEMENTED');
  }

  async hasChanges(documentId, sinceRevision) {
    throw new GDDProviderError('Not implemented', 'NOT_IMPLEMENTED');
  }
}
