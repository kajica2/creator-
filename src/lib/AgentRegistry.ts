import { AgentBlueprint } from '../types/AgentTypes';

export interface RegisteredAgent {
  name: string;
  blueprint: AgentBlueprint;
  instance?: any;
  deployedAt?: Date;
  status: 'registered' | 'deployed' | 'error' | 'stopped';
  metrics: AgentMetrics;
}

export interface AgentMetrics {
  requestCount: number;
  averageResponseTime: number;
  errorCount: number;
  lastUsed?: Date;
  memoryUsage?: number;
}

export interface AgentQuery {
  capabilities?: string[];
  status?: string[];
  tags?: string[];
  name?: string;
  limit?: number;
}

export class AgentRegistry {
  private agents = new Map<string, RegisteredAgent>();
  private capabilityIndex = new Map<string, Set<string>>();
  private tagIndex = new Map<string, Set<string>>();
  private listeners = new Set<(event: RegistryEvent) => void>();

  register(blueprint: AgentBlueprint, instance?: any): void {
    const registeredAgent: RegisteredAgent = {
      name: blueprint.name,
      blueprint,
      instance,
      status: instance ? 'deployed' : 'registered',
      deployedAt: instance ? new Date() : undefined,
      metrics: {
        requestCount: 0,
        averageResponseTime: 0,
        errorCount: 0
      }
    };

    this.agents.set(blueprint.name, registeredAgent);
    this.updateIndexes(blueprint);
    
    this.emit({
      type: 'agent-registered',
      agentName: blueprint.name,
      timestamp: new Date()
    });
  }

  deploy(agentName: string, instance: any): void {
    const agent = this.agents.get(agentName);
    if (!agent) {
      throw new Error(`Agent ${agentName} not found`);
    }

    agent.instance = instance;
    agent.status = 'deployed';
    agent.deployedAt = new Date();

    this.emit({
      type: 'agent-deployed',
      agentName,
      timestamp: new Date()
    });
  }

  unregister(agentName: string): boolean {
    const agent = this.agents.get(agentName);
    if (!agent) {
      return false;
    }

    this.removeFromIndexes(agent.blueprint);
    this.agents.delete(agentName);

    this.emit({
      type: 'agent-unregistered',
      agentName,
      timestamp: new Date()
    });

    return true;
  }

  get(agentName: string): RegisteredAgent | undefined {
    return this.agents.get(agentName);
  }

  getAll(): RegisteredAgent[] {
    return Array.from(this.agents.values());
  }

  query(query: AgentQuery): RegisteredAgent[] {
    let results = this.getAll();

    if (query.name) {
      results = results.filter(agent => 
        agent.name.toLowerCase().includes(query.name!.toLowerCase())
      );
    }

    if (query.status && query.status.length > 0) {
      results = results.filter(agent => 
        query.status!.includes(agent.status)
      );
    }

    if (query.capabilities && query.capabilities.length > 0) {
      results = results.filter(agent =>
        query.capabilities!.every(cap =>
          agent.blueprint.capabilities.includes(cap)
        )
      );
    }

    if (query.tags && query.tags.length > 0) {
      results = results.filter(agent =>
        query.tags!.some(tag =>
          agent.blueprint.metadata?.tags?.includes(tag)
        )
      );
    }

    if (query.limit) {
      results = results.slice(0, query.limit);
    }

    return results;
  }

  findByCapability(capability: string): RegisteredAgent[] {
    const agentNames = this.capabilityIndex.get(capability);
    if (!agentNames) {
      return [];
    }

    return Array.from(agentNames)
      .map(name => this.agents.get(name))
      .filter(Boolean) as RegisteredAgent[];
  }

  findByTag(tag: string): RegisteredAgent[] {
    const agentNames = this.tagIndex.get(tag);
    if (!agentNames) {
      return [];
    }

    return Array.from(agentNames)
      .map(name => this.agents.get(name))
      .filter(Boolean) as RegisteredAgent[];
  }

  updateMetrics(agentName: string, metrics: Partial<AgentMetrics>): void {
    const agent = this.agents.get(agentName);
    if (!agent) {
      return;
    }

    agent.metrics = {
      ...agent.metrics,
      ...metrics,
      lastUsed: new Date()
    };
  }

