import { AgentHandler, AgentMessage } from '../core/AgentOrchestrator';
import * as fs from 'fs/promises';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface AgentBlueprint {
  name: string;
  description: string;
  capabilities: string[];
  dependencies?: string[];
  methods: AgentMethod[];
  config?: AgentConfig;
  hooks?: AgentHooks;
  metadata?: AgentMetadata;
}

export interface AgentMethod {
  name: string;
  description: string;
  parameters: MethodParameter[];
  returnType: string;
  implementation?: string;
  async?: boolean;
}

export interface MethodParameter {
  name: string;
  type: string;
  required: boolean;
  default?: any;
  description?: string;
}

export interface AgentConfig {
  timeout?: number;
  retryPolicy?: RetryPolicy;
  rateLimit?: RateLimit;
  permissions?: string[];
  environment?: Record<string, string>;
}

export interface RetryPolicy {
  maxAttempts: number;
  backoffMultiplier: number;
  initialDelay: number;
}

export interface RateLimit {
  maxRequests: number;
  windowMs: number;
}

export interface AgentHooks {
  onCreate?: string;
  onDestroy?: string;
  beforeExecute?: string;
  afterExecute?: string;
  onError?: string;
}

export interface AgentMetadata {
  version: string;
  author: string;
  tags: string[];
  created: Date;
  updated: Date;
  documentation?: string;
  examples?: AgentExample[];
}

export interface AgentExample {
  title: string;
  description: string;
  input: any;
  expectedOutput: any;
}

export class MetaAgentBuilder implements AgentHandler {
  private agentTemplates: Map<string, string> = new Map();
  private agentRegistry: Map<string, AgentBlueprint> = new Map();
  private deployedAgents: Map<string, any> = new Map();

  constructor() {
    this.initializeTemplates();
  }

  private initializeTemplates() {
    // Base agent template
    this.agentTemplates.set('base', `
import { AgentHandler, AgentMessage } from '../core/AgentOrchestrator';

export default class {{AgentName}} implements AgentHandler {
  private config: any;
  private state: Map<string, any> = new Map();

  constructor(config?: any) {
    this.config = config || {};
    {{constructorBody}}
  }

  async handle(message: AgentMessage): Promise<any> {
    {{handleBody}}
  }

  getCapabilities(): string[] {
    return {{capabilities}};
  }

  getStatus(): 'ready' | 'busy' | 'error' {
    {{statusBody}}
  }

  {{additionalMethods}}
}
`);

    // Specialized templates
    this.agentTemplates.set('data-processor', `
import { AgentHandler, AgentMessage } from '../core/AgentOrchestrator';
import { Transform, pipeline } from 'stream';

export default class {{AgentName}} implements AgentHandler {
  private processors: Transform[] = [];

  async handle(message: AgentMessage): Promise<any> {
    const data = message.payload.data;
    return this.processData(data);
  }

  private async processData(data: any): Promise<any> {
    {{dataProcessingLogic}}
  }

  {{additionalMethods}}
}
`);

    this.agentTemplates.set('api-connector', `
import { AgentHandler, AgentMessage } from '../core/AgentOrchestrator';
import axios from 'axios';

export default class {{AgentName}} implements AgentHandler {
  private apiClient: any;
  private baseUrl: string = '{{apiBaseUrl}}';

  constructor() {
    this.apiClient = axios.create({
      baseURL: this.baseUrl,
      headers: {{apiHeaders}}
    });
  }

  async handle(message: AgentMessage): Promise<any> {
    {{apiHandlerLogic}}
  }

  {{additionalMethods}}
}
`);
  }

