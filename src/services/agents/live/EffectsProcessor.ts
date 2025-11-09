/**
 * Effects Processor Agent
 *
 * Real-time audio and video effects processing with a comprehensive
 * effect library, parameter automation, and preset management.
 */

import { EventEmitter } from 'events';
import {
  Effect,
  EffectType,
  EffectChain,
  AudioProcessingNode,
  LivePerformanceConfig,
  LiveMixerMessage
} from '../../../../types';
import { MemoryManager } from '../MemoryManager';
import { ClaudeFlowIntegration } from '../ClaudeFlowIntegration';

interface EffectPreset {
  id: string;
  name: string;
  effectType: EffectType;
  parameters: Record<string, number>;
  description: string;
  category: 'vocal' | 'instrument' | 'master' | 'creative';
}

interface AutomationPoint {
  time: number;
  value: number;
  curve?: 'linear' | 'exponential' | 'logarithmic';
}

interface ParameterAutomation {
  effectId: string;
  parameter: string;
  points: AutomationPoint[];
  loop: boolean;
}

export class EffectsProcessor extends EventEmitter {
  private audioContext: AudioContext;
  private effects: Map<string, EffectNode> = new Map();
  private presets: Map<string, EffectPreset> = new Map();
  private automations: Map<string, ParameterAutomation> = new Map();
  private processingNodes: Map<string, AudioProcessingNode> = new Map();
  private memoryManager: MemoryManager;
  private claudeFlow: ClaudeFlowIntegration;

  // Built-in presets
  private builtInPresets: EffectPreset[] = [
    // Reverb presets
    {
      id: 'hall_reverb',
      name: 'Concert Hall',
      effectType: 'reverb',
      parameters: { roomSize: 0.8, damping: 0.3, wetness: 0.4 },
      description: 'Large concert hall reverb',
      category: 'vocal'
    },
    {
      id: 'plate_reverb',
      name: 'Vintage Plate',
      effectType: 'reverb',
      parameters: { roomSize: 0.5, damping: 0.6, wetness: 0.3 },
      description: 'Classic plate reverb sound',
      category: 'instrument'
    },
    // Delay presets
    {
      id: 'eighth_delay',
      name: 'Eighth Note Delay',
      effectType: 'delay',
      parameters: { delayTime: 0.25, feedback: 0.4, wetness: 0.25 },
      description: 'Rhythmic eighth note delay',
      category: 'creative'
    },
    {
      id: 'slap_delay',
      name: 'Slap Back',
      effectType: 'delay',
      parameters: { delayTime: 0.1, feedback: 0.1, wetness: 0.2 },
      description: 'Classic slap back delay',
      category: 'vocal'
    },
    // Distortion presets
    {
      id: 'warm_overdrive',
      name: 'Warm Overdrive',
      effectType: 'distortion',
      parameters: { drive: 0.3, tone: 0.6, level: 0.8 },
      description: 'Warm tube-like overdrive',
      category: 'instrument'
    },
    {
      id: 'heavy_distortion',
      name: 'Heavy Metal',
      effectType: 'distortion',
      parameters: { drive: 0.8, tone: 0.4, level: 0.7 },
      description: 'High-gain distortion',
      category: 'instrument'
    },
    // EQ presets
    {
      id: 'vocal_clarity',
      name: 'Vocal Clarity',
      effectType: 'equalizer',
      parameters: { bass: -2, mid: 2, treble: 4, presence: 3 },
      description: 'Enhances vocal presence and clarity',
      category: 'vocal'
    },
    // Compressor presets
    {
      id: 'vocal_compressor',
      name: 'Vocal Compressor',
      effectType: 'compressor',
      parameters: { threshold: -18, ratio: 3, attack: 0.003, release: 0.1 },
      description: 'Smooth vocal compression',
      category: 'vocal'
    }
  ];

