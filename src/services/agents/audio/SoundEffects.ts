import * as Tone from 'tone';
import {
  BaseAudioAgent,
  AudioAgentType,
  AgentStatus,
  SoundEffectConfig,
  GeneratedSoundEffect,
  AudioAgentCallbacks,
  AudioAgentError,
  AudioEffect
} from './types';

export class SoundEffects implements BaseAudioAgent {
  public readonly id: string;
  public readonly type: AudioAgentType = 'sound-effects';
  public status: AgentStatus = 'idle';
  public readonly capabilities: string[] = [
    'reverb_generation',
    'delay_effects',
    'distortion_synthesis',
    'filter_processing',
    'modulation_effects',
    'spatial_effects',
    'dynamic_processing',
    'creative_effects'
  ];
  public metadata: Record<string, any> = {};

  private audioContext!: AudioContext;
  private effects: Map<string, Tone.ToneAudioNode> = new Map();
  private presets: Map<string, SoundEffectConfig> = new Map();
  private callbacks: AudioAgentCallbacks;
  private effectChains: Map<string, Tone.ToneAudioNode[]> = new Map();

  constructor(callbacks: AudioAgentCallbacks = {}) {
    this.id = `sound-effects-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.callbacks = callbacks;
    this.metadata = {
      createdAt: new Date(),
      version: '1.0.0',
      effectsLoaded: false,
      presetsCount: 0
    };

    this.initializePresets();
  }

  public async initialize(): Promise<void> {
    try {
      this.status = 'initializing';
      this.callbacks.onAgentStatusChange?.(this.id, this.status);

      // Initialize Tone.js context
      if (Tone.context.state !== 'running') {
        await Tone.start();
      }
      this.audioContext = Tone.context.rawContext;

      // Initialize effect library
      await this.initializeEffectLibrary();

      this.metadata.effectsLoaded = true;
      this.metadata.presetsCount = this.presets.size;
      this.status = 'ready';
      this.callbacks.onAgentStatusChange?.(this.id, this.status);

      console.log(`🎛️ SoundEffects ${this.id} initialized with ${this.presets.size} presets`);
    } catch (error) {
      this.status = 'error';
      this.callbacks.onAgentStatusChange?.(this.id, this.status);
      throw new AudioAgentError(
        `Failed to initialize SoundEffects: ${error instanceof Error ? error.message : 'Unknown error'}`,
        this.id,
        this.type,
        'INIT_FAILED'
      );
    }
  }

  private initializePresets(): void {
    // Reverb presets
    this.presets.set('hall', {
      type: 'reverb',
      parameters: { roomSize: 0.8, decay: 4.0, wet: 0.3 }
    });

    this.presets.set('plate', {
      type: 'reverb',
      parameters: { roomSize: 0.6, decay: 2.5, wet: 0.25 }
    });

    this.presets.set('spring', {
      type: 'reverb',
      parameters: { roomSize: 0.4, decay: 1.5, wet: 0.4 }
    });

    // Delay presets
    this.presets.set('echo', {
      type: 'delay',
      parameters: { delayTime: 0.25, feedback: 0.3, wet: 0.2 }
    });

    this.presets.set('ping-pong', {
      type: 'delay',
      parameters: { delayTime: 0.125, feedback: 0.4, wet: 0.3 }
    });

    this.presets.set('tape-delay', {
      type: 'delay',
      parameters: { delayTime: 0.375, feedback: 0.6, wet: 0.25 }
    });

    // Distortion presets
    this.presets.set('warm-overdrive', {
      type: 'distortion',
      parameters: { distortion: 0.3, oversample: '2x', wet: 0.5 }
    });

    this.presets.set('heavy-distortion', {
      type: 'distortion',
      parameters: { distortion: 0.8, oversample: '4x', wet: 0.7 }
    });

    this.presets.set('bit-crusher', {
      type: 'distortion',
      parameters: { bits: 4, frequency: 0.1, wet: 0.6 }
    });

    // Filter presets
    this.presets.set('low-pass', {
      type: 'filter',
      parameters: { frequency: 2000, Q: 1, type: 'lowpass', wet: 1 }
    });

    this.presets.set('high-pass', {
      type: 'filter',
      parameters: { frequency: 200, Q: 1, type: 'highpass', wet: 1 }
    });

    this.presets.set('band-pass', {
      type: 'filter',
      parameters: { frequency: 1000, Q: 5, type: 'bandpass', wet: 1 }
    });

    // Modulation presets
    this.presets.set('chorus', {
      type: 'chorus',
      parameters: { frequency: 4, delayTime: 2.5, depth: 0.7, type: 'sine', wet: 0.3 }
    });

    this.presets.set('phaser', {
      type: 'phaser',
      parameters: { frequency: 0.5, octaves: 3, stages: 10, Q: 10, wet: 0.5 }
    });

    this.presets.set('tremolo', {
      type: 'tremolo',
      parameters: { frequency: 10, type: 'sine', depth: 0.5, wet: 0.8 }
    });

    // Dynamic processing presets
    this.presets.set('compressor', {
      type: 'compressor',
      parameters: { threshold: -12, ratio: 4, attack: 0.003, release: 0.1, knee: 30 }
    });

    this.presets.set('limiter', {
      type: 'compressor',
      parameters: { threshold: -6, ratio: 20, attack: 0.001, release: 0.05, knee: 0 }
    });

    // EQ presets
    this.presets.set('bass-boost', {
      type: 'eq',
      parameters: { low: 6, mid: 0, high: 0, lowFrequency: 320, highFrequency: 3200 }
    });

    this.presets.set('vocal-clarity', {
      type: 'eq',
      parameters: { low: -2, mid: 4, high: 2, lowFrequency: 320, highFrequency: 3200 }
    });
  }

  private async initializeEffectLibrary(): Promise<void> {
    // Pre-create commonly used effects to reduce latency
    const commonEffects = [
      'reverb-hall',
      'delay-echo',
      'distortion-warm',
      'filter-lowpass',
      'chorus-default',
      'compressor-default'
    ];

    for (const effectName of commonEffects) {
      try {
        const [type, preset] = effectName.split('-');
        const config = this.presets.get(preset) || this.presets.get('hall');
        if (config) {
          const effect = this.createEffect(config);
          this.effects.set(effectName, effect);
        }
      } catch (error) {
        console.warn(`Failed to pre-create effect ${effectName}:`, error);
      }
    }
  }

  public async generateEffect(config: SoundEffectConfig): Promise<GeneratedSoundEffect> {
    if (this.status !== 'ready') {
      throw new AudioAgentError('SoundEffects agent not ready', this.id, this.type, 'NOT_READY');
    }

    try {
      this.status = 'processing';
      this.callbacks.onAgentStatusChange?.(this.id, this.status);

      const effectId = `effect-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const effect = this.createEffect(config);

      // Generate a test tone to demonstrate the effect
      const testTone = await this.generateTestAudio(effect, config);

      const generatedEffect: GeneratedSoundEffect = {
        id: effectId,
        name: this.generateEffectName(config),
        type: config.type,
        audioBuffer: testTone,
        duration: 2.0, // 2 seconds
        parameters: config.parameters
      };

      this.effects.set(effectId, effect);
      this.status = 'ready';
      this.callbacks.onAgentStatusChange?.(this.id, this.status);
      this.callbacks.onEffectProcessed?.(generatedEffect);

      console.log(`🎛️ Generated effect: ${generatedEffect.name}`);
      return generatedEffect;
    } catch (error) {
      this.status = 'error';
      this.callbacks.onAgentStatusChange?.(this.id, this.status);
      throw new AudioAgentError(
        `Effect generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        this.id,
        this.type,
        'GENERATION_FAILED'
      );
    }
  }

  private createEffect(config: SoundEffectConfig): Tone.ToneAudioNode {
    switch (config.type) {
      case 'reverb':
        return this.createReverb(config.parameters);
      case 'delay':
        return this.createDelay(config.parameters);
      case 'distortion':
        return this.createDistortion(config.parameters);
      case 'filter':
        return this.createFilter(config.parameters);
      case 'chorus':
        return this.createChorus(config.parameters);
      case 'phaser':
        return this.createPhaser(config.parameters);
      case 'compressor':
        return this.createCompressor(config.parameters);
      case 'eq':
        return this.createEQ(config.parameters);
      default:
        throw new AudioAgentError(`Unknown effect type: ${config.type}`, this.id, this.type);
    }
  }

  private createReverb(params: Record<string, number>): Tone.Reverb {
    const reverb = new Tone.Reverb({
      roomSize: params.roomSize || 0.7,
      decay: params.decay || 2.0
    });

    reverb.wet.value = params.wet || 0.3;
    return reverb;
  }

  private createDelay(params: Record<string, number>): Tone.FeedbackDelay {
    const delay = new Tone.FeedbackDelay({
      delayTime: params.delayTime || 0.25,
      feedback: params.feedback || 0.3
    });

    delay.wet.value = params.wet || 0.2;
    return delay;
  }

  private createDistortion(params: Record<string, any>): Tone.Distortion {
    const distortion = new Tone.Distortion({
      distortion: params.distortion || 0.4,
      oversample: params.oversample || '2x'
    });

    distortion.wet.value = params.wet || 0.5;
    return distortion;
  }

  private createFilter(params: Record<string, any>): Tone.Filter {
    const filter = new Tone.Filter({
      frequency: params.frequency || 1000,
      Q: params.Q || 1,
      type: params.type || 'lowpass'
    });

    return filter;
  }

  private createChorus(params: Record<string, any>): Tone.Chorus {
    const chorus = new Tone.Chorus({
      frequency: params.frequency || 4,
      delayTime: params.delayTime || 2.5,
      depth: params.depth || 0.7,
      type: params.type || 'sine'
    });

    chorus.wet.value = params.wet || 0.3;
    return chorus;
  }

  private createPhaser(params: Record<string, number>): Tone.Phaser {
    const phaser = new Tone.Phaser({
      frequency: params.frequency || 0.5,
      octaves: params.octaves || 3,
      stages: params.stages || 10,
      Q: params.Q || 10
    });

    phaser.wet.value = params.wet || 0.5;
    return phaser;
  }

  private createCompressor(params: Record<string, number>): Tone.Compressor {
    const compressor = new Tone.Compressor({
      threshold: params.threshold || -12,
      ratio: params.ratio || 4,
      attack: params.attack || 0.003,
      release: params.release || 0.1,
      knee: params.knee || 30
    });

    return compressor;
  }

  private createEQ(params: Record<string, number>): Tone.EQ3 {
    const eq = new Tone.EQ3({
      low: params.low || 0,
      mid: params.mid || 0,
      high: params.high || 0,
      lowFrequency: params.lowFrequency || 400,
      highFrequency: params.highFrequency || 2500
    });

    return eq;
  }

  private async generateTestAudio(effect: Tone.ToneAudioNode, config: SoundEffectConfig): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      try {
        // Create a simple oscillator to test the effect
        const oscillator = new Tone.Oscillator(440, 'sine');
        const recorder = new Tone.Recorder();

        // Chain: Oscillator -> Effect -> Recorder
        oscillator.chain(effect, recorder);

        let recordingDuration = 2000; // 2 seconds

        recorder.start().then(() => {
          oscillator.start();
          oscillator.stop(Tone.now() + 2);

          setTimeout(async () => {
            try {
              const recording = await recorder.stop();
              const arrayBuffer = await recording.arrayBuffer();

              // Cleanup
              oscillator.dispose();
              recorder.dispose();

              resolve(arrayBuffer);
            } catch (error) {
              reject(error);
            }
          }, recordingDuration + 100);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  public createEffectChain(configs: SoundEffectConfig[], chainId: string): Tone.ToneAudioNode {
    const effectChain: Tone.ToneAudioNode[] = [];

    for (const config of configs) {
      const effect = this.createEffect(config);
      effectChain.push(effect);
    }

    // Chain effects together
    if (effectChain.length > 1) {
      for (let i = 0; i < effectChain.length - 1; i++) {
        effectChain[i].connect(effectChain[i + 1]);
      }
    }

    this.effectChains.set(chainId, effectChain);
    return effectChain[0] || effectChain[effectChain.length - 1];
  }

  public getPreset(presetName: string): SoundEffectConfig | undefined {
    return this.presets.get(presetName);
  }

  public getAllPresets(): Map<string, SoundEffectConfig> {
    return new Map(this.presets);
  }

  public async processAudioBuffer(
    audioBuffer: ArrayBuffer,
    effectConfig: SoundEffectConfig
  ): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      try {
        // Create effect and audio processing chain
        const effect = this.createEffect(effectConfig);
        const recorder = new Tone.Recorder();
        const player = new Tone.Player();

        // Chain: Player -> Effect -> Recorder
        player.chain(effect, recorder);

        // Load the audio buffer
        player.buffer.fromArray(audioBuffer);

        recorder.start().then(() => {
          player.start();

          // Wait for playback to complete
          const duration = player.buffer.duration * 1000 + 100;
          setTimeout(async () => {
            try {
              const processed = await recorder.stop();
              const processedBuffer = await processed.arrayBuffer();

              // Cleanup
              player.dispose();
              recorder.dispose();
              effect.dispose();

              resolve(processedBuffer);
            } catch (error) {
              reject(error);
            }
          }, duration);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  public createCustomEffect(
    name: string,
    parameters: Record<string, any>,
    type: string
  ): SoundEffectConfig {
    const config: SoundEffectConfig = {
      type: type as any,
      parameters,
      presets: name
    };

    this.presets.set(name, config);
    return config;
  }

  private generateEffectName(config: SoundEffectConfig): string {
    const typeNames = {
      reverb: 'Reverb',
      delay: 'Delay',
      distortion: 'Distortion',
      filter: 'Filter',
      chorus: 'Chorus',
      phaser: 'Phaser',
      compressor: 'Compressor',
      eq: 'Equalizer'
    };

    const baseName = typeNames[config.type] || 'Effect';
    const timestamp = new Date().toLocaleTimeString();

    return `${baseName} - ${timestamp}`;
  }

  public getAvailableEffectTypes(): string[] {
    return Array.from(new Set(Array.from(this.presets.values()).map(preset => preset.type)));
  }

  public getEffectsCount(): number {
    return this.effects.size;
  }

  public getPresetsCount(): number {
    return this.presets.size;
  }

  public getStatus(): AgentStatus {
    return this.status;
  }

  public dispose(): void {
    this.status = 'disposed';

    // Dispose all created effects
    for (const effect of this.effects.values()) {
      try {
        effect.dispose();
      } catch (error) {
        console.warn('Error disposing effect:', error);
      }
    }

    // Dispose effect chains
    for (const chain of this.effectChains.values()) {
      for (const effect of chain) {
        try {
          effect.dispose();
        } catch (error) {
          console.warn('Error disposing effect in chain:', error);
        }
      }
    }

    this.effects.clear();
    this.effectChains.clear();
    this.presets.clear();

    this.callbacks.onAgentStatusChange?.(this.id, this.status);
    console.log(`🎛️ SoundEffects ${this.id} disposed`);
  }
}