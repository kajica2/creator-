/**
 * Agent Orchestrator - Central hub for inter-agent communication and media pipeline
 * Flow: Astrology → Sound → Song → Image → Subscription → Karaoke
 */

import { EventEmitter } from 'events';
import { supabase } from '../../utils/supabaseClient';
import RecruiterAgent from '../agents/RecruiterAgent';

export interface AgentMessage {
  id: string;
  source: AgentType;
  target: AgentType;
  type: MessageType;
  payload: any;
  timestamp: number;
  userId?: string;
  sessionId?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export type AgentType =
  | 'astrology'
  | 'sound'
  | 'song'
  | 'image'
  | 'subscription'
  | 'karaoke'
  | 'recruiter'
  | 'hashtag'
  | 'ai-story'
  | 'lyrics'
  | 'mixer'
  | 'transcriber';

export type MessageType =
  | 'request'
  | 'response'
  | 'stream'
  | 'error'
  | 'status'
  | 'complete'
  | 'pipeline';

export interface PipelineConfig {
  id: string;
  name: string;
  agents: AgentType[];
  transformers: Map<string, TransformFunction>;
  validators: Map<string, ValidationFunction>;
  errorHandlers: Map<string, ErrorHandler>;
}

type TransformFunction = (data: any, context?: any) => Promise<any>;
type ValidationFunction = (data: any) => boolean;
type ErrorHandler = (error: Error, context?: any) => void;

export class AgentOrchestrator extends EventEmitter {
  private static instance: AgentOrchestrator;
  private agents: Map<AgentType, AgentHandler>;
  private pipelines: Map<string, PipelineConfig>;
  private messageQueue: AgentMessage[];
  private activeConnections: Map<string, WebSocket>;
  private processingQueue: Set<string>;

  private constructor() {
    super();
    this.agents = new Map();
    this.pipelines = new Map();
    this.messageQueue = [];
    this.activeConnections = new Map();
    this.processingQueue = new Set();
    this.initializeDefaultPipelines();
    this.initializeDefaultAgents();
  }

  static getInstance(): AgentOrchestrator {
    if (!AgentOrchestrator.instance) {
      AgentOrchestrator.instance = new AgentOrchestrator();
    }
    return AgentOrchestrator.instance;
  }

  private initializeDefaultPipelines() {
    // Main media generation pipeline
    this.registerPipeline({
      id: 'media-generation',
      name: 'Complete Media Generation Pipeline',
      agents: ['astrology', 'sound', 'song', 'image', 'subscription', 'karaoke'],
      transformers: new Map([
        ['astrology-sound', this.transformAstrologyToSound],
        ['sound-song', this.transformSoundToSong],
        ['song-image', this.transformSongToImage],
        ['image-subscription', this.transformImageToSubscription],
        ['subscription-karaoke', this.transformSubscriptionToKaraoke],
      ]),
      validators: new Map([
        ['astrology', (data) => !!data.birthDate && !!data.birthTime],
        ['sound', (data) => !!data.frequency || !!data.waveform],
        ['song', (data) => !!data.lyrics || !!data.melody],
        ['image', (data) => !!data.prompt || !!data.style],
        ['karaoke', (data) => !!data.audioTrack && !!data.lyrics],
      ]),
      errorHandlers: new Map([
        ['default', (error) => console.error('Pipeline error:', error)],
      ]),
    });

    // Karaoke generation pipeline
    this.registerPipeline({
      id: 'karaoke-generation',
      name: 'Karaoke Track Generation',
      agents: ['song', 'mixer', 'karaoke'],
      transformers: new Map([
        ['song-mixer', this.transformSongToMixer],
        ['mixer-karaoke', this.transformMixerToKaraoke],
      ]),
      validators: new Map(),
      errorHandlers: new Map(),
    });

    // Recruiter-led growth pipeline
    this.registerPipeline({
      id: 'recruiter-opportunity',
      name: 'Recruiter Opportunity Sourcing',
      agents: ['recruiter'],
      transformers: new Map(),
      validators: new Map([
        [
          'recruiter',
          (data) =>
            Boolean(
              data &&
                (typeof data.title === 'string' ||
                  typeof data?.opportunity?.title === 'string'),
            ),
        ],
      ]),
      errorHandlers: new Map([
        [
          'default',
          (error) => console.error('Recruiter pipeline error:', error),
        ],
      ]),
    });
  }

