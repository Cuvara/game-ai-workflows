import { GDDProvider, GDDProviderError } from '../provider-interface.mjs';
import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, basename } from 'path';
import { createHash } from 'crypto';

/**
 * Local Filesystem GDD Provider
 * Reads GDD documents from local markdown files.
 * Useful for offline work and projects not using Google Drive.
 */
export class LocalProvider extends GDDProvider {
  get id() { return 'local'; }
  get name() { return 'Local Filesystem'; }

  constructor(config) {
    super(config);
    this.basePath = config?.basePath || 'docs/gdd';
  }

  async checkStatus() {
    const exists = existsSync(this.basePath);
    return {
      available: exists,
      authenticated: true, // Local files don't need auth
      reason: exists ? undefined : `GDD directory not found: ${this.basePath}`
    };
  }

  async getDocuments() {
    if (!existsSync(this.basePath)) {
      return [];
    }
    const files = readdirSync(this.basePath).filter(f => f.endsWith('.md'));
    return files.map(f => {
      const fullPath = join(this.basePath, f);
      const stat = statSync(fullPath);
      return {
        id: basename(f, '.md'),
        name: basename(f, '.md'),
        modifiedTime: stat.mtime.toISOString()
      };
    });
  }

  async getMetadata(documentId) {
    const filePath = this._resolvePath(documentId);
    if (!existsSync(filePath)) {
      throw new GDDProviderError(`Document not found: ${documentId}`, 'NOT_FOUND');
    }
    const stat = statSync(filePath);
    const content = readFileSync(filePath, 'utf-8');
    return {
      id: documentId,
      name: documentId,
      modifiedTime: stat.mtime.toISOString(),
      revision: this._computeHash(content)
    };
  }

  async getContent(documentId) {
    const filePath = this._resolvePath(documentId);
    if (!existsSync(filePath)) {
      throw new GDDProviderError(`Document not found: ${documentId}`, 'NOT_FOUND');
    }
    const content = readFileSync(filePath, 'utf-8');
    const stat = statSync(filePath);
    return {
      content,
      revision: this._computeHash(content),
      modifiedTime: stat.mtime.toISOString()
    };
  }

  async getRevision(documentId, revision) {
    // Local provider uses snapshots directory for historical versions
    const snapshotPath = join('docs/gdd/snapshots', `${documentId}-${revision}.md`);
    if (existsSync(snapshotPath)) {
      const content = readFileSync(snapshotPath, 'utf-8');
      return { content, revision };
    }
    // Fall back to current if revision matches
    const current = await this.getContent(documentId);
    if (current.revision === revision) {
      return { content: current.content, revision };
    }
    throw new GDDProviderError(`Revision not found: ${revision}`, 'REVISION_NOT_FOUND');
  }

  async hasChanges(documentId, sinceRevision) {
    const meta = await this.getMetadata(documentId);
    return {
      changed: meta.revision !== sinceRevision,
      currentRevision: meta.revision
    };
  }

  _resolvePath(documentId) {
    // Try exact path first, then with .md extension
    if (existsSync(documentId)) return documentId;
    const withExt = join(this.basePath, `${documentId}.md`);
    if (existsSync(withExt)) return withExt;
    return join(this.basePath, documentId);
  }

  _computeHash(content) {
    return createHash('sha256').update(content).digest('hex').substring(0, 12);
  }
}
