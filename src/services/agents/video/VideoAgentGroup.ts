/**
 * VideoAgentGroup Coordinator
 * Orchestrates video generation pipeline with specialized agents
 */

import {
  VideoProject,
  VideoPipeline,
  VideoAgentTask,
  VideoComposerInput,
  VideoEditorInput,
  VideoOptimizerInput,
  MotionGraphicsInput,
  ThumbnailGeneratorInput,
  PlatformVideoFormat
} from './types';
import { VIDEO_AGENT_CONFIG, PLATFORM_FORMATS, CLAUDE_FLOW_PATTERNS } from './config';
import { memoryManager } from '../MemoryManager';
import { communicationProtocol } from '../CommunicationProtocol';
import { claudeFlowIntegration } from '../ClaudeFlowIntegration';

// Import individual agents
import { videoComposer } from './VideoComposer';
import { videoEditor } from './VideoEditor';
import { videoOptimizer } from './VideoOptimizer';
import { motionGraphics } from './MotionGraphics';
import { thumbnailGenerator } from './ThumbnailGenerator';

export class VideoAgentGroup {
  private groupId: string;
  private isInitialized: boolean = false;
  private activePipelines: Map<string, VideoPipeline> = new Map();
  private memoryKey: string = 'video-agent-group';

  constructor(groupId: string = 'video-production-pipeline') {
    this.groupId = groupId;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log(`🎬 Initializing VideoAgentGroup ${this.groupId}...`);

      // Initialize memory store
      await memoryManager.createStore(this.memoryKey, {
        pipelines: {},
        projects: {},
        performance: {
          totalPipelines: 0,
          averageCompletionTime: 0,
          successRate: 0,
          agentUtilization: {}
        },
        coordination: {
          activeAgents: [],
          messageQueue: [],
          sessionStates: {}
        }
      });

      // Initialize all video agents
      console.log('🔧 Initializing video agents...');
      await Promise.all([
        videoComposer.initialize(),
        videoEditor.initialize(),
        videoOptimizer.initialize(),
        motionGraphics.initialize(),
        thumbnailGenerator.initialize()
      ]);

      // Register group with communication protocol
      await communicationProtocol.registerAgent(this.groupId, 'video_pipeline_coordinator', {
        capabilities: [
          'video-pipeline-orchestration',
          'multi-agent-coordination',
          'quality-assurance',
          'platform-optimization',
          'viral-content-creation',
          'automated-workflows',
          'performance-monitoring',
          'error-recovery'
        ],
        status: 'ready',
        maxConcurrentTasks: VIDEO_AGENT_CONFIG.general.maxConcurrentTasks * 2
      });

      // Initialize Claude Flow integration
      await claudeFlowIntegration.initializeSwarm(this.groupId, {
        topology: CLAUDE_FLOW_PATTERNS.video_pipeline.topology,
        agents: CLAUDE_FLOW_PATTERNS.video_pipeline.agents,
        coordination: CLAUDE_FLOW_PATTERNS.video_pipeline.coordination,
        monitoring: CLAUDE_FLOW_PATTERNS.video_pipeline.monitoring
      });

      // Register coordination hooks
      await claudeFlowIntegration.registerHooks(this.groupId, {
        preTask: this.handlePrePipeline.bind(this),
        postTask: this.handlePostPipeline.bind(this),
        onError: this.handlePipelineError.bind(this)
      });

      this.isInitialized = true;
      console.log(`✅ VideoAgentGroup ${this.groupId} initialized successfully`);

    } catch (error) {
      console.error(`❌ Failed to initialize VideoAgentGroup ${this.groupId}:`, error);
      throw error;
    }
  }

  async createVideoContent(input: any): Promise<string> {
    if (!this.isInitialized) {
      throw new Error('VideoAgentGroup not initialized');
    }

    const pipelineId = `pipeline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log(`🎬 Starting video content creation pipeline ${pipelineId}`);

    try {
      // Create pipeline configuration
      const pipeline = await this.createPipeline(pipelineId, input);
      this.activePipelines.set(pipelineId, pipeline);

      // Execute pipeline stages
      const result = await this.executePipeline(pipeline);

      // Complete pipeline
      pipeline.status = 'completed';
      pipeline.output = result;
      pipeline.progress.overallProgress = 100;

      console.log(`✅ Video content creation pipeline ${pipelineId} completed successfully`);
      return result.finalVideoUrl;

    } catch (error) {
      await this.handlePipelineError({ pipelineId, error: error.message });
      throw error;
    } finally {
      this.activePipelines.delete(pipelineId);
    }
  }

  private async createPipeline(pipelineId: string, input: any): Promise<VideoPipeline> {
    const pipeline: VideoPipeline = {
      id: pipelineId,
      name: `Video Production Pipeline - ${input.title || 'Untitled'}`,
      description: 'Complete video content creation workflow',
      stages: await this.determinePipelineStages(input),
      status: 'pending',
      input,
      progress: {
        currentStage: '',
        completedStages: [],
        totalStages: 0,
        overallProgress: 0
      },
      performance: {
        startTime: new Date(),
        stageTimings: {}
      },
      configuration: {
        parallelism: this.determineParallelism(input),
        timeout: VIDEO_AGENT_CONFIG.general.defaultTimeout * 5, // Extended for pipeline
        failureHandling: 'retry',
        qualityChecks: true
      }
    };

    pipeline.progress.totalStages = pipeline.stages.length;

    // Store pipeline
    await memoryManager.store(`${this.memoryKey}/pipelines/${pipelineId}`, pipeline);

    return pipeline;
  }

  private async determinePipelineStages(input: any): Promise<any[]> {
    const stages = [];

    // Stage 1: Content Generation (Required)
    stages.push({
      name: 'content_generation',
      agent: 'video_composer',
      dependencies: [],
      parallel: false,
      required: true,
      timeout: 300000, // 5 minutes
      retry: { maxAttempts: 3, backoffStrategy: 'exponential', baseDelay: 5000 }
    });

    // Stage 2: Motion Graphics (Optional, parallel)
    if (input.includeGraphics !== false) {
      stages.push({
        name: 'motion_graphics',
        agent: 'motion_graphics',
        dependencies: [],
        parallel: true,
        required: false,
        timeout: 180000, // 3 minutes
        retry: { maxAttempts: 2, backoffStrategy: 'linear', baseDelay: 3000 }
      });
    }

    // Stage 3: Video Editing (Required)
    stages.push({
      name: 'video_editing',
      agent: 'video_editor',
      dependencies: ['content_generation'],
      parallel: false,
      required: true,
      timeout: 240000, // 4 minutes
      retry: { maxAttempts: 3, backoffStrategy: 'exponential', baseDelay: 5000 }
    });

    // Stage 4: Platform Optimization (Required)
    stages.push({
      name: 'platform_optimization',
      agent: 'video_optimizer',
      dependencies: ['video_editing'],
      parallel: false,
      required: true,
      timeout: 180000, // 3 minutes
      retry: { maxAttempts: 2, backoffStrategy: 'linear', baseDelay: 3000 }
    });

    // Stage 5: Thumbnail Generation (Parallel with optimization)
    stages.push({
      name: 'thumbnail_generation',
      agent: 'thumbnail_generator',
      dependencies: ['video_editing'],
      parallel: true,
      required: true,
      timeout: 120000, // 2 minutes
      retry: { maxAttempts: 2, backoffStrategy: 'linear', baseDelay: 2000 }
    });

    return stages;
  }

  private determineParallelism(input: any): number {
    // Determine how many stages can run in parallel
    const hasParallelStages = input.includeGraphics !== false;
    return hasParallelStages ? 3 : 1;
  }

  private async executePipeline(pipeline: VideoPipeline): Promise<any> {
    console.log(`🚀 Executing pipeline ${pipeline.id}...`);

    pipeline.status = 'running';
    pipeline.performance.startTime = new Date();

    const stageResults = new Map<string, any>();
    const parallelStages = new Set<string>();

    // Execute stages according to dependencies
    for (const stage of pipeline.stages) {
      // Check if dependencies are met
      const dependenciesMet = stage.dependencies.every(dep =>
        pipeline.progress.completedStages.includes(dep)
      );

      if (!dependenciesMet && !stage.parallel) {
        throw new Error(`Dependencies not met for stage ${stage.name}`);
      }

      pipeline.progress.currentStage = stage.name;

      try {
        console.log(`📋 Executing stage: ${stage.name} (agent: ${stage.agent})`);

        const stageStartTime = Date.now();
        const result = await this.executeStage(stage, stageResults, pipeline);

        const stageEndTime = Date.now();
        pipeline.performance.stageTimings[stage.name] = stageEndTime - stageStartTime;

        stageResults.set(stage.name, result);
        pipeline.progress.completedStages.push(stage.name);

        // Update progress
        const progress = (pipeline.progress.completedStages.length / pipeline.progress.totalStages) * 100;
        pipeline.progress.overallProgress = progress;

        await this.updatePipelineProgress(pipeline.id, progress);

        console.log(`✅ Stage ${stage.name} completed successfully`);

      } catch (error) {
        console.error(`❌ Stage ${stage.name} failed:`, error);

        if (stage.required) {
          throw new Error(`Required stage ${stage.name} failed: ${error.message}`);
        } else {
          console.warn(`⚠️ Optional stage ${stage.name} failed, continuing pipeline`);
        }
      }
    }

    // Compile final results
    const finalResult = await this.compilePipelineResults(stageResults, pipeline);

    pipeline.performance.endTime = new Date();
    pipeline.performance.duration = pipeline.performance.endTime.getTime() - pipeline.performance.startTime.getTime();

    return finalResult;
  }

  private async executeStage(stage: any, previousResults: Map<string, any>, pipeline: VideoPipeline): Promise<any> {
    const agentInput = await this.prepareStageInput(stage, previousResults, pipeline);

    switch (stage.agent) {
      case 'video_composer':
        return await this.executeVideoComposerStage(agentInput, stage);

      case 'video_editor':
        return await this.executeVideoEditorStage(agentInput, stage);

      case 'video_optimizer':
        return await this.executeVideoOptimizerStage(agentInput, stage);

      case 'motion_graphics':
        return await this.executeMotionGraphicsStage(agentInput, stage);

      case 'thumbnail_generator':
        return await this.executeThumbnailGeneratorStage(agentInput, stage);

      default:
        throw new Error(`Unknown agent: ${stage.agent}`);
    }
  }

  private async prepareStageInput(stage: any, previousResults: Map<string, any>, pipeline: VideoPipeline): Promise<any> {
    const baseInput = pipeline.input;

    switch (stage.name) {
      case 'content_generation':
        return this.prepareVideoComposerInput(baseInput);

      case 'video_editing':
        const videoResult = previousResults.get('content_generation');
        return this.prepareVideoEditorInput(baseInput, videoResult);

      case 'platform_optimization':
        const editedVideo = previousResults.get('video_editing');
        return this.prepareVideoOptimizerInput(baseInput, editedVideo);

      case 'motion_graphics':
        return this.prepareMotionGraphicsInput(baseInput);

      case 'thumbnail_generation':
        const finalVideo = previousResults.get('video_editing') || previousResults.get('content_generation');
        return this.prepareThumbnailGeneratorInput(baseInput, finalVideo);

      default:
        return baseInput;
    }
  }

  private prepareVideoComposerInput(input: any): VideoComposerInput {
    return {
      type: input.type || 'text-to-video',
      prompt: input.prompt || input.description || 'Create engaging video content',
      duration: input.duration || 30,
      style: input.style || 'viral',
      mood: input.mood || 'energetic',
      aspectRatio: input.aspectRatio || '9:16',
      framerate: input.framerate || 30,
      quality: input.quality || 'high',
      parameters: {
        motionIntensity: input.motionIntensity || 0.8,
        cameraMovement: input.cameraMovement || 'dynamic',
        visualComplexity: input.visualComplexity || 0.7,
        colorPalette: input.colorPalette || ['#FF6B6B', '#4ECDC4', '#45B7D1'],
        sceneTransitions: true
      }
    };
  }

  private prepareVideoEditorInput(input: any, videoResult: any): VideoEditorInput {
    const operations = [];

    // Add intro graphics if motion graphics are included
    if (input.includeIntro !== false) {
      operations.push({
        type: 'add_overlay',
        target: 'main_video',
        parameters: {
          overlayType: 'intro',
          startTime: 0,
          endTime: 3,
          content: { text: input.title || 'Amazing Content' }
        }
      });
    }

    // Add call-to-action at the end
    if (input.includeCallToAction !== false) {
      operations.push({
        type: 'add_overlay',
        target: 'main_video',
        parameters: {
          overlayType: 'call_to_action',
          startTime: (input.duration || 30) - 5,
          endTime: input.duration || 30,
          content: { text: 'Follow for more!' }
        }
      });
    }

    // Add transitions between scenes
    operations.push({
      type: 'add_transition',
      target: 'scene_transitions',
      parameters: {
        transitionType: 'fade',
        duration: 0.5
      }
    });

    return {
      projectId: `project-${videoResult.id}`,
      operations,
      renderSettings: {
        quality: input.quality || 'high',
        format: 'mp4',
        optimization: 'balanced'
      }
    };
  }

  private prepareVideoOptimizerInput(input: any, editedVideo: any): VideoOptimizerInput {
    return {
      videoUrl: editedVideo.url,
      targetPlatforms: input.targetPlatforms || ['tiktok', 'instagram-reels', 'youtube-shorts'],
      optimizationGoals: input.optimizationGoals || ['engagement', 'quality', 'file_size'],
      quality: input.quality || 'high'
    };
  }

  private prepareMotionGraphicsInput(input: any): MotionGraphicsInput {
    return {
      type: 'intro',
      duration: 3,
      style: input.style || 'viral',
      content: {
        text: input.title || 'Amazing Content',
        colors: input.colorPalette || ['#FF6B6B', '#4ECDC4'],
        brand: input.brand || {}
      },
      animation: {
        type: 'bounce',
        intensity: 0.8,
        timing: 'ease-out'
      },
      targetDimensions: {
        width: 1080,
        height: 1920
      }
    };
  }

  private prepareThumbnailGeneratorInput(input: any, videoResult: any): ThumbnailGeneratorInput {
    return {
      videoUrl: videoResult.url,
      style: input.thumbnailStyle || 'viral',
      platform: input.primaryPlatform || 'tiktok',
      text: input.title ? {
        title: input.title,
        style: 'bold'
      } : undefined,
      elements: {
        faces: input.includeFaces !== false,
        emotions: true,
        objects: true,
        text: !!input.title,
        graphics: true
      },
      viralOptimization: {
        clickbaitLevel: input.clickbaitLevel || 8,
        emotionalImpact: input.emotionalImpact || 8,
        curiosityGap: input.curiosityGap !== false
      }
    };
  }

  private async executeVideoComposerStage(input: VideoComposerInput, stage: any): Promise<any> {
    console.log('🎥 Executing video composition...');
    return await this.executeWithRetry(
      () => videoComposer.generateVideo(input),
      stage.retry
    );
  }

  private async executeVideoEditorStage(input: VideoEditorInput, stage: any): Promise<any> {
    console.log('✂️ Executing video editing...');
    return await this.executeWithRetry(
      () => videoEditor.editVideo(input),
      stage.retry
    );
  }

  private async executeVideoOptimizerStage(input: VideoOptimizerInput, stage: any): Promise<any> {
    console.log('⚡ Executing video optimization...');
    return await this.executeWithRetry(
      () => videoOptimizer.optimizeVideo(input),
      stage.retry
    );
  }

  private async executeMotionGraphicsStage(input: MotionGraphicsInput, stage: any): Promise<any> {
    console.log('✨ Executing motion graphics creation...');
    return await this.executeWithRetry(
      () => motionGraphics.createMotionGraphics(input),
      stage.retry
    );
  }

  private async executeThumbnailGeneratorStage(input: ThumbnailGeneratorInput, stage: any): Promise<any> {
    console.log('🖼️ Executing thumbnail generation...');
    return await this.executeWithRetry(
      () => thumbnailGenerator.generateThumbnail(input),
      stage.retry
    );
  }

  private async executeWithRetry(operation: () => Promise<any>, retryConfig: any): Promise<any> {
    let lastError;

    for (let attempt = 1; attempt <= retryConfig.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        console.warn(`⚠️ Attempt ${attempt} failed:`, error.message);

        if (attempt < retryConfig.maxAttempts) {
          const delay = retryConfig.backoffStrategy === 'exponential' ?
            retryConfig.baseDelay * Math.pow(2, attempt - 1) :
            retryConfig.baseDelay;

          console.log(`🔄 Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }

  private async compilePipelineResults(stageResults: Map<string, any>, pipeline: VideoPipeline): Promise<any> {
    console.log('📊 Compiling pipeline results...');

    const videoGeneration = stageResults.get('content_generation');
    const videoEditing = stageResults.get('video_editing');
    const optimization = stageResults.get('platform_optimization');
    const motionGraphics = stageResults.get('motion_graphics');
    const thumbnails = stageResults.get('thumbnail_generation');

    const finalResult = {
      pipelineId: pipeline.id,
      finalVideoUrl: videoEditing || videoGeneration,
      optimizedVersions: optimization || [],
      thumbnails: thumbnails || null,
      motionGraphics: motionGraphics || null,
      metadata: {
        totalProcessingTime: pipeline.performance.duration,
        stageTimings: pipeline.performance.stageTimings,
        completedStages: pipeline.progress.completedStages,
        quality: 'high',
        platforms: pipeline.input.targetPlatforms || ['tiktok'],
        viralScore: this.calculateOverallViralScore(stageResults),
        analytics: await this.generatePipelineAnalytics(stageResults, pipeline)
      }
    };

    // Store final result
    await memoryManager.store(`${this.memoryKey}/results/${pipeline.id}`, finalResult);

    return finalResult;
  }

  private calculateOverallViralScore(results: Map<string, any>): number {
    let totalScore = 0;
    let scoreCount = 0;

    // Collect viral scores from various stages
    for (const [stageName, result] of results) {
      if (result && typeof result === 'object') {
        if (result.viralScore) {
          totalScore += result.viralScore;
          scoreCount++;
        }
        if (result.metadata?.viralScore) {
          totalScore += result.metadata.viralScore;
          scoreCount++;
        }
        if (result.analytics?.viralPotential?.score) {
          totalScore += result.analytics.viralPotential.score;
          scoreCount++;
        }
      }
    }

    return scoreCount > 0 ? totalScore / scoreCount : 0.75; // Default score
  }

  private async generatePipelineAnalytics(results: Map<string, any>, pipeline: VideoPipeline): Promise<any> {
    return {
      performance: {
        totalTime: pipeline.performance.duration,
        stageBreakdown: pipeline.performance.stageTimings,
        bottlenecks: this.identifyBottlenecks(pipeline.performance.stageTimings),
        efficiency: this.calculateEfficiency(pipeline.performance.stageTimings)
      },
      quality: {
        overallScore: this.calculateQualityScore(results),
        stageQuality: this.extractStageQuality(results)
      },
      viral: {
        potential: this.calculateOverallViralScore(results),
        factors: this.identifyViralFactors(results),
        recommendations: this.generateViralRecommendations(results)
      },
      platforms: {
        optimization: this.analyzePlatformOptimization(results),
        compatibility: this.checkPlatformCompatibility(results)
      }
    };
  }

  private identifyBottlenecks(stageTimings: Record<string, number>): string[] {
    const avgTime = Object.values(stageTimings).reduce((a, b) => a + b, 0) / Object.values(stageTimings).length;
    return Object.entries(stageTimings)
      .filter(([, time]) => time > avgTime * 1.5)
      .map(([stage]) => stage);
  }

  private calculateEfficiency(stageTimings: Record<string, number>): number {
    const totalTime = Object.values(stageTimings).reduce((a, b) => a + b, 0);
    const expectedTime = Object.keys(stageTimings).length * 120000; // 2 minutes per stage expected
    return Math.max(0, 1 - (totalTime - expectedTime) / expectedTime);
  }

  private calculateQualityScore(results: Map<string, any>): number {
    let totalQuality = 0;
    let qualityCount = 0;

    for (const [, result] of results) {
      if (result && result.metadata?.qualityScore) {
        totalQuality += result.metadata.qualityScore;
        qualityCount++;
      }
    }

    return qualityCount > 0 ? totalQuality / qualityCount : 0.8;
  }

  private extractStageQuality(results: Map<string, any>): Record<string, number> {
    const stageQuality: Record<string, number> = {};

    for (const [stageName, result] of results) {
      if (result && result.metadata?.qualityScore) {
        stageQuality[stageName] = result.metadata.qualityScore;
      } else {
        stageQuality[stageName] = 0.8; // Default quality
      }
    }

    return stageQuality;
  }

  private identifyViralFactors(results: Map<string, any>): string[] {
    const factors = [];

    // Check for viral elements from different stages
    if (results.has('thumbnail_generation')) {
      factors.push('optimized_thumbnail');
    }
    if (results.has('motion_graphics')) {
      factors.push('engaging_graphics');
    }
    if (results.has('platform_optimization')) {
      factors.push('platform_specific_optimization');
    }

    return factors;
  }

  private generateViralRecommendations(results: Map<string, any>): string[] {
    const recommendations = [];

    // Analyze results and generate recommendations
    const thumbnailResult = results.get('thumbnail_generation');
    if (thumbnailResult?.analytics?.recommendations) {
      recommendations.push(...thumbnailResult.analytics.recommendations);
    }

    const optimizationResult = results.get('platform_optimization');
    if (optimizationResult?.analytics?.viralPotential?.recommendations) {
      recommendations.push(...optimizationResult.analytics.viralPotential.recommendations);
    }

    // Add general recommendations
    recommendations.push(
      'Post during peak engagement hours',
      'Use trending hashtags relevant to your content',
      'Engage with comments quickly after posting'
    );

    return recommendations.slice(0, 5); // Limit to top 5
  }

  private analyzePlatformOptimization(results: Map<string, any>): any {
    const optimizationResult = results.get('platform_optimization');
    if (optimizationResult && Array.isArray(optimizationResult)) {
      return {
        totalPlatforms: optimizationResult.length,
        averageQuality: optimizationResult.reduce((sum, opt) => sum + (opt.analytics?.qualityScore || 0), 0) / optimizationResult.length,
        avgCompressionRatio: optimizationResult.reduce((sum, opt) => sum + (opt.analytics?.compressionRatio || 0), 0) / optimizationResult.length
      };
    }
    return { totalPlatforms: 0, averageQuality: 0, avgCompressionRatio: 0 };
  }

  private checkPlatformCompatibility(results: Map<string, any>): Record<string, boolean> {
    const compatibility: Record<string, boolean> = {};
    const optimizationResult = results.get('platform_optimization');

    if (optimizationResult && Array.isArray(optimizationResult)) {
      for (const optimization of optimizationResult) {
        compatibility[optimization.platform] = optimization.status === 'completed';
      }
    }

    return compatibility;
  }

  private async updatePipelineProgress(pipelineId: string, progress: number): Promise<void> {
    await communicationProtocol.broadcast({
      type: 'pipeline_progress',
      agentId: this.groupId,
      data: { pipelineId, progress },
      timestamp: Date.now()
    });
  }

  // Claude Flow hook handlers
  private async handlePrePipeline(context: any): Promise<void> {
    console.log(`🔄 Pre-pipeline hook: ${context.operation} for pipeline ${context.taskId}`);

    // Initialize swarm session
    await claudeFlowIntegration.createSession(context.taskId, {
      sessionType: 'video_pipeline',
      agents: CLAUDE_FLOW_PATTERNS.video_pipeline.agents,
      configuration: context.input
    });
  }

  private async handlePostPipeline(context: any): Promise<void> {
    console.log(`✅ Post-pipeline hook: ${context.operation} completed for pipeline ${context.taskId}`);

    // Store session results
    await claudeFlowIntegration.storeSessionResults(context.taskId, {
      result: context.result,
      performance: context.performance
    });
  }

  private async handlePipelineError(context: any): Promise<void> {
    console.error(`🚨 Pipeline error: ${context.error} for pipeline ${context.pipelineId}`);

    const pipeline = this.activePipelines.get(context.pipelineId);
    if (pipeline) {
      pipeline.status = 'failed';
      pipeline.performance.endTime = new Date();

      // Store error information
      await memoryManager.store(`${this.memoryKey}/errors/${context.pipelineId}`, {
        error: context.error,
        pipeline,
        timestamp: Date.now()
      });
    }
  }

  // Public API methods
  async getStatus(): Promise<any> {
    const agentStatuses = await Promise.all([
      videoComposer.getStatus(),
      videoEditor.getStatus(),
      videoOptimizer.getStatus(),
      motionGraphics.getStatus(),
      thumbnailGenerator.getStatus()
    ]);

    return {
      groupId: this.groupId,
      isInitialized: this.isInitialized,
      activePipelines: this.activePipelines.size,
      agents: {
        videoComposer: agentStatuses[0],
        videoEditor: agentStatuses[1],
        videoOptimizer: agentStatuses[2],
        motionGraphics: agentStatuses[3],
        thumbnailGenerator: agentStatuses[4]
      },
      capabilities: [
        'complete-video-production',
        'multi-platform-optimization',
        'viral-content-creation'
      ]
    };
  }

  async getPipelineStatus(pipelineId: string): Promise<VideoPipeline | null> {
    return this.activePipelines.get(pipelineId) || null;
  }

  async getActivePipelines(): Promise<VideoPipeline[]> {
    return Array.from(this.activePipelines.values());
  }

  async shutdown(): Promise<void> {
    console.log(`🛑 Shutting down VideoAgentGroup ${this.groupId}...`);

    // Cancel active pipelines
    for (const [pipelineId] of this.activePipelines) {
      await this.handlePipelineError({ pipelineId, error: 'System shutdown' });
    }

    // Shutdown individual agents
    await Promise.all([
      videoComposer.shutdown(),
      videoEditor.shutdown(),
      videoOptimizer.shutdown(),
      motionGraphics.shutdown(),
      thumbnailGenerator.shutdown()
    ]);

    this.activePipelines.clear();
    this.isInitialized = false;
    console.log(`✅ VideoAgentGroup ${this.groupId} shutdown complete`);
  }
}

// Export singleton instance
export const videoAgentGroup = new VideoAgentGroup();
export default videoAgentGroup;