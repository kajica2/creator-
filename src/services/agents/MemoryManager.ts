import {
  MemoryStore,
  MemoryAccess,
  MemoryScope,
  Agent,
  AgentTask,
  AgentEvent
} from '../../types/agents';
import { supabase } from '../../utils/supabaseClient';

/**
 * MemoryManager handles cross-agent memory sharing and persistence
 * Implements Claude-Flow memory patterns for enhanced coordination
 */
export class MemoryManager {
  private static instance: MemoryManager;
  private memoryStores: Map<string, MemoryStore> = new Map();
  private accessLog: Map<string, Date> = new Map();
  private changeSubscriptions: Map<string, Set<string>> = new Map(); // memoryKey -> agentIds

  public static getInstance(): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager();
    }
    return MemoryManager.instance;
  }

  /**
   * Initialize memory stores for agent groups
   */
  public async initialize(): Promise<void> {
    console.log('Initializing Memory Manager...');

    // Create global shared memory
    await this.createMemoryStore('global', 'global');

    // Create group-specific memory stores
    const groupStores = [
      'video-generation',
      'audio-generation',
      'live-mixer',
      'content-analysis',
      'monitoring',
      'quality-assurance'
    ];

    for (const groupId of groupStores) {
      await this.createMemoryStore(groupId, 'group');
    }

    // Initialize Claude-Flow memory hooks
    await this.initializeClaudeFlowMemory();

    console.log('Memory Manager initialized successfully');
  }

  /**
   * Initialize Claude-Flow memory integration
   */
  private async initializeClaudeFlowMemory(): Promise<void> {
    try {
      // This would integrate with Claude-Flow memory system
      // mcp__claude-flow__memory_* tools would be used here
      console.log('Setting up Claude-Flow memory integration...');

      // Example of how Claude-Flow memory would be initialized
      /*
      await this.executeClaudeFlowMemoryCommand('memory_init', {
        scope: 'swarm',
        persistence: true,
        encryption: false,
        maxSize: '100MB'
      });
      */

    } catch (error) {
      console.error('Failed to initialize Claude-Flow memory:', error);
      throw error;
    }
  }

  /**
   * Create a new memory store
   */
  private async createMemoryStore(storeId: string, scope: MemoryScope): Promise<MemoryStore> {
    const store: MemoryStore = {
      sessionId: `session-${storeId}-${Date.now()}`,
      shared: {},
      private: new Map(),
      persistent: {},
      metadata: {
        created: new Date(),
        updated: new Date(),
        size: 0,
        accessCount: 0,
        permissions: []
      }
    };

    this.memoryStores.set(storeId, store);

    // Persist store metadata
    await this.persistMemoryStore(storeId, store);

    return store;
  }

  /**
   * Store data in memory with access control
   */
  public async store(
    key: string,
    value: any,
    agentId: string,
    scope: MemoryScope = 'group',
    storeId?: string
  ): Promise<void> {
    try {
      // Determine target store
      const targetStore = this.getTargetStore(scope, storeId, agentId);
      const store = this.memoryStores.get(targetStore);

      if (!store) {
        throw new Error(`Memory store not found: ${targetStore}`);
      }

      // Check write permissions
      if (!this.hasWritePermission(agentId, key, store)) {
        throw new Error(`Agent ${agentId} does not have write permission for key: ${key}`);
      }

      // Determine storage location based on scope
      switch (scope) {
        case 'private':
          if (!store.private.has(agentId)) {
            store.private.set(agentId, {});
          }
          store.private.get(agentId)![key] = value;
          break;

        case 'group':
        case 'global':
          store.shared[key] = {
            value,
            agentId,
            timestamp: new Date(),
            accessCount: 0
          };
          break;

        case 'session':
          store.shared[key] = {
            value,
            agentId,
            timestamp: new Date(),
            accessCount: 0,
            sessionOnly: true
          };
          break;
      }

      // Update metadata
      store.metadata.updated = new Date();
      store.metadata.size = this.calculateStoreSize(store);

      // Log access
      this.logAccess(agentId, key, 'write');

      // Notify subscribers
      await this.notifySubscribers(key, agentId, 'update', value);

      // Execute Claude-Flow memory hook
      await this.executeClaudeFlowMemoryHook('post-edit', {
        agentId,
        key,
        value,
        scope,
        memoryKey: `swarm/${agentId}/${key}`
      });

      // Persist to database if needed
      if (scope === 'global' || key.startsWith('persistent/')) {
        await this.persistMemoryEntry(key, value, agentId, scope);
      }

      console.log(`Memory stored: ${key} by ${agentId} in ${scope} scope`);

    } catch (error) {
      console.error(`Failed to store memory: ${key}`, error);
      throw error;
    }
  }

  /**
   * Retrieve data from memory
   */
  public async retrieve(
    key: string,
    agentId: string,
    scope: MemoryScope = 'group',
    storeId?: string
  ): Promise<any> {
    try {
      // Determine source store
      const sourceStore = this.getTargetStore(scope, storeId, agentId);
      const store = this.memoryStores.get(sourceStore);

      if (!store) {
        throw new Error(`Memory store not found: ${sourceStore}`);
      }

      // Check read permissions
      if (!this.hasReadPermission(agentId, key, store)) {
        throw new Error(`Agent ${agentId} does not have read permission for key: ${key}`);
      }

      let result: any = null;

      // Retrieve from appropriate location based on scope
      switch (scope) {
        case 'private':
          const privateStore = store.private.get(agentId);
          result = privateStore ? privateStore[key] : null;
          break;

        case 'group':
        case 'global':
        case 'session':
          const entry = store.shared[key];
          if (entry) {
            entry.accessCount++;
            result = entry.value;
          }
          break;
      }

      // Log access
      this.logAccess(agentId, key, 'read');

      // Execute Claude-Flow memory hook
      await this.executeClaudeFlowMemoryHook('pre-read', {
        agentId,
        key,
        scope,
        found: result !== null
      });

      return result;

    } catch (error) {
      console.error(`Failed to retrieve memory: ${key}`, error);
      throw error;
    }
  }

  /**
   * Subscribe to memory changes
   */
  public async subscribe(
    key: string,
    agentId: string,
    callback?: (value: any, metadata: any) => void
  ): Promise<void> {
    if (!this.changeSubscriptions.has(key)) {
      this.changeSubscriptions.set(key, new Set());
    }

    this.changeSubscriptions.get(key)!.add(agentId);

    console.log(`Agent ${agentId} subscribed to memory changes for: ${key}`);
  }

  /**
   * Unsubscribe from memory changes
   */
  public async unsubscribe(key: string, agentId: string): Promise<void> {
    const subscribers = this.changeSubscriptions.get(key);
    if (subscribers) {
      subscribers.delete(agentId);
      if (subscribers.size === 0) {
        this.changeSubscriptions.delete(key);
      }
    }

    console.log(`Agent ${agentId} unsubscribed from memory changes for: ${key}`);
  }

  /**
   * Store task context for coordination
   */
  public async storeTaskContext(task: AgentTask, agentId: string): Promise<void> {
    const contextKey = `task/${task.id}/context`;

    const context = {
      taskId: task.id,
      type: task.type,
      agentId,
      payload: task.payload,
      dependencies: task.dependencies,
      startTime: new Date(),
      status: task.status
    };

    await this.store(contextKey, context, agentId, 'global');
  }

  /**
   * Retrieve task context
   */
  public async getTaskContext(taskId: string, agentId: string): Promise<any> {
    const contextKey = `task/${taskId}/context`;
    return await this.retrieve(contextKey, agentId, 'global');
  }

  /**
   * Store agent coordination data
   */
  public async storeCoordinationData(
    coordinationType: string,
    data: any,
    agentId: string,
    groupId?: string
  ): Promise<void> {
    const coordinationKey = `coordination/${coordinationType}/${agentId}`;

    await this.store(coordinationKey, {
      type: coordinationType,
      data,
      agentId,
      groupId,
      timestamp: new Date()
    }, agentId, groupId ? 'group' : 'global', groupId);
  }

  /**
   * Get coordination data for decision making
   */
  public async getCoordinationData(
    coordinationType: string,
    agentId: string,
    groupId?: string
  ): Promise<any[]> {
    const store = this.memoryStores.get(groupId || 'global');
    if (!store) return [];

    const coordinationData: any[] = [];

    for (const [key, entry] of Object.entries(store.shared)) {
      if (key.startsWith(`coordination/${coordinationType}/`)) {
        coordinationData.push(entry.value);
      }
    }

    return coordinationData;
  }

  /**
   * Store integration data for component coordination
   */
  public async storeIntegrationData(
    component: string,
    operation: string,
    data: any,
    agentId: string
  ): Promise<void> {
    const integrationKey = `integration/${component}/${operation}`;

    await this.store(integrationKey, {
      component,
      operation,
      data,
      agentId,
      timestamp: new Date()
    }, agentId, 'global');
  }

  /**
   * Get integration data
   */
  public async getIntegrationData(
    component: string,
    operation?: string,
    agentId?: string
  ): Promise<any[]> {
    const store = this.memoryStores.get('global');
    if (!store) return [];

    const integrationData: any[] = [];
    const keyPrefix = `integration/${component}${operation ? '/' + operation : ''}`;

    for (const [key, entry] of Object.entries(store.shared)) {
      if (key.startsWith(keyPrefix)) {
        if (!agentId || entry.value.agentId === agentId) {
          integrationData.push(entry.value);
        }
      }
    }

    return integrationData;
  }

  /**
   * Clear memory based on criteria
   */
  public async clearMemory(
    criteria: {
      storeId?: string;
      agentId?: string;
      keyPattern?: string;
      olderThan?: Date;
      scope?: MemoryScope;
    }
  ): Promise<number> {
    let clearedCount = 0;

    const storesToCheck = criteria.storeId
      ? [this.memoryStores.get(criteria.storeId)].filter(Boolean) as MemoryStore[]
      : Array.from(this.memoryStores.values());

    for (const store of storesToCheck) {
      // Clear shared memory
      for (const [key, entry] of Object.entries(store.shared)) {
        if (this.matchesClearCriteria(key, entry, criteria)) {
          delete store.shared[key];
          clearedCount++;
        }
      }

      // Clear private memory if agentId specified
      if (criteria.agentId && store.private.has(criteria.agentId)) {
        const privateStore = store.private.get(criteria.agentId)!;
        for (const [key, value] of Object.entries(privateStore)) {
          if (this.matchesClearCriteria(key, { value, timestamp: new Date() }, criteria)) {
            delete privateStore[key];
            clearedCount++;
          }
        }
      }

      // Update metadata
      store.metadata.updated = new Date();
      store.metadata.size = this.calculateStoreSize(store);
    }

    console.log(`Cleared ${clearedCount} memory entries`);
    return clearedCount;
  }

  /**
   * Get memory usage statistics
   */
  public async getMemoryStats(): Promise<any> {
    const stats = {
      totalStores: this.memoryStores.size,
      totalSize: 0,
      storeDetails: {} as any,
      accessPatterns: {} as any
    };

    for (const [storeId, store] of this.memoryStores.entries()) {
      const storeSize = this.calculateStoreSize(store);
      stats.totalSize += storeSize;

      stats.storeDetails[storeId] = {
        size: storeSize,
        sharedEntries: Object.keys(store.shared).length,
        privateAgents: store.private.size,
        lastUpdated: store.metadata.updated,
        accessCount: store.metadata.accessCount
      };
    }

    // Calculate access patterns
    for (const [key, lastAccess] of this.accessLog.entries()) {
      const [agentId] = key.split(':');
      if (!stats.accessPatterns[agentId]) {
        stats.accessPatterns[agentId] = { reads: 0, writes: 0, lastAccess };
      }

      if (key.includes(':read')) {
        stats.accessPatterns[agentId].reads++;
      } else if (key.includes(':write')) {
        stats.accessPatterns[agentId].writes++;
      }
    }

    return stats;
  }

  /**
   * Helper methods
   */
  private getTargetStore(scope: MemoryScope, storeId?: string, agentId?: string): string {
    switch (scope) {
      case 'global':
        return 'global';
      case 'group':
        return storeId || this.getAgentGroup(agentId!) || 'global';
      case 'private':
      case 'session':
        return storeId || this.getAgentGroup(agentId!) || 'global';
      default:
        return 'global';
    }
  }

  private getAgentGroup(agentId: string): string | null {
    // This would lookup the agent's group from configuration
    // For now, we'll infer from agent ID pattern
    if (agentId.includes('video')) return 'video-generation';
    if (agentId.includes('audio')) return 'audio-generation';
    if (agentId.includes('live')) return 'live-mixer';
    if (agentId.includes('content')) return 'content-analysis';
    if (agentId.includes('trend')) return 'monitoring';
    if (agentId.includes('quality')) return 'quality-assurance';
    return null;
  }

  private hasReadPermission(agentId: string, key: string, store: MemoryStore): boolean {
    // Basic permission check - can be extended
    return true; // For now, allow all reads
  }

  private hasWritePermission(agentId: string, key: string, store: MemoryStore): boolean {
    // Basic permission check - can be extended
    return true; // For now, allow all writes
  }

  private logAccess(agentId: string, key: string, operation: 'read' | 'write'): void {
    const logKey = `${agentId}:${operation}:${key}`;
    this.accessLog.set(logKey, new Date());

    // Cleanup old access logs (keep only last 1000 entries)
    if (this.accessLog.size > 1000) {
      const oldestKey = Array.from(this.accessLog.keys())[0];
      this.accessLog.delete(oldestKey);
    }
  }

  private async notifySubscribers(
    key: string,
    agentId: string,
    operation: string,
    value: any
  ): Promise<void> {
    const subscribers = this.changeSubscriptions.get(key);
    if (!subscribers || subscribers.size === 0) return;

    const notification = {
      key,
      operation,
      value,
      agentId,
      timestamp: new Date()
    };

    // In a real implementation, this would send notifications to subscribers
    console.log(`Notifying ${subscribers.size} subscribers of change to: ${key}`);
  }

  private calculateStoreSize(store: MemoryStore): number {
    // Rough size calculation - in a real implementation, this would be more accurate
    let size = 0;

    // Shared memory size
    size += JSON.stringify(store.shared).length;

    // Private memory size
    for (const privateStore of store.private.values()) {
      size += JSON.stringify(privateStore).length;
    }

    return size;
  }

  private matchesClearCriteria(key: string, entry: any, criteria: any): boolean {
    if (criteria.keyPattern && !key.match(criteria.keyPattern)) {
      return false;
    }

    if (criteria.olderThan && entry.timestamp > criteria.olderThan) {
      return false;
    }

    if (criteria.agentId && entry.agentId !== criteria.agentId) {
      return false;
    }

    return true;
  }

  private async persistMemoryStore(storeId: string, store: MemoryStore): Promise<void> {
    try {
      await supabase
        .from('memory_stores')
        .upsert({
          store_id: storeId,
          session_id: store.sessionId,
          metadata: store.metadata,
          created_at: store.metadata.created.toISOString(),
          updated_at: store.metadata.updated.toISOString()
        });
    } catch (error) {
      console.error('Failed to persist memory store:', error);
    }
  }

  private async persistMemoryEntry(
    key: string,
    value: any,
    agentId: string,
    scope: MemoryScope
  ): Promise<void> {
    try {
      await supabase
        .from('memory_entries')
        .upsert({
          memory_key: key,
          value: value,
          agent_id: agentId,
          scope: scope,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Failed to persist memory entry:', error);
    }
  }

  private async executeClaudeFlowMemoryHook(
    hookType: string,
    params: any
  ): Promise<void> {
    try {
      // This would execute actual Claude-Flow memory hooks
      console.log(`Claude-Flow memory hook ${hookType}:`, params);

      // Example of how hooks would be executed:
      /*
      await this.executeClaudeFlowCommand(`hooks ${hookType}`, {
        ...params,
        sessionId: params.sessionId || 'default'
      });
      */

    } catch (error) {
      console.error(`Claude-Flow memory hook failed: ${hookType}`, error);
    }
  }

  private async executeClaudeFlowMemoryCommand(
    command: string,
    params: any
  ): Promise<void> {
    // This would execute actual Claude-Flow memory commands
    console.log(`Claude-Flow memory ${command}:`, params);
  }
}

export const memoryManager = MemoryManager.getInstance();