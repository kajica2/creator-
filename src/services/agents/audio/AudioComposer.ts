import * as Tone from 'tone';
import * as mm from '@magenta/music';
import { NeuralMelodyPlayer } from '../../../components/audio/NeuralMelodyPlayer';
import { NoteSequence } from '../../../components/audio/types';
import {
  BaseAudioAgent,
  AudioAgentType,
  AgentStatus,
  ComposerConfig,
  GeneratedComposition,
  AudioAgentCallbacks,
  NeuralMelodyIntegration,
  AudioAgentError
} from './types';

export class AudioComposer implements BaseAudioAgent, NeuralMelodyIntegration {
  public readonly id: string;
  public readonly type: AudioAgentType = 'composer';
  public status: AgentStatus = 'idle';
  public readonly capabilities: string[] = [
    'melody_generation',
    'harmony_generation',
    'neural_composition',
    'style_adaptation',
    'improvisation',
    'multi_track_composition'
  ];
  public metadata: Record<string, any> = {};

  private neuralPlayer?: NeuralMelodyPlayer;
  private musicVAE?: mm.MusicVAE;
  private musicRNN?: mm.MusicRNN;
  private melodyRNN?: mm.MusicRNN;
  private callbacks: AudioAgentCallbacks;
  private compositions: Map<string, GeneratedComposition> = new Map();

  // Musical scales and chord progressions
  private readonly scales = {
    major: [0, 2, 4, 5, 7, 9, 11],
    minor: [0, 2, 3, 5, 7, 8, 10],
    dorian: [0, 2, 3, 5, 7, 9, 10],
    mixolydian: [0, 2, 4, 5, 7, 9, 10],
    pentatonic: [0, 2, 4, 7, 9],
    blues: [0, 3, 5, 6, 7, 10]
  };

  private readonly chordProgressions = {
    classical: ['I', 'V', 'vi', 'IV'],
    jazz: ['ii7', 'V7', 'Imaj7', 'vi7'],
    pop: ['I', 'V', 'vi', 'IV'],
    blues: ['I7', 'I7', 'I7', 'I7', 'IV7', 'IV7', 'I7', 'I7', 'V7', 'IV7', 'I7', 'V7']
  };

