# Neural Melody Player

A modular Tone.js component for AI-powered melody autocompletion using Google Magenta.

## Features

- **Neural Network Integration**: Uses Google Magenta's MusicRNN for AI melody generation
- **Interactive Piano Keyboard**: Visual keyboard with MIDI note mapping
- **Split-Screen Interface**: Separate human input and AI response areas
- **Sustain Mode**: Caps Lock toggle for sustained notes
- **Real-time Controls**: Adjustable temperature, steps, and other neural network parameters
- **Sequence Recording**: Record and replay generated melodies
- **React Integration**: Full TypeScript support with proper lifecycle management
- **Resource Cleanup**: Proper disposal of Tone.js and neural network resources

## Quick Start

```tsx
import React from 'react';
import { NeuralMelodyComponent } from './components/audio';

function App() {
  const handleSequenceGenerated = (sequence) => {
    console.log('AI generated sequence:', sequence);
  };

  return (
    <NeuralMelodyComponent
      config={{
        temperature: 1.2,
        totalSteps: 64,
        minNote: 60,
        maxNote: 84
      }}
      onSequenceGenerated={handleSequenceGenerated}
      onError={(error) => console.error('Neural melody error:', error)}
    />
  );
}
```

## Advanced Usage

### Using the Player Class Directly

```tsx
import { NeuralMelodyPlayer } from './components/audio';

const player = new NeuralMelodyPlayer(
  {
    temperature: 1.0,
    stepsPerQuarter: 4,
    totalSteps: 128
  },
  {
    onSequenceUpdate: (sequence) => {
      console.log('New sequence generated:', sequence);
    },
    onModelLoad: () => {
      console.log('Neural network model loaded');
    }
  }
);

// Start audio context (required for user interaction)
await player.startAudioContext();

// Play a note
player.playNoteByMidi(60, 0.8);

// Cleanup when done
player.dispose();
```

### Custom Keyboard Component

```tsx
import { PianoKeyboard } from './components/audio';

function MyKeyboard() {
  const [activeNotes, setActiveNotes] = useState([]);
  const [sustainMode, setSustainMode] = useState(false);

  return (
    <PianoKeyboard
      activeNotes={activeNotes}
      sustainMode={sustainMode}
      onNotePress={(note) => {
        setActiveNotes(prev => [...prev, note]);
        // Play the note
      }}
      onNoteRelease={(note) => {
        setActiveNotes(prev => prev.filter(n => n !== note));
        // Stop the note
      }}
      startOctave={3}
      octaves={2}
      showLabels={true}
    />
  );
}
```

## Configuration Options

### NeuralMelodyConfig

```typescript
interface NeuralMelodyConfig {
  temperature: number;        // 0.1-2.0, controls randomness
  stepsPerQuarter: number;    // 1-8, rhythmic resolution
  totalSteps: number;         // 32-256, length of generation
  minNote: number;           // Minimum MIDI note (e.g., 48 = C3)
  maxNote: number;           // Maximum MIDI note (e.g., 84 = C6)
  modelUrl?: string;         // Custom Magenta model URL
}
```

### Key Mapping

The component supports standard computer keyboard input:

**White Keys**: A S D F G H J K (C D E F G A B C)
**Black Keys**: W E T Y U (C# D# F# G# A#)
**Lower Octave**: Z X C V B N M (C D E F G A B)
**Lower Black Keys**: Q 2 3 4 5 (C# D# F# G# A#)

### Special Keys

- **Caps Lock**: Toggle sustain mode
- **Mouse**: Click piano keys for note input

## Error Handling

The component includes comprehensive error handling:

```tsx
<NeuralMelodyComponent
  onError={(error) => {
    if (error.message.includes('model')) {
      // Handle model loading errors
      showModelErrorDialog();
    } else if (error.message.includes('audio')) {
      // Handle audio context errors
      promptUserForAudioPermission();
    }
  }}
/>
```

## Performance Notes

- The neural network model (~10MB) is loaded asynchronously
- Audio context requires user interaction to start
- Proper cleanup prevents memory leaks
- Keyboard events are optimized for real-time performance

## Dependencies

- `tone`: ^15.1.22 - Audio synthesis and scheduling
- `@magenta/music`: ^1.23.1 - Neural network models
- `react`: ^19.2.0 - UI framework
- `typescript`: ~5.8.2 - Type safety

## Browser Compatibility

- Chrome 66+ (recommended)
- Firefox 60+
- Safari 11.1+
- Edge 79+

Requires Web Audio API and ES2017+ support.