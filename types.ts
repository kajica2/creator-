// biome-ignore-file lint/nursery/preferLogicalPropertyNames -- API payloads use width/height fields
// FIX: Removed an incorrect import of 'HasagSize'. The enum is defined below in this file, and the import was causing a name collision.
export enum HashtagSize {
  Mega = 'Mega',
  Large = 'Large',
  Medium = 'Medium',
  Small = 'Small',
  Micro = 'Micro',
}

export interface Hashtag {
  name: string;
  count: string;
  size: HashtagSize;
  description?: string;
  tags?: string[]; // ['style', 'tool', 'audience']
  popularityScore?: number;
  relatedHashtags?: string[];
  // Hashtag cloud visualization fields
  frequency?: number;
  trendingScore?: number;
  cloudPositionX?: number;
  cloudPositionY?: number;
  usageCount?: number;
  lastUsedAt?: string;
  trendingVelocity?: number;
}

export interface HashtagCategory {
  category: string;
  hashtags: Hashtag[];
}

export interface ReadySet {
    title: string;
    hashtags: string[];
    id: string;
    category: string;
    description?: string;
    size: HashtagSize;
    isFavorite: boolean;
    createdAt: number;
    updatedAt: number;
}

export interface UserSet {
    id: string;
    name: string;
    category: string;
    hashtags: string[];
    size: HashtagSize;
    isFavorite: boolean;
    isCustom: boolean;
    createdAt: number;
    updatedAt: number;
}

export enum PromptType {
    AIStory = 'AI Story',
    SunoLyrics = 'Suno Lyrics',
    WebsiteStrategy = 'Website Strategy',
    AISkill = 'AI Skill Guide',
    TensorMutation = 'Tensor Mutation',
    AIConcept = 'AI Concept',
    TextToImage = 'Text-to-Image',
    ImageEdit = 'Image Edit',
    BatchImages = 'Batch Images',
    BatchImagePrompts = 'Batch Image Prompts',
    AIWebsite = 'AI Website',
    ThinkingMode = 'Thinking Mode',
    AudioTranscriber = 'Audio Transcriber',
    LiveMixer = 'Live Mixer',
}

export interface PromptHistoryItem {
    id: string;
    type: PromptType;
    prompt: string;
    timestamp: number;
}

export type RagSourceType = 'file' | 'url' | 'batch_import';

export interface RagSourceMetadata {
    summary?: string;
    tags?: string[];
    companyUrl?: string;
    detectedText?: string[];
    detectedLogos?: string[];
    detectedObjects?: string[];
    dominantColors?: string[];
    sourceType?: 'image' | 'video' | 'audio' | 'text' | 'other';
    originalFilename?: string;
    sizeBytes?: number;
    ['width']?: number;
    ['height']?: number;
    durationMs?: number;
    checksum?: string;
    assetId?: string;
    embeddingId?: string;
    mimeType?: string;
    assetCategory?: 'image' | 'video' | 'audio' | 'document' | 'other';
    storageBucket?: string;
    storagePath?: string;
    publicUrl?: string;
    isFavorite?: boolean;
    lastAccessedAt?: string;
    extra?: Record<string, any>;
}

export interface RagSource {
    id: string;
    type: RagSourceType;
    name: string;
    content: string;
    mimeType: string;
    status: 'loading' | 'ready' | 'error';
    metadata?: RagSourceMetadata;
    dataUrl?: string;
}

export interface User {
    id: string;
    name: string;
    email: string;
    picture: string;
    accessToken: string;
}

export type SubscriptionPlan = 'free' | 'pro' | 'studio';

export interface Plan {
    id: SubscriptionPlan;
    name: string;
    price: string;
    priceDescription: string;
    credits: string;
    features: string[];
    isCurrent: boolean;
    cta: string;
    highlight?: boolean;
}


// AI Generator Response Types
export interface AIStoryResponse {
    title: string;
    story: string;
}

export interface SunoLyricsResponse {
    title: string;
    lyrics: string;
}

export interface WebsiteStrategyResponse {
    mainGoal: string;
    keySections: {
        name: string;
        contentIdeas: string[];
    }[];
    toneAndStyle: string;
    callToAction: {
        text: string;
        description: string;
    };
    targetAudienceEngagement: {
        target: string;
        strategy: string;
    }[];
}

export interface AISkillResponse {
    skillName: string;
    description: string;
    coreConcepts: string[];
    learningPath: {
        step: string;
        description: string;
    }[];
    projectIdeas: string[];
}

export interface TensorMutationResponse {
    initialConcept: string;
    mutatedConcept: string;
    dimensions: {
        dimensionName: string;
        ideas: string[];
    }[];
}

