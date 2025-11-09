import { hashtagCloudService } from './hashtagCloudService';
import { supabase } from './supabaseClient';
import { handlePostgrestError } from '../supabase/utils';
import type { HashtagCloudItem } from '../components/HashtagCloud';
import type { HashtagCloudFilters } from './hashtagCloudService';

export interface AutomationSegment {
  key: string;
  label: string;
  filters: HashtagCloudFilters;
  limit?: number;
  retentionMinutes?: number;
}

export interface AutomationRunResult {
  segmentKey: string;
  generatedAt: string;
  hashtagCount: number;
  trendingCount: number;
  insertedId?: string;
  error?: string;
}

export interface AutomatedCluster {
  id: string;
  segmentKey: string;
  clusterType: string;
  generatedAt: string;
  expiresAt?: string | null;
  hashtags: any[];
  metrics?: Record<string, any>;
  filters?: Record<string, any>;
}

const DEFAULT_SEGMENTS: AutomationSegment[] = [
  {
    key: 'global',
    label: 'Global Trending',
    filters: { limit: 120, minFrequency: 2 },
    retentionMinutes: 240,
  },
  {
    key: 'content-creators',
    label: 'Content Creators',
    filters: { categoryFilter: 'Content Creation', limit: 100, showTrendingOnly: true },
    retentionMinutes: 240,
  },
  {
    key: 'audio',
    label: 'Audio & Sound',
    filters: { categoryFilter: 'Audio', limit: 80 },
    retentionMinutes: 180,
  },
  {
    key: 'video',
    label: 'Video & Media',
    filters: { categoryFilter: 'Video', limit: 80 },
    retentionMinutes: 180,
  },
  {
    key: 'ai-trending',
    label: 'AI Trending',
    filters: { categoryFilter: 'AI', limit: 60, showTrendingOnly: true },
    retentionMinutes: 120,
  },
];

let automationHandle: ReturnType<typeof setInterval> | null = null;
let automationIntervalMinutes = 60;

const isServerEnvironment = typeof window === 'undefined';

const sanitizeHashtags = (hashtags: HashtagCloudItem[]) =>
  hashtags.map((item) => ({
    id: item.id,
    name: item.name,
    size: item.size,
    frequency: item.frequency,
    trending_score: item.trending_score,
    popularity_score: item.popularity_score,
    category_name: item.category_name,
    usage_today: item.usage_today,
    usage_week: item.usage_week,
    usage_month: item.usage_month,
  }));

export const listAutomationSegments = (): AutomationSegment[] => [...DEFAULT_SEGMENTS];

export const runTagCloudAutomationCycle = async (options?: {
  segments?: AutomationSegment[];
  createdBy?: string;
}): Promise<AutomationRunResult[]> => {
  const segments = options?.segments && options.segments.length > 0 ? options.segments : DEFAULT_SEGMENTS;
  const results: AutomationRunResult[] = [];

  for (const segment of segments) {
    const now = new Date();

    try {
      const hashtagData = await hashtagCloudService.getHashtagCloudData({
        ...segment.filters,
        limit: segment.limit ?? segment.filters.limit ?? 100,
      });

      const metrics = {
        totalHashtags: hashtagData.length,
        trendingCount: hashtagData.filter((item) => item.trending_score > 0).length,
        topHashtags: hashtagData.slice(0, 10).map((item) => item.name),
        generatedAt: now.toISOString(),
      };

      const { data, error } = await supabase
        .from('automated_tag_clusters')
        .insert({
          cluster_type: 'hashtag',
          segment_key: segment.key,
          filters: segment.filters || {},
          hashtags: sanitizeHashtags(hashtagData),
          metrics,
          generated_at: now.toISOString(),
          expires_at: segment.retentionMinutes
            ? new Date(now.getTime() + segment.retentionMinutes * 60_000).toISOString()
            : null,
          created_by: options?.createdBy || null,
        })
        .select('id')
        .maybeSingle();

      handlePostgrestError(error, `Failed to persist automated tag cluster for ${segment.key}`);

      results.push({
        segmentKey: segment.key,
        generatedAt: now.toISOString(),
        hashtagCount: metrics.totalHashtags,
        trendingCount: metrics.trendingCount,
        insertedId: data?.id,
      });
    } catch (error: any) {
      console.error(`Tag cloud automation failed for segment ${segment.key}`, error);
      results.push({
        segmentKey: segment.key,
        generatedAt: now.toISOString(),
        hashtagCount: 0,
        trendingCount: 0,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return results;
};

export const startHashtagAutomationScheduler = (options?: {
  intervalMinutes?: number;
  segments?: AutomationSegment[];
  createdBy?: string;
}) => {
  if (!isServerEnvironment) {
    console.warn('Hashtag automation scheduler can only run on the server.');
    return null;
  }

  if (automationHandle) {
    return automationHandle;
  }

  automationIntervalMinutes = options?.intervalMinutes || automationIntervalMinutes;

  // Run immediately then schedule
  runTagCloudAutomationCycle({
    segments: options?.segments,
    createdBy: options?.createdBy,
  }).catch((error) => {
    console.error('Initial tag cloud automation run failed:', error);
  });

  automationHandle = setInterval(() => {
    runTagCloudAutomationCycle({
      segments: options?.segments,
      createdBy: options?.createdBy,
    }).catch((error) => {
      console.error('Scheduled tag cloud automation run failed:', error);
    });
  }, automationIntervalMinutes * 60_000);

  return automationHandle;
};

export const stopHashtagAutomationScheduler = () => {
  if (automationHandle) {
    clearInterval(automationHandle);
    automationHandle = null;
  }
};

export const fetchLatestAutomatedCluster = async (
  segmentKey: string,
  clusterType: string = 'hashtag',
): Promise<AutomatedCluster | null> => {
  const { data, error } = await supabase
    .from('automated_tag_clusters')
    .select('*')
    .eq('cluster_type', clusterType)
    .eq('segment_key', segmentKey)
    .order('generated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  handlePostgrestError(error, 'Failed to fetch automated tag cluster');

  if (!data) {
    return null;
  }

  return {
    id: data.id,
    segmentKey: data.segment_key,
    clusterType: data.cluster_type,
    generatedAt: data.generated_at,
    expiresAt: data.expires_at,
    filters: data.filters || undefined,
    metrics: data.metrics || {},
    hashtags: data.hashtags || [],
  };
};

export const fetchAutomatedClusterHistory = async (
  segmentKey: string,
  limit: number = 5,
  clusterType: string = 'hashtag',
): Promise<AutomatedCluster[]> => {
  const { data, error } = await supabase.rpc('get_latest_automated_tag_clusters', {
    p_cluster_type: clusterType,
    p_segment_key: segmentKey,
    p_limit: limit,
  });

  handlePostgrestError(error, 'Failed to fetch automated cluster history');

  return (data || []).map((record: any) => ({
    id: record.id,
    segmentKey: record.segment_key,
    clusterType: record.cluster_type,
    generatedAt: record.generated_at,
    expiresAt: record.expires_at,
    filters: record.filters || undefined,
    metrics: record.metrics || {},
    hashtags: record.hashtags || [],
  }));
};

