/**
 * Video Generation Agent Group - Main Export
 * Complete video generation system with specialized agents
 */

// Export core video agents
export { videoComposer, VideoComposer } from './VideoComposer';
export { videoEditor, VideoEditor } from './VideoEditor';
export { videoOptimizer, VideoOptimizer } from './VideoOptimizer';
export { motionGraphics, MotionGraphics } from './MotionGraphics';
export { thumbnailGenerator, ThumbnailGenerator } from './ThumbnailGenerator';

// Export coordinator and integration
export { videoAgentGroup, VideoAgentGroup } from './VideoAgentGroup';
export { videoAgentIntegration, VideoAgentIntegration } from './integration';
export { videoSupabaseIntegration, VideoSupabaseIntegration } from './supabaseIntegration';

// Export types and configuration
export * from './types';
export {
  VIDEO_AGENT_CONFIG,
  PLATFORM_FORMATS,
  VIRAL_TEMPLATES,
  AI_MODELS,
  CLAUDE_FLOW_PATTERNS
} from './config';

// Main initialization function
export async function initializeVideoAgentSystem(): Promise<void> {
  console.log('🎬 Initializing Video Agent System...');

  try {
    // Initialize database integration first
    console.log('🗄️ Initializing database integration...');
    await videoSupabaseIntegration.initialize();

    // Initialize individual agents
    console.log('🤖 Initializing video agents...');
    await Promise.all([
      videoComposer.initialize(),
      videoEditor.initialize(),
      videoOptimizer.initialize(),
      motionGraphics.initialize(),
      thumbnailGenerator.initialize()
    ]);

    // Initialize agent group coordinator
    console.log('🎯 Initializing agent group coordinator...');
    await videoAgentGroup.initialize();

    // Initialize integration layer
    console.log('🔗 Initializing integration layer...');
    await videoAgentIntegration.initialize();

    console.log('✅ Video Agent System initialized successfully!');
    console.log('🚀 System ready for video generation workflows');

  } catch (error) {
    console.error('❌ Failed to initialize Video Agent System:', error);
    throw error;
  }
}

// Shutdown function
export async function shutdownVideoAgentSystem(): Promise<void> {
  console.log('🛑 Shutting down Video Agent System...');

  try {
    // Shutdown in reverse order
    await videoAgentIntegration.shutdown();
    await videoAgentGroup.shutdown();
    await videoSupabaseIntegration.cleanup();

    console.log('✅ Video Agent System shutdown complete');

  } catch (error) {
    console.error('❌ Error during video agent system shutdown:', error);
  }
}

// System health check
export async function getVideoSystemHealth(): Promise<{
  status: 'healthy' | 'degraded' | 'error';
  components: Record<string, any>;
  metrics: Record<string, any>;
  recommendations: string[];
}> {
  try {
    const [
      composerStatus,
      editorStatus,
      optimizerStatus,
      motionGraphicsStatus,
      thumbnailStatus,
      groupStatus,
      integrationStatus,
      dbStatus
    ] = await Promise.all([
      videoComposer.getStatus(),
      videoEditor.getStatus(),
      videoOptimizer.getStatus(),
      motionGraphics.getStatus(),
      thumbnailGenerator.getStatus(),
      videoAgentGroup.getStatus(),
      videoAgentIntegration.getIntegrationStatus(),
      videoSupabaseIntegration.getStatus()
    ]);

    const components = {
      videoComposer: {
        status: composerStatus.isInitialized ? 'healthy' : 'error',
        activeJobs: composerStatus.activeJobs || 0
      },
      videoEditor: {
        status: editorStatus.isInitialized ? 'healthy' : 'error',
        activeProjects: editorStatus.activeProjects || 0
      },
      videoOptimizer: {
        status: optimizerStatus.isInitialized ? 'healthy' : 'error',
        activeOptimizations: optimizerStatus.activeOptimizations || 0
      },
      motionGraphics: {
        status: motionGraphicsStatus.isInitialized ? 'healthy' : 'error',
        activeJobs: motionGraphicsStatus.activeJobs || 0
      },
      thumbnailGenerator: {
        status: thumbnailStatus.isInitialized ? 'healthy' : 'error',
        activeJobs: thumbnailStatus.activeJobs || 0
      },
      agentGroup: {
        status: groupStatus.isInitialized ? 'healthy' : 'error',
        activePipelines: groupStatus.activePipelines || 0
      },
      integration: {
        status: integrationStatus.isInitialized ? 'healthy' : 'error',
        activeIntegrations: integrationStatus.activeIntegrations?.length || 0
      },
      database: {
        status: dbStatus.isInitialized ? 'healthy' : 'error',
        tablesCount: dbStatus.tablesCount || 0
      }
    };

    const metrics = {
      totalActiveJobs: Object.values(components).reduce((sum, comp) =>
        sum + (comp.activeJobs || comp.activeProjects || comp.activeOptimizations || comp.activePipelines || 0), 0
      ),
      systemUtilization: calculateSystemUtilization(components),
      overallHealth: calculateOverallHealth(components)
    };

    let status: 'healthy' | 'degraded' | 'error' = 'healthy';
    const componentStatuses = Object.values(components).map(c => c.status);

    if (componentStatuses.includes('error')) {
      status = 'error';
    } else if (metrics.systemUtilization > 0.9) {
      status = 'degraded';
    }

    const recommendations = generateHealthRecommendations(components, metrics);

    return {
      status,
      components,
      metrics,
      recommendations
    };

  } catch (error) {
    console.error('Failed to get video system health:', error);
    return {
      status: 'error',
      components: {},
      metrics: {},
      recommendations: ['System health check failed - investigate error logs']
    };
  }
}

