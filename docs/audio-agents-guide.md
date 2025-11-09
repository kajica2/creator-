# Audio Agent System Documentation

## Overview

The Audio Agent System is a comprehensive AI-powered audio generation framework that provides specialized agents for music composition, sound effects, voice synthesis, audio mixing, and beat generation. Each agent works independently while coordinating through a central coordinator for complex audio production workflows.

## Architecture

### Core Components

1. **AudioAgentCoordinator** - Central orchestration and coordination
2. **AudioComposer** - Neural music composition and melody generation
3. **SoundEffects** - Audio effects processing and synthesis
4. **VoiceSynthesizer** - Text-to-speech and voice generation
5. **AudioMixer** - Multi-track mixing and mastering
6. **BeatGenerator** - Rhythm and drum pattern creation

### Integration Systems

- **Claude-Flow Hooks** - Task tracking and agent coordination
- **Supabase Integration** - Project persistence and metadata storage
- **NeuralMelodyPlayer** - Real-time neural music interaction
- **Social Media Optimization** - Platform-specific audio formatting

## Getting Started

### Basic Initialization

```typescript
import { AudioAgents } from '../services/agents/audio';

// Initialize complete audio agent suite
const coordinator = await AudioAgents.initializeComplete({
  onCompositionGenerated: (composition) => console.log('New composition:', composition.title),
  onVoiceGenerated: (voice) => console.log('Voice generated:', voice.text),
  onBeatGenerated: (beat) => console.log('Beat generated:', beat.name)
});
```

### Quick Composition

```typescript
// Generate a complete audio composition
const project = await AudioAgents.quickComposition(coordinator, 'fusion', 120);

// Optimize for social media
const optimizedAudio = await AudioAgents.optimizeForSocial(
  coordinator,
  project,
  'instagram'
);
```

## Individual Agent Usage

### AudioComposer

The AudioComposer generates music using neural networks and algorithmic composition.

```typescript
import { AudioComposer, ComposerConfig } from '../services/agents/audio';

const composer = new AudioComposer();
await composer.initialize();

// Generate a composition
const config: ComposerConfig = {
  style: 'jazz',
  tempo: 120,
  duration: 32, // bars
  key: 'C',
  useNeuralGeneration: true
};

const composition = await composer.generateComposition(config);
```

**Features:**
- Neural melody generation using Magenta.js
- Multiple musical styles (jazz, classical, electronic, etc.)
- Harmony and bass line generation
- Integration with live keyboard input
- MIDI sequence export

### SoundEffects

Processes audio with various effects and generates sound textures.

```typescript
import { SoundEffects, SoundEffectConfig } from '../services/agents/audio';

const effects = new SoundEffects();
await effects.initialize();

// Generate reverb effect
const reverbConfig: SoundEffectConfig = {
  type: 'reverb',
  parameters: { roomSize: 0.8, decay: 4.0, wet: 0.3 }
};

const effect = await effects.generateEffect(reverbConfig);

// Apply effect to audio buffer
const processedAudio = await effects.processAudioBuffer(audioBuffer, reverbConfig);
```

**Available Effects:**
- Reverb (hall, plate, spring)
- Delay (echo, ping-pong, tape delay)
- Distortion (warm overdrive, heavy distortion)
- Filters (low-pass, high-pass, band-pass)
- Modulation (chorus, phaser, tremolo)
- Dynamics (compressor, limiter)
- EQ (bass boost, vocal clarity)

### VoiceSynthesizer

Converts text to speech with multiple voice options and emotional control.

```typescript
import { VoiceSynthesizer, TextToSpeechRequest } from '../services/agents/audio';

const voice = new VoiceSynthesizer();
await voice.initialize();

// Generate voice
const request: TextToSpeechRequest = {
  text: "Welcome to the AI audio generation system",
  voice: {
    voice: 'female',
    language: 'en-US',
    pitch: 0.2,
    speed: 1.0,
    emotion: 'happy'
  },
  format: {
    format: 'wav',
    sampleRate: 44100,
    bitRate: 1411,
    channels: 2,
    quality: 'high'
  }
};

const voiceOutput = await voice.synthesizeSpeech(request);
```

**Voice Options:**
- Multiple voice types (male, female, child, robotic, ethereal)
- Emotional variants (neutral, happy, sad, excited, calm)
- Multi-language support
- Pitch and speed control
- Custom voice presets

### AudioMixer

Professional audio mixing with multi-track support and mastering.

