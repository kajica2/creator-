import { ObsidianClient } from './client';
import { ObsidianConfig, DocumentationChange, SyncStatus, ObsidianNote } from '../../types/obsidian/types';
import { EventEmitter } from 'events';
import * as path from 'path';
import * as fs from 'fs/promises';

export class ObsidianSyncService extends EventEmitter {
  private client: ObsidianClient;
  private config: ObsidianConfig;
  private syncTimer?: NodeJS.Timeout;
  private watchedFiles = new Map<string, number>();
  private lastSyncTime = new Date();

  constructor(config: ObsidianConfig) {
    super();
    this.client = new ObsidianClient(config);
    this.config = config;
  }

  async startSync(): Promise<void> {
    if (this.syncTimer) {
      this.stopSync();
    }

    // Initial sync
    await this.performSync();

    // Set up periodic sync
    if (this.config.autoSync && this.config.syncInterval > 0) {
      this.syncTimer = setInterval(
        () => this.performSync(),
        this.config.syncInterval * 1000
      );
    }

    this.emit('syncStarted');
  }

  stopSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = undefined;
    }
    this.emit('syncStopped');
  }

  async performSync(): Promise<void> {
    try {
      this.emit('syncStarted');

      const status = await this.client.getSyncStatus();
      if (status.status !== 'connected') {
        throw new Error('Obsidian not connected');
      }

      // Sync project documentation to Obsidian
      await this.syncProjectToObsidian();

      // Sync changes from Obsidian back to project
      await this.syncObsidianToProject();

      this.lastSyncTime = new Date();
      this.emit('syncCompleted', { timestamp: this.lastSyncTime });

    } catch (error) {
      this.emit('syncError', error);
      throw error;
    }
  }

  private async syncProjectToObsidian(): Promise<void> {
    const projectRoot = process.cwd();
    const docsPath = path.join(projectRoot, 'docs');

    try {
      // Create documentation folder in Obsidian if it doesn't exist
      await this.client.createFolder(this.config.documentationPath);
    } catch {
      // Folder might already exist
    }

    // Sync markdown files from project docs
    await this.syncMarkdownFiles(docsPath);

    // Generate and sync agent documentation
    await this.syncAgentDocumentation();

    // Sync component documentation
    await this.syncComponentDocumentation();

    // Sync API documentation
    await this.syncApiDocumentation();
  }

  private async syncMarkdownFiles(docsPath: string): Promise<void> {
    try {
      const files = await this.getMarkdownFiles(docsPath);

      for (const file of files) {
        const relativePath = path.relative(docsPath, file);
        const obsidianPath = path.join(this.config.documentationPath, relativePath);

        const content = await fs.readFile(file, 'utf-8');
        const stat = await fs.stat(file);

        try {
          const existingFile = await this.client.getFile(obsidianPath);
          if (existingFile.stat.mtime < stat.mtimeMs) {
            await this.client.updateFile(obsidianPath, content);
            this.emit('fileUpdated', { path: obsidianPath, source: 'project' });
          }
        } catch {
          // File doesn't exist, create it
          await this.client.createFile(obsidianPath, content);
          this.emit('fileCreated', { path: obsidianPath, source: 'project' });
        }
      }
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
        // Docs folder doesn't exist, skip
        return;
      }
      throw error;
    }
  }

  private async getMarkdownFiles(dir: string): Promise<string[]> {
    const files: string[] = [];

    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          files.push(...await this.getMarkdownFiles(fullPath));
        } else if (entry.isFile() && entry.name.endsWith('.md')) {
          files.push(fullPath);
        }
      }
    } catch {
      // Directory might not exist
    }

    return files;
  }

  private async syncAgentDocumentation(): Promise<void> {
    const agentDocsPath = path.join(this.config.documentationPath, 'agents');

    try {
      await this.client.createFolder(agentDocsPath);
    } catch {
      // Folder might already exist
    }

    // Generate documentation for each agent type
    const agentTypes = [
      'video-agent',
      'audio-agent',
      'live-mixer-agent',
      'hashtag-analyzer',
      'content-generator'
    ];

    for (const agentType of agentTypes) {
      const agentDoc = await this.generateAgentDocumentation(agentType);
      const docPath = path.join(agentDocsPath, `${agentType}.md`);

      try {
        await this.client.updateFile(docPath, agentDoc);
      } catch {
        await this.client.createFile(docPath, agentDoc);
      }

      this.emit('agentDocumentationUpdated', { agentType, path: docPath });
    }
  }

  private async generateAgentDocumentation(agentType: string): Promise<string> {
    const template = `# ${agentType.charAt(0).toUpperCase() + agentType.slice(1).replace('-', ' ')} Agent

## Overview
Auto-generated documentation for the ${agentType} agent.

## Capabilities
- Real-time processing
- AI-powered analysis
- Integration with viral hashtag system

## API Endpoints
\`\`\`typescript
// Agent specific endpoints
GET /api/agents/${agentType}/status
POST /api/agents/${agentType}/process
PUT /api/agents/${agentType}/config
\`\`\`

## Configuration
\`\`\`json
{
  "agentType": "${agentType}",
  "enabled": true,
  "processingMode": "real-time",
  "features": []
}
\`\`\`

## Coordination Protocols
- Uses Claude-Flow for agent coordination
- Implements SPARC methodology
- Supports mesh topology

## Related Documentation
- [[Agent Architecture]]
- [[API Reference]]
- [[Coordination Protocols]]

---
*Last updated: ${new Date().toISOString()}*
*Auto-generated by Obsidian Sync Service*
`;

    return template;
  }

  private async syncComponentDocumentation(): Promise<void> {
    const componentsPath = path.join(process.cwd(), 'src', 'components');
    const componentDocsPath = path.join(this.config.documentationPath, 'components');

    try {
      await this.client.createFolder(componentDocsPath);
    } catch {
      // Folder might already exist
    }

    // Find all React components
    const componentFiles = await this.findComponentFiles(componentsPath);

    for (const componentFile of componentFiles) {
      const componentName = path.basename(componentFile, '.tsx');
      const docContent = await this.generateComponentDocumentation(componentFile, componentName);
      const docPath = path.join(componentDocsPath, `${componentName}.md`);

      try {
        await this.client.updateFile(docPath, docContent);
      } catch {
        await this.client.createFile(docPath, docContent);
      }
    }
  }

  private async findComponentFiles(dir: string): Promise<string[]> {
    const files: string[] = [];

    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          files.push(...await this.findComponentFiles(fullPath));
        } else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.jsx'))) {
          files.push(fullPath);
        }
      }
    } catch {
      // Directory might not exist
    }

    return files;
  }

  private async generateComponentDocumentation(filePath: string, componentName: string): Promise<string> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const props = this.extractComponentProps(content);
      const imports = this.extractImports(content);

      return `# ${componentName} Component

## Overview
React component for ${componentName.toLowerCase().replace(/([A-Z])/g, ' $1').trim()}.

## Props
${props.length > 0 ? props.map(prop => `- \`${prop.name}\`: ${prop.type}${prop.optional ? ' (optional)' : ''} - ${prop.description || 'No description'}`).join('\n') : 'No props defined.'}

