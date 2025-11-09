// synth-presets.ts

// Using 'any' for presets as Tone.js has complex, nested types for synth options
// that are cumbersome to fully define in TypeScript for this use case.
export const SPHERE_SYNTH_PRESETS: { [key: number]: any } = {
  // 1. The Moon: Ethereal, gentle, slightly mysterious
  1: {
    oscillator: { type: 'fatsine', spread: 40, count: 3 },
    envelope: { attack: 0.1, decay: 0.4, sustain: 0.5, release: 2.5 },
  },
  // 2. Mercury: Quick, articulate, clear
  2: {
    oscillator: { type: 'square8' },
    envelope: { attack: 0.01, decay: 0.2, sustain: 0.2, release: 0.2 },
  },
  // 3. Venus: Lush, warm, beautiful
  3: {
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.02, decay: 0.5, sustain: 0.8, release: 1.5 },
    portamento: 0.05,
  },
  // 4. The Sun: Bright, resonant, powerful
  4: {
    oscillator: { type: 'fatsawtooth', count: 4, spread: 15 },
    envelope: { attack: 0.2, decay: 0.8, sustain: 0.6, release: 1.8 },
  },
  // 5. Mars: Strong, aggressive, driving
  5: {
    oscillator: { type: 'sawtooth' },
    envelope: { attack: 0.01, decay: 0.3, sustain: 0.4, release: 0.5 },
  },
  // 6. Jupiter: Grand, expansive, deep
  6: {
    oscillator: { type: 'fatsquare', count: 5, spread: 10 },
    envelope: { attack: 0.3, decay: 1.2, sustain: 0.7, release: 2.0 },
  },
  // 7. Saturn: Contemplative, slow, distant
  7: {
    oscillator: { type: 'sine' },
    envelope: { attack: 0.8, decay: 1.5, sustain: 0.3, release: 3.0 },
  },
  // 8. The Fixed Stars: Shimmering, complex, crystalline
  8: {
    oscillator: { type: 'pulse', width: 0.6 },
    envelope: { attack: 0.05, decay: 0.1, sustain: 0.9, release: 1.2 },
  },
  // 9. The Primum Mobile: Pure, fundamental, all-encompassing
  9: {
    oscillator: { type: 'sine' },
    envelope: { attack: 0.4, decay: 1.0, sustain: 1.0, release: 2.5 },
  },
};
