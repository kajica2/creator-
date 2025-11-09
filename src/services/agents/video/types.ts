/**
 * Video Generation Agent Types
 * Comprehensive type definitions for video generation, editing, and optimization agents
 */

import { PromptType, Hashtag } from '../../../types';

// Platform-specific video format configurations
export interface PlatformVideoFormat {
  name: 'tiktok' | 'instagram-reels' | 'youtube-shorts' | 'twitter' | 'facebook-reels' | 'snapchat';
  aspectRatio: string;
  maxDuration: number; // in seconds
  minDuration: number; // in seconds
  resolution: {
    width: number;
    height: number;
  };
  framerate: number;
  bitrate: {
    min: number;
    max: number;
    recommended: number;
  };
  audioSettings: {
    sampleRate: number;
    bitrate: number;
    channels: number;
  };
  fileFormat: string[];
  maxFileSize: number; // in MB
  thumbnailRequirements?: {
    width: number;
    height: number;
    formats: string[];
  };
}

// Core video types
export interface VideoProject {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'in_progress' | 'completed' | 'error';
  targetPlatforms: PlatformVideoFormat['name'][];
  createdAt: Date;
  updatedAt: Date;
  metadata: VideoProjectMetadata;
  timeline: VideoTimeline;
  assets: VideoAsset[];
  outputs: VideoOutput[];
}

export interface VideoProjectMetadata {
  totalDuration: number;
  hashtags: string[];
  theme: string;
  mood: string;
  targetAudience: string;
  viralPotentialScore?: number;
  engagementPrediction?: {
    likes: number;
    shares: number;
    comments: number;
    confidence: number;
  };
}

export interface VideoTimeline {
  scenes: VideoScene[];
  transitions: VideoTransition[];
  audioTracks: AudioTrack[];
  overlays: VideoOverlay[];
}

export interface VideoScene {
  id: string;
  startTime: number;
  endTime: number;
  duration: number;
  type: 'video' | 'image' | 'text' | 'animation';
  content: VideoSceneContent;
  effects: VideoEffect[];
  metadata: {
    description: string;
    keywords: string[];
    viralElements: string[];
  };
}

export interface VideoSceneContent {
  source?: string; // URL or file path
  text?: {
    content: string;
    style: TextStyle;
    animation: TextAnimation;
  };
  generatedPrompt?: string;
  aiModel?: string;
}

export interface VideoTransition {
  id: string;
  type: 'cut' | 'fade' | 'wipe' | 'zoom' | 'slide' | 'dissolve' | 'morph';
  duration: number;
  fromScene: string;
  toScene: string;
  parameters: Record<string, any>;
}

export interface AudioTrack {
  id: string;
  type: 'background' | 'voice' | 'sfx' | 'music';
  source: string;
  startTime: number;
  endTime: number;
  volume: number;
  fadeIn?: number;
  fadeOut?: number;
  effects: AudioEffect[];
}

export interface VideoOverlay {
  id: string;
  type: 'text' | 'graphics' | 'emoji' | 'sticker' | 'watermark';
  startTime: number;
  endTime: number;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  content: any;
  animation?: OverlayAnimation;
}

export interface VideoEffect {
  id: string;
  type: 'filter' | 'color_correction' | 'blur' | 'sharpen' | 'distortion' | 'particle' | 'glow';
  parameters: Record<string, any>;
  intensity: number;
  keyframes?: EffectKeyframe[];
}

export interface AudioEffect {
  id: string;
  type: 'reverb' | 'echo' | 'pitch_shift' | 'speed_change' | 'noise_reduction';
  parameters: Record<string, any>;
}

export interface TextStyle {
  fontFamily: string;
  fontSize: number;
  color: string;
  backgroundColor?: string;
  border?: {
    width: number;
    color: string;
    style: string;
  };
  shadow?: {
    offsetX: number;
    offsetY: number;
    blur: number;
    color: string;
  };
}

export interface TextAnimation {
  type: 'fade_in' | 'slide_in' | 'typewriter' | 'bounce' | 'scale' | 'rotate';
  duration: number;
  delay: number;
  easing: string;
  parameters: Record<string, any>;
}

export interface OverlayAnimation {
  type: 'fade' | 'slide' | 'scale' | 'rotate' | 'bounce' | 'pulse';
  duration: number;
  delay: number;
  loop: boolean;
  parameters: Record<string, any>;
}

export interface EffectKeyframe {
  time: number;
  value: any;
  easing?: string;
}