export interface AIConceptResponse {
    concept: string;
    description: string;
    keywords: string[];
    visualPrompts: string[];
}

export interface AIWebsiteResponse {
    htmlContent: string;
}

// App-level types
export type Page = 'Landing' | 'Onboarding' | 'Roadmap' | 'Hashtag Manager' | 'AI Story' | 'AI Lyrics' | 'Text-to-Image' | 'Image Edit' | 'Batch Images' | 'Batch Prompts' | 'AI Website' | 'AI Strategy' | 'AI Skill' | 'AI Mutator' | 'AI Concept' | 'Gallery' | 'History' | 'Settings' | 'Subscription' | 'Thinking Mode' | 'Audio Transcriber' | 'Audio Agents' | 'Live Mixer' | 'Synaptic Symphony' | 'Gamification' | 'Persona Templates' | 'Website Manager' | 'Sentry Navigation Cloud' | 'Media Library' | 'Documentation';

export type GeneratedContentStore = Partial<Record<Page, any>>;

// Persona and Content Storage Types
export interface Persona {
    id: string;
    name: string;
    context: string;
    isDefault: boolean;
    createdAt: number;
    updatedAt: number;
    contentCount: number;
}

export interface StoredContentItem {
    id: string;
    type: PromptType;
    content: any;
    personaId: string;
    personaName: string;
    tool: Page;
    timestamp: number;
    hashtags: string[];
    metadata: {
        prompt?: string;
        model?: string;
        parameters?: Record<string, any>;
    };
}

export interface ContentStorage {
    personas: Persona[];
    content: StoredContentItem[];
    defaultPersonaId: string;
}

// Gamification Types
export interface UserProgress {
    xp: number;
    level: number;
    achievements: Achievement[];
    streak: number;
    lastActivityDate: string;
    totalGenerations: number;
    toolUsage: Record<string, number>;
    completedChallenges: string[];
}

export interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: string;
    category: AchievementCategory;
    tier: 'bronze' | 'silver' | 'gold' | 'platinum';
    progress: number;
    target: number;
    unlocked: boolean;
    unlockedAt?: number;
    xpReward: number;
    creditReward?: number;
}

export type AchievementCategory =
    | 'tool_explorer'
    | 'content_creator'
    | 'hashtag_master'
    | 'consistency'
    | 'creative_mastery'
    | 'challenges';

export interface DailyChallenge {
    id: string;
    title: string;
    description: string;
    type: 'generation' | 'hashtag' | 'tool';
    targetTool?: Page;
    targetHashtagCategory?: string;
    xpReward: number;
    creditReward: number;
    completed: boolean;
    date: string;
}

export interface LevelReward {
    level: number;
    credits: number;
    unlocks: string;
    description: string;
}

// Audio and Neural Melody Types
export interface NoteSequence {
  notes: AudioNote[];
  totalTime: number;
  ticksPerQuarter: number;
}

export interface AudioNote {
  pitch: number;
  startTime: number;
  endTime: number;
  velocity: number;
  program?: number;
  isDrum?: boolean;
}

export interface NeuralMelodyConfig {
  temperature: number;
  stepsPerQuarter: number;
  totalSteps: number;
  minNote: number;
  maxNote: number;
  modelUrl?: string;
}

export interface AudioPlayerState {
  isPlaying: boolean;
  isLoading: boolean;
  isModelLoaded: boolean;
  currentSequence: NoteSequence | null;
  error: string | null;
  sustainMode: boolean;
  activeNotes: Set<number>;
}

// Live Mixer and Streaming Types
export interface LiveMixerState {
  isLive: boolean;
  isRecording: boolean;
  inputDevices: MediaDeviceInfo[];
  outputDevices: MediaDeviceInfo[];
  activeStreams: StreamingPlatform[];
  masterVolume: number;
  channels: MixerChannel[];
  effects: EffectChain[];
  error: string | null;
}

export interface MixerChannel {
  id: string;
  name: string;
  type: 'audio' | 'video' | 'camera' | 'screen' | 'neural';
  source: MediaStream | null;
  volume: number;
  muted: boolean;
  solo: boolean;
  effects: Effect[];
  isActive: boolean;
  deviceId?: string;
}

export interface Effect {
  id: string;
  type: EffectType;
  name: string;
  enabled: boolean;
  parameters: Record<string, number>;
  wetness: number; // 0-1 mix level
}

export type EffectType =
  | 'reverb'
  | 'delay'
  | 'chorus'
  | 'distortion'
  | 'filter'
  | 'compressor'
  | 'equalizer'
  | 'autotune'
  | 'noise_gate'
  | 'limiter'
  | 'bitcrusher'
  | 'granular';

export interface EffectChain {
  id: string;
  name: string;
  channelId: string;
  effects: Effect[];
  bypass: boolean;
}

