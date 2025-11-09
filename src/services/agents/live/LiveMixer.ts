/**
 * Live Audio/Video Mixer Agent
 *
 * Core agent responsible for real-time mixing of multiple audio/video streams
 * with low-latency processing, channel management, and master output control.
 */

import { EventEmitter } from 'events';
import {
  LiveMixerState,
  MixerChannel,
  Effect,
  EffectChain,
  LivePerformanceConfig,
  AudioProcessingNode,
  VisualizationData,
  LiveMixerMessage
} from '../../../../types';
import { MemoryManager } from '../MemoryManager';
import { ClaudeFlowIntegration } from '../ClaudeFlowIntegration';

export class LiveMixer extends EventEmitter {
  private audioContext: AudioContext;
  private masterGain: GainNode;
  private analyser: AnalyserNode;
  private compressor: DynamicsCompressorNode;
  private channels: Map<string, MixerChannelProcessor> = new Map();
  private effectChains: Map<string, EffectChainProcessor> = new Map();
  private isInitialized = false;
  private memoryManager: MemoryManager;
  private claudeFlow: ClaudeFlowIntegration;

  constructor(
    private config: LivePerformanceConfig,
    memoryManager: MemoryManager,
    claudeFlow: ClaudeFlowIntegration
  ) {
    super();
    this.memoryManager = memoryManager;
    this.claudeFlow = claudeFlow;
    this.setupAudioContext();
  }

