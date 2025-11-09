// Main components
export { default as NeuralMelodyComponent } from './NeuralMelodyComponent';
export { default as PianoKeyboard } from './PianoKeyboard';
export { NeuralMelodyPlayer } from './NeuralMelodyPlayer';

// Example and integration
export { default as NeuralMelodyExample } from './NeuralMelodyExample';

// Types and interfaces
export * from './types';

// Re-export for convenience
export type {
  NeuralMelodyConfig,
  PlayerState,
  NoteSequence,
  Note,
  KeyMapping,
  MelodyPlayerCallbacks,
  KeyboardKey,
  AudioVisualizationData
} from './types';