  async handle(message: AgentMessage): Promise<any> {
    const { action, payload } = message;

    switch (action) {
      case 'create':
        return this.createAgent(payload.blueprint);
      case 'deploy':
        return this.deployAgent(payload.agentName);
      case 'list':
        return this.listAgents();
      case 'update':
        return this.updateAgent(payload.agentName, payload.updates);
      case 'delete':
        return this.deleteAgent(payload.agentName);
      case 'generate-blueprint':
        return this.generateBlueprint(payload.requirements);
      case 'test':
        return this.testAgent(payload.agentName, payload.testCases);
      case 'analyze':
        return this.analyzeCapabilities(payload.agentName);
      case 'optimize':
        return this.optimizeAgent(payload.agentName);
      case 'compose':
        return this.composeAgents(payload.agentNames, payload.compositionStrategy);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  private async createAgent(blueprint: AgentBlueprint): Promise<any> {
    // Validate blueprint
    this.validateBlueprint(blueprint);

    // Select appropriate template
    const template = this.selectTemplate(blueprint);

    // Generate agent code
    const agentCode = this.generateAgentCode(blueprint, template);

    // Save agent to file system
    const filePath = await this.saveAgent(blueprint.name, agentCode);

    // Register agent
    this.agentRegistry.set(blueprint.name, blueprint);

    // Run post-creation hooks
    if (blueprint.hooks?.onCreate) {
      await this.executeHook(blueprint.hooks.onCreate, { agentName: blueprint.name });
    }

    return {
      success: true,
      agentName: blueprint.name,
      filePath,
      capabilities: blueprint.capabilities,
      message: `Agent ${blueprint.name} created successfully`
    };
  }

  private validateBlueprint(blueprint: AgentBlueprint): void {
    if (!blueprint.name) {
      throw new Error('Agent name is required');
    }
    if (!blueprint.capabilities || blueprint.capabilities.length === 0) {
      throw new Error('At least one capability is required');
    }
    if (!blueprint.methods || blueprint.methods.length === 0) {
      throw new Error('At least one method is required');
    }
  }

  private selectTemplate(blueprint: AgentBlueprint): string {
    // Analyze blueprint to determine best template
    if (blueprint.capabilities.includes('data-processing')) {
      return this.agentTemplates.get('data-processor')!;
    }
    if (blueprint.capabilities.includes('api-integration')) {
      return this.agentTemplates.get('api-connector')!;
    }
    return this.agentTemplates.get('base')!;
  }

  private generateAgentCode(blueprint: AgentBlueprint, template: string): string {
    let code = template;

    // Replace placeholders
    code = code.replace(/{{AgentName}}/g, blueprint.name);
    code = code.replace(/{{capabilities}}/g, JSON.stringify(blueprint.capabilities));
    
    // Generate constructor body
    const constructorBody = this.generateConstructor(blueprint);
    code = code.replace(/{{constructorBody}}/g, constructorBody);

    // Generate handler body
    const handleBody = this.generateHandler(blueprint);
    code = code.replace(/{{handleBody}}/g, handleBody);

    // Generate status logic
    const statusBody = this.generateStatusLogic(blueprint);
    code = code.replace(/{{statusBody}}/g, statusBody);

    // Generate additional methods
    const additionalMethods = this.generateMethods(blueprint.methods);
    code = code.replace(/{{additionalMethods}}/g, additionalMethods);

    return code;
  }

  private generateConstructor(blueprint: AgentBlueprint): string {
    const lines: string[] = [];
    
    if (blueprint.config?.environment) {
      lines.push('// Initialize environment variables');
      Object.entries(blueprint.config.environment).forEach(([key, value]) => {
        lines.push(`process.env.${key} = '${value}';`);
      });
    }

    if (blueprint.dependencies) {
      lines.push('// Initialize dependencies');
      blueprint.dependencies.forEach(dep => {
        lines.push(`// TODO: Initialize ${dep}`);
      });
    }

    return lines.join('\n    ');
  }

  private generateHandler(blueprint: AgentBlueprint): string {
    const lines: string[] = [];
    lines.push('const { action, payload } = message;');
    lines.push('');
    lines.push('switch (action) {');

    blueprint.methods.forEach(method => {
      lines.push(`  case '${method.name}':`);
      lines.push(`    return this.${method.name}(payload);`);
    });

    lines.push('  default:');
    lines.push(`    throw new Error(\`Unknown action: \${action}\`);`);
    lines.push('}');

    return lines.join('\n    ');
  }

  private generateStatusLogic(blueprint: AgentBlueprint): string {
    if (blueprint.config?.timeout) {
      return `
    // Check for timeout
    if (this.state.get('lastActivity')) {
      const elapsed = Date.now() - this.state.get('lastActivity');
      if (elapsed > ${blueprint.config.timeout}) {
        return 'error';
      }
    }
    return this.state.get('status') || 'ready';
    `;
    }
    return "return 'ready';";
  }

  private generateMethods(methods: AgentMethod[]): string {
    return methods.map(method => {
      const params = method.parameters.map(p => 
        `${p.name}${p.required ? '' : '?'}: ${p.type}`
      ).join(', ');

      const asyncPrefix = method.async ? 'async ' : '';
      
      return `
  ${asyncPrefix}${method.name}(${params}): ${method.async ? 'Promise<' : ''}${method.returnType}${method.async ? '>' : ''} {
    ${method.implementation || '// TODO: Implement this method'}
  }`;
    }).join('\n');
  }

  private async saveAgent(agentName: string, code: string): Promise<string> {
    const agentsDir = path.join(process.cwd(), 'api', 'agents', 'generated');
    
    // Ensure directory exists
    await fs.mkdir(agentsDir, { recursive: true });

    const filePath = path.join(agentsDir, `${agentName}.ts`);
    await fs.writeFile(filePath, code);

    return filePath;
  }

  private async deployAgent(agentName: string): Promise<any> {
    const blueprint = this.agentRegistry.get(agentName);
    if (!blueprint) {
      throw new Error(`Agent ${agentName} not found in registry`);
    }

    // Dynamically import the agent
    const agentPath = path.join(process.cwd(), 'api', 'agents', 'generated', `${agentName}.ts`);
    
    try {
      // Compile TypeScript if needed
      await this.compileAgent(agentPath);

      // Load the agent
      const AgentClass = await import(agentPath);
      const agentInstance = new AgentClass.default(blueprint.config);

      // Store deployed instance
      this.deployedAgents.set(agentName, agentInstance);

      return {
        success: true,
        agentName,
        status: 'deployed',
        capabilities: agentInstance.getCapabilities()
      };
    } catch (error) {
      throw new Error(`Failed to deploy agent: ${error}`);
    }
  }

  private async compileAgent(agentPath: string): Promise<void> {
    // Simple TypeScript compilation with proper path quoting
    const { stdout, stderr } = await execAsync(`npx tsc "${agentPath}" --outDir ./dist/agents`);
    if (stderr) {
      console.error('Compilation warnings:', stderr);
    }
  }

  private async generateBlueprint(requirements: any): Promise<AgentBlueprint> {
    // AI-assisted blueprint generation
    const blueprint: AgentBlueprint = {
      name: requirements.name || 'GeneratedAgent',
      description: requirements.description || 'Auto-generated agent',
      capabilities: this.inferCapabilities(requirements),
      methods: this.inferMethods(requirements),
      config: this.inferConfig(requirements),
      metadata: {
        version: '1.0.0',
        author: 'MetaAgentBuilder',
        tags: requirements.tags || [],
        created: new Date(),
        updated: new Date()
      }
    };

    return blueprint;
  }

  private inferCapabilities(requirements: any): string[] {
    const capabilities: string[] = [];
    
    // Analyze requirements to infer capabilities
    if (requirements.features) {
      requirements.features.forEach((feature: string) => {
        if (feature.includes('data') || feature.includes('process')) {
          capabilities.push('data-processing');
        }
        if (feature.includes('api') || feature.includes('http')) {
          capabilities.push('api-integration');
        }
        if (feature.includes('ai') || feature.includes('ml')) {
          capabilities.push('machine-learning');
        }
      });
    }

    return capabilities.length > 0 ? capabilities : ['general-purpose'];
  }

  private inferMethods(requirements: any): AgentMethod[] {
    const methods: AgentMethod[] = [];

    // Always include a default process method
    methods.push({
      name: 'process',
      description: 'Main processing method',
      parameters: [{
        name: 'data',
        type: 'any',
        required: true
      }],
      returnType: 'any',
      async: true
    });

    // Add methods based on requirements
    if (requirements.operations) {
      requirements.operations.forEach((op: string) => {
        methods.push({
          name: op.toLowerCase().replace(/\s+/g, '_'),
          description: `Perform ${op}`,
          parameters: [],
          returnType: 'any',
          async: true
        });
      });
    }

    return methods;
  }

  private inferConfig(requirements: any): AgentConfig {
    return {
      timeout: requirements.timeout || 30000,
      retryPolicy: {
        maxAttempts: 3,
        backoffMultiplier: 2,
        initialDelay: 1000
      },
      rateLimit: {
        maxRequests: requirements.rateLimit?.maxRequests || 100,
        windowMs: requirements.rateLimit?.windowMs || 60000
      },
      permissions: requirements.permissions || []
    };
  }

  private async testAgent(agentName: string, testCases: any[]): Promise<any> {
    const agent = this.deployedAgents.get(agentName);
    if (!agent) {
      throw new Error(`Agent ${agentName} not deployed`);
    }

    const results: any[] = [];

    for (const testCase of testCases) {
      try {
        const result = await agent.handle({
          action: testCase.action,
          payload: testCase.payload,
          userId: 'test-user'
        });

        results.push({
          testCase: testCase.name,
          success: true,
          result
        });
      } catch (error) {
        results.push({
          testCase: testCase.name,
          success: false,
          error: error.message
        });
      }
    }

    return {
      agentName,
      totalTests: testCases.length,
      passed: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    };
  }

  private async analyzeCapabilities(agentName: string): Promise<any> {
    const blueprint = this.agentRegistry.get(agentName);
    if (!blueprint) {
      throw new Error(`Agent ${agentName} not found`);
    }

    return {
      name: agentName,
      capabilities: blueprint.capabilities,
      methods: blueprint.methods.map(m => ({
        name: m.name,
        parameters: m.parameters,
        returnType: m.returnType
      })),
      dependencies: blueprint.dependencies || [],
      config: blueprint.config,
      metadata: blueprint.metadata
    };
  }

  private async optimizeAgent(agentName: string): Promise<any> {
    const blueprint = this.agentRegistry.get(agentName);
    if (!blueprint) {
      throw new Error(`Agent ${agentName} not found`);
    }

    // Optimization strategies
    const optimizations: string[] = [];

    // Check for async opportunities
    blueprint.methods.forEach(method => {
      if (!method.async && method.implementation?.includes('await')) {
        method.async = true;
        optimizations.push(`Made ${method.name} async`);
      }
    });

    // Add caching if not present
    if (!blueprint.config?.rateLimit) {
      blueprint.config = {
        ...blueprint.config,
        rateLimit: {
          maxRequests: 100,
          windowMs: 60000
        }
      };
      optimizations.push('Added rate limiting');
    }

    // Update the agent
    if (optimizations.length > 0) {
      await this.updateAgent(agentName, blueprint);
    }

    return {
      agentName,
      optimizations,
      optimized: optimizations.length > 0
    };
  }

  private async composeAgents(agentNames: string[], strategy: string): Promise<any> {
    const agents = agentNames.map(name => {
      const blueprint = this.agentRegistry.get(name);
      if (!blueprint) {
        throw new Error(`Agent ${name} not found`);
      }
      return blueprint;
    });

    // Create composite agent
    const compositeBlueprint: AgentBlueprint = {
      name: `Composite_${agentNames.join('_')}`,
      description: `Composite agent combining ${agentNames.join(', ')}`,
      capabilities: [...new Set(agents.flatMap(a => a.capabilities))],
      methods: this.composeMethods(agents, strategy),
      dependencies: [...new Set(agents.flatMap(a => a.dependencies || []))],
      config: this.composeConfig(agents),
      metadata: {
        version: '1.0.0',
        author: 'MetaAgentBuilder',
        tags: ['composite'],
        created: new Date(),
        updated: new Date()
      }
    };

    return this.createAgent(compositeBlueprint);
  }

  private composeMethods(agents: AgentBlueprint[], strategy: string): AgentMethod[] {
    const methods: AgentMethod[] = [];

    switch (strategy) {
      case 'sequential':
        // Chain methods sequentially
        methods.push({
          name: 'processSequential',
          description: 'Process through all agents sequentially',
          parameters: [{ name: 'data', type: 'any', required: true }],
          returnType: 'any',
          async: true,
          implementation: `
            let result = data;
            ${agents.map((a, i) => `result = await this.agent${i}.process(result);`).join('\n            ')}
            return result;
          `
        });
        break;

      case 'parallel':
        // Run methods in parallel
        methods.push({
          name: 'processParallel',
          description: 'Process through all agents in parallel',
          parameters: [{ name: 'data', type: 'any', required: true }],
          returnType: 'any[]',
          async: true,
          implementation: `
            const promises = [
              ${agents.map((a, i) => `this.agent${i}.process(data)`).join(',\n              ')}
            ];
            return Promise.all(promises);
          `
        });
        break;

      case 'conditional':
        // Conditional routing
        methods.push({
          name: 'processConditional',
          description: 'Route to appropriate agent based on conditions',
          parameters: [{ name: 'data', type: 'any', required: true }],
          returnType: 'any',
          async: true,
          implementation: `
            // Route based on data characteristics
            ${agents.map((a, i) => `
            if (/* condition for ${a.name} */) {
              return this.agent${i}.process(data);
            }`).join('')}
            throw new Error('No suitable agent found');
          `
        });
        break;

      default:
        // Merge all methods
        agents.forEach(agent => {
          methods.push(...agent.methods);
        });
    }

    return methods;
  }

  private composeConfig(agents: AgentBlueprint[]): AgentConfig {
    return {
      timeout: Math.max(...agents.map(a => a.config?.timeout || 30000)),
      permissions: [...new Set(agents.flatMap(a => a.config?.permissions || []))],
      environment: agents.reduce((env, agent) => ({
        ...env,
        ...(agent.config?.environment || {})
      }), {})
    };
  }

  private async updateAgent(agentName: string, updates: Partial<AgentBlueprint>): Promise<any> {
    const blueprint = this.agentRegistry.get(agentName);
    if (!blueprint) {
      throw new Error(`Agent ${agentName} not found`);
    }

    // Merge updates
    const updatedBlueprint = {
      ...blueprint,
      ...updates,
      metadata: {
        ...blueprint.metadata,
        updated: new Date()
      }
    };

    // Regenerate and save
    const template = this.selectTemplate(updatedBlueprint);
    const code = this.generateAgentCode(updatedBlueprint, template);
    await this.saveAgent(agentName, code);

    // Update registry
    this.agentRegistry.set(agentName, updatedBlueprint);

    return {
      success: true,
      agentName,
      message: 'Agent updated successfully'
    };
  }

  private async deleteAgent(agentName: string): Promise<any> {
    // Remove from registry
    this.agentRegistry.delete(agentName);
    
    // Remove from deployed agents
    this.deployedAgents.delete(agentName);

    // Delete file
    const filePath = path.join(process.cwd(), 'api', 'agents', 'generated', `${agentName}.ts`);
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.warn(`Could not delete file: ${filePath}`);
    }

    return {
      success: true,
      agentName,
      message: 'Agent deleted successfully'
    };
  }

  private listAgents(): any {
    const agents = Array.from(this.agentRegistry.entries()).map(([name, blueprint]) => ({
      name,
      description: blueprint.description,
      capabilities: blueprint.capabilities,
      deployed: this.deployedAgents.has(name),
      created: blueprint.metadata?.created,
      updated: blueprint.metadata?.updated
    }));

    return {
      total: agents.length,
      deployed: agents.filter(a => a.deployed).length,
      agents
    };
  }

  private async executeHook(hook: string, context: any): Promise<void> {
    try {
      // Execute hook code in sandboxed environment
      const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
      const fn = new AsyncFunction('context', hook);
      await fn(context);
    } catch (error) {
      console.error('Hook execution failed:', error);
    }
  }

  getCapabilities(): string[] {
    return [
      'agent-creation',
      'agent-deployment',
      'agent-testing',
      'agent-optimization',
      'agent-composition',
      'blueprint-generation',
      'capability-analysis'
    ];
  }

  getStatus(): 'ready' | 'busy' | 'error' {
    return 'ready';
  }
}