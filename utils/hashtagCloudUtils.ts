import { HashtagSize } from '../types';
import { HashtagCloudItem } from '../components/HashtagCloud';

export interface CloudLayoutConfig {
  containerWidth: number;
  containerHeight: number;
  centerX: number;
  centerY: number;
  maxRadius: number;
  spiralTightness: number;
  priorityZoneRadius: number;
}

export interface CloudLayoutResult {
  x: number;
  y: number;
  collision: boolean;
}

/**
 * Calculate font size multiplier based on hashtag metrics
 */
export const calculateFontSizeMultiplier = (
  item: HashtagCloudItem,
  maxTrending: number,
  maxFrequency: number
): number => {
  const baseSize = getSizeBaseValue(item.size as HashtagSize);
  const trendingBoost = maxTrending > 0 ? (item.trending_score / maxTrending) * 0.3 : 0;
  const frequencyBoost = maxFrequency > 0 ? (item.frequency / maxFrequency) * 0.2 : 0;

  return Math.max(0.6, Math.min(2.0, baseSize + trendingBoost + frequencyBoost));
};

/**
 * Get base size value for different hashtag sizes
 */
export const getSizeBaseValue = (size: HashtagSize): number => {
  switch (size) {
    case HashtagSize.Mega:
      return 1.8;
    case HashtagSize.Large:
      return 1.4;
    case HashtagSize.Medium:
      return 1.0;
    case HashtagSize.Small:
      return 0.8;
    case HashtagSize.Micro:
      return 0.6;
    default:
      return 1.0;
  }
};

/**
 * Calculate priority score for hashtag positioning
 */
export const calculatePriorityScore = (item: HashtagCloudItem): number => {
  const sizeWeight = getSizeBaseValue(item.size as HashtagSize) * 10;
  const trendingWeight = item.trending_score * 5;
  const frequencyWeight = Math.log(item.frequency + 1) * 2;
  const popularityWeight = item.popularity_score * 3;

  return sizeWeight + trendingWeight + frequencyWeight + popularityWeight;
};

/**
 * Generate spiral coordinates for hashtag placement
 */
export const generateSpiralCoordinates = (
  index: number,
  config: CloudLayoutConfig
): { x: number; y: number } => {
  const angle = index * config.spiralTightness;
  const radius = Math.min(
    config.maxRadius,
    Math.sqrt(index) * 15 + config.priorityZoneRadius
  );

  const x = config.centerX + Math.cos(angle) * radius;
  const y = config.centerY + Math.sin(angle) * radius;

  return {
    x: Math.max(30, Math.min(config.containerWidth - 30, x)),
    y: Math.max(20, Math.min(config.containerHeight - 20, y))
  };
};

/**
 * Check for collision between two positioned hashtags
 */
export const checkCollision = (
  pos1: { x: number; y: number; width: number; height: number },
  pos2: { x: number; y: number; width: number; height: number },
  padding: number = 10
): boolean => {
  return !(
    pos1.x + pos1.width + padding < pos2.x ||
    pos2.x + pos2.width + padding < pos1.x ||
    pos1.y + pos1.height + padding < pos2.y ||
    pos2.y + pos2.height + padding < pos1.y
  );
};

/**
 * Calculate optimal layout for hashtag cloud
 */
