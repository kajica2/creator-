/**
 * Obsidian Integration System
 * Automatically syncs project knowledge with Obsidian vault
 * Creates a growing library of interconnected notes
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { EventEmitter } from 'events';
import { createHash } from 'crypto';

export interface ObsidianNote {
  title: string;
  content: string;
  tags: string[];
  aliases?: string[];
  frontmatter?: Record<string, any>;
  links?: string[];
  backlinks?: string[];
  created?: Date;
  modified?: Date;
  type?: NoteType;
  category?: string;
  project?: string;
}

export type NoteType =
  | 'project'
  | 'component'
  | 'api'
  | 'agent'
  | 'documentation'
  | 'idea'
  | 'todo'
  | 'reference'
  | 'snippet'
  | 'meeting'
  | 'research'
  | 'architecture';

export interface VaultConfig {
  vaultPath: string;
  projectName: string;
  autoSync: boolean;
  syncInterval?: number;
  templates?: Map<NoteType, string>;
  folders?: VaultFolders;
  plugins?: ObsidianPlugin[];
}

export interface VaultFolders {
  projects: string;
  components: string;
  apis: string;
  agents: string;
  documentation: string;
  ideas: string;
  dailyNotes: string;
  templates: string;
  archive: string;
  media: string;
}

export interface ObsidianPlugin {
  name: string;
  enabled: boolean;
  config?: Record<string, any>;
}

export interface KnowledgeGraph {
  nodes: Map<string, KnowledgeNode>;
  edges: Map<string, KnowledgeEdge[]>;
  clusters: Map<string, string[]>;
  metrics: GraphMetrics;
}

export interface KnowledgeNode {
  id: string;
  title: string;
  type: NoteType;
  importance: number;
  connections: number;
  content?: string;
  metadata?: Record<string, any>;
}

export interface KnowledgeEdge {
  source: string;
  target: string;
  weight: number;
  type: 'link' | 'reference' | 'tag' | 'mention';
}

export interface GraphMetrics {
  totalNodes: number;
  totalEdges: number;
  averageConnections: number;
  centralNodes: string[];
  orphanNodes: string[];
  clusters: number;
}

export class ObsidianIntegration extends EventEmitter {
  private config: VaultConfig;
  private knowledgeGraph: KnowledgeGraph;
  private syncTimer?: NodeJS.Timeout;
  private fileWatcher?: any;
  private noteCache: Map<string, ObsidianNote>;
  private changeQueue: Set<string>;

  constructor(config: VaultConfig) {
    super();
    this.config = this.initializeConfig(config);
    this.knowledgeGraph = this.createEmptyGraph();
    this.noteCache = new Map();
    this.changeQueue = new Set();

    if (config.autoSync) {
      this.startAutoSync();
    }
  }

  private initializeConfig(config: VaultConfig): VaultConfig {
    const defaultFolders: VaultFolders = {
      projects: 'Projects',
      components: 'Components',
      apis: 'APIs',
      agents: 'Agents',
      documentation: 'Documentation',
      ideas: 'Ideas',
      dailyNotes: 'Daily Notes',
      templates: 'Templates',
      archive: 'Archive',
      media: 'Media',
    };

    return {
      ...config,
      folders: { ...defaultFolders, ...config.folders },
      syncInterval: config.syncInterval || 5000, // 5 seconds default
      templates: config.templates || this.getDefaultTemplates(),
    };
  }

  private getDefaultTemplates(): Map<NoteType, string> {
    const templates = new Map<NoteType, string>();

    templates.set('project', `---
title: {{title}}
type: project
created: {{date}}
tags: [project, {{projectName}}]
status: active
---

# {{title}}

## Overview
{{description}}

## Goals
- [ ]

## Architecture
\`\`\`mermaid
graph TD
    A[Start] --> B[Process]
    B --> C[End]
\`\`\`

## Components
- [[Component Name]]

## APIs
- [[API Name]]

## Progress
- [ ] Phase 1: Planning
- [ ] Phase 2: Development
- [ ] Phase 3: Testing
- [ ] Phase 4: Deployment

## Notes
`);

    templates.set('component', `---
title: {{title}}
type: component
created: {{date}}
tags: [component, {{projectName}}]
project: [[{{project}}]]
---

# {{title}}

## Purpose
{{purpose}}

## Props
\`\`\`typescript
interface {{title}}Props {
  // Define props here
}
\`\`\`

## Implementation
\`\`\`typescript
{{code}}
\`\`\`

## Usage Example
\`\`\`tsx
<{{title}} />
\`\`\`

## Dependencies
-

## Related Components
- [[RelatedComponent]]

## Testing
- [ ] Unit tests
- [ ] Integration tests
- [ ] Visual tests
`);

    templates.set('agent', `---
title: {{title}}
type: agent
created: {{date}}
tags: [agent, ai, {{projectName}}]
capabilities: []
---

# {{title}}

## Overview
{{description}}

## Capabilities
- {{capabilities}}

## Input/Output
### Input
\`\`\`typescript
interface {{title}}Input {
  // Define input
}
\`\`\`

### Output
\`\`\`typescript
interface {{title}}Output {
  // Define output
}
\`\`\`

## Pipeline Integration
\`\`\`mermaid
graph LR
    Input --> {{title}}
    {{title}} --> Output
\`\`\`

## Configuration
\`\`\`json
{
  "agent": "{{title}}",
  "config": {}
}
\`\`\`

## Examples
### Example 1
\`\`\`typescript
{{example}}
\`\`\`

## Performance Metrics
- Response Time:
- Accuracy:
- Resource Usage:
`);

    templates.set('api', `---
title: {{title}}
type: api
created: {{date}}
tags: [api, {{projectName}}]
version: 1.0.0
---

# {{title}}

## Endpoint
\`\`\`
{{method}} {{endpoint}}
\`\`\`

## Authentication
{{auth}}

## Request
### Headers
\`\`\`json
{
  "Content-Type": "application/json"
}
\`\`\`

### Body
\`\`\`json
{{requestBody}}
\`\`\`

## Response
### Success (200)
\`\`\`json
{{responseBody}}
\`\`\`

### Error Codes
- 400: Bad Request
- 401: Unauthorized
- 404: Not Found
- 500: Internal Server Error

## Examples
### cURL
\`\`\`bash
curl -X {{method}} {{endpoint}} \\
  -H "Content-Type: application/json" \\
  -d '{{requestBody}}'
\`\`\`

## Related
- [[Related API]]
- [[Component Using This API]]
`);

    return templates;
  }

  private createEmptyGraph(): KnowledgeGraph {
    return {
      nodes: new Map(),
      edges: new Map(),
      clusters: new Map(),
      metrics: {
        totalNodes: 0,
        totalEdges: 0,
        averageConnections: 0,
        centralNodes: [],
        orphanNodes: [],
        clusters: 0,
      },
    };
  }

  // Initialize vault structure
  async initializeVault(): Promise<void> {
    const vaultPath = this.config.vaultPath;
    const projectFolder = path.join(vaultPath, this.config.folders!.projects, this.config.projectName);

    // Create folder structure
    for (const [key, folder] of Object.entries(this.config.folders!)) {
      const folderPath = path.join(projectFolder, folder);
      await this.ensureDirectory(folderPath);
    }

    // Create index note
    const indexNote: ObsidianNote = {
      title: `${this.config.projectName} Index`,
      content: this.generateIndexContent(),
      tags: ['index', 'project', this.config.projectName],
      type: 'project',
      created: new Date(),
    };

    await this.createNote(indexNote, projectFolder);

    // Create MOC (Map of Content)
    await this.createMOC();

    this.emit('vault:initialized', { projectFolder });
  }

  private generateIndexContent(): string {
    return `# ${this.config.projectName}

## Quick Links
- [[${this.config.projectName} MOC|Map of Content]]
- [[${this.config.projectName} Architecture]]
- [[${this.config.projectName} API Documentation]]
- [[${this.config.projectName} Components]]

## Project Structure
\`\`\`
${this.config.projectName}/
├── Projects/
├── Components/
├── APIs/
├── Agents/
├── Documentation/
├── Ideas/
├── Daily Notes/
└── Archive/
\`\`\`

## Recent Updates
\`\`\`dataview
TABLE date(file.mtime) AS "Modified"
FROM "Projects/${this.config.projectName}"
SORT file.mtime DESC
LIMIT 10
\`\`\`

## Statistics
\`\`\`dataview
TABLE length(file.inlinks) AS "Backlinks", length(file.outlinks) AS "Outlinks"
FROM "Projects/${this.config.projectName}"
WHERE file.name != this.file.name
SORT length(file.inlinks) DESC
\`\`\`
`;
  }

  async createMOC(): Promise<void> {
    const mocContent = `# ${this.config.projectName} Map of Content

## 🏗️ Architecture
- [[System Architecture]]
- [[Component Hierarchy]]
- [[Data Flow]]
- [[API Structure]]

## 🤖 Agents
\`\`\`dataview
LIST
FROM "Projects/${this.config.projectName}/Agents"
SORT file.name
\`\`\`

## 🧩 Components
\`\`\`dataview
TABLE type as "Type", file.mtime as "Modified"
FROM "Projects/${this.config.projectName}/Components"
SORT file.name
\`\`\`

## 🔌 APIs
\`\`\`dataview
TABLE version as "Version", method as "Method"
FROM "Projects/${this.config.projectName}/APIs"
SORT file.name
\`\`\`

## 📝 Documentation
\`\`\`dataview
LIST
FROM "Projects/${this.config.projectName}/Documentation"
WHERE !contains(file.path, "Archive")
SORT file.mtime DESC
\`\`\`

## 💡 Ideas & TODOs
\`\`\`dataview
TASK
FROM "Projects/${this.config.projectName}"
WHERE !completed
SORT file.mtime DESC
\`\`\`

## 📊 Project Metrics
- Total Notes: \`$= dv.pages('"Projects/${this.config.projectName}"').length\`
- Components: \`$= dv.pages('"Projects/${this.config.projectName}/Components"').length\`
- APIs: \`$= dv.pages('"Projects/${this.config.projectName}/APIs"').length\`
- Agents: \`$= dv.pages('"Projects/${this.config.projectName}/Agents"').length\`
`;

    const mocNote: ObsidianNote = {
      title: `${this.config.projectName} MOC`,
      content: mocContent,
      tags: ['moc', 'index', this.config.projectName],
      type: 'documentation',
    };

    const projectFolder = path.join(this.config.vaultPath, this.config.folders!.projects, this.config.projectName);
    await this.createNote(mocNote, projectFolder);
  }

  // Create or update a note
  async createNote(note: ObsidianNote, folder?: string): Promise<void> {
    const targetFolder = folder || this.getDefaultFolder(note.type || 'documentation');
    const filePath = path.join(targetFolder, `${note.title}.md`);

    const frontmatter = this.generateFrontmatter(note);
    const content = `${frontmatter}\n${note.content}`;

    await fs.writeFile(filePath, content, 'utf-8');

    // Update cache and graph
    this.noteCache.set(note.title, note);
    this.updateKnowledgeGraph(note);

    this.emit('note:created', { note, path: filePath });
  }

  private generateFrontmatter(note: ObsidianNote): string {
    const frontmatter: Record<string, any> = {
      title: note.title,
      created: note.created || new Date().toISOString(),
      modified: new Date().toISOString(),
      type: note.type || 'documentation',
      tags: note.tags,
      ...note.frontmatter,
    };

    if (note.aliases && note.aliases.length > 0) {
      frontmatter.aliases = note.aliases;
    }

    const yamlContent = Object.entries(frontmatter)
      .map(([key, value]) => {
        if (Array.isArray(value)) {
          return `${key}: [${value.join(', ')}]`;
        }
        return `${key}: ${value}`;
      })
      .join('\n');

    return `---\n${yamlContent}\n---`;
  }

  private getDefaultFolder(type: NoteType): string {
    const projectBase = path.join(this.config.vaultPath, this.config.folders!.projects, this.config.projectName);

    const folderMap: Record<NoteType, string> = {
      project: this.config.folders!.projects,
      component: this.config.folders!.components,
      api: this.config.folders!.apis,
      agent: this.config.folders!.agents,
      documentation: this.config.folders!.documentation,
      idea: this.config.folders!.ideas,
      todo: this.config.folders!.ideas,
      reference: this.config.folders!.documentation,
      snippet: this.config.folders!.documentation,
      meeting: this.config.folders!.dailyNotes,
      research: this.config.folders!.documentation,
      architecture: this.config.folders!.documentation,
    };

    return path.join(projectBase, folderMap[type] || this.config.folders!.documentation);
  }

  // Sync project components to Obsidian
  async syncProjectComponents(componentsPath: string): Promise<void> {
    const files = await this.getFilesRecursively(componentsPath);

    for (const file of files) {
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        await this.createComponentNote(file);
      }
    }

    this.emit('sync:complete', { count: files.length });
  }

  private async createComponentNote(filePath: string): Promise<void> {
    const content = await fs.readFile(filePath, 'utf-8');
    const componentName = path.basename(filePath, path.extname(filePath));

    // Extract component documentation
    const { description, props, examples } = this.extractComponentInfo(content);

    const note: ObsidianNote = {
      title: componentName,
      content: this.generateComponentNoteContent(componentName, content, description, props, examples),
      tags: ['component', this.config.projectName, 'react'],
      type: 'component',
      links: this.extractImports(content),
    };

    await this.createNote(note);
  }

  private extractComponentInfo(content: string): any {
    // Extract JSDoc comments
    const descriptionMatch = content.match(/\/\*\*\s*\n([^*]|\*(?!\/))*\*\//);
    const description = descriptionMatch ? descriptionMatch[0] : '';

    // Extract interface props
    const propsMatch = content.match(/interface\s+\w+Props\s*{[^}]*}/);
    const props = propsMatch ? propsMatch[0] : '';

    // Extract usage examples from comments
    const exampleMatch = content.match(/\/\/\s*@example[\s\S]*?(?=\/\/|$)/);
    const examples = exampleMatch ? exampleMatch[0] : '';

    return { description, props, examples };
  }

  private generateComponentNoteContent(name: string, code: string, description: string, props: string, examples: string): string {
    return `# ${name}

## Description
${description || 'No description available'}

## Props
\`\`\`typescript
${props || '// No props defined'}
\`\`\`

## Implementation
\`\`\`typescript
${code.substring(0, 1000)}... // Truncated for brevity
\`\`\`

## Usage Examples
${examples || 'No examples available'}

## File Location
\`${name}.tsx\`

## Dependencies
${this.extractImports(code).map(imp => `- [[${imp}]]`).join('\n')}

## Related Components
<!-- Add related components here -->

## Notes
<!-- Add implementation notes here -->
`;
  }

  private extractImports(content: string): string[] {
    const imports: string[] = [];
    const importRegex = /import\s+.*?\s+from\s+['"](.+?)['"]/g;
    let match;

    while ((match = importRegex.exec(content)) !== null) {
      const importPath = match[1];
      if (importPath.startsWith('./') || importPath.startsWith('../')) {
        const componentName = path.basename(importPath);
        imports.push(componentName);
      }
    }

    return imports;
  }

  // Sync API documentation
  async syncAPIs(apisPath: string): Promise<void> {
    const apiFiles = await this.getFilesRecursively(apisPath);

    for (const file of apiFiles) {
      if (file.endsWith('.ts') || file.endsWith('.js')) {
        await this.createAPINote(file);
      }
    }
  }

  private async createAPINote(filePath: string): Promise<void> {
    const content = await fs.readFile(filePath, 'utf-8');
    const apiName = path.basename(filePath, path.extname(filePath));

    const note: ObsidianNote = {
      title: `API - ${apiName}`,
      content: this.generateAPIContent(apiName, content),
      tags: ['api', this.config.projectName],
      type: 'api',
    };

    await this.createNote(note);
  }

  private generateAPIContent(name: string, content: string): string {
    // Extract endpoint information
    const endpoints = this.extractEndpoints(content);

    return `# API - ${name}

## Endpoints
${endpoints.map(ep => `- \`${ep.method} ${ep.path}\``).join('\n')}

## Implementation
\`\`\`typescript
${content.substring(0, 2000)}... // Truncated
\`\`\`

## Usage
\`\`\`bash
# Example requests
${endpoints.map(ep => `curl -X ${ep.method} http://localhost:3000${ep.path}`).join('\n')}
\`\`\`

## Related
- [[API Documentation]]
- [[${this.config.projectName} Architecture]]
`;
  }

  private extractEndpoints(content: string): Array<{method: string, path: string}> {
    const endpoints: Array<{method: string, path: string}> = [];

    // Match Express-style routes
    const routeRegex = /\.(get|post|put|delete|patch)\(['"]([^'"]+)['"]/g;
    let match;

    while ((match = routeRegex.exec(content)) !== null) {
      endpoints.push({
        method: match[1].toUpperCase(),
        path: match[2],
      });
    }

    return endpoints;
  }

  // Update knowledge graph
  private updateKnowledgeGraph(note: ObsidianNote): void {
    const nodeId = this.generateNodeId(note.title);

    // Add or update node
    this.knowledgeGraph.nodes.set(nodeId, {
      id: nodeId,
      title: note.title,
      type: note.type || 'documentation',
      importance: this.calculateImportance(note),
      connections: 0,
      content: note.content,
      metadata: note.frontmatter,
    });

    // Extract and add edges
    if (note.links) {
      const edges: KnowledgeEdge[] = note.links.map(link => ({
        source: nodeId,
        target: this.generateNodeId(link),
        weight: 1,
        type: 'link',
      }));

      this.knowledgeGraph.edges.set(nodeId, edges);
    }

    // Update metrics
    this.updateGraphMetrics();
  }

  private generateNodeId(title: string): string {
    return createHash('md5').update(title).digest('hex');
  }

  private calculateImportance(note: ObsidianNote): number {
    let importance = 1;

    // Type-based importance
    const typeWeights: Record<NoteType, number> = {
      project: 5,
      architecture: 4,
      api: 3,
      agent: 3,
      component: 2,
      documentation: 2,
      idea: 1,
      todo: 1,
      reference: 1,
      snippet: 1,
      meeting: 1,
      research: 2,
    };

    importance *= typeWeights[note.type || 'documentation'] || 1;

    // Tag-based importance
    if (note.tags) {
      importance += note.tags.length * 0.5;
    }

    // Link-based importance
    if (note.links) {
      importance += note.links.length * 0.3;
    }

    return Math.min(importance, 10);
  }

  private updateGraphMetrics(): void {
    const metrics = this.knowledgeGraph.metrics;

    metrics.totalNodes = this.knowledgeGraph.nodes.size;
    metrics.totalEdges = Array.from(this.knowledgeGraph.edges.values())
      .reduce((sum, edges) => sum + edges.length, 0);

    metrics.averageConnections = metrics.totalNodes > 0
      ? metrics.totalEdges / metrics.totalNodes
      : 0;

    // Find central nodes (most connected)
    const connectionCounts = new Map<string, number>();
    for (const [nodeId, edges] of this.knowledgeGraph.edges) {
      connectionCounts.set(nodeId, edges.length);
    }

    metrics.centralNodes = Array.from(connectionCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([nodeId]) => nodeId);

    // Find orphan nodes (no connections)
    metrics.orphanNodes = Array.from(this.knowledgeGraph.nodes.keys())
      .filter(nodeId => !this.knowledgeGraph.edges.has(nodeId));

    // Count clusters (simplified)
    metrics.clusters = Math.ceil(metrics.totalNodes / 10);
  }

  // Auto-sync functionality
  private startAutoSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }

    this.syncTimer = setInterval(async () => {
      await this.performSync();
    }, this.config.syncInterval);

    this.emit('sync:started');
  }

  private async performSync(): Promise<void> {
    if (this.changeQueue.size === 0) return;

    const changes = Array.from(this.changeQueue);
    this.changeQueue.clear();

    for (const change of changes) {
      await this.syncChange(change);
    }

    this.emit('sync:batch', { count: changes.length });
  }

  private async syncChange(changePath: string): Promise<void> {
    // Implement specific sync logic based on file type
    if (changePath.endsWith('.tsx') || changePath.endsWith('.ts')) {
      await this.createComponentNote(changePath);
    } else if (changePath.includes('/api/')) {
      await this.createAPINote(changePath);
    }
  }

  // Utility methods
  private async ensureDirectory(dirPath: string): Promise<void> {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  private async getFilesRecursively(dir: string): Promise<string[]> {
    const files: string[] = [];
    const items = await fs.readdir(dir, { withFileTypes: true });

    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      if (item.isDirectory()) {
        files.push(...await this.getFilesRecursively(fullPath));
      } else {
        files.push(fullPath);
      }
    }

    return files;
  }

  // Generate daily note
  async createDailyNote(): Promise<void> {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    const title = `${dateStr} - ${this.config.projectName} Daily`;

    const content = `# ${title}

## 📅 Date
${today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}

## 🎯 Goals for Today
- [ ]

## 📝 Notes
### Morning

### Afternoon

### Evening

## 💻 Code Written Today
\`\`\`dataview
LIST
FROM "Projects/${this.config.projectName}"
WHERE date(file.ctime) = date("${dateStr}")
\`\`\`

## 🔗 Links Created
\`\`\`dataview
LIST file.outlinks
FROM "Projects/${this.config.projectName}"
WHERE date(file.mtime) = date("${dateStr}")
\`\`\`

## 💡 Ideas
-

## 🐛 Issues Encountered
-

## ✅ Completed
-

## 📊 Progress
- Lines of Code:
- Components Created:
- APIs Implemented:
- Tests Written:

## 🔮 Tomorrow's Plan
- [ ]
`;

    const note: ObsidianNote = {
      title,
      content,
      tags: ['daily', this.config.projectName],
      type: 'meeting',
    };

    const dailyFolder = path.join(
      this.config.vaultPath,
      this.config.folders!.projects,
      this.config.projectName,
      this.config.folders!.dailyNotes
    );

    await this.createNote(note, dailyFolder);
  }

  // Export graph for visualization
  exportGraph(): any {
    return {
      nodes: Array.from(this.knowledgeGraph.nodes.values()),
      edges: Array.from(this.knowledgeGraph.edges.entries()).flatMap(([source, edges]) =>
        edges.map(edge => ({ ...edge, source }))
      ),
      metrics: this.knowledgeGraph.metrics,
    };
  }

  // Clean up
  async cleanup(): Promise<void> {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }

    if (this.fileWatcher) {
      this.fileWatcher.close();
    }

    this.emit('cleanup');
  }
}

export default ObsidianIntegration;