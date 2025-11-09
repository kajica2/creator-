import * as Tone from 'tone';
import { NeuralMelodyPlayer } from '../../../components/audio/NeuralMelodyPlayer';
import {
  BaseAudioAgent,
  AudioAgentType,
  AgentStatus,
  AudioProject,
  AudioAgentCallbacks,
  AudioAgentMessage,
  AudioMessageType,
  AudioMemoryState,
  GeneratedComposition,
  GeneratedSoundEffect,
  VoiceOutput,
  BeatPattern,
  ComposerConfig,
  SoundEffectConfig,
  TextToSpeechRequest,
  MixdownOptions,
  AudioAgentError
} from './types';
import { AudioComposer } from './AudioComposer';
import { SoundEffects } from './SoundEffects';
import { VoiceSynthesizer } from './VoiceSynthesizer';
import { AudioMixer } from './AudioMixer';
import { BeatGenerator } from './BeatGenerator';

export class AudioAgentCoordinator {
  private agents: Map<string, BaseAudioAgent> = new Map();
  private messageQueue: AudioAgentMessage[] = [];
  private memoryState: AudioMemoryState;
  private callbacks: AudioAgentCallbacks;
  private isInitialized: boolean = false;

  // Agent instances
  private composer?: AudioComposer;
  private soundEffects?: SoundEffects;
  private voiceSynthesizer?: VoiceSynthesizer;
  private audioMixer?: AudioMixer;
  private beatGenerator?: BeatGenerator;

  // Integration components
  private neuralMelodyPlayer?: NeuralMelodyPlayer;

  constructor(callbacks: AudioAgentCallbacks = {}) {
    this.callbacks = {
      ...callbacks,
      onAgentStatusChange: this.handleAgentStatusChange.bind(this),
      onCompositionGenerated: this.handleCompositionGenerated.bind(this),
      onEffectProcessed: this.handleEffectProcessed.bind(this),
      onVoiceGenerated: this.handleVoiceGenerated.bind(this),
      onBeatGenerated: this.handleBeatGenerated.bind(this),
      onProjectUpdated: this.handleProjectUpdated.bind(this)
    };

    this.memoryState = {
      projects: {},
      recentCompositions: [],
      userPreferences: {
        defaultFormats: [],
        favoriteStyles: [],
        socialMediaSettings: []
      },
      agentStates: {}
    };
  }

