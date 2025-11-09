import * as Tone from 'tone';
import * as mm from '@magenta/music';
import {
  NeuralMelodyConfig,
  PlayerState,
  NoteSequence,
  Note,
  KeyMapping,
  MelodyPlayerCallbacks
} from './types';

export class NeuralMelodyPlayer {
  private synth: Tone.PolySynth;
  private player: Tone.Player | null = null;
  private musicRNN: mm.MusicRNN | null = null;
  private state: PlayerState;
  private config: NeuralMelodyConfig;
  private callbacks: MelodyPlayerCallbacks;
  private keyMapping: KeyMapping;
  private sustainedNotes: Map<number, Tone.ToneEvent> = new Map();
  private animationFrameId: number | null = null;

  constructor(config: Partial<NeuralMelodyConfig> = {}, callbacks: MelodyPlayerCallbacks = {}) {
    this.config = {
      temperature: 1.0,
      stepsPerQuarter: 4,
      totalSteps: 128,
      minNote: 48, // C3
      maxNote: 84, // C6
      modelUrl: 'https://storage.googleapis.com/magentadata/js/checkpoints/music_rnn/basic_rnn',
      ...config
    };

    this.callbacks = callbacks;
    this.state = {
      isPlaying: false,
      isLoading: false,
      isModelLoaded: false,
      currentSequence: null,
      error: null,
      sustainMode: false,
      activeNotes: new Set()
    };

    this.keyMapping = this.createKeyMapping();
    this.synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' },
      envelope: {
        attack: 0.02,
        decay: 0.1,
        sustain: 0.3,
        release: 1
      }
    }).toDestination();

    this.initializeModel();
    this.setupEventListeners();
  }

  private createKeyMapping(): KeyMapping {
    return {
      // White keys (C major scale)
      'a': 60, 's': 62, 'd': 64, 'f': 65, 'g': 67, 'h': 69, 'j': 71, 'k': 72,
      // Black keys
      'w': 61, 'e': 63, 't': 66, 'y': 68, 'u': 70,
      // Lower octave
      'z': 48, 'x': 50, 'c': 52, 'v': 53, 'b': 55, 'n': 57, 'm': 59,
      // Lower octave black keys
      'q': 49, '2': 51, '3': 54, '4': 56, '5': 58
    };
  }

  private setupEventListeners(): void {
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
    document.addEventListener('keyup', this.handleKeyUp.bind(this));

    // Handle caps lock for sustain mode
    document.addEventListener('keydown', (e) => {
      if (e.code === 'CapsLock') {
        e.preventDefault();
        this.toggleSustainMode();
      }
    });
  }

  private async initializeModel(): Promise<void> {
    try {
      this.setState({ isLoading: true, error: null });

      this.musicRNN = new mm.MusicRNN(this.config.modelUrl!);
      await this.musicRNN.initialize();

      this.setState({
        isLoading: false,
        isModelLoaded: true
      });

      this.callbacks.onModelLoad?.();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load neural network model';
      this.setState({
        isLoading: false,
        error: errorMessage
      });
      this.callbacks.onError?.(new Error(errorMessage));
    }
  }

  private setState(updates: Partial<PlayerState>): void {
    this.state = { ...this.state, ...updates };
  }

  private handleKeyDown(event: KeyboardEvent): void {
    const key = event.key.toLowerCase();
    const midiNote = this.keyMapping[key];

    if (midiNote && !this.state.activeNotes.has(midiNote)) {
      event.preventDefault();
      this.playNote(midiNote, 0.8);

      if (this.state.sustainMode) {
        this.sustainNote(midiNote);
      }
    }
  }

  private handleKeyUp(event: KeyboardEvent): void {
    const key = event.key.toLowerCase();
    const midiNote = this.keyMapping[key];

    if (midiNote && !this.state.sustainMode) {
      this.stopNote(midiNote);
    }
  }

  private playNote(midiNote: number, velocity: number = 0.8): void {
    try {
      const frequency = Tone.Frequency(midiNote, 'midi').toFrequency();
      this.synth.triggerAttack(frequency, undefined, velocity);

      this.state.activeNotes.add(midiNote);
      this.callbacks.onNoteStart?.(midiNote, velocity);

      // Generate continuation if model is loaded
      if (this.state.isModelLoaded && this.musicRNN) {
        this.generateContinuation(midiNote);
      }
    } catch (error) {
      console.error('Error playing note:', error);
      this.callbacks.onError?.(error instanceof Error ? error : new Error('Note playback failed'));
    }
  }

  private stopNote(midiNote: number): void {
    try {
      const frequency = Tone.Frequency(midiNote, 'midi').toFrequency();
      this.synth.triggerRelease(frequency);

      this.state.activeNotes.delete(midiNote);
      this.callbacks.onNoteEnd?.(midiNote);

      // Clean up sustained note if exists
      if (this.sustainedNotes.has(midiNote)) {
        this.sustainedNotes.get(midiNote)?.dispose();
        this.sustainedNotes.delete(midiNote);
      }
    } catch (error) {
      console.error('Error stopping note:', error);
    }
  }

  private sustainNote(midiNote: number): void {
    if (this.sustainedNotes.has(midiNote)) return;

    const sustainEvent = new Tone.ToneEvent(() => {
      // Keep the note playing
    });

    this.sustainedNotes.set(midiNote, sustainEvent);
  }

  private toggleSustainMode(): void {
    this.state.sustainMode = !this.state.sustainMode;

    if (!this.state.sustainMode) {
      // Release all sustained notes
      this.sustainedNotes.forEach((event, note) => {
        this.stopNote(note);
      });
      this.sustainedNotes.clear();
    }
  }

  private async generateContinuation(seedNote: number): Promise<void> {
    if (!this.musicRNN || !this.state.isModelLoaded) return;

    try {
      // Create a seed sequence with the played note
      const seedSequence: NoteSequence = {
        notes: [{
          pitch: seedNote,
          startTime: 0,
          endTime: 0.5,
          velocity: 80
        }],
        totalTime: 0.5,
        ticksPerQuarter: this.config.stepsPerQuarter
      };

      // Generate continuation
      const continuation = await this.musicRNN.continueSequence(
        seedSequence,
        this.config.totalSteps,
        this.config.temperature
      );

      if (continuation && continuation.notes.length > 1) {
        this.setState({ currentSequence: continuation });
        this.callbacks.onSequenceUpdate?.(continuation);

        // Play the generated notes
        this.playGeneratedSequence(continuation, 1); // Skip the seed note
      }
    } catch (error) {
      console.error('Error generating continuation:', error);
      this.callbacks.onError?.(error instanceof Error ? error : new Error('Melody generation failed'));
    }
  }

  private playGeneratedSequence(sequence: NoteSequence, startIndex: number = 0): void {
    const notes = sequence.notes.slice(startIndex);
    const startTime = Tone.now();

    notes.forEach((note) => {
      const frequency = Tone.Frequency(note.pitch, 'midi').toFrequency();
      const velocity = (note.velocity || 80) / 127;
      const noteStartTime = startTime + note.startTime;
      const duration = note.endTime - note.startTime;

      // Schedule the note
      this.synth.triggerAttackRelease(frequency, duration, noteStartTime, velocity);
    });
  }

  // Public API methods
  public async startAudioContext(): Promise<void> {
    if (Tone.context.state !== 'running') {
      await Tone.start();
    }
  }

  public async loadModel(modelUrl?: string): Promise<void> {
    if (modelUrl) {
      this.config.modelUrl = modelUrl;
    }
    await this.initializeModel();
  }

  public setTemperature(temperature: number): void {
    this.config.temperature = Math.max(0.1, Math.min(2.0, temperature));
  }

  public setConfig(newConfig: Partial<NeuralMelodyConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  public getState(): PlayerState {
    return { ...this.state };
  }

  public getConfig(): NeuralMelodyConfig {
    return { ...this.config };
  }

  public async playSequence(sequence: NoteSequence): Promise<void> {
    if (!sequence || !sequence.notes.length) return;

    try {
      this.setState({ isPlaying: true });
      this.callbacks.onPlaybackStateChange?.(true);

      this.playGeneratedSequence(sequence);

      // Auto-stop after sequence duration
      const totalDuration = Math.max(...sequence.notes.map(n => n.endTime)) * 1000;
      setTimeout(() => {
        this.stop();
      }, totalDuration);

    } catch (error) {
      console.error('Error playing sequence:', error);
      this.callbacks.onError?.(error instanceof Error ? error : new Error('Sequence playback failed'));
      this.setState({ isPlaying: false });
    }
  }

  public stop(): void {
    // Stop all active notes
    this.state.activeNotes.forEach(note => this.stopNote(note));

    // Clear sustained notes
    this.sustainedNotes.forEach((event, note) => {
      event.dispose();
      this.stopNote(note);
    });
    this.sustainedNotes.clear();

    // Cancel any scheduled animations
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    this.setState({
      isPlaying: false,
      sustainMode: false,
      activeNotes: new Set()
    });
    this.callbacks.onPlaybackStateChange?.(false);
  }

  public dispose(): void {
    this.stop();

    // Clean up Tone.js resources
    this.synth.dispose();
    if (this.player) {
      this.player.dispose();
    }

    // Remove event listeners
    document.removeEventListener('keydown', this.handleKeyDown.bind(this));
    document.removeEventListener('keyup', this.handleKeyUp.bind(this));

    // Dispose model
    if (this.musicRNN) {
      this.musicRNN.dispose();
    }
  }

  public getSynthNode(): Tone.PolySynth {
    return this.synth;
  }

  public getKeyMapping(): KeyMapping {
    return { ...this.keyMapping };
  }

  public playNoteByMidi(midiNote: number, velocity: number = 0.8, duration?: number): void {
    if (duration) {
      const frequency = Tone.Frequency(midiNote, 'midi').toFrequency();
      this.synth.triggerAttackRelease(frequency, duration, undefined, velocity);
    } else {
      this.playNote(midiNote, velocity);
    }
  }

  public stopNoteByMidi(midiNote: number): void {
    this.stopNote(midiNote);
  }

  public isSustainMode(): boolean {
    return this.state.sustainMode;
  }

  public getActiveNotes(): number[] {
    return Array.from(this.state.activeNotes);
  }
}