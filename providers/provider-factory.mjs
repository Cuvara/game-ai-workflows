import { GoogleDriveProvider } from './google-drive/google-drive-provider.mjs';
import { LocalProvider } from './local/local-provider.mjs';
import { GenericProvider } from './generic/generic-provider.mjs';

const PROVIDERS = {
  'google-drive': GoogleDriveProvider,
  'local': LocalProvider,
  'generic': GenericProvider,
};

/**
 * Create a GDD provider instance from configuration
 * @param {string} providerType - Provider identifier
 * @param {object} config - Provider configuration
 * @returns {GDDProvider}
 */
export function createProvider(providerType, config) {
  const ProviderClass = PROVIDERS[providerType];
  if (!ProviderClass) {
    throw new Error(`Unknown provider: ${providerType}. Available: ${Object.keys(PROVIDERS).join(', ')}`);
  }
  return new ProviderClass(config);
}

/**
 * Get list of available provider types
 * @returns {string[]}
 */
export function getAvailableProviders() {
  return Object.keys(PROVIDERS);
}

/**
 * Register a custom provider
 * @param {string} id - Provider identifier
 * @param {typeof GDDProvider} providerClass - Provider class
 */
export function registerProvider(id, providerClass) {
  PROVIDERS[id] = providerClass;
}
