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

  get canUpload() { return this._mcpAvailable === true; }

  /**
   * Upload a file to Google Drive
   * Uses Google Drive MCP create_file or update_file tools.
   *
   * When called from an AI agent (Claude Code, Codex), the agent should use
   * the Google Drive MCP tool directly:
   *   mcp__claude_ai_Google_Drive__create_file({ title, textContent, parentId })
   *   mcp__claude_ai_Google_Drive__update_file({ fileId, textContent })
   *
   * @param {string} fileName - File name
   * @param {string} content - File content (text)
   * @param {object} options - { parentId, fileId (for update), mimeType }
   * @returns {Promise<{id: string, name: string, url?: string, action: string}>}
   */
  async uploadFile(fileName, content, options = {}) {
    this._ensureReady();

    // This method provides the interface contract.
    // Actual upload is done by the AI agent using Google Drive MCP tools.
    // The script returns instructions for the agent to execute.
    return {
      provider: 'google-drive',
      action: options.fileId ? 'update' : 'create',
      instructions: {
        tool: options.fileId
          ? 'mcp__claude_ai_Google_Drive__update_file'
          : 'mcp__claude_ai_Google_Drive__create_file',
        params: {
          title: fileName,
          textContent: content,
          ...(options.parentId ? { parentId: options.parentId } : {}),
          ...(options.fileId ? { fileId: options.fileId } : {}),
        }
      },
      fileName,
      message: options.fileId
        ? `Update "${fileName}" on Google Drive (fileId: ${options.fileId})`
        : `Create "${fileName}" on Google Drive${options.parentId ? ` in folder ${options.parentId}` : ''}`,
    };
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
