import React, { Suspense, ComponentType, memo } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

// Loading skeleton component for better perceived performance
const LoadingSkeleton: React.FC<{ height?: string; className?: string }> = ({
  height = 'h-64',
  className = ''
}) => (
  <div className={`animate-pulse bg-gray-800 rounded-lg ${height} ${className}`}>
    <div className="p-6 space-y-4">
      <div className="h-4 bg-gray-700 rounded w-3/4"></div>
      <div className="h-4 bg-gray-700 rounded w-1/2"></div>
      <div className="h-32 bg-gray-700 rounded"></div>
      <div className="flex space-x-4">
        <div className="h-10 bg-gray-700 rounded w-24"></div>
        <div className="h-10 bg-gray-700 rounded w-24"></div>
      </div>
    </div>
  </div>
);

// Compact loading spinner for smaller components
const LoadingSpinner: React.FC = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-500 border-t-transparent"></div>
    <span className="ml-3 text-gray-400">Loading...</span>
  </div>
);

// Error fallback component
const ErrorFallback: React.FC<{ error: Error; resetErrorBoundary: () => void }> = ({
  error,
  resetErrorBoundary
}) => (
  <div className="p-6 bg-red-900/20 border border-red-500/50 rounded-lg">
    <h2 className="text-lg font-semibold text-red-300 mb-2">Something went wrong</h2>
    <p className="text-red-400 mb-4">
      {error.message || 'An unexpected error occurred while loading this component.'}
    </p>
    <div className="flex space-x-3">
      <button
        onClick={resetErrorBoundary}
        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
      >
        Try Again
      </button>
      <button
        onClick={() => window.location.reload()}
        className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors"
      >
        Refresh Page
      </button>
    </div>
  </div>
);

// Props for the loading wrapper
interface LoadingWrapperProps {
  children: React.ReactNode;
  loadingType?: 'skeleton' | 'spinner';
  height?: string;
  className?: string;
  onError?: (error: Error, errorInfo: any) => void;
}

// High-order component for wrapping lazy-loaded components
export const LoadingWrapper: React.FC<LoadingWrapperProps> = memo(({
  children,
  loadingType = 'skeleton',
  height,
  className,
  onError
}) => {
  const LoadingComponent = loadingType === 'spinner' ? LoadingSpinner : LoadingSkeleton;

  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={onError}
      onReset={() => window.location.reload()}
    >
      <Suspense fallback={<LoadingComponent height={height} className={className} />}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
});

LoadingWrapper.displayName = 'LoadingWrapper';

// Higher-order component for creating lazy-loaded components with loading wrapper
export const withLazyLoading = <P extends object>(
  Component: ComponentType<P>,
  loadingOptions: {
    loadingType?: 'skeleton' | 'spinner';
    height?: string;
    className?: string;
    preloadOnHover?: boolean;
  } = {}
) => {
  const LazyComponent = memo((props: P) => (
    <LoadingWrapper {...loadingOptions}>
      <Component {...props} />
    </LoadingWrapper>
  ));

  LazyComponent.displayName = `withLazyLoading(${Component.displayName || Component.name})`;

  return LazyComponent;
};

// Preload component on interaction (hover, focus)
export const usePreloadOnInteraction = (preloadFn: () => void, enabled = true) => {
  return enabled ? {
    onMouseEnter: preloadFn,
    onFocus: preloadFn
  } : {};
};

// Component for progressive loading based on viewport
export const LazySection: React.FC<{
  children: React.ReactNode;
  rootMargin?: string;
  threshold?: number;
  placeholder?: React.ReactNode;
}> = ({ children, rootMargin = '100px', threshold = 0.1, placeholder }) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin, threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [rootMargin, threshold]);

  return (
    <div ref={ref}>
      {isVisible ? children : (placeholder || <LoadingSkeleton />)}
    </div>
  );
};