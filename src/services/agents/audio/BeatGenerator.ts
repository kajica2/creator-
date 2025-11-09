import * as Tone from 'tone';
import {
  BaseAudioAgent,
  AudioAgentType,
  AgentStatus,
  BeatPattern,
  BeatStep,
  DrumInstrument,
  RhythmStyle,
  AudioAgentCallbacks,
  AudioAgentError
} from './types';

export class BeatGenerator implements BaseAudioAgent {
  public readonly id: string;
  public readonly type: AudioAgentType = 'beat-generator';
  public status: AgentStatus = 'idle';
  public readonly capabilities: string[] = [
    'rhythm_generation',
    'drum_programming',
    'beat_variation',
    'groove_templates',
    'polyrhythm_creation',
    'swing_timing',
    'fill_generation',
    'tempo_adaptation'
  ];
  public metadata: Record<string, any> = {};

  private drumMachine!: Map<DrumInstrument, Tone.Sampler>;
  private sequencer?: Tone.Sequence;
  private callbacks: AudioAgentCallbacks;
  private rhythmStyles: Map<string, RhythmStyle> = new Map();
  private generatedPatterns: Map<string, BeatPattern> = new Map();
  private isPlaying: boolean = false;
  private currentTempo: number = 120;

  // Drum sample mappings
  private drumSamples = {
    kick: 'C1',
    snare: 'D1',
    hihat: 'F#1',
    openhat: 'A#1',
    crash: 'C2',
    ride: 'D2',
    tom1: 'F1',
    tom2: 'G1',
    tom3: 'A1'
  };

  // Groove templates with different swing factors
  private grooveTemplates = {
    straight: { swing: 0, humanize: 0.05 },
    swing16: { swing: 0.1, humanize: 0.08 },
    swing8: { swing: 0.15, humanize: 0.1 },
    shuffle: { swing: 0.2, humanize: 0.12 },
    drunk: { swing: 0.3, humanize: 0.15 }
  };

