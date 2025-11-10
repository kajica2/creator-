import { ObsidianConfig, ObsidianVault, ObsidianFile, ObsidianNote, ObsidianError, SyncStatus } from '../../types/obsidian/types';

export class ObsidianClient {
  private config: ObsidianConfig;
  private baseUrl: string;

  constructor(config: ObsidianConfig) {
    this.config = config;
    this.baseUrl = `${config.apiUrl}:${config.port}`;
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.config.token) {
      headers['Authorization'] = `Bearer ${this.config.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        throw new ObsidianError(
          `Obsidian API error: ${response.status} ${response.statusText}`,
          `HTTP_${response.status}`,
          { url, status: response.status }
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof ObsidianError) {
        throw error;
      }

      throw new ObsidianError(
        `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'CONNECTION_FAILED',
        { url, originalError: error }
      );
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.makeRequest('/ping');
      return true;
    } catch {
      return false;
    }
  }

  async getVault(): Promise<ObsidianVault> {
    return this.makeRequest<ObsidianVault>(`/vault`);
  }

  async listFiles(path: string = ''): Promise<ObsidianFile[]> {
    return this.makeRequest<ObsidianFile[]>(`/vault/files?path=${encodeURIComponent(path)}`);
  }

  async getFile(path: string): Promise<ObsidianFile> {
    return this.makeRequest<ObsidianFile>(`/vault/file?path=${encodeURIComponent(path)}`);
  }

  async createFile(path: string, content: string): Promise<ObsidianFile> {
    return this.makeRequest<ObsidianFile>('/vault/file', {
      method: 'POST',
      body: JSON.stringify({ path, content }),
    });
  }

  async updateFile(path: string, content: string): Promise<ObsidianFile> {
    return this.makeRequest<ObsidianFile>('/vault/file', {
      method: 'PUT',
      body: JSON.stringify({ path, content }),
    });
  }

  async deleteFile(path: string): Promise<void> {
    await this.makeRequest(`/vault/file?path=${encodeURIComponent(path)}`, {
      method: 'DELETE',
    });
  }

  async createFolder(path: string): Promise<void> {
    await this.makeRequest('/vault/folder', {
      method: 'POST',
      body: JSON.stringify({ path }),
    });
  }

  async searchFiles(query: string): Promise<ObsidianFile[]> {
    return this.makeRequest<ObsidianFile[]>(`/vault/search?query=${encodeURIComponent(query)}`);
  }

  async getNote(path: string): Promise<ObsidianNote> {
    const file = await this.getFile(path);
    return this.parseNote(file);
  }

  async createNote(note: ObsidianNote): Promise<ObsidianFile> {
    const content = this.serializeNote(note);
    return this.createFile(note.path, content);
  }

  async updateNote(note: ObsidianNote): Promise<ObsidianFile> {
    const content = this.serializeNote(note);
    return this.updateFile(note.path, content);
  }

  private parseNote(file: ObsidianFile): ObsidianNote {
    const content = file.content || '';
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);

    let frontmatter: Record<string, any> = {};
    let noteContent = content;

    if (frontmatterMatch) {
      try {
        frontmatter = this.parseFrontmatter(frontmatterMatch[1]);
        noteContent = frontmatterMatch[2];
      } catch (error) {
        console.warn('Failed to parse frontmatter:', error);
      }
    }

    const tags = this.extractTags(noteContent);
    const links = this.extractLinks(noteContent);

    return {
      path: file.path,
      content: noteContent,
      frontmatter,
      tags,
      links,
    };
  }

  private serializeNote(note: ObsidianNote): string {
    let content = '';

    if (note.frontmatter && Object.keys(note.frontmatter).length > 0) {
      content += '---\n';
      content += this.serializeFrontmatter(note.frontmatter);
      content += '\n---\n\n';
    }

    content += note.content;
    return content;
  }

  private parseFrontmatter(yaml: string): Record<string, any> {
    const lines = yaml.split('\n');
    const result: Record<string, any> = {};

    for (const line of lines) {
      const match = line.match(/^(\w+):\s*(.*)$/);
      if (match) {
        const [, key, value] = match;
        result[key] = this.parseYamlValue(value);
      }
    }

    return result;
  }

  private serializeFrontmatter(frontmatter: Record<string, any>): string {
    return Object.entries(frontmatter)
      .map(([key, value]) => `${key}: ${this.serializeYamlValue(value)}`)
      .join('\n');
  }

  private parseYamlValue(value: string): any {
    value = value.trim();

    if (value === 'true') return true;
    if (value === 'false') return false;
    if (value === 'null') return null;
    if (/^\d+$/.test(value)) return parseInt(value, 10);
    if (/^\d+\.\d+$/.test(value)) return parseFloat(value);
    if (value.startsWith('[') && value.endsWith(']')) {
      return value.slice(1, -1).split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
    }

    return value.replace(/^["']|["']$/g, '');
  }

  private serializeYamlValue(value: any): string {
    if (typeof value === 'string') {
      return value.includes(' ') || value.includes(':') ? `"${value}"` : value;
    }
    if (Array.isArray(value)) {
      return `[${value.map(v => `"${v}"`).join(', ')}]`;
    }
    return String(value);
  }

  private extractTags(content: string): string[] {
    const tagMatches = content.match(/#[\w-]+/g);
    return tagMatches ? tagMatches.map(tag => tag.slice(1)) : [];
  }

  private extractLinks(content: string): string[] {
    const linkMatches = content.match(/\[\[([^\]]+)\]\]/g);
    return linkMatches ? linkMatches.map(link => link.slice(2, -2)) : [];
  }

  async getSyncStatus(): Promise<SyncStatus> {
    try {
      const connected = await this.testConnection();
      return {
        status: connected ? 'connected' : 'disconnected',
        lastSync: new Date(),
        filesChanged: 0,
        errors: [],
      };
    } catch (error) {
      return {
        status: 'error',
        lastSync: new Date(),
        filesChanged: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }
}

export function createObsidianError(message: string, code: string, details?: any): ObsidianError {
  const error = new Error(message) as ObsidianError;
  error.code = code;
  error.details = details;
  return error;
}