import { GDDProvider, GDDProviderError } from '../provider-interface.mjs';

/**
 * Google Drive GDD Provider
 *
 * Requires Google Drive MCP or API access.
 * Authentication is handled externally (OAuth browser flow).
 */
export class GoogleDriveProvider extends GDDProvider {
  get id() { return 'google-drive'; }
  get name() { return 'Google Drive'; }

  constructor(config) {
    super(config);
    this.fileId = config?.document?.drive_file_id || null;
    this._mcpAvailable = null;
  }

  async checkStatus() {
    // Check if Google Drive MCP/API is available
    const mcpAvailable = await this._checkMCPAvailability();
    if (!mcpAvailable) {
      return { available: false, authenticated: false, reason: 'Google Drive MCP not configured' };
    }

    // Check authentication
    const authenticated = await this._checkAuthentication();
    if (!authenticated) {
      return { available: true, authenticated: false, reason: 'Google Drive authentication required' };
    }

    return { available: true, authenticated: true };
  }

  async getDocuments() {
    this._ensureReady();
    // Implementation depends on MCP tool availability
    // This would call the Google Drive MCP list/search tools
    throw new GDDProviderError(
      'Google Drive document listing requires MCP integration. Run bootstrap to configure.',
      'MCP_NOT_CONFIGURED'
    );
  }

  async getMetadata(documentId) {
    this._ensureReady();
    throw new GDDProviderError(
      'Google Drive metadata requires MCP integration. Run bootstrap to configure.',
      'MCP_NOT_CONFIGURED'
    );
  }

  async getContent(documentId) {
    this._ensureReady();
    throw new GDDProviderError(
      'Google Drive content access requires MCP integration. Run bootstrap to configure.',
      'MCP_NOT_CONFIGURED'
    );
  }

  async getRevision(documentId, revision) {
    this._ensureReady();
    throw new GDDProviderError(
      'Google Drive revision access requires MCP integration. Run bootstrap to configure.',
      'MCP_NOT_CONFIGURED'
    );
  }

  async hasChanges(documentId, sinceRevision) {
    this._ensureReady();
    throw new GDDProviderError(
      'Google Drive change detection requires MCP integration. Run bootstrap to configure.',
      'MCP_NOT_CONFIGURED'
    );
  }

  async _checkMCPAvailability() {
    // Check for Google Drive MCP in environment
    // This is a detection heuristic - checks common MCP config locations
    try {
      const { existsSync, readFileSync } = await import('fs');
      const { join } = await import('path');
      const home = process.env.HOME || process.env.USERPROFILE;

      const mcpConfigPaths = [
        join(home, '.claude', 'settings.json'),
        join(home, '.claude', 'settings.local.json'),
        '.mcp.json',
      ];

      for (const configPath of mcpConfigPaths) {
        if (existsSync(configPath)) {
          const content = readFileSync(configPath, 'utf-8');
          if (content.includes('google-drive') || content.includes('Google_Drive') || content.includes('gdrive')) {
            this._mcpAvailable = true;
            return true;
          }
        }
      }
      this._mcpAvailable = false;
      return false;
    } catch {
      this._mcpAvailable = false;
      return false;
    }
  }

  async _checkAuthentication() {
    // Authentication check depends on MCP provider state
    // Cannot verify without making an actual API call
    return this._mcpAvailable === true;
  }

  _ensureReady() {
    if (!this._mcpAvailable) {
      throw new GDDProviderError(
        'Google Drive provider not ready. Run bootstrap first.',
        'NOT_READY'
      );
    }
  }
}
