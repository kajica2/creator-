import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../utils/supabaseClient';
import { fetchLatestAutomatedCluster } from '../utils/hashtagCloudAutomation';

const SENTRY_CATEGORIES: SentryNavigationCategoryInfo[] = [
  {
    name: 'platform',
    displayName: 'Platform',
    colorCode: '#EF4444',
    description: 'Core platform features',
    icon: '⚡',
    displayOrder: 1,
  },
  {
    name: 'solutions',
    displayName: 'Solutions',
    colorCode: '#3B82F6',
    description: 'Industry solutions',
    icon: '🎯',
    displayOrder: 2,
  },
  {
    name: 'about',
    displayName: 'About',
    colorCode: '#10B981',
    description: 'Company information',
    icon: 'ℹ️',
    displayOrder: 3,
  },
  {
    name: 'help',
    displayName: 'Get Help',
    colorCode: '#F59E0B',
    description: 'Support & docs',
    icon: '❓',
    displayOrder: 4,
  },
];
import {
  SentryNavigationItem,
  SentryNavigationCloudProps,
  SentryNavigationCategory,
  SentryNavigationCategoryInfo
} from '../types';

// Cloud visualization algorithms inspired by the existing hashtag cloud system
const generateCloudPositions = (
  items: SentryNavigationItem[],
  width: number,
  height: number
): SentryNavigationItem[] => {
  const centerX = width / 2;
  const centerY = height / 2;
  const maxRadius = Math.min(width, height) * 0.4;

  return items.map((item, index) => {
    // Use popularity score and usage to determine position
    const importance = (item.popularityScore + item.usageToday * 10) / 110;

    // Important items go closer to center
    const radius = maxRadius * (1 - importance * 0.7);

    // Distribute items in a spiral pattern
    const angle = (index * 137.5) * (Math.PI / 180); // Golden angle
    const spiralRadius = radius + (index * 2);

    // Add some randomness to avoid perfect alignment
    const jitter = 20;
    const x = centerX + Math.cos(angle) * spiralRadius + (Math.random() - 0.5) * jitter;
    const y = centerY + Math.sin(angle) * spiralRadius + (Math.random() - 0.5) * jitter;

    return {
      ...item,
      cloudPositionX: Math.max(50, Math.min(width - 50, x)),
      cloudPositionY: Math.max(30, Math.min(height - 30, y))
    };
  });
};

// Color variations within category themes
const getCategoryColors = (category: SentryNavigationCategory, baseColor: string) => {
  const colorVariations: Record<SentryNavigationCategory, string[]> = {
    platform: ['#EF4444', '#DC2626', '#B91C1C', '#991B1B', '#7F1D1D'],
    solutions: ['#3B82F6', '#2563EB', '#1D4ED8', '#1E40AF', '#1E3A8A'],
    about: ['#10B981', '#059669', '#047857', '#065F46', '#064E3B'],
    help: ['#F59E0B', '#D97706', '#B45309', '#92400E', '#78350F']
  };

  return colorVariations[category] || [baseColor];
};

