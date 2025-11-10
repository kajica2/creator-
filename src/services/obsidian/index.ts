export { ObsidianClient } from './client';
export { ObsidianSyncService } from './syncService';
export { ObsidianConfigManager, getObsidianConfig, updateObsidianConfig, validateObsidianConfig } from './configManager';
export { DocumentationGenerator, documentationGenerator } from './documentationGenerator';

// Re-export types
export * from '../../types/obsidian/types';

// Main service factory
import { ObsidianSyncService } from './syncService';
import { getObsidianConfig } from './configManager';

let syncServiceInstance: ObsidianSyncService | null = null;

export function getObsidianSyncService(): ObsidianSyncService {
  if (!syncServiceInstance) {
    const config = getObsidianConfig();
    syncServiceInstance = new ObsidianSyncService(config);
  }
  return syncServiceInstance;
}

export function resetObsidianSyncService(): void {
  if (syncServiceInstance) {
    syncServiceInstance.stopSync();
    syncServiceInstance = null;
  }
}

// Utility functions
export async function initializeObsidianIntegration() {
  const config = getObsidianConfig();

  if (!config.apiUrl || !config.vaultName) {
    throw new Error('Obsidian configuration is incomplete. Please check your environment variables.');
  }

  const syncService = getObsidianSyncService();

  // Test connection
  const status = await syncService.getSyncStatus();
  if (status.status === 'error') {
    throw new Error(`Failed to connect to Obsidian: ${status.errors.join(', ')}`);
  }

  return syncService;
}

export async function startDocumentationSync() {
  const syncService = getObsidianSyncService();
  await syncService.startSync();
  return syncService;
}

export async function stopDocumentationSync() {
  const syncService = getObsidianSyncService();
  syncService.stopSync();
}