/**
 * Neural Melody Integration Agent
 *
 * Integrates NeuralMelodyPlayer with the live mixer system for
 * real-time AI music generation, live performance enhancement,
 * and interactive musical experiences.
 */

import { EventEmitter } from 'events';
import {
  NoteSequence,
  AudioNote,
  NeuralMelodyConfig,
  AudioPlayerState,
  LiveMixerMessage,
  MixerChannel
} from '../../../../types';
import { MemoryManager } from '../MemoryManager';
import { ClaudeFlowIntegration } from '../ClaudeFlowIntegration';

interface LiveMelodyConfig extends NeuralMelodyConfig {
  liveMode: boolean;
  responsiveness: 'immediate' | 'bars' | 'phrases';
  harmonization: boolean;
  adaptToAudio: boolean;
  generationLength: number; // bars
  looping: boolean;
}

interface MelodyPattern {
  id: string;
  name: string;
  sequence: NoteSequence;
  tempo: number;
  key: string;
  scale: string;
  complexity: number;
  mood: 'happy' | 'sad' | 'energetic' | 'calm' | 'dramatic';
}

interface LiveGenerationContext {
  currentTempo: number;
  currentKey: string;
  audioFeatures: {
    rms: number;
    spectralCentroid: number;
    chroma: number[];
  };
  userInput: {
    velocity: number;
    density: number;
    style: string;
  };
  timeSignature: [number, number];
}

export class NeuralMelodyIntegration extends EventEmitter {
  private melodyPlayer: NeuralMelodyPlayer;
  private audioContext: AudioContext;
  private outputNode: GainNode;
  private patterns: Map<string, MelodyPattern> = new Map();
  private isGenerating = false;
  private currentContext: LiveGenerationContext;
  private memoryManager: MemoryManager;
  private claudeFlow: ClaudeFlowIntegration;

  // Live performance state
  private liveConfig: LiveMelodyConfig;
  private generationBuffer: NoteSequence[] = [];
  private currentSequenceIndex = 0;
  private nextGenerationTime = 0;