export const SentryNavigationCloud: React.FC<SentryNavigationCloudProps> = ({
  category,
  featuredOnly = false,
  onItemClick,
  onItemHover,
  maxItems = 50,
  width = 1000,
  height = 600,
  showCategories = true,
  interactive = true
}) => {
  const [items, setItems] = useState<SentryNavigationItem[]>([]);
  const [hoveredItem, setHoveredItem] = useState<SentryNavigationItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<SentryNavigationCategory | undefined>(category);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<'live' | 'automated'>('live');
  const [selectedAutomationSegment, setSelectedAutomationSegment] = useState<string>('global');
  const [automationInfo, setAutomationInfo] = useState<{
    generatedAt: string;
    segmentLabel: string;
  } | null>(null);

  // Category information
  const categories = SENTRY_CATEGORIES;

  const automationSegments = useMemo(
    () => [
      { key: 'global', label: 'Global Highlights' },
      ...categories.map((cat) => ({ key: cat.name, label: cat.displayName })),
    ],
    [categories],
  );

  useEffect(() => {
    setSelectedAutomationSegment((prev) => prev || automationSegments[0]?.key || 'global');
  }, [automationSegments]);

  useEffect(() => {
    setError(null);
  }, [dataSource, selectedAutomationSegment]);

  // Fetch navigation items from Supabase
  const fetchLiveNavigationItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setAutomationInfo(null);

      const { data, error: fetchError } = await supabase.rpc('get_sentry_navigation_cloud', {
        category_filter: selectedCategory || null,
        limit_count: maxItems,
        include_featured_only: featuredOnly
      });

      if (fetchError) {
        console.error('Error fetching Sentry navigation items:', fetchError);
        setError(fetchError.message);
        return;
      }

      // Transform the data to match our TypeScript interface
      const transformedItems: SentryNavigationItem[] = (data || []).map((item: any) => ({
        id: item.id,
        name: item.name,
        category: item.category,
        subcategory: item.subcategory,
        description: item.description || '',
        url: item.url || '',
        popularityScore: item.popularity_score || 0,
        usageFrequency: item.usage_frequency || 0,
        cloudPositionX: item.cloud_position_x,
        cloudPositionY: item.cloud_position_y,
        cloudSize: item.calculated_size || 1,
        colorCode: item.color_code || '#6B7280',
        isFeatured: item.is_featured || false,
        isNew: item.is_new || false,
        categoryDisplayName: item.category_display_name || '',
        categoryIcon: item.category_icon || '',
        usageToday: item.usage_today || 0,
        usageWeek: item.usage_week || 0,
        calculatedSize: item.calculated_size || 1
      }));

      setItems(transformedItems);
    } catch (err) {
      console.error('Error in fetchLiveNavigationItems:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, maxItems, featuredOnly]);

  const fetchAutomatedNavigationItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const cluster = await fetchLatestAutomatedCluster(
        selectedAutomationSegment,
        'sentry',
      );

      if (!cluster) {
        setItems([]);
        setAutomationInfo(null);
        setError('No automated navigation cloud available for this segment yet.');
        return;
      }

      const mappedItems: SentryNavigationItem[] = (cluster.hashtags || []).map(
        (item: any, index: number) => ({
          id: item.id || `automation-${cluster.segmentKey}-${index}`,
          name: item.name,
          category: item.category || (item.category_name as SentryNavigationCategory) || 'platform',
          subcategory: item.subcategory || '',
          description: item.description || '',
          url: item.url || '',
          popularityScore: item.popularityScore || item.popularity_score || 0,
          usageFrequency: item.usageFrequency || item.usage_frequency || 0,
          cloudPositionX: item.cloudPositionX || item.cloud_position_x,
          cloudPositionY: item.cloudPositionY || item.cloud_position_y,
          cloudSize: item.cloudSize || item.calculated_size || 1,
          colorCode: item.colorCode || item.color_code || '#6B7280',
          isFeatured: Boolean(item.isFeatured ?? item.is_featured),
          isNew: Boolean(item.isNew ?? item.is_new),
          categoryDisplayName: item.categoryDisplayName || item.category_display_name || '',
          categoryIcon: item.categoryIcon || item.category_icon || '',
          usageToday: item.usageToday || item.usage_today || 0,
          usageWeek: item.usageWeek || item.usage_week || 0,
          calculatedSize: item.calculated_size || item.cloudSize || 1,
        }),
      );

      setItems(mappedItems);
      setAutomationInfo({
        generatedAt: cluster.generatedAt,
        segmentLabel:
          automationSegments.find((segment) => segment.key === cluster.segmentKey)?.label ||
          cluster.segmentKey,
      });
    } catch (err) {
      console.error('Error fetching automated Sentry navigation cloud:', err);
      setError('Failed to load automated navigation cloud');
    } finally {
      setLoading(false);
    }
  }, [selectedAutomationSegment, automationSegments]);

  useEffect(() => {
    if (dataSource === 'live') {
      fetchLiveNavigationItems();
    } else {
      fetchAutomatedNavigationItems();
    }
  }, [dataSource, fetchLiveNavigationItems, fetchAutomatedNavigationItems]);

  // Generate cloud positions
  const positionedItems = useMemo(() => {
    if (items.length === 0) return [];

    // Sort by importance (popularity + recent usage)
    const sortedItems = [...items].sort((a, b) => {
      const scoreA = a.popularityScore + (a.usageToday * 5) + (a.usageWeek * 2);
      const scoreB = b.popularityScore + (b.usageToday * 5) + (b.usageWeek * 2);
      return scoreB - scoreA;
    });

    return generateCloudPositions(sortedItems, width, height);
  }, [items, width, height]);

  // Track usage
  const trackUsage = useCallback(async (item: SentryNavigationItem, action: 'view' | 'click' | 'hover') => {
    try {
      await supabase.rpc('track_sentry_navigation_usage', {
        item_name: item.name,
        session_id: 'demo-session', // In real app, use actual session ID
        action_type: action,
        usage_context: `category:${item.category}`
      });
    } catch (error) {
      console.error('Error tracking usage:', error);
    }
  }, []);

  // Handle item interactions
  const handleItemClick = useCallback((item: SentryNavigationItem) => {
    trackUsage(item, 'click');
    if (onItemClick) {
      onItemClick(item);
    } else if (item.url) {
      // Default behavior: open URL
      window.open(item.url, '_blank', 'noopener,noreferrer');
    }
  }, [onItemClick, trackUsage]);

  const handleItemHover = useCallback((item: SentryNavigationItem | null) => {
    setHoveredItem(item);
    if (item) {
      trackUsage(item, 'hover');
    }
    if (onItemHover) {
      onItemHover(item);
    }
  }, [onItemHover, trackUsage]);

  const renderDataSourceControls = () => (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
      <div className="inline-flex rounded-full bg-gray-100 p-1">
        <button
          onClick={() => setDataSource('live')}
          className={`px-4 py-1 text-sm font-medium rounded-full transition-colors ${
            dataSource === 'live'
              ? 'bg-blue-600 text-white shadow'
              : 'text-gray-600 hover:text-blue-600'
          }`}
        >
          Live
        </button>
        <button
          onClick={() => setDataSource('automated')}
          className={`px-4 py-1 text-sm font-medium rounded-full transition-colors ${
            dataSource === 'automated'
              ? 'bg-blue-600 text-white shadow'
              : 'text-gray-600 hover:text-blue-600'
          }`}
        >
          Automated
        </button>
      </div>
      {dataSource === 'automated' && (
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-wide text-gray-500">Segment</span>
          <select
            value={selectedAutomationSegment}
            onChange={(event) => setSelectedAutomationSegment(event.target.value)}
            className="bg-white border border-gray-300 text-sm text-gray-700 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
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

  // Calculate item style based on properties
  const getItemStyle = useCallback((item: SentryNavigationItem) => {
    const baseSize = 12;
    const size = baseSize + (item.calculatedSize - 1) * 8; // Scale font size
    const colors = getCategoryColors(item.category, item.colorCode);
    const colorIndex = Math.floor(item.popularityScore / 20) % colors.length;
    const color = colors[colorIndex];

    return {
      position: 'absolute' as const,
      left: `${item.cloudPositionX}px`,
      top: `${item.cloudPositionY}px`,
      fontSize: `${Math.max(10, Math.min(24, size))}px`,
      fontWeight: item.isFeatured ? 700 : item.isNew ? 600 : 500,
      color: color,
      backgroundColor: hoveredItem?.id === item.id ? `${color}20` : 'transparent',
      padding: '4px 8px',
      borderRadius: '4px',
      cursor: interactive ? 'pointer' : 'default',
      transition: 'all 0.3s ease',
      transform: hoveredItem?.id === item.id ? 'scale(1.1)' : 'scale(1)',
      zIndex: hoveredItem?.id === item.id ? 10 : item.isFeatured ? 5 : 1,
      border: item.isNew ? `2px solid ${color}` : 'none',
      whiteSpace: 'nowrap' as const,
      userSelect: 'none' as const,
    };
  }, [hoveredItem, interactive]);

  if (loading) {
    return (
      <div className="sentry-navigation-cloud">
        {renderDataSourceControls()}
        <div
          className="flex items-center justify-center border border-gray-200 rounded-lg bg-white"
          style={{ width, height }}
        >
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading Sentry navigation...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="sentry-navigation-cloud">
        {renderDataSourceControls()}
        <div
          className="flex items-center justify-center border border-gray-200 rounded-lg bg-white"
          style={{ width, height }}
        >
          <div className="text-center">
            <p className="text-red-600">Error loading navigation: {error}</p>
            <button
              onClick={
                dataSource === 'live'
                  ? fetchLiveNavigationItems
                  : fetchAutomatedNavigationItems
              }
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sentry-navigation-cloud">
      {renderDataSourceControls()}
      {showCategories && (
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory(undefined)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              !selectedCategory
                ? 'bg-gray-800 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All Categories
          </button>
          {categories.map(cat => (
            <button
              key={cat.name}
              onClick={() => setSelectedCategory(cat.name)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === cat.name
                  ? 'text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              style={{
                backgroundColor: selectedCategory === cat.name ? cat.colorCode : undefined
              }}
            >
              {cat.icon} {cat.displayName}
            </button>
          ))}
        </div>
      )}

      <div
        className="relative border border-gray-200 rounded-lg bg-gradient-to-br from-gray-50 to-white overflow-hidden"
        style={{ width, height }}
      >
        {positionedItems.map((item) => (
          <div
            key={item.id}
            style={getItemStyle(item)}
            onClick={() => handleItemClick(item)}
            onMouseEnter={() => handleItemHover(item)}
            onMouseLeave={() => handleItemHover(null)}
            title={item.description}
          >
            <span className="flex items-center gap-1">
              {item.categoryIcon && <span className="text-xs">{item.categoryIcon}</span>}
              {item.name}
              {item.isNew && <span className="text-xs">✨</span>}
              {item.isFeatured && <span className="text-xs">⭐</span>}
            </span>
          </div>
        ))}

        {/* Hover tooltip */}
        {hoveredItem && (
          <div
            className="absolute bg-black text-white p-2 rounded shadow-lg z-20 pointer-events-none"
            style={{
              left: `${hoveredItem.cloudPositionX}px`,
              top: `${(hoveredItem.cloudPositionY || 0) - 60}px`,
              transform: 'translateX(-50%)',
            }}
          >
            <div className="text-sm font-semibold">{hoveredItem.name}</div>
            <div className="text-xs text-gray-300 mt-1">{hoveredItem.description}</div>
            <div className="text-xs text-gray-400 mt-1">
              Popularity: {hoveredItem.popularityScore}% |
              Usage: {hoveredItem.usageToday} today, {hoveredItem.usageWeek} this week
            </div>
          </div>
        )}

        {dataSource === 'automated' && automationInfo && (
          <div className="absolute top-2 left-2 text-xs font-medium text-gray-600 bg-white bg-opacity-80 p-2 rounded">
            Automated · {automationInfo.segmentLabel} ·{' '}
            {new Date(automationInfo.generatedAt).toLocaleString()}
          </div>
        )}

        {/* Legend */}
        <div className="absolute bottom-2 left-2 text-xs text-gray-500 bg-white bg-opacity-80 p-2 rounded">
          <div>✨ New feature | ⭐ Featured | Size = popularity + usage</div>
          <div>Click to visit | Hover for details</div>
        </div>

        {/* Category indicator */}
        {selectedCategory && (
          <div className="absolute top-2 right-2 text-sm font-medium text-gray-600 bg-white bg-opacity-80 p-2 rounded">
            {categories.find(c => c.name === selectedCategory)?.icon}{' '}
            {categories.find(c => c.name === selectedCategory)?.displayName}
          </div>
        )}
      </div>
    </div>
  );
};

export default SentryNavigationCloud;