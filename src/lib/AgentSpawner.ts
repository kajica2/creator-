import { AgentBlueprint, AgentRequirements, AgentComposition } from '../types/AgentTypes';
import { MetaAgentBuilder } from '../../api/agents/MetaAgentBuilder';
import { agentRegistry } from './AgentRegistry';
import { Worker } from 'worker_threads';
import * as path from 'path';
import { EventEmitter } from 'events';

export interface SpawnOptions {
  isolated?: boolean;
  maxMemory?: number;
  timeout?: number;
  autoRestart?: boolean;
  healthCheck?: HealthCheckConfig;
  scaling?: ScalingOptions;
}

export interface HealthCheckConfig {
  enabled: boolean;
  interval: number;
  timeout: number;
  retries: number;
  endpoint?: string;
}

export interface ScalingOptions {
  enabled: boolean;
  minInstances: number;
  maxInstances: number;
  scaleUpThreshold: number;
  scaleDownThreshold: number;
  cooldownPeriod: number;
}

export interface SpawnedAgent {
  id: string;
  name: string;
  blueprint: AgentBlueprint;
  instance?: any;
  worker?: Worker;
  status: 'spawning' | 'running' | 'stopped' | 'error' | 'scaling';
  pid?: number;
  memoryUsage?: number;
  cpuUsage?: number;
  startTime: Date;
  lastHealthCheck?: Date;
  restartCount: number;
  requestCount: number;
  errorCount: number;
}

export class AgentSpawner extends EventEmitter {
  private metaBuilder: MetaAgentBuilder;
  private spawnedAgents = new Map<string, SpawnedAgent>();
  private workerPool = new Map<string, Worker>();
  private healthCheckIntervals = new Map<string, NodeJS.Timeout>();
  private scalingIntervals = new Map<string, NodeJS.Timeout>();
  private loadBalancer = new AgentLoadBalancer();

  constructor() {
    super();
    this.metaBuilder = new MetaAgentBuilder();
    this.setupCleanupHandlers();
  }

  async spawnFromBlueprint(
    blueprint: AgentBlueprint, 
    options: SpawnOptions = {}
  ): Promise<string> {
    const agentId = this.generateAgentId(blueprint.name);
    
    try {
      // Create agent using MetaAgentBuilder
      const createResult = await this.metaBuilder.handle({
        action: 'create',
        payload: { blueprint },
        userId: 'system'
      });

      if (!createResult.success) {
        throw new Error(`Failed to create agent: ${createResult.message}`);
      }

      // Deploy agent
      const deployResult = await this.metaBuilder.handle({
        action: 'deploy',
        payload: { agentName: blueprint.name },
        userId: 'system'
      });

      if (!deployResult.success) {
        throw new Error(`Failed to deploy agent: ${deployResult.message}`);
      }

      // Create spawned agent record
      const spawnedAgent: SpawnedAgent = {
        id: agentId,
        name: blueprint.name,
        blueprint,
        status: 'running',
        startTime: new Date(),
        restartCount: 0,
        requestCount: 0,
        errorCount: 0
      };

      if (options.isolated) {
        // Spawn in worker thread
        const worker = await this.spawnWorker(blueprint, options);
        spawnedAgent.worker = worker;
        spawnedAgent.pid = worker.threadId;
        this.workerPool.set(agentId, worker);
      } else {
        // Spawn in same process
        const instance = await this.createInstance(blueprint);
        spawnedAgent.instance = instance;
      }

      this.spawnedAgents.set(agentId, spawnedAgent);
      
      // Register with registry
      agentRegistry.register(blueprint, spawnedAgent.instance || spawnedAgent.worker);

      // Setup health checks
      if (options.healthCheck?.enabled) {
        this.setupHealthCheck(agentId, options.healthCheck);
      }

      // Setup auto-scaling
      if (options.scaling?.enabled) {
        this.setupAutoScaling(agentId, options.scaling);
      }

      this.emit('agent-spawned', { agentId, blueprint, options });
      
      return agentId;
    } catch (error) {
      this.emit('spawn-error', { blueprint, error, options });
      throw error;
    }
  }

  async spawnFromRequirements(
    requirements: AgentRequirements,
    options: SpawnOptions = {}
  ): Promise<string> {
    // Generate blueprint from requirements
    const blueprint = await this.metaBuilder.handle({
      action: 'generate-blueprint',
      payload: { requirements },
      userId: 'system'
    });

    return this.spawnFromBlueprint(blueprint, options);
  }

