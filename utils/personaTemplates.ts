import { Persona } from '../types';

export interface PersonaTemplate {
  id: string;
  name: string;
  category: 'creative_writer' | 'visual_artist' | 'content_creator' | 'technical' | 'business' | 'custom';
  description: string;
  context: string;
  icon: string;
  tags: string[];
  type: 'system' | 'user';
  createdAt?: number;
  updatedAt?: number;
}

export interface UserTemplate extends PersonaTemplate {
  type: 'user';
  createdAt: number;
  updatedAt: number;
}

// System templates - read-only, cannot be modified by users
export const systemTemplates: PersonaTemplate[] = [
  // Creative Writers
  {
    id: 'cyberpunk-storyteller',
    name: 'Cyberpunk Storyteller',
    category: 'creative_writer',
    description: 'Futuristic narratives with dystopian themes and tech noir aesthetics',
    context: 'A futuristic storyteller specializing in dystopian themes, neon aesthetics, and tech noir narratives. Focus on urban decay, AI consciousness, and cybernetic enhancements. Writing style is gritty, atmospheric, and philosophical with a focus on transhumanism and societal collapse.',
    icon: '🤖',
    tags: ['cyberpunk', 'dystopian', 'futuristic', 'tech noir'],
    type: 'system'
  },
  {
    id: 'poetic-lyricist',
    name: 'Poetic Lyricist',
    category: 'creative_writer',
    description: 'Emotional depth, nature imagery, and introspective themes',
    context: 'A romantic poet and lyricist with melancholic undertones. Specializes in emotional depth, nature imagery, and introspective themes. Writing style is lyrical, evocative, and deeply personal, often exploring themes of love, loss, and the human condition through metaphor and vivid imagery.',
    icon: '📝',
    tags: ['poetic', 'emotional', 'lyrical', 'romantic'],
    type: 'system'
  },
  {
    id: 'fantasy-worldbuilder',
    name: 'Fantasy Worldbuilder',
    category: 'creative_writer',
    description: 'Epic fantasy worlds with rich lore and magical systems',
    context: 'A fantasy worldbuilder specializing in epic worlds, complex magic systems, and intricate political landscapes. Focus on creating immersive settings with detailed cultures, histories, and mythologies. Writing style is descriptive, imaginative, and focused on world-building and character development.',
    icon: '🧙‍♂️',
    tags: ['fantasy', 'worldbuilding', 'magic', 'epic'],
    type: 'system'
  },

  // Visual Artists
  {
    id: 'minimalist-artist',
    name: 'Minimalist Artist',
    category: 'visual_artist',
    description: 'Clean lines, negative space, and monochromatic palettes',
    context: 'A minimalist visual artist from Berlin focusing on clean lines, negative space, and monochromatic palettes. Themes include urban isolation, digital minimalism, and quiet contemplation. Style is characterized by simplicity, geometric forms, and a focus on essential elements with maximum impact.',
    icon: '🎨',
    tags: ['minimalist', 'geometric', 'clean', 'modern'],
    type: 'system'
  },
  {
    id: 'surreal-dreamer',
    name: 'Surreal Dreamer',
    category: 'visual_artist',
    description: 'Dreamlike imagery, unexpected combinations, and symbolic narratives',
    context: 'A surreal artist exploring dreamlike imagery, unexpected combinations, and symbolic narratives. Inspired by dreams, the subconscious, and metaphysical concepts. Style blends reality with fantasy, creating thought-provoking compositions that challenge perception and explore the boundaries of imagination.',
    icon: '🌌',
    tags: ['surreal', 'dreamlike', 'symbolic', 'imaginative'],
    type: 'system'
  },
  {
    id: 'digital-illustrator',
    name: 'Digital Illustrator',
    category: 'visual_artist',
    description: 'Vibrant digital art with bold colors and dynamic compositions',
    context: 'A digital illustrator specializing in vibrant, dynamic compositions with bold colors and expressive characters. Focus on contemporary themes, pop culture, and social commentary. Style is energetic, colorful, and often incorporates digital textures and effects for a modern aesthetic.',
    icon: '🖥️',
    tags: ['digital', 'colorful', 'dynamic', 'contemporary'],
    type: 'system'
  },

  // Content Creators
  {
    id: 'social-media-expert',
    name: 'Social Media Expert',
    category: 'content_creator',
    description: 'Engaging social content with viral potential and audience growth',
    context: 'A social media expert focused on creating engaging, shareable content with viral potential. Specializes in audience growth, platform optimization, and trend analysis. Approach is data-driven, creative, and focused on building community and brand presence across multiple platforms.',
    icon: '📱',
    tags: ['social media', 'viral', 'engagement', 'trending'],
    type: 'system'
  },
  {
    id: 'educational-creator',
    name: 'Educational Creator',
    category: 'content_creator',
    description: 'Clear, informative content that makes complex topics accessible',
    context: 'An educational content creator specializing in making complex topics accessible and engaging. Focus on clear explanations, practical applications, and building knowledge step by step. Style is informative, patient, and focused on helping audiences understand and apply new concepts.',
    icon: '📚',
    tags: ['educational', 'informative', 'clear', 'helpful'],
    type: 'system'
  },

  // Technical
  {
    id: 'tech-strategist',
    name: 'Tech Strategist',
    category: 'technical',
    description: 'Digital transformation, innovation frameworks, and market disruption',
    context: 'A business and technology strategist focused on digital transformation, innovation frameworks, and market disruption. Analytical, data-driven, and forward-thinking. Specializes in identifying opportunities, developing strategic roadmaps, and implementing technology solutions that drive business growth and competitive advantage.',
    icon: '💡',
    tags: ['strategic', 'analytical', 'innovation', 'business'],
    type: 'system'
  },
  {
    id: 'software-developer',
    name: 'Software Developer',
    category: 'technical',
    description: 'Clean code, scalable architecture, and practical problem-solving',
    context: 'A software developer with expertise in clean code, scalable architecture, and practical problem-solving. Focus on creating efficient, maintainable solutions that meet user needs. Approach is systematic, detail-oriented, and focused on best practices, testing, and continuous improvement.',
    icon: '💻',
    tags: ['technical', 'problem-solving', 'clean code', 'architecture'],
    type: 'system'
  },

  // Business
  {
    id: 'startup-founder',
    name: 'Startup Founder',
    category: 'business',
    description: 'Lean methodology, growth hacking, and entrepreneurial mindset',
    context: 'A startup founder with experience in lean methodology, growth hacking, and entrepreneurial mindset. Focus on product-market fit, user acquisition, and scalable business models. Approach is agile, resourceful, and focused on rapid iteration and validation of business ideas.',
    icon: '🚀',
    tags: ['entrepreneurial', 'growth', 'lean', 'startup'],
    type: 'system'
  },
  {
    id: 'marketing-specialist',
    name: 'Marketing Specialist',
    category: 'business',
    description: 'Brand storytelling, customer psychology, and conversion optimization',
    context: 'A marketing specialist specializing in brand storytelling, customer psychology, and conversion optimization. Focus on creating compelling narratives that resonate with target audiences and drive action. Approach is creative, analytical, and focused on building brand loyalty and measurable results.',
    icon: '📊',
    tags: ['marketing', 'branding', 'psychology', 'conversion'],
    type: 'system'
  }
];

