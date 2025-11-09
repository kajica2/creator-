// Audio Agent Types and Interfaces
export * from './types';

// Individual Audio Agents
export { AudioComposer } from './AudioComposer';
export { SoundEffects } from './SoundEffects';
export { VoiceSynthesizer } from './VoiceSynthesizer';
export { AudioMixer } from './AudioMixer';
export { BeatGenerator } from './BeatGenerator';

// Audio Agent Coordinator
export { AudioAgentCoordinator } from './AudioAgentCoordinator';

// Utility functions and helpers
export const AudioAgentUtils = {
  // Audio format validation
  validateAudioFormat: (format: any): boolean => {
    const validFormats = ['mp3', 'wav', 'ogg', 'aac', 'm4a'];
    return validFormats.includes(format?.format);
  },

  // Tempo validation
  validateTempo: (tempo: number): boolean => {
    return tempo >= 60 && tempo <= 200;
  },

  // Social media platform validation
  validateSocialMediaPlatform: (platform: string): boolean => {
    const validPlatforms = ['instagram', 'tiktok', 'youtube', 'twitter', 'facebook'];
    return validPlatforms.includes(platform);
  },

  // Agent type validation
  validateAgentType: (type: string): boolean => {
    const validTypes = ['composer', 'sound-effects', 'voice-synthesizer', 'audio-mixer', 'beat-generator'];
    return validTypes.includes(type);
  },

  // Voice configuration validation
  validateVoiceConfig: (config: any): boolean => {
    if (!config) return false;

    const validVoices = ['male', 'female', 'child', 'robotic', 'ethereal'];
    const validLanguages = /^[a-z]{2}-[A-Z]{2}$/; // Format: en-US, es-ES, etc.

    return validVoices.includes(config.voice) &&
           validLanguages.test(config.language) &&
           typeof config.pitch === 'number' &&
           typeof config.speed === 'number' &&
           config.pitch >= -1 && config.pitch <= 1 &&
           config.speed >= 0.5 && config.speed <= 2;
  },

  // Beat pattern validation
  validateBeatPattern: (pattern: any): boolean => {
    if (!pattern || !Array.isArray(pattern.pattern)) return false;

    const validInstruments = ['kick', 'snare', 'hihat', 'openhat', 'crash', 'ride', 'tom1', 'tom2', 'tom3'];

    return pattern.pattern.every((step: any) =>
      typeof step.time === 'number' &&
      typeof step.velocity === 'number' &&
      validInstruments.includes(step.instrument) &&
      step.velocity >= 0 && step.velocity <= 127
    );
  },

  // Audio effect configuration validation
  validateEffectConfig: (config: any): boolean => {
    if (!config) return false;

    const validEffectTypes = ['reverb', 'delay', 'distortion', 'filter', 'chorus', 'phaser', 'compressor', 'eq'];

    return validEffectTypes.includes(config.type) &&
           typeof config.parameters === 'object' &&
           config.parameters !== null;
  }
};

// Default configurations
export const AudioAgentDefaults = {
  // Default composer configuration
  composerConfig: {
    style: 'fusion' as const,
    complexity: 'moderate' as const,
    duration: 16,
    key: 'C',
    tempo: 120,
    instruments: ['piano', 'strings', 'bass'],
    useNeuralGeneration: true
  },

  // Default voice configuration
  voiceConfig: {
    voice: 'female' as const,
    language: 'en-US',
    pitch: 0,
    speed: 1,
    emotion: 'neutral' as const
  },

  // Default audio format
  audioFormat: {
    format: 'wav' as const,
    sampleRate: 44100,
    bitRate: 1411,
    channels: 2,
    quality: 'high' as const
  },

  // Default mixer channel
  mixerChannel: {
    volume: 0,
    pan: 0,
    muted: false,
    solo: false,
    effects: []
  },

  // Default beat pattern structure
  beatPattern: {
    timeSignature: [4, 4] as [number, number],
    tempo: 120,
    length: 16
  },

  // Social media optimization presets
  socialMediaPresets: {
    instagram: {
      story: {
        platform: 'instagram' as const,
        format: 'aac' as const,
        sampleRate: 44100,
        bitRate: 128,
        channels: 2,
        quality: 'medium' as const,
        duration: 15,
        compressionLevel: 0.7
      },
      reel: {
        platform: 'instagram' as const,
        format: 'aac' as const,
        sampleRate: 44100,
        bitRate: 192,
        channels: 2,
        quality: 'high' as const,
        duration: 90,
        compressionLevel: 0.6
      }
    },
    tiktok: {
      platform: 'tiktok' as const,
      format: 'aac' as const,
      sampleRate: 44100,
      bitRate: 128,
      channels: 2,
      quality: 'medium' as const,
      duration: 60,
      compressionLevel: 0.8
    },
    youtube: {
      short: {
        platform: 'youtube' as const,
        format: 'aac' as const,
        sampleRate: 48000,
        bitRate: 256,
        channels: 2,
        quality: 'high' as const,
        duration: 60,
        compressionLevel: 0.4
      },
      video: {
        platform: 'youtube' as const,
        format: 'wav' as const,
        sampleRate: 48000,
        bitRate: 1536,
        channels: 2,
        quality: 'lossless' as const,
        compressionLevel: 0.2
      }
    }
  }
};

