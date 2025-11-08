import { UserSet, HashtagSize } from '../types';

// User collections storage
export interface UserHashtagCollections {
  favorites: string[];
  customSets: UserSet[];
  recentlyUsed: string[];
}

// Initialize user collections
export const initializeUserCollections = (): UserHashtagCollections => ({
  favorites: [],
  customSets: [],
  recentlyUsed: []
});

// Load user collections from localStorage
export const loadUserCollections = (): UserHashtagCollections => {
  try {
    const saved = localStorage.getItem('userHashtagCollections');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        favorites: parsed.favorites || [],
        customSets: parsed.customSets || [],
        recentlyUsed: parsed.recentlyUsed || []
      };
    }
  } catch (error) {
    console.error('Error loading user hashtag collections:', error);
  }
  return initializeUserCollections();
};

// Get user collections (alias for loadUserCollections for better naming)
export const getUserCollections = (): UserHashtagCollections => {
  return loadUserCollections();
};

// Save user collections to localStorage
export const saveUserCollections = (collections: UserHashtagCollections): void => {
  try {
    localStorage.setItem('userHashtagCollections', JSON.stringify({
      favorites: collections.favorites,
      customSets: collections.customSets,
      recentlyUsed: collections.recentlyUsed
    }));
  } catch (error) {
    console.error('Error saving user hashtag collections:', error);
  }
};

// Add hashtag to favorites (simplified version for component use)
export const addToFavorites = (hashtagName: string): void => {
  const collections = loadUserCollections();
  if (!collections.favorites.includes(hashtagName)) {
    const updated = {
      ...collections,
      favorites: [...collections.favorites, hashtagName]
    };
    saveUserCollections(updated);
  }
};

// Remove hashtag from favorites (simplified version for component use)
export const removeFromFavorites = (hashtagName: string): void => {
  const collections = loadUserCollections();
  const updated = {
    ...collections,
    favorites: collections.favorites.filter(name => name !== hashtagName)
  };
  saveUserCollections(updated);
};

// Create custom set (simplified version for component use)
export const createCustomSet = (setName: string, category: string, hashtags: string[]): void => {
  const collections = loadUserCollections();
  const newSet: UserSet = {
    id: generateSetId(),
    name: setName,
    category,
    hashtags,
    size: calculateSetSize(hashtags.length),
    isFavorite: false,
    isCustom: true,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  const updated = {
    ...collections,
    customSets: [...collections.customSets, newSet]
  };
  saveUserCollections(updated);
};

// Add custom set (original version with collections parameter)
export const addCustomSet = (collections: UserHashtagCollections, set: UserSet): UserHashtagCollections => {
  const updated = {
    ...collections,
    customSets: [...collections.customSets, set]
  };
  saveUserCollections(updated);
  return updated;
};

// Update custom set
export const updateCustomSet = (collections: UserHashtagCollections, setId: string, updatedSet: Partial<UserSet>): UserHashtagCollections => {
  const updated = {
    ...collections,
    customSets: collections.customSets.map(set =>
      set.id === setId ? { ...set, ...updatedSet, updatedAt: Date.now() } : set
    )
  };
  saveUserCollections(updated);
  return updated;
};

// Delete custom set
export const deleteCustomSet = (collections: UserHashtagCollections, setId: string): UserHashtagCollections => {
  const updated = {
    ...collections,
    customSets: collections.customSets.filter(set => set.id !== setId)
  };
  saveUserCollections(updated);
  return updated;
};

// Add to recently used
export const addToRecentlyUsed = (collections: UserHashtagCollections, hashtagName: string): UserHashtagCollections => {
  const updatedRecentlyUsed = [
    hashtagName,
    ...collections.recentlyUsed.filter(name => name !== hashtagName)
  ].slice(0, 20); // Keep last 20
  
  const updated = {
    ...collections,
    recentlyUsed: updatedRecentlyUsed
  };
  saveUserCollections(updated);
  return updated;
};

// Calculate set size based on hashtag count
export const calculateSetSize = (hashtagCount: number): HashtagSize => {
  if (hashtagCount >= 10) return HashtagSize.Mega;
  if (hashtagCount >= 7) return HashtagSize.Large;
  if (hashtagCount >= 5) return HashtagSize.Medium;
  if (hashtagCount >= 3) return HashtagSize.Small;
  return HashtagSize.Micro;
};

// Generate unique ID for custom sets
export const generateSetId = (): string => {
  return `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};