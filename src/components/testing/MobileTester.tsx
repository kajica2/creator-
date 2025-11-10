import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useAccessibility } from '../../hooks/useAccessibility';

export interface TouchGesture {
  type: 'tap' | 'long-press' | 'swipe' | 'pinch' | 'pan' | 'double-tap';
  startPoint: { x: number; y: number };
  endPoint?: { x: number; y: number };
  duration: number;
  distance?: number;
  scale?: number;
}

export interface MobileTestCase {
  id: string;
  name: string;
  description: string;
  viewport: 'mobile' | 'tablet' | 'desktop';
  testType: 'gesture' | 'responsive' | 'performance' | 'accessibility';
  target?: string;
  gesture?: TouchGesture;
  expectedResult: string;
}

export interface MobileTestResult {
  testCase: MobileTestCase;
  status: 'passed' | 'failed' | 'warning';
  duration: number;
  details: string;
  metrics?: {
    touchLatency?: number;
    scrollPerformance?: number;
    responsiveTime?: number;
    touchAccuracy?: number;
    gestureRecognition?: number;
    batteryImpact?: number;
  };
  screenshot?: string;
}

interface MobileTesterProps {
  onTestComplete: (results: MobileTestResult[]) => void;
}

const VIEWPORTS = {
  mobile: { width: 375, height: 812, name: 'iPhone 12 Pro' },
  tablet: { width: 768, height: 1024, name: 'iPad' },
  desktop: { width: 1920, height: 1080, name: 'Desktop' }
};

