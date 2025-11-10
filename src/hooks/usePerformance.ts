import { useCallback, useMemo, useRef, useEffect, useState } from 'react';

// Debounce hook for performance optimization
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Throttle hook for limiting function calls
export const useThrottle = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): T => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastExecRef = useRef(0);

  return useCallback(
    ((...args: any[]) => {
      const currentTime = Date.now();

      if (currentTime - lastExecRef.current > delay) {
        func(...args);
        lastExecRef.current = currentTime;
      } else {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
          func(...args);
          lastExecRef.current = Date.now();
        }, delay - (currentTime - lastExecRef.current));
      }
    }) as T,
    [func, delay]
  );
};

// Optimized search hook with debouncing
export const useDebouncedSearch = (
  searchFn: (query: string) => void,
  delay: number = 300
) => {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, delay);

  useEffect(() => {
    if (debouncedQuery.trim()) {
      searchFn(debouncedQuery);
    }
  }, [debouncedQuery, searchFn]);

  return { query, setQuery, debouncedQuery };
};

// Memoized filter hook for large datasets
export const useMemoizedFilter = <T>(
  items: T[],
  filterFn: (item: T, query: string) => boolean,
  query: string,
  deps: any[] = []
) => {
  return useMemo(() => {
    if (!query.trim()) return items;
    return items.filter(item => filterFn(item, query.toLowerCase()));
  }, [items, query, filterFn, ...deps]);
};

// Virtual scrolling hook for large lists
export const useVirtualScrolling = <T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  overscan: number = 5
) => {
  const [scrollTop, setScrollTop] = useState(0);

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.floor((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const visibleItems = useMemo(() => {
    return items.slice(startIndex, endIndex + 1).map((item, index) => ({
      item,
      index: startIndex + index,
      offsetY: (startIndex + index) * itemHeight
    }));
  }, [items, startIndex, endIndex, itemHeight]);

  const totalHeight = items.length * itemHeight;

  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
  }, []);

  return {
    visibleItems,
    totalHeight,
    handleScroll,
    startIndex,
    endIndex
  };
};

// Performance monitoring hook
export const usePerformanceMonitor = (componentName: string) => {
  const renderStartTime = useRef<number>();
  const renderCount = useRef(0);

  useEffect(() => {
    renderStartTime.current = performance.now();
    renderCount.current++;

    return () => {
      if (renderStartTime.current) {
        const renderTime = performance.now() - renderStartTime.current;
        console.debug(`${componentName} render #${renderCount.current}: ${renderTime.toFixed(2)}ms`);
      }
    };
  });

  const measureAsyncOperation = useCallback(async <T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> => {
    const start = performance.now();
    try {
      const result = await operation();
      const duration = performance.now() - start;
      console.debug(`${componentName} ${operationName}: ${duration.toFixed(2)}ms`);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      console.error(`${componentName} ${operationName} failed after ${duration.toFixed(2)}ms:`, error);
      throw error;
    }
  }, [componentName]);

  return { measureAsyncOperation };
};

// Optimized event handlers hook
export const useOptimizedHandlers = <T extends Record<string, any>>(
  handlers: T,
  deps: any[] = []
): T => {
  return useMemo(() => {
    const optimizedHandlers: any = {};

    Object.entries(handlers).forEach(([key, handler]) => {
      if (typeof handler === 'function') {
        optimizedHandlers[key] = useCallback(handler, deps);
      } else {
        optimizedHandlers[key] = handler;
      }
    });

    return optimizedHandlers;
  }, [...deps]);
};

// Memory leak prevention hook
export const useCleanup = (cleanupFn: () => void, deps: any[] = []) => {
  const cleanupRef = useRef<() => void>();

  useEffect(() => {
    cleanupRef.current = cleanupFn;
  }, deps);

  useEffect(() => {
    return () => {
      cleanupRef.current?.();
    };
  }, []);
};

// Efficient state updates hook
export const useBatchedState = <T>(initialState: T) => {
  const [state, setState] = useState(initialState);
  const batchedUpdates = useRef<Partial<T>[]>([]);

  const setBatchedState = useCallback((updates: Partial<T>) => {
    batchedUpdates.current.push(updates);

    // Use setTimeout to batch updates in the next tick
    setTimeout(() => {
      if (batchedUpdates.current.length > 0) {
        const allUpdates = batchedUpdates.current.reduce(
          (acc, update) => ({ ...acc, ...update }),
          {}
        );
        setState(prev => ({ ...prev, ...allUpdates }));
        batchedUpdates.current = [];
      }
    }, 0);
  }, []);

  return [state, setBatchedState] as const;
};

// Intersection Observer hook for lazy loading
export const useIntersectionObserver = (
  options: IntersectionObserverInit = {},
  triggerOnce: boolean = true
) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const targetRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(([entry]) => {
      const { isIntersecting } = entry;
      setIsIntersecting(isIntersecting);

      if (isIntersecting) {
        setHasIntersected(true);
        if (triggerOnce) {
          observer.disconnect();
        }
      }
    }, options);

    observer.observe(target);

    return () => observer.disconnect();
  }, [options.threshold, options.rootMargin, triggerOnce]);

  return { targetRef, isIntersecting, hasIntersected };
};