  /**
   * Initialize audio context and master chain
   */
  private async setupAudioContext(): Promise<void> {
    try {
      this.audioContext = new AudioContext({
        sampleRate: this.config.sampleRate,
        latencyHint: this.config.latency === 'ultralow' ? 'interactive' :
                    this.config.latency === 'low' ? 'balanced' : 'playback'
      });

      // Create master audio chain
      this.masterGain = this.audioContext.createGain();
      this.compressor = this.audioContext.createDynamicsCompressor();
      this.analyser = this.audioContext.createAnalyser();

      // Setup analyser for visualization
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.3;

      // Connect master chain
      this.masterGain.connect(this.compressor);
      this.compressor.connect(this.analyser);
      this.analyser.connect(this.audioContext.destination);

      // Setup compressor for broadcast-ready output
      this.compressor.threshold.setValueAtTime(-12, this.audioContext.currentTime);
      this.compressor.knee.setValueAtTime(30, this.audioContext.currentTime);
      this.compressor.ratio.setValueAtTime(12, this.audioContext.currentTime);
      this.compressor.attack.setValueAtTime(0.003, this.audioContext.currentTime);
      this.compressor.release.setValueAtTime(0.25, this.audioContext.currentTime);

      this.isInitialized = true;
      this.emit('initialized');

      // Register with memory manager
      await this.memoryManager.store('live-mixer-status', {
        initialized: true,
        timestamp: Date.now(),
        masterVolume: 0.75
      });

      // Hook into Claude Flow
      await this.claudeFlow.executeHook('pre-task', {
        description: 'Live mixer initialized and ready for real-time processing'
      });

    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Add audio/video channel to the mixer
   */
  async addChannel(channelConfig: Omit<MixerChannel, 'source'>): Promise<string> {
    if (!this.isInitialized) {
      throw new Error('LiveMixer not initialized');
    }

    const channelProcessor = new MixerChannelProcessor(
      channelConfig,
      this.audioContext,
      this.masterGain
    );

    this.channels.set(channelConfig.id, channelProcessor);

    // Store in memory for coordination
    await this.memoryManager.store(`mixer-channel-${channelConfig.id}`, {
      ...channelConfig,
      addedAt: Date.now(),
      isConnected: false
    });

    this.emit('channelAdded', channelConfig.id);
    return channelConfig.id;
  }

  /**
   * Connect media source to channel
   */
  async connectSource(channelId: string, source: MediaStream): Promise<void> {
    const channel = this.channels.get(channelId);
    if (!channel) {
      throw new Error(`Channel ${channelId} not found`);
    }

    await channel.connectSource(source);

    // Update memory
    await this.memoryManager.store(`mixer-channel-${channelId}`, {
      ...(await this.memoryManager.retrieve(`mixer-channel-${channelId}`)),
      isConnected: true,
      connectedAt: Date.now()
    });

    this.emit('sourceConnected', { channelId, source });
  }

  /**
   * Set channel volume
   */
  setChannelVolume(channelId: string, volume: number): void {
    const channel = this.channels.get(channelId);
    if (channel) {
      channel.setVolume(volume);
      this.emit('volumeChanged', { channelId, volume });
    }
  }

  /**
   * Mute/unmute channel
   */
  toggleChannelMute(channelId: string): boolean {
    const channel = this.channels.get(channelId);
    if (channel) {
      const isMuted = channel.toggleMute();
      this.emit('muteToggled', { channelId, isMuted });
      return isMuted;
    }
    return false;
  }

  /**
   * Solo channel (mute all others)
   */
  soloChannel(channelId: string): void {
    this.channels.forEach((channel, id) => {
      if (id === channelId) {
        channel.setSolo(true);
      } else {
        channel.setSolo(false);
      }
    });
    this.emit('channelSoloed', channelId);
  }

  /**
   * Set master volume
   */
  setMasterVolume(volume: number): void {
    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(
        Math.max(0, Math.min(1, volume)),
        this.audioContext.currentTime
      );
      this.emit('masterVolumeChanged', volume);
    }
  }

  /**
   * Get real-time visualization data
   */
  getVisualizationData(): VisualizationData {
    const bufferLength = this.analyser.frequencyBinCount;
    const frequencyData = new Uint8Array(bufferLength);
    const timeDomainData = new Uint8Array(bufferLength);
    const waveformData = new Float32Array(bufferLength);

    this.analyser.getByteFrequencyData(frequencyData);
    this.analyser.getByteTimeDomainData(timeDomainData);
    this.analyser.getFloatTimeDomainData(waveformData);

    // Calculate peak and RMS levels for each channel
    const peakLevels: number[] = [];
    const rmsLevels: number[] = [];

    this.channels.forEach(channel => {
      const levels = channel.getLevels();
      peakLevels.push(levels.peak);
      rmsLevels.push(levels.rms);
    });

    // Calculate spectral features
    const spectralCentroid = this.calculateSpectralCentroid(frequencyData);
    const spectralRolloff = this.calculateSpectralRolloff(frequencyData);

    return {
      frequencyData,
      timeDomainData,
      waveformData,
      peakLevels,
      rmsLevels,
      spectralCentroid,
      spectralRolloff
    };
  }

  /**
   * Apply effect to channel
   */
  async applyEffect(channelId: string, effect: Effect): Promise<void> {
    const channel = this.channels.get(channelId);
    if (!channel) {
      throw new Error(`Channel ${channelId} not found`);
    }

    await channel.addEffect(effect);

    // Store effect state
    await this.memoryManager.store(`mixer-effect-${effect.id}`, {
      channelId,
      effect,
      appliedAt: Date.now()
    });

    this.emit('effectApplied', { channelId, effect });
  }

  /**
   * Remove effect from channel
   */
  async removeEffect(channelId: string, effectId: string): Promise<void> {
    const channel = this.channels.get(channelId);
    if (channel) {
      await channel.removeEffect(effectId);
      await this.memoryManager.remove(`mixer-effect-${effectId}`);
      this.emit('effectRemoved', { channelId, effectId });
    }
  }

  /**
   * Get current mixer state
   */
  async getState(): Promise<LiveMixerState> {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const inputDevices = devices.filter(d => d.kind === 'audioinput');
    const outputDevices = devices.filter(d => d.kind === 'audiooutput');

    const channels: MixerChannel[] = [];
    this.channels.forEach((processor, id) => {
      channels.push(processor.getChannelInfo());
    });

    return {
      isLive: this.isInitialized && this.audioContext.state === 'running',
      isRecording: false, // Will be managed by RecordingManager
      inputDevices,
      outputDevices,
      activeStreams: [], // Will be managed by StreamCoordinator
      masterVolume: this.masterGain.gain.value,
      channels,
      effects: Array.from(this.effectChains.values()).map(chain => chain.getInfo()),
      error: null
    };
  }

  /**
   * Send message to coordination system
   */
  async sendMessage(message: Omit<LiveMixerMessage, 'timestamp'>): Promise<void> {
    const fullMessage: LiveMixerMessage = {
      ...message,
      timestamp: Date.now()
    };

    await this.memoryManager.store(`mixer-message-${Date.now()}`, fullMessage);

    // Notify Claude Flow
    if (message.priority === 'high' || message.priority === 'critical') {
      await this.claudeFlow.executeHook('notify', {
        message: `Live mixer: ${message.type} - ${JSON.stringify(message.data)}`
      });
    }

    this.emit('messageSent', fullMessage);
  }

  /**
   * Calculate spectral centroid for timbral analysis
   */
  private calculateSpectralCentroid(frequencyData: Uint8Array): number {
    let weightedSum = 0;
    let magnitudeSum = 0;

    for (let i = 0; i < frequencyData.length; i++) {
      const magnitude = frequencyData[i] / 255.0;
      const frequency = (i * this.audioContext.sampleRate) / (2 * frequencyData.length);
      weightedSum += frequency * magnitude;
      magnitudeSum += magnitude;
    }

    return magnitudeSum > 0 ? weightedSum / magnitudeSum : 0;
  }

  /**
   * Calculate spectral rolloff for brightness analysis
   */
  private calculateSpectralRolloff(frequencyData: Uint8Array): number {
    const totalEnergy = frequencyData.reduce((sum, val) => sum + val * val, 0);
    const rolloffThreshold = 0.95 * totalEnergy;

    let cumulativeEnergy = 0;
    for (let i = 0; i < frequencyData.length; i++) {
      cumulativeEnergy += frequencyData[i] * frequencyData[i];
      if (cumulativeEnergy >= rolloffThreshold) {
        return (i * this.audioContext.sampleRate) / (2 * frequencyData.length);
      }
    }

    return this.audioContext.sampleRate / 2;
  }

  /**
   * Cleanup resources
   */
  async destroy(): Promise<void> {
    this.channels.forEach(channel => channel.destroy());
    this.effectChains.forEach(chain => chain.destroy());

    if (this.audioContext && this.audioContext.state !== 'closed') {
      await this.audioContext.close();
    }

    await this.claudeFlow.executeHook('post-task', {
      taskId: 'live-mixer-session'
    });
  }
}

/**
 * Individual channel processor
 */
class MixerChannelProcessor {
  private gainNode: GainNode;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private effectsChain: AudioNode[] = [];
  private isMuted = false;
  private isSolo = false;
  private volume = 0.75;
  private analyser: AnalyserNode;

