import { supabase } from './supabaseClient';
import { HashtagCloudItem } from '../components/HashtagCloud';
import { HashtagSize } from '../types';

export interface HashtagCloudFilters {
  categoryFilter?: string;
  sizeFilter?: HashtagSize[];
  searchTerm?: string;
  showTrendingOnly?: boolean;
  minFrequency?: number;
  limit?: number;
}

export interface HashtagUsageEvent {
  hashtag_name: string;
  session_id?: string;
  context?: 'selection' | 'search' | 'generation' | 'cloud_selection';
}

/**
 * Service class for hashtag cloud data management
 */
export class HashtagCloudService {
  private static instance: HashtagCloudService;

  public static getInstance(): HashtagCloudService {
    if (!HashtagCloudService.instance) {
      HashtagCloudService.instance = new HashtagCloudService();
    }
    return HashtagCloudService.instance;
  }

  /**
   * Fetch hashtag cloud data with optional filters
   */
  async getHashtagCloudData(filters: HashtagCloudFilters = {}): Promise<HashtagCloudItem[]> {
    try {
      const { data, error } = await supabase.rpc('get_hashtag_cloud_data', {
        category_filter: filters.categoryFilter || null,
        limit_count: filters.limit || 100,
        min_frequency: filters.minFrequency || 1
      });

      if (error) {
        console.error('Error fetching hashtag cloud data:', error);
        throw error;
      }

      // Apply additional client-side filters
      let filteredData = data || [];

      if (filters.searchTerm) {
        filteredData = filteredData.filter((item: HashtagCloudItem) =>
          item.name.toLowerCase().includes(filters.searchTerm!.toLowerCase())
        );
      }

      if (filters.sizeFilter && filters.sizeFilter.length > 0) {
        filteredData = filteredData.filter((item: HashtagCloudItem) =>
          filters.sizeFilter!.includes(item.size as HashtagSize)
        );
      }

      if (filters.showTrendingOnly) {
        filteredData = filteredData.filter((item: HashtagCloudItem) =>
          item.trending_score > 0
        );
      }

      return filteredData;
    } catch (error) {
      console.error('Failed to fetch hashtag cloud data:', error);
      throw new Error('Failed to load hashtag cloud data');
    }
  }

  /**
   * Track hashtag usage for analytics
   */
  async trackHashtagUsage(event: HashtagUsageEvent): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('track_hashtag_usage', {
        hashtag_name: event.hashtag_name,
        session_id: event.session_id || null,
        usage_context: event.context || 'selection'
      });

      if (error) {
        console.error('Error tracking hashtag usage:', error);
        return false;
      }

