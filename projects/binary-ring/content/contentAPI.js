// /Users/kajicadjuric/Documents/viral-hashtag-&-image-ai/projects/binary-ring/content/contentAPI.js
// Content API Service - Handles all content operations with Supabase integration, caching, and real-time updates
// Used by: Admin interface, content integration module, and community pages for dynamic content management

import { supabase } from '../../../utils/supabaseClient.js';

// Content cache with TTL and version management
class ContentCache {
  constructor(ttlMs = 300000) { // 5 minutes default TTL
    this.cache = new Map();
    this.ttl = ttlMs;
    this.versions = new Map();
  }

  set(key, data, version = 1) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      version
    });
    this.versions.set(key, version);
  }

  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      this.versions.delete(key);
      return null;
    }

    return entry.data;
  }

  invalidate(key) {
    this.cache.delete(key);
    this.versions.delete(key);
  }

  invalidatePattern(pattern) {
    for (const [key] of this.cache) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
        this.versions.delete(key);
      }
    }
  }

  getVersion(key) {
    return this.versions.get(key) || 0;
  }
}

// Global cache instance
const contentCache = new ContentCache();

// Neural connection engine for project relationships
class NeuralConnectionEngine {
  constructor() {
    this.connections = new Map();
    this.weights = new Map();
  }

  // Calculate similarity based on content vectors
  calculateSimilarity(content1, content2) {
    const features1 = this.extractFeatures(content1);
    const features2 = this.extractFeatures(content2);

    return this.cosineSimilarity(features1, features2);
  }

  extractFeatures(content) {
    const text = JSON.stringify(content).toLowerCase();
    const words = text.match(/\w+/g) || [];
    const features = {};

    // TF-IDF-like feature extraction
    words.forEach(word => {
      if (word.length > 3) {
        features[word] = (features[word] || 0) + 1;
      }
    });

    return features;
  }

  cosineSimilarity(vec1, vec2) {
    const keys1 = Object.keys(vec1);
    const keys2 = Object.keys(vec2);
    const allKeys = [...new Set([...keys1, ...keys2])];

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    allKeys.forEach(key => {
      const val1 = vec1[key] || 0;
      const val2 = vec2[key] || 0;

      dotProduct += val1 * val2;
      norm1 += val1 * val1;
      norm2 += val2 * val2;
    });

    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2)) || 0;
  }

  // Build neural connections between projects
  buildConnections(projects) {
    const connections = new Map();

    projects.forEach((project, i) => {
      const projectConnections = [];

      projects.forEach((otherProject, j) => {
        if (i !== j) {
          const similarity = this.calculateSimilarity(project, otherProject);
          if (similarity > 0.1) { // Threshold for meaningful connections
            projectConnections.push({
              id: otherProject.id,
              weight: similarity,
              type: this.getConnectionType(similarity)
            });
          }
        }
      });

      // Sort by weight and keep top 5 connections
      projectConnections.sort((a, b) => b.weight - a.weight);
      connections.set(project.id, projectConnections.slice(0, 5));
    });

    return connections;
  }

  getConnectionType(weight) {
    if (weight > 0.7) return 'strong';
    if (weight > 0.4) return 'medium';
    return 'weak';
  }
}

// Global neural engine instance
const neuralEngine = new NeuralConnectionEngine();

// Real-time subscription manager
class RealTimeManager {
  constructor() {
    this.subscriptions = new Map();
    this.callbacks = new Map();
  }

