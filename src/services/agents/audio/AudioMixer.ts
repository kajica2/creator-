import * as Tone from 'tone';
import {
  BaseAudioAgent,
  AudioAgentType,
  AgentStatus,
  MixerConfig,
  MixerChannel,
  AudioTrack,
  AudioEffect,
  MixdownOptions,
  AudioProject,
  AudioFormat,
  SocialMediaFormat,
  AudioAgentCallbacks,
  AudioAgentError
} from './types';

export class AudioMixer implements BaseAudioAgent {
  public readonly id: string;
  public readonly type: AudioAgentType = 'audio-mixer';
  public status: AgentStatus = 'idle';
  public readonly capabilities: string[] = [
    'multi_track_mixing',
    'volume_automation',
    'pan_control',
    'effect_processing',
    'master_bus_processing',
    'mixdown_export',
    'social_media_optimization',
    'format_conversion',
    'audio_normalization'
  ];
  public metadata: Record<string, any> = {};

  private mixer!: Tone.Channel;
  private masterBus!: Tone.Channel;
  private channels: Map<string, MixerChannel> = new Map();
  private channelNodes: Map<string, Tone.Channel> = new Map();
  private effectChains: Map<string, Tone.ToneAudioNode[]> = new Map();
  private callbacks: AudioAgentCallbacks;
  private currentProject?: AudioProject;
  private isRecording: boolean = false;
  private recorder?: Tone.Recorder;

  // Audio processing nodes
  private limiter!: Tone.Limiter;
  private compressor!: Tone.Compressor;
  private masterEQ!: Tone.EQ3;

  // Social media format configurations
  private socialFormats: Map<string, SocialMediaFormat> = new Map();