  async spawnComposite(
    composition: AgentComposition,
    options: SpawnOptions = {}
  ): Promise<string> {
    const compositeResult = await this.metaBuilder.handle({
      action: 'compose',
      payload: {
        agentNames: composition.agents,
        compositionStrategy: composition.strategy
      },
      userId: 'system'
    });

    if (!compositeResult.success) {
      throw new Error(`Failed to create composite agent: ${compositeResult.message}`);
    }

    // The composite agent blueprint is created, now spawn it
    const blueprint = compositeResult.blueprint;
    return this.spawnFromBlueprint(blueprint, options);
  }

  async stopAgent(agentId: string): Promise<boolean> {
    const agent = this.spawnedAgents.get(agentId);
    if (!agent) {
      return false;
    }

    try {
      agent.status = 'stopped';

      // Stop health checks
      const healthInterval = this.healthCheckIntervals.get(agentId);
      if (healthInterval) {
        clearInterval(healthInterval);
        this.healthCheckIntervals.delete(agentId);
      }

      // Stop scaling monitors
      const scalingInterval = this.scalingIntervals.get(agentId);
      if (scalingInterval) {
        clearInterval(scalingInterval);
        this.scalingIntervals.delete(agentId);
      }

      if (agent.worker) {
        // Terminate worker
        await agent.worker.terminate();
        this.workerPool.delete(agentId);
      }

      // Unregister from registry
      agentRegistry.unregister(agent.name);

      this.spawnedAgents.delete(agentId);
      this.emit('agent-stopped', { agentId, agent });
      
      return true;
    } catch (error) {
      this.emit('stop-error', { agentId, error });
      return false;
    }
  }

  async restartAgent(agentId: string): Promise<boolean> {
    const agent = this.spawnedAgents.get(agentId);
    if (!agent) {
      return false;
    }

    try {
      // Stop current instance
      await this.stopAgent(agentId);
      
      // Spawn new instance
      const newAgentId = await this.spawnFromBlueprint(agent.blueprint);
      
      // Update restart count
      const newAgent = this.spawnedAgents.get(newAgentId);
      if (newAgent) {
        newAgent.restartCount = agent.restartCount + 1;
      }

      this.emit('agent-restarted', { oldAgentId: agentId, newAgentId });
      
      return true;
    } catch (error) {
      this.emit('restart-error', { agentId, error });
      return false;
    }
  }

  getAgent(agentId: string): SpawnedAgent | undefined {
    return this.spawnedAgents.get(agentId);
  }

  getAllAgents(): SpawnedAgent[] {
    return Array.from(this.spawnedAgents.values());
  }

  getAgentsByStatus(status: SpawnedAgent['status']): SpawnedAgent[] {
    return this.getAllAgents().filter(agent => agent.status === status);
  }

  async scaleAgent(agentId: string, instanceCount: number): Promise<string[]> {
    const agent = this.spawnedAgents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    const currentInstances = this.getAllAgents().filter(
      a => a.name === agent.name
    ).length;

    const newAgentIds: string[] = [];

    if (instanceCount > currentInstances) {
      // Scale up
      const instancesToCreate = instanceCount - currentInstances;
      for (let i = 0; i < instancesToCreate; i++) {
        const newAgentId = await this.spawnFromBlueprint(agent.blueprint);
        newAgentIds.push(newAgentId);
      }
    } else if (instanceCount < currentInstances) {
      // Scale down
      const instancesToRemove = currentInstances - instanceCount;
      const agentsToStop = this.getAllAgents()
        .filter(a => a.name === agent.name)
        .sort((a, b) => b.startTime.getTime() - a.startTime.getTime()) // Stop newest first
        .slice(0, instancesToRemove);

      for (const agentToStop of agentsToStop) {
        await this.stopAgent(agentToStop.id);
      }
    }

    this.emit('agent-scaled', { agentId, instanceCount, newAgentIds });
    
    return newAgentIds;
  }