// Audio Agent Factory
export class AudioAgentFactory {
  static async createCoordinator(callbacks?: any): Promise<AudioAgentCoordinator> {
    const coordinator = new AudioAgentCoordinator(callbacks);
    await coordinator.initialize();
    return coordinator;
  }

  static async createComposer(callbacks?: any): Promise<AudioComposer> {
    const composer = new AudioComposer(callbacks);
    await composer.initialize();
    return composer;
  }

  static async createSoundEffects(callbacks?: any): Promise<SoundEffects> {
    const soundEffects = new SoundEffects(callbacks);
    await soundEffects.initialize();
    return soundEffects;
  }

  static async createVoiceSynthesizer(callbacks?: any): Promise<VoiceSynthesizer> {
    const voiceSynthesizer = new VoiceSynthesizer(callbacks);
    await voiceSynthesizer.initialize();
    return voiceSynthesizer;
  }

  static async createAudioMixer(callbacks?: any): Promise<AudioMixer> {
    const audioMixer = new AudioMixer(callbacks);
    await audioMixer.initialize();
    return audioMixer;
  }

  static async createBeatGenerator(callbacks?: any): Promise<BeatGenerator> {
    const beatGenerator = new BeatGenerator(callbacks);
    await beatGenerator.initialize();
    return beatGenerator;
  }
}

// Quick start helper
export const AudioAgents = {
  /**
   * Initialize a complete audio production suite
   * @param callbacks Optional callbacks for audio events
   * @returns Initialized AudioAgentCoordinator with all agents ready
   */
  async initializeComplete(callbacks?: any): Promise<AudioAgentCoordinator> {
    console.log('🎼 Initializing complete audio agent suite...');
    const coordinator = await AudioAgentFactory.createCoordinator(callbacks);
    console.log('✅ Audio agent suite ready for production!');
    return coordinator;
  },

  /**
   * Create a quick composition with default settings
   * @param coordinator Initialized AudioAgentCoordinator
   * @param style Musical style (default: 'fusion')
   * @param tempo Tempo in BPM (default: 120)
   * @returns Generated audio project
   */
  async quickComposition(
    coordinator: AudioAgentCoordinator,
    style: string = 'fusion',
    tempo: number = 120
  ) {
    return coordinator.createFullComposition(style, tempo, true);
  },

  /**
   * Generate audio optimized for social media
   * @param coordinator Initialized AudioAgentCoordinator
   * @param project Audio project to optimize
   * @param platform Social media platform
   * @returns Optimized audio buffer
   */
  async optimizeForSocial(
    coordinator: AudioAgentCoordinator,
    project: any,
    platform: 'instagram' | 'tiktok' | 'youtube' = 'instagram'
  ) {
    const preset = AudioAgentDefaults.socialMediaPresets[platform];
    const format = platform === 'instagram' ? preset.story : preset;

    return coordinator.mixdownProject(project, {
      format: AudioAgentDefaults.audioFormat,
      normalize: true,
      limitPeaks: true,
      socialMediaOptimization: format
    });
  }
};

// Claude-Flow integration helpers
export const ClaudeFlowIntegration = {
  /**
   * Execute Claude-Flow hooks for audio generation tracking
   */
  async executePreTaskHook(description: string): Promise<void> {
    try {
      // This would integrate with the actual Claude-Flow system
      console.log(`🪝 Claude-Flow pre-task: ${description}`);

      // In a real implementation, this would call:
      // await executeCommand('npx claude-flow@alpha hooks pre-task --description "${description}"');
    } catch (error) {
      console.warn('Claude-Flow pre-task hook failed:', error);
    }
  },

  async executePostTaskHook(taskId: string): Promise<void> {
    try {
      console.log(`🪝 Claude-Flow post-task: ${taskId}`);

      // In a real implementation, this would call:
      // await executeCommand('npx claude-flow@alpha hooks post-task --task-id "${taskId}"');
    } catch (error) {
      console.warn('Claude-Flow post-task hook failed:', error);
    }
  },

  async notifyProgress(message: string): Promise<void> {
    try {
      console.log(`📢 Claude-Flow notify: ${message}`);

      // In a real implementation, this would call:
      // await executeCommand('npx claude-flow@alpha hooks notify --message "${message}"');
    } catch (error) {
      console.warn('Claude-Flow notify hook failed:', error);
    }
  }
};

// Export everything as a convenient namespace
export default {
  AudioComposer,
  SoundEffects,
  VoiceSynthesizer,
  AudioMixer,
  BeatGenerator,
  AudioAgentCoordinator,
  AudioAgentFactory,
  AudioAgentUtils,
  AudioAgentDefaults,
  AudioAgents,
  ClaudeFlowIntegration
};