/**
 * Video Generation Agent Configuration
 * Platform-specific formats and agent settings
 */

import { PlatformVideoFormat, VideoAgentConfig } from './types';

// Platform-specific video format configurations
export const PLATFORM_FORMATS: Record<string, PlatformVideoFormat> = {
  tiktok: {
    name: 'tiktok',
    aspectRatio: '9:16',
    maxDuration: 180, // 3 minutes
    minDuration: 1,
    resolution: { width: 1080, height: 1920 },
    framerate: 30,
    bitrate: {
      min: 1000,
      max: 8000,
      recommended: 4000
    },
    audioSettings: {
      sampleRate: 44100,
      bitrate: 128,
      channels: 2
    },
    fileFormat: ['mp4', 'mov'],
    maxFileSize: 287, // MB
    thumbnailRequirements: {
      width: 1080,
      height: 1920,
      formats: ['jpg', 'png']
    }
  },

  'instagram-reels': {
    name: 'instagram-reels',
    aspectRatio: '9:16',
    maxDuration: 90,
    minDuration: 1,
    resolution: { width: 1080, height: 1920 },
    framerate: 30,
    bitrate: {
      min: 1000,
      max: 6000,
      recommended: 3500
    },
    audioSettings: {
      sampleRate: 44100,
      bitrate: 128,
      channels: 2
    },
    fileFormat: ['mp4', 'mov'],
    maxFileSize: 100,
    thumbnailRequirements: {
      width: 1080,
      height: 1920,
      formats: ['jpg']
    }
  },

  'youtube-shorts': {
    name: 'youtube-shorts',
    aspectRatio: '9:16',
    maxDuration: 60,
    minDuration: 1,
    resolution: { width: 1080, height: 1920 },
    framerate: 60, // Supports up to 60fps
    bitrate: {
      min: 2000,
      max: 12000,
      recommended: 6000
    },
    audioSettings: {
      sampleRate: 48000,
      bitrate: 192,
      channels: 2
    },
    fileFormat: ['mp4', 'mov', 'webm'],
    maxFileSize: 256,
    thumbnailRequirements: {
      width: 1280,
      height: 720,
      formats: ['jpg', 'png']
    }
  },

  twitter: {
    name: 'twitter',
    aspectRatio: '16:9', // Can also be 1:1 or 9:16
    maxDuration: 140,
    minDuration: 0.5,
    resolution: { width: 1280, height: 720 },
    framerate: 30,
    bitrate: {
      min: 1000,
      max: 5000,
      recommended: 2500
    },
    audioSettings: {
      sampleRate: 44100,
      bitrate: 128,
      channels: 2
    },
    fileFormat: ['mp4', 'mov'],
    maxFileSize: 512,
    thumbnailRequirements: {
      width: 1280,
      height: 720,
      formats: ['jpg', 'png']
    }
  },

  'facebook-reels': {
    name: 'facebook-reels',
    aspectRatio: '9:16',
    maxDuration: 90,
    minDuration: 1,
    resolution: { width: 1080, height: 1920 },
    framerate: 30,
    bitrate: {
      min: 1000,
      max: 6000,
      recommended: 3500
    },
    audioSettings: {
      sampleRate: 44100,
      bitrate: 128,
      channels: 2
    },
    fileFormat: ['mp4', 'mov'],
    maxFileSize: 100,
    thumbnailRequirements: {
      width: 1080,
      height: 1920,
      formats: ['jpg']
    }
  },

  snapchat: {
    name: 'snapchat',
    aspectRatio: '9:16',
    maxDuration: 60,
    minDuration: 1,
    resolution: { width: 1080, height: 1920 },
    framerate: 30,
    bitrate: {
      min: 1000,
      max: 5000,
      recommended: 3000
    },
    audioSettings: {
      sampleRate: 44100,
      bitrate: 128,
      channels: 2
    },
    fileFormat: ['mp4'],
    maxFileSize: 32,
    thumbnailRequirements: {
      width: 1080,
      height: 1920,
      formats: ['jpg']
    }
  }
};

// Video agent configuration
export const VIDEO_AGENT_CONFIG: VideoAgentConfig = {
  general: {
    maxConcurrentTasks: 5,
    defaultTimeout: 300000, // 5 minutes
    retryAttempts: 3,
    qualityThreshold: 0.8,
    memoryLimit: 2048 // MB
  },

  composer: {
    defaultModel: 'runway-gen2',
    maxDuration: 300, // 5 minutes
    supportedFormats: ['mp4', 'mov', 'webm', 'avi'],
    qualityPresets: {
      draft: {
        resolution: '480p',
        framerate: 24,
        bitrate: 1000
      },
      preview: {
        resolution: '720p',
        framerate: 30,
        bitrate: 2500
      },
      final: {
        resolution: '1080p',
        framerate: 30,
        bitrate: 5000
      },
      ultra: {
        resolution: '4K',
        framerate: 60,
        bitrate: 15000
      }
    },
    aiProviders: {
      primary: 'runway',
      fallbacks: ['stable-video', 'pika-labs', 'zeroscope']
    }
  },

  editor: {
    previewQuality: '720p',
    maxProjectSize: 5120, // MB
    supportedFormats: ['mp4', 'mov', 'webm', 'avi', 'mkv'],
    transitionLibrary: 'default',
    effectsLibrary: 'comprehensive'
  },

  optimizer: {
    compressionPresets: {
      social_media: {
        crf: 23,
        preset: 'medium',
        profile: 'main'
      },
      streaming: {
        crf: 21,
        preset: 'fast',
        profile: 'high'
      },
      archive: {
        crf: 18,
        preset: 'slower',
        profile: 'high'
      }
    },
    qualityProfiles: {
      mobile: { maxBitrate: 3000, bufferSize: 6000 },
      desktop: { maxBitrate: 8000, bufferSize: 16000 },
      tv: { maxBitrate: 15000, bufferSize: 30000 }
    },
    platformConfigs: PLATFORM_FORMATS,
    analyticsEnabled: true
  },

  motionGraphics: {
    templateLibrary: 'viral-templates',
    animationEngine: 'lottie',
    renderQuality: 'high',
    maxComplexity: 100
  },

  thumbnailGenerator: {
    aiProvider: 'midjourney',
    qualitySettings: {
      low: { width: 640, height: 360, quality: 70 },
      medium: { width: 1280, height: 720, quality: 85 },
      high: { width: 1920, height: 1080, quality: 95 }
    },
    viralOptimization: true,
    batchSize: 5
  },

  storage: {
    provider: 'supabase',
    bucket: 'video-assets',
    cdnEnabled: true,
    cacheStrategy: 'lru',
    retention: {
      drafts: 7, // days
      completed: 30,
      assets: 90
    }
  },

  performance: {
    monitoring: true,
    metrics: ['processing_time', 'memory_usage', 'error_rate', 'quality_score'],
    alerting: true,
    optimization: {
      enabled: true,
      strategies: ['caching', 'parallel_processing', 'resource_pooling']
    }
  }
};

