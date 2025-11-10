/**
 * Integration Example - How to integrate the UX Testing Suite into your application
 *
 * This example shows how to add the testing suite to your viral hashtag & image AI application
 * with proper configuration and integration with existing components.
 */

import React, { useState, useEffect } from 'react';
import { UXTestSuite, PerformanceMonitor, type PerformanceData } from './index';
import { useAccessibility } from '../../hooks/useAccessibility';

// Example: Adding UX Testing to your main application
export const AppWithTesting: React.FC = () => {
  const { announce } = useAccessibility();
  const [showTesting, setShowTesting] = useState(false);
  const [performanceData, setPerformanceData] = useState<PerformanceData>({
    renderTime: 0,
    memoryUsage: 0,
    networkLatency: 0,
    framerate: 60,
    largestContentfulPaint: 0,
    firstInputDelay: 0,
    cumulativeLayoutShift: 0
  });

  // Performance monitoring hook
  useEffect(() => {
    let animationFrame: number;
    let lastTime = performance.now();
    let frameCount = 0;

    const updatePerformance = () => {
      const now = performance.now();
      frameCount++;

      // Calculate framerate every second
      if (now - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (now - lastTime));
        frameCount = 0;
        lastTime = now;

        setPerformanceData(prev => ({
          ...prev,
          framerate: fps,
          renderTime: now,
          memoryUsage: (performance as any).memory?.usedJSHeapSize / 1024 / 1024 || 0
        }));
      }

      animationFrame = requestAnimationFrame(updatePerformance);
    };

    updatePerformance();

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, []);

  // Web Vitals monitoring
  useEffect(() => {
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        switch (entry.entryType) {
          case 'largest-contentful-paint':
            setPerformanceData(prev => ({
              ...prev,
              largestContentfulPaint: entry.startTime
            }));
            break;
          case 'first-input':
            setPerformanceData(prev => ({
              ...prev,
              firstInputDelay: (entry as any).processingStart - entry.startTime
            }));
            break;
          case 'layout-shift':
            setPerformanceData(prev => ({
              ...prev,
              cumulativeLayoutShift: prev.cumulativeLayoutShift + (entry as any).value
            }));
            break;
        }
      });
    });

    try {
      observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });
    } catch (error) {
      console.warn('Performance Observer not supported:', error);
    }

    return () => observer.disconnect();
  }, []);

  // Toggle testing suite visibility
  const toggleTesting = () => {
    setShowTesting(!showTesting);
    announce(`Testing suite ${!showTesting ? 'opened' : 'closed'}`);
  };

  // Development-only testing access
  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <div className="app-container">
      {/* Your existing application content */}
      <div className="main-app">
        {/* App content goes here */}
        <h1>Viral Hashtag & Image AI</h1>
        <p>Your application content...</p>
      </div>

      {/* Development testing controls */}
      {isDevelopment && (
        <div className="development-controls">
          <button
            onClick={toggleTesting}
            className="fixed bottom-4 right-4 z-50 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label={`${showTesting ? 'Close' : 'Open'} UX testing suite`}
          >
            {showTesting ? '🔬 Close Tests' : '🧪 Open Tests'}
          </button>

          {/* Performance monitor (always visible in dev) */}
          <div className="fixed top-4 right-4 z-40">
            <div className="bg-gray-900 text-white p-2 rounded-lg text-xs">
              <div>FPS: {performanceData.framerate}</div>
              <div>Mem: {performanceData.memoryUsage.toFixed(1)}MB</div>
              <div>LCP: {performanceData.largestContentfulPaint.toFixed(0)}ms</div>
            </div>
          </div>
        </div>
      )}

      {/* UX Testing Suite Modal */}
      {showTesting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-7xl h-full max-h-[90vh] overflow-hidden">
            <UXTestSuite />
          </div>
        </div>
      )}
    </div>
  );
};