  constructor(callbacks: AudioAgentCallbacks = {}) {
    this.id = `composer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.callbacks = callbacks;
    this.metadata = {
      createdAt: new Date(),
      version: '1.0.0',
      neuralModelsLoaded: false,
      defaultConfig: this.getDefaultConfig()
    };
  }

  public async initialize(): Promise<void> {
    try {
      this.status = 'initializing';
      this.callbacks.onAgentStatusChange?.(this.id, this.status);

      // Initialize Tone.js context
      if (Tone.context.state !== 'running') {
        await Tone.start();
      }

      // Initialize neural models in parallel
      const modelPromises = [
        this.initializeMusicVAE(),
        this.initializeMusicRNN(),
        this.initializeMelodyRNN()
      ];

      await Promise.allSettled(modelPromises);

      // Initialize neural melody player for real-time interaction
      this.neuralPlayer = new NeuralMelodyPlayer(
        {
          temperature: 1.0,
          stepsPerQuarter: 4,
          totalSteps: 128
        },
        this.callbacks
      );

      await this.neuralPlayer.startAudioContext();

      this.metadata.neuralModelsLoaded = true;
      this.status = 'ready';
      this.callbacks.onAgentStatusChange?.(this.id, this.status);

      console.log(`🎼 AudioComposer ${this.id} initialized successfully`);
    } catch (error) {
      this.status = 'error';
      this.callbacks.onAgentStatusChange?.(this.id, this.status);
      throw new AudioAgentError(
        `Failed to initialize AudioComposer: ${error instanceof Error ? error.message : 'Unknown error'}`,
        this.id,
        this.type,
        'INIT_FAILED'
      );
    }
  }

  private async initializeMusicVAE(): Promise<void> {
    try {
      this.musicVAE = new mm.MusicVAE(
        'https://storage.googleapis.com/magentadata/js/checkpoints/music_vae/trio_4bar'
      );
      await this.musicVAE.initialize();
    } catch (error) {
      console.warn('MusicVAE initialization failed:', error);
    }
  }

  private async initializeMusicRNN(): Promise<void> {
    try {
      this.musicRNN = new mm.MusicRNN(
        'https://storage.googleapis.com/magentadata/js/checkpoints/music_rnn/basic_rnn'
      );
      await this.musicRNN.initialize();
    } catch (error) {
      console.warn('MusicRNN initialization failed:', error);
    }
  }

  private async initializeMelodyRNN(): Promise<void> {
    try {
      this.melodyRNN = new mm.MusicRNN(
        'https://storage.googleapis.com/magentadata/js/checkpoints/music_rnn/melody_rnn'
      );
      await this.melodyRNN.initialize();
    } catch (error) {
      console.warn('MelodyRNN initialization failed:', error);
    }
  }

  private getDefaultConfig(): ComposerConfig {
    return {
      style: 'fusion',
      complexity: 'moderate',
      duration: 16, // bars
      key: 'C',
      tempo: 120,
      instruments: ['piano', 'strings', 'bass'],
      useNeuralGeneration: true
    };
  }

  public async generateComposition(config: Partial<ComposerConfig> = {}): Promise<GeneratedComposition> {
    if (this.status !== 'ready') {
      throw new AudioAgentError('Composer not ready', this.id, this.type, 'NOT_READY');
    }

    try {
      this.status = 'processing';
      this.callbacks.onAgentStatusChange?.(this.id, this.status);

      const fullConfig = { ...this.getDefaultConfig(), ...config };
      const compositionId = `comp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Generate main melody
      const melody = await this.generateMelody(60, fullConfig); // Start from middle C

      // Generate harmony if requested
      const harmony = await this.generateHarmony(melody, fullConfig.key);

      // Generate bass line
      const bass = await this.generateBassLine(melody, fullConfig.key);

      // Generate percussion if electronic style
      const percussion = fullConfig.style === 'electronic' || fullConfig.style === 'fusion'
        ? await this.generatePercussion(fullConfig)
        : undefined;

      const composition: GeneratedComposition = {
        id: compositionId,
        title: this.generateTitle(fullConfig),
        sequence: this.combineSequences([melody, harmony, bass].filter(Boolean) as NoteSequence[]),
        metadata: {
          style: fullConfig.style,
          key: fullConfig.key,
          tempo: fullConfig.tempo,
          duration: this.calculateDuration(melody),
          generatedAt: new Date()
        },
        tracks: {
          melody,
          harmony,
          bass,
          percussion
        }
      };

      this.compositions.set(compositionId, composition);
      this.status = 'ready';
      this.callbacks.onAgentStatusChange?.(this.id, this.status);
      this.callbacks.onCompositionGenerated?.(composition);

      console.log(`🎵 Generated composition: ${composition.title}`);
      return composition;
    } catch (error) {
      this.status = 'error';
      this.callbacks.onAgentStatusChange?.(this.id, this.status);
      throw new AudioAgentError(
        `Composition generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        this.id,
        this.type,
        'GENERATION_FAILED'
      );
    }
  }

  public async generateMelody(seedNote: number, config: ComposerConfig): Promise<NoteSequence> {
    if (config.useNeuralGeneration && this.musicRNN) {
      return this.generateNeuralMelody(seedNote, config);
    } else {
      return this.generateAlgorithmicMelody(seedNote, config);
    }
  }

  private async generateNeuralMelody(seedNote: number, config: ComposerConfig): Promise<NoteSequence> {
    if (!this.musicRNN) {
      throw new Error('MusicRNN not initialized');
    }

    const seedSequence: NoteSequence = {
      notes: [{
        pitch: seedNote,
        startTime: 0,
        endTime: 0.5,
        velocity: 80
      }],
      totalTime: 0.5,
      ticksPerQuarter: 220
    };

    const temperature = this.getTemperatureForStyle(config.style);
    const steps = config.duration * 4; // 4 steps per bar

    try {
      const generatedSequence = await this.musicRNN.continueSequence(
        seedSequence,
        steps,
        temperature
      );

      return this.postProcessMelody(generatedSequence, config);
    } catch (error) {
      console.warn('Neural generation failed, falling back to algorithmic:', error);
      return this.generateAlgorithmicMelody(seedNote, config);
    }
  }

  private generateAlgorithmicMelody(seedNote: number, config: ComposerConfig): NoteSequence {
    const scale = this.getScaleForStyle(config.style);
    const rootNote = this.getNoteFromKey(config.key);
    const notes: any[] = [];

    let currentTime = 0;
    let currentNote = seedNote;
    const noteDuration = 60 / config.tempo; // quarter note duration

    for (let bar = 0; bar < config.duration; bar++) {
      for (let beat = 0; beat < 4; beat++) {
        // Generate note based on style and complexity
        const interval = this.chooseInterval(config.style, config.complexity);
        currentNote = this.constrainToScale(currentNote + interval, rootNote, scale);

        notes.push({
          pitch: currentNote,
          startTime: currentTime,
          endTime: currentTime + noteDuration,
          velocity: this.getVelocityForBeat(beat, config.style)
        });

        currentTime += noteDuration;
      }
    }

    return {
      notes,
      totalTime: currentTime,
      ticksPerQuarter: 220
    };
  }

  private async generateHarmony(melody: NoteSequence, key: string): Promise<NoteSequence> {
    const rootNote = this.getNoteFromKey(key);
    const harmonizedNotes: any[] = [];

    melody.notes.forEach(note => {
      // Generate harmony notes (thirds and fifths)
      const harmonyNote1 = {
        ...note,
        pitch: note.pitch + 4, // major third
        velocity: Math.floor(note.velocity * 0.7)
      };

      const harmonyNote2 = {
        ...note,
        pitch: note.pitch + 7, // perfect fifth
        velocity: Math.floor(note.velocity * 0.6)
      };

      harmonizedNotes.push(harmonyNote1, harmonyNote2);
    });

    return {
      notes: harmonizedNotes,
      totalTime: melody.totalTime,
      ticksPerQuarter: melody.ticksPerQuarter
    };
  }

  private async generateBassLine(melody: NoteSequence, key: string): Promise<NoteSequence> {
    const rootNote = this.getNoteFromKey(key) - 24; // Two octaves lower
    const bassNotes: any[] = [];

    // Simple bass line following root notes
    const beatDuration = (melody.totalTime || 0) / (melody.notes.length / 4);

    for (let i = 0; i < melody.notes.length; i += 4) {
      const startTime = i * beatDuration / 4;
      bassNotes.push({
        pitch: rootNote,
        startTime,
        endTime: startTime + beatDuration,
        velocity: 90
      });
    }

    return {
      notes: bassNotes,
      totalTime: melody.totalTime,
      ticksPerQuarter: melody.ticksPerQuarter
    };
  }

  private async generatePercussion(config: ComposerConfig): Promise<NoteSequence> {
    const percussionNotes: any[] = [];
    const beatDuration = 60 / config.tempo;
    const totalBeats = config.duration * 4;

    // Simple 4/4 beat pattern
    for (let beat = 0; beat < totalBeats; beat++) {
      const time = beat * beatDuration;

      // Kick on beats 1 and 3
      if (beat % 4 === 0 || beat % 4 === 2) {
        percussionNotes.push({
          pitch: 36, // Kick drum
          startTime: time,
          endTime: time + 0.1,
          velocity: 100
        });
      }

      // Snare on beats 2 and 4
      if (beat % 4 === 1 || beat % 4 === 3) {
        percussionNotes.push({
          pitch: 38, // Snare drum
          startTime: time,
          endTime: time + 0.1,
          velocity: 85
        });
      }

      // Hi-hat on every beat
      percussionNotes.push({
        pitch: 42, // Closed hi-hat
        startTime: time,
        endTime: time + 0.05,
        velocity: 60
      });
    }

    return {
      notes: percussionNotes,
      totalTime: totalBeats * beatDuration,
      ticksPerQuarter: 220
    };
  }

  public async improvise(existingSequence: NoteSequence, style: string): Promise<NoteSequence> {
    if (!this.musicRNN) {
      throw new AudioAgentError('Neural models not available for improvisation', this.id, this.type);
    }

    const temperature = this.getTemperatureForStyle(style);
    const continuation = await this.musicRNN.continueSequence(
      existingSequence,
      32, // 8 bars of improvisation
      temperature
    );

    return this.postProcessMelody(continuation, { style } as ComposerConfig);
  }

  public async harmonize(melody: NoteSequence, key: string): Promise<NoteSequence> {
    return this.generateHarmony(melody, key);
  }

  // Helper methods
  private getTemperatureForStyle(style: string): number {
    const temperatures: Record<string, number> = {
      classical: 0.8,
      jazz: 1.2,
      electronic: 1.0,
      ambient: 0.6,
      world: 1.1,
      fusion: 1.0
    };
    return temperatures[style] || 1.0;
  }

  private getScaleForStyle(style: string): number[] {
    const styleScales: Record<string, keyof typeof this.scales> = {
      classical: 'major',
      jazz: 'dorian',
      electronic: 'minor',
      ambient: 'pentatonic',
      world: 'pentatonic',
      fusion: 'mixolydian'
    };
    return this.scales[styleScales[style] || 'major'];
  }

  private getNoteFromKey(key: string): number {
    const noteNumbers: Record<string, number> = {
      'C': 60, 'C#': 61, 'Db': 61, 'D': 62, 'D#': 63, 'Eb': 63,
      'E': 64, 'F': 65, 'F#': 66, 'Gb': 66, 'G': 67, 'G#': 68,
      'Ab': 68, 'A': 69, 'A#': 70, 'Bb': 70, 'B': 71
    };
    return noteNumbers[key] || 60;
  }

  private chooseInterval(style: string, complexity: string): number {
    const intervals = {
      simple: [-2, -1, 1, 2],
      moderate: [-4, -3, -2, -1, 1, 2, 3, 4],
      complex: [-7, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 7]
    };

    const availableIntervals = intervals[complexity as keyof typeof intervals] || intervals.moderate;
    return availableIntervals[Math.floor(Math.random() * availableIntervals.length)];
  }

  private constrainToScale(note: number, root: number, scale: number[]): number {
    const octave = Math.floor((note - root) / 12);
    const noteInScale = (note - root) % 12;

    // Find closest scale note
    const closestScaleNote = scale.reduce((prev, curr) => {
      return Math.abs(curr - noteInScale) < Math.abs(prev - noteInScale) ? curr : prev;
    });

    return root + octave * 12 + closestScaleNote;
  }

  private getVelocityForBeat(beat: number, style: string): number {
    const baseVelocity = 80;
    const accent = beat === 0 ? 10 : 0; // Accent on downbeat

    const styleVariation = {
      classical: 0,
      jazz: Math.random() * 20 - 10, // More dynamic variation
      electronic: 0,
      ambient: -20,
      world: Math.random() * 15 - 5,
      fusion: Math.random() * 10 - 5
    };

    return Math.max(30, Math.min(127, baseVelocity + accent + (styleVariation[style as keyof typeof styleVariation] || 0)));
  }

  private postProcessMelody(sequence: NoteSequence, config: ComposerConfig): NoteSequence {
    // Apply style-specific post-processing
    const processedNotes = sequence.notes.map(note => {
      // Adjust velocity based on style
      let velocity = note.velocity || 80;

      if (config.style === 'ambient') {
        velocity = Math.floor(velocity * 0.7); // Softer dynamics
      } else if (config.style === 'jazz') {
        velocity += Math.random() * 20 - 10; // More variation
      }

      return {
        ...note,
        velocity: Math.max(20, Math.min(127, velocity))
      };
    });

    return {
      ...sequence,
      notes: processedNotes
    };
  }

  private combineSequences(sequences: NoteSequence[]): NoteSequence {
    const allNotes = sequences.flatMap(seq => seq.notes);
    const maxTime = Math.max(...sequences.map(seq => seq.totalTime || 0));

    return {
      notes: allNotes,
      totalTime: maxTime,
      ticksPerQuarter: sequences[0]?.ticksPerQuarter || 220
    };
  }

  private calculateDuration(sequence: NoteSequence): number {
    return sequence.totalTime || 0;
  }

  private generateTitle(config: ComposerConfig): string {
    const styleTitles = {
      classical: ['Sonata', 'Prelude', 'Étude', 'Invention'],
      jazz: ['Blue Note', 'Modal Journey', 'Swing Time', 'Jazz Fusion'],
      electronic: ['Digital Dreams', 'Synthetic Waves', 'Cyber Pulse', 'Neural Beat'],
      ambient: ['Floating Echoes', 'Ethereal Drift', 'Peaceful Mind', 'Calm Waters'],
      world: ['Eastern Winds', 'Tribal Rhythms', 'Global Harmony', 'Cultural Fusion'],
      fusion: ['Modern Blend', 'Style Fusion', 'Contemporary Mix', 'Hybrid Sound']
    };

    const titles = styleTitles[config.style] || styleTitles.fusion;
    const baseTitle = titles[Math.floor(Math.random() * titles.length)];
    const number = Math.floor(Math.random() * 99) + 1;

    return `${baseTitle} No. ${number}`;
  }

  public getComposition(id: string): GeneratedComposition | undefined {
    return this.compositions.get(id);
  }

  public getAllCompositions(): GeneratedComposition[] {
    return Array.from(this.compositions.values());
  }

  public async playComposition(composition: GeneratedComposition): Promise<void> {
    if (this.neuralPlayer) {
      await this.neuralPlayer.playSequence(composition.sequence);
    }
  }

  public getStatus(): AgentStatus {
    return this.status;
  }

  public dispose(): void {
    this.status = 'disposed';

    if (this.neuralPlayer) {
      this.neuralPlayer.dispose();
    }

    if (this.musicVAE) {
      this.musicVAE.dispose();
    }

    if (this.musicRNN) {
      this.musicRNN.dispose();
    }

    if (this.melodyRNN) {
      this.melodyRNN.dispose();
    }

    this.compositions.clear();
    this.callbacks.onAgentStatusChange?.(this.id, this.status);

    console.log(`🎼 AudioComposer ${this.id} disposed`);
  }
}