export interface VideoAsset {
  id: string;
  type: 'video' | 'image' | 'audio' | 'font' | 'graphic';
  name: string;
  source: string;
  metadata: {
    duration?: number;
    dimensions?: { width: number; height: number };
    fileSize: number;
    format: string;
    checksum: string;
  };
  tags: string[];
  createdAt: Date;
}

export interface VideoOutput {
  id: string;
  platform: PlatformVideoFormat['name'];
  format: PlatformVideoFormat;
  url: string;
  status: 'processing' | 'completed' | 'error';
  metadata: {
    fileSize: number;
    duration: number;
    bitrate: number;
    quality: 'low' | 'medium' | 'high' | 'ultra';
  };
  thumbnail?: {
    url: string;
    variations: Array<{
      style: string;
      url: string;
      viralScore: number;
    }>;
  };
  analytics?: {
    compressionRatio: number;
    qualityScore: number;
    estimatedLoadTime: number;
  };
}

// Agent-specific types
export interface VideoComposerInput {
  type: 'text-to-video' | 'image-to-video' | 'concept-to-video' | 'audio-to-video';
  prompt: string;
  duration: number;
  style?: string;
  mood?: string;
  aspectRatio?: string;
  framerate?: number;
  quality?: 'draft' | 'preview' | 'final';
  sourceImages?: string[];
  sourceAudio?: string;
  parameters?: {
    motionIntensity?: number;
    cameraMovement?: string;
    visualComplexity?: number;
    colorPalette?: string[];
    sceneTransitions?: boolean;
  };
}

export interface VideoEditorInput {
  projectId: string;
  operations: VideoEditOperation[];
  renderSettings?: {
    quality: 'preview' | 'final';
    format: string;
    optimization: 'speed' | 'quality' | 'balanced';
  };
}

export interface VideoEditOperation {
  type: 'cut' | 'trim' | 'merge' | 'add_effect' | 'add_transition' | 'add_overlay' | 'adjust_audio';
  target: string; // scene ID or track ID
  parameters: Record<string, any>;
  timestamp?: number;
}

export interface VideoOptimizerInput {
  videoUrl: string;
  targetPlatforms: PlatformVideoFormat['name'][];
  optimizationGoals: ('file_size' | 'quality' | 'loading_speed' | 'engagement')[];
  quality?: 'low' | 'medium' | 'high' | 'ultra';
  customSettings?: Partial<PlatformVideoFormat>[];
}

export interface MotionGraphicsInput {
  type: 'intro' | 'outro' | 'transition' | 'overlay' | 'lower_third' | 'call_to_action';
  duration: number;
  style: string;
  content: {
    text?: string;
    colors?: string[];
    brand?: {
      logo?: string;
      colors: string[];
      font: string;
    };
  };
  animation: {
    type: string;
    intensity: number;
    timing: 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear';
  };
  targetDimensions: {
    width: number;
    height: number;
  };
}

export interface ThumbnailGeneratorInput {
  videoUrl?: string;
  keyframes?: string[];
  style: 'viral' | 'professional' | 'minimalist' | 'energetic' | 'mysterious';
  platform: PlatformVideoFormat['name'];
  text?: {
    title: string;
    subtitle?: string;
    style: 'bold' | 'modern' | 'playful' | 'elegant';
  };
  elements: {
    faces: boolean;
    emotions: boolean;
    objects: boolean;
    text: boolean;
    graphics: boolean;
  };
  colorScheme?: string[];
  viralOptimization: {
    clickbaitLevel: number; // 1-10
    emotionalImpact: number; // 1-10
    curiosityGap: boolean;
  };
}

// Agent task types
export interface VideoAgentTask {
  id: string;
  agentType: 'video_composer' | 'video_editor' | 'video_optimizer' | 'motion_graphics' | 'thumbnail_generator';
  status: 'pending' | 'in_progress' | 'completed' | 'error';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  input: VideoComposerInput | VideoEditorInput | VideoOptimizerInput | MotionGraphicsInput | ThumbnailGeneratorInput;
  output?: any;
  error?: string;
  progress: number; // 0-100
  estimatedCompletion?: Date;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  metadata: {
    projectId?: string;
    sessionId?: string;
    requiredResources: string[];
    dependencies: string[];
    retryCount: number;
    maxRetries: number;
  };
}

// Pipeline coordination types
export interface VideoPipelineStage {
  name: string;
  agent: string;
  dependencies: string[];
  parallel: boolean;
  required: boolean;
  timeout: number;
  retry: {
    maxAttempts: number;
    backoffStrategy: 'linear' | 'exponential';
    baseDelay: number;
  };
}