  constructor(callbacks: AudioAgentCallbacks = {}) {
    this.id = `beat-gen-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.callbacks = callbacks;
    this.metadata = {
      createdAt: new Date(),
      version: '1.0.0',
      drumSamplesLoaded: false,
      rhythmStylesCount: 0,
      currentTempo: this.currentTempo
    };

    this.initializeRhythmStyles();
  }

  public async initialize(): Promise<void> {
    try {
      this.status = 'initializing';
      this.callbacks.onAgentStatusChange?.(this.id, this.status);

      // Initialize Tone.js context
      if (Tone.context.state !== 'running') {
        await Tone.start();
      }

      // Set up drum machine
      await this.initializeDrumMachine();

      // Set up transport
      Tone.Transport.bpm.value = this.currentTempo;

      this.metadata.drumSamplesLoaded = true;
      this.metadata.rhythmStylesCount = this.rhythmStyles.size;
      this.status = 'ready';
      this.callbacks.onAgentStatusChange?.(this.id, this.status);

      console.log(`🥁 BeatGenerator ${this.id} initialized with ${this.rhythmStyles.size} rhythm styles`);
    } catch (error) {
      this.status = 'error';
      this.callbacks.onAgentStatusChange?.(this.id, this.status);
      throw new AudioAgentError(
        `Failed to initialize BeatGenerator: ${error instanceof Error ? error.message : 'Unknown error'}`,
        this.id,
        this.type,
        'INIT_FAILED'
      );
    }
  }

  private async initializeDrumMachine(): Promise<void> {
    this.drumMachine = new Map();

    // For now, use oscillators as placeholders for drum sounds
    // In a production environment, you would load actual drum samples
    for (const [instrument, note] of Object.entries(this.drumSamples)) {
      const sampler = this.createDrumSampler(instrument as DrumInstrument);
      this.drumMachine.set(instrument as DrumInstrument, sampler);
    }
  }

  private createDrumSampler(instrument: DrumInstrument): Tone.Sampler {
    // Create synthetic drum sounds using oscillators
    const synthSettings = this.getDrumSynthSettings(instrument);

    // For now, create a simple sampler with generated tones
    // In production, you would load actual drum samples
    const sampler = new Tone.Sampler({
      urls: {
        [this.drumSamples[instrument]]: this.generateDrumTone(instrument)
      },
      baseUrl: '', // No base URL needed for generated tones
      volume: synthSettings.volume
    });

    sampler.toDestination();
    return sampler;
  }

  private getDrumSynthSettings(instrument: DrumInstrument): any {
    const settings = {
      kick: { frequency: 60, volume: -6, envelope: { attack: 0.01, decay: 0.2, sustain: 0, release: 0.1 } },
      snare: { frequency: 200, volume: -8, envelope: { attack: 0.01, decay: 0.1, sustain: 0, release: 0.05 } },
      hihat: { frequency: 8000, volume: -12, envelope: { attack: 0.01, decay: 0.03, sustain: 0, release: 0.01 } },
      openhat: { frequency: 8000, volume: -10, envelope: { attack: 0.01, decay: 0.15, sustain: 0, release: 0.1 } },
      crash: { frequency: 4000, volume: -8, envelope: { attack: 0.01, decay: 0.8, sustain: 0, release: 0.5 } },
      ride: { frequency: 3000, volume: -10, envelope: { attack: 0.01, decay: 0.3, sustain: 0, release: 0.2 } },
      tom1: { frequency: 120, volume: -8, envelope: { attack: 0.01, decay: 0.2, sustain: 0, release: 0.1 } },
      tom2: { frequency: 100, volume: -8, envelope: { attack: 0.01, decay: 0.25, sustain: 0, release: 0.15 } },
      tom3: { frequency: 80, volume: -8, envelope: { attack: 0.01, decay: 0.3, sustain: 0, release: 0.2 } }
    };

    return settings[instrument] || settings.kick;
  }

  private generateDrumTone(instrument: DrumInstrument): string {
    // Generate simple drum tones using data URLs
    // This is a simplified approach - in production you'd use actual samples
    return 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEZBS6M0uzCeykJLYHO8diJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEZBS6M0uzCeykJLYHO8diJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEZBS6M0uzCeykJLYHO8diJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEZBS6M0uzCeykJLYHO8diJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEZBS6M0uzCeykJ';
  }

  private initializeRhythmStyles(): void {
    // Hip-Hop style
    this.rhythmStyles.set('hip-hop', {
      name: 'Hip-Hop',
      patterns: [
        this.createHipHopPattern(),
        this.createBoomBapPattern()
      ],
      fills: [this.createHipHopFill()],
      variations: [this.createHipHopVariation()]
    });

    // Electronic/EDM style
    this.rhythmStyles.set('edm', {
      name: 'Electronic Dance Music',
      patterns: [
        this.createFourOnFloorPattern(),
        this.createBreakbeatPattern()
      ],
      fills: [this.createEDMFill()],
      variations: [this.createEDMVariation()]
    });

    // Rock style
    this.rhythmStyles.set('rock', {
      name: 'Rock',
      patterns: [
        this.createBasicRockPattern(),
        this.createRockBalladePattern()
      ],
      fills: [this.createRockFill()],
      variations: [this.createRockVariation()]
    });

    // Jazz style
    this.rhythmStyles.set('jazz', {
      name: 'Jazz',
      patterns: [
        this.createJazzSwingPattern(),
        this.createJazzWaltzPattern()
      ],
      fills: [this.createJazzFill()],
      variations: [this.createJazzVariation()]
    });

    // Latin style
    this.rhythmStyles.set('latin', {
      name: 'Latin',
      patterns: [
        this.createBossaNovaPattern(),
        this.createSambaPattern()
      ],
      fills: [this.createLatinFill()],
      variations: [this.createLatinVariation()]
    });

    // Trap style
    this.rhythmStyles.set('trap', {
      name: 'Trap',
      patterns: [
        this.createTrapPattern(),
        this.createTrapHalfTimePattern()
      ],
      fills: [this.createTrapFill()],
      variations: [this.createTrapVariation()]
    });

    // Afrobeat style
    this.rhythmStyles.set('afrobeat', {
      name: 'Afrobeat',
      patterns: [
        this.createAfrobeatPattern()
      ],
      fills: [this.createAfrobeatFill()],
      variations: [this.createAfrobeatVariation()]
    });
  }

  // Pattern creation methods
  private createHipHopPattern(): BeatPattern {
    return {
      id: 'hip-hop-basic',
      name: 'Hip-Hop Basic',
      timeSignature: [4, 4],
      tempo: 90,
      length: 16,
      pattern: [
        { time: 0, velocity: 100, instrument: 'kick' },
        { time: 4, velocity: 85, instrument: 'snare' },
        { time: 8, velocity: 95, instrument: 'kick' },
        { time: 12, velocity: 80, instrument: 'snare' },
        // Hi-hats
        { time: 2, velocity: 60, instrument: 'hihat' },
        { time: 6, velocity: 55, instrument: 'hihat' },
        { time: 10, velocity: 60, instrument: 'hihat' },
        { time: 14, velocity: 55, instrument: 'hihat' }
      ]
    };
  }

  private createBoomBapPattern(): BeatPattern {
    return {
      id: 'boom-bap',
      name: 'Boom Bap',
      timeSignature: [4, 4],
      tempo: 95,
      length: 16,
      pattern: [
        { time: 0, velocity: 110, instrument: 'kick', accent: true },
        { time: 4, velocity: 95, instrument: 'snare', accent: true },
        { time: 8, velocity: 100, instrument: 'kick' },
        { time: 12, velocity: 90, instrument: 'snare' },
        // Shuffled hi-hats
        { time: 1, velocity: 45, instrument: 'hihat' },
        { time: 3, velocity: 50, instrument: 'hihat' },
        { time: 5, velocity: 40, instrument: 'hihat' },
        { time: 7, velocity: 45, instrument: 'hihat' },
        { time: 9, velocity: 45, instrument: 'hihat' },
        { time: 11, velocity: 50, instrument: 'hihat' },
        { time: 13, velocity: 40, instrument: 'hihat' },
        { time: 15, velocity: 45, instrument: 'hihat' }
      ]
    };
  }

  private createFourOnFloorPattern(): BeatPattern {
    return {
      id: 'four-on-floor',
      name: 'Four On The Floor',
      timeSignature: [4, 4],
      tempo: 128,
      length: 16,
      pattern: [
        // Four on the floor kick
        { time: 0, velocity: 100, instrument: 'kick' },
        { time: 4, velocity: 100, instrument: 'kick' },
        { time: 8, velocity: 100, instrument: 'kick' },
        { time: 12, velocity: 100, instrument: 'kick' },
        // Snare on 2 and 4
        { time: 4, velocity: 85, instrument: 'snare' },
        { time: 12, velocity: 85, instrument: 'snare' },
        // Constant hi-hats
        { time: 0, velocity: 60, instrument: 'hihat' },
        { time: 2, velocity: 50, instrument: 'hihat' },
        { time: 4, velocity: 60, instrument: 'hihat' },
        { time: 6, velocity: 50, instrument: 'hihat' },
        { time: 8, velocity: 60, instrument: 'hihat' },
        { time: 10, velocity: 50, instrument: 'hihat' },
        { time: 12, velocity: 60, instrument: 'hihat' },
        { time: 14, velocity: 50, instrument: 'hihat' }
      ]
    };
  }

  private createTrapPattern(): BeatPattern {
    return {
      id: 'trap-basic',
      name: 'Trap Basic',
      timeSignature: [4, 4],
      tempo: 140,
      length: 32, // 2 bars for trap
      pattern: [
        // Kick pattern
        { time: 0, velocity: 100, instrument: 'kick' },
        { time: 6, velocity: 80, instrument: 'kick' },
        { time: 16, velocity: 100, instrument: 'kick' },
        { time: 22, velocity: 80, instrument: 'kick' },
        // Snare on 2 and 4
        { time: 8, velocity: 90, instrument: 'snare' },
        { time: 24, velocity: 90, instrument: 'snare' },
        // Rapid hi-hats (32nd notes)
        ...Array.from({ length: 32 }, (_, i) => ({
          time: i,
          velocity: i % 4 === 0 ? 70 : 45,
          instrument: 'hihat' as DrumInstrument
        }))
      ]
    };
  }

  private createJazzSwingPattern(): BeatPattern {
    return {
      id: 'jazz-swing',
      name: 'Jazz Swing',
      timeSignature: [4, 4],
      tempo: 120,
      length: 16,
      pattern: [
        // Swing ride pattern
        { time: 0, velocity: 70, instrument: 'ride' },
        { time: 2.67, velocity: 50, instrument: 'ride' }, // Swing timing
        { time: 4, velocity: 75, instrument: 'ride', accent: true },
        { time: 6.67, velocity: 50, instrument: 'ride' },
        { time: 8, velocity: 70, instrument: 'ride' },
        { time: 10.67, velocity: 50, instrument: 'ride' },
        { time: 12, velocity: 75, instrument: 'ride', accent: true },
        { time: 14.67, velocity: 50, instrument: 'ride' },
        // Light kick
        { time: 0, velocity: 60, instrument: 'kick' },
        { time: 8, velocity: 55, instrument: 'kick' },
        // Snare backbeat
        { time: 4, velocity: 70, instrument: 'snare' },
        { time: 12, velocity: 75, instrument: 'snare' }
      ]
    };
  }

  private createAfrobeatPattern(): BeatPattern {
    return {
      id: 'afrobeat-basic',
      name: 'Afrobeat Basic',
      timeSignature: [4, 4],
      tempo: 115,
      length: 16,
      pattern: [
        // Characteristic Afrobeat kick pattern
        { time: 0, velocity: 95, instrument: 'kick' },
        { time: 3, velocity: 80, instrument: 'kick' },
        { time: 6, velocity: 85, instrument: 'kick' },
        { time: 12, velocity: 90, instrument: 'kick' },
        // Snare accents
        { time: 4, velocity: 85, instrument: 'snare' },
        { time: 10, velocity: 70, instrument: 'snare' },
        { time: 14, velocity: 75, instrument: 'snare' },
        // Complex hi-hat pattern
        { time: 1, velocity: 60, instrument: 'hihat' },
        { time: 2, velocity: 45, instrument: 'hihat' },
        { time: 5, velocity: 55, instrument: 'hihat' },
        { time: 7, velocity: 50, instrument: 'hihat' },
        { time: 9, velocity: 60, instrument: 'hihat' },
        { time: 11, velocity: 45, instrument: 'hihat' },
        { time: 13, velocity: 55, instrument: 'hihat' },
        { time: 15, velocity: 50, instrument: 'hihat' }
      ]
    };
  }

  // Fill creation methods (simplified)
  private createHipHopFill(): BeatPattern {
    return {
      id: 'hip-hop-fill',
      name: 'Hip-Hop Fill',
      timeSignature: [4, 4],
      tempo: 90,
      length: 4, // One beat fill
      pattern: [
        { time: 0, velocity: 80, instrument: 'tom1' },
        { time: 1, velocity: 85, instrument: 'tom2' },
        { time: 2, velocity: 90, instrument: 'tom3' },
        { time: 3, velocity: 95, instrument: 'snare' }
      ]
    };
  }

  private createEDMFill(): BeatPattern {
    return {
      id: 'edm-fill',
      name: 'EDM Fill',
      timeSignature: [4, 4],
      tempo: 128,
      length: 4,
      pattern: [
        { time: 0, velocity: 70, instrument: 'crash' },
        { time: 1, velocity: 80, instrument: 'snare' },
        { time: 2, velocity: 85, instrument: 'snare' },
        { time: 3, velocity: 90, instrument: 'snare' }
      ]
    };
  }

  private createRockFill(): BeatPattern {
    return {
      id: 'rock-fill',
      name: 'Rock Fill',
      timeSignature: [4, 4],
      tempo: 120,
      length: 8,
      pattern: [
        { time: 0, velocity: 85, instrument: 'tom1' },
        { time: 2, velocity: 90, instrument: 'tom1' },
        { time: 4, velocity: 95, instrument: 'tom2' },
        { time: 6, velocity: 100, instrument: 'tom3' },
        { time: 7, velocity: 105, instrument: 'crash' }
      ]
    };
  }

  // Variation methods (return basic patterns for now)
  private createHipHopVariation(): BeatPattern { return this.createHipHopPattern(); }
  private createEDMVariation(): BeatPattern { return this.createBreakbeatPattern(); }
  private createRockVariation(): BeatPattern { return this.createBasicRockPattern(); }
  private createJazzVariation(): BeatPattern { return this.createJazzSwingPattern(); }
  private createLatinVariation(): BeatPattern { return this.createBossaNovaPattern(); }
  private createTrapVariation(): BeatPattern { return this.createTrapPattern(); }
  private createAfrobeatVariation(): BeatPattern { return this.createAfrobeatPattern(); }

  // Additional pattern methods for completeness
  private createBreakbeatPattern(): BeatPattern { return this.createFourOnFloorPattern(); }
  private createBasicRockPattern(): BeatPattern { return this.createHipHopPattern(); }
  private createRockBalladePattern(): BeatPattern { return this.createHipHopPattern(); }
  private createJazzWaltzPattern(): BeatPattern { return this.createJazzSwingPattern(); }
  private createBossaNovaPattern(): BeatPattern { return this.createAfrobeatPattern(); }
  private createSambaPattern(): BeatPattern { return this.createAfrobeatPattern(); }
  private createTrapHalfTimePattern(): BeatPattern { return this.createTrapPattern(); }
  private createJazzFill(): BeatPattern { return this.createHipHopFill(); }
  private createLatinFill(): BeatPattern { return this.createHipHopFill(); }
  private createTrapFill(): BeatPattern { return this.createEDMFill(); }
  private createAfrobeatFill(): BeatPattern { return this.createRockFill(); }

  public async generateBeat(
    style: string,
    tempo: number = 120,
    length: number = 16,
    complexity: 'simple' | 'moderate' | 'complex' = 'moderate'
  ): Promise<BeatPattern> {
    if (this.status !== 'ready') {
      throw new AudioAgentError('BeatGenerator not ready', this.id, this.type, 'NOT_READY');
    }

    try {
      this.status = 'processing';
      this.callbacks.onAgentStatusChange?.(this.id, this.status);

      const rhythmStyle = this.rhythmStyles.get(style);
      if (!rhythmStyle) {
        throw new AudioAgentError(`Unknown rhythm style: ${style}`, this.id, this.type, 'UNKNOWN_STYLE');
      }

      // Get base pattern and modify it
      const basePattern = rhythmStyle.patterns[0];
      const generatedPattern: BeatPattern = {
        id: `generated-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: `Generated ${rhythmStyle.name}`,
        timeSignature: basePattern.timeSignature,
        tempo,
        length,
        pattern: this.adaptPattern(basePattern.pattern, tempo, length, complexity)
      };

