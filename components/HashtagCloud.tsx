import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { HashtagSize } from '../types';
import { supabase } from '../utils/supabaseClient';
import {
  listAutomationSegments,
  fetchLatestAutomatedCluster,
} from '../utils/hashtagCloudAutomation';

export interface HashtagCloudItem {
  id: string;
  name: string;
  display_count: string;
  size: HashtagSize;
  frequency: number;
  trending_score: number;
  popularity_score: number;
  cloud_position_x?: number;
  cloud_position_y?: number;
  category_name: string;
  usage_today: number;
  usage_week: number;
  usage_month: number;
}

interface HashtagCloudProps {
  selectedHashtags: Set<string>;
  onHashtagSelect: (name: string) => void;
  searchTerm?: string;
  selectedSizes?: Set<HashtagSize>;
  categoryFilter?: string;
  maxHashtags?: number;
  minFrequency?: number;
  className?: string;
  showTrendingOnly?: boolean;
  sortBy?: 'trending' | 'frequency' | 'popularity';
}

const sizeToFontSize: Record<HashtagSize, string> = {
  [HashtagSize.Mega]: 'text-4xl',
  [HashtagSize.Large]: 'text-3xl',
  [HashtagSize.Medium]: 'text-2xl',
  [HashtagSize.Small]: 'text-xl',
  [HashtagSize.Micro]: 'text-lg',
};

const sizeToWeight: Record<HashtagSize, string> = {
  [HashtagSize.Mega]: 'font-bold',
  [HashtagSize.Large]: 'font-semibold',
  [HashtagSize.Medium]: 'font-medium',
  [HashtagSize.Small]: 'font-normal',
  [HashtagSize.Micro]: 'font-light',
};

const sizeColorMap: Record<HashtagSize, string> = {
  [HashtagSize.Mega]: 'text-red-400 hover:text-red-300',
  [HashtagSize.Large]: 'text-orange-400 hover:text-orange-300',
  [HashtagSize.Medium]: 'text-green-400 hover:text-green-300',
  [HashtagSize.Small]: 'text-blue-400 hover:text-blue-300',
  [HashtagSize.Micro]: 'text-purple-400 hover:text-purple-300',
};

