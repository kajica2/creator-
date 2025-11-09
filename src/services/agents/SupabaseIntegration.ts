import { supabase } from '../../utils/supabaseClient';
import {
  Agent,
  AgentTask,
  AgentPerformance,
  TaskResult,
  AgentEvent,
  ComponentIntegration
} from '../../types/agents';
import { dailyAgentRoutineConfig } from '../../../config/agents/daily-routine';

/**
 * SupabaseIntegration manages all database interactions for the agent system
 * Provides seamless integration with existing Supabase components
 */
export class SupabaseIntegration {
  private static instance: SupabaseIntegration;
  private componentIntegration: ComponentIntegration;
  private realtimeSubscriptions: Map<string, any> = new Map();

  public static getInstance(): SupabaseIntegration {
    if (!SupabaseIntegration.instance) {
      SupabaseIntegration.instance = new SupabaseIntegration();
    }
    return SupabaseIntegration.instance;
  }

  constructor() {
    this.componentIntegration = dailyAgentRoutineConfig.componentIntegration;
  }

  /**
   * Initialize Supabase integration
   */
  public async initialize(): Promise<void> {
    console.log('Initializing Supabase integration...');

    try {
      // Ensure required tables exist
      await this.ensureTablesExist();

      // Setup realtime subscriptions
      await this.setupRealtimeSubscriptions();

      // Initialize component integrations
      await this.initializeComponentIntegrations();

      // Setup storage buckets
      await this.setupStorageBuckets();

      console.log('Supabase integration initialized successfully');

    } catch (error) {
      console.error('Failed to initialize Supabase integration:', error);
      throw error;
    }
  }

  /**
   * Ensure all required tables exist
   */
  private async ensureTablesExist(): Promise<void> {
    const requiredTables = [
      'agent_status',
      'agent_tasks',
      'agent_metrics',
      'content_generated',
      'memory_stores',
      'memory_entries',
      'agent_events',
      'routine_executions'
    ];

    for (const tableName of requiredTables) {
      try {
        // Check if table exists by attempting a simple query
        const { error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);

        if (error && error.code === 'PGRST116') {
          // Table doesn't exist, create it
          await this.createTable(tableName);
        }
      } catch (error) {
        console.warn(`Could not verify table ${tableName}:`, error);
      }
    }
  }