function calculateSystemUtilization(components: Record<string, any>): number {
  const maxCapacity = Object.keys(components).length * 5; // Assume 5 max jobs per component
  const currentLoad = Object.values(components).reduce((sum, comp) =>
    sum + (comp.activeJobs || comp.activeProjects || comp.activeOptimizations || comp.activePipelines || 0), 0
  );
  return currentLoad / maxCapacity;
}

function calculateOverallHealth(components: Record<string, any>): number {
  const healthyComponents = Object.values(components).filter(c => c.status === 'healthy').length;
  return healthyComponents / Object.keys(components).length;
}

function generateHealthRecommendations(components: Record<string, any>, metrics: Record<string, any>): string[] {
  const recommendations = [];

  if (metrics.overallHealth < 0.8) {
    recommendations.push('Multiple components are unhealthy - check system logs');
  }

  if (metrics.systemUtilization > 0.8) {
    recommendations.push('High system utilization - consider scaling resources');
  }

  // Component-specific recommendations
  Object.entries(components).forEach(([name, component]) => {
    if (component.status === 'error') {
      recommendations.push(`${name} is not functioning - restart required`);
    }
  });

  if (recommendations.length === 0) {
    recommendations.push('All systems operating normally');
  }

  return recommendations;
}

// Quick start helpers for common video operations
export const videoQuickStart = {
  /**
   * Create a viral TikTok video from a text prompt
   */
  async createTikTokVideo(prompt: string, options: any = {}): Promise<string> {
    return await videoAgentGroup.createVideoContent({
      prompt,
      type: 'text-to-video',
      targetPlatforms: ['tiktok'],
      duration: options.duration || 30,
      style: 'viral',
      aspectRatio: '9:16',
      includeCallToAction: true,
      viralOptimization: {
        clickbaitLevel: 8,
        emotionalImpact: 9,
        curiosityGap: true
      },
      ...options
    });
  },

  /**
   * Create an Instagram Reels video
   */
  async createInstagramReels(prompt: string, options: any = {}): Promise<string> {
    return await videoAgentGroup.createVideoContent({
      prompt,
      type: 'text-to-video',
      targetPlatforms: ['instagram-reels'],
      duration: options.duration || 30,
      style: options.style || 'professional',
      aspectRatio: '9:16',
      includeMotionGraphics: true,
      ...options
    });
  },

  /**
   * Create a YouTube Short
   */
  async createYouTubeShort(prompt: string, options: any = {}): Promise<string> {
    return await videoAgentGroup.createVideoContent({
      prompt,
      type: 'text-to-video',
      targetPlatforms: ['youtube-shorts'],
      duration: options.duration || 60,
      style: options.style || 'energetic',
      aspectRatio: '9:16',
      includeIntro: true,
      includeCallToAction: true,
      ...options
    });
  },

  /**
   * Create video from image sequence
   */
  async createVideoFromImages(images: string[], options: any = {}): Promise<string> {
    return await videoAgentIntegration.createVideoFromImages(images, {
      duration: options.duration || images.length * 3,
      platforms: options.platforms || ['tiktok', 'instagram-reels'],
      transitionStyle: options.transitionStyle || 'smooth',
      includeGraphics: options.includeGraphics !== false,
      style: options.style || 'viral',
      ...options
    });
  },

  /**
   * Create complete viral content package
   */
  async createViralContentPackage(concept: string, platforms: string[] = ['tiktok']): Promise<any> {
    return await videoAgentIntegration.createViralContentFromConcept(concept, platforms);
  },

  /**
   * Optimize existing video for multiple platforms
   */
  async optimizeForPlatforms(videoUrl: string, platforms: string[]): Promise<any> {
    return await videoOptimizer.optimizeVideo({
      videoUrl,
      targetPlatforms: platforms as any[],
      optimizationGoals: ['engagement', 'quality'],
      quality: 'high'
    });
  }
};

// Export default with main functionality
export default {
  // Initialization
  initialize: initializeVideoAgentSystem,
  shutdown: shutdownVideoAgentSystem,
  getSystemHealth: getVideoSystemHealth,

  // Quick start methods
  quickStart: videoQuickStart,

  // Individual agents
  agents: {
    composer: videoComposer,
    editor: videoEditor,
    optimizer: videoOptimizer,
    motionGraphics: motionGraphics,
    thumbnailGenerator: thumbnailGenerator
  },

  // Coordination and integration
  coordinator: videoAgentGroup,
  integration: videoAgentIntegration,
  database: videoSupabaseIntegration,

  // Configuration
  config: VIDEO_AGENT_CONFIG,
  platforms: PLATFORM_FORMATS,
  templates: VIRAL_TEMPLATES
};