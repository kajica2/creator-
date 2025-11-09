export interface NoteSequence {
  notes: Note[];
  totalTime: number;
  ticksPerQuarter: number;
}

export interface Note {
  pitch: number;
  startTime: number;
  endTime: number;
  velocity: number;
  program?: number;
  isDrum?: boolean;
}

export interface PlayerConfig {
  temperature: number;
  stepsPerQuarter: number;
  totalSteps: number;
  minNote: number;
  maxNote: number;
}

export interface KeyMapping {
  [key: string]: number; // Key -> MIDI note number
}

export interface PlayerState {
  isPlaying: boolean;
  isLoading: boolean;
  isModelLoaded: boolean;
  currentSequence: NoteSequence | null;
  error: string | null;
  sustainMode: boolean;
  activeNotes: Set<number>;
}

export interface NeuralMelodyConfig {
  temperature: number;
  stepsPerQuarter: number;
  totalSteps: number;
  minNote: number;
  maxNote: number;
  modelUrl?: string;
}

export interface AudioVisualizationData {
  waveformData: Float32Array;
  frequencyData: Uint8Array;
  currentTime: number;
  duration: number;
}

export interface KeyboardKey {
  note: number;
  keyName: string;
  isBlack: boolean;
  isActive: boolean;
  octave: number;
}

export interface MelodyPlayerCallbacks {
  onNoteStart?: (note: number, velocity: number) => void;
  onNoteEnd?: (note: number) => void;
  onSequenceUpdate?: (sequence: NoteSequence) => void;
  onError?: (error: Error) => void;
  onModelLoad?: () => void;
  onPlaybackStateChange?: (isPlaying: boolean) => void;
}