```typescript
import { AudioMixer, AudioProject, MixdownOptions } from '../services/agents/audio';

const mixer = new AudioMixer();
await mixer.initialize();

// Load project
mixer.loadProject(audioProject);

// Mix controls
mixer.updateChannelVolume('channel-1', -6); // dB
mixer.updateChannelPan('channel-2', 0.5);   // -1 to 1
mixer.muteChannel('channel-3', true);

// Master controls
mixer.setMasterVolume(-1);
mixer.configureMasterEQ(2, 0, 3); // low, mid, high

// Export mixdown
const mixdownOptions: MixdownOptions = {
  format: { format: 'wav', sampleRate: 48000, bitRate: 1536, channels: 2, quality: 'lossless' },
  normalize: true,
  limitPeaks: true,
  fadeIn: 0.5,
  fadeOut: 2.0
};

const finalAudio = await mixer.startMixdown(mixdownOptions);
```

**Mixing Features:**
- Multi-track channel mixing
- Real-time effect processing
- Master bus processing (EQ, compression, limiting)
- Professional mastering chain
- Multiple export formats
- Social media optimization

### BeatGenerator

Creates drum patterns and rhythmic sequences for various musical styles.

```typescript
import { BeatGenerator } from '../services/agents/audio';

const beats = new BeatGenerator();
await beats.initialize();

// Generate beat pattern
const beatPattern = await beats.generateBeat(
  'trap',    // style
  140,       // tempo
  32,        // length (beats)
  'moderate' // complexity
);

// Apply groove
const swingPattern = beats.applyGroove(beatPattern, 'swing8');

// Play pattern
await beats.playPattern(swingPattern);
```

**Rhythm Styles:**
- Hip-Hop (boom-bap, trap, lo-fi)
- Electronic (house, techno, drum & bass)
- Rock (basic rock, progressive, metal)
- Jazz (swing, bebop, fusion)
- World (afrobeat, latin, reggae)

## Advanced Workflows

### Full Production Pipeline

```typescript
// 1. Create beat pattern
const beat = await coordinator.generateBeat('hip-hop', 90, 16);

// 2. Generate composition
const composition = await coordinator.generateComposition({
  style: 'hip-hop',
  tempo: 90,
  useNeuralGeneration: true
});

// 3. Add voice narration
const voice = await coordinator.generateVoice({
  text: "This track was generated by AI",
  voice: { voice: 'robotic', language: 'en-US', pitch: -0.2, speed: 0.9 },
  format: AudioAgentDefaults.audioFormat
});

// 4. Create project structure
const project = await coordinator.createFullComposition('hip-hop', 90, true, {
  text: "AI generated music",
  voice: 'robotic'
});

// 5. Optimize for social media
const instagramVersion = await AudioAgents.optimizeForSocial(
  coordinator,
  project,
  'instagram'
);
```

### Claude-Flow Integration

The system integrates with Claude-Flow for task tracking and coordination:

```typescript
import { ClaudeFlowIntegration } from '../services/agents/audio';

// Pre-task hook
await ClaudeFlowIntegration.executePreTaskHook("Generating hip-hop composition");

// Generate content
const composition = await coordinator.generateComposition(config);

// Post-task hook
await ClaudeFlowIntegration.executePostTaskHook(composition.id);

// Progress notification
await ClaudeFlowIntegration.notifyProgress("Composition complete, starting mixdown");
```

### Supabase Persistence

Projects and generated content can be saved to Supabase:

```typescript
import { createSupabaseAudioIntegration } from '../services/agents/audio';

const supabase = createSupabaseAudioIntegration(userId);
await supabase.initialize();

// Save project
await supabase.saveProject(project);

// Save composition
await supabase.saveComposition(composition, project.id);

// Upload audio file
const audioUrl = await supabase.uploadAudioFile(audioBuffer, 'my-track', 'wav');

// Get user's projects
const projects = await supabase.getUserProjects();

// Search by tags
const results = await supabase.searchByTags(['hip-hop', '90bpm']);
```

## Social Media Optimization

The system includes built-in optimization for major social media platforms:

### Platform Presets

```typescript
import { AudioAgentDefaults } from '../services/agents/audio';

// Instagram presets
const instagramStory = AudioAgentDefaults.socialMediaPresets.instagram.story;
const instagramReel = AudioAgentDefaults.socialMediaPresets.instagram.reel;

// TikTok preset
const tiktokFormat = AudioAgentDefaults.socialMediaPresets.tiktok;

// YouTube presets
const youtubeShort = AudioAgentDefaults.socialMediaPresets.youtube.short;
const youtubeVideo = AudioAgentDefaults.socialMediaPresets.youtube.video;
```

### Custom Optimization

```typescript
// Optimize existing audio for platform
const optimizedAudio = await mixer.optimizeForSocialMedia(
  audioBuffer,
  {
    platform: 'tiktok',
    format: 'aac',
    sampleRate: 44100,
    bitRate: 128,
    channels: 2,
    quality: 'medium',
    duration: 60,
    compressionLevel: 0.8
  }
);
```

## Error Handling

All agents implement comprehensive error handling:

