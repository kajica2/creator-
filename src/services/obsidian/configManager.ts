import { ObsidianConfig } from '../../types/obsidian/types';

export class ObsidianConfigManager {
  private static instance: ObsidianConfigManager;
  private config: ObsidianConfig;

  private constructor() {
    this.config = this.loadDefaultConfig();
  }

  static getInstance(): ObsidianConfigManager {
    if (!ObsidianConfigManager.instance) {
      ObsidianConfigManager.instance = new ObsidianConfigManager();
    }
    return ObsidianConfigManager.instance;
  }

  private loadDefaultConfig(): ObsidianConfig {
    return {
      apiUrl: process.env.OBSIDIAN_API_URL || 'http://localhost',
      port: parseInt(process.env.OBSIDIAN_API_PORT || '27123', 10),
      vaultName: process.env.OBSIDIAN_VAULT_NAME || 'viral-hashtag-ai',
      token: process.env.OBSIDIAN_API_TOKEN,
      autoSync: process.env.OBSIDIAN_AUTO_SYNC === 'true',
      syncInterval: parseInt(process.env.OBSIDIAN_SYNC_INTERVAL || '300', 10), // 5 minutes
      documentationPath: process.env.OBSIDIAN_DOCS_PATH || 'Projects/Viral-Hashtag-AI',
    };
  }

  getConfig(): ObsidianConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<ObsidianConfig>): void {
    this.config = { ...this.config, ...updates };
    this.saveConfig();
  }

  private saveConfig(): void {
    // In a real app, you might save to localStorage, a config file, or database
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('obsidian-config', JSON.stringify(this.config));
    }
  }

  private loadSavedConfig(): ObsidianConfig | null {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = localStorage.getItem('obsidian-config');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return null;
        }
      }
    }
    return null;
  }

  resetToDefaults(): void {
    this.config = this.loadDefaultConfig();
    this.saveConfig();
  }

  validateConfig(config: Partial<ObsidianConfig>): string[] {
    const errors: string[] = [];

    if (config.apiUrl && !this.isValidUrl(config.apiUrl)) {
      errors.push('Invalid API URL format');
    }

    if (config.port && (config.port < 1 || config.port > 65535)) {
      errors.push('Port must be between 1 and 65535');
    }

    if (config.syncInterval && config.syncInterval < 10) {
      errors.push('Sync interval must be at least 10 seconds');
    }

    if (config.vaultName && !/^[a-zA-Z0-9-_]+$/.test(config.vaultName)) {
      errors.push('Vault name can only contain letters, numbers, hyphens, and underscores');
    }

    if (config.documentationPath && config.documentationPath.includes('..')) {
      errors.push('Documentation path cannot contain relative path traversal');
    }

    return errors;
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  getConnectionString(): string {
    return `${this.config.apiUrl}:${this.config.port}`;
  }

  isConfigured(): boolean {
    return !!(
      this.config.apiUrl &&
      this.config.port &&
      this.config.vaultName &&
      this.config.documentationPath
    );
  }

  getEnvironmentTemplate(): string {
    return `# Obsidian Integration Configuration
OBSIDIAN_API_URL=http://localhost
OBSIDIAN_API_PORT=27123
OBSIDIAN_VAULT_NAME=viral-hashtag-ai
OBSIDIAN_API_TOKEN=your-api-token-here
OBSIDIAN_AUTO_SYNC=true
OBSIDIAN_SYNC_INTERVAL=300
OBSIDIAN_DOCS_PATH=Projects/Viral-Hashtag-AI
`;
  }

  exportConfig(): string {
    return JSON.stringify(this.config, null, 2);
  }

  importConfig(configJson: string): void {
    try {
      const importedConfig = JSON.parse(configJson);
      const errors = this.validateConfig(importedConfig);

      if (errors.length > 0) {
        throw new Error(`Invalid configuration: ${errors.join(', ')}`);
      }

      this.config = { ...this.loadDefaultConfig(), ...importedConfig };
      this.saveConfig();
    } catch (error) {
      throw new Error(`Failed to import configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export function getObsidianConfig(): ObsidianConfig {
  return ObsidianConfigManager.getInstance().getConfig();
}

export function updateObsidianConfig(updates: Partial<ObsidianConfig>): void {
  ObsidianConfigManager.getInstance().updateConfig(updates);
}

export function validateObsidianConfig(config: Partial<ObsidianConfig>): string[] {
  return ObsidianConfigManager.getInstance().validateConfig(config);
}