  async executeOnAgent(agentId: string, message: any): Promise<any> {
    const agent = this.spawnedAgents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    if (agent.status !== 'running') {
      throw new Error(`Agent ${agentId} is not running (status: ${agent.status})`);
    }

    const startTime = Date.now();
    
    try {
      let result: any;

      if (agent.worker) {
        // Execute in worker thread
        result = await this.executeInWorker(agent.worker, message);
      } else if (agent.instance) {
        // Execute in same process
        result = await agent.instance.handle(message);
      } else {
        throw new Error('No valid execution context');
      }

      const responseTime = Date.now() - startTime;
      
      // Update metrics
      agent.requestCount++;
      agentRegistry.recordRequest(agent.name, responseTime, false);

      this.emit('agent-executed', { agentId, message, result, responseTime });
      
      return result;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      agent.errorCount++;
      agentRegistry.recordRequest(agent.name, responseTime, true);
      
      this.emit('agent-error', { agentId, message, error, responseTime });
      throw error;
    }
  }

  async executeWithLoadBalancing(
    agentName: string,
    message: any,
    strategy: 'round-robin' | 'least-connections' | 'response-time' = 'round-robin'
  ): Promise<any> {
    const agents = this.getAllAgents().filter(
      agent => agent.name === agentName && agent.status === 'running'
    );

    if (agents.length === 0) {
      throw new Error(`No running instances of agent ${agentName} found`);
    }

    const selectedAgent = this.loadBalancer.selectAgent(agents, strategy);
    return this.executeOnAgent(selectedAgent.id, message);
  }

  getStats(): SpawnerStats {
    const agents = this.getAllAgents();
    
    return {
      totalAgents: agents.length,
      runningAgents: agents.filter(a => a.status === 'running').length,
      errorAgents: agents.filter(a => a.status === 'error').length,
      totalRequests: agents.reduce((sum, a) => sum + a.requestCount, 0),
      totalErrors: agents.reduce((sum, a) => sum + a.errorCount, 0),
      totalRestarts: agents.reduce((sum, a) => sum + a.restartCount, 0),
      workerThreads: this.workerPool.size,
      memoryUsage: this.calculateTotalMemoryUsage(agents)
    };
  }

  private async spawnWorker(blueprint: AgentBlueprint, options: SpawnOptions): Promise<Worker> {
    const workerScript = path.join(__dirname, '../workers/AgentWorker.js');
    
    const worker = new Worker(workerScript, {
      workerData: {
        blueprint,
        options
      },
      resourceLimits: {
        maxOldGenerationSizeMb: options.maxMemory || 512,
        maxYoungGenerationSizeMb: Math.min(options.maxMemory || 512, 128)
      }
    });

    return new Promise((resolve, reject) => {
      worker.once('message', (message) => {
        if (message.type === 'ready') {
          resolve(worker);
        } else if (message.type === 'error') {
          reject(new Error(message.error));
        }
      });

      worker.once('error', reject);
      
      setTimeout(() => {
        reject(new Error('Worker spawn timeout'));
      }, options.timeout || 30000);
    });
  }

  private async createInstance(blueprint: AgentBlueprint): Promise<any> {
    // Dynamically import the agent class
    const modulePath = path.join(
      process.cwd(), 
      'api', 
      'agents', 
      'generated', 
      `${blueprint.name}.js`
    );
    
    const AgentClass = await import(modulePath);
    return new AgentClass.default(blueprint.config);
  }