```typescript
try {
  const composition = await coordinator.generateComposition(config);
} catch (error) {
  if (error instanceof AudioAgentError) {
    console.error(`Agent ${error.agentId} failed:`, error.message);
    console.error(`Error code: ${error.code}`);
  }
}
```

## Performance Considerations

### Memory Management

```typescript
// Dispose agents when done
coordinator.dispose();

// Individual agent cleanup
composer.dispose();
effects.dispose();
voice.dispose();
```

### Optimization Tips

1. **Initialize Once**: Create agent instances once and reuse them
2. **Batch Operations**: Group related operations together
3. **Memory Cleanup**: Dispose agents and clear buffers when done
4. **Quality Settings**: Use appropriate quality settings for your use case
5. **Parallel Processing**: Use coordinator for concurrent operations

## Configuration Reference

### AudioAgentDefaults

```typescript
// Default configurations for all agents
const defaults = AudioAgentDefaults;

// Composer configuration
defaults.composerConfig;

// Voice configuration
defaults.voiceConfig;

// Audio format
defaults.audioFormat;

// Mixer channel
defaults.mixerChannel;

// Beat pattern
defaults.beatPattern;

// Social media presets
defaults.socialMediaPresets;
```

### Validation Utilities

```typescript
import { AudioAgentUtils } from '../services/agents/audio';

// Validate configurations
AudioAgentUtils.validateAudioFormat(format);
AudioAgentUtils.validateTempo(120);
AudioAgentUtils.validateVoiceConfig(voiceConfig);
AudioAgentUtils.validateBeatPattern(pattern);
AudioAgentUtils.validateEffectConfig(effectConfig);
```

## API Reference

### AudioAgentCoordinator

| Method | Description | Parameters | Returns |
|--------|-------------|------------|---------|
| `initialize()` | Initialize all agents | `none` | `Promise<void>` |
| `createFullComposition()` | Generate complete project | `style, tempo, includeBeats, voice?` | `Promise<AudioProject>` |
| `generateComposition()` | Generate music only | `config` | `Promise<GeneratedComposition>` |
| `generateVoice()` | Generate speech | `request` | `Promise<VoiceOutput>` |
| `generateBeat()` | Generate rhythm | `style, tempo, length, complexity` | `Promise<BeatPattern>` |
| `mixdownProject()` | Export final audio | `project, options` | `Promise<ArrayBuffer>` |
| `getAgentStatuses()` | Get all agent states | `none` | `Record<string, AgentStatus>` |
| `dispose()` | Clean up resources | `none` | `void` |

### Individual Agents

Each agent implements the `BaseAudioAgent` interface:

| Property/Method | Description | Type |
|----------------|-------------|------|
| `id` | Unique agent identifier | `string` |
| `type` | Agent type | `AudioAgentType` |
| `status` | Current status | `AgentStatus` |
| `capabilities` | Agent capabilities | `string[]` |
| `initialize()` | Initialize agent | `Promise<void>` |
| `getStatus()` | Get current status | `AgentStatus` |
| `dispose()` | Clean up resources | `void` |

## Examples

### Complete React Integration

```typescript
import React, { useState, useEffect } from 'react';
import { AudioAgents, AudioAgentCoordinator } from '../services/agents/audio';

export const AudioComponent: React.FC = () => {
  const [coordinator, setCoordinator] = useState<AudioAgentCoordinator | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const initAudio = async () => {
      setIsLoading(true);
      try {
        const coord = await AudioAgents.initializeComplete({
          onCompositionGenerated: (comp) => console.log('New composition:', comp),
        });
        setCoordinator(coord);
      } catch (error) {
        console.error('Failed to initialize audio:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAudio();
    return () => coordinator?.dispose();
  }, []);

  const generateMusic = async () => {
    if (!coordinator) return;

    setIsLoading(true);
    try {
      const project = await coordinator.createFullComposition('fusion', 120, true);
      console.log('Generated project:', project);
    } catch (error) {
      console.error('Generation failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={generateMusic}
        disabled={!coordinator || isLoading}
      >
        {isLoading ? 'Generating...' : 'Generate Music'}
      </button>
    </div>
  );
};
```

## Troubleshooting

### Common Issues

1. **Agent Not Ready**: Ensure `initialize()` is called and completes successfully
2. **Audio Context Issues**: Call `Tone.start()` after user interaction
3. **Memory Leaks**: Always call `dispose()` when components unmount
4. **Format Errors**: Validate audio format configurations before use
5. **Permission Errors**: Ensure microphone permissions for audio recording

### Debug Tools

```typescript
// Check agent statuses
console.log(coordinator.getAgentStatuses());

// Get memory state
console.log(coordinator.getMemoryState());

// Validate configurations
console.log(AudioAgentUtils.validateAudioFormat(format));
```

This documentation provides a comprehensive guide to using the Audio Agent System. For more examples and advanced usage patterns, refer to the integration example component and the individual agent test files.