export const calculateOptimalLayout = (
  hashtags: HashtagCloudItem[],
  containerWidth: number,
  containerHeight: number
): HashtagCloudItem[] => {
  if (hashtags.length === 0) return [];

  const config: CloudLayoutConfig = {
    containerWidth,
    containerHeight,
    centerX: containerWidth / 2,
    centerY: containerHeight / 2,
    maxRadius: Math.min(containerWidth, containerHeight) / 3,
    spiralTightness: 0.3,
    priorityZoneRadius: 40
  };

  // Sort hashtags by priority
  const sortedHashtags = [...hashtags].sort(
    (a, b) => calculatePriorityScore(b) - calculatePriorityScore(a)
  );

  const positioned: Array<HashtagCloudItem & {
    width: number;
    height: number;
  }> = [];

  const maxTrending = Math.max(...hashtags.map(h => h.trending_score));
  const maxFrequency = Math.max(...hashtags.map(h => h.frequency));

  return sortedHashtags.map((hashtag, index) => {
    const fontMultiplier = calculateFontSizeMultiplier(hashtag, maxTrending, maxFrequency);

    // Estimate text dimensions (rough approximation)
    const estimatedWidth = hashtag.name.length * 8 * fontMultiplier;
    const estimatedHeight = 20 * fontMultiplier;

    let position: { x: number; y: number };
    let attempts = 0;
    const maxAttempts = 50;

    // Try to find non-colliding position
    do {
      if (index < 5) {
        // High priority hashtags get premium spots
        const angle = (index * 72) * (Math.PI / 180); // Pentagon distribution
        const radius = 30 + (attempts * 10);
        position = {
          x: config.centerX + Math.cos(angle) * radius,
          y: config.centerY + Math.sin(angle) * radius
        };
      } else {
        // Use spiral for others
        position = generateSpiralCoordinates(index + attempts, config);
      }

      // Check for collisions with existing positioned hashtags
      const hasCollision = positioned.some(existing =>
        checkCollision(
          { x: position.x, y: position.y, width: estimatedWidth, height: estimatedHeight },
          existing,
          5
        )
      );

      if (!hasCollision || attempts >= maxAttempts) {
        break;
      }

      attempts++;
    } while (attempts < maxAttempts);

    // Ensure position is within bounds
    position.x = Math.max(estimatedWidth / 2, Math.min(containerWidth - estimatedWidth / 2, position.x));
    position.y = Math.max(estimatedHeight / 2, Math.min(containerHeight - estimatedHeight / 2, position.y));

    // Add to positioned array for collision detection
    positioned.push({
      ...hashtag,
      width: estimatedWidth,
      height: estimatedHeight,
      cloud_position_x: position.x,
      cloud_position_y: position.y
    });

    return {
      ...hashtag,
      cloud_position_x: position.x,
      cloud_position_y: position.y
    };
  });
};

/**
 * Filter hashtags based on search criteria
 */
export const filterHashtagsForCloud = (
  hashtags: HashtagCloudItem[],
  filters: {
    searchTerm?: string;
    selectedSizes?: Set<HashtagSize>;
    showTrendingOnly?: boolean;
    categoryFilter?: string;
    minFrequency?: number;
  }
): HashtagCloudItem[] => {
  return hashtags.filter(hashtag => {
    // Search term filter
    if (filters.searchTerm && !hashtag.name.toLowerCase().includes(filters.searchTerm.toLowerCase())) {
      return false;
    }

    // Size filter
    if (filters.selectedSizes && !filters.selectedSizes.has(hashtag.size as HashtagSize)) {
      return false;
    }

    // Trending filter
    if (filters.showTrendingOnly && hashtag.trending_score <= 0) {
      return false;
    }

    // Category filter
    if (filters.categoryFilter && hashtag.category_name !== filters.categoryFilter) {
      return false;
    }

    // Minimum frequency filter
    if (filters.minFrequency && hashtag.frequency < filters.minFrequency) {
      return false;
    }

    return true;
  });
};

/**
 * Sort hashtags for cloud display
 */
export const sortHashtagsForCloud = (
  hashtags: HashtagCloudItem[],
  sortBy: 'trending' | 'frequency' | 'popularity' | 'alphabetical' = 'trending'
): HashtagCloudItem[] => {
  return [...hashtags].sort((a, b) => {
    switch (sortBy) {
      case 'frequency':
        return b.frequency - a.frequency;
      case 'popularity':
        return b.popularity_score - a.popularity_score;
      case 'alphabetical':
        return a.name.localeCompare(b.name);
      case 'trending':
      default:
        // Multi-factor trending sort
        const aTrendingScore = a.trending_score + (a.frequency * 0.1) + (a.popularity_score * 0.05);
        const bTrendingScore = b.trending_score + (b.frequency * 0.1) + (b.popularity_score * 0.05);
        return bTrendingScore - aTrendingScore;
    }
  });
};

