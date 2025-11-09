/**
 * Live Audio/Video Mixer Agent Group - Index
 *
 * Centralized exports and initialization for the complete live mixer system
 */

// Core Components
export { LiveMixer } from './LiveMixer';
export { StreamCoordinator } from './StreamCoordinator';
export { RecordingManager } from './RecordingManager';
export { EffectsProcessor } from './EffectsProcessor';
export { AudioProcessor } from './AudioProcessor';
export { WebRTCManager } from './WebRTCManager';
export { NeuralMelodyIntegration } from './NeuralMelodyIntegration';
export { LiveCoordinator } from './LiveCoordinator';
export { StreamingPlatformAPIs } from './StreamingPlatformAPIs';

// Live Mixer System Factory
import { LiveCoordinator } from './LiveCoordinator';
import { LivePerformanceConfig } from '../../../../types';
import { MemoryManager } from '../MemoryManager';
import { ClaudeFlowIntegration } from '../ClaudeFlowIntegration';

/**
 * Create and initialize complete live mixer system
 */
export async function createLiveMixerSystem(
  config: Partial<LivePerformanceConfig> = {},
  memoryManager?: MemoryManager,
  claudeFlow?: ClaudeFlowIntegration
): Promise<LiveCoordinator> {
  // Default configuration
  const defaultConfig: LivePerformanceConfig = {
    bufferSize: 512,
    sampleRate: 44100,
    channels: 2,
    latency: 'low',
    enableNeuralProcessing: true,
    enableRealTimeEffects: true,
    maxSimultaneousStreams: 4,
    recordingFormat: 'webm',
    ...config
  };

  // Create memory manager if not provided
  const memory = memoryManager || new MemoryManager();

  // Create Claude Flow integration if not provided
  const flow = claudeFlow || new ClaudeFlowIntegration();

  // Create and return coordinator
  const coordinator = new LiveCoordinator(defaultConfig, memory, flow);

  return coordinator;
}

/**
 * Quick start live mixer with default settings
 */
export async function quickStartLiveMixer(audioContext: AudioContext): Promise<LiveCoordinator> {
  const coordinator = await createLiveMixerSystem();
  await coordinator.startSession(audioContext);
  return coordinator;
}

// Re-export types for convenience
export type {
  LiveMixerState,
  MixerChannel,
  Effect,
  EffectType,
  EffectChain,
  StreamingPlatform,
  VideoResolution,
  RecordingSession,
  WebRTCConnection,
  LivePerformanceConfig,
  AudioProcessingNode,
  VisualizationData,
  LiveMixerMessage
} from '../../../../types';