  constructor(
    audioContext: AudioContext,
    memoryManager: MemoryManager,
    claudeFlow: ClaudeFlowIntegration,
    config: Partial<LiveMelodyConfig> = {}
  ) {
    super();
    this.audioContext = audioContext;
    this.memoryManager = memoryManager;
    this.claudeFlow = claudeFlow;

    this.liveConfig = {
      temperature: 0.8,
      stepsPerQuarter: 4,
      totalSteps: 64, // 4 bars in 4/4
      minNote: 48, // C3
      maxNote: 84, // C6
      liveMode: true,
      responsiveness: 'bars',
      harmonization: true,
      adaptToAudio: true,
      generationLength: 4, // 4 bars
      looping: true,
      ...config
    };

    this.currentContext = {
      currentTempo: 120,
      currentKey: 'C',
      audioFeatures: {
        rms: 0,
        spectralCentroid: 1000,
        chroma: new Array(12).fill(0)
      },
      userInput: {
        velocity: 0.7,
        density: 0.5,
        style: 'melodic'
      },
      timeSignature: [4, 4]
    };

    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      // Initialize neural melody player
      this.melodyPlayer = new NeuralMelodyPlayer(this.audioContext, this.liveConfig);
      await this.melodyPlayer.initialize();

      // Create output node for live mixing
      this.outputNode = this.audioContext.createGain();
      this.outputNode.gain.value = 0.8;

      // Connect melody player to output
      await this.melodyPlayer.connect(this.outputNode);

      // Load default patterns
      await this.loadDefaultPatterns();

      // Register with memory manager
      await this.memoryManager.store('neural-melody-integration-status', {
        initialized: true,
        timestamp: Date.now(),
        liveMode: this.liveConfig.liveMode,
        patternsLoaded: this.patterns.size
      });

      // Hook into Claude Flow
      await this.claudeFlow.executeHook('pre-task', {
        description: 'Neural melody integration initialized for live AI music generation'
      });

      // Start live generation if in live mode
      if (this.liveConfig.liveMode) {
        this.startLiveGeneration();
      }

      this.emit('initialized');
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Connect to mixer channel
   */
  async connectToMixer(channelId: string): Promise<void> {
    // Store mixer connection info
    await this.memoryManager.store('neural-melody-mixer-connection', {
      channelId,
      connected: true,
      timestamp: Date.now()
    });

    this.emit('mixerConnected', { channelId });
  }

  /**
   * Get output node for mixer routing
   */
  getOutputNode(): AudioNode {
    return this.outputNode;
  }

  /**
   * Update live generation context from audio analysis
   */
  async updateGenerationContext(audioAnalysis: any): Promise<void> {
    if (!this.liveConfig.adaptToAudio) return;

    this.currentContext.audioFeatures = {
      rms: audioAnalysis.rms || 0,
      spectralCentroid: audioAnalysis.spectralCentroid || 1000,
      chroma: audioAnalysis.chroma || new Array(12).fill(0)
    };

    // Adapt generation parameters based on audio
    await this.adaptToAudioFeatures();

    // Store context in memory
    await this.memoryManager.store('neural-melody-context', {
      ...this.currentContext,
      timestamp: Date.now()
    });
  }

  /**
   * Adapt melody generation to audio features
   */
  private async adaptToAudioFeatures(): Promise<void> {
    const { audioFeatures } = this.currentContext;

    // Adapt tempo based on audio energy
    const energyFactor = Math.sqrt(audioFeatures.rms);
    this.currentContext.currentTempo = 60 + (energyFactor * 100); // 60-160 BPM range

    // Adapt key based on chroma features
    if (audioFeatures.chroma.length === 12) {
      const dominantPitch = audioFeatures.chroma.indexOf(Math.max(...audioFeatures.chroma));
      const keyNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
      this.currentContext.currentKey = keyNames[dominantPitch];
    }

    // Adapt complexity based on spectral centroid
    const brightness = audioFeatures.spectralCentroid / 4000; // Normalize to 0-1
    this.currentContext.userInput.density = Math.min(1, brightness);
  }

  /**
   * Generate melody sequence based on current context
   */
  async generateMelody(
    style?: string,
    length?: number,
    customConfig?: Partial<NeuralMelodyConfig>
  ): Promise<NoteSequence> {
    try {
      const config: NeuralMelodyConfig = {
        ...this.liveConfig,
        ...customConfig,
        totalSteps: (length || this.liveConfig.generationLength) * this.liveConfig.stepsPerQuarter * 4
      };

      // Adjust config based on context
      if (this.liveConfig.adaptToAudio) {
        config.temperature = 0.5 + (this.currentContext.userInput.density * 0.5);
      }

      // Generate sequence
      const sequence = await this.melodyPlayer.generateSequence(config);

      // Post-process for live performance
      const processedSequence = this.processForLivePerformance(sequence);

      // Store in buffer for live playback
      this.generationBuffer.push(processedSequence);

      // Limit buffer size
      if (this.generationBuffer.length > 10) {
        this.generationBuffer.shift();
      }

      this.emit('melodyGenerated', { sequence: processedSequence, style, length });
      return processedSequence;

    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Process sequence for live performance
   */
  private processForLivePerformance(sequence: NoteSequence): NoteSequence {
    // Quantize notes to beat grid
    const quantizedNotes = sequence.notes.map(note => ({
      ...note,
      startTime: this.quantizeTime(note.startTime),
      endTime: this.quantizeTime(note.endTime)
    }));

    // Apply swing if needed
    const swungNotes = this.applySwing(quantizedNotes, 0.1);

    // Adjust velocity based on context
    const velocityAdjustedNotes = swungNotes.map(note => ({
      ...note,
      velocity: note.velocity * this.currentContext.userInput.velocity
    }));

    return {
      ...sequence,
      notes: velocityAdjustedNotes
    };
  }

  /**
   * Quantize time to beat grid
   */
  private quantizeTime(time: number): number {
    const beatLength = 60 / this.currentContext.currentTempo;
    const sixteenthLength = beatLength / 4;
    return Math.round(time / sixteenthLength) * sixteenthLength;
  }

  /**
   * Apply swing timing
   */
  private applySwing(notes: AudioNote[], swingAmount: number): AudioNote[] {
    const beatLength = 60 / this.currentContext.currentTempo;
    const eighthLength = beatLength / 2;

    return notes.map(note => {
      const beatPosition = note.startTime % beatLength;
      const eighthPosition = beatPosition % eighthLength;

      // Apply swing to off-beats
      if (Math.abs(eighthPosition - eighthLength / 2) < 0.01) {
        const swingOffset = eighthLength * swingAmount * 0.1;
        return {
          ...note,
          startTime: note.startTime + swingOffset,
          endTime: note.endTime + swingOffset
        };
      }

      return note;
    });
  }

  /**
   * Start live melody generation
   */
  private startLiveGeneration(): void {
    if (this.isGenerating) return;

    this.isGenerating = true;

    const generateNext = () => {
      if (!this.isGenerating) return;

      const currentTime = this.audioContext.currentTime;

      // Check if we need to generate next sequence
      if (currentTime >= this.nextGenerationTime - 1) { // 1 second ahead
        this.generateMelody().then(() => {
          // Schedule next generation
          const barLength = (60 / this.currentContext.currentTempo) * 4; // 4 beats per bar
          this.nextGenerationTime = currentTime + (barLength * this.liveConfig.generationLength);
        });
      }

      // Schedule next check
      setTimeout(generateNext, 100); // Check every 100ms
    };

    generateNext();
  }

  /**
   * Stop live generation
   */
  stopLiveGeneration(): void {
    this.isGenerating = false;
    this.melodyPlayer.stop();
  }

  /**
   * Play specific pattern
   */
  async playPattern(patternId: string): Promise<void> {
    const pattern = this.patterns.get(patternId);
    if (!pattern) {
      throw new Error(`Pattern not found: ${patternId}`);
    }

    await this.melodyPlayer.playSequence(pattern.sequence);
    this.emit('patternPlaying', { patternId, pattern });
  }

  /**
   * Create custom pattern from current generation
   */
  async createPattern(
    name: string,
    sequence: NoteSequence,
    metadata: Partial<MelodyPattern> = {}
  ): Promise<string> {
    const patternId = `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const pattern: MelodyPattern = {
      id: patternId,
      name,
      sequence,
      tempo: this.currentContext.currentTempo,
      key: this.currentContext.currentKey,
      scale: 'major', // Default
      complexity: this.calculateComplexity(sequence),
      mood: 'happy', // Default
      ...metadata
    };

    this.patterns.set(patternId, pattern);

    // Store in memory
    await this.memoryManager.store(`melody-pattern-${patternId}`, pattern);

    this.emit('patternCreated', pattern);
    return patternId;
  }

  /**
   * Calculate melody complexity
   */
  private calculateComplexity(sequence: NoteSequence): number {
    const notes = sequence.notes;
    if (notes.length === 0) return 0;

    // Factors: note density, pitch range, rhythm complexity
    const density = notes.length / sequence.totalTime;
    const pitchRange = Math.max(...notes.map(n => n.pitch)) - Math.min(...notes.map(n => n.pitch));
    const rhythmComplexity = this.calculateRhythmComplexity(notes);

    return Math.min(1, (density / 10 + pitchRange / 48 + rhythmComplexity) / 3);
  }

  /**
   * Calculate rhythm complexity
   */
  private calculateRhythmComplexity(notes: AudioNote[]): number {
    const durations = notes.map(n => n.endTime - n.startTime);
    const uniqueDurations = [...new Set(durations.map(d => Math.round(d * 100) / 100))];
    return Math.min(1, uniqueDurations.length / notes.length);
  }

  /**
   * Load default melody patterns
   */
  private async loadDefaultPatterns(): Promise<void> {
    const defaultPatterns: Omit<MelodyPattern, 'id'>[] = [
      {
        name: 'Simple Melody',
        sequence: this.createSimplePattern(),
        tempo: 120,
        key: 'C',
        scale: 'major',
        complexity: 0.3,
        mood: 'happy'
      },
      {
        name: 'Arpeggiated',
        sequence: this.createArpeggiatedPattern(),
        tempo: 100,
        key: 'Am',
        scale: 'minor',
        complexity: 0.6,
        mood: 'calm'
      },
      {
        name: 'Energetic Run',
        sequence: this.createEnergeticPattern(),
        tempo: 140,
        key: 'G',
        scale: 'major',
        complexity: 0.8,
        mood: 'energetic'
      }
    ];

    for (const patternData of defaultPatterns) {
      await this.createPattern(patternData.name, patternData.sequence, patternData);
    }
  }

  /**
   * Create simple melody pattern
   */
  private createSimplePattern(): NoteSequence {
    const notes: AudioNote[] = [
      { pitch: 60, startTime: 0, endTime: 0.5, velocity: 80 }, // C
      { pitch: 62, startTime: 0.5, endTime: 1, velocity: 80 }, // D
      { pitch: 64, startTime: 1, endTime: 1.5, velocity: 80 }, // E
      { pitch: 65, startTime: 1.5, endTime: 2, velocity: 80 }, // F
      { pitch: 67, startTime: 2, endTime: 4, velocity: 80 }    // G (long note)
    ];

    return {
      notes,
      totalTime: 4,
      ticksPerQuarter: 480
    };
  }

  /**
   * Create arpeggiated pattern
   */
  private createArpeggiatedPattern(): NoteSequence {
    const notes: AudioNote[] = [
      { pitch: 57, startTime: 0, endTime: 0.25, velocity: 70 },    // A
      { pitch: 60, startTime: 0.25, endTime: 0.5, velocity: 70 },  // C
      { pitch: 64, startTime: 0.5, endTime: 0.75, velocity: 70 },  // E
      { pitch: 67, startTime: 0.75, endTime: 1, velocity: 70 },    // G
      { pitch: 64, startTime: 1, endTime: 1.25, velocity: 65 },    // E
      { pitch: 60, startTime: 1.25, endTime: 1.5, velocity: 65 },  // C
      { pitch: 57, startTime: 1.5, endTime: 2, velocity: 65 }      // A
    ];

    return {
      notes,
      totalTime: 2,
      ticksPerQuarter: 480
    };
  }

  /**
   * Create energetic pattern
   */
  private createEnergeticPattern(): NoteSequence {
    const notes: AudioNote[] = [];
    const scale = [67, 69, 71, 72, 74, 76, 78, 79]; // G major scale

    for (let i = 0; i < 16; i++) {
      notes.push({
        pitch: scale[i % scale.length],
        startTime: i * 0.125, // Sixteenth notes
        endTime: (i + 1) * 0.125,
        velocity: 85 + Math.random() * 20
      });
    }

    return {
      notes,
      totalTime: 2,
      ticksPerQuarter: 480
    };
  }

  /**
   * Set user input parameters
   */
  async setUserInput(input: Partial<LiveGenerationContext['userInput']>): Promise<void> {
    Object.assign(this.currentContext.userInput, input);

    // Send message to coordination system
    await this.sendMessage({
      type: 'sync',
      data: { event: 'user_input_changed', input },
      priority: 'medium'
    });

    this.emit('userInputChanged', this.currentContext.userInput);
  }

  /**
   * Set musical context
   */
  async setMusicalContext(
    tempo?: number,
    key?: string,
    timeSignature?: [number, number]
  ): Promise<void> {
    if (tempo) this.currentContext.currentTempo = tempo;
    if (key) this.currentContext.currentKey = key;
    if (timeSignature) this.currentContext.timeSignature = timeSignature;

    // Update melody player tempo
    if (tempo) {
      await this.melodyPlayer.setTempo(tempo);
    }

    await this.sendMessage({
      type: 'sync',
      data: { event: 'musical_context_changed', tempo, key, timeSignature },
      priority: 'medium'
    });

    this.emit('musicalContextChanged', { tempo, key, timeSignature });
  }

  /**
   * Get current patterns
   */
  getPatterns(): MelodyPattern[] {
    return Array.from(this.patterns.values());
  }

  /**
   * Get current generation state
   */
  getGenerationState(): {
    isGenerating: boolean;
    context: LiveGenerationContext;
    config: LiveMelodyConfig;
    bufferLength: number;
  } {
    return {\n      isGenerating: this.isGenerating,\n      context: this.currentContext,\n      config: this.liveConfig,\n      bufferLength: this.generationBuffer.length\n    };\n  }\n\n  /**\n   * Send message to coordination system\n   */\n  private async sendMessage(message: Omit<LiveMixerMessage, 'timestamp'>): Promise<void> {\n    const fullMessage: LiveMixerMessage = {\n      ...message,\n      timestamp: Date.now()\n    };\n\n    await this.memoryManager.store(`neural-melody-message-${Date.now()}`, fullMessage);\n\n    this.emit('messageSent', fullMessage);\n  }\n\n  /**\n   * Cleanup resources\n   */\n  async destroy(): Promise<void> {\n    this.stopLiveGeneration();\n\n    if (this.melodyPlayer) {\n      await this.melodyPlayer.destroy();\n    }\n\n    if (this.outputNode) {\n      this.outputNode.disconnect();\n    }\n\n    this.patterns.clear();\n    this.generationBuffer.length = 0;\n\n    await this.claudeFlow.executeHook('post-task', {\n      taskId: 'neural-melody-integration-session'\n    });\n  }\n}\n\n/**\n * Neural Melody Player implementation\n * (This would be imported from the existing neural melody system)\n */\nclass NeuralMelodyPlayer {\n  private audioContext: AudioContext;\n  private isPlaying = false;\n  private currentSequence: NoteSequence | null = null;\n\n  constructor(audioContext: AudioContext, private config: LiveMelodyConfig) {\n    this.audioContext = audioContext;\n  }\n\n  async initialize(): Promise<void> {\n    // Initialize neural model and synthesis\n    console.log('Neural melody player initialized');\n  }\n\n  async connect(destination: AudioNode): Promise<void> {\n    // Connect synthesis output to destination\n    console.log('Connected to audio destination');\n  }\n\n  async generateSequence(config: NeuralMelodyConfig): Promise<NoteSequence> {\n    // Generate melody using neural model\n    // For now, return a simple generated sequence\n    const notes: AudioNote[] = [];\n    const totalTime = (config.totalSteps / config.stepsPerQuarter) * (60 / 120); // Assume 120 BPM\n\n    for (let i = 0; i < config.totalSteps; i += 2) {\n      const time = (i / config.stepsPerQuarter) * (60 / 120);\n      const pitch = config.minNote + Math.floor(Math.random() * (config.maxNote - config.minNote));\n      const velocity = 60 + Math.random() * 40;\n\n      notes.push({\n        pitch,\n        startTime: time,\n        endTime: time + 0.25,\n        velocity\n      });\n    }\n\n    return {\n      notes,\n      totalTime,\n      ticksPerQuarter: 480\n    };\n  }\n\n  async playSequence(sequence: NoteSequence): Promise<void> {\n    this.currentSequence = sequence;\n    this.isPlaying = true;\n\n    // Schedule notes for playback\n    const startTime = this.audioContext.currentTime;\n    sequence.notes.forEach(note => {\n      this.scheduleNote(note, startTime);\n    });\n  }\n\n  private scheduleNote(note: AudioNote, startTime: number): void {\n    // Create oscillator for note\n    const oscillator = this.audioContext.createOscillator();\n    const gainNode = this.audioContext.createGain();\n\n    oscillator.connect(gainNode);\n    gainNode.connect(this.audioContext.destination);\n\n    // Set frequency from MIDI note\n    const frequency = 440 * Math.pow(2, (note.pitch - 69) / 12);\n    oscillator.frequency.setValueAtTime(frequency, startTime + note.startTime);\n\n    // Set envelope\n    const velocity = note.velocity / 127;\n    gainNode.gain.setValueAtTime(0, startTime + note.startTime);\n    gainNode.gain.linearRampToValueAtTime(velocity * 0.3, startTime + note.startTime + 0.01);\n    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + note.endTime);\n\n    // Start and stop\n    oscillator.start(startTime + note.startTime);\n    oscillator.stop(startTime + note.endTime);\n  }\n\n  async setTempo(tempo: number): Promise<void> {\n    // Update playback tempo\n    console.log(`Tempo set to ${tempo} BPM`);\n  }\n\n  stop(): void {\n    this.isPlaying = false;\n  }\n\n  async destroy(): Promise<void> {\n    this.stop();\n  }\n}