  constructor(
    private config: Omit<MixerChannel, 'source'>,
    private audioContext: AudioContext,
    private destination: AudioNode
  ) {
    this.gainNode = audioContext.createGain();
    this.analyser = audioContext.createAnalyser();
    this.analyser.fftSize = 256;

    // Connect to destination
    this.gainNode.connect(this.analyser);
    this.analyser.connect(destination);
  }

  async connectSource(source: MediaStream): Promise<void> {
    if (this.sourceNode) {
      this.sourceNode.disconnect();
    }

    this.sourceNode = this.audioContext.createMediaStreamSource(source);

    // Connect through effects chain if present
    if (this.effectsChain.length > 0) {
      this.sourceNode.connect(this.effectsChain[0]);
    } else {
      this.sourceNode.connect(this.gainNode);
    }
  }

  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    this.updateGain();
  }

  toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    this.updateGain();
    return this.isMuted;
  }

  setSolo(solo: boolean): void {
    this.isSolo = solo;
    this.updateGain();
  }

  private updateGain(): void {
    const finalVolume = (this.isMuted || this.isSolo) ?
      (this.isSolo && !this.isMuted ? this.volume : 0) :
      this.volume;

    this.gainNode.gain.setValueAtTime(
      finalVolume,
      this.audioContext.currentTime
    );
  }

  getLevels(): { peak: number; rms: number } {
    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteTimeDomainData(dataArray);

    let peak = 0;
    let sum = 0;

    for (let i = 0; i < bufferLength; i++) {
      const sample = (dataArray[i] - 128) / 128;
      const abs = Math.abs(sample);
      peak = Math.max(peak, abs);
      sum += sample * sample;
    }

    const rms = Math.sqrt(sum / bufferLength);
    return { peak, rms };
  }

  async addEffect(effect: Effect): Promise<void> {
    // Effect implementation would be here
    // This is a simplified version - full implementation would include
    // all the effect types from the EffectType enum
  }

  async removeEffect(effectId: string): Promise<void> {
    // Remove effect from chain
  }

  getChannelInfo(): MixerChannel {
    return {
      ...this.config,
      source: this.sourceNode ? this.sourceNode.mediaStream : null,
      volume: this.volume,
      muted: this.isMuted,
      effects: [], // Would be populated from effects chain
      isActive: this.sourceNode !== null
    };
  }

  destroy(): void {
    if (this.sourceNode) {
      this.sourceNode.disconnect();
    }
    this.gainNode.disconnect();
    this.analyser.disconnect();
  }
}

/**
 * Effect chain processor
 */
class EffectChainProcessor {
  private effects: Map<string, AudioNode> = new Map();

  constructor(private config: EffectChain, private audioContext: AudioContext) {}

  getInfo(): EffectChain {
    return { ...this.config };
  }

  destroy(): void {
    this.effects.forEach(effect => effect.disconnect());
  }
}