  constructor(
    private config: LivePerformanceConfig,
    audioContext: AudioContext,
    memoryManager: MemoryManager,
    claudeFlow: ClaudeFlowIntegration
  ) {
    super();
    this.audioContext = audioContext;
    this.memoryManager = memoryManager;
    this.claudeFlow = claudeFlow;
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      // Load built-in presets
      this.builtInPresets.forEach(preset => {
        this.presets.set(preset.id, preset);
      });

      // Register with memory manager
      await this.memoryManager.store('effects-processor-status', {
        initialized: true,
        timestamp: Date.now(),
        activeEffects: 0,
        presetsLoaded: this.presets.size
      });

      // Hook into Claude Flow
      await this.claudeFlow.executeHook('pre-task', {
        description: 'Effects processor initialized with comprehensive effect library'
      });

      this.emit('initialized');
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Create effect instance
   */
  async createEffect(effectConfig: Omit<Effect, 'id'>): Promise<string> {
    const effectId = `effect_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;\n\n    const effect: Effect = {\n      id: effectId,\n      ...effectConfig\n    };\n\n    try {\n      const effectNode = await this.createEffectNode(effect);\n      this.effects.set(effectId, effectNode);\n\n      // Store in memory\n      await this.memoryManager.store(`effect-${effectId}`, effect);\n\n      this.emit('effectCreated', effect);\n      return effectId;\n\n    } catch (error) {\n      this.emit('error', error);\n      throw error;\n    }\n  }\n\n  /**\n   * Create audio effect node based on type\n   */\n  private async createEffectNode(effect: Effect): Promise<EffectNode> {\n    switch (effect.type) {\n      case 'reverb':\n        return this.createReverbNode(effect);\n      case 'delay':\n        return this.createDelayNode(effect);\n      case 'chorus':\n        return this.createChorusNode(effect);\n      case 'distortion':\n        return this.createDistortionNode(effect);\n      case 'filter':\n        return this.createFilterNode(effect);\n      case 'compressor':\n        return this.createCompressorNode(effect);\n      case 'equalizer':\n        return this.createEqualizerNode(effect);\n      case 'autotune':\n        return this.createAutotuneNode(effect);\n      case 'noise_gate':\n        return this.createNoiseGateNode(effect);\n      case 'limiter':\n        return this.createLimiterNode(effect);\n      case 'bitcrusher':\n        return this.createBitcrusherNode(effect);\n      case 'granular':\n        return this.createGranularNode(effect);\n      default:\n        throw new Error(`Unsupported effect type: ${effect.type}`);\n    }\n  }\n\n  /**\n   * Create reverb effect\n   */\n  private createReverbNode(effect: Effect): ReverbNode {\n    const convolver = this.audioContext.createConvolver();\n    const input = this.audioContext.createGain();\n    const output = this.audioContext.createGain();\n    const wet = this.audioContext.createGain();\n    const dry = this.audioContext.createGain();\n\n    // Create impulse response\n    const impulse = this.createImpulseResponse(\n      effect.parameters.roomSize || 0.5,\n      effect.parameters.damping || 0.5\n    );\n    convolver.buffer = impulse;\n\n    // Set up routing\n    input.connect(dry);\n    input.connect(convolver);\n    convolver.connect(wet);\n    dry.connect(output);\n    wet.connect(output);\n\n    // Set initial parameters\n    wet.gain.value = effect.wetness;\n    dry.gain.value = 1 - effect.wetness;\n\n    return new ReverbNode({\n      input,\n      output,\n      convolver,\n      wet,\n      dry,\n      effect\n    });\n  }\n\n  /**\n   * Create delay effect\n   */\n  private createDelayNode(effect: Effect): DelayNode {\n    const delay = this.audioContext.createDelay(2.0);\n    const feedback = this.audioContext.createGain();\n    const wet = this.audioContext.createGain();\n    const dry = this.audioContext.createGain();\n    const input = this.audioContext.createGain();\n    const output = this.audioContext.createGain();\n\n    // Set up delay chain\n    input.connect(delay);\n    input.connect(dry);\n    delay.connect(feedback);\n    delay.connect(wet);\n    feedback.connect(delay);\n    wet.connect(output);\n    dry.connect(output);\n\n    // Set initial parameters\n    delay.delayTime.value = effect.parameters.delayTime || 0.25;\n    feedback.gain.value = effect.parameters.feedback || 0.3;\n    wet.gain.value = effect.wetness;\n    dry.gain.value = 1 - effect.wetness;\n\n    return new DelayNode({\n      input,\n      output,\n      delay,\n      feedback,\n      wet,\n      dry,\n      effect\n    });\n  }\n\n  /**\n   * Create chorus effect\n   */\n  private createChorusNode(effect: Effect): ChorusNode {\n    const delay = this.audioContext.createDelay(0.05);\n    const lfo = this.audioContext.createOscillator();\n    const lfoGain = this.audioContext.createGain();\n    const wet = this.audioContext.createGain();\n    const dry = this.audioContext.createGain();\n    const input = this.audioContext.createGain();\n    const output = this.audioContext.createGain();\n\n    // Set up chorus chain\n    lfo.connect(lfoGain);\n    lfoGain.connect(delay.delayTime);\n    input.connect(delay);\n    input.connect(dry);\n    delay.connect(wet);\n    wet.connect(output);\n    dry.connect(output);\n\n    // Set initial parameters\n    lfo.frequency.value = effect.parameters.rate || 1.5;\n    lfoGain.gain.value = effect.parameters.depth || 0.005;\n    delay.delayTime.value = effect.parameters.delay || 0.02;\n    wet.gain.value = effect.wetness;\n    dry.gain.value = 1 - effect.wetness;\n\n    lfo.start();\n\n    return new ChorusNode({\n      input,\n      output,\n      delay,\n      lfo,\n      lfoGain,\n      wet,\n      dry,\n      effect\n    });\n  }\n\n  /**\n   * Create distortion effect\n   */\n  private createDistortionNode(effect: Effect): DistortionNode {\n    const waveshaper = this.audioContext.createWaveShaper();\n    const input = this.audioContext.createGain();\n    const output = this.audioContext.createGain();\n    const drive = this.audioContext.createGain();\n    const tone = this.audioContext.createBiquadFilter();\n\n    // Create distortion curve\n    const curve = this.createDistortionCurve(effect.parameters.drive || 0.5);\n    waveshaper.curve = curve;\n    waveshaper.oversample = '4x';\n\n    // Set up chain\n    input.connect(drive);\n    drive.connect(waveshaper);\n    waveshaper.connect(tone);\n    tone.connect(output);\n\n    // Set initial parameters\n    drive.gain.value = 1 + (effect.parameters.drive || 0.5) * 10;\n    tone.type = 'lowpass';\n    tone.frequency.value = 2000 + (effect.parameters.tone || 0.5) * 8000;\n    output.gain.value = effect.parameters.level || 0.8;\n\n    return new DistortionNode({\n      input,\n      output,\n      waveshaper,\n      drive,\n      tone,\n      effect\n    });\n  }\n\n  /**\n   * Create filter effect\n   */\n  private createFilterNode(effect: Effect): FilterNode {\n    const filter = this.audioContext.createBiquadFilter();\n    const input = this.audioContext.createGain();\n    const output = this.audioContext.createGain();\n\n    // Set up filter\n    input.connect(filter);\n    filter.connect(output);\n\n    // Set initial parameters\n    filter.type = (effect.parameters.type as BiquadFilterType) || 'lowpass';\n    filter.frequency.value = effect.parameters.frequency || 1000;\n    filter.Q.value = effect.parameters.resonance || 1;\n    filter.gain.value = effect.parameters.gain || 0;\n\n    return new FilterNode({\n      input,\n      output,\n      filter,\n      effect\n    });\n  }\n\n  /**\n   * Create compressor effect\n   */\n  private createCompressorNode(effect: Effect): CompressorNode {\n    const compressor = this.audioContext.createDynamicsCompressor();\n    const input = this.audioContext.createGain();\n    const output = this.audioContext.createGain();\n\n    // Set up compressor\n    input.connect(compressor);\n    compressor.connect(output);\n\n    // Set initial parameters\n    compressor.threshold.value = effect.parameters.threshold || -24;\n    compressor.knee.value = effect.parameters.knee || 30;\n    compressor.ratio.value = effect.parameters.ratio || 12;\n    compressor.attack.value = effect.parameters.attack || 0.003;\n    compressor.release.value = effect.parameters.release || 0.25;\n\n    return new CompressorNode({\n      input,\n      output,\n      compressor,\n      effect\n    });\n  }\n\n  /**\n   * Create equalizer effect\n   */\n  private createEqualizerNode(effect: Effect): EqualizerNode {\n    const lowShelf = this.audioContext.createBiquadFilter();\n    const midPeaking = this.audioContext.createBiquadFilter();\n    const highShelf = this.audioContext.createBiquadFilter();\n    const input = this.audioContext.createGain();\n    const output = this.audioContext.createGain();\n\n    // Set up EQ chain\n    input.connect(lowShelf);\n    lowShelf.connect(midPeaking);\n    midPeaking.connect(highShelf);\n    highShelf.connect(output);\n\n    // Configure filters\n    lowShelf.type = 'lowshelf';\n    lowShelf.frequency.value = 320;\n    lowShelf.gain.value = effect.parameters.bass || 0;\n\n    midPeaking.type = 'peaking';\n    midPeaking.frequency.value = 1000;\n    midPeaking.Q.value = 0.5;\n    midPeaking.gain.value = effect.parameters.mid || 0;\n\n    highShelf.type = 'highshelf';\n    highShelf.frequency.value = 3200;\n    highShelf.gain.value = effect.parameters.treble || 0;\n\n    return new EqualizerNode({\n      input,\n      output,\n      lowShelf,\n      midPeaking,\n      highShelf,\n      effect\n    });\n  }\n\n  // Placeholder implementations for advanced effects\n  private createAutotuneNode(effect: Effect): EffectNode {\n    // Simplified autotune implementation\n    const input = this.audioContext.createGain();\n    const output = this.audioContext.createGain();\n    input.connect(output);\n\n    return new EffectNode({\n      input,\n      output,\n      effect\n    });\n  }\n\n  private createNoiseGateNode(effect: Effect): EffectNode {\n    const input = this.audioContext.createGain();\n    const output = this.audioContext.createGain();\n    input.connect(output);\n\n    return new EffectNode({\n      input,\n      output,\n      effect\n    });\n  }\n\n  private createLimiterNode(effect: Effect): EffectNode {\n    const compressor = this.audioContext.createDynamicsCompressor();\n    const input = this.audioContext.createGain();\n    const output = this.audioContext.createGain();\n\n    input.connect(compressor);\n    compressor.connect(output);\n\n    // Hard limiting settings\n    compressor.threshold.value = effect.parameters.ceiling || -0.1;\n    compressor.knee.value = 0;\n    compressor.ratio.value = 20;\n    compressor.attack.value = 0;\n    compressor.release.value = 0.01;\n\n    return new EffectNode({\n      input,\n      output,\n      effect\n    });\n  }\n\n  private createBitcrusherNode(effect: Effect): EffectNode {\n    // Simplified bitcrusher using script processor\n    const input = this.audioContext.createGain();\n    const output = this.audioContext.createGain();\n    input.connect(output);\n\n    return new EffectNode({\n      input,\n      output,\n      effect\n    });\n  }\n\n  private createGranularNode(effect: Effect): EffectNode {\n    // Simplified granular synthesis\n    const input = this.audioContext.createGain();\n    const output = this.audioContext.createGain();\n    input.connect(output);\n\n    return new EffectNode({\n      input,\n      output,\n      effect\n    });\n  }\n\n  /**\n   * Apply preset to effect\n   */\n  async applyPreset(effectId: string, presetId: string): Promise<void> {\n    const effect = this.effects.get(effectId);\n    const preset = this.presets.get(presetId);\n\n    if (!effect || !preset) {\n      throw new Error('Effect or preset not found');\n    }\n\n    if (effect.effect.type !== preset.effectType) {\n      throw new Error('Preset type does not match effect type');\n    }\n\n    // Apply preset parameters\n    await this.updateEffectParameters(effectId, preset.parameters);\n\n    this.emit('presetApplied', { effectId, presetId });\n  }\n\n  /**\n   * Update effect parameters\n   */\n  async updateEffectParameters(effectId: string, parameters: Record<string, number>): Promise<void> {\n    const effectNode = this.effects.get(effectId);\n    if (!effectNode) {\n      throw new Error('Effect not found');\n    }\n\n    // Update effect parameters based on type\n    await effectNode.updateParameters(parameters);\n\n    // Store updated effect\n    const effect = effectNode.effect;\n    effect.parameters = { ...effect.parameters, ...parameters };\n    await this.memoryManager.store(`effect-${effectId}`, effect);\n\n    this.emit('parametersUpdated', { effectId, parameters });\n  }\n\n  /**\n   * Create automation for effect parameter\n   */\n  async createAutomation(\n    effectId: string,\n    parameter: string,\n    points: AutomationPoint[],\n    loop = false\n  ): Promise<string> {\n    const automationId = `auto_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;\n\n    const automation: ParameterAutomation = {\n      effectId,\n      parameter,\n      points: points.sort((a, b) => a.time - b.time),\n      loop\n    };\n\n    this.automations.set(automationId, automation);\n\n    // Start automation\n    this.startAutomation(automationId);\n\n    this.emit('automationCreated', { automationId, automation });\n    return automationId;\n  }\n\n  /**\n   * Start parameter automation\n   */\n  private startAutomation(automationId: string): void {\n    const automation = this.automations.get(automationId);\n    if (!automation) return;\n\n    const effectNode = this.effects.get(automation.effectId);\n    if (!effectNode) return;\n\n    const startTime = this.audioContext.currentTime;\n    const duration = automation.points[automation.points.length - 1].time;\n\n    const scheduleAutomation = (offset = 0) => {\n      automation.points.forEach(point => {\n        const time = startTime + offset + point.time;\n        effectNode.automateParameter(automation.parameter, point.value, time, point.curve);\n      });\n\n      if (automation.loop) {\n        setTimeout(() => {\n          scheduleAutomation(offset + duration);\n        }, duration * 1000);\n      }\n    };\n\n    scheduleAutomation();\n  }\n\n  /**\n   * Create impulse response for reverb\n   */\n  private createImpulseResponse(roomSize: number, damping: number): AudioBuffer {\n    const sampleRate = this.audioContext.sampleRate;\n    const length = Math.floor(sampleRate * roomSize * 4); // Up to 4 seconds\n    const impulse = this.audioContext.createBuffer(2, length, sampleRate);\n\n    for (let channel = 0; channel < 2; channel++) {\n      const channelData = impulse.getChannelData(channel);\n      for (let i = 0; i < length; i++) {\n        const decay = Math.pow(1 - (i / length), damping * 3);\n        channelData[i] = (Math.random() * 2 - 1) * decay;\n      }\n    }\n\n    return impulse;\n  }\n\n  /**\n   * Create distortion curve\n   */\n  private createDistortionCurve(amount: number): Float32Array {\n    const samples = 44100;\n    const curve = new Float32Array(samples);\n    const deg = Math.PI / 180;\n\n    for (let i = 0; i < samples; i++) {\n      const x = (i * 2) / samples - 1;\n      curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));\n    }\n\n    return curve;\n  }\n\n  /**\n   * Get all available presets\n   */\n  getPresets(): EffectPreset[] {\n    return Array.from(this.presets.values());\n  }\n\n  /**\n   * Save custom preset\n   */\n  async savePreset(\n    name: string,\n    effectType: EffectType,\n    parameters: Record<string, number>,\n    category: 'vocal' | 'instrument' | 'master' | 'creative'\n  ): Promise<string> {\n    const presetId = `preset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;\n\n    const preset: EffectPreset = {\n      id: presetId,\n      name,\n      effectType,\n      parameters,\n      description: 'Custom preset',\n      category\n    };\n\n    this.presets.set(presetId, preset);\n\n    // Store in memory\n    await this.memoryManager.store(`preset-${presetId}`, preset);\n\n    this.emit('presetSaved', preset);\n    return presetId;\n  }\n\n  /**\n   * Remove effect\n   */\n  async removeEffect(effectId: string): Promise<void> {\n    const effectNode = this.effects.get(effectId);\n    if (effectNode) {\n      effectNode.disconnect();\n      this.effects.delete(effectId);\n      await this.memoryManager.remove(`effect-${effectId}`);\n      this.emit('effectRemoved', effectId);\n    }\n  }\n\n  /**\n   * Send message to coordination system\n   */\n  private async sendMessage(message: Omit<LiveMixerMessage, 'timestamp'>): Promise<void> {\n    const fullMessage: LiveMixerMessage = {\n      ...message,\n      timestamp: Date.now()\n    };\n\n    await this.memoryManager.store(`effects-message-${Date.now()}`, fullMessage);\n\n    this.emit('messageSent', fullMessage);\n  }\n\n  /**\n   * Cleanup resources\n   */\n  async destroy(): Promise<void> {\n    // Disconnect all effects\n    this.effects.forEach(effect => effect.disconnect());\n    this.effects.clear();\n    this.automations.clear();\n\n    await this.claudeFlow.executeHook('post-task', {\n      taskId: 'effects-processor-session'\n    });\n  }\n}\n\n// Base effect node class\nclass EffectNode {\n  protected nodes: Record<string, AudioNode>;\n  public effect: Effect;\n\n  constructor(config: { input: GainNode; output: GainNode; effect: Effect; [key: string]: any }) {\n    this.nodes = config;\n    this.effect = config.effect;\n  }\n\n  getInput(): AudioNode {\n    return this.nodes.input;\n  }\n\n  getOutput(): AudioNode {\n    return this.nodes.output;\n  }\n\n  async updateParameters(parameters: Record<string, number>): Promise<void> {\n    // Override in subclasses\n  }\n\n  automateParameter(parameter: string, value: number, time: number, curve?: string): void {\n    // Override in subclasses\n  }\n\n  disconnect(): void {\n    Object.values(this.nodes).forEach(node => {\n      if (node && typeof node.disconnect === 'function') {\n        node.disconnect();\n      }\n    });\n  }\n}\n\n// Specific effect node classes\nclass ReverbNode extends EffectNode {\n  async updateParameters(parameters: Record<string, number>): Promise<void> {\n    if (parameters.wetness !== undefined) {\n      (this.nodes.wet as GainNode).gain.setValueAtTime(\n        parameters.wetness,\n        (this.nodes.wet as AudioNode).context.currentTime\n      );\n      (this.nodes.dry as GainNode).gain.setValueAtTime(\n        1 - parameters.wetness,\n        (this.nodes.dry as AudioNode).context.currentTime\n      );\n    }\n  }\n}\n\nclass DelayNode extends EffectNode {\n  async updateParameters(parameters: Record<string, number>): Promise<void> {\n    const currentTime = (this.nodes.delay as DelayNode).context.currentTime;\n\n    if (parameters.delayTime !== undefined) {\n      (this.nodes.delay as DelayNode).delayTime.setValueAtTime(\n        parameters.delayTime,\n        currentTime\n      );\n    }\n    if (parameters.feedback !== undefined) {\n      (this.nodes.feedback as GainNode).gain.setValueAtTime(\n        parameters.feedback,\n        currentTime\n      );\n    }\n    if (parameters.wetness !== undefined) {\n      (this.nodes.wet as GainNode).gain.setValueAtTime(\n        parameters.wetness,\n        currentTime\n      );\n      (this.nodes.dry as GainNode).gain.setValueAtTime(\n        1 - parameters.wetness,\n        currentTime\n      );\n    }\n  }\n}\n\nclass ChorusNode extends EffectNode {\n  async updateParameters(parameters: Record<string, number>): Promise<void> {\n    const currentTime = (this.nodes.lfo as OscillatorNode).context.currentTime;\n\n    if (parameters.rate !== undefined) {\n      (this.nodes.lfo as OscillatorNode).frequency.setValueAtTime(\n        parameters.rate,\n        currentTime\n      );\n    }\n    if (parameters.depth !== undefined) {\n      (this.nodes.lfoGain as GainNode).gain.setValueAtTime(\n        parameters.depth,\n        currentTime\n      );\n    }\n  }\n}\n\nclass DistortionNode extends EffectNode {\n  async updateParameters(parameters: Record<string, number>): Promise<void> {\n    const currentTime = (this.nodes.drive as GainNode).context.currentTime;\n\n    if (parameters.drive !== undefined) {\n      (this.nodes.drive as GainNode).gain.setValueAtTime(\n        1 + parameters.drive * 10,\n        currentTime\n      );\n    }\n    if (parameters.tone !== undefined) {\n      (this.nodes.tone as BiquadFilterNode).frequency.setValueAtTime(\n        2000 + parameters.tone * 8000,\n        currentTime\n      );\n    }\n    if (parameters.level !== undefined) {\n      (this.nodes.output as GainNode).gain.setValueAtTime(\n        parameters.level,\n        currentTime\n      );\n    }\n  }\n}\n\nclass FilterNode extends EffectNode {\n  async updateParameters(parameters: Record<string, number>): Promise<void> {\n    const currentTime = (this.nodes.filter as BiquadFilterNode).context.currentTime;\n\n    if (parameters.frequency !== undefined) {\n      (this.nodes.filter as BiquadFilterNode).frequency.setValueAtTime(\n        parameters.frequency,\n        currentTime\n      );\n    }\n    if (parameters.resonance !== undefined) {\n      (this.nodes.filter as BiquadFilterNode).Q.setValueAtTime(\n        parameters.resonance,\n        currentTime\n      );\n    }\n  }\n}\n\nclass CompressorNode extends EffectNode {\n  async updateParameters(parameters: Record<string, number>): Promise<void> {\n    const currentTime = (this.nodes.compressor as DynamicsCompressorNode).context.currentTime;\n\n    if (parameters.threshold !== undefined) {\n      (this.nodes.compressor as DynamicsCompressorNode).threshold.setValueAtTime(\n        parameters.threshold,\n        currentTime\n      );\n    }\n    if (parameters.ratio !== undefined) {\n      (this.nodes.compressor as DynamicsCompressorNode).ratio.setValueAtTime(\n        parameters.ratio,\n        currentTime\n      );\n    }\n    if (parameters.attack !== undefined) {\n      (this.nodes.compressor as DynamicsCompressorNode).attack.setValueAtTime(\n        parameters.attack,\n        currentTime\n      );\n    }\n    if (parameters.release !== undefined) {\n      (this.nodes.compressor as DynamicsCompressorNode).release.setValueAtTime(\n        parameters.release,\n        currentTime\n      );\n    }\n  }\n}\n\nclass EqualizerNode extends EffectNode {\n  async updateParameters(parameters: Record<string, number>): Promise<void> {\n    const currentTime = (this.nodes.lowShelf as BiquadFilterNode).context.currentTime;\n\n    if (parameters.bass !== undefined) {\n      (this.nodes.lowShelf as BiquadFilterNode).gain.setValueAtTime(\n        parameters.bass,\n        currentTime\n      );\n    }\n    if (parameters.mid !== undefined) {\n      (this.nodes.midPeaking as BiquadFilterNode).gain.setValueAtTime(\n        parameters.mid,\n        currentTime\n      );\n    }\n    if (parameters.treble !== undefined) {\n      (this.nodes.highShelf as BiquadFilterNode).gain.setValueAtTime(\n        parameters.treble,\n        currentTime\n      );\n    }\n  }\n}