  /**
   * Create database tables for agent system
   */
  private async createTable(tableName: string): Promise<void> {
    console.log(`Creating table: ${tableName}`);

    const tableSchemas = {
      'agent_status': `
        CREATE TABLE IF NOT EXISTS agent_status (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          agent_id VARCHAR(255) UNIQUE NOT NULL,
          name VARCHAR(255) NOT NULL,
          type VARCHAR(100) NOT NULL,
          status VARCHAR(50) NOT NULL DEFAULT 'idle',
          current_task VARCHAR(255),
          capabilities JSONB,
          performance JSONB,
          configuration JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `,
      'agent_tasks': `
        CREATE TABLE IF NOT EXISTS agent_tasks (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          task_id VARCHAR(255) UNIQUE NOT NULL,
          type VARCHAR(100) NOT NULL,
          priority VARCHAR(50) NOT NULL DEFAULT 'medium',
          status VARCHAR(50) NOT NULL DEFAULT 'pending',
          assigned_to VARCHAR(255),
          created_by VARCHAR(255),
          payload JSONB,
          dependencies TEXT[],
          result JSONB,
          retry_count INTEGER DEFAULT 0,
          max_retries INTEGER DEFAULT 3,
          scheduled_at TIMESTAMP WITH TIME ZONE,
          deadline TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `,
      'agent_metrics': `
        CREATE TABLE IF NOT EXISTS agent_metrics (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          agent_id VARCHAR(255) NOT NULL,
          metric_type VARCHAR(100) NOT NULL,
          value NUMERIC,
          metadata JSONB,
          timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `,
      'content_generated': `
        CREATE TABLE IF NOT EXISTS content_generated (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          content_id VARCHAR(255) UNIQUE NOT NULL,
          type VARCHAR(100) NOT NULL,
          agent_id VARCHAR(255) NOT NULL,
          url TEXT,
          metadata JSONB,
          quality_score NUMERIC,
          viral_potential NUMERIC,
          platform_data JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `,
      'memory_stores': `
        CREATE TABLE IF NOT EXISTS memory_stores (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          store_id VARCHAR(255) UNIQUE NOT NULL,
          session_id VARCHAR(255) NOT NULL,
          scope VARCHAR(50) NOT NULL,
          metadata JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `,
      'memory_entries': `
        CREATE TABLE IF NOT EXISTS memory_entries (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          memory_key VARCHAR(500) NOT NULL,
          value JSONB,
          agent_id VARCHAR(255),
          scope VARCHAR(50),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `,
      'agent_events': `
        CREATE TABLE IF NOT EXISTS agent_events (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          event_id VARCHAR(255) UNIQUE NOT NULL,
          type VARCHAR(100) NOT NULL,
          source VARCHAR(255) NOT NULL,
          target VARCHAR(255),
          payload JSONB,
          priority VARCHAR(50),
          processed BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `,
      'routine_executions': `
        CREATE TABLE IF NOT EXISTS routine_executions (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          routine_id VARCHAR(255) NOT NULL,
          execution_id VARCHAR(255) UNIQUE NOT NULL,
          status VARCHAR(50) NOT NULL,
          started_at TIMESTAMP WITH TIME ZONE,
          completed_at TIMESTAMP WITH TIME ZONE,
          tasks_completed INTEGER DEFAULT 0,
          tasks_failed INTEGER DEFAULT 0,
          metadata JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    };

    const schema = tableSchemas[tableName];
    if (schema) {
      const { error } = await supabase.rpc('exec_sql', { sql: schema });
      if (error) {
        console.error(`Failed to create table ${tableName}:`, error);
      }
    }
  }

  /**
   * Setup realtime subscriptions
   */
  private async setupRealtimeSubscriptions(): Promise<void> {
    const realtimeConfig = this.componentIntegration.supabase.realtime;

    for (const config of realtimeConfig) {
      const subscription = supabase
        .channel(`public:${config.table}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: config.table,
            filter: config.filter
          },
          (payload) => {
            this.handleRealtimeEvent(config.table, payload);
          }
        )
        .subscribe();