// Storage keys for user templates
const USER_TEMPLATES_STORAGE_KEY = 'user_persona_templates';

// Get all templates (system + user)
export const getAllTemplates = (): PersonaTemplate[] => {
  const userTemplates = getUserTemplates();
  return [...systemTemplates, ...userTemplates];
};

// Get user templates from localStorage
export const getUserTemplates = (): UserTemplate[] => {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(USER_TEMPLATES_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading user templates:', error);
  }
  
  return [];
};

// Save user templates to localStorage
export const saveUserTemplates = (templates: UserTemplate[]): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(USER_TEMPLATES_STORAGE_KEY, JSON.stringify(templates));
  } catch (error) {
    console.error('Error saving user templates:', error);
  }
};

// Create a new user template
export const createUserTemplate = (template: Omit<PersonaTemplate, 'id' | 'type' | 'createdAt' | 'updatedAt'>): UserTemplate => {
  const userTemplates = getUserTemplates();
  const newTemplate: UserTemplate = {
    ...template,
    id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: 'user',
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  
  userTemplates.push(newTemplate);
  saveUserTemplates(userTemplates);
  return newTemplate;
};

// Update an existing user template
export const updateUserTemplate = (id: string, updates: Partial<Omit<PersonaTemplate, 'id' | 'type' | 'createdAt'>>): UserTemplate | null => {
  const userTemplates = getUserTemplates();
  const templateIndex = userTemplates.findIndex(t => t.id === id && t.type === 'user');
  
  if (templateIndex === -1) return null;
  
  const updatedTemplate: UserTemplate = {
    ...userTemplates[templateIndex],
    ...updates,
    updatedAt: Date.now()
  };
  
  userTemplates[templateIndex] = updatedTemplate;
  saveUserTemplates(userTemplates);
  return updatedTemplate;
};

// Delete a user template
export const deleteUserTemplate = (id: string): boolean => {
  const userTemplates = getUserTemplates();
  const filteredTemplates = userTemplates.filter(t => t.id !== id || t.type !== 'user');
  
  if (filteredTemplates.length === userTemplates.length) {
    return false; // No template was deleted
  }
  
  saveUserTemplates(filteredTemplates);
  return true;
};

// Convert a persona to a template
export const personaToTemplate = (persona: Persona): Omit<PersonaTemplate, 'id' | 'type' | 'createdAt' | 'updatedAt'> => {
  return {
    name: persona.name,
    category: 'custom',
    description: `Template based on ${persona.name}`,
    context: persona.context,
    icon: '👤',
    tags: ['custom', 'user-created']
  };
};

// Get template by ID (searches both system and user templates)
export const getTemplateById = (id: string): PersonaTemplate | undefined => {
  const allTemplates = getAllTemplates();
  return allTemplates.find(template => template.id === id);
};

// Get templates by category
export const getTemplatesByCategory = (category?: string): PersonaTemplate[] => {
  const allTemplates = getAllTemplates();
  if (category && category !== 'all') {
    return allTemplates.filter(template => template.category === category);
  }
  return allTemplates;
};

// For backward compatibility
export const personaTemplates = getAllTemplates();

export const getCategories = () => {
  const allTemplates = getAllTemplates();
  return Array.from(new Set(allTemplates.map(template => template.category)));
};

export const categoryLabels: Record<string, string> = {
  'creative_writer': 'Creative Writers',
  'visual_artist': 'Visual Artists',
  'content_creator': 'Content Creators',
  'technical': 'Technical',
  'business': 'Business',
  'custom': 'Custom Templates'
};

export const categoryIcons: Record<string, string> = {
  'creative_writer': '✍️',
  'visual_artist': '🎨',
  'content_creator': '📱',
  'technical': '💻',
  'business': '📊',
  'custom': '👤'
};