  constructor(callbacks: AudioAgentCallbacks = {}) {
    this.id = `audio-mixer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.callbacks = callbacks;
    this.metadata = {
      createdAt: new Date(),
      version: '1.0.0',
      channelsCount: 0,
      masteringEnabled: true,
      socialFormatsCount: 0
    };

    this.initializeSocialFormats();
  }

  public async initialize(): Promise<void> {
    try {
      this.status = 'initializing';
      this.callbacks.onAgentStatusChange?.(this.id, this.status);

      // Initialize Tone.js context
      if (Tone.context.state !== 'running') {
        await Tone.start();
      }

      // Set up master audio chain
      await this.initializeMasterBus();

      // Set up mixer infrastructure
      this.mixer = new Tone.Channel({
        volume: 0,
        pan: 0
      });

      this.mixer.connect(this.masterBus);

      this.metadata.masteringEnabled = true;
      this.metadata.socialFormatsCount = this.socialFormats.size;
      this.status = 'ready';
      this.callbacks.onAgentStatusChange?.(this.id, this.status);

      console.log(`🎛️ AudioMixer ${this.id} initialized with mastering chain`);
    } catch (error) {
      this.status = 'error';
      this.callbacks.onAgentStatusChange?.(this.id, this.status);
      throw new AudioAgentError(
        `Failed to initialize AudioMixer: ${error instanceof Error ? error.message : 'Unknown error'}`,
        this.id,
        this.type,
        'INIT_FAILED'
      );
    }
  }

  private async initializeMasterBus(): Promise<void> {
    // Create professional mastering chain
    this.masterEQ = new Tone.EQ3({
      low: 0,
      mid: 0,
      high: 0
    });

    this.compressor = new Tone.Compressor({
      threshold: -12,
      ratio: 3,
      attack: 0.01,
      release: 0.1,
      knee: 6
    });

    this.limiter = new Tone.Limiter(-0.5);

    this.masterBus = new Tone.Channel({
      volume: 0
    });

    // Chain: MasterEQ -> Compressor -> Limiter -> Destination
    this.masterBus.chain(this.masterEQ, this.compressor, this.limiter, Tone.Destination);
  }

  private initializeSocialFormats(): void {
    // Instagram formats
    this.socialFormats.set('instagram-story', {
      platform: 'instagram',
      format: 'aac',
      sampleRate: 44100,
      bitRate: 128,
      channels: 2,
      quality: 'medium',
      duration: 15,
      compressionLevel: 0.7
    });

    this.socialFormats.set('instagram-reel', {
      platform: 'instagram',
      format: 'aac',
      sampleRate: 44100,
      bitRate: 192,
      channels: 2,
      quality: 'high',
      duration: 90,
      compressionLevel: 0.6
    });

    // TikTok formats
    this.socialFormats.set('tiktok-video', {
      platform: 'tiktok',
      format: 'aac',
      sampleRate: 44100,
      bitRate: 128,
      channels: 2,
      quality: 'medium',
      duration: 60,
      compressionLevel: 0.8
    });

    // YouTube formats
    this.socialFormats.set('youtube-short', {
      platform: 'youtube',
      format: 'aac',
      sampleRate: 48000,
      bitRate: 256,
      channels: 2,
      quality: 'high',
      duration: 60,
      compressionLevel: 0.4
    });

    this.socialFormats.set('youtube-video', {
      platform: 'youtube',
      format: 'wav',
      sampleRate: 48000,
      bitRate: 1536,
      channels: 2,
      quality: 'lossless',
      compressionLevel: 0.2
    });

    // Twitter/X formats
    this.socialFormats.set('twitter-audio', {
      platform: 'twitter',
      format: 'aac',
      sampleRate: 44100,
      bitRate: 128,
      channels: 2,
      quality: 'medium',
      duration: 140, // Twitter's audio limit
      compressionLevel: 0.7
    });

    // Facebook formats
    this.socialFormats.set('facebook-video', {
      platform: 'facebook',
      format: 'aac',
      sampleRate: 44100,
      bitRate: 192,
      channels: 2,
      quality: 'high',
      compressionLevel: 0.5
    });
  }

  public createMixerChannel(track: AudioTrack): MixerChannel {
    const channelId = `channel-${track.id}`;

    const mixerChannel: MixerChannel = {
      id: channelId,
      name: track.name || `Channel ${this.channels.size + 1}`,
      volume: track.volume || 0,
      pan: track.pan || 0,
      muted: track.muted || false,
      solo: track.solo || false,
      input: track,
      effects: track.effects || []
    };

    // Create Tone.js channel node
    const channelNode = new Tone.Channel({
      volume: mixerChannel.volume,
      pan: mixerChannel.pan,
      mute: mixerChannel.muted,
      solo: mixerChannel.solo
    });

    // Set up effect chain for this channel
    if (mixerChannel.effects.length > 0) {
      this.createChannelEffectChain(channelId, mixerChannel.effects, channelNode);
    }

    channelNode.connect(this.mixer);

    this.channels.set(channelId, mixerChannel);
    this.channelNodes.set(channelId, channelNode);
    this.metadata.channelsCount = this.channels.size;

    console.log(`🎚️ Created mixer channel: ${mixerChannel.name}`);
    return mixerChannel;
  }

  private createChannelEffectChain(
    channelId: string,
    effects: AudioEffect[],
    channelNode: Tone.Channel
  ): void {
    const effectNodes: Tone.ToneAudioNode[] = [];

    for (const effect of effects) {
      const effectNode = this.createEffectNode(effect);
      if (effectNode) {
        effectNodes.push(effectNode);
      }
    }

    if (effectNodes.length > 0) {
      // Chain effects together
      let previousNode: Tone.ToneAudioNode = channelNode;

      for (const effectNode of effectNodes) {
        previousNode.connect(effectNode);
        previousNode = effectNode;
      }

      this.effectChains.set(channelId, effectNodes);
    }
  }

  private createEffectNode(effect: AudioEffect): Tone.ToneAudioNode | null {
    try {
      switch (effect.type) {
        case 'reverb':
          const reverb = new Tone.Reverb(effect.parameters.decay || 2);
          reverb.wet.value = effect.wet;
          return reverb;

        case 'delay':
          const delay = new Tone.FeedbackDelay({
            delayTime: effect.parameters.delayTime || 0.25,
            feedback: effect.parameters.feedback || 0.3
          });
          delay.wet.value = effect.wet;
          return delay;

        case 'eq':
          return new Tone.EQ3({
            low: effect.parameters.low || 0,
            mid: effect.parameters.mid || 0,
            high: effect.parameters.high || 0
          });

        case 'compressor':
          return new Tone.Compressor({
            threshold: effect.parameters.threshold || -12,
            ratio: effect.parameters.ratio || 3,
            attack: effect.parameters.attack || 0.01,
            release: effect.parameters.release || 0.1
          });

        case 'filter':
          return new Tone.Filter({
            frequency: effect.parameters.frequency || 1000,
            type: effect.parameters.type || 'lowpass',
            Q: effect.parameters.Q || 1
          });

        default:
          console.warn(`Unknown effect type: ${effect.type}`);
          return null;
      }
    } catch (error) {
      console.error(`Failed to create effect ${effect.type}:`, error);
      return null;
    }
  }

  public updateChannelVolume(channelId: string, volume: number): void {
    const channel = this.channels.get(channelId);
    const channelNode = this.channelNodes.get(channelId);

    if (channel && channelNode) {
      channel.volume = Math.max(-60, Math.min(12, volume));
      channelNode.volume.value = channel.volume;
      this.updateChannelInProject(channelId);
    }
  }

  public updateChannelPan(channelId: string, pan: number): void {
    const channel = this.channels.get(channelId);
    const channelNode = this.channelNodes.get(channelId);

    if (channel && channelNode) {
      channel.pan = Math.max(-1, Math.min(1, pan));
      channelNode.pan.value = channel.pan;
      this.updateChannelInProject(channelId);
    }
  }

  public muteChannel(channelId: string, muted: boolean): void {
    const channel = this.channels.get(channelId);
    const channelNode = this.channelNodes.get(channelId);

    if (channel && channelNode) {
      channel.muted = muted;
      channelNode.mute = muted;
      this.updateChannelInProject(channelId);
    }
  }

  public soloChannel(channelId: string, solo: boolean): void {
    const channel = this.channels.get(channelId);
    const channelNode = this.channelNodes.get(channelId);

    if (channel && channelNode) {
      channel.solo = solo;
      channelNode.solo = solo;
      this.updateChannelInProject(channelId);
    }
  }

  private updateChannelInProject(channelId: string): void {
    if (this.currentProject) {
      const channel = this.channels.get(channelId);
      if (channel) {
        // Update the corresponding track in the project
        const track = this.currentProject.tracks.find(t => t.id === channel.input.id);
        if (track) {
          track.volume = channel.volume;
          track.pan = channel.pan;
          track.muted = channel.muted;
          track.solo = channel.solo;

          this.callbacks.onProjectUpdated?.(this.currentProject);
        }
      }
    }
  }

  public setMasterVolume(volume: number): void {
    if (this.masterBus) {
      const clampedVolume = Math.max(-60, Math.min(12, volume));
      this.masterBus.volume.value = clampedVolume;

      if (this.currentProject) {
        this.currentProject.masterVolume = clampedVolume;
        this.callbacks.onProjectUpdated?.(this.currentProject);
      }
    }
  }

  public configureMasterEQ(low: number, mid: number, high: number): void {
    if (this.masterEQ) {
      this.masterEQ.low.value = Math.max(-20, Math.min(20, low));
      this.masterEQ.mid.value = Math.max(-20, Math.min(20, mid));
      this.masterEQ.high.value = Math.max(-20, Math.min(20, high));
    }
  }

  public configureMasterCompressor(
    threshold: number,
    ratio: number,
    attack: number,
    release: number
  ): void {
    if (this.compressor) {
      this.compressor.threshold.value = Math.max(-60, Math.min(0, threshold));
      this.compressor.ratio.value = Math.max(1, Math.min(20, ratio));
      this.compressor.attack.value = Math.max(0.001, Math.min(1, attack));
      this.compressor.release.value = Math.max(0.01, Math.min(2, release));
    }
  }

  public async startMixdown(options: MixdownOptions): Promise<ArrayBuffer> {
    if (this.status !== 'ready') {
      throw new AudioAgentError('AudioMixer not ready for mixdown', this.id, this.type, 'NOT_READY');
    }

    try {
      this.status = 'processing';
      this.callbacks.onAgentStatusChange?.(this.id, this.status);

      // Set up recorder
      this.recorder = new Tone.Recorder();
      this.masterBus.connect(this.recorder);

      // Calculate mix duration
      const mixDuration = this.calculateMixDuration();

      // Apply mixdown options
      if (options.normalize) {
        await this.applyNormalization();
      }

      // Start recording
      await this.recorder.start();

      // Play all tracks
      await this.playAllTracks();

      // Wait for mix to complete
      await new Promise(resolve => setTimeout(resolve, (mixDuration + 1) * 1000));

      // Stop recording and get result
      const recording = await this.recorder.stop();
      let audioBuffer = await recording.arrayBuffer();

      // Apply post-processing
      if (options.fadeIn || options.fadeOut) {
        audioBuffer = await this.applyFades(audioBuffer, options.fadeIn, options.fadeOut);
      }

      if (options.limitPeaks) {
        audioBuffer = await this.applyPeakLimiting(audioBuffer);
      }

      // Optimize for social media if specified
      if (options.socialMediaOptimization) {
        audioBuffer = await this.optimizeForSocialMedia(audioBuffer, options.socialMediaOptimization);
      }

      // Clean up
      this.recorder.dispose();
      this.recorder = undefined;

      this.status = 'ready';
      this.callbacks.onAgentStatusChange?.(this.id, this.status);

      console.log(`🎛️ Mixdown completed: ${options.format.format} format`);
      return audioBuffer;
    } catch (error) {
      this.status = 'error';
      this.callbacks.onAgentStatusChange?.(this.id, this.status);
      throw new AudioAgentError(
        `Mixdown failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        this.id,
        this.type,
        'MIXDOWN_FAILED'
      );
    }
  }

  private calculateMixDuration(): number {
    let maxDuration = 0;

    for (const channel of this.channels.values()) {
      if (channel.input.audioData) {
        // Estimate duration from audio data
        // This would need proper implementation based on audio format
        maxDuration = Math.max(maxDuration, 10); // Placeholder
      }
    }

    return Math.max(maxDuration, 5); // Minimum 5 seconds
  }

  private async playAllTracks(): Promise<void> {
    const trackPromises: Promise<void>[] = [];

    for (const channel of this.channels.values()) {
      if (channel.input.audioData && !channel.muted) {
        const promise = this.playTrackAudio(channel);
        trackPromises.push(promise);
      }
    }

    await Promise.all(trackPromises);
  }

  private async playTrackAudio(channel: MixerChannel): Promise<void> {
    return new Promise((resolve) => {
      try {
        if (!channel.input.audioData) {
          resolve();
          return;
        }

        const player = new Tone.Player();
        const channelNode = this.channelNodes.get(channel.id);

        if (channelNode) {
          player.connect(channelNode);
        } else {
          player.connect(this.mixer);
        }

        // Load and play the audio data
        player.buffer.fromArray(channel.input.audioData);
        player.start();

        player.onstop = () => {
          player.dispose();
          resolve();
        };

        // Auto-stop after estimated duration
        setTimeout(() => {
          if (player.state === 'started') {
            player.stop();
          }
        }, 10000); // 10 second timeout
      } catch (error) {
        console.error('Error playing track audio:', error);
        resolve();
      }
    });
  }

  private async applyNormalization(): Promise<void> {
    // Adjust levels to maximize use of dynamic range
    // This is a simplified implementation
    this.setMasterVolume(-1); // Just below clipping
  }

  private async applyFades(
    audioBuffer: ArrayBuffer,
    fadeIn?: number,
    fadeOut?: number
  ): Promise<ArrayBuffer> {
    // Simplified fade implementation
    // In a real implementation, you would process the audio buffer samples
    return audioBuffer;
  }

  private async applyPeakLimiting(audioBuffer: ArrayBuffer): Promise<ArrayBuffer> {
    // Apply peak limiting to prevent clipping
    // This would involve analyzing and processing audio samples
    return audioBuffer;
  }

  private async optimizeForSocialMedia(
    audioBuffer: ArrayBuffer,
    format: SocialMediaFormat
  ): Promise<ArrayBuffer> {
    // Apply platform-specific audio optimization
    switch (format.platform) {
      case 'instagram':
        return this.optimizeForInstagram(audioBuffer, format);
      case 'tiktok':
        return this.optimizeForTikTok(audioBuffer, format);
      case 'youtube':
        return this.optimizeForYouTube(audioBuffer, format);
      case 'twitter':
        return this.optimizeForTwitter(audioBuffer, format);
      case 'facebook':
        return this.optimizeForFacebook(audioBuffer, format);
      default:
        return audioBuffer;
    }
  }

  private async optimizeForInstagram(
    audioBuffer: ArrayBuffer,
    format: SocialMediaFormat
  ): Promise<ArrayBuffer> {
    // Instagram-specific optimizations:
    // - Boost frequencies around 2-4kHz for smartphone speakers
    // - Apply mild compression for consistent levels
    // - Limit dynamic range for mobile playback
    return this.applyMobileOptimization(audioBuffer, format.compressionLevel);
  }

  private async optimizeForTikTok(
    audioBuffer: ArrayBuffer,
    format: SocialMediaFormat
  ): Promise<ArrayBuffer> {
    // TikTok-specific optimizations:
    // - Emphasize bass and high frequencies
    // - Heavy compression for punch
    // - Optimize for short-form content engagement
    return this.applyEngagementOptimization(audioBuffer, format.compressionLevel);
  }

  private async optimizeForYouTube(
    audioBuffer: ArrayBuffer,
    format: SocialMediaFormat
  ): Promise<ArrayBuffer> {
    // YouTube-specific optimizations:
    // - Maintain broader dynamic range
    // - Optimize for various playback devices
    // - Follow broadcast standards
    return this.applyBroadcastOptimization(audioBuffer, format.compressionLevel);
  }

  private async optimizeForTwitter(
    audioBuffer: ArrayBuffer,
    format: SocialMediaFormat
  ): Promise<ArrayBuffer> {
    // Twitter-specific optimizations similar to Instagram
    return this.applyMobileOptimization(audioBuffer, format.compressionLevel);
  }

  private async optimizeForFacebook(
    audioBuffer: ArrayBuffer,
    format: SocialMediaFormat
  ): Promise<ArrayBuffer> {
    // Facebook-specific optimizations
    return this.applyMobileOptimization(audioBuffer, format.compressionLevel);
  }

  private async applyMobileOptimization(
    audioBuffer: ArrayBuffer,
    compressionLevel: number
  ): Promise<ArrayBuffer> {
    // Simplified mobile optimization
    // In reality, this would apply EQ curves, compression, and limiting
    return audioBuffer;
  }

  private async applyEngagementOptimization(
    audioBuffer: ArrayBuffer,
    compressionLevel: number
  ): Promise<ArrayBuffer> {
    // Optimization for short-form, engagement-focused content
    return audioBuffer;
  }

  private async applyBroadcastOptimization(
    audioBuffer: ArrayBuffer,
    compressionLevel: number
  ): Promise<ArrayBuffer> {
    // Broadcast-standard optimization
    return audioBuffer;
  }

  public loadProject(project: AudioProject): void {
    this.currentProject = project;

    // Clear existing channels
    this.clearAllChannels();

    // Create channels for each track
    for (const track of project.tracks) {
      this.createMixerChannel(track);
    }

    // Set master settings
    this.setMasterVolume(project.masterVolume);

    console.log(`🎛️ Loaded project: ${project.name} with ${project.tracks.length} tracks`);
  }

  public clearAllChannels(): void {
    // Dispose all channel nodes
    for (const channelNode of this.channelNodes.values()) {
      channelNode.dispose();
    }

    // Dispose effect chains
    for (const effectChain of this.effectChains.values()) {
      for (const effect of effectChain) {
        effect.dispose();
      }
    }

    this.channels.clear();
    this.channelNodes.clear();
    this.effectChains.clear();
    this.metadata.channelsCount = 0;
  }

  public getSocialMediaFormat(formatName: string): SocialMediaFormat | undefined {
    return this.socialFormats.get(formatName);
  }

  public getAllSocialMediaFormats(): Map<string, SocialMediaFormat> {
    return new Map(this.socialFormats);
  }

  public getChannels(): Map<string, MixerChannel> {
    return new Map(this.channels);
  }

  public getChannelCount(): number {
    return this.channels.size;
  }

  public getCurrentProject(): AudioProject | undefined {
    return this.currentProject;
  }

  public getStatus(): AgentStatus {
    return this.status;
  }

  public dispose(): void {
    this.status = 'disposed';

    // Stop any recording
    if (this.recorder) {
      this.recorder.dispose();
    }

    // Clear all channels
    this.clearAllChannels();

    // Dispose master chain
    if (this.masterEQ) this.masterEQ.dispose();
    if (this.compressor) this.compressor.dispose();
    if (this.limiter) this.limiter.dispose();
    if (this.masterBus) this.masterBus.dispose();
    if (this.mixer) this.mixer.dispose();

    this.socialFormats.clear();
    this.currentProject = undefined;

    this.callbacks.onAgentStatusChange?.(this.id, this.status);
    console.log(`🎛️ AudioMixer ${this.id} disposed`);
  }
}