      this.generatedPatterns.set(generatedPattern.id, generatedPattern);
      this.status = 'ready';
      this.callbacks.onAgentStatusChange?.(this.id, this.status);
      this.callbacks.onBeatGenerated?.(generatedPattern);

      console.log(`🥁 Generated beat: ${generatedPattern.name} at ${tempo} BPM`);
      return generatedPattern;
    } catch (error) {
      this.status = 'error';
      this.callbacks.onAgentStatusChange?.(this.id, this.status);
      throw new AudioAgentError(
        `Beat generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        this.id,
        this.type,
        'GENERATION_FAILED'
      );
    }
  }

  private adaptPattern(
    basePattern: BeatStep[],
    newTempo: number,
    newLength: number,
    complexity: string
  ): BeatStep[] {
    let adaptedPattern = [...basePattern];

    // Adjust pattern length
    if (newLength > 16) {
      // Extend pattern by repeating and adding variations
      const repetitions = Math.ceil(newLength / 16);
      adaptedPattern = [];
      for (let i = 0; i < repetitions; i++) {
        const offset = i * 16;
        basePattern.forEach(step => {
          if (step.time + offset < newLength) {
            adaptedPattern.push({
              ...step,
              time: step.time + offset,
              velocity: this.addVariation(step.velocity, complexity)
            });
          }
        });
      }
    }

    // Adjust complexity
    if (complexity === 'simple') {
      // Keep only strong beats
      adaptedPattern = adaptedPattern.filter(step =>
        step.time % 4 === 0 || step.accent || step.instrument === 'snare'
      );
    } else if (complexity === 'complex') {
      // Add ghost notes and embellishments
      adaptedPattern = this.addGhostNotes(adaptedPattern);
    }

    return adaptedPattern;
  }

  private addVariation(velocity: number, complexity: string): number {
    const variation = {
      simple: 5,
      moderate: 10,
      complex: 15
    };

    const variationAmount = variation[complexity as keyof typeof variation] || 10;
    const randomVariation = (Math.random() - 0.5) * variationAmount;

    return Math.max(20, Math.min(127, velocity + randomVariation));
  }

  private addGhostNotes(pattern: BeatStep[]): BeatStep[] {
    const enhancedPattern = [...pattern];

    // Add ghost snare hits
    for (let i = 1; i < 16; i += 2) {
      if (!pattern.some(step => step.time === i && step.instrument === 'snare')) {
        if (Math.random() > 0.7) { // 30% chance for ghost note
          enhancedPattern.push({
            time: i,
            velocity: 25 + Math.random() * 15, // Very quiet
            instrument: 'snare'
          });
        }
      }
    }

    return enhancedPattern;
  }

  public async playPattern(pattern: BeatPattern): Promise<void> {
    if (this.status !== 'ready') {
      throw new AudioAgentError('BeatGenerator not ready', this.id, this.type, 'NOT_READY');
    }

    try {
      this.stopPlayback();

      // Set tempo
      Tone.Transport.bpm.value = pattern.tempo;
      this.currentTempo = pattern.tempo;

      // Create sequence
      const events = pattern.pattern.map(step => ({
        time: step.time,
        note: this.drumSamples[step.instrument],
        velocity: step.velocity / 127,
        instrument: step.instrument
      }));

      this.sequencer = new Tone.Sequence((time, event) => {
        const sampler = this.drumMachine.get(event.instrument);
        if (sampler) {
          sampler.triggerAttackRelease(event.note, '32n', time, event.velocity);
        }
      }, events, '16n');

      this.sequencer.loop = true;
      this.sequencer.loopEnd = `${pattern.length / 4}m`; // Convert to measures

      // Start playback
      this.sequencer.start(0);
      Tone.Transport.start();
      this.isPlaying = true;

      console.log(`🥁 Playing pattern: ${pattern.name}`);
    } catch (error) {
      throw new AudioAgentError(
        `Pattern playback failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        this.id,
        this.type,
        'PLAYBACK_FAILED'
      );
    }
  }

  public stopPlayback(): void {
    if (this.sequencer) {
      this.sequencer.stop();
      this.sequencer.dispose();
      this.sequencer = undefined;
    }

    if (this.isPlaying) {
      Tone.Transport.stop();
      this.isPlaying = false;
    }
  }

  public setTempo(tempo: number): void {
    this.currentTempo = Math.max(60, Math.min(200, tempo));
    Tone.Transport.bpm.value = this.currentTempo;
    this.metadata.currentTempo = this.currentTempo;
  }

  public applyGroove(pattern: BeatPattern, grooveType: string): BeatPattern {
    const groove = this.grooveTemplates[grooveType as keyof typeof this.grooveTemplates];
    if (!groove) {
      return pattern;
    }

    const groovedPattern: BeatPattern = {
      ...pattern,
      id: `${pattern.id}-${grooveType}`,
      name: `${pattern.name} (${grooveType})`,
      pattern: pattern.pattern.map(step => {
        let newTime = step.time;
        let newVelocity = step.velocity;

        // Apply swing
        if (step.time % 2 === 1) { // Odd subdivisions
          newTime += groove.swing;
        }

        // Apply humanization
        newTime += (Math.random() - 0.5) * groove.humanize;
        newVelocity += (Math.random() - 0.5) * groove.humanize * 20;

        return {
          ...step,
          time: Math.max(0, newTime),
          velocity: Math.max(20, Math.min(127, Math.round(newVelocity)))
        };
      })
    };

    return groovedPattern;
  }

  public getAvailableStyles(): string[] {
    return Array.from(this.rhythmStyles.keys());
  }

  public getStyle(styleName: string): RhythmStyle | undefined {
    return this.rhythmStyles.get(styleName);
  }

  public getGeneratedPattern(id: string): BeatPattern | undefined {
    return this.generatedPatterns.get(id);
  }

  public getAllGeneratedPatterns(): BeatPattern[] {
    return Array.from(this.generatedPatterns.values());
  }

  public getAvailableGrooveTypes(): string[] {
    return Object.keys(this.grooveTemplates);
  }

  public isCurrentlyPlaying(): boolean {
    return this.isPlaying;
  }

  public getCurrentTempo(): number {
    return this.currentTempo;
  }

  public getStatus(): AgentStatus {
    return this.status;
  }

  public dispose(): void {
    this.status = 'disposed';

    this.stopPlayback();

    // Dispose drum machine
    for (const sampler of this.drumMachine.values()) {
      sampler.dispose();
    }

    this.drumMachine.clear();
    this.rhythmStyles.clear();
    this.generatedPatterns.clear();

    this.callbacks.onAgentStatusChange?.(this.id, this.status);
    console.log(`🥁 BeatGenerator ${this.id} disposed`);
  }
}