export interface StreamingPlatform {
  id: string;
  name: 'twitch' | 'youtube' | 'instagram' | 'facebook' | 'custom';
  enabled: boolean;
  streamKey: string;
  streamUrl: string;
  isLive: boolean;
  viewerCount?: number;
  bitrate: number;
  resolution: VideoResolution;
  status: 'connecting' | 'live' | 'error' | 'offline';
  error?: string;
}

export interface VideoResolution {
  ['width']: number;
  ['height']: number;
  fps: number;
}

export interface RecordingSession {
  id: string;
  name: string;
  startTime: number;
  endTime?: number;
  duration: number;
  format: 'webm' | 'mp4' | 'wav' | 'mp3';
  quality: 'low' | 'medium' | 'high' | 'lossless';
  size: number; // bytes
  filePath: string;
  metadata: {
    sampleRate: number;
    channels: number;
    bitrate: number;
    resolution?: VideoResolution;
  };
  status: 'recording' | 'processing' | 'completed' | 'error';
}

export interface WebRTCConnection {
  id: string;
  peerId: string;
  connection: RTCPeerConnection;
  dataChannel: RTCDataChannel;
  localStream: MediaStream;
  remoteStream: MediaStream;
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  latency: number;
}

export interface LivePerformanceConfig {
  bufferSize: number; // samples
  sampleRate: number;
  channels: number;
  latency: 'ultralow' | 'low' | 'medium' | 'high';
  enableNeuralProcessing: boolean;
  enableRealTimeEffects: boolean;
  maxSimultaneousStreams: number;
  recordingFormat: 'webm' | 'mp4' | 'wav';
}

export interface AudioProcessingNode {
  id: string;
  type: 'input' | 'effect' | 'mixer' | 'output' | 'analysis';
  node: AudioNode;
  parameters: AudioParam[];
  connections: string[]; // IDs of connected nodes
  bypassed: boolean;
}

export interface VisualizationData {
  frequencyData: Uint8Array;
  timeDomainData: Uint8Array;
  waveformData: Float32Array;
  peakLevels: number[];
  rmsLevels: number[];
  spectralCentroid: number;
  spectralRolloff: number;
}

export interface LiveMixerMessage {
  type: 'volume' | 'mute' | 'solo' | 'effect' | 'stream' | 'record' | 'sync';
  channelId?: string;
  data: any;
  timestamp: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

// Sentry Navigation Cloud Types
export interface SentryNavigationItem {
  id: string;
  name: string;
  category: SentryNavigationCategory;
  subcategory?: string;
  description: string;
  url: string;
  popularityScore: number;
  usageFrequency: number;
  cloudPositionX?: number;
  cloudPositionY?: number;
  cloudSize: number;
  colorCode: string;
  isFeatured: boolean;
  isNew: boolean;
  categoryDisplayName: string;
  categoryIcon: string;
  usageToday: number;
  usageWeek: number;
  calculatedSize: number;
}

export type SentryNavigationCategory = 'platform' | 'solutions' | 'about' | 'help';

export interface SentryNavigationCategoryInfo {
  name: SentryNavigationCategory;
  displayName: string;
  colorCode: string;
  description: string;
  icon: string;
  displayOrder: number;
}

export interface SentryNavigationCloudProps {
  category?: SentryNavigationCategory;
  featuredOnly?: boolean;
  onItemClick?: (item: SentryNavigationItem) => void;
  onItemHover?: (item: SentryNavigationItem | null) => void;
  maxItems?: number;
  width?: number;
  height?: number;
  showCategories?: boolean;
  interactive?: boolean;
}

export interface SentryNavigationUsage {
  id: string;
  navigationItemId: string;
  userSession: string;
  action: 'view' | 'click' | 'hover';
  context?: string;
  createdAt: string;
}

// Page navigation types
export type Page =
  | 'Onboarding'
  | 'Hashtag Manager'
  | 'AI Story'
  | 'AI Lyrics'
  | 'AI Strategy'
  | 'AI Skill'
  | 'AI Mutator'
  | 'AI Concept'
  | 'Text-to-Image'
  | 'Image Edit'
  | 'Batch Images'
  | 'Batch Prompts'
  | 'AI Website'
  | 'Thinking Mode'
  | 'Audio Transcriber'
  | 'Audio Agents'
  | 'Synaptic Symphony'
  | 'Sentry Navigation Cloud'
  | 'Gallery'
  | 'App Gallery'
  | 'Google Developer Console'
  | 'Markdown File Reader'
  | 'Media Library'
  | 'Documentation'
  | 'History'
  | 'Settings'
  | 'Subscription'
  | 'Roadmap'
  | 'Gamification';