  private async executeInWorker(worker: Worker, message: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const messageId = Math.random().toString(36).substring(7);
      
      const handleMessage = (response: any) => {
        if (response.messageId === messageId) {
          worker.off('message', handleMessage);
          if (response.error) {
            reject(new Error(response.error));
          } else {
            resolve(response.result);
          }
        }
      };

      worker.on('message', handleMessage);
      
      worker.postMessage({
        type: 'execute',
        messageId,
        message
      });
    });
  }

  private setupHealthCheck(agentId: string, config: HealthCheckConfig): void {
    const interval = setInterval(async () => {
      const agent = this.spawnedAgents.get(agentId);
      if (!agent) {
        clearInterval(interval);
        return;
      }

      try {
        let isHealthy = false;

        if (config.endpoint) {
          // Custom health check endpoint
          const result = await this.executeOnAgent(agentId, {
            action: config.endpoint,
            payload: {},
            userId: 'health-check'
          });
          isHealthy = result && result.healthy !== false;
        } else {
          // Default health check
          isHealthy = agent.status === 'running';
        }

        agent.lastHealthCheck = new Date();
        
        if (!isHealthy && config.retries > 0) {
          // Attempt restart
          await this.restartAgent(agentId);
        }

        this.emit('health-check', { agentId, healthy: isHealthy });
      } catch (error) {
        this.emit('health-check-error', { agentId, error });
      }
    }, config.interval);

    this.healthCheckIntervals.set(agentId, interval);
  }

  private setupAutoScaling(agentId: string, config: ScalingOptions): void {
    const interval = setInterval(async () => {
      const agent = this.spawnedAgents.get(agentId);
      if (!agent) {
        clearInterval(interval);
        return;
      }

      try {
        const metrics = this.calculateScalingMetrics(agent.name);
        
        if (metrics.load > config.scaleUpThreshold) {
          const currentInstances = this.getAllAgents()
            .filter(a => a.name === agent.name && a.status === 'running')
            .length;
          
          if (currentInstances < config.maxInstances) {
            await this.scaleAgent(agentId, currentInstances + 1);
          }
        } else if (metrics.load < config.scaleDownThreshold) {
          const currentInstances = this.getAllAgents()
            .filter(a => a.name === agent.name && a.status === 'running')
            .length;
          
          if (currentInstances > config.minInstances) {
            await this.scaleAgent(agentId, currentInstances - 1);
          }
        }

        this.emit('scaling-check', { agentId, metrics, config });
      } catch (error) {
        this.emit('scaling-error', { agentId, error });
      }
    }, config.cooldownPeriod);

    this.scalingIntervals.set(agentId, interval);
  }

  private calculateScalingMetrics(agentName: string) {
    const agents = this.getAllAgents().filter(a => a.name === agentName);
    const totalRequests = agents.reduce((sum, a) => sum + a.requestCount, 0);
    const totalErrors = agents.reduce((sum, a) => sum + a.errorCount, 0);
    const avgMemoryUsage = agents.reduce((sum, a) => sum + (a.memoryUsage || 0), 0) / agents.length;
    
    return {
      load: totalRequests / agents.length,
      errorRate: totalErrors / Math.max(totalRequests, 1),
      memoryUsage: avgMemoryUsage,
      instanceCount: agents.length
    };
  }

  private calculateTotalMemoryUsage(agents: SpawnedAgent[]): number {
    return agents.reduce((sum, agent) => sum + (agent.memoryUsage || 0), 0);
  }

  private generateAgentId(agentName: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    return `${agentName}-${timestamp}-${random}`;
  }

  private setupCleanupHandlers(): void {
    process.on('SIGINT', () => this.cleanup());
    process.on('SIGTERM', () => this.cleanup());
    process.on('exit', () => this.cleanup());
  }

  private async cleanup(): Promise<void> {
    const agentIds = Array.from(this.spawnedAgents.keys());
    
    for (const agentId of agentIds) {
      await this.stopAgent(agentId);
    }
  }
}

class AgentLoadBalancer {
  private roundRobinIndexes = new Map<string, number>();

  selectAgent(
    agents: SpawnedAgent[], 
    strategy: 'round-robin' | 'least-connections' | 'response-time'
  ): SpawnedAgent {
    switch (strategy) {
      case 'round-robin':
        return this.roundRobinSelect(agents);
      case 'least-connections':
        return this.leastConnectionsSelect(agents);
      case 'response-time':
        return this.bestResponseTimeSelect(agents);
      default:
        return agents[0];
    }
  }

  private roundRobinSelect(agents: SpawnedAgent[]): SpawnedAgent {
    const agentName = agents[0].name;
    const currentIndex = this.roundRobinIndexes.get(agentName) || 0;
    const nextIndex = (currentIndex + 1) % agents.length;
    
    this.roundRobinIndexes.set(agentName, nextIndex);
    
    return agents[currentIndex];
  }

  private leastConnectionsSelect(agents: SpawnedAgent[]): SpawnedAgent {
    return agents.reduce((min, agent) => 
      agent.requestCount < min.requestCount ? agent : min
    );
  }

  private bestResponseTimeSelect(agents: SpawnedAgent[]): SpawnedAgent {
    // This would require response time tracking
    // For now, fall back to least connections
    return this.leastConnectionsSelect(agents);
  }
}

export interface SpawnerStats {
  totalAgents: number;
  runningAgents: number;
  errorAgents: number;
  totalRequests: number;
  totalErrors: number;
  totalRestarts: number;
  workerThreads: number;
  memoryUsage: number;
}

// Singleton instance
export const agentSpawner = new AgentSpawner();