// Viral optimization templates and patterns
export const VIRAL_TEMPLATES = {
  trending_hooks: [
    'POV:',
    'When you...',
    'Nobody:',
    'Things that just make sense',
    'Unpopular opinion:',
    'Plot twist:',
    'The way I...',
    'Tell me you... without telling me',
    'Main character energy',
    'This is your sign to...'
  ],

  emotional_triggers: [
    'nostalgia',
    'surprise',
    'humor',
    'inspiration',
    'shock',
    'curiosity',
    'empathy',
    'pride',
    'excitement',
    'relatability'
  ],

  visual_patterns: {
    color_schemes: {
      energetic: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'],
      professional: ['#2C3E50', '#3498DB', '#E74C3C', '#F39C12'],
      trendy: ['#E056FD', '#F7B801', '#22A6B3', '#6C5CE7'],
      calming: ['#74B9FF', '#A29BFE', '#FD79A8', '#FDCB6E']
    },
    text_styles: {
      bold: { weight: 'bold', size: 'large', contrast: 'high' },
      minimal: { weight: 'light', size: 'medium', contrast: 'subtle' },
      playful: { weight: 'medium', size: 'dynamic', contrast: 'varied' }
    }
  },

  timing_patterns: {
    hook_duration: 3, // seconds
    peak_engagement: 15, // 15 seconds in
    call_to_action: -5, // 5 seconds before end
    transition_frequency: 3 // every 3 seconds
  }
};

// AI model configurations
export const AI_MODELS = {
  video_generation: {
    runway: {
      endpoint: 'https://api.runwayml.com/v1/generate',
      models: ['gen-2', 'gen-1'],
      capabilities: ['text-to-video', 'image-to-video'],
      maxDuration: 18,
      pricing: { tier: 'premium', costPerSecond: 0.5 }
    },
    stable_video: {
      endpoint: 'https://api.stability.ai/v1/video',
      models: ['stable-video-diffusion'],
      capabilities: ['image-to-video'],
      maxDuration: 25,
      pricing: { tier: 'standard', costPerSecond: 0.3 }
    },
    pika_labs: {
      endpoint: 'https://api.pika.art/v1/generate',
      models: ['pika-1.0'],
      capabilities: ['text-to-video', 'image-to-video'],
      maxDuration: 12,
      pricing: { tier: 'budget', costPerSecond: 0.2 }
    }
  },

  image_generation: {
    midjourney: {
      endpoint: 'https://api.midjourney.com/v1/imagine',
      capabilities: ['text-to-image', 'style-transfer'],
      quality: 'ultra',
      pricing: { tier: 'premium', costPerImage: 0.1 }
    },
    dalle3: {
      endpoint: 'https://api.openai.com/v1/images/generations',
      capabilities: ['text-to-image'],
      quality: 'high',
      pricing: { tier: 'standard', costPerImage: 0.08 }
    }
  },

  audio_generation: {
    elevenlabs: {
      endpoint: 'https://api.elevenlabs.io/v1/text-to-speech',
      capabilities: ['text-to-speech', 'voice-cloning'],
      quality: 'high',
      pricing: { tier: 'premium', costPerMinute: 0.05 }
    },
    mubert: {
      endpoint: 'https://api.mubert.com/v2/generate',
      capabilities: ['background-music', 'sound-effects'],
      quality: 'medium',
      pricing: { tier: 'standard', costPerMinute: 0.02 }
    }
  }
};

// Claude Flow integration patterns
export const CLAUDE_FLOW_PATTERNS = {
  video_pipeline: {
    topology: 'pipeline',
    agents: [
      'video_composer',
      'video_editor',
      'motion_graphics',
      'video_optimizer',
      'thumbnail_generator'
    ],
    coordination: 'sequential',
    fallback: 'retry',
    monitoring: true
  },

  parallel_processing: {
    topology: 'mesh',
    agents: [
      'video_composer',
      'audio_generator',
      'thumbnail_generator'
    ],
    coordination: 'parallel',
    synchronization: 'barrier',
    monitoring: true
  },

  quality_assurance: {
    topology: 'hierarchical',
    coordinator: 'video_qa_agent',
    workers: [
      'technical_validator',
      'content_reviewer',
      'viral_analyzer'
    ],
    validation: 'consensus',
    monitoring: true
  }
};

export default {
  PLATFORM_FORMATS,
  VIDEO_AGENT_CONFIG,
  VIRAL_TEMPLATES,
  AI_MODELS,
  CLAUDE_FLOW_PATTERNS
};