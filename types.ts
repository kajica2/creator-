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
}

export interface PromptHistoryItem {
    id: string;
    type: PromptType;
    prompt: string;
    timestamp: number;
}

export interface RagSource {
    id: string;
    type: 'file' | 'url';
    name: string;
    content: string;
    mimeType: string;
    status: 'loading' | 'ready' | 'error';
}

export interface User {
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
export type Page = 'Roadmap' | 'Hashtag Manager' | 'AI Story' | 'AI Lyrics' | 'Text-to-Image' | 'Image Edit' | 'Batch Images' | 'Batch Prompts' | 'AI Website' | 'AI Strategy' | 'AI Skill' | 'AI Mutator' | 'AI Concept' | 'Gallery' | 'History' | 'Settings' | 'Subscription' | 'Thinking Mode' | 'Audio Transcriber' | 'Gamification' | 'Persona Templates' | 'Website Manager';

export type GeneratedContentStore = Partial<Record<Page, any>>;

// Persona and Content Storage Types
export interface Persona {
    id: string;
    name: string;
    context: string;
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