  private initializeDefaultAgents() {
    if (!this.agents.has('recruiter')) {
      this.registerAgent('recruiter', new RecruiterAgent());
    }
  }

  registerAgent(type: AgentType, handler: AgentHandler) {
    this.agents.set(type, handler);
    this.emit('agent:registered', { type, timestamp: Date.now() });
  }

  registerPipeline(config: PipelineConfig) {
    this.pipelines.set(config.id, config);
    this.emit('pipeline:registered', config);
  }

  async sendMessage(message: AgentMessage): Promise<any> {
    this.messageQueue.push(message);
    this.emit('message:queued', message);

    const targetAgent = this.agents.get(message.target);
    if (!targetAgent) {
      throw new Error(`Agent ${message.target} not found`);
    }

    try {
      const result = await targetAgent.handle(message);
      this.emit('message:processed', { message, result });
      return result;
    } catch (error) {
      this.emit('message:error', { message, error });
      throw error;
    }
  }

  async executePipeline(pipelineId: string, initialData: any, userId?: string): Promise<any> {
    const pipeline = this.pipelines.get(pipelineId);
    if (!pipeline) {
      throw new Error(`Pipeline ${pipelineId} not found`);
    }

    const sessionId = crypto.randomUUID();
    this.processingQueue.add(sessionId);

    let currentData = initialData;
    const results: any[] = [];

    try {
      for (let i = 0; i < pipeline.agents.length; i++) {
        const agent = pipeline.agents[i];
        const nextAgent = pipeline.agents[i + 1];

        // Validate input if validator exists
        const validator = pipeline.validators.get(agent);
        if (validator && !validator(currentData)) {
          throw new Error(`Validation failed for agent ${agent}`);
        }

        // Process through agent
        const message: AgentMessage = {
          id: crypto.randomUUID(),
          source: i > 0 ? pipeline.agents[i - 1] : 'astrology',
          target: agent,
          type: 'pipeline',
          payload: currentData,
          timestamp: Date.now(),
          userId,
          sessionId,
          priority: 'high',
        };

        const result = await this.sendMessage(message);
        results.push({ agent, result });

        // Transform data for next agent if transformer exists
        if (nextAgent) {
          const transformKey = `${agent}-${nextAgent}`;
          const transformer = pipeline.transformers.get(transformKey);
          if (transformer) {
            currentData = await transformer(result, { userId, sessionId });
          } else {
            currentData = result;
          }
        }

        // Emit progress
        this.emit('pipeline:progress', {
          pipelineId,
          sessionId,
          agent,
          progress: ((i + 1) / pipeline.agents.length) * 100,
          currentData,
        });
      }

      this.processingQueue.delete(sessionId);
      this.emit('pipeline:complete', { pipelineId, sessionId, results });

      // Store results in Supabase
      await this.storePipelineResults(pipelineId, sessionId, results, userId);

      return results;
    } catch (error) {
      this.processingQueue.delete(sessionId);
      const errorHandler = pipeline.errorHandlers.get('default');
      if (errorHandler) {
        errorHandler(error as Error, { pipelineId, sessionId });
      }
      throw error;
    }
  }

  private async storePipelineResults(
    pipelineId: string,
    sessionId: string,
    results: any[],
    userId?: string
  ) {
    try {
      const { error } = await supabase
        .from('pipeline_results')
        .insert({
          pipeline_id: pipelineId,
          session_id: sessionId,
          user_id: userId,
          results: results,
          created_at: new Date().toISOString(),
        });

      if (error) throw error;
    } catch (error) {
      console.error('Failed to store pipeline results:', error);
    }
  }

  // Transform functions for pipeline
  private async transformAstrologyToSound(data: any): Promise<any> {
    // Transform astrological data to sound parameters
    return {
      frequency: data.planetaryFrequencies || 432,
      waveform: data.zodiacWaveform || 'sine',
      tempo: data.ascendantTempo || 120,
      key: data.sunSignKey || 'C',
      scale: data.moonSignScale || 'major',
      harmonics: data.aspectHarmonics || [1, 2, 3, 5, 8],
    };
  }

