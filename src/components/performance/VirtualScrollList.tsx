import React, { useMemo, useCallback, useRef, useState, useEffect, memo } from 'react';
import { useVirtualScrolling, useDebounce, useMemoizedFilter } from '../../hooks/usePerformance';

interface VirtualScrollListProps<T> {
  items: T[];
  itemHeight: number;
  height: number;
  renderItem: (item: T, index: number, style: React.CSSProperties) => React.ReactNode;
  searchQuery?: string;
  filterFn?: (item: T, query: string) => boolean;
  className?: string;
  onScroll?: (scrollTop: number) => void;
  overscan?: number;
  getItemKey?: (item: T, index: number) => string | number;
}

// Generic virtual scrolling component for performance optimization
export const VirtualScrollList = memo(<T extends any>({
  items,
  itemHeight,
  height,
  renderItem,
  searchQuery = '',
  filterFn,
  className = '',
  onScroll,
  overscan = 5,
  getItemKey
}: VirtualScrollListProps<T>) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(height);

  // Filter items based on search query
  const filteredItems = useMemoizedFilter(
    items,
    filterFn || (() => true),
    searchQuery,
    [items, searchQuery, filterFn]
  );

  // Virtual scrolling logic
  const {
    visibleItems,
    totalHeight,
    handleScroll: handleVirtualScroll
  } = useVirtualScrolling(filteredItems, itemHeight, containerHeight, overscan);

  // Combined scroll handler
  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    handleVirtualScroll(event);
    onScroll?.(event.currentTarget.scrollTop);
  }, [handleVirtualScroll, onScroll]);

  // Update container height on resize
  useEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      if (entries[0]) {
        setContainerHeight(entries[0].contentRect.height);
      }
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, []);

  // Generate key for each item
  const getKey = useCallback((item: T, index: number) => {
    return getItemKey?.(item, index) ?? index;
  }, [getItemKey]);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleItems.map(({ item, index, offsetY }) => {
          const style: React.CSSProperties = {
            position: 'absolute',
            top: offsetY,
            left: 0,
            right: 0,
            height: itemHeight,
            zIndex: 1
          };

          return (
            <div key={getKey(item, index)} style={style}>
              {renderItem(item, index, style)}
            </div>
          );
        })}
      </div>
    </div>
  );
});

VirtualScrollList.displayName = 'VirtualScrollList';

// Specialized hashtag virtual list component
interface HashtagVirtualListProps {
  hashtags: Array<{ name: string; count: string; description?: string }>;
  onSelect: (hashtag: string) => void;
  selectedHashtags: Set<string>;
  searchQuery?: string;
  className?: string;
  itemHeight?: number;
  height?: number;
}

export const HashtagVirtualList = memo<HashtagVirtualListProps>(({
  hashtags,
  onSelect,
  selectedHashtags,
  searchQuery = '',
  className = '',
  itemHeight = 60,
  height = 400
}) => {
  // Optimized hashtag filter function
  const filterHashtag = useCallback((hashtag: { name: string; description?: string }, query: string) => {
    const lowerQuery = query.toLowerCase();
    return (
      hashtag.name.toLowerCase().includes(lowerQuery) ||
      (hashtag.description && hashtag.description.toLowerCase().includes(lowerQuery))
    );
  }, []);

  // Render individual hashtag item
  const renderHashtagItem = useCallback((
    hashtag: { name: string; count: string; description?: string },
    index: number,
    style: React.CSSProperties
  ) => {
    const isSelected = selectedHashtags.has(hashtag.name);

    return (
      <div
        className={`
          flex items-center justify-between p-3 border border-gray-700 rounded-lg
          cursor-pointer transition-all duration-200 hover:border-purple-500
          ${isSelected ? 'bg-purple-500/20 border-purple-400' : 'bg-gray-800/50 hover:bg-gray-700/50'}
        `}
        onClick={() => onSelect(hashtag.name)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelect(hashtag.name);
          }
        }}
        aria-label={`Toggle hashtag ${hashtag.name}`}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-white truncate">#{hashtag.name}</span>
            <span className="text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded-full">
              {hashtag.count}
            </span>
          </div>
          {hashtag.description && (
            <p className="text-xs text-gray-400 mt-1 truncate">
              {hashtag.description}
            </p>
          )}
        </div>
        <div className={`
          w-5 h-5 rounded-full border-2 flex items-center justify-center
          ${isSelected ? 'border-purple-400 bg-purple-500' : 'border-gray-500'}
        `}>
          {isSelected && (
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          )}
        </div>
      </div>
    );
  }, [selectedHashtags, onSelect]);

  // Get unique key for hashtag
  const getHashtagKey = useCallback((hashtag: { name: string }, index: number) => {
    return hashtag.name;
  }, []);

  return (
    <VirtualScrollList
      items={hashtags}
      itemHeight={itemHeight}
      height={height}
      renderItem={renderHashtagItem}
      searchQuery={searchQuery}
      filterFn={filterHashtag}
      className={className}
      getItemKey={getHashtagKey}
    />
  );
});

HashtagVirtualList.displayName = 'HashtagVirtualList';

// Performance metrics component
export const VirtualListPerformanceMetrics: React.FC<{
  totalItems: number;
  visibleItems: number;
  renderTime: number;
}> = memo(({ totalItems, visibleItems, renderTime }) => {
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-2 rounded text-xs font-mono">
      <div>Total: {totalItems}</div>
      <div>Visible: {visibleItems}</div>
      <div>Render: {renderTime.toFixed(2)}ms</div>
    </div>
  );
});

VirtualListPerformanceMetrics.displayName = 'VirtualListPerformanceMetrics';