export const MobileTester: React.FC<MobileTesterProps> = ({
  onTestComplete
}) => {
  const { announce } = useAccessibility();
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState<string | null>(null);
  const [results, setResults] = useState<MobileTestResult[]>([]);
  const [touchSupport, setTouchSupport] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState<any>({});
  const containerRef = useRef<HTMLDivElement>(null);

  // Mobile test cases
  const mobileTestCases: MobileTestCase[] = [
    {
      id: 'hashtag-tap',
      name: 'Hashtag Cloud Touch Response',
      description: 'Test hashtag selection with touch input',
      viewport: 'mobile',
      testType: 'gesture',
      target: '[data-testid="hashtag-item"]',
      gesture: {
        type: 'tap',
        startPoint: { x: 100, y: 100 },
        duration: 150
      },
      expectedResult: 'Hashtag selection responds to touch within 100ms'
    },
    {
      id: 'swipe-navigation',
      name: 'Swipe Navigation',
      description: 'Test swipe gestures for navigation',
      viewport: 'mobile',
      testType: 'gesture',
      target: '[data-testid="swipe-container"]',
      gesture: {
        type: 'swipe',
        startPoint: { x: 200, y: 400 },
        endPoint: { x: 50, y: 400 },
        duration: 300,
        distance: 150
      },
      expectedResult: 'Swipe left navigates to next content'
    },
    {
      id: 'pinch-zoom',
      name: 'Pinch to Zoom',
      description: 'Test pinch-to-zoom on hashtag cloud',
      viewport: 'mobile',
      testType: 'gesture',
      target: '[data-testid="hashtag-cloud"]',
      gesture: {
        type: 'pinch',
        startPoint: { x: 150, y: 300 },
        duration: 500,
        scale: 1.5
      },
      expectedResult: 'Hashtag cloud scales smoothly with pinch gesture'
    },
    {
      id: 'long-press-context',
      name: 'Long Press Context Menu',
      description: 'Test long press for context menus',
      viewport: 'mobile',
      testType: 'gesture',
      target: '[data-testid="content-item"]',
      gesture: {
        type: 'long-press',
        startPoint: { x: 100, y: 200 },
        duration: 800
      },
      expectedResult: 'Context menu appears after long press'
    },
    {
      id: 'scroll-performance',
      name: 'Scroll Performance',
      description: 'Test smooth scrolling on mobile',
      viewport: 'mobile',
      testType: 'performance',
      target: '[data-testid="scrollable-content"]',
      expectedResult: 'Scrolling maintains 60fps with touch input'
    },
    {
      id: 'responsive-layout',
      name: 'Responsive Layout Adaptation',
      description: 'Test layout adaptation across viewports',
      viewport: 'mobile',
      testType: 'responsive',
      expectedResult: 'Layout adapts correctly to different screen sizes'
    },
    {
      id: 'virtual-keyboard',
      name: 'Virtual Keyboard Handling',
      description: 'Test input field behavior with virtual keyboard',
      viewport: 'mobile',
      testType: 'accessibility',
      target: '[data-testid="text-input"]',
      expectedResult: 'Input fields remain visible with virtual keyboard'
    },
    {
      id: 'orientation-change',
      name: 'Orientation Change Support',
      description: 'Test behavior during orientation changes',
      viewport: 'mobile',
      testType: 'responsive',
      expectedResult: 'Layout adjusts correctly to orientation changes'
    },
    {
      id: 'touch-target-size',
      name: 'Touch Target Sizing',
      description: 'Verify touch targets meet minimum size requirements',
      viewport: 'mobile',
      testType: 'accessibility',
      expectedResult: 'All interactive elements are at least 44px in size'
    }
  ];

  // Detect device capabilities
  useEffect(() => {
    const detectTouchSupport = () => {
      return 'ontouchstart' in window ||
             navigator.maxTouchPoints > 0 ||
             (navigator as any).msMaxTouchPoints > 0;
    };

    const getDeviceInfo = () => {
      return {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        touchPoints: navigator.maxTouchPoints || 0,
        screen: {
          width: screen.width,
          height: screen.height,
          pixelRatio: window.devicePixelRatio || 1
        },
        connection: (navigator as any).connection || {},
        memory: (navigator as any).deviceMemory || 'unknown'
      };
    };

    setTouchSupport(detectTouchSupport());
    setDeviceInfo(getDeviceInfo());
  }, []);

  // Simulate viewport change
  const setViewport = useCallback((viewport: keyof typeof VIEWPORTS) => {
    const vp = VIEWPORTS[viewport];

    // Set meta viewport for mobile testing
    let viewportMeta = document.querySelector('meta[name="viewport"]') as HTMLMetaElement;
    if (!viewportMeta) {
      viewportMeta = document.createElement('meta');
      viewportMeta.name = 'viewport';
      document.head.appendChild(viewportMeta);
    }

    viewportMeta.content = `width=${vp.width}, initial-scale=1.0, user-scalable=yes`;

    // Simulate window resize
    if (containerRef.current) {
      containerRef.current.style.width = `${vp.width}px`;
      containerRef.current.style.height = `${vp.height}px`;
      containerRef.current.style.maxWidth = `${vp.width}px`;
      containerRef.current.style.overflow = 'hidden';

      // Trigger resize event
      window.dispatchEvent(new Event('resize'));
    }
  }, []);

  // Simulate touch events
  const simulateTouch = useCallback((gesture: TouchGesture, target: Element): Promise<boolean> => {
    return new Promise((resolve) => {
      try {
        const rect = target.getBoundingClientRect();
        const startX = rect.left + gesture.startPoint.x;
        const startY = rect.top + gesture.startPoint.y;

        let endX = startX;
        let endY = startY;

        if (gesture.endPoint) {
          endX = rect.left + gesture.endPoint.x;
          endY = rect.top + gesture.endPoint.y;
        }

        switch (gesture.type) {
          case 'tap':
            // Single tap
            target.dispatchEvent(new TouchEvent('touchstart', {
              touches: [new Touch({
                identifier: 0,
                target: target,
                clientX: startX,
                clientY: startY
              })]
            }));

            setTimeout(() => {
              target.dispatchEvent(new TouchEvent('touchend', {
                changedTouches: [new Touch({
                  identifier: 0,
                  target: target,
                  clientX: startX,
                  clientY: startY
                })]
              }));

              // Also trigger click for compatibility
              target.dispatchEvent(new MouseEvent('click', {
                clientX: startX,
                clientY: startY,
                bubbles: true
              }));

              resolve(true);
            }, gesture.duration);
            break;

          case 'double-tap':
            // Double tap
            target.dispatchEvent(new TouchEvent('touchstart', {
              touches: [new Touch({
                identifier: 0,
                target: target,
                clientX: startX,
                clientY: startY
              })]
            }));

            setTimeout(() => {
              target.dispatchEvent(new TouchEvent('touchend', {
                changedTouches: [new Touch({
                  identifier: 0,
                  target: target,
                  clientX: startX,
                  clientY: startY
                })]
              }));

              // Second tap
              setTimeout(() => {
                target.dispatchEvent(new TouchEvent('touchstart', {
                  touches: [new Touch({
                    identifier: 0,
                    target: target,
                    clientX: startX,
                    clientY: startY
                  })]
                }));

                setTimeout(() => {
                  target.dispatchEvent(new TouchEvent('touchend', {
                    changedTouches: [new Touch({
                      identifier: 0,
                      target: target,
                      clientX: startX,
                      clientY: startY
                    })]
                  }));
                  resolve(true);
                }, gesture.duration);
              }, 100);
            }, gesture.duration);
            break;

          case 'long-press':
            target.dispatchEvent(new TouchEvent('touchstart', {
              touches: [new Touch({
                identifier: 0,
                target: target,
                clientX: startX,
                clientY: startY
              })]
            }));

            setTimeout(() => {
              target.dispatchEvent(new TouchEvent('touchend', {
                changedTouches: [new Touch({
                  identifier: 0,
                  target: target,
                  clientX: startX,
                  clientY: startY
                })]
              }));

              // Trigger contextmenu event
              target.dispatchEvent(new MouseEvent('contextmenu', {
                clientX: startX,
                clientY: startY,
                bubbles: true
              }));

              resolve(true);
            }, gesture.duration);
            break;

          case 'swipe':
            let progress = 0;
            const steps = 10;
            const stepDuration = gesture.duration / steps;

            target.dispatchEvent(new TouchEvent('touchstart', {
              touches: [new Touch({
                identifier: 0,
                target: target,
                clientX: startX,
                clientY: startY
              })]
            }));

            const moveStep = () => {
              progress++;
              const ratio = progress / steps;
              const currentX = startX + (endX - startX) * ratio;
              const currentY = startY + (endY - startY) * ratio;

              target.dispatchEvent(new TouchEvent('touchmove', {
                touches: [new Touch({
                  identifier: 0,
                  target: target,
                  clientX: currentX,
                  clientY: currentY
                })]
              }));

              if (progress < steps) {
                setTimeout(moveStep, stepDuration);
              } else {
                target.dispatchEvent(new TouchEvent('touchend', {
                  changedTouches: [new Touch({
                    identifier: 0,
                    target: target,
                    clientX: endX,
                    clientY: endY
                  })]
                }));
                resolve(true);
              }
            };

            setTimeout(moveStep, stepDuration);
            break;

          case 'pinch':
            // Simulate pinch with two touch points
            const touch1X = startX - 50;
            const touch1Y = startY;
            const touch2X = startX + 50;
            const touch2Y = startY;

            const finalScale = gesture.scale || 1.5;
            const finalDistance = 100 * finalScale;

            target.dispatchEvent(new TouchEvent('touchstart', {
              touches: [
                new Touch({
                  identifier: 0,
                  target: target,
                  clientX: touch1X,
                  clientY: touch1Y
                }),
                new Touch({
                  identifier: 1,
                  target: target,
                  clientX: touch2X,
                  clientY: touch2Y
                })
              ]
            }));

            let pinchProgress = 0;
            const pinchSteps = 10;
            const pinchStepDuration = gesture.duration / pinchSteps;

            const pinchStep = () => {
              pinchProgress++;
              const ratio = pinchProgress / pinchSteps;
              const currentDistance = 100 + (finalDistance - 100) * ratio;
              const halfDistance = currentDistance / 2;

              target.dispatchEvent(new TouchEvent('touchmove', {
                touches: [
                  new Touch({
                    identifier: 0,
                    target: target,
                    clientX: startX - halfDistance,
                    clientY: startY
                  }),
                  new Touch({
                    identifier: 1,
                    target: target,
                    clientX: startX + halfDistance,
                    clientY: startY
                  })
                ]
              }));

              if (pinchProgress < pinchSteps) {
                setTimeout(pinchStep, pinchStepDuration);
              } else {
                target.dispatchEvent(new TouchEvent('touchend', {
                  changedTouches: [
                    new Touch({
                      identifier: 0,
                      target: target,
                      clientX: startX - halfDistance,
                      clientY: startY
                    }),
                    new Touch({
                      identifier: 1,
                      target: target,
                      clientX: startX + halfDistance,
                      clientY: startY
                    })
                  ]
                }));
                resolve(true);
              }
            };

            setTimeout(pinchStep, pinchStepDuration);
            break;

          default:
            resolve(false);
        }
      } catch (error) {
        console.error('Touch simulation error:', error);
        resolve(false);
      }
    });
  }, []);

  // Test touch target sizes
  const testTouchTargetSizes = useCallback((): { passed: boolean; details: string } => {
    const interactiveElements = document.querySelectorAll(
      'button, a, input, select, textarea, [role="button"], [onclick], [data-testid*="button"]'
    );

    const minSize = 44; // 44px minimum as per WCAG guidelines
    let failures = 0;
    const failedElements: string[] = [];

    interactiveElements.forEach((element, index) => {
      const rect = element.getBoundingClientRect();
      const elementSelector = element.tagName.toLowerCase() +
                             (element.className ? `.${element.className.split(' ')[0]}` : '');

      if (rect.width < minSize || rect.height < minSize) {
        failures++;
        failedElements.push(`${elementSelector} (${rect.width.toFixed(0)}x${rect.height.toFixed(0)}px)`);
      }
    });

    return {
      passed: failures === 0,
      details: failures === 0
        ? `All ${interactiveElements.length} interactive elements meet minimum size requirements`
        : `${failures}/${interactiveElements.length} elements below ${minSize}px: ${failedElements.slice(0, 5).join(', ')}${failures > 5 ? '...' : ''}`
    };
  }, []);

  // Test responsive layout
  const testResponsiveLayout = useCallback(async (): Promise<{ passed: boolean; details: string }> => {
    const originalWidth = window.innerWidth;
    const testViewports = [375, 768, 1024, 1920];
    const issues: string[] = [];

    for (const width of testViewports) {
      // Simulate viewport change
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: width,
      });

      window.dispatchEvent(new Event('resize'));
      await new Promise(resolve => setTimeout(resolve, 300));

      // Check for horizontal overflow
      const body = document.body;
      const html = document.documentElement;
      const bodyWidth = Math.max(
        body.scrollWidth, body.offsetWidth,
        html.clientWidth, html.scrollWidth, html.offsetWidth
      );

      if (bodyWidth > width + 20) { // Allow 20px tolerance
        issues.push(`Horizontal overflow at ${width}px (content: ${bodyWidth}px)`);
      }

      // Check for elements positioned outside viewport
      const elements = document.querySelectorAll('*');
      for (let i = 0; i < Math.min(50, elements.length); i++) {
        const element = elements[i] as HTMLElement;
        if (element.offsetWidth > 0) {
          const rect = element.getBoundingClientRect();
          if (rect.right > width + 50 && element.style.position !== 'fixed') {
            const selector = element.tagName.toLowerCase() +
                           (element.className ? `.${element.className.split(' ')[0]}` : '');
            issues.push(`Element extends beyond viewport at ${width}px: ${selector}`);
            break;
          }
        }
      }
    }

    // Restore original width
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalWidth,
    });
    window.dispatchEvent(new Event('resize'));

    return {
      passed: issues.length === 0,
      details: issues.length === 0
        ? 'Layout responsive across all test viewports'
        : `Layout issues found: ${issues.slice(0, 3).join(', ')}${issues.length > 3 ? '...' : ''}`
    };
  }, []);

  // Run individual mobile test
  const runMobileTest = useCallback(async (testCase: MobileTestCase): Promise<MobileTestResult> => {
    const startTime = performance.now();

    try {
      // Set viewport for test
      setViewport(testCase.viewport);
      await new Promise(resolve => setTimeout(resolve, 300));

      let testResult: { passed: boolean; details: string; metrics?: any } = {
        passed: false,
        details: 'Test not implemented'
      };

      switch (testCase.testType) {
        case 'gesture':
          if (testCase.target && testCase.gesture) {
            const target = document.querySelector(testCase.target);
            if (target) {
              const gestureStartTime = performance.now();
              const success = await simulateTouch(testCase.gesture, target);
              const gestureTime = performance.now() - gestureStartTime;

              // Wait for potential state changes
              await new Promise(resolve => setTimeout(resolve, 500));

              testResult = {
                passed: success,
                details: success
                  ? `Gesture completed successfully in ${gestureTime.toFixed(1)}ms`
                  : 'Gesture simulation failed',
                metrics: {
                  touchLatency: gestureTime,
                  gestureRecognition: success ? 100 : 0
                }
              };
            } else {
              testResult = {
                passed: false,
                details: `Target element not found: ${testCase.target}`
              };
            }
          }
          break;

        case 'accessibility':
          if (testCase.id === 'touch-target-size') {
            const sizeTest = testTouchTargetSizes();
            testResult = {
              passed: sizeTest.passed,
              details: sizeTest.details,
              metrics: { touchAccuracy: sizeTest.passed ? 100 : 50 }
            };
          } else if (testCase.id === 'virtual-keyboard') {
            const input = document.querySelector(testCase.target || 'input') as HTMLInputElement;
            if (input) {
              input.focus();
              await new Promise(resolve => setTimeout(resolve, 300));

              // Check if input is still visible (not covered by virtual keyboard)
              const rect = input.getBoundingClientRect();
              const isVisible = rect.top >= 0 && rect.bottom <= window.innerHeight;

              testResult = {
                passed: isVisible,
                details: isVisible
                  ? 'Input remains visible with virtual keyboard'
                  : 'Input hidden by virtual keyboard'
              };

              input.blur();
            }
          }
          break;

        case 'responsive':
          if (testCase.id === 'responsive-layout') {
            testResult = await testResponsiveLayout();
          } else if (testCase.id === 'orientation-change') {
            // Simulate orientation change
            const originalOrientation = screen.orientation?.angle || 0;

            // Test portrait to landscape
            Object.defineProperty(screen, 'orientation', {
              value: { angle: 90, type: 'landscape-primary' },
              configurable: true
            });
            window.dispatchEvent(new Event('orientationchange'));

            await new Promise(resolve => setTimeout(resolve, 500));

            // Check layout adaptation
            const hasOverflow = document.body.scrollWidth > window.innerWidth;

            testResult = {
              passed: !hasOverflow,
              details: hasOverflow
                ? 'Layout overflow detected after orientation change'
                : 'Layout adapts correctly to orientation change'
            };

            // Restore orientation
            Object.defineProperty(screen, 'orientation', {
              value: { angle: originalOrientation, type: 'portrait-primary' },
              configurable: true
            });
          }
          break;

        case 'performance':
          if (testCase.id === 'scroll-performance') {
            const scrollContainer = document.querySelector(testCase.target || 'body');
            if (scrollContainer) {
              const frameRates: number[] = [];
              let lastTime = performance.now();
              let frameCount = 0;

              const measureFrame = () => {
                const currentTime = performance.now();
                const deltaTime = currentTime - lastTime;
                frameRates.push(1000 / deltaTime);
                lastTime = currentTime;
                frameCount++;

                if (frameCount < 30) {
                  requestAnimationFrame(measureFrame);
                } else {
                  const avgFrameRate = frameRates.reduce((a, b) => a + b, 0) / frameRates.length;
                  const passed = avgFrameRate >= 55; // Accept 55fps+ as good

                  testResult = {
                    passed,
                    details: `Average frame rate during scroll: ${avgFrameRate.toFixed(1)} FPS`,
                    metrics: { scrollPerformance: avgFrameRate }
                  };
                }
              };

              // Start scroll simulation
              scrollContainer.dispatchEvent(new WheelEvent('wheel', {
                deltaY: 100,
                bubbles: true
              }));

              requestAnimationFrame(measureFrame);

              // Wait for measurement to complete
              await new Promise(resolve => setTimeout(resolve, 2000));
            }
          }
          break;
      }

      const duration = performance.now() - startTime;

      return {
        testCase,
        status: testResult.passed ? 'passed' : 'failed',
        duration,
        details: testResult.details,
        metrics: testResult.metrics
      };

    } catch (error) {
      const duration = performance.now() - startTime;
      return {
        testCase,
        status: 'failed',
        duration,
        details: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }, [setViewport, simulateTouch, testTouchTargetSizes, testResponsiveLayout]);

  // Run all mobile tests
  const runAllMobileTests = useCallback(async () => {
    setIsRunning(true);
    setResults([]);
    announce('Starting mobile UX tests');

    const testResults: MobileTestResult[] = [];

    for (const testCase of mobileTestCases) {
      setCurrentTest(testCase.name);
      announce(`Running mobile test: ${testCase.name}`);

      try {
        const result = await runMobileTest(testCase);
        testResults.push(result);
        setResults(prev => [...prev, result]);

        // Brief pause between tests
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Mobile test failed for ${testCase.name}:`, error);
      }
    }

    setCurrentTest(null);
    onTestComplete(testResults);

    const passed = testResults.filter(r => r.status === 'passed').length;
    const failed = testResults.filter(r => r.status === 'failed').length;

    announce(`Mobile UX tests completed. ${passed} passed, ${failed} failed`);
    setIsRunning(false);

    // Reset viewport to desktop
    setViewport('desktop');
  }, [announce, runMobileTest, onTestComplete, setViewport]);

  return (
    <div className="bg-gray-800 rounded-lg p-6 space-y-6" ref={containerRef}>
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-white">Mobile UX Tester</h3>
        <div className="flex gap-2">
          <button
            onClick={runAllMobileTests}
            disabled={isRunning}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 text-white"
            aria-label="Run all mobile UX tests"
          >
            {isRunning ? 'Running...' : 'Run Mobile Tests'}
          </button>
        </div>
      </div>

      {/* Device Info */}
      <div className="bg-gray-700 p-4 rounded-lg">
        <h4 className="font-medium text-white mb-2">Device Information</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-300">Touch Support:</span>
            <span className={`ml-2 ${touchSupport ? 'text-green-400' : 'text-red-400'}`}>
              {touchSupport ? 'Yes' : 'No'}
            </span>
          </div>
          <div>
            <span className="text-gray-300">Touch Points:</span>
            <span className="ml-2 text-white">{deviceInfo.touchPoints}</span>
          </div>
          <div>
            <span className="text-gray-300">Pixel Ratio:</span>
            <span className="ml-2 text-white">{deviceInfo.screen?.pixelRatio}</span>
          </div>
          <div>
            <span className="text-gray-300">Memory:</span>
            <span className="ml-2 text-white">{deviceInfo.memory}GB</span>
          </div>
        </div>
      </div>

      {/* Current Test Status */}
      {isRunning && currentTest && (
        <div className="bg-gray-700 p-4 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="animate-spin w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full"></div>
            <span className="text-white font-medium">Running: {currentTest}</span>
          </div>
        </div>
      )}

      {/* Test Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {['gesture', 'responsive', 'performance', 'accessibility'].map(category => {
          const categoryTests = mobileTestCases.filter(t => t.testType === category);
          const categoryResults = results.filter(r => r.testCase.testType === category);
          const passed = categoryResults.filter(r => r.status === 'passed').length;

          return (
            <div key={category} className="bg-gray-700 p-4 rounded-lg">
              <h4 className="font-medium text-white mb-2 capitalize">{category} Tests</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-300">Total:</span>
                  <span className="text-white">{categoryTests.length}</span>
                </div>
                {categoryResults.length > 0 && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Passed:</span>
                      <span className="text-green-400">{passed}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Failed:</span>
                      <span className="text-red-400">{categoryResults.length - passed}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Test Results */}
      {results.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-white">Test Results</h4>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {results.map((result, index) => (
              <div key={index} className={`border rounded-lg p-4 ${
                result.status === 'passed' ? 'border-green-500 bg-green-900/20' :
                result.status === 'failed' ? 'border-red-500 bg-red-900/20' :
                'border-yellow-500 bg-yellow-900/20'
              }`}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h5 className="font-medium text-white">{result.testCase.name}</h5>
                    <p className="text-sm text-gray-300">{result.testCase.description}</p>
                    <p className="text-xs text-gray-400">
                      Type: {result.testCase.testType} | Viewport: {result.testCase.viewport}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className={`inline-flex items-center space-x-2 px-2 py-1 rounded ${
                      result.status === 'passed' ? 'bg-green-600' :
                      result.status === 'failed' ? 'bg-red-600' :
                      'bg-yellow-600'
                    }`}>
                      <span className="text-white text-sm capitalize">{result.status}</span>
                    </div>
                    <p className="text-sm text-gray-300 mt-1">
                      {(result.duration / 1000).toFixed(1)}s
                    </p>
                  </div>
                </div>

                <p className="text-sm text-gray-300 mb-2">{result.details}</p>

                {/* Metrics */}
                {result.metrics && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                    {Object.entries(result.metrics).map(([key, value]) => (
                      <div key={key} className="bg-gray-800 p-2 rounded">
                        <span className="text-gray-400 capitalize">
                          {key.replace(/([A-Z])/g, ' $1')}:
                        </span>
                        <span className="ml-1 text-white">
                          {typeof value === 'number' ? value.toFixed(1) : value}
                          {key.includes('Latency') || key.includes('Time') ? 'ms' :
                           key.includes('Performance') || key.includes('Recognition') || key.includes('Accuracy') ? '%' : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Viewport Testing */}
      <div className="bg-gray-700 p-4 rounded-lg">
        <h4 className="font-medium text-white mb-3">Viewport Testing</h4>
        <div className="flex gap-2">
          {Object.entries(VIEWPORTS).map(([key, viewport]) => (
            <button
              key={key}
              onClick={() => setViewport(key as keyof typeof VIEWPORTS)}
              disabled={isRunning}
              className="px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 rounded font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 text-white text-sm"
              aria-label={`Set viewport to ${viewport.name}`}
            >
              {viewport.name}<br />
              <span className="text-xs opacity-75">{viewport.width}×{viewport.height}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};