  private async transformSoundToSong(data: any): Promise<any> {
    // Transform sound parameters to song structure
    return {
      melody: data.harmonics?.map((h: number) => ({
        note: h * data.frequency,
        duration: 1000 / data.tempo,
      })),
      chord_progression: this.generateChordProgression(data.key, data.scale),
      lyrics: await this.generateLyricsFromSound(data),
      structure: ['intro', 'verse', 'chorus', 'verse', 'chorus', 'bridge', 'outro'],
      bpm: data.tempo,
    };
  }

  private async transformSongToImage(data: any): Promise<any> {
    // Transform song data to image generation prompt
    const mood = this.analyzeSongMood(data);
    const colors = this.mapMoodToColors(mood);

    return {
      prompt: `Abstract visualization of ${mood} music with ${colors.join(', ')} colors, flowing rhythmic patterns`,
      style: 'abstract',
      colors: colors,
      elements: data.structure,
      animation: data.bpm > 120 ? 'fast' : 'slow',
    };
  }

  private async transformImageToSubscription(data: any): Promise<any> {
    // Package media for subscription delivery
    return {
      contentType: 'media-bundle',
      assets: {
        image: data.imageUrl,
        prompt: data.prompt,
        metadata: data,
      },
      tier: 'premium',
      delivery: 'instant',
    };
  }

  private async transformSubscriptionToKaraoke(data: any): Promise<any> {
    // Generate karaoke tracks from subscription content
    return {
      audioTrack: data.audioUrl,
      lyrics: data.lyrics,
      timing: data.lyricTimings,
      visualStyle: data.style,
      effects: ['reverb', 'echo', 'pitch-correction'],
      outputFormat: 'mp4',
    };
  }

  private async transformSongToMixer(data: any): Promise<any> {
    return {
      tracks: data.melody,
      effects: ['reverb', 'compression'],
      masterVolume: 0.8,
    };
  }

  private async transformMixerToKaraoke(data: any): Promise<any> {
    return {
      audioTrack: data.mixedAudio,
      lyrics: data.lyrics,
      syncData: data.timings,
    };
  }

  private generateChordProgression(key: string, scale: string): string[] {
    const progressions: Record<string, string[]> = {
      major: ['I', 'IV', 'V', 'I'],
      minor: ['i', 'iv', 'V', 'i'],
      blues: ['I7', 'I7', 'I7', 'I7', 'IV7', 'IV7', 'I7', 'I7', 'V7', 'IV7', 'I7', 'V7'],
    };
    return progressions[scale] || progressions.major;
  }

  private async generateLyricsFromSound(data: any): Promise<string> {
    // This would integrate with the lyrics generator
    return `Generated lyrics based on ${data.frequency}Hz frequency and ${data.waveform} waveform`;
  }

  private analyzeSongMood(data: any): string {
    const bpm = data.bpm || 120;
    if (bpm < 80) return 'melancholic';
    if (bpm < 120) return 'peaceful';
    if (bpm < 140) return 'energetic';
    return 'intense';
  }

  private mapMoodToColors(mood: string): string[] {
    const colorMap: Record<string, string[]> = {
      melancholic: ['blue', 'purple', 'gray'],
      peaceful: ['green', 'light blue', 'white'],
      energetic: ['orange', 'yellow', 'red'],
      intense: ['red', 'black', 'electric blue'],
    };
    return colorMap[mood] || ['blue', 'green'];
  }

  // WebSocket management for real-time communication
  connectWebSocket(userId: string, ws: WebSocket) {
    this.activeConnections.set(userId, ws);
    ws.addEventListener('message', (event) => this.handleWebSocketMessage(userId, event));
    ws.addEventListener('close', () => this.activeConnections.delete(userId));
  }

  private handleWebSocketMessage(userId: string, event: MessageEvent) {
    try {
      const message = JSON.parse(event.data);
      this.sendMessage({ ...message, userId });
    } catch (error) {
      console.error('WebSocket message error:', error);
    }
  }

  broadcast(message: any) {
    this.activeConnections.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
      }
    });
  }

  getQueueStatus(): { queue: number; processing: number } {
    return {
      queue: this.messageQueue.length,
      processing: this.processingQueue.size,
    };
  }
}

export interface AgentHandler {
  handle(message: AgentMessage): Promise<any>;
  getCapabilities(): string[];
  getStatus(): 'ready' | 'busy' | 'error';
}

export default AgentOrchestrator;