import { NoteSequence, MelodyPlayerCallbacks } from '../../../components/audio/types';

// Base Audio Agent Interface
export interface BaseAudioAgent {
  id: string;
  type: AudioAgentType;
  status: AgentStatus;
  capabilities: string[];
  metadata: Record<string, any>;
  initialize(): Promise<void>;
  dispose(): void;
  getStatus(): AgentStatus;
}

// Audio Agent Types
export type AudioAgentType =
  | 'composer'
  | 'sound-effects'
  | 'voice-synthesizer'
  | 'audio-mixer'
  | 'beat-generator';

export type AgentStatus = 'idle' | 'initializing' | 'ready' | 'processing' | 'error' | 'disposed';

// Audio Format Types
export interface AudioFormat {
  format: 'mp3' | 'wav' | 'ogg' | 'aac' | 'm4a';
  sampleRate: number;
  bitRate: number;
  channels: number;
  quality: 'low' | 'medium' | 'high' | 'lossless';
}

export interface SocialMediaFormat extends AudioFormat {
  platform: 'instagram' | 'tiktok' | 'youtube' | 'twitter' | 'facebook';
  duration?: number;
  compressionLevel: number;
}

// Audio Project State
export interface AudioProject {
  id: string;
  name: string;
  tracks: AudioTrack[];
  masterVolume: number;
  tempo: number;
  key: string;
  timeSignature: [number, number];
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    duration: number;
    tags: string[];
  };
}

export interface AudioTrack {
  id: string;
  name: string;
  type: 'audio' | 'midi' | 'generated';
  volume: number;
  pan: number;
  muted: boolean;
  solo: boolean;
  effects: AudioEffect[];
  audioData?: ArrayBuffer;
  midiData?: NoteSequence;
}

export interface AudioEffect {
  id: string;
  type: string;
  parameters: Record<string, any>;
  enabled: boolean;
  wet: number; // 0-1 dry/wet mix
}

// Composer Agent Interfaces
export interface ComposerConfig {
  style: 'classical' | 'jazz' | 'electronic' | 'ambient' | 'world' | 'fusion';
  complexity: 'simple' | 'moderate' | 'complex';
  duration: number;
  key: string;
  tempo: number;
  instruments: string[];
  useNeuralGeneration: boolean;
}

export interface GeneratedComposition {
  id: string;
  title: string;
  sequence: NoteSequence;
  metadata: {
    style: string;
    key: string;
    tempo: number;
    duration: number;
    generatedAt: Date;
    seedNote?: number;
  };
  tracks: {
    melody: NoteSequence;
    harmony?: NoteSequence;
    bass?: NoteSequence;
    percussion?: NoteSequence;
  };
}

// Sound Effects Agent Interfaces
export interface SoundEffectConfig {
  type: 'reverb' | 'delay' | 'distortion' | 'filter' | 'chorus' | 'phaser' | 'compressor' | 'eq';
  parameters: Record<string, number>;
  presets?: string;
}

export interface GeneratedSoundEffect {
  id: string;
  name: string;
  type: string;
  audioBuffer: ArrayBuffer;
  duration: number;
  parameters: Record<string, any>;
}

// Voice Synthesizer Interfaces
export interface VoiceConfig {
  voice: 'male' | 'female' | 'child' | 'robotic' | 'ethereal';
  language: string;
  accent?: string;
  pitch: number; // -1 to 1
  speed: number; // 0.5 to 2
  emotion?: 'neutral' | 'happy' | 'sad' | 'excited' | 'calm';
}

export interface TextToSpeechRequest {
  text: string;
  voice: VoiceConfig;
  format: AudioFormat;
  ssml?: boolean; // Speech Synthesis Markup Language
}

export interface VoiceOutput {
  id: string;
  text: string;
  audioBuffer: ArrayBuffer;
  duration: number;
  voiceConfig: VoiceConfig;
  metadata: {
    generatedAt: Date;
    language: string;
    wordCount: number;
  };
}

// Audio Mixer Interfaces
export interface MixerConfig {
  masterVolume: number;
  channels: MixerChannel[];
  effects: AudioEffect[];
  outputFormat: AudioFormat;
}

export interface MixerChannel {
  id: string;
  name: string;
  volume: number;
  pan: number;
  muted: boolean;
  solo: boolean;
  input: AudioTrack;
  effects: AudioEffect[];
}

export interface MixdownOptions {
  format: AudioFormat;
  normalize: boolean;
  fadeIn?: number;
  fadeOut?: number;
  limitPeaks: boolean;
  socialMediaOptimization?: SocialMediaFormat;
}

// Beat Generator Interfaces
export interface BeatPattern {
  id: string;
  name: string;
  timeSignature: [number, number];
  tempo: number;
  pattern: BeatStep[];
  length: number; // in beats
}

export interface BeatStep {
  time: number; // beat position (0-based)
  velocity: number; // 0-127
  instrument: DrumInstrument;
  accent?: boolean;
}

export type DrumInstrument =
  | 'kick'
  | 'snare'
  | 'hihat'
  | 'openhat'
  | 'crash'
  | 'ride'
  | 'tom1'
  | 'tom2'
  | 'tom3';

export interface RhythmStyle {
  name: string;
  patterns: BeatPattern[];
  fills: BeatPattern[];
  variations: BeatPattern[];
}

// Agent Communication Interfaces
export interface AudioAgentMessage {
  from: string;
  to: string;
  type: AudioMessageType;
  payload: any;
  timestamp: Date;
  correlationId?: string;
}

export type AudioMessageType =
  | 'composition_request'
  | 'composition_complete'
  | 'effect_request'
  | 'effect_complete'
  | 'voice_request'
  | 'voice_complete'
  | 'mix_request'
  | 'mix_complete'
  | 'beat_request'
  | 'beat_complete'
  | 'project_update'
  | 'error';

// Memory and State Management
export interface AudioMemoryState {
  projects: Record<string, AudioProject>;
  activeProject?: string;
  recentCompositions: GeneratedComposition[];
  userPreferences: {
    defaultFormats: AudioFormat[];
    favoriteStyles: string[];
    socialMediaSettings: SocialMediaFormat[];
  };
  agentStates: Record<string, any>;
}

// Callbacks and Events
export interface AudioAgentCallbacks extends MelodyPlayerCallbacks {
  onCompositionGenerated?: (composition: GeneratedComposition) => void;
  onEffectProcessed?: (effect: GeneratedSoundEffect) => void;
  onVoiceGenerated?: (voice: VoiceOutput) => void;
  onBeatGenerated?: (pattern: BeatPattern) => void;
  onProjectUpdated?: (project: AudioProject) => void;
  onAgentStatusChange?: (agentId: string, status: AgentStatus) => void;
}

// Integration Interfaces
export interface NeuralMelodyIntegration {
  generateMelody(seedNote: number, config: ComposerConfig): Promise<NoteSequence>;
  improvise(existingSequence: NoteSequence, style: string): Promise<NoteSequence>;
  harmonize(melody: NoteSequence, key: string): Promise<NoteSequence>;
}

export interface SupabaseAudioMetadata {
  id: string;
  project_id: string;
  agent_type: AudioAgentType;
  metadata: Record<string, any>;
  audio_url?: string;
  created_at: Date;
  updated_at: Date;
  tags: string[];
  social_optimized: boolean;
}

// Error Types
export class AudioAgentError extends Error {
  constructor(
    message: string,
    public agentId: string,
    public agentType: AudioAgentType,
    public code?: string
  ) {
    super(message);
    this.name = 'AudioAgentError';
  }
}