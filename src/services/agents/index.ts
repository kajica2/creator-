/**
 * Daily Agent Routine System - Main Export
 *
 * This module provides a comprehensive framework for managing AI agents
 * that handle content generation, analysis, and coordination in the viral
 * hashtag & image AI project.
 */

// Core agent system components
export { agentCoordinator, AgentCoordinator } from './AgentCoordinator';
export { memoryManager, MemoryManager } from './MemoryManager';
export { communicationProtocol, CommunicationProtocol } from './CommunicationProtocol';
export { claudeFlowIntegration, ClaudeFlowIntegration } from './ClaudeFlowIntegration';
export { supabaseIntegration, SupabaseIntegration } from './SupabaseIntegration';

// Configuration
export { dailyAgentRoutineConfig, DailyAgentRoutineConfig } from '../../../config/agents/daily-routine';

// Types
export * from '../../types/agents';

// Communication protocol types
export type {
  AgentMessage,
  MessageType,
  CoordinationSession,
  ConsensusProposal,
  ConsensusRequest,
  AgentVote,
  ConsensusResult,
  ProtocolHandler
} from './CommunicationProtocol';

/**
 * Initialize the complete agent system
 * Call this function to set up all components
 */
export async function initializeAgentSystem(): Promise<void> {
  console.log('🤖 Initializing Daily Agent Routine System...');

  try {
    // Initialize components in dependency order
    console.log('📝 Initializing Memory Manager...');
    await memoryManager.initialize();

    console.log('🔗 Initializing Communication Protocol...');
    await communicationProtocol.initialize();

    console.log('☁️ Initializing Claude-Flow Integration...');
    await claudeFlowIntegration.initialize();

    console.log('🗄️ Initializing Supabase Integration...');
    await supabaseIntegration.initialize();

    console.log('🎯 Initializing Agent Coordinator...');
    await agentCoordinator.initialize();

    console.log('✅ Daily Agent Routine System initialized successfully!');
    console.log('🚀 System ready for agent coordination and task execution');

  } catch (error) {
    console.error('❌ Failed to initialize Agent System:', error);
    throw error;
  }
}

/**
 * Shutdown the agent system gracefully
 * Call this during application shutdown
 */
export async function shutdownAgentSystem(): Promise<void> {
  console.log('🛑 Shutting down Daily Agent Routine System...');

  try {
    // Shutdown components in reverse order
    await agentCoordinator.shutdown();
    await supabaseIntegration.cleanup();

    console.log('✅ Agent System shutdown complete');

  } catch (error) {
    console.error('❌ Error during agent system shutdown:', error);
  }
}

/**
 * Get system health status
 */
export async function getSystemHealth(): Promise<{
  status: 'healthy' | 'degraded' | 'error';
  components: Record<string, any>;
  metrics: Record<string, any>;
  recommendations: string[];
}> {
  try {
    const [
      agentStatus,
      memoryStats,
      communicationStats,
      swarmStatus,
      performanceAnalysis
    ] = await Promise.all([
      agentCoordinator.getAgentStatus(),
      memoryManager.getMemoryStats(),
      communicationProtocol.getMessageStats(),
      claudeFlowIntegration.getSwarmStatus(),
      claudeFlowIntegration.analyzePerformance()
    ]);

    const components = {
      agentCoordinator: {
        status: Array.isArray(agentStatus) ? 'healthy' : 'error',
        activeAgents: Array.isArray(agentStatus) ? agentStatus.length : 0,
        busyAgents: Array.isArray(agentStatus) ? agentStatus.filter(a => a.status === 'busy').length : 0
      },
      memoryManager: {
        status: memoryStats ? 'healthy' : 'error',
        totalStores: memoryStats?.totalStores || 0,
        totalSize: memoryStats?.totalSize || 0
      },
      communicationProtocol: {
        status: communicationStats ? 'healthy' : 'error',
        queuedMessages: communicationStats?.totalQueued || 0,
        activeSubscriptions: communicationStats?.activeSubscriptions || 0
      },
      claudeFlowIntegration: {
        status: swarmStatus?.isInitialized ? 'healthy' : 'error',
        activeAgents: swarmStatus?.activeAgents?.length || 0
      }
    };

    const metrics = {
      systemUtilization: components.agentCoordinator.busyAgents / Math.max(components.agentCoordinator.activeAgents, 1),
      memoryUsage: components.memoryManager.totalSize,
      messageQueueLoad: components.communicationProtocol.queuedMessages,
      overallHealth: performanceAnalysis?.overallSuccessRate || 0
    };

    let status: 'healthy' | 'degraded' | 'error' = 'healthy';

    // Determine overall system status
    const componentStatuses = Object.values(components).map(c => c.status);
    if (componentStatuses.includes('error')) {
      status = 'error';
    } else if (metrics.systemUtilization > 0.9 || metrics.messageQueueLoad > 100) {
      status = 'degraded';
    }

    return {
      status,
      components,
      metrics,
      recommendations: performanceAnalysis?.recommendations || []
    };

  } catch (error) {
    console.error('Failed to get system health:', error);
    return {
      status: 'error',
      components: {},
      metrics: {},
      recommendations: ['System health check failed - investigate error logs']
    };
  }
}

/**
 * Quick start example for common operations
 */
export const quickStart = {
  /**
   * Create a video generation task
   */
  async createVideoTask(prompt: string, duration: number = 30): Promise<string> {
    return await agentCoordinator.createTask({
      type: 'video-create',
      priority: 'high',
      payload: {
        type: 'text-to-video',
        data: {
          prompt,
          duration,
          resolution: '1080x1920',
          style: 'viral-social-media'
        }
      },
      createdBy: 'quick-start-api'
    });
  },

  /**
   * Create an audio generation task
   */
  async createAudioTask(style: string, duration: number = 30): Promise<string> {
    return await agentCoordinator.createTask({
      type: 'audio-create',
      priority: 'medium',
      payload: {
        type: 'background-music',
        data: {
          style,
          duration,
          tempo: 'upbeat',
          mood: 'energetic'
        }
      },
      createdBy: 'quick-start-api'
    });
  },

  /**
   * Analyze content for viral potential
   */
  async analyzeContent(contentUrl: string, contentType: 'video' | 'audio' | 'image'): Promise<string> {
    return await agentCoordinator.createTask({
      type: 'content-analyze',
      priority: 'medium',
      payload: {
        type: 'viral-analysis',
        data: {
          url: contentUrl,
          contentType,
          analysisDepth: 'comprehensive'
        }
      },
      createdBy: 'quick-start-api'
    });
  },

  /**
   * Start a coordination session
   */
  async startVideoProductionPipeline(contentConcept: any): Promise<string> {
    const sessionId = `video-production-${Date.now()}`;

    await communicationProtocol.startCoordination(
      sessionId,
      'pipeline',
      ['video-gen-001', 'video-edit-001', 'video-fx-001'],
      'Complete video production pipeline',
      { contentConcept }
    );

    return sessionId;
  },

  /**
   * Get trending hashtags for content creation
   */
  async getTrendingHashtags(platform?: string): Promise<any[]> {
    return await supabaseIntegration.getTrendingHashtags(platform, 20);
  }
};

// Default export with the main initialization function
export default {
  initialize: initializeAgentSystem,
  shutdown: shutdownAgentSystem,
  getSystemHealth,
  quickStart,

  // Direct access to core components
  agentCoordinator,
  memoryManager,
  communicationProtocol,
  claudeFlowIntegration,
  supabaseIntegration,

  // Configuration
  config: dailyAgentRoutineConfig
};