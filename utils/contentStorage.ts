import { ContentStorage, Persona, StoredContentItem, Page, PromptType } from '../types';

const DEFAULT_PERSONA: Persona = {
  id: 'default',
  name: 'Default Persona',
  context: '',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  contentCount: 0
};

const defaultContentStorage: ContentStorage = {
  personas: [DEFAULT_PERSONA],
  content: [],
  defaultPersonaId: 'default'
};

// Initialize content storage
export const initializeContentStorage = (): ContentStorage => {
  try {
    const savedStorage = localStorage.getItem('contentStorage');
    if (savedStorage) {
      return JSON.parse(savedStorage);
    }
  } catch (error) {
    console.error("Could not load content storage from localStorage", error);
  }
  return defaultContentStorage;
};

// Save content storage to localStorage
export const saveContentStorage = (storage: ContentStorage): void => {
  try {
    localStorage.setItem('contentStorage', JSON.stringify(storage));
  } catch (error) {
    console.error("Could not save content storage to localStorage", error);
  }
};

// Add generated content with persona
export const addContent = (
  storage: ContentStorage,
  content: any,
  tool: Page,
  type: PromptType,
  personaId: string,
  personaName: string,
  hashtags: string[] = [],
  metadata: Record<string, any> = {}
): ContentStorage => {
  const newContentItem: StoredContentItem = {
    id: crypto.randomUUID(),
    type,
    content,
    personaId,
    personaName,
    tool,
    timestamp: Date.now(),
    hashtags,
    metadata
  };

  // Update persona content count
  const updatedPersonas = storage.personas.map(persona => 
    persona.id === personaId 
      ? { ...persona, contentCount: persona.contentCount + 1, updatedAt: Date.now() }
      : persona
  );

  return {
    ...storage,
    personas: updatedPersonas,
    content: [newContentItem, ...storage.content]
  };
};

// Create new persona
export const createPersona = (
  storage: ContentStorage,
  name: string,
  context: string
): ContentStorage => {
  const newPersona: Persona = {
    id: crypto.randomUUID(),
    name,
    context,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    contentCount: 0
  };

  return {
    ...storage,
    personas: [...storage.personas, newPersona]
  };
};

// Update persona
export const updatePersona = (
  storage: ContentStorage,
  personaId: string,
  updates: Partial<Persona>
): ContentStorage => {
  const updatedPersonas = storage.personas.map(persona =>
    persona.id === personaId
      ? { ...persona, ...updates, updatedAt: Date.now() }
      : persona
  );

  return {
    ...storage,
    personas: updatedPersonas
  };
};

// Delete persona and all its content
export const deletePersona = (
  storage: ContentStorage,
  personaId: string
): ContentStorage => {
  // Don't allow deleting the default persona
  if (personaId === 'default') {
    return storage;
  }

  const updatedPersonas = storage.personas.filter(persona => persona.id !== personaId);
  const updatedContent = storage.content.filter(item => item.personaId !== personaId);

  return {
    ...storage,
    personas: updatedPersonas,
    content: updatedContent
  };
};

// Delete specific content item
export const deleteContentItem = (
  storage: ContentStorage,
  contentId: string
): ContentStorage => {
  const contentToDelete = storage.content.find(item => item.id === contentId);
  if (!contentToDelete) return storage;

  // Update persona content count
  const updatedPersonas = storage.personas.map(persona =>
    persona.id === contentToDelete.personaId
      ? { ...persona, contentCount: Math.max(0, persona.contentCount - 1) }
      : persona
  );

  return {
    ...storage,
    personas: updatedPersonas,
    content: storage.content.filter(item => item.id !== contentId)
  };
};

// Get content by persona
export const getContentByPersona = (
  storage: ContentStorage,
  personaId: string
): StoredContentItem[] => {
  return storage.content.filter(item => item.personaId === personaId);
};

// Get content by tool
export const getContentByTool = (
  storage: ContentStorage,
  tool: Page
): StoredContentItem[] => {
  return storage.content.filter(item => item.tool === tool);
};

// Get personas with content counts
export const getPersonasWithStats = (storage: ContentStorage): Persona[] => {
  return storage.personas.map(persona => ({
    ...persona,
    contentCount: storage.content.filter(item => item.personaId === persona.id).length
  }));
};

// Search content
export const searchContent = (
  storage: ContentStorage,
  query: string
): StoredContentItem[] => {
  const lowercaseQuery = query.toLowerCase();
  return storage.content.filter(item =>
    item.personaName.toLowerCase().includes(lowercaseQuery) ||
    item.tool.toLowerCase().includes(lowercaseQuery) ||
    item.type.toLowerCase().includes(lowercaseQuery) ||
    item.hashtags.some(tag => tag.toLowerCase().includes(lowercaseQuery)) ||
    JSON.stringify(item.content).toLowerCase().includes(lowercaseQuery)
  );
};

// Get recent content
export const getRecentContent = (
  storage: ContentStorage,
  limit: number = 20
): StoredContentItem[] => {
  return storage.content
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, limit);
};

// Get content statistics
export const getContentStats = (storage: ContentStorage) => {
  const totalContent = storage.content.length;
  const totalPersonas = storage.personas.length;
  const contentByTool: Record<string, number> = {};
  const contentByPersona: Record<string, number> = {};

  storage.content.forEach(item => {
    contentByTool[item.tool] = (contentByTool[item.tool] || 0) + 1;
    contentByPersona[item.personaName] = (contentByPersona[item.personaName] || 0) + 1;
  });

  return {
    totalContent,
    totalPersonas,
    contentByTool,
    contentByPersona
  };
};