      this.realtimeSubscriptions.set(config.table, subscription);
      console.log(`Realtime subscription setup for: ${config.table}`);
    }
  }

  /**
   * Handle realtime events
   */
  private async handleRealtimeEvent(tableName: string, payload: any): Promise<void> {
    console.log(`Realtime event for ${tableName}:`, payload);

    switch (tableName) {
      case 'agent_tasks':
        await this.handleTaskRealtimeEvent(payload);
        break;
      case 'agent_status':
        await this.handleAgentStatusRealtimeEvent(payload);
        break;
      default:
        console.log(`Unhandled realtime event for table: ${tableName}`);
    }
  }

  private async handleTaskRealtimeEvent(payload: any): Promise<void> {
    if (payload.eventType === 'INSERT' && payload.new.status === 'pending') {
      console.log(`New task available: ${payload.new.task_id}`);
      // Notify agent coordinator of new task
    }
  }

  private async handleAgentStatusRealtimeEvent(payload: any): Promise<void> {
    console.log(`Agent status changed: ${payload.new?.agent_id} -> ${payload.new?.status}`);
  }

  /**
   * Initialize component integrations
   */
  private async initializeComponentIntegrations(): Promise<void> {
    // Setup integration with AudioTranscriber
    await this.setupAudioTranscriberIntegration();

    // Setup integration with TextToImageGenerator
    await this.setupTextToImageIntegration();

    // Setup integration with BatchImageGenerator
    await this.setupBatchImageIntegration();

    // Setup integration with TensorMutator
    await this.setupTensorMutatorIntegration();
  }

  private async setupAudioTranscriberIntegration(): Promise<void> {
    console.log('Setting up AudioTranscriber integration...');

    // Create integration records
    await supabase
      .from('component_integrations')
      .upsert({
        component_name: 'AudioTranscriber',
        agent_types: ['audio-composer', 'voice-synthesizer'],
        capabilities: ['transcribe', 'analyze', 'enhance'],
        endpoints: this.componentIntegration.audioTranscriber.endpoints,
        status: 'active'
      })
      .select()
      .single();
  }

  private async setupTextToImageIntegration(): Promise<void> {
    console.log('Setting up TextToImageGenerator integration...');

    await supabase
      .from('component_integrations')
      .upsert({
        component_name: 'TextToImageGenerator',
        agent_types: ['video-generator'],
        capabilities: ['text-to-image', 'style-transfer', 'enhancement'],
        endpoints: this.componentIntegration.textToImage.endpoints,
        status: 'active'
      })
      .select()
      .single();
  }

  private async setupBatchImageIntegration(): Promise<void> {
    console.log('Setting up BatchImageGenerator integration...');

    await supabase
      .from('component_integrations')
      .upsert({
        component_name: 'BatchImageGenerator',
        agent_types: ['video-generator'],
        capabilities: ['batch-process', 'queue-management', 'optimization'],
        endpoints: this.componentIntegration.batchImage.endpoints,
        status: 'active'
      })
      .select()
      .single();
  }

  private async setupTensorMutatorIntegration(): Promise<void> {
    console.log('Setting up TensorMutator integration...');

    await supabase
      .from('component_integrations')
      .upsert({
        component_name: 'TensorMutator',
        agent_types: ['video-effects'],
        capabilities: ['tensor-manipulation', 'model-optimization', 'inference'],
        endpoints: this.componentIntegration.tensorMutator.endpoints,
        status: 'active'
      })
      .select()
      .single();
  }

  /**
   * Setup storage buckets
   */
  private async setupStorageBuckets(): Promise<void> {
    const buckets = ['agent-content', 'agent-temp', 'agent-logs'];

    for (const bucketName of buckets) {
      try {
        const { data, error } = await supabase.storage.getBucket(bucketName);

        if (error && error.message.includes('not found')) {
          // Create bucket
          const { error: createError } = await supabase.storage.createBucket(bucketName, {
            public: false,
            allowedMimeTypes: ['image/*', 'video/*', 'audio/*', 'application/json']
          });

          if (createError) {
            console.error(`Failed to create bucket ${bucketName}:`, createError);
          } else {
            console.log(`Created storage bucket: ${bucketName}`);
          }
        }
      } catch (error) {
        console.warn(`Could not setup bucket ${bucketName}:`, error);
      }
    }
  }

  /**
   * Agent data operations
   */
  public async saveAgent(agent: Agent): Promise<void> {
    const { error } = await supabase
      .from('agent_status')
      .upsert({
        agent_id: agent.id,
        name: agent.name,
        type: agent.type,
        status: agent.status,
        current_task: agent.currentTask,
        capabilities: agent.capabilities,
        performance: agent.performance,
        configuration: agent.configuration,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Failed to save agent:', error);
      throw error;
    }
  }

  public async getAgent(agentId: string): Promise<Agent | null> {
    const { data, error } = await supabase
      .from('agent_status')
      .select('*')
      .eq('agent_id', agentId)
      .single();

    if (error) {
      console.error('Failed to get agent:', error);
      return null;
    }

    return this.mapDbRowToAgent(data);
  }

  public async getAllAgents(): Promise<Agent[]> {
    const { data, error } = await supabase
      .from('agent_status')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to get agents:', error);
      return [];
    }

    return data.map(row => this.mapDbRowToAgent(row));
  }

  /**
   * Task data operations
   */
  public async saveTask(task: AgentTask): Promise<void> {
    const { error } = await supabase
      .from('agent_tasks')
      .upsert({
        task_id: task.id,
        type: task.type,
        priority: task.priority,
        status: task.status,
        assigned_to: task.assignedTo,
        created_by: task.createdBy,
        payload: task.payload,
        dependencies: task.dependencies,
        result: task.result,
        retry_count: task.retryCount,
        max_retries: task.maxRetries,
        scheduled_at: task.scheduledAt.toISOString(),
        deadline: task.deadline?.toISOString(),
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Failed to save task:', error);
      throw error;
    }
  }

  public async getTask(taskId: string): Promise<AgentTask | null> {
    const { data, error } = await supabase
      .from('agent_tasks')
      .select('*')
      .eq('task_id', taskId)
      .single();

    if (error) {
      console.error('Failed to get task:', error);
      return null;
    }

    return this.mapDbRowToTask(data);
  }

  public async getTasksByStatus(status: string): Promise<AgentTask[]> {
    const { data, error } = await supabase
      .from('agent_tasks')
      .select('*')
      .eq('status', status)
      .order('scheduled_at', { ascending: true });

    if (error) {
      console.error('Failed to get tasks by status:', error);
      return [];
    }

    return data.map(row => this.mapDbRowToTask(row));
  }

  public async getTasksByAgent(agentId: string): Promise<AgentTask[]> {
    const { data, error } = await supabase
      .from('agent_tasks')
      .select('*')
      .eq('assigned_to', agentId)
      .order('updated_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Failed to get tasks by agent:', error);
      return [];
    }

    return data.map(row => this.mapDbRowToTask(row));
  }

  /**
   * Metrics operations
   */
  public async saveAgentMetrics(agentId: string, metricType: string, value: number, metadata?: any): Promise<void> {
    const { error } = await supabase
      .from('agent_metrics')
      .insert({
        agent_id: agentId,
        metric_type: metricType,
        value,
        metadata: metadata || {}
      });

    if (error) {
      console.error('Failed to save agent metrics:', error);
      throw error;
    }
  }

  public async getAgentMetrics(
    agentId: string,
    metricType?: string,
    timeRange?: { start: Date; end: Date }
  ): Promise<any[]> {
    let query = supabase
      .from('agent_metrics')
      .select('*')
      .eq('agent_id', agentId)
      .order('timestamp', { ascending: false });

    if (metricType) {
      query = query.eq('metric_type', metricType);
    }

    if (timeRange) {
      query = query
        .gte('timestamp', timeRange.start.toISOString())
        .lte('timestamp', timeRange.end.toISOString());
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to get agent metrics:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Content operations
   */
  public async saveGeneratedContent(content: {
    contentId: string;
    type: string;
    agentId: string;
    url: string;
    metadata?: any;
    qualityScore?: number;
    viralPotential?: number;
  }): Promise<void> {
    const { error } = await supabase
      .from('content_generated')
      .insert({
        content_id: content.contentId,
        type: content.type,
        agent_id: content.agentId,
        url: content.url,
        metadata: content.metadata || {},
        quality_score: content.qualityScore,
        viral_potential: content.viralPotential
      });

    if (error) {
      console.error('Failed to save generated content:', error);
      throw error;
    }
  }

  public async getGeneratedContent(filters?: {
    type?: string;
    agentId?: string;
    minQualityScore?: number;
    limit?: number;
  }): Promise<any[]> {
    let query = supabase
      .from('content_generated')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.type) {
      query = query.eq('type', filters.type);
    }

    if (filters?.agentId) {
      query = query.eq('agent_id', filters.agentId);
    }

    if (filters?.minQualityScore) {
      query = query.gte('quality_score', filters.minQualityScore);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to get generated content:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Event operations
   */
  public async saveEvent(event: AgentEvent): Promise<void> {
    const { error } = await supabase
      .from('agent_events')
      .insert({
        event_id: event.id,
        type: event.type,
        source: event.source,
        target: event.target,
        payload: event.payload,
        priority: event.priority
      });

    if (error) {
      console.error('Failed to save event:', error);
      throw error;
    }
  }

  public async getUnprocessedEvents(): Promise<AgentEvent[]> {
    const { data, error } = await supabase
      .from('agent_events')
      .select('*')
      .eq('processed', false)
      .order('created_at', { ascending: true })
      .limit(100);

    if (error) {
      console.error('Failed to get unprocessed events:', error);
      return [];
    }

    return data.map(row => this.mapDbRowToEvent(row));
  }

  public async markEventProcessed(eventId: string): Promise<void> {
    const { error } = await supabase
      .from('agent_events')
      .update({ processed: true })
      .eq('event_id', eventId);

    if (error) {
      console.error('Failed to mark event as processed:', error);
    }
  }

  /**
   * Storage operations
   */
  public async uploadAgentContent(
    bucket: string,
    path: string,
    file: File | Blob,
    metadata?: any
  ): Promise<string | null> {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        metadata: metadata || {}
      });

    if (error) {
      console.error('Failed to upload agent content:', error);
      return null;
    }

    return data.path;
  }

  public async getPublicUrl(bucket: string, path: string): Promise<string | null> {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return data.publicUrl;
  }

  public async deleteAgentContent(bucket: string, paths: string[]): Promise<void> {
    const { error } = await supabase.storage
      .from(bucket)
      .remove(paths);

    if (error) {
      console.error('Failed to delete agent content:', error);
    }
  }

  /**
   * Integration with existing personas system
   */
  public async getPersonasForAgent(agentId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('user_personas')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to get personas:', error);
      return [];
    }

    return data || [];
  }

  public async getTrendingHashtags(platform?: string, limit: number = 50): Promise<any[]> {
    let query = supabase
      .rpc('get_trending_hashtags', {
        time_window: '24 hours',
        min_usage_count: 5
      });

    // This would be implemented as a Supabase function
    // For now, we'll return mock data
    return [
      { hashtag: '#AIContent', growth: 245, platform: 'tiktok', usage_count: 1250 },
      { hashtag: '#ViralVideo', growth: 189, platform: 'instagram', usage_count: 892 },
      { hashtag: '#TechTrends', growth: 156, platform: 'youtube', usage_count: 567 }
    ];
  }

  /**
   * Utility methods
   */
  private mapDbRowToAgent(row: any): Agent {
    return {
      id: row.agent_id,
      name: row.name,
      type: row.type,
      capabilities: row.capabilities || [],
      status: row.status,
      currentTask: row.current_task,
      performance: row.performance || {},
      memoryAccess: {
        canRead: ['shared'],
        canWrite: ['private'],
        canDelete: ['private'],
        scope: 'group'
      },
      configuration: row.configuration || {},
      hooks: {}
    } as Agent;
  }

  private mapDbRowToTask(row: any): AgentTask {
    return {
      id: row.task_id,
      type: row.type,
      priority: row.priority,
      payload: row.payload || {},
      dependencies: row.dependencies || [],
      scheduledAt: new Date(row.scheduled_at),
      deadline: row.deadline ? new Date(row.deadline) : undefined,
      retryCount: row.retry_count,
      maxRetries: row.max_retries,
      status: row.status,
      createdBy: row.created_by,
      assignedTo: row.assigned_to,
      result: row.result,
      metadata: {}
    } as AgentTask;
  }

  private mapDbRowToEvent(row: any): AgentEvent {
    return {
      id: row.event_id,
      type: row.type,
      source: row.source,
      target: row.target,
      payload: row.payload || {},
      timestamp: new Date(row.created_at),
      priority: row.priority
    } as AgentEvent;
  }

  public async cleanup(): Promise<void> {
    // Unsubscribe from realtime channels
    for (const [tableName, subscription] of this.realtimeSubscriptions.entries()) {
      await subscription.unsubscribe();
      console.log(`Unsubscribed from realtime for: ${tableName}`);
    }

    this.realtimeSubscriptions.clear();
  }
}

export const supabaseIntegration = SupabaseIntegration.getInstance();