export const HashtagCloud: React.FC<HashtagCloudProps> = ({
  selectedHashtags,
  onHashtagSelect,
  searchTerm = '',
  selectedSizes = new Set(Object.values(HashtagSize)),
  categoryFilter,
  maxHashtags = 100,
  minFrequency = 1,
  className = '',
  showTrendingOnly = false,
  sortBy = 'trending'
}) => {
  const [cloudData, setCloudData] = useState<HashtagCloudItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<'live' | 'automated'>('live');
  const automationSegments = useMemo(() => listAutomationSegments(), []);
  const [selectedAutomationSegment, setSelectedAutomationSegment] = useState<string>(
    automationSegments[0]?.key || 'global'
  );
  const [automationInfo, setAutomationInfo] = useState<{
    generatedAt: string;
    segmentLabel: string;
  } | null>(null);
  const cloudRef = useRef<HTMLDivElement>(null);
  const sessionId = useRef<string>(`session_${Date.now()}_${Math.random()}`);

  useEffect(() => {
    setError(null);
  }, [dataSource, selectedAutomationSegment]);

  // Calculate dynamic layout for hashtag cloud
  const calculateCloudLayout = useCallback((hashtags: HashtagCloudItem[]) => {
    const container = cloudRef.current;
    if (!container || hashtags.length === 0) return hashtags;

    const containerWidth = container.offsetWidth || 800;
    const containerHeight = container.offsetHeight || 600;

    // Sort by score to position most important hashtags first
    const sortedHashtags = [...hashtags].sort((a, b) => {
      switch (sortBy) {
        case 'frequency':
          return b.frequency - a.frequency;
        case 'popularity':
          return b.popularity_score - a.popularity_score;
        default:
          return b.trending_score - a.trending_score;
      }
    });

    // Simple cloud layout algorithm - spiral placement
    let angle = 0;
    let radius = 50;
    const centerX = containerWidth / 2;
    const centerY = containerHeight / 2;

    return sortedHashtags.map((hashtag, index) => {
      let x, y;

      // Place high-priority hashtags near center
      if (index < 5) {
        const offsetRadius = 20 + (index * 15);
        const offsetAngle = (index * 72) * (Math.PI / 180); // Pentagon distribution
        x = centerX + Math.cos(offsetAngle) * offsetRadius;
        y = centerY + Math.sin(offsetAngle) * offsetRadius;
      } else {
        // Spiral layout for remaining hashtags
        const spiralAngle = angle * (Math.PI / 180);
        x = centerX + Math.cos(spiralAngle) * radius;
        y = centerY + Math.sin(spiralAngle) * radius;

        angle += 25 + (hashtag.trending_score * 2); // Variable spacing based on trending score
        radius += 2;

        // Reset spiral when reaching edge
        if (radius > Math.min(containerWidth, containerHeight) / 3) {
          radius = 50;
          angle += 180;
        }
      }

      // Ensure hashtags stay within bounds
      x = Math.max(50, Math.min(containerWidth - 50, x));
      y = Math.max(30, Math.min(containerHeight - 30, y));

      return {
        ...hashtag,
        cloud_position_x: x,
        cloud_position_y: y
      };
    });
  }, [sortBy]);

  // Fetch hashtag cloud data
  const fetchLiveCloudData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setAutomationInfo(null);

      const { data, error: fetchError } = await supabase
        .rpc('get_hashtag_cloud_data', {
          category_filter: categoryFilter,
          limit_count: maxHashtags,
          min_frequency: minFrequency
        });

      if (fetchError) throw fetchError;

      const processedData = calculateCloudLayout(data || []);
      setCloudData(processedData);
    } catch (err) {
      console.error('Error fetching hashtag cloud data:', err);
      setError('Failed to load hashtag cloud');
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, maxHashtags, minFrequency, calculateCloudLayout]);

  const fetchAutomatedCloudData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const cluster = await fetchLatestAutomatedCluster(selectedAutomationSegment);

      if (!cluster) {
        setCloudData([]);
        setAutomationInfo(null);
        setError('No automated cloud available for this segment yet.');
        return;
      }

      const processed = (cluster.hashtags || []).map((item: any, index: number) => ({
        id: item.id || `automated-${selectedAutomationSegment}-${index}`,
        name: item.name,
        display_count: item.display_count || '',
        size: item.size,
        frequency: item.frequency || 0,
        trending_score: item.trending_score || 0,
        popularity_score: item.popularity_score || 0,
        cloud_position_x: item.cloud_position_x,
        cloud_position_y: item.cloud_position_y,
        category_name: item.category_name || 'Automated',
        usage_today: item.usage_today || 0,
        usage_week: item.usage_week || 0,
        usage_month: item.usage_month || 0,
      })) as HashtagCloudItem[];

      const laidOut = calculateCloudLayout(processed);
      setCloudData(laidOut);
      setAutomationInfo({
        generatedAt: cluster.generatedAt,
        segmentLabel:
          automationSegments.find((segment) => segment.key === cluster.segmentKey)?.label ||
          cluster.segmentKey,
      });
    } catch (err) {
      console.error('Error fetching automated hashtag cloud:', err);
      setError('Failed to load automated hashtag cloud');
    } finally {
      setLoading(false);
    }
  }, [selectedAutomationSegment, calculateCloudLayout, automationSegments]);

  const renderDataSourceControls = () => (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="inline-flex rounded-full bg-gray-800/40 p-1">
        <button
          onClick={() => setDataSource('live')}
          className={`px-4 py-1 text-sm font-medium rounded-full transition-colors ${
            dataSource === 'live'
              ? 'bg-purple-600 text-white shadow-lg'
              : 'text-gray-300 hover:text-white'
          }`}
        >
          Live Stream
        </button>
        <button
          onClick={() => setDataSource('automated')}
          className={`px-4 py-1 text-sm font-medium rounded-full transition-colors ${
            dataSource === 'automated'
              ? 'bg-purple-600 text-white shadow-lg'
              : 'text-gray-300 hover:text-white'
          }`}
        >
          Automated
        </button>
      </div>
      {dataSource === 'automated' && (
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-wide text-gray-400">Segment</span>
          <select
            value={selectedAutomationSegment}
            onChange={(event) => setSelectedAutomationSegment(event.target.value)}
            className="bg-gray-900/60 border border-gray-700 text-sm text-gray-200 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            {automationSegments.map((segment) => (
              <option key={segment.key} value={segment.key}>
                {segment.label}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );

  // Set up real-time subscription
  useEffect(() => {
    let subscription: ReturnType<typeof supabase.channel> | null = null;

    if (dataSource === 'live') {
      fetchLiveCloudData();

      subscription = supabase
        .channel('hashtag_cloud_updates')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'hashtag_usage',
          },
          () => {
            setTimeout(fetchLiveCloudData, 1000);
          },
        )
        .subscribe();
    } else {
      fetchAutomatedCloudData();
    }

    return () => {
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, [dataSource, fetchLiveCloudData, fetchAutomatedCloudData]);

  // Track hashtag usage when selected
  const handleHashtagClick = useCallback(async (name: string) => {
    try {
      // Track usage in Supabase
      await supabase.rpc('track_hashtag_usage', {
        hashtag_name: name,
        session_id: sessionId.current,
        usage_context: 'cloud_selection'
      });

      // Call parent handler
      onHashtagSelect(name);
    } catch (err) {
      console.error('Error tracking hashtag usage:', err);
      // Still call parent handler even if tracking fails
      onHashtagSelect(name);
    }
  }, [onHashtagSelect]);

  // Filter hashtags based on search and size filters
  const filteredHashtags = useMemo(() => {
    return cloudData.filter(hashtag => {
      const matchesSearch = hashtag.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSize = selectedSizes.has(hashtag.size as HashtagSize);
      const matchesTrending = !showTrendingOnly || hashtag.trending_score > 0;

      return matchesSearch && matchesSize && matchesTrending;
    });
  }, [cloudData, searchTerm, selectedSizes, showTrendingOnly]);

  // Resize handler for responsive layout
  useEffect(() => {
    const handleResize = () => {
      if (cloudData.length > 0) {
        const updatedData = calculateCloudLayout(cloudData);
        setCloudData(updatedData);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [cloudData, calculateCloudLayout]);

  if (loading) {
    return (
      <div className="space-y-4">
        {renderDataSourceControls()}
        <div className={`flex items-center justify-center min-h-96 ${className}`}>
          <div className="flex flex-col items-center space-y-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
            <p className="text-sm text-gray-400">Loading hashtag cloud...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        {renderDataSourceControls()}
        <div className={`flex items-center justify-center min-h-96 ${className}`}>
          <div className="text-center">
            <p className="text-red-400 mb-2">{error}</p>
            <button
              onClick={
                dataSource === 'live' ? fetchLiveCloudData : fetchAutomatedCloudData
              }
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (filteredHashtags.length === 0) {
    return (
      <div className="space-y-4">
        {renderDataSourceControls()}
        <div className={`flex items-center justify-center min-h-96 ${className}`}>
          <div className="text-center text-gray-400">
            <p className="mb-2">No hashtags found</p>
            <p className="text-sm">Try adjusting your filters or search terms</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {renderDataSourceControls()}
      <div
        ref={cloudRef}
        className={`relative w-full min-h-[400px] h-[600px] bg-gray-900/30 rounded-xl border border-gray-700 overflow-hidden ${className}`}
      >
      {/* Cloud visualization */}
      <div className="absolute inset-0 p-4">
        {filteredHashtags.map((hashtag) => {
          const isSelected = selectedHashtags.has(hashtag.name);
          const fontSize = sizeToFontSize[hashtag.size as HashtagSize];
          const fontWeight = sizeToWeight[hashtag.size as HashtagSize];
          const colorClass = sizeColorMap[hashtag.size as HashtagSize];

          return (
            <button
              key={hashtag.id}
              onClick={() => handleHashtagClick(hashtag.name)}
              className={`
                absolute transition-all duration-300 ease-in-out cursor-pointer
                transform hover:scale-110 hover:z-10
                ${fontSize} ${fontWeight}
                ${isSelected ? 'text-white bg-purple-600 px-2 py-1 rounded-md shadow-lg' : colorClass}
                ${hashtag.trending_score > 5 ? 'animate-pulse' : ''}
              `}
              style={{
                insetInlineStart: `${hashtag.cloud_position_x}px`,
                insetBlockStart: `${hashtag.cloud_position_y}px`,
                transform: `translate(-50%, -50%) ${isSelected ? 'scale(1.1)' : 'scale(1)'}`,
              }}
              title={`${hashtag.name} - Trending: ${hashtag.trending_score.toFixed(1)}, Frequency: ${hashtag.frequency}, Category: ${hashtag.category_name}`}
            >
              {hashtag.name}
            </button>
          );
        })}
      </div>

      {/* Stats overlay */}
      <div className="absolute top-4 right-4 bg-gray-800/80 rounded-lg p-3 text-xs text-gray-300">
        <div>Showing {filteredHashtags.length} hashtags</div>
        <div>Sort: {sortBy}</div>
        <div>Data: {dataSource === 'live' ? 'Live stream' : 'Automated batch'}</div>
        {showTrendingOnly && <div className="text-yellow-400">Trending only</div>}
        {automationInfo && (
          <div className="text-gray-400 mt-1">
            Segment: {automationInfo.segmentLabel} · Generated{' '}
            {new Date(automationInfo.generatedAt).toLocaleString()}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-gray-800/80 rounded-lg p-3">
        <div className="text-xs text-gray-400 mb-2">Size Legend:</div>
        <div className="flex flex-wrap gap-2 text-xs">
          {Object.entries(sizeColorMap).map(([size, colorClass]) => (
            <div key={size} className={`${colorClass} ${sizeToWeight[size as HashtagSize]}`}>
              {size}
            </div>
          ))}
        </div>
      </div>
      </div>
    </div>
  );
};

export default HashtagCloud;