/**
 * Get CSS classes for hashtag styling based on properties
 */
export const getHashtagCloudStyling = (
  hashtag: HashtagCloudItem,
  isSelected: boolean,
  maxTrending: number,
  maxFrequency: number
) => {
  const fontMultiplier = calculateFontSizeMultiplier(hashtag, maxTrending, maxFrequency);
  const opacity = Math.max(0.4, Math.min(1, 0.6 + (hashtag.trending_score / maxTrending) * 0.4));

  const sizeClasses = {
    [HashtagSize.Mega]: 'text-3xl font-bold',
    [HashtagSize.Large]: 'text-2xl font-semibold',
    [HashtagSize.Medium]: 'text-xl font-medium',
    [HashtagSize.Small]: 'text-lg font-normal',
    [HashtagSize.Micro]: 'text-base font-light'
  };

  const colorClasses = {
    [HashtagSize.Mega]: 'text-red-400 hover:text-red-300',
    [HashtagSize.Large]: 'text-orange-400 hover:text-orange-300',
    [HashtagSize.Medium]: 'text-green-400 hover:text-green-300',
    [HashtagSize.Small]: 'text-blue-400 hover:text-blue-300',
    [HashtagSize.Micro]: 'text-purple-400 hover:text-purple-300'
  };

  return {
    fontSize: `${fontMultiplier}rem`,
    opacity,
    className: `
      ${sizeClasses[hashtag.size as HashtagSize] || sizeClasses[HashtagSize.Medium]}
      ${isSelected ? 'text-white bg-purple-600 px-2 py-1 rounded-md shadow-lg' : colorClasses[hashtag.size as HashtagSize]}
      ${hashtag.trending_score > 5 ? 'animate-pulse' : ''}
      transition-all duration-300 ease-in-out cursor-pointer transform hover:scale-110
    `.trim()
  };
};

/**
 * Generate analytics data for hashtag cloud performance
 */
export const generateCloudAnalytics = (hashtags: HashtagCloudItem[]) => {
  if (hashtags.length === 0) {
    return {
      totalHashtags: 0,
      trendingCount: 0,
      avgTrendingScore: 0,
      topCategory: null,
      sizeDistribution: {},
      usageMetrics: {
        totalUsage: 0,
        avgFrequency: 0,
        mostActive: null
      }
    };
  }

  const trendingCount = hashtags.filter(h => h.trending_score > 0).length;
  const avgTrendingScore = hashtags.reduce((sum, h) => sum + h.trending_score, 0) / hashtags.length;

  // Category analysis
  const categoryCount = hashtags.reduce((acc, h) => {
    acc[h.category_name] = (acc[h.category_name] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topCategory = Object.entries(categoryCount)
    .sort(([,a], [,b]) => b - a)[0]?.[0] || null;

  // Size distribution
  const sizeDistribution = hashtags.reduce((acc, h) => {
    acc[h.size] = (acc[h.size] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Usage metrics
  const totalUsage = hashtags.reduce((sum, h) => sum + h.frequency, 0);
  const avgFrequency = totalUsage / hashtags.length;
  const mostActive = hashtags.reduce((max, h) =>
    h.frequency > max.frequency ? h : max, hashtags[0]);

  return {
    totalHashtags: hashtags.length,
    trendingCount,
    avgTrendingScore: Number(avgTrendingScore.toFixed(2)),
    topCategory,
    sizeDistribution,
    usageMetrics: {
      totalUsage,
      avgFrequency: Number(avgFrequency.toFixed(2)),
      mostActive: mostActive?.name || null
    }
  };
};