## Usage
\`\`\`tsx
import { ${componentName} } from './components/${componentName}';

function App() {
  return (
    <${componentName}
      // Add props here
    />
  );
}
\`\`\`

## Dependencies
${imports.length > 0 ? imports.map(imp => `- ${imp}`).join('\n') : 'No external dependencies.'}

## File Location
\`${filePath}\`

---
*Last updated: ${new Date().toISOString()}*
*Auto-generated from source code*
`;
    } catch {
      return `# ${componentName} Component

## Overview
Component documentation could not be generated automatically.

## File Location
\`${filePath}\`

---
*Last updated: ${new Date().toISOString()}*
`;
    }
  }

  private extractComponentProps(content: string): Array<{name: string, type: string, optional: boolean, description?: string}> {
    const props: Array<{name: string, type: string, optional: boolean, description?: string}> = [];

    // Simple regex to extract interface props
    const interfaceMatch = content.match(/interface\s+\w*Props\s*{([^}]*)}/);
    if (interfaceMatch) {
      const propsContent = interfaceMatch[1];
      const propMatches = propsContent.match(/(\w+)(\?)?:\s*([^;]+);?/g);

      if (propMatches) {
        for (const match of propMatches) {
          const propMatch = match.match(/(\w+)(\?)?:\s*([^;]+);?/);
          if (propMatch) {
            props.push({
              name: propMatch[1],
              optional: !!propMatch[2],
              type: propMatch[3].trim(),
            });
          }
        }
      }
    }

    return props;
  }

  private extractImports(content: string): string[] {
    const imports: string[] = [];
    const importMatches = content.match(/import.*from\s+['"]([^'"]+)['"]/g);

    if (importMatches) {
      for (const match of importMatches) {
        const moduleMatch = match.match(/from\s+['"]([^'"]+)['"]/);
        if (moduleMatch && !moduleMatch[1].startsWith('.')) {
          imports.push(moduleMatch[1]);
        }
      }
    }

    return imports;
  }

  private async syncApiDocumentation(): Promise<void> {
    const apiDocsPath = path.join(this.config.documentationPath, 'api');

    try {
      await this.client.createFolder(apiDocsPath);
    } catch {
      // Folder might already exist
    }

    // Generate API documentation
    const apiDoc = await this.generateApiDocumentation();
    const docPath = path.join(apiDocsPath, 'endpoints.md');

    try {
      await this.client.updateFile(docPath, apiDoc);
    } catch {
      await this.client.createFile(docPath, apiDoc);
    }
  }

  private async generateApiDocumentation(): Promise<string> {
    return `# API Documentation

## Overview
REST API endpoints for the Viral Hashtag & Image AI system.

## Authentication
All endpoints require authentication via Supabase Auth.

## Endpoints

### User Management
\`\`\`
GET /api/user/profile
POST /api/user/update
DELETE /api/user/delete
\`\`\`

### Content Generation
\`\`\`
POST /api/content/generate
GET /api/content/history
PUT /api/content/update/:id
DELETE /api/content/delete/:id
\`\`\`

### Hashtag Analysis
\`\`\`
POST /api/hashtags/analyze
GET /api/hashtags/trending
GET /api/hashtags/suggestions
\`\`\`

### Agent System
\`\`\`
GET /api/agents/status
POST /api/agents/video/process
POST /api/agents/audio/process
POST /api/agents/mixer/start
\`\`\`

## Error Handling
All endpoints return standardized error responses:

\`\`\`json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": {}
  }
}
\`\`\`

## Rate Limiting
- 100 requests per minute for authenticated users
- 10 requests per minute for unauthenticated users

---
*Last updated: ${new Date().toISOString()}*
*Auto-generated API documentation*
`;
  }

  private async syncObsidianToProject(): Promise<void> {
    // Check for changes in Obsidian vault
    const files = await this.client.listFiles(this.config.documentationPath);

    for (const file of files) {
      if (file.extension === 'md') {
        await this.checkForObsidianChanges(file);
      }
    }
  }

  private async checkForObsidianChanges(file: any): Promise<void> {
    const lastModified = this.watchedFiles.get(file.path);

    if (!lastModified || file.stat.mtime > lastModified) {
      this.watchedFiles.set(file.path, file.stat.mtime);

      if (lastModified) {
        // File was modified in Obsidian
        const change: DocumentationChange = {
          type: 'update',
          path: file.path,
          content: file.content,
          timestamp: new Date(file.stat.mtime),
          source: 'obsidian',
        };

        this.emit('documentationChanged', change);
        await this.handleObsidianChange(change);
      }
    }
  }

  private async handleObsidianChange(change: DocumentationChange): Promise<void> {
    // Handle changes made in Obsidian that should be synced back to project
    // This could include updating README files, component documentation, etc.

    if (change.path.includes('/api/') && change.content) {
      // API documentation changed, might need to update OpenAPI spec
      this.emit('apiDocumentationChanged', change);
    }

    if (change.path.includes('/components/') && change.content) {
      // Component documentation changed
      this.emit('componentDocumentationChanged', change);
    }

    if (change.path.includes('/agents/') && change.content) {
      // Agent documentation changed
      this.emit('agentDocumentationChanged', change);
    }
  }

  async getSyncStatus(): Promise<SyncStatus> {
    return this.client.getSyncStatus();
  }

  async forceSyncFile(filePath: string): Promise<void> {
    const projectPath = path.join(process.cwd(), filePath);
    const obsidianPath = path.join(this.config.documentationPath, path.basename(filePath));

    try {
      const content = await fs.readFile(projectPath, 'utf-8');
      await this.client.updateFile(obsidianPath, content);
      this.emit('fileForceSynced', { projectPath, obsidianPath });
    } catch (error) {
      this.emit('syncError', error);
      throw error;
    }
  }
}