  public async initialize(): Promise<void> {
    try {
      console.log('🎼 Initializing Audio Agent Coordinator...');

      // Initialize Tone.js context
      if (Tone.context.state !== 'running') {
        await Tone.start();
      }

      // Initialize agents in parallel for better performance
      await this.initializeAgents();

      // Set up agent coordination
      this.setupAgentCoordination();

      this.isInitialized = true;
      console.log('🎼 Audio Agent Coordinator initialized successfully');
      console.log(`📊 Agents initialized: ${this.agents.size}`);
    } catch (error) {
      throw new AudioAgentError(
        `Failed to initialize AudioAgentCoordinator: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'coordinator',
        'composer', // fallback type
        'INIT_FAILED'
      );
    }
  }

  private async initializeAgents(): Promise<void> {
    const initPromises: Promise<void>[] = [];

    // Initialize AudioComposer
    this.composer = new AudioComposer(this.callbacks);
    this.agents.set(this.composer.id, this.composer);
    initPromises.push(this.composer.initialize());

    // Initialize SoundEffects
    this.soundEffects = new SoundEffects(this.callbacks);
    this.agents.set(this.soundEffects.id, this.soundEffects);
    initPromises.push(this.soundEffects.initialize());

    // Initialize VoiceSynthesizer
    this.voiceSynthesizer = new VoiceSynthesizer(this.callbacks);
    this.agents.set(this.voiceSynthesizer.id, this.voiceSynthesizer);
    initPromises.push(this.voiceSynthesizer.initialize());

    // Initialize AudioMixer
    this.audioMixer = new AudioMixer(this.callbacks);
    this.agents.set(this.audioMixer.id, this.audioMixer);
    initPromises.push(this.audioMixer.initialize());

    // Initialize BeatGenerator
    this.beatGenerator = new BeatGenerator(this.callbacks);
    this.agents.set(this.beatGenerator.id, this.beatGenerator);
    initPromises.push(this.beatGenerator.initialize());

    // Wait for all agents to initialize
    await Promise.all(initPromises);

    // Initialize NeuralMelodyPlayer integration
    await this.initializeNeuralMelodyIntegration();
  }

  private async initializeNeuralMelodyIntegration(): Promise<void> {
    try {
      this.neuralMelodyPlayer = new NeuralMelodyPlayer(
        {
          temperature: 1.0,
          stepsPerQuarter: 4,
          totalSteps: 128
        },
        this.callbacks
      );

      await this.neuralMelodyPlayer.startAudioContext();
      console.log('🎹 NeuralMelodyPlayer integration initialized');
    } catch (error) {
      console.warn('NeuralMelodyPlayer initialization failed:', error);
    }
  }

  private setupAgentCoordination(): void {
    // Set up message processing
    setInterval(() => {
      this.processMessageQueue();
    }, 100); // Process messages every 100ms

    // Set up periodic state synchronization
    setInterval(() => {
      this.synchronizeAgentStates();
    }, 5000); // Sync every 5 seconds
  }

  // Agent Status Management
  private handleAgentStatusChange(agentId: string, status: AgentStatus): void {
    this.memoryState.agentStates[agentId] = {
      status,
      lastUpdate: new Date()
    };

    // Forward to original callback
    this.callbacks.onAgentStatusChange?.(agentId, status);
  }

  // Composition Workflow
  public async createFullComposition(
    style: string,
    tempo: number = 120,
    includeBeats: boolean = true,
    includeVoice?: { text: string; voice: string }
  ): Promise<AudioProject> {
    if (!this.isInitialized) {
      throw new AudioAgentError('Coordinator not initialized', 'coordinator', 'composer');
    }

    const projectId = `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      console.log(`🎼 Creating full composition: ${style} at ${tempo} BPM`);

      // Step 1: Generate beat pattern if requested
      let beatPattern: BeatPattern | undefined;
      if (includeBeats && this.beatGenerator) {
        beatPattern = await this.beatGenerator.generateBeat(style, tempo);
      }

      // Step 2: Generate main composition
      let composition: GeneratedComposition | undefined;
      if (this.composer) {
        const composerConfig: Partial<ComposerConfig> = {
          style: style as any,
          tempo,
          duration: 32, // 8 bars
          useNeuralGeneration: true
        };
        composition = await this.composer.generateComposition(composerConfig);
      }

      // Step 3: Generate voice if requested
      let voice: VoiceOutput | undefined;
      if (includeVoice && this.voiceSynthesizer) {
        const preset = this.voiceSynthesizer.getPreset(includeVoice.voice) ||
                      this.voiceSynthesizer.getPreset('narrator-female');

        if (preset) {
          const voiceRequest: TextToSpeechRequest = {
            text: includeVoice.text,
            voice: preset,
            format: {
              format: 'wav',
              sampleRate: 44100,
              bitRate: 1411,
              channels: 2,
              quality: 'high'
            }
          };
          voice = await this.voiceSynthesizer.synthesizeSpeech(voiceRequest);
        }
      }

      // Step 4: Create project structure
      const project: AudioProject = {
        id: projectId,
        name: `${style.charAt(0).toUpperCase() + style.slice(1)} Composition`,
        tracks: [],
        masterVolume: 0,
        tempo,
        key: composition?.metadata.key || 'C',
        timeSignature: [4, 4],
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          duration: composition?.metadata.duration || 16,
          tags: [style, `${tempo}bpm`]
        }
      };

      // Add composition tracks
      if (composition) {
        if (composition.tracks.melody) {
          project.tracks.push({
            id: `${projectId}-melody`,
            name: 'Melody',
            type: 'midi',
            volume: -6,
            pan: 0,
            muted: false,
            solo: false,
            effects: [],
            midiData: composition.tracks.melody
          });
        }

        if (composition.tracks.harmony) {
          project.tracks.push({
            id: `${projectId}-harmony`,
            name: 'Harmony',
            type: 'midi',
            volume: -12,
            pan: 0,
            muted: false,
            solo: false,
            effects: [],
            midiData: composition.tracks.harmony
          });
        }

        if (composition.tracks.bass) {
          project.tracks.push({
            id: `${projectId}-bass`,
            name: 'Bass',
            type: 'midi',
            volume: -8,
            pan: 0,
            muted: false,
            solo: false,
            effects: [],
            midiData: composition.tracks.bass
          });
        }
      }

      // Add beat track
      if (beatPattern) {
        project.tracks.push({
          id: `${projectId}-drums`,
          name: 'Drums',
          type: 'generated',
          volume: -3,
          pan: 0,
          muted: false,
          solo: false,
          effects: []
          // beatPattern would be stored in metadata
        });
      }

      // Add voice track
      if (voice) {
        project.tracks.push({
          id: `${projectId}-voice`,
          name: 'Voice',
          type: 'audio',
          volume: -6,
          pan: 0,
          muted: false,
          solo: false,
          effects: [],
          audioData: voice.audioBuffer
        });
      }

      // Store project
      this.memoryState.projects[projectId] = project;

      // Load project into mixer
      if (this.audioMixer) {
        this.audioMixer.loadProject(project);
      }

      console.log(`✅ Created full composition project: ${project.name}`);
      return project;
    } catch (error) {
      throw new AudioAgentError(
        `Full composition creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'coordinator',
        'composer',
        'COMPOSITION_FAILED'
      );
    }
  }

  // Individual agent operations
  public async generateComposition(config: Partial<ComposerConfig>): Promise<GeneratedComposition> {
    if (!this.composer) {
      throw new AudioAgentError('Composer agent not available', 'coordinator', 'composer');
    }
    return this.composer.generateComposition(config);
  }

  public async generateSoundEffect(config: SoundEffectConfig): Promise<GeneratedSoundEffect> {
    if (!this.soundEffects) {
      throw new AudioAgentError('SoundEffects agent not available', 'coordinator', 'sound-effects');
    }
    return this.soundEffects.generateEffect(config);
  }

  public async generateVoice(request: TextToSpeechRequest): Promise<VoiceOutput> {
    if (!this.voiceSynthesizer) {
      throw new AudioAgentError('VoiceSynthesizer agent not available', 'coordinator', 'voice-synthesizer');
    }
    return this.voiceSynthesizer.synthesizeSpeech(request);
  }

  public async generateBeat(
    style: string,
    tempo: number,
    length: number,
    complexity: 'simple' | 'moderate' | 'complex' = 'moderate'
  ): Promise<BeatPattern> {
    if (!this.beatGenerator) {
      throw new AudioAgentError('BeatGenerator agent not available', 'coordinator', 'beat-generator');
    }
    return this.beatGenerator.generateBeat(style, tempo, length, complexity);
  }

  public async mixdownProject(
    project: AudioProject,
    options: MixdownOptions
  ): Promise<ArrayBuffer> {
    if (!this.audioMixer) {
      throw new AudioAgentError('AudioMixer agent not available', 'coordinator', 'audio-mixer');
    }

    // Load project into mixer if not already loaded
    if (this.audioMixer.getCurrentProject()?.id !== project.id) {
      this.audioMixer.loadProject(project);
    }

    return this.audioMixer.startMixdown(options);
  }

  // Message handling
  private handleCompositionGenerated(composition: GeneratedComposition): void {
    this.memoryState.recentCompositions.push(composition);

    // Keep only last 10 compositions
    if (this.memoryState.recentCompositions.length > 10) {
      this.memoryState.recentCompositions.shift();
    }

    this.sendMessage('coordinator', 'all', 'composition_complete', composition);
    this.callbacks.onCompositionGenerated?.(composition);
  }

  private handleEffectProcessed(effect: GeneratedSoundEffect): void {
    this.sendMessage('coordinator', 'all', 'effect_complete', effect);
    this.callbacks.onEffectProcessed?.(effect);
  }

  private handleVoiceGenerated(voice: VoiceOutput): void {
    this.sendMessage('coordinator', 'all', 'voice_complete', voice);
    this.callbacks.onVoiceGenerated?.(voice);
  }

  private handleBeatGenerated(beat: BeatPattern): void {
    this.sendMessage('coordinator', 'all', 'beat_complete', beat);
    this.callbacks.onBeatGenerated?.(beat);
  }

  private handleProjectUpdated(project: AudioProject): void {
    this.memoryState.projects[project.id] = project;
    this.sendMessage('coordinator', 'all', 'project_update', project);
    this.callbacks.onProjectUpdated?.(project);
  }

  private sendMessage(from: string, to: string, type: AudioMessageType, payload: any): void {
    const message: AudioAgentMessage = {
      from,
      to,
      type,
      payload,
      timestamp: new Date(),
      correlationId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };

    this.messageQueue.push(message);
  }

  private processMessageQueue(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message) {
        this.processMessage(message);
      }
    }
  }

  private processMessage(message: AudioAgentMessage): void {
    // Log message for debugging
    console.log(`📨 Agent message: ${message.type} from ${message.from} to ${message.to}`);

    // Handle coordination messages
    switch (message.type) {
      case 'composition_complete':
        // Trigger any follow-up actions
        break;
      case 'project_update':
        // Synchronize project state across agents
        break;
      default:
        // Handle other message types as needed
        break;
    }
  }

  private synchronizeAgentStates(): void {
    // Update memory state with current agent statuses
    for (const [agentId, agent] of this.agents) {
      this.memoryState.agentStates[agentId] = {
        status: agent.getStatus(),
        lastUpdate: new Date()
      };
    }
  }

  // Integration methods
  public async integrateWithNeuralMelody(seedNote: number): Promise<GeneratedComposition> {
    if (!this.composer || !this.neuralMelodyPlayer) {
      throw new AudioAgentError('Required components not available', 'coordinator', 'composer');
    }

    // Use neural melody player to generate initial sequence
    // Then use composer to expand it into a full composition
    const config: Partial<ComposerConfig> = {
      useNeuralGeneration: true,
      style: 'fusion',
      tempo: 120
    };

    return this.composer.generateMelody(seedNote, config as ComposerConfig);
  }

  // State management
  public getMemoryState(): AudioMemoryState {
    return { ...this.memoryState };
  }

  public getProject(projectId: string): AudioProject | undefined {
    return this.memoryState.projects[projectId];
  }

  public getAllProjects(): AudioProject[] {
    return Object.values(this.memoryState.projects);
  }

  public getRecentCompositions(): GeneratedComposition[] {
    return [...this.memoryState.recentCompositions];
  }

  public getAgent<T extends BaseAudioAgent>(type: AudioAgentType): T | undefined {
    for (const agent of this.agents.values()) {
      if (agent.type === type) {
        return agent as T;
      }
    }
    return undefined;
  }

  public getAgentStatuses(): Record<string, AgentStatus> {
    const statuses: Record<string, AgentStatus> = {};
    for (const [agentId, agent] of this.agents) {
      statuses[agentId] = agent.getStatus();
    }
    return statuses;
  }

  public getInitializationStatus(): boolean {
    return this.isInitialized;
  }

  public getAgentCount(): number {
    return this.agents.size;
  }

  // Claude-Flow integration hooks
  public async executeHook(hookName: string, data: any): Promise<void> {
    try {
      // This would integrate with the Claude-Flow hooks system
      console.log(`🪝 Executing hook: ${hookName}`, data);

      switch (hookName) {
        case 'pre-generation':
          await this.handlePreGeneration(data);
          break;
        case 'post-generation':
          await this.handlePostGeneration(data);
          break;
        case 'project-save':
          await this.handleProjectSave(data);
          break;
        default:
          console.warn(`Unknown hook: ${hookName}`);
      }
    } catch (error) {
      console.error(`Hook execution failed: ${hookName}`, error);
    }
  }

  private async handlePreGeneration(data: any): Promise<void> {
    // Pre-generation setup and validation
    console.log('🔄 Pre-generation hook executed');
  }

  private async handlePostGeneration(data: any): Promise<void> {
    // Post-generation processing and storage
    console.log('✅ Post-generation hook executed');
  }

  private async handleProjectSave(data: any): Promise<void> {
    // Project saving and metadata update
    console.log('💾 Project save hook executed');
  }

  public dispose(): void {
    console.log('🧹 Disposing Audio Agent Coordinator...');

    // Stop message processing
    this.messageQueue = [];

    // Dispose all agents
    for (const agent of this.agents.values()) {
      try {
        agent.dispose();
      } catch (error) {
        console.warn('Error disposing agent:', error);
      }
    }

    // Dispose neural melody player
    if (this.neuralMelodyPlayer) {
      this.neuralMelodyPlayer.dispose();
    }

    this.agents.clear();
    this.memoryState = {
      projects: {},
      recentCompositions: [],
      userPreferences: {
        defaultFormats: [],
        favoriteStyles: [],
        socialMediaSettings: []
      },
      agentStates: {}
    };

    this.isInitialized = false;
    console.log('🧹 Audio Agent Coordinator disposed');
  }
}