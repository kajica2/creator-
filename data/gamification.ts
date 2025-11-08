import { Achievement, DailyChallenge, LevelReward, Page } from '../types';

// XP rewards for different AI generators
export const XP_REWARDS: Record<Page, number> = {
  'Hashtag Manager': 0,
  'AI Story': 15,
  'AI Lyrics': 12,
  'AI Strategy': 18,
  'AI Skill': 16,
  'AI Mutator': 20,
  'AI Concept': 14,
  'Text-to-Image': 10,
  'Image Edit': 12,
  'Batch Images': 25,
  'Batch Prompts': 15,
  'AI Website': 25,
  'Thinking Mode': 20,
  'Audio Transcriber': 12,
  'Gallery': 0,
  'History': 0,
  'Settings': 0,
  'Subscription': 0,
  'Roadmap': 0,
  'Gamification': 0,
  'Persona Templates': 5,
  'Website Manager': 0
};

// Level rewards system
export const LEVEL_REWARDS: LevelReward[] = [
  { level: 1, credits: 5, unlocks: 'Starter Badge', description: 'Welcome to the creative journey!' },
  { level: 2, credits: 10, unlocks: 'Basic Hashtag Set', description: 'Unlock additional hashtag categories' },
  { level: 3, credits: 15, unlocks: 'XP Boost (1.1x)', description: 'Earn 10% more XP for 24 hours' },
  { level: 5, credits: 25, unlocks: 'Advanced AI Models', description: 'Access to premium AI generators' },
  { level: 10, credits: 50, unlocks: 'Creative Master Badge', description: 'Proven creative expertise' },
  { level: 15, credits: 75, unlocks: 'Custom Persona Slot', description: 'Save custom AI personas' },
  { level: 20, credits: 100, unlocks: 'Legendary Creator', description: 'Top-tier creative status' }
];

// Achievement definitions
export const ACHIEVEMENTS: Achievement[] = [
  // Tool Explorer achievements
  {
    id: 'tool_explorer_bronze',
    name: 'Tool Explorer',
    description: 'Use 3 different AI generators',
    icon: '🛠️',
    category: 'tool_explorer',
    tier: 'bronze',
    progress: 0,
    target: 3,
    unlocked: false,
    xpReward: 50,
    creditReward: 5
  },
  {
    id: 'tool_explorer_silver',
    name: 'Tool Master',
    description: 'Use 8 different AI generators',
    icon: '⚙️',
    category: 'tool_explorer',
    tier: 'silver',
    progress: 0,
    target: 8,
    unlocked: false,
    xpReward: 150,
    creditReward: 15
  },
  {
    id: 'tool_explorer_gold',
    name: 'Tool Virtuoso',
    description: 'Use all AI generators',
    icon: '🎛️',
    category: 'tool_explorer',
    tier: 'gold',
    progress: 0,
    target: 12,
    unlocked: false,
    xpReward: 300,
    creditReward: 30
  },

  // Content Creator achievements
  {
    id: 'content_creator_bronze',
    name: 'Content Creator',
    description: 'Generate 10 pieces of content',
    icon: '📝',
    category: 'content_creator',
    tier: 'bronze',
    progress: 0,
    target: 10,
    unlocked: false,
    xpReward: 75,
    creditReward: 8
  },
  {
    id: 'content_creator_silver',
    name: 'Prolific Creator',
    description: 'Generate 50 pieces of content',
    icon: '📚',
    category: 'content_creator',
    tier: 'silver',
    progress: 0,
    target: 50,
    unlocked: false,
    xpReward: 200,
    creditReward: 20
  },
  {
    id: 'content_creator_gold',
    name: 'Creative Powerhouse',
    description: 'Generate 200 pieces of content',
    icon: '🚀',
    category: 'content_creator',
    tier: 'gold',
    progress: 0,
    target: 200,
    unlocked: false,
    xpReward: 500,
    creditReward: 50
  },

  // Consistency achievements
  {
    id: 'streak_3',
    name: 'Consistent Creator',
    description: '3-day usage streak',
    icon: '🔥',
    category: 'consistency',
    tier: 'bronze',
    progress: 0,
    target: 3,
    unlocked: false,
    xpReward: 30,
    creditReward: 5
  },
  {
    id: 'streak_7',
    name: 'Dedicated Artist',
    description: '7-day usage streak',
    icon: '💪',
    category: 'consistency',
    tier: 'silver',
    progress: 0,
    target: 7,
    unlocked: false,
    xpReward: 100,
    creditReward: 15
  },
  {
    id: 'streak_30',
    name: 'Unstoppable Creator',
    description: '30-day usage streak',
    icon: '🌟',
    category: 'consistency',
    tier: 'gold',
    progress: 0,
    target: 30,
    unlocked: false,
    xpReward: 400,
    creditReward: 40
  },

  // Hashtag Master achievements
  {
    id: 'hashtag_explorer',
    name: 'Hashtag Explorer',
    description: 'Use hashtags from 3 different categories',
    icon: '🏷️',
    category: 'hashtag_master',
    tier: 'bronze',
    progress: 0,
    target: 3,
    unlocked: false,
    xpReward: 40,
    creditReward: 5
  },
  {
    id: 'hashtag_master',
    name: 'Hashtag Master',
    description: 'Use hashtags from all categories',
    icon: '🎯',
    category: 'hashtag_master',
    tier: 'silver',
    progress: 0,
    target: 4,
    unlocked: false,
    xpReward: 120,
    creditReward: 12
  }
];