// Example: Integrating with existing components
export const HashtagCloudWithTesting: React.FC<{
  hashtags: string[];
  onHashtagSelect: (hashtag: string) => void;
  enableTesting?: boolean;
}> = ({ hashtags, onHashtagSelect, enableTesting = false }) => {
  const [testMode, setTestMode] = useState(false);

  return (
    <div
      className="hashtag-cloud-container"
      data-testid="hashtag-cloud"
    >
      {/* Testing overlay for this component */}
      {enableTesting && testMode && (
        <div className="absolute inset-0 bg-blue-500 bg-opacity-20 border-2 border-blue-500 rounded-lg pointer-events-none">
          <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
            Testing: Hashtag Cloud
          </div>
        </div>
      )}

      {/* Your existing hashtag cloud implementation */}
      <div className="hashtag-grid">
        {hashtags.map((hashtag, index) => (
          <button
            key={hashtag}
            data-testid="hashtag-item"
            data-hashtag={hashtag}
            onClick={() => onHashtagSelect(hashtag)}
            className="hashtag-item px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label={`Select hashtag ${hashtag}`}
          >
            {hashtag}
          </button>
        ))}
      </div>

      {/* Test mode toggle (development only) */}
      {enableTesting && process.env.NODE_ENV === 'development' && (
        <button
          onClick={() => setTestMode(!testMode)}
          className="absolute top-2 right-2 bg-gray-600 text-white text-xs px-2 py-1 rounded opacity-50 hover:opacity-100"
          aria-label="Toggle test mode for hashtag cloud"
        >
          {testMode ? 'Hide Test' : 'Show Test'}
        </button>
      )}
    </div>
  );
};

// Example: Performance-aware component wrapper
export const PerformanceAwareComponent: React.FC<{
  children: React.ReactNode;
  componentName: string;
}> = ({ children, componentName }) => {
  const [renderTime, setRenderTime] = useState<number>(0);

  useEffect(() => {
    const startTime = performance.now();

    // Measure render time
    const measureRender = () => {
      const endTime = performance.now();
      setRenderTime(endTime - startTime);

      // Log performance warning if render time is high
      if (endTime - startTime > 100) {
        console.warn(`Slow render detected for ${componentName}: ${(endTime - startTime).toFixed(2)}ms`);
      }
    };

    // Use requestAnimationFrame to measure after render
    requestAnimationFrame(measureRender);
  }, [componentName]);

  return (
    <div
      data-testid={`performance-wrapper-${componentName.toLowerCase().replace(/\s+/g, '-')}`}
      data-render-time={renderTime}
    >
      {children}

      {/* Development performance indicator */}
      {process.env.NODE_ENV === 'development' && renderTime > 0 && (
        <div className="performance-indicator">
          <span className={`text-xs ${renderTime > 100 ? 'text-red-500' : renderTime > 50 ? 'text-yellow-500' : 'text-green-500'}`}>
            {componentName}: {renderTime.toFixed(1)}ms
          </span>
        </div>
      )}
    </div>
  );
};

// Example: Accessibility-aware form component
export const AccessibleFormField: React.FC<{
  label: string;
  id: string;
  type?: string;
  required?: boolean;
  error?: string;
  value: string;
  onChange: (value: string) => void;
}> = ({ label, id, type = 'text', required = false, error, value, onChange }) => {
  return (
    <div className="form-field">
      <label
        htmlFor={id}
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        {label}
        {required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
      </label>

      <input
        type={type}
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        data-testid={`input-${id}`}
        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          error ? 'border-red-500' : 'border-gray-300'
        }`}
      />

      {error && (
        <div
          id={`${id}-error`}
          role="alert"
          className="text-red-500 text-sm mt-1"
          data-testid={`error-${id}`}
        >
          {error}
        </div>
      )}
    </div>
  );
};

// Example: Test data provider for development
export const TestDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [testData, setTestData] = useState<any>(null);

  // Load test data in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const mockData = {
        hashtags: ['#viral', '#trending', '#ai', '#content', '#social'],
        users: [{ id: '1', name: 'Test User', email: 'test@example.com' }],
        performance: {
          simulateSlowness: false,
          networkDelay: 0,
          errorRate: 0
        }
      };
      setTestData(mockData);
    }
  }, []);

  return (
    <div data-test-environment={process.env.NODE_ENV}>
      {children}
      {testData && (
        <div
          id="test-data"
          data-testid="test-data-provider"
          style={{ display: 'none' }}
          aria-hidden="true"
        >
          {JSON.stringify(testData)}
        </div>
      )}
    </div>
  );
};

// Export the main integration component
export default AppWithTesting;