export interface VideoPipeline {
  id: string;
  name: string;
  description: string;
  stages: VideoPipelineStage[];
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  input: any;
  output?: any;
  progress: {
    currentStage: string;
    completedStages: string[];
    totalStages: number;
    overallProgress: number;
  };
  performance: {
    startTime: Date;
    endTime?: Date;
    duration?: number;
    stageTimings: Record<string, number>;
  };
  configuration: {
    parallelism: number;
    timeout: number;
    failureHandling: 'stop' | 'continue' | 'retry';
    qualityChecks: boolean;
  };
}

// Memory and coordination types
export interface VideoMemoryStore {
  projects: Map<string, VideoProject>;
  assets: Map<string, VideoAsset>;
  templates: Map<string, VideoTemplate>;
  pipelines: Map<string, VideoPipeline>;
  cache: Map<string, any>;
  analytics: {
    usage: Map<string, number>;
    performance: Map<string, any>;
    errors: Map<string, any>;
  };
}

export interface VideoTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  targetPlatforms: PlatformVideoFormat['name'][];
  structure: VideoTimeline;
  parameters: VideoTemplateParameter[];
  preview: {
    thumbnail: string;
    description: string;
    sampleOutput: string;
  };
  popularity: {
    usageCount: number;
    rating: number;
    viralSuccessRate: number;
  };
}

export interface VideoTemplateParameter {
  name: string;
  type: 'text' | 'image' | 'color' | 'duration' | 'style';
  required: boolean;
  defaultValue?: any;
  options?: any[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

// Analytics and optimization types
export interface VideoAnalytics {
  viralPotential: {
    score: number;
    factors: {
      name: string;
      impact: number;
      confidence: number;
    }[];
    recommendations: string[];
  };
  engagement: {
    predicted: {
      views: number;
      likes: number;
      shares: number;
      comments: number;
      retention: number;
    };
    confidence: number;
    comparison: {
      averageForCategory: Record<string, number>;
      topPerformers: Record<string, number>;
    };
  };
  technical: {
    quality: number;
    loadingSpeed: number;
    compatibility: Record<string, boolean>;
    optimization: {
      fileSize: number;
      compressionEfficiency: number;
      qualityRetention: number;
    };
  };
  trends: {
    currentTrends: string[];
    trendAlignment: number;
    seasonality: number;
    momentum: number;
  };
}

// Error and logging types
export interface VideoAgentError {
  code: string;
  message: string;
  type: 'validation' | 'processing' | 'network' | 'resource' | 'timeout' | 'api';
  severity: 'low' | 'medium' | 'high' | 'critical';
  context: {
    agentType: string;
    taskId: string;
    operation: string;
    input: any;
  };
  timestamp: Date;
  stackTrace?: string;
  suggestions: string[];
}

export interface VideoAgentLog {
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error';
  agentType: string;
  operation: string;
  message: string;
  context: any;
  performance?: {
    duration: number;
    memoryUsage: number;
    resourceUtilization: number;
  };
}

// Configuration types
export interface VideoAgentConfig {
  general: {
    maxConcurrentTasks: number;
    defaultTimeout: number;
    retryAttempts: number;
    qualityThreshold: number;
    memoryLimit: number;
  };
  composer: {
    defaultModel: string;
    maxDuration: number;
    supportedFormats: string[];
    qualityPresets: Record<string, any>;
    aiProviders: {
      primary: string;
      fallbacks: string[];
    };
  };
  editor: {
    previewQuality: string;
    maxProjectSize: number;
    supportedFormats: string[];
    transitionLibrary: string;
    effectsLibrary: string;
  };
  optimizer: {
    compressionPresets: Record<string, any>;
    qualityProfiles: Record<string, any>;
    platformConfigs: Record<string, PlatformVideoFormat>;
    analyticsEnabled: boolean;
  };
  motionGraphics: {
    templateLibrary: string;
    animationEngine: string;
    renderQuality: string;
    maxComplexity: number;
  };
  thumbnailGenerator: {
    aiProvider: string;
    qualitySettings: Record<string, any>;
    viralOptimization: boolean;
    batchSize: number;
  };
  storage: {
    provider: string;
    bucket: string;
    cdnEnabled: boolean;
    cacheStrategy: string;
    retention: {
      drafts: number;
      completed: number;
      assets: number;
    };
  };
  performance: {
    monitoring: boolean;
    metrics: string[];
    alerting: boolean;
    optimization: {
      enabled: boolean;
      strategies: string[];
    };
  };
}