  recordRequest(agentName: string, responseTime: number, isError = false): void {
    const agent = this.agents.get(agentName);
    if (!agent) {
      return;
    }

    const { metrics } = agent;
    metrics.requestCount += 1;
    
    // Update average response time
    metrics.averageResponseTime = 
      (metrics.averageResponseTime * (metrics.requestCount - 1) + responseTime) / 
      metrics.requestCount;

    if (isError) {
      metrics.errorCount += 1;
    }

    metrics.lastUsed = new Date();
  }

  getCapabilities(): string[] {
    return Array.from(this.capabilityIndex.keys());
  }

  getTags(): string[] {
    return Array.from(this.tagIndex.keys());
  }

  getStats(): RegistryStats {
    const agents = this.getAll();
    
    return {
      totalAgents: agents.length,
      deployedAgents: agents.filter(a => a.status === 'deployed').length,
      errorAgents: agents.filter(a => a.status === 'error').length,
      totalRequests: agents.reduce((sum, a) => sum + a.metrics.requestCount, 0),
      totalErrors: agents.reduce((sum, a) => sum + a.metrics.errorCount, 0),
      averageResponseTime: this.calculateOverallAverageResponseTime(agents),
      capabilities: this.getCapabilities(),
      tags: this.getTags()
    };
  }

  private updateIndexes(blueprint: AgentBlueprint): void {
    // Update capability index
    blueprint.capabilities.forEach(cap => {
      if (!this.capabilityIndex.has(cap)) {
        this.capabilityIndex.set(cap, new Set());
      }
      this.capabilityIndex.get(cap)!.add(blueprint.name);
    });

    // Update tag index
    blueprint.metadata?.tags?.forEach(tag => {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, new Set());
      }
      this.tagIndex.get(tag)!.add(blueprint.name);
    });
  }

  private removeFromIndexes(blueprint: AgentBlueprint): void {
    // Remove from capability index
    blueprint.capabilities.forEach(cap => {
      const agentSet = this.capabilityIndex.get(cap);
      if (agentSet) {
        agentSet.delete(blueprint.name);
        if (agentSet.size === 0) {
          this.capabilityIndex.delete(cap);
        }
      }
    });

    // Remove from tag index
    blueprint.metadata?.tags?.forEach(tag => {
      const agentSet = this.tagIndex.get(tag);
      if (agentSet) {
        agentSet.delete(blueprint.name);
        if (agentSet.size === 0) {
          this.tagIndex.delete(tag);
        }
      }
    });
  }

  private calculateOverallAverageResponseTime(agents: RegisteredAgent[]): number {
    const totalRequests = agents.reduce((sum, a) => sum + a.metrics.requestCount, 0);
    if (totalRequests === 0) return 0;

    const weightedSum = agents.reduce(
      (sum, a) => sum + (a.metrics.averageResponseTime * a.metrics.requestCount),
      0
    );

    return weightedSum / totalRequests;
  }

  private emit(event: RegistryEvent): void {
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Registry event listener error:', error);
      }
    });
  }

  subscribe(listener: (event: RegistryEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Health monitoring
  checkHealth(): RegistryHealth {
    const agents = this.getAll();
    const issues: string[] = [];
    
    // Check for agents with high error rates
    agents.forEach(agent => {
      if (agent.metrics.requestCount > 0) {
        const errorRate = agent.metrics.errorCount / agent.metrics.requestCount;
        if (errorRate > 0.1) { // More than 10% errors
          issues.push(`High error rate for agent ${agent.name}: ${(errorRate * 100).toFixed(1)}%`);
        }
      }

      // Check for agents not used recently
      if (agent.metrics.lastUsed) {
        const daysSinceUsed = (Date.now() - agent.metrics.lastUsed.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceUsed > 7) {
          issues.push(`Agent ${agent.name} hasn't been used for ${daysSinceUsed.toFixed(0)} days`);
        }
      }
    });

    return {
      healthy: issues.length === 0,
      issues,
      lastCheck: new Date(),
      agentCount: agents.length
    };
  }
}

export interface RegistryEvent {
  type: 'agent-registered' | 'agent-deployed' | 'agent-unregistered' | 'agent-error';
  agentName: string;
  timestamp: Date;
  details?: any;
}

export interface RegistryStats {
  totalAgents: number;
  deployedAgents: number;
  errorAgents: number;
  totalRequests: number;
  totalErrors: number;
  averageResponseTime: number;
  capabilities: string[];
  tags: string[];
}

export interface RegistryHealth {
  healthy: boolean;
  issues: string[];
  lastCheck: Date;
  agentCount: number;
}

// Singleton instance
export const agentRegistry = new AgentRegistry();