  subscribe(table, callback, filter = {}) {
    const subscriptionKey = `${table}_${JSON.stringify(filter)}`;

    if (this.subscriptions.has(subscriptionKey)) {
      // Add callback to existing subscription
      const callbacks = this.callbacks.get(subscriptionKey) || [];
      callbacks.push(callback);
      this.callbacks.set(subscriptionKey, callbacks);
      return subscriptionKey;
    }

    // Create new subscription
    let subscription = supabase
      .channel(`content-${table}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: table,
        filter: Object.keys(filter).length ? `${Object.keys(filter)[0]}=eq.${Object.values(filter)[0]}` : undefined
      }, (payload) => {
        const callbacks = this.callbacks.get(subscriptionKey) || [];
        callbacks.forEach(cb => cb(payload));

        // Invalidate relevant cache entries
        contentCache.invalidatePattern(table);
      })
      .subscribe();

    this.subscriptions.set(subscriptionKey, subscription);
    this.callbacks.set(subscriptionKey, [callback]);

    return subscriptionKey;
  }

  unsubscribe(subscriptionKey) {
    const subscription = this.subscriptions.get(subscriptionKey);
    if (subscription) {
      supabase.removeChannel(subscription);
      this.subscriptions.delete(subscriptionKey);
      this.callbacks.delete(subscriptionKey);
    }
  }

  unsubscribeAll() {
    this.subscriptions.forEach(subscription => {
      supabase.removeChannel(subscription);
    });
    this.subscriptions.clear();
    this.callbacks.clear();
  }
}

// Global real-time manager
const realTimeManager = new RealTimeManager();

// Multi-language support
const languageSupport = {
  defaultLanguage: 'en',
  supportedLanguages: ['en', 'es', 'fr', 'de', 'ja', 'zh'],

  getContentByLanguage(content, language = 'en') {
    if (typeof content === 'string') return content;
    if (typeof content === 'object' && content !== null) {
      return content[language] || content[this.defaultLanguage] || content;
    }
    return content;
  },

  setContentLanguage(content, language, value) {
    if (typeof content === 'string') {
      return { [this.defaultLanguage]: content, [language]: value };
    }
    return { ...content, [language]: value };
  }
};

// Main Content API Service
export class ContentAPI {
  constructor() {
    this.cache = contentCache;
    this.neuralEngine = neuralEngine;
    this.realTime = realTimeManager;
    this.language = languageSupport;
  }

  // === CONTENT CRUD OPERATIONS ===

  async getAllContent(options = {}) {
    const {
      language = 'en',
      includeRelated = true,
      useCache = true,
      limit = 50,
      offset = 0,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = options;

    const cacheKey = `all_content_${JSON.stringify(options)}`;

    if (useCache) {
      const cached = this.cache.get(cacheKey);
      if (cached) return cached;
    }

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      let query = supabase
        .from('persona_content')
        .select(`
          *,
          personas!inner(
            id,
            name,
            context,
            is_default
          )
        `)
        .eq('user_id', user.id)
        .order(sortBy, { ascending: sortOrder === 'asc' })
        .range(offset, offset + limit - 1);

      const { data, error } = await query;

      if (error) throw error;

      // Process content with language support and neural connections
      let processedContent = data.map(item => ({
        id: item.id,
        personaId: item.persona_id,
        personaName: item.personas.name,
        tool: item.tool,
        type: item.prompt_type,
        content: this.language.getContentByLanguage(item.content, language),
        hashtags: item.hashtags || [],
        metadata: item.metadata || {},
        timestamp: new Date(item.created_at).getTime(),
        version: this.cache.getVersion(`content_${item.id}`) + 1
      }));

      // Add neural connections if requested
      if (includeRelated) {
        const connections = this.neuralEngine.buildConnections(processedContent);
        processedContent = processedContent.map(item => ({
          ...item,
          relatedContent: connections.get(item.id) || []
        }));
      }

      if (useCache) {
        this.cache.set(cacheKey, processedContent);
      }

      return processedContent;

    } catch (error) {
      console.error('Error fetching content:', error);
      throw new Error(`Failed to fetch content: ${error.message}`);
    }
  }

  async getContentById(contentId, language = 'en') {
    const cacheKey = `content_${contentId}_${language}`;

    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('persona_content')
        .select(`
          *,
          personas!inner(
            id,
            name,
            context
          )
        `)
        .eq('id', contentId)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      const processedContent = {
        id: data.id,
        personaId: data.persona_id,
        personaName: data.personas.name,
        tool: data.tool,
        type: data.prompt_type,
        content: this.language.getContentByLanguage(data.content, language),
        hashtags: data.hashtags || [],
        metadata: data.metadata || {},
        timestamp: new Date(data.created_at).getTime(),
        version: this.cache.getVersion(cacheKey) + 1
      };

      this.cache.set(cacheKey, processedContent);
      return processedContent;

    } catch (error) {
      console.error('Error fetching content by ID:', error);
      throw new Error(`Failed to fetch content: ${error.message}`);
    }
  }

  async createContent(contentData) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('persona_content')
        .insert({
          persona_id: contentData.personaId,
          user_id: user.id,
          tool: contentData.tool,
          prompt_type: contentData.type,
          content: contentData.content,
          hashtags: contentData.hashtags || [],
          metadata: {
            ...contentData.metadata,
            created_by: user.id,
            version: 1
          }
        })
        .select()
        .single();

      if (error) throw error;

      // Invalidate relevant caches
      this.cache.invalidatePattern('content');
      this.cache.invalidatePattern('persona');

      return {
        id: data.id,
        personaId: data.persona_id,
        tool: data.tool,
        type: data.prompt_type,
        content: data.content,
        hashtags: data.hashtags,
        metadata: data.metadata,
        timestamp: new Date(data.created_at).getTime()
      };

    } catch (error) {
      console.error('Error creating content:', error);
      throw new Error(`Failed to create content: ${error.message}`);
    }
  }

  async updateContent(contentId, updates, language = 'en') {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Handle multilingual content updates
      let contentUpdate = updates.content;
      if (language !== 'en' && contentUpdate) {
        const existing = await this.getContentById(contentId, 'en');
        contentUpdate = this.language.setContentLanguage(existing.content, language, contentUpdate);
      }

      const updateData = {
        ...updates,
        content: contentUpdate,
        metadata: {
          ...updates.metadata,
          updated_by: user.id,
          updated_at: new Date().toISOString(),
          version: (updates.metadata?.version || 0) + 1
        }
      };

      const { data, error } = await supabase
        .from('persona_content')
        .update(updateData)
        .eq('id', contentId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      // Invalidate caches
      this.cache.invalidate(`content_${contentId}`);
      this.cache.invalidatePattern('all_content');

      return {
        id: data.id,
        personaId: data.persona_id,
        tool: data.tool,
        type: data.prompt_type,
        content: data.content,
        hashtags: data.hashtags,
        metadata: data.metadata,
        timestamp: new Date(data.created_at).getTime()
      };

    } catch (error) {
      console.error('Error updating content:', error);
      throw new Error(`Failed to update content: ${error.message}`);
    }
  }

  async deleteContent(contentId) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('persona_content')
        .delete()
        .eq('id', contentId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Invalidate caches
      this.cache.invalidate(`content_${contentId}`);
      this.cache.invalidatePattern('all_content');
      this.cache.invalidatePattern('persona');

      return true;

    } catch (error) {
      console.error('Error deleting content:', error);
      throw new Error(`Failed to delete content: ${error.message}`);
    }
  }

  // === REAL-TIME FEATURES ===

  subscribeToContentUpdates(callback, filter = {}) {
    return this.realTime.subscribe('persona_content', callback, filter);
  }

  subscribeToPersonaUpdates(callback) {
    return this.realTime.subscribe('personas', callback);
  }

  unsubscribeFromUpdates(subscriptionKey) {
    this.realTime.unsubscribe(subscriptionKey);
  }

  // === NEURAL CONNECTION FEATURES ===

  async getRelatedContent(contentId, limit = 5) {
    try {
      const content = await this.getContentById(contentId);
      const allContent = await this.getAllContent({ useCache: true });

      const connections = this.neuralEngine.buildConnections([content, ...allContent]);
      const related = connections.get(contentId) || [];

      return related.slice(0, limit);
    } catch (error) {
      console.error('Error getting related content:', error);
      return [];
    }
  }

  async getProjectSuggestions(personaId, tool, limit = 3) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get recent content for this persona and tool
      const { data: recentContent } = await supabase
        .from('persona_content')
        .select('*')
        .eq('user_id', user.id)
        .eq('persona_id', personaId)
        .eq('tool', tool)
        .order('created_at', { ascending: false })
        .limit(10);

      if (!recentContent || recentContent.length === 0) {
        return this.getDefaultSuggestions(tool);
      }

      // Use neural engine to find patterns and suggest new projects
      const patterns = this.neuralEngine.extractFeatures({ recentContent });
      const suggestions = this.generateSuggestionsFromPatterns(patterns, tool, limit);

      return suggestions;

    } catch (error) {
      console.error('Error getting project suggestions:', error);
      return this.getDefaultSuggestions(tool);
    }
  }

  generateSuggestionsFromPatterns(patterns, tool, limit) {
    // Basic suggestion generation based on patterns
    const suggestions = [];
    const commonWords = Object.keys(patterns).sort((a, b) => patterns[b] - patterns[a]).slice(0, 5);

    for (let i = 0; i < limit; i++) {
      suggestions.push({
        id: `suggestion_${Date.now()}_${i}`,
        title: `New ${tool} Project`,
        description: `Consider creating content around: ${commonWords.slice(i, i + 2).join(', ')}`,
        suggestedTags: commonWords.slice(i * 2, (i * 2) + 3),
        confidence: Math.max(0.3, 1 - (i * 0.2))
      });
    }

    return suggestions;
  }

  getDefaultSuggestions(tool) {
    const defaults = {
      'AI Story': [
        { title: 'Character-driven narrative', description: 'Create a story focused on character development' },
        { title: 'Sci-fi adventure', description: 'Explore futuristic themes and technology' },
        { title: 'Mystery thriller', description: 'Build suspense with plot twists' }
      ],
      'Text-to-Image': [
        { title: 'Abstract art', description: 'Generate artistic abstract compositions' },
        { title: 'Portrait photography', description: 'Create realistic portrait images' },
        { title: 'Landscape scenes', description: 'Generate beautiful natural landscapes' }
      ],
      'Website Strategy': [
        { title: 'E-commerce optimization', description: 'Improve online store performance' },
        { title: 'Content marketing plan', description: 'Develop engaging content strategy' },
        { title: 'User experience audit', description: 'Analyze and improve user flows' }
      ]
    };

    return defaults[tool] || [
      { title: 'Creative exploration', description: 'Try something new and experimental' },
      { title: 'Skill building', description: 'Focus on developing specific abilities' }
    ];
  }

  // === CONTENT VERSIONING ===

  async getContentVersions(contentId) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // For now, return single version (future enhancement: implement proper versioning table)
      const content = await this.getContentById(contentId);
      return [{
        version: content.metadata?.version || 1,
        content: content,
        timestamp: content.timestamp,
        changes: 'Current version'
      }];

    } catch (error) {
      console.error('Error getting content versions:', error);
      return [];
    }
  }

  // === SEARCH AND FILTERING ===

  async searchContent(query, options = {}) {
    const {
      language = 'en',
      tool = null,
      personaId = null,
      tags = [],
      limit = 20
    } = options;

    try {
      const allContent = await this.getAllContent({ language, includeRelated: false });

      const searchTerms = query.toLowerCase().split(/\s+/);

      const results = allContent.filter(item => {
        // Tool filter
        if (tool && item.tool !== tool) return false;

        // Persona filter
        if (personaId && item.personaId !== personaId) return false;

        // Tag filter
        if (tags.length > 0 && !tags.some(tag => item.hashtags.includes(tag))) return false;

        // Text search
        const searchText = `${item.personaName} ${item.tool} ${item.type} ${JSON.stringify(item.content)} ${item.hashtags.join(' ')}`.toLowerCase();

        return searchTerms.every(term => searchText.includes(term));
      });

      // Sort by relevance (basic scoring)
      results.sort((a, b) => {
        const scoreA = this.calculateRelevanceScore(a, searchTerms);
        const scoreB = this.calculateRelevanceScore(b, searchTerms);
        return scoreB - scoreA;
      });

      return results.slice(0, limit);

    } catch (error) {
      console.error('Error searching content:', error);
      return [];
    }
  }

  calculateRelevanceScore(content, searchTerms) {
    let score = 0;
    const searchText = `${content.personaName} ${content.tool} ${content.type} ${JSON.stringify(content.content)} ${content.hashtags.join(' ')}`.toLowerCase();

    searchTerms.forEach(term => {
      const occurrences = (searchText.match(new RegExp(term, 'g')) || []).length;
      score += occurrences;

      // Boost score for exact matches in important fields
      if (content.personaName.toLowerCase().includes(term)) score += 5;
      if (content.tool.toLowerCase().includes(term)) score += 3;
      if (content.hashtags.some(tag => tag.toLowerCase().includes(term))) score += 2;
    });

    return score;
  }

  // === ANALYTICS AND INSIGHTS ===

  async getContentAnalytics(timeRange = 30) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - timeRange);

      const { data, error } = await supabase
        .from('persona_content')
        .select('tool, prompt_type, created_at, personas!inner(name)')
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString());

      if (error) throw error;

      const analytics = {
        totalContent: data.length,
        contentByTool: {},
        contentByType: {},
        contentByPersona: {},
        dailyActivity: {},
        trends: []
      };

      data.forEach(item => {
        // By tool
        analytics.contentByTool[item.tool] = (analytics.contentByTool[item.tool] || 0) + 1;

        // By type
        analytics.contentByType[item.prompt_type] = (analytics.contentByType[item.prompt_type] || 0) + 1;

        // By persona
        analytics.contentByPersona[item.personas.name] = (analytics.contentByPersona[item.personas.name] || 0) + 1;

        // Daily activity
        const date = new Date(item.created_at).toDateString();
        analytics.dailyActivity[date] = (analytics.dailyActivity[date] || 0) + 1;
      });

      return analytics;

    } catch (error) {
      console.error('Error getting analytics:', error);
      return null;
    }
  }
}

// Export singleton instance
export const contentAPI = new ContentAPI();
export default contentAPI;