      return data || true;
    } catch (error) {
      console.error('Failed to track hashtag usage:', error);
      return false;
    }
  }

  /**
   * Get trending hashtags
   */
  async getTrendingHashtags(limit: number = 20): Promise<HashtagCloudItem[]> {
    try {
      const { data, error } = await supabase
        .from('hashtag_trending')
        .select('*')
        .order('calculated_trending_score', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Failed to fetch trending hashtags:', error);
      throw new Error('Failed to load trending hashtags');
    }
  }

  /**
   * Get hashtag categories for cloud filtering
   */
  async getHashtagCategories(): Promise<Array<{ id: string; name: string; count: number }>> {
    try {
      const { data, error } = await supabase
        .from('hashtag_categories')
        .select(`
          id,
          name,
          hashtags(count)
        `);

      if (error) throw error;

      return (data || []).map(category => ({
        id: category.id,
        name: category.name,
        count: category.hashtags?.length || 0
      }));
    } catch (error) {
      console.error('Failed to fetch hashtag categories:', error);
      return [];
    }
  }

  /**
   * Subscribe to real-time hashtag updates
   */
  subscribeToHashtagUpdates(callback: (payload: any) => void) {
    const subscription = supabase
      .channel('hashtag_cloud_updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'hashtag_usage'
      }, callback)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'hashtags'
      }, callback)
      .subscribe();

    return subscription;
  }

  /**
   * Unsubscribe from hashtag updates
   */
  unsubscribeFromHashtagUpdates(subscription: any) {
    return supabase.removeChannel(subscription);
  }

  /**
   * Get hashtag analytics data
   */
  async getHashtagAnalytics(timeframe: 'day' | 'week' | 'month' = 'week') {
    try {
      const { data, error } = await supabase
        .from('hashtag_usage')
        .select(`
          hashtag_id,
          context,
          created_at,
          hashtags!inner(name, size, category_id)
        `)
        .gte('created_at', this.getTimeframeDate(timeframe));

      if (error) throw error;

      // Process analytics data
      const analytics = this.processAnalyticsData(data || []);
      return analytics;
    } catch (error) {
      console.error('Failed to fetch hashtag analytics:', error);
      throw new Error('Failed to load hashtag analytics');
    }
  }

  /**
   * Bulk update hashtag cloud positions
   */
  async updateHashtagPositions(updates: Array<{
    id: string;
    cloud_position_x: number;
    cloud_position_y: number;
  }>): Promise<boolean> {
    try {
      const promises = updates.map(update =>
        supabase
          .from('hashtags')
          .update({
            cloud_position_x: update.cloud_position_x,
            cloud_position_y: update.cloud_position_y
          })
          .eq('id', update.id)
      );

      const results = await Promise.all(promises);
      const hasErrors = results.some(result => result.error);

      if (hasErrors) {
        console.error('Some hashtag position updates failed');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to update hashtag positions:', error);
      return false;
    }
  }

  /**
   * Search hashtags with fuzzy matching
   */
  async searchHashtags(query: string, limit: number = 50): Promise<HashtagCloudItem[]> {
    try {
      const { data, error } = await supabase
        .from('hashtag_trending')
        .select('*')
        .ilike('name', `%${query}%`)
        .order('calculated_trending_score', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Failed to search hashtags:', error);
      return [];
    }
  }

  /**
   * Get similar hashtags based on usage patterns
   */
  async getSimilarHashtags(hashtagName: string, limit: number = 10): Promise<HashtagCloudItem[]> {
    try {
      const { data, error } = await supabase
        .from('hashtags')
        .select('*, hashtag_categories!inner(name)')
        .contains('related_hashtags', [hashtagName])
        .order('trending_score', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data?.map(item => ({
        ...item,
        category_name: item.hashtag_categories?.name || 'Uncategorized'
      })) || [];
    } catch (error) {
      console.error('Failed to fetch similar hashtags:', error);
      return [];
    }
  }

  // Private helper methods

  private getTimeframeDate(timeframe: 'day' | 'week' | 'month'): string {
    const now = new Date();
    switch (timeframe) {
      case 'day':
        now.setDate(now.getDate() - 1);
        break;
      case 'week':
        now.setDate(now.getDate() - 7);
        break;
      case 'month':
        now.setMonth(now.getMonth() - 1);
        break;
    }
    return now.toISOString();
  }

  private processAnalyticsData(rawData: any[]) {
    const totalUsage = rawData.length;
    const contextBreakdown = rawData.reduce((acc, item) => {
      acc[item.context] = (acc[item.context] || 0) + 1;
      return acc;
    }, {});

    const topHashtags = rawData.reduce((acc, item) => {
      const name = item.hashtags?.name;
      if (name) {
        acc[name] = (acc[name] || 0) + 1;
      }
      return acc;
    }, {});

    const sortedTopHashtags = Object.entries(topHashtags)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 10);

    return {
      totalUsage,
      contextBreakdown,
      topHashtags: sortedTopHashtags,
      uniqueHashtags: Object.keys(topHashtags).length,
      avgUsagePerHashtag: totalUsage / Object.keys(topHashtags).length || 0
    };
  }
}

// Export singleton instance
export const hashtagCloudService = HashtagCloudService.getInstance();