import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAccessibility } from '../../hooks/useAccessibility';

export interface PerformanceData {
  renderTime: number;
  memoryUsage: number;
  networkLatency: number;
  framerate: number;
  largestContentfulPaint: number;
  firstInputDelay: number;
  cumulativeLayoutShift: number;
}

export interface PerformanceThresholds {
  renderTime: number;
  memoryUsage: number;
  networkLatency: number;
  interactionDelay: number;
}

interface PerformanceHistory {
  timestamp: number;
  data: PerformanceData;
}

interface ComponentPerformance {
  name: string;
  renderCount: number;
  avgRenderTime: number;
  maxRenderTime: number;
  lastRenderTime: number;
  memoryImpact: number;
  isOptimized: boolean;
}

export interface PerformanceMonitorProps {
  data: PerformanceData;
  thresholds: PerformanceThresholds;
  onAlert?: (metric: string, value: number, threshold: number) => void;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  data,
  thresholds,
  onAlert
}) => {
  const { announce } = useAccessibility();
  const [history, setHistory] = useState<PerformanceHistory[]>([]);
  const [componentMetrics, setComponentMetrics] = useState<ComponentPerformance[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [alerts, setAlerts] = useState<Array<{metric: string, value: number, timestamp: number}>>([]);
  const historyRef = useRef<PerformanceHistory[]>([]);
  const intervalRef = useRef<NodeJS.Timeout>();

  // Performance profiler for hashtag cloud
  const profileHashtagInteraction = useCallback(async () => {
    const startTime = performance.now();

    // Simulate hashtag click performance test
    try {
      // Mock hashtag cloud interaction
      const hashtagElements = document.querySelectorAll('[data-testid="hashtag-item"]');

      for (let i = 0; i < Math.min(10, hashtagElements.length); i++) {
        const element = hashtagElements[i] as HTMLElement;
        if (element) {
          const clickStart = performance.now();

          // Simulate click event
          element.click();

          // Measure response time
          await new Promise(resolve => setTimeout(resolve, 1));
          const clickEnd = performance.now();

          const responseTime = clickEnd - clickStart;
          if (responseTime > thresholds.interactionDelay) {
            onAlert?.('hashtag_click_delay', responseTime, thresholds.interactionDelay);
          }
        }
      }

      const totalTime = performance.now() - startTime;

      setComponentMetrics(prev => {
        const existing = prev.find(c => c.name === 'HashtagCloud');
        if (existing) {
          return prev.map(c => c.name === 'HashtagCloud' ? {
            ...c,
            renderCount: c.renderCount + 1,
            lastRenderTime: totalTime,
            avgRenderTime: (c.avgRenderTime + totalTime) / 2,
            maxRenderTime: Math.max(c.maxRenderTime, totalTime)
          } : c);
        } else {
          return [...prev, {
            name: 'HashtagCloud',
            renderCount: 1,
            avgRenderTime: totalTime,
            maxRenderTime: totalTime,
            lastRenderTime: totalTime,
            memoryImpact: (performance as any).memory?.usedJSHeapSize || 0,
            isOptimized: totalTime < 50
          }];
        }
      });

      return {
        success: true,
        duration: totalTime,
        metrics: {
          interactionCount: Math.min(10, hashtagElements.length),
          avgResponseTime: totalTime / Math.min(10, hashtagElements.length)
        }
      };
    } catch (error) {
      return {
        success: false,
        duration: performance.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }, [thresholds.interactionDelay, onAlert]);

  // Neural melody performance profiler
  const profileNeuralMelody = useCallback(async () => {
    const startTime = performance.now();

    try {
      // Mock neural audio processing test
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const loadStart = performance.now();

      // Simulate model loading
      await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
      const loadTime = performance.now() - loadStart;

      // Test audio buffer creation
      const bufferStart = performance.now();
      const buffer = audioContext.createBuffer(2, audioContext.sampleRate * 2, audioContext.sampleRate);
      const bufferTime = performance.now() - bufferStart;

      // Test audio processing
      const processStart = performance.now();
      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContext.destination);
      const processTime = performance.now() - processStart;

      audioContext.close();

      const totalTime = performance.now() - startTime;

      setComponentMetrics(prev => {
        const existing = prev.find(c => c.name === 'NeuralMelody');
        if (existing) {
          return prev.map(c => c.name === 'NeuralMelody' ? {
            ...c,
            renderCount: c.renderCount + 1,
            lastRenderTime: totalTime,
            avgRenderTime: (c.avgRenderTime + totalTime) / 2,
            maxRenderTime: Math.max(c.maxRenderTime, totalTime)
          } : c);
        } else {
          return [...prev, {
            name: 'NeuralMelody',
            renderCount: 1,
            avgRenderTime: totalTime,
            maxRenderTime: totalTime,
            lastRenderTime: totalTime,
            memoryImpact: (performance as any).memory?.usedJSHeapSize || 0,
            isOptimized: loadTime < 2000
          }];
        }
      });

      return {
        success: true,
        duration: totalTime,
        metrics: {
          modelLoadTime: loadTime,
          bufferCreateTime: bufferTime,
          audioProcessTime: processTime
        }
      };
    } catch (error) {
      return {
        success: false,
        duration: performance.now() - startTime,
        error: error instanceof Error ? error.message : 'Audio context error'
      };
    }
  }, []);

  // Start continuous performance monitoring
  const startRecording = useCallback(() => {
    setIsRecording(true);

    intervalRef.current = setInterval(() => {
      const currentData: PerformanceHistory = {
        timestamp: Date.now(),
        data: { ...data }
      };

      setHistory(prev => {
        const newHistory = [...prev, currentData];
        historyRef.current = newHistory;

        // Keep only last 100 data points
        return newHistory.slice(-100);
      });

      // Check thresholds and create alerts
      const newAlerts: Array<{metric: string, value: number, timestamp: number}> = [];

      if (data.renderTime > thresholds.renderTime) {
        newAlerts.push({
          metric: 'Render Time',
          value: data.renderTime,
          timestamp: Date.now()
        });
      }

      if (data.memoryUsage > thresholds.memoryUsage) {
        newAlerts.push({
          metric: 'Memory Usage',
          value: data.memoryUsage,
          timestamp: Date.now()
        });
      }

      if (data.networkLatency > thresholds.networkLatency) {
        newAlerts.push({
          metric: 'Network Latency',
          value: data.networkLatency,
          timestamp: Date.now()
        });
      }

      if (data.firstInputDelay > thresholds.interactionDelay) {
        newAlerts.push({
          metric: 'First Input Delay',
          value: data.firstInputDelay,
          timestamp: Date.now()
        });
      }

      if (newAlerts.length > 0) {
        setAlerts(prev => [...prev, ...newAlerts].slice(-10)); // Keep last 10 alerts
        newAlerts.forEach(alert => {
          onAlert?.(alert.metric, alert.value, thresholds.renderTime);
        });
      }
    }, 1000);

    announce('Performance monitoring started');
  }, [data, thresholds, onAlert, announce]);

  const stopRecording = useCallback(() => {
    setIsRecording(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    announce('Performance monitoring stopped');
  }, [announce]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Auto-start recording
  useEffect(() => {
    startRecording();
    return () => stopRecording();
  }, [startRecording, stopRecording]);

  const getMetricStatus = (value: number, threshold: number, inverse: boolean = false) => {
    const isGood = inverse ? value < threshold : value > threshold;
    return isGood ? 'good' : 'warning';
  };

  const formatMetric = (value: number, unit: string = '') => {
    if (value < 1 && unit === 'ms') {
      return `${(value * 1000).toFixed(0)}μs`;
    }
    return `${value.toFixed(1)}${unit}`;
  };

  const exportMetrics = () => {
    const exportData = {
      timestamp: new Date().toISOString(),
      currentData: data,
      history: historyRef.current,
      componentMetrics,
      alerts,
      thresholds
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-metrics-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    announce('Performance metrics exported');
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-white">Performance Monitor</h3>
        <div className="flex gap-2">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 ${
              isRecording
                ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500 text-white'
                : 'bg-green-600 hover:bg-green-700 focus:ring-green-500 text-white'
            }`}
            aria-label={isRecording ? 'Stop performance monitoring' : 'Start performance monitoring'}
          >
            {isRecording ? 'Stop' : 'Start'} Recording
          </button>
          <button
            onClick={exportMetrics}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
            aria-label="Export performance metrics"
          >
            Export
          </button>
        </div>
      </div>

      {/* Real-time Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className={`p-4 rounded-lg ${
          getMetricStatus(data.renderTime, thresholds.renderTime) === 'good'
            ? 'bg-green-900/30 border border-green-500'
            : 'bg-red-900/30 border border-red-500'
        }`}>
          <h4 className="text-sm font-medium text-gray-300 mb-1">Render Time</h4>
          <p className="text-2xl font-bold text-white">{formatMetric(data.renderTime, 'ms')}</p>
          <p className="text-xs text-gray-400">Threshold: {thresholds.renderTime}ms</p>
        </div>

        <div className={`p-4 rounded-lg ${
          getMetricStatus(data.memoryUsage, thresholds.memoryUsage) === 'good'
            ? 'bg-red-900/30 border border-red-500'
            : 'bg-green-900/30 border border-green-500'
        }`}>
          <h4 className="text-sm font-medium text-gray-300 mb-1">Memory Usage</h4>
          <p className="text-2xl font-bold text-white">{formatMetric(data.memoryUsage, 'MB')}</p>
          <p className="text-xs text-gray-400">Threshold: {thresholds.memoryUsage}MB</p>
        </div>

        <div className={`p-4 rounded-lg ${
          data.framerate >= 58
            ? 'bg-green-900/30 border border-green-500'
            : 'bg-yellow-900/30 border border-yellow-500'
        }`}>
          <h4 className="text-sm font-medium text-gray-300 mb-1">Frame Rate</h4>
          <p className="text-2xl font-bold text-white">{data.framerate} FPS</p>
          <p className="text-xs text-gray-400">Target: 60 FPS</p>
        </div>

        <div className={`p-4 rounded-lg ${
          data.cumulativeLayoutShift < 0.1
            ? 'bg-green-900/30 border border-green-500'
            : 'bg-red-900/30 border border-red-500'
        }`}>
          <h4 className="text-sm font-medium text-gray-300 mb-1">Layout Shift</h4>
          <p className="text-2xl font-bold text-white">{data.cumulativeLayoutShift.toFixed(3)}</p>
          <p className="text-xs text-gray-400">Target: &lt; 0.1</p>
        </div>
      </div>

      {/* Core Web Vitals */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-700 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-gray-300 mb-2">Largest Contentful Paint</h4>
          <p className="text-lg font-bold text-white">{formatMetric(data.largestContentfulPaint, 'ms')}</p>
          <div className={`text-sm ${
            data.largestContentfulPaint < 2500 ? 'text-green-400' :
            data.largestContentfulPaint < 4000 ? 'text-yellow-400' :
            'text-red-400'
          }`}>
            {data.largestContentfulPaint < 2500 ? 'Good' :
             data.largestContentfulPaint < 4000 ? 'Needs Improvement' :
             'Poor'}
          </div>
        </div>

        <div className="bg-gray-700 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-gray-300 mb-2">First Input Delay</h4>
          <p className="text-lg font-bold text-white">{formatMetric(data.firstInputDelay, 'ms')}</p>
          <div className={`text-sm ${
            data.firstInputDelay < 100 ? 'text-green-400' :
            data.firstInputDelay < 300 ? 'text-yellow-400' :
            'text-red-400'
          }`}>
            {data.firstInputDelay < 100 ? 'Good' :
             data.firstInputDelay < 300 ? 'Needs Improvement' :
             'Poor'}
          </div>
        </div>

        <div className="bg-gray-700 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-gray-300 mb-2">Cumulative Layout Shift</h4>
          <p className="text-lg font-bold text-white">{data.cumulativeLayoutShift.toFixed(3)}</p>
          <div className={`text-sm ${
            data.cumulativeLayoutShift < 0.1 ? 'text-green-400' :
            data.cumulativeLayoutShift < 0.25 ? 'text-yellow-400' :
            'text-red-400'
          }`}>
            {data.cumulativeLayoutShift < 0.1 ? 'Good' :
             data.cumulativeLayoutShift < 0.25 ? 'Needs Improvement' :
             'Poor'}
          </div>
        </div>
      </div>

      {/* Component Performance */}
      {componentMetrics.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-white">Component Performance</h4>
          <div className="grid gap-3">
            {componentMetrics.map((component) => (
              <div key={component.name} className="bg-gray-700 p-4 rounded-lg flex justify-between items-center">
                <div>
                  <h5 className="font-medium text-white">{component.name}</h5>
                  <p className="text-sm text-gray-300">
                    Renders: {component.renderCount} | Avg: {formatMetric(component.avgRenderTime, 'ms')} |
                    Max: {formatMetric(component.maxRenderTime, 'ms')}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${
                    component.isOptimized ? 'bg-green-400' : 'bg-red-400'
                  }`} />
                  <span className="text-sm text-gray-300">
                    {component.isOptimized ? 'Optimized' : 'Needs Optimization'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Performance Testing */}
      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-white">Component Tests</h4>
        <div className="flex gap-4">
          <button
            onClick={profileHashtagInteraction}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
            aria-label="Test hashtag cloud performance"
          >
            Test Hashtag Cloud
          </button>
          <button
            onClick={profileNeuralMelody}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
            aria-label="Test neural melody performance"
          >
            Test Neural Melody
          </button>
        </div>
      </div>

      {/* Recent Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-white">Recent Alerts</h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {alerts.slice(-5).reverse().map((alert, index) => (
              <div key={`${alert.timestamp}-${index}`} className="bg-red-900/30 border border-red-500 p-3 rounded-lg">
                <p className="text-white font-medium">{alert.metric} threshold exceeded</p>
                <p className="text-gray-300 text-sm">
                  Value: {formatMetric(alert.value)} |
                  Time: {new Date(alert.timestamp).toLocaleTimeString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Performance History Chart */}
      {history.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-white">Performance History</h4>
          <div className="bg-gray-700 p-4 rounded-lg">
            <div className="flex justify-between text-sm text-gray-300 mb-2">
              <span>Last {history.length} measurements</span>
              <span>{isRecording ? 'Recording...' : 'Stopped'}</span>
            </div>
            <div className="h-32 bg-gray-800 rounded flex items-end justify-between px-2 py-2 space-x-1">
              {history.slice(-50).map((point, index) => (
                <div
                  key={point.timestamp}
                  className="bg-blue-500 rounded-t"
                  style={{
                    height: `${Math.min(100, (point.data.framerate / 60) * 100)}%`,
                    width: '2px'
                  }}
                  title={`FPS: ${point.data.framerate} at ${new Date(point.timestamp).toLocaleTimeString()}`}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};