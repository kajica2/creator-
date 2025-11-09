/**
 * VideoComposer Agent
 * AI-powered video creation from text prompts, images, and concepts
 */

import { VideoComposerInput, VideoProject, VideoScene, VideoAgentTask, VideoAgentError, PlatformVideoFormat } from './types';
import { VIDEO_AGENT_CONFIG, AI_MODELS, VIRAL_TEMPLATES, PLATFORM_FORMATS } from './config';
import { memoryManager } from '../MemoryManager';
import { communicationProtocol } from '../CommunicationProtocol';
import { claudeFlowIntegration } from '../ClaudeFlowIntegration';

export class VideoComposer {
  private agentId: string;
  private isInitialized: boolean = false;
  private activeJobs: Map<string, VideoAgentTask> = new Map();
  private memoryKey: string = 'video-composer';

  constructor(agentId: string = 'video-composer-001') {
    this.agentId = agentId;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log(`🎬 Initializing VideoComposer Agent ${this.agentId}...`);

      // Initialize memory store
      await memoryManager.createStore(this.memoryKey, {
        models: AI_MODELS.video_generation,
        templates: VIRAL_TEMPLATES,
        activeJobs: {},
        performance: {
          totalGenerated: 0,
          averageProcessingTime: 0,
          successRate: 0,
          qualityScores: []
        }
      });

      // Register with communication protocol
      await communicationProtocol.registerAgent(this.agentId, 'video_composer', {
        capabilities: [
          'text-to-video',
          'image-to-video',
          'concept-to-video',
          'audio-to-video',
          'style-transfer',
          'duration-control',
          'quality-scaling'
        ],
        status: 'ready',
        maxConcurrentTasks: VIDEO_AGENT_CONFIG.general.maxConcurrentTasks
      });

      // Register Claude Flow hooks
      await claudeFlowIntegration.registerHooks(this.agentId, {
        preTask: this.handlePreTask.bind(this),
        postTask: this.handlePostTask.bind(this),
        onError: this.handleError.bind(this)
      });

      this.isInitialized = true;
      console.log(`✅ VideoComposer Agent ${this.agentId} initialized successfully`);

    } catch (error) {
      console.error(`❌ Failed to initialize VideoComposer Agent ${this.agentId}:`, error);
      throw error;
    }
  }

  async generateVideo(input: VideoComposerInput): Promise<string> {
    if (!this.isInitialized) {
      throw new Error('VideoComposer agent not initialized');
    }

    const taskId = `video-gen-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log(`🎬 Starting video generation task ${taskId}`);

    try {
      // Create and store task
      const task: VideoAgentTask = {
        id: taskId,
        agentType: 'video_composer',
        status: 'pending',
        priority: 'medium',
        input,
        progress: 0,
        createdAt: new Date(),
        metadata: {
          projectId: input.prompt.substring(0, 20).replace(/[^a-zA-Z0-9]/g, '-'),
          sessionId: `session-${Date.now()}`,
          requiredResources: ['gpu', 'storage'],
          dependencies: [],
          retryCount: 0,
          maxRetries: VIDEO_AGENT_CONFIG.general.retryAttempts
        }
      };

      this.activeJobs.set(taskId, task);
      await this.updateMemory();

      // Execute Claude Flow pre-task hooks
      await claudeFlowIntegration.executeHook('preTask', this.agentId, {
        taskId,
        operation: 'generate-video',
        input
      });

      // Update task status
      task.status = 'in_progress';
      task.startedAt = new Date();
      await this.updateProgress(taskId, 10);

      // Validate and optimize input
      const optimizedInput = await this.optimizeInput(input);
      await this.updateProgress(taskId, 20);

      // Select AI model based on requirements
      const selectedModel = await this.selectOptimalModel(optimizedInput);
      await this.updateProgress(taskId, 30);

      // Generate video content
      const videoResult = await this.processVideoGeneration(optimizedInput, selectedModel, taskId);
      await this.updateProgress(taskId, 80);

      // Post-process and optimize
      const finalResult = await this.postProcessVideo(videoResult, optimizedInput);
      await this.updateProgress(taskId, 100);

      // Complete task
      task.status = 'completed';
      task.completedAt = new Date();
      task.output = finalResult;

      // Execute Claude Flow post-task hooks
      await claudeFlowIntegration.executeHook('postTask', this.agentId, {
        taskId,
        operation: 'generate-video',
        result: finalResult,
        performance: {
          duration: task.completedAt.getTime() - task.startedAt!.getTime(),
          success: true
        }
      });

      // Update performance metrics
      await this.updatePerformanceMetrics(task);

      console.log(`✅ Video generation task ${taskId} completed successfully`);
      return finalResult.url;

    } catch (error) {
      await this.handleTaskError(taskId, error);
      throw error;
    } finally {
      this.activeJobs.delete(taskId);
      await this.updateMemory();
    }
  }

  private async optimizeInput(input: VideoComposerInput): Promise<VideoComposerInput> {
    const optimized = { ...input };

    // Enhance prompt with viral elements
    if (input.type === 'text-to-video') {
      optimized.prompt = await this.enhancePromptForVirality(input.prompt);
    }

    // Set optimal parameters based on platform requirements
    if (optimized.aspectRatio) {
      const platformFormat = this.detectPlatformFromAspectRatio(optimized.aspectRatio);
      if (platformFormat) {
        optimized.framerate = platformFormat.framerate;
        if (!optimized.parameters) optimized.parameters = {};
        optimized.parameters.targetPlatform = platformFormat.name;
      }
    }

    // Set default quality if not specified
    if (!optimized.quality) {
      optimized.quality = 'preview';
    }

    // Optimize duration for platform
    if (optimized.duration > 60 && !optimized.aspectRatio?.includes('16:9')) {
      console.log('⚠️ Duration over 60s detected for vertical format, optimizing for short-form content');
      optimized.duration = Math.min(optimized.duration, 60);
    }

    return optimized;
  }

  private async enhancePromptForVirality(prompt: string): Promise<string> {
    const viralElements = VIRAL_TEMPLATES.trending_hooks;
    const emotionalTriggers = VIRAL_TEMPLATES.emotional_triggers;

    // Check if prompt already has viral elements
    const hasViralHook = viralElements.some(hook =>
      prompt.toLowerCase().includes(hook.toLowerCase())
    );

    if (!hasViralHook && Math.random() > 0.5) {
      // Add a random viral hook
      const randomHook = viralElements[Math.floor(Math.random() * viralElements.length)];
      return `${randomHook} ${prompt}`;
    }

    // Enhance with emotional triggers
    const randomEmotion = emotionalTriggers[Math.floor(Math.random() * emotionalTriggers.length)];
    return `${prompt} (${randomEmotion} style)`;
  }

  private detectPlatformFromAspectRatio(aspectRatio: string): PlatformVideoFormat | null {
    const platforms = Object.values(PLATFORM_FORMATS);
    return platforms.find(platform => platform.aspectRatio === aspectRatio) || null;
  }

  private async selectOptimalModel(input: VideoComposerInput): Promise<any> {
    const models = AI_MODELS.video_generation;

    // Model selection logic based on requirements
    if (input.quality === 'ultra' || input.duration > 30) {
      return models.runway; // Best quality for longer/high-quality videos
    }

    if (input.type === 'image-to-video') {
      return models.stable_video; // Optimized for image-to-video
    }

    if (input.quality === 'draft') {
      return models.pika_labs; // Faster, budget option
    }

    // Default to Runway for balanced quality/speed
    return models.runway;
  }

  private async processVideoGeneration(
    input: VideoComposerInput,
    model: any,
    taskId: string
  ): Promise<any> {
    console.log(`🎥 Processing video generation with ${model.endpoint}`);

    // Simulate API call to video generation service
    // In production, this would call the actual AI model API

    const processingSteps = [
      { step: 'Preparing input data', progress: 35 },
      { step: 'Generating keyframes', progress: 45 },
      { step: 'Creating motion interpolation', progress: 60 },
      { step: 'Rendering video frames', progress: 75 },
      { step: 'Finalizing output', progress: 80 }
    ];

    for (const { step, progress } of processingSteps) {
      console.log(`📊 ${step}...`);
      await this.updateProgress(taskId, progress);

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Generate mock video result
    const result = {
      id: `video-${Date.now()}`,
      url: `https://storage.googleapis.com/video-assets/${taskId}.mp4`,
      thumbnailUrl: `https://storage.googleapis.com/video-assets/${taskId}-thumb.jpg`,
      duration: input.duration,
      resolution: this.getResolutionFromInput(input),
      format: 'mp4',
      metadata: {
        model: model.models[0],
        prompt: input.prompt,
        style: input.style || 'default',
        generatedAt: new Date().toISOString(),
        processingTime: Date.now() % 10000, // Mock processing time
        qualityScore: 0.85 + Math.random() * 0.15 // Mock quality score 0.85-1.0
      }
    };

    return result;
  }

  private getResolutionFromInput(input: VideoComposerInput): { width: number; height: number } {
    if (input.aspectRatio) {
      const platform = this.detectPlatformFromAspectRatio(input.aspectRatio);
      if (platform) {
        return platform.resolution;
      }
    }

    // Default to 1080p
    return { width: 1920, height: 1080 };
  }

  private async postProcessVideo(videoResult: any, input: VideoComposerInput): Promise<any> {
    console.log('🔧 Post-processing video...');

    // Add viral optimization
    const viralScore = await this.calculateViralPotential(videoResult, input);

    // Store in memory for other agents
    await memoryManager.store(`${this.memoryKey}/generated/${videoResult.id}`, {
      ...videoResult,
      viralScore,
      input,
      processedAt: new Date().toISOString()
    });

    return {
      ...videoResult,
      viralScore,
      optimizations: {
        viral_potential: viralScore,
        platform_ready: true,
        thumbnail_generated: true
      }
    };
  }

  private async calculateViralPotential(videoResult: any, input: VideoComposerInput): Promise<number> {
    let score = 0.5; // Base score

    // Check for viral elements in prompt
    const prompt = input.prompt.toLowerCase();
    const viralHooks = VIRAL_TEMPLATES.trending_hooks;
    const hasViralHook = viralHooks.some(hook => prompt.includes(hook.toLowerCase()));
    if (hasViralHook) score += 0.2;

    // Check emotional triggers
    const emotionalTriggers = VIRAL_TEMPLATES.emotional_triggers;
    const hasEmotionalTrigger = emotionalTriggers.some(trigger => prompt.includes(trigger));
    if (hasEmotionalTrigger) score += 0.15;

    // Duration optimization (short videos tend to be more viral)
    if (input.duration <= 15) score += 0.1;
    else if (input.duration <= 30) score += 0.05;

    // Quality factor
    score += (videoResult.metadata.qualityScore - 0.5) * 0.2;

    return Math.min(score, 1.0);
  }

  private async updateProgress(taskId: string, progress: number): Promise<void> {
    const task = this.activeJobs.get(taskId);
    if (task) {
      task.progress = progress;

      // Notify other agents of progress
      await communicationProtocol.broadcast({
        type: 'progress_update',
        agentId: this.agentId,
        data: { taskId, progress },
        timestamp: Date.now()
      });
    }
  }

  private async updateMemory(): Promise<void> {
    const memoryData = await memoryManager.retrieve(this.memoryKey);
    if (memoryData) {
      memoryData.activeJobs = Object.fromEntries(this.activeJobs);
      await memoryManager.store(this.memoryKey, memoryData);
    }
  }

  private async updatePerformanceMetrics(task: VideoAgentTask): Promise<void> {
    const memoryData = await memoryManager.retrieve(this.memoryKey);
    if (memoryData?.performance) {
      const processingTime = task.completedAt!.getTime() - task.startedAt!.getTime();
      const qualityScore = task.output?.metadata?.qualityScore || 0;

      memoryData.performance.totalGenerated += 1;
      memoryData.performance.averageProcessingTime =
        (memoryData.performance.averageProcessingTime + processingTime) / 2;
      memoryData.performance.qualityScores.push(qualityScore);
      memoryData.performance.successRate =
        memoryData.performance.qualityScores.filter(score => score > 0.7).length /
        memoryData.performance.qualityScores.length;

      await memoryManager.store(this.memoryKey, memoryData);
    }
  }

  private async handleTaskError(taskId: string, error: any): Promise<void> {
    const task = this.activeJobs.get(taskId);
    if (task) {
      task.status = 'error';
      task.error = error.message;
      task.completedAt = new Date();

      // Execute error hook
      await claudeFlowIntegration.executeHook('onError', this.agentId, {
        taskId,
        error: error.message,
        context: task
      });

      console.error(`❌ Video generation task ${taskId} failed:`, error);
    }
  }

  // Claude Flow hook handlers
  private async handlePreTask(context: any): Promise<void> {
    console.log(`🔄 Pre-task hook: ${context.operation} for task ${context.taskId}`);

    // Resource allocation
    await this.allocateResources(context.taskId);

    // Memory preparation
    await memoryManager.store(`${this.memoryKey}/tasks/${context.taskId}`, {
      startTime: Date.now(),
      operation: context.operation,
      input: context.input
    });
  }

  private async handlePostTask(context: any): Promise<void> {
    console.log(`✅ Post-task hook: ${context.operation} completed for task ${context.taskId}`);

    // Resource cleanup
    await this.releaseResources(context.taskId);

    // Store results in memory for other agents
    await memoryManager.store(`${this.memoryKey}/results/${context.taskId}`, {
      result: context.result,
      performance: context.performance,
      completedAt: Date.now()
    });
  }

  private async handleError(context: any): Promise<void> {
    console.error(`🚨 Error hook: ${context.error} for task ${context.taskId}`);

    // Log error for analysis
    await memoryManager.store(`${this.memoryKey}/errors/${context.taskId}`, {
      error: context.error,
      context: context.context,
      timestamp: Date.now()
    });
  }

  private async allocateResources(taskId: string): Promise<void> {
    // Mock resource allocation
    console.log(`📦 Allocating resources for task ${taskId}`);
  }

  private async releaseResources(taskId: string): Promise<void> {
    // Mock resource cleanup
    console.log(`🧹 Releasing resources for task ${taskId}`);
  }

  // Public API methods
  async getStatus(): Promise<any> {
    return {
      agentId: this.agentId,
      isInitialized: this.isInitialized,
      activeJobs: this.activeJobs.size,
      capabilities: [
        'text-to-video',
        'image-to-video',
        'concept-to-video',
        'audio-to-video'
      ],
      performance: await memoryManager.retrieve(`${this.memoryKey}/performance`)
    };
  }

  async getActiveJobs(): Promise<VideoAgentTask[]> {
    return Array.from(this.activeJobs.values());
  }

  async cancelTask(taskId: string): Promise<boolean> {
    const task = this.activeJobs.get(taskId);
    if (task && task.status === 'in_progress') {
      task.status = 'error';
      task.error = 'Task cancelled by user';
      task.completedAt = new Date();

      this.activeJobs.delete(taskId);
      await this.updateMemory();

      console.log(`🚫 Task ${taskId} cancelled`);
      return true;
    }
    return false;
  }

  async shutdown(): Promise<void> {
    console.log(`🛑 Shutting down VideoComposer Agent ${this.agentId}...`);

    // Cancel all active jobs
    for (const [taskId] of this.activeJobs) {
      await this.cancelTask(taskId);
    }

    // Cleanup memory
    await memoryManager.clear(`${this.memoryKey}/active_jobs`);

    this.isInitialized = false;
    console.log(`✅ VideoComposer Agent ${this.agentId} shutdown complete`);
  }
}

// Export singleton instance
export const videoComposer = new VideoComposer();
export default videoComposer;