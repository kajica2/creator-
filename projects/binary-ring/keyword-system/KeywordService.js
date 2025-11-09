/**
 * Keyword Service for Binary Ring Ecosystem
 * Handles keyword collection, recommendations, and content matching
 */

import { createClient } from '@supabase/supabase-js';

export class KeywordService {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    this.userProfileId = null;
    this.sessionId = this.getOrCreateSession();
  }

  // Session Management
  getOrCreateSession() {
    if (typeof window === 'undefined') return 'server_session';

    let sessionId = localStorage.getItem('br_session_id');
    if (!sessionId) {
      sessionId = 'user_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('br_session_id', sessionId);
    }
    return sessionId;
  }

  async initializeUser() {
    try {
      let { data: profile, error } = await this.supabase
        .from('user_profiles')
        .select('id')
        .eq('user_id', this.sessionId)
        .single();

      if (error && error.code === 'PGRST116') {
        // Create new profile
        const { data: newProfile, error: createError } = await this.supabase
          .from('user_profiles')
          .insert([{
            user_id: this.sessionId,
            preferences: {
              autoCollectKeywords: true,
              recommendationFrequency: 'daily'
            }
          }])
          .select('id')
          .single();

        if (createError) throw createError;
        profile = newProfile;
      }

      this.userProfileId = profile.id;
      return profile.id;
    } catch (error) {
      console.error('Error initializing user:', error);
      throw error;
    }
  }

  // Keyword Collection
  async collectKeyword(keyword, source = 'manual', context = null, strength = 5) {
    if (!this.userProfileId) {
      await this.initializeUser();
    }

    try {
      const { data, error } = await this.supabase
        .rpc('add_user_keyword', {
          p_user_profile_id: this.userProfileId,
          p_keyword: keyword,
          p_source: source,
          p_context: context,
          p_strength: strength
        });

      if (error) throw error;

      // Track interaction
      await this.trackInteraction('keyword', keyword, 'collect', {
        source,
        context,
        strength
      });

      return data;
    } catch (error) {
      console.error('Error collecting keyword:', error);
      throw error;
    }
  }

  // Auto-collect keywords from content
  async autoCollectFromContent(contentType, contentId, extractedKeywords, userInteractionType = 'view') {
    if (!this.userProfileId) await this.initializeUser();

    // Only auto-collect if user has positive interaction
    if (['like', 'bookmark', 'share', 'download'].includes(userInteractionType)) {
      for (const keyword of extractedKeywords.slice(0, 3)) { // Limit to top 3
        try {
          await this.collectKeyword(
            keyword,
            `${contentType}:${contentId}`,
            `Auto-collected from ${contentType} interaction`,
            3 // Lower strength for auto-collected
          );
        } catch (error) {
          console.log(`Failed to auto-collect keyword ${keyword}:`, error.message);
        }
      }
    }
  }

  // Search Keywords
  async searchKeywords(searchTerm, limit = 20) {
    try {
      const { data, error } = await this.supabase
        .rpc('search_keywords', {
          p_search_term: searchTerm,
          p_limit: limit
        });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching keywords:', error);
      return [];
    }
  }

  // Get User Keywords
  async getUserKeywords(category = null) {
    if (!this.userProfileId) await this.initializeUser();

    try {
      let query = this.supabase
        .from('user_keywords')
        .select(`
          *,
          keyword:keywords (
            id,
            keyword,
            definition,
            popularity_score,
            related_concepts,
            category:keyword_categories (name, color_hex, icon)
          )
        `)
        .eq('user_profile_id', this.userProfileId)
        .order('last_accessed', { ascending: false });

      if (category && category !== 'all') {
        // Join with categories and filter
        const { data, error } = await this.supabase
          .from('user_keywords')
          .select(`
            *,
            keyword:keywords!inner (
              id,
              keyword,
              definition,
              popularity_score,
              related_concepts,
              category:keyword_categories!inner (name, color_hex, icon)
            )
          `)
          .eq('user_profile_id', this.userProfileId)
          .eq('keyword.category.name', category)
          .order('last_accessed', { ascending: false });

        if (error) throw error;
        return data || [];
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting user keywords:', error);
      return [];
    }
  }

  // Remove Keyword
  async removeKeyword(userKeywordId) {
    try {
      const { error } = await this.supabase
        .from('user_keywords')
        .delete()
        .eq('id', userKeywordId)
        .eq('user_profile_id', this.userProfileId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error removing keyword:', error);
      throw error;
    }
  }

  // Get Recommendations
  async getRecommendations(contentType = null, limit = 10) {
    if (!this.userProfileId) await this.initializeUser();

    try {
      const { data, error } = await this.supabase
        .rpc('get_user_recommendations', {
          p_user_profile_id: this.userProfileId,
          p_content_type: contentType,
          p_limit: limit
        });

      if (error) throw error;

      // Enhance recommendations with actual content data
      const enhancedRecommendations = await this.enhanceRecommendations(data || []);
      return enhancedRecommendations;
    } catch (error) {
      console.error('Error getting recommendations:', error);
      return [];
    }
  }

  // Enhance recommendations with real content data
  async enhanceRecommendations(recommendations) {
    const enhanced = [];

    for (const rec of recommendations) {
      let enhancedRec = { ...rec };

      try {
        switch (rec.content_type) {
          case 'app':
            const appData = await this.getAppData(rec.content_id);
            if (appData) {
              enhancedRec.title = appData.name;
              enhancedRec.description = appData.description;
              enhancedRec.image = appData.image;
              enhancedRec.url = `/apps/${rec.content_id}/`;
            }
            break;

          case 'experiment':
            const expData = await this.getExperimentData(rec.content_id);
            if (expData) {
              enhancedRec.title = expData.name;
              enhancedRec.description = expData.description;
              enhancedRec.url = `/experiments/${rec.content_id}/`;
            }
            break;

          case 'template':
            enhancedRec.title = `${rec.content_id.charAt(0).toUpperCase() + rec.content_id.slice(1)} Template`;
            enhancedRec.url = `/templates/${rec.content_id}.html`;
            break;

          default:
            enhancedRec.title = rec.content_id;
            enhancedRec.url = `/${rec.content_type}s/${rec.content_id}/`;
        }

        enhanced.push(enhancedRec);
      } catch (error) {
        console.log(`Failed to enhance recommendation for ${rec.content_id}:`, error.message);
        enhanced.push(enhancedRec);
      }
    }

    return enhanced;
  }

  // Get app data from catalog
  async getAppData(appId) {
    try {
      const response = await fetch('/apps/catalog.json');
      const catalog = await response.json();
      return catalog.apps?.find(app => app.id === appId) ||
             catalog.experiments?.find(exp => exp.id === appId);
    } catch (error) {
      console.error('Error fetching app data:', error);
      return null;
    }
  }

  // Get experiment data
  async getExperimentData(expId) {
    try {
      const response = await fetch('/apps/catalog.json');
      const catalog = await response.json();
      return catalog.experiments?.find(exp => exp.id === expId);
    } catch (error) {
      console.error('Error fetching experiment data:', error);
      return null;
    }
  }

  // Track user interactions
  async trackInteraction(contentType, contentId, interactionType, metadata = {}) {
    if (!this.userProfileId) await this.initializeUser();

    try {
      const { error } = await this.supabase
        .from('user_interactions')
        .insert([{
          user_profile_id: this.userProfileId,
          content_type: contentType,
          content_id: contentId,
          interaction_type: interactionType,
          metadata: metadata
        }]);

      if (error) throw error;
    } catch (error) {
      console.error('Error tracking interaction:', error);
    }
  }

  // Get keyword categories
  async getKeywordCategories() {
    try {
      const { data, error } = await this.supabase
        .from('keyword_categories')
        .select('*')
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting categories:', error);
      return [];
    }
  }

  // Extract keywords from text content using simple NLP
  extractKeywordsFromText(text, maxKeywords = 10) {
    if (!text) return [];

    // Simple keyword extraction (could be enhanced with NLP libraries)
    const commonWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them'
    ]);

    const words = text
      .toLowerCase()
      .replace(/[^\w\s-]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !commonWords.has(word));

    const wordFreq = {};
    words.forEach(word => {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    });

    return Object.entries(wordFreq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, maxKeywords)
      .map(([word]) => word);
  }

  // Auto-tag content with keywords
  async tagContent(contentType, contentId, content, isAutoGenerated = true) {
    const extractedKeywords = this.extractKeywordsFromText(JSON.stringify(content));

    for (const keyword of extractedKeywords) {
      try {
        // Get or create keyword
        let { data: keywordData, error } = await this.supabase
          .from('keywords')
          .select('id')
          .eq('keyword', keyword)
          .single();

        if (error && error.code === 'PGRST116') {
          // Create keyword
          const { data: newKeyword, error: createError } = await this.supabase
            .from('keywords')
            .insert([{ keyword }])
            .select('id')
            .single();

          if (createError) continue;
          keywordData = newKeyword;
        }

        // Tag content with keyword
        await this.supabase
          .from('content_keywords')
          .insert([{
            content_type: contentType,
            content_id: contentId,
            keyword_id: keywordData.id,
            relevance_score: 0.8,
            auto_generated: isAutoGenerated
          }])
          .onConflict('content_type,content_id,keyword_id')
          .doNothing();

      } catch (error) {
        console.log(`Failed to tag content with keyword ${keyword}:`, error.message);
      }
    }
  }

  // Get trending keywords
  async getTrendingKeywords(limit = 20) {
    try {
      const { data, error } = await this.supabase
        .from('keywords')
        .select(`
          *,
          category:keyword_categories (name, color_hex, icon)
        `)
        .order('popularity_score', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting trending keywords:', error);
      return [];
    }
  }
}

// Export singleton instance
export const keywordService = new KeywordService();

// Utility functions for easy integration
export const collectKeyword = (keyword, source, context, strength) =>
  keywordService.collectKeyword(keyword, source, context, strength);

export const trackContentView = (contentType, contentId, metadata) =>
  keywordService.trackInteraction(contentType, contentId, 'view', metadata);

export const getPersonalizedRecommendations = (contentType, limit) =>
  keywordService.getRecommendations(contentType, limit);

export const autoTagContent = (contentType, contentId, content) =>
  keywordService.tagContent(contentType, contentId, content, true);