// Daily challenges (rotating set)
export const DAILY_CHALLENGES: DailyChallenge[] = [
  {
    id: 'cyberpunk_monday',
    title: 'Cyberpunk Storyteller',
    description: 'Create a cyberpunk-themed story using AI Story generator',
    type: 'tool',
    targetTool: 'AI Story',
    xpReward: 50,
    creditReward: 10,
    completed: false,
    date: new Date().toISOString().split('T')[0]
  },
  {
    id: 'ambient_tuesday',
    title: 'Ambient Lyricist',
    description: 'Generate ambient music lyrics using AI Lyrics generator',
    type: 'tool',
    targetTool: 'AI Lyrics',
    xpReward: 40,
    creditReward: 8,
    completed: false,
    date: new Date().toISOString().split('T')[0]
  },
  {
    id: 'strategy_wednesday',
    title: 'Strategic Thinker',
    description: 'Create a website strategy using AI Strategy generator',
    type: 'tool',
    targetTool: 'AI Strategy',
    xpReward: 60,
    creditReward: 12,
    completed: false,
    date: new Date().toISOString().split('T')[0]
  },
  {
    id: 'visual_thursday',
    title: 'Visual Creator',
    description: 'Generate an image using Text-to-Image generator',
    type: 'tool',
    targetTool: 'Text-to-Image',
    xpReward: 30,
    creditReward: 6,
    completed: false,
    date: new Date().toISOString().split('T')[0]
  },
  {
    id: 'skill_friday',
    title: 'Skill Developer',
    description: 'Learn a new skill using AI Skill generator',
    type: 'tool',
    targetTool: 'AI Skill',
    xpReward: 45,
    creditReward: 9,
    completed: false,
    date: new Date().toISOString().split('T')[0]
  },
  {
    id: 'concept_weekend',
    title: 'Concept Explorer',
    description: 'Generate a creative concept using AI Concept generator',
    type: 'tool',
    targetTool: 'AI Concept',
    xpReward: 35,
    creditReward: 7,
    completed: false,
    date: new Date().toISOString().split('T')[0]
  }
];

// Utility functions
export const calculateLevel = (xp: number): number => {
  return Math.floor(xp / 100) + 1;
};

export const getXPForNextLevel = (currentXP: number): number => {
  const currentLevel = calculateLevel(currentXP);
  return currentLevel * 100 - currentXP;
};

export const getCurrentLevelReward = (level: number): LevelReward | undefined => {
  return LEVEL_REWARDS.find(reward => reward.level === level);
};

export const getRandomDailyChallenge = (): DailyChallenge => {
  const today = new Date().toISOString().split('T')[0];
  const dayOfWeek = new Date().getDay();
  return {
    ...DAILY_CHALLENGES[dayOfWeek],
    date: today,
    completed: false
  };
};