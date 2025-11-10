export interface ObsidianConfig {
  apiUrl: string;
  port: number;
  vaultName: string;
  token?: string;
  autoSync: boolean;
  syncInterval: number;
  documentationPath: string;
}

export interface ObsidianVault {
  name: string;
  path: string;
  files: ObsidianFile[];
  folders: ObsidianFolder[];
}

export interface ObsidianFile {
  path: string;
  name: string;
  content?: string;
  stat: {
    ctime: number;
    mtime: number;
    size: number;
  };
  extension: string;
}

export interface ObsidianFolder {
  path: string;
  name: string;
  children: (ObsidianFile | ObsidianFolder)[];
}

export interface ObsidianNote {
  path: string;
  content: string;
  frontmatter?: Record<string, any>;
  tags?: string[];
  links?: string[];
}

export interface DocumentationTemplate {
  type: 'component' | 'agent' | 'api' | 'schema' | 'flow';
  template: string;
  variables: Record<string, any>;
}

export interface SyncStatus {
  status: 'connected' | 'disconnected' | 'syncing' | 'error';
  lastSync: Date;
  filesChanged: number;
  errors: string[];
}

export interface AgentDocumentation {
  agentId: string;
  agentType: string;
  description: string;
  capabilities: string[];
  apis: APIEndpoint[];
  protocols: string[];
  relationships: AgentRelationship[];
}

export interface APIEndpoint {
  method: string;
  path: string;
  description: string;
  parameters: Parameter[];
  responses: Response[];
}

export interface Parameter {
  name: string;
  type: string;
  required: boolean;
  description: string;
}

export interface Response {
  status: number;
  description: string;
  schema?: any;
}

export interface AgentRelationship {
  targetAgent: string;
  relationship: 'coordinates' | 'depends' | 'manages' | 'notifies';
  description: string;
}

export interface DocumentationChange {
  type: 'create' | 'update' | 'delete';
  path: string;
  content?: string;
  timestamp: Date;
  source: 'obsidian' | 'project';
}

export interface ObsidianError extends Error {
  code: string;
  details?: any;
}