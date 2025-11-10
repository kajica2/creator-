import React, { useState, useCallback, useRef } from 'react';
import { useAccessibility } from '../../hooks/useAccessibility';

export interface VisualTestCase {
  id: string;
  name: string;
  selector: string;
  viewport: { width: number; height: number };
  waitFor?: string;
  hideElements?: string[];
  threshold?: number;
}

export interface VisualTestResult {
  testCase: VisualTestCase;
  status: 'passed' | 'failed' | 'warning';
  baseline?: string;
  current?: string;
  diff?: string;
  pixelDifference: number;
  percentageDifference: number;
  timestamp: number;
}

interface VisualRegressionTesterProps {
  threshold?: number;
  onTestComplete: (results: VisualTestResult[]) => void;
}

export const VisualRegressionTester: React.FC<VisualRegressionTesterProps> = ({
  threshold = 0.05,
  onTestComplete
}) => {
  const { announce } = useAccessibility();
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState<string | null>(null);
  const [results, setResults] = useState<VisualTestResult[]>([]);
  const [baselineImages, setBaselineImages] = useState<Map<string, string>>(new Map());
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Define visual test cases
  const visualTestCases: VisualTestCase[] = [
    {
      id: 'hashtag-cloud-layout',
      name: 'Hashtag Cloud Layout',
      selector: '[data-testid="hashtag-cloud"]',
      viewport: { width: 1920, height: 1080 },
      waitFor: '[data-testid="hashtag-item"]',
      hideElements: ['[data-testid="loading-spinner"]'],
      threshold: 0.02
    },
    {
      id: 'navigation-menu',
      name: 'Navigation Menu',
      selector: '[data-testid="sidebar"]',
      viewport: { width: 1920, height: 1080 },
      waitFor: '[data-testid="nav-item"]',
      threshold: 0.01
    },
    {
      id: 'button-states',
      name: 'Button States and Hover Effects',
      selector: '[data-testid="button-group"]',
      viewport: { width: 1920, height: 1080 },
      threshold: 0.03
    },
    {
      id: 'modal-dialogs',
      name: 'Modal Dialog Rendering',
      selector: '[data-testid="modal"]',
      viewport: { width: 1920, height: 1080 },
      waitFor: '[data-testid="modal-content"]',
      threshold: 0.02
    },
    {
      id: 'form-inputs',
      name: 'Form Input Styling',
      selector: '[data-testid="form-container"]',
      viewport: { width: 1920, height: 1080 },
      threshold: 0.01
    },
    {
      id: 'mobile-layout',
      name: 'Mobile Layout (375px)',
      selector: 'body',
      viewport: { width: 375, height: 812 },
      waitFor: '[data-testid="main-content"]',
      threshold: 0.05
    },
    {
      id: 'tablet-layout',
      name: 'Tablet Layout (768px)',
      selector: 'body',
      viewport: { width: 768, height: 1024 },
      waitFor: '[data-testid="main-content"]',
      threshold: 0.04
    },
    {
      id: 'desktop-layout',
      name: 'Desktop Layout (1920px)',
      selector: 'body',
      viewport: { width: 1920, height: 1080 },
      waitFor: '[data-testid="main-content"]',
      threshold: 0.03
    },
    {
      id: 'dark-mode',
      name: 'Dark Mode Rendering',
      selector: 'body',
      viewport: { width: 1920, height: 1080 },
      waitFor: '[data-testid="main-content"]',
      threshold: 0.02
    },
    {
      id: 'loading-states',
      name: 'Loading State Animations',
      selector: '[data-testid="loading-container"]',
      viewport: { width: 1920, height: 1080 },
      waitFor: '[data-testid="loading-spinner"]',
      threshold: 0.08
    },
    {
      id: 'error-messages',
      name: 'Error Message Styling',
      selector: '[data-testid="error-container"]',
      viewport: { width: 1920, height: 1080 },
      threshold: 0.01
    },
    {
      id: 'success-notifications',
      name: 'Success Notification Design',
      selector: '[data-testid="notification-container"]',
      viewport: { width: 1920, height: 1080 },
      threshold: 0.01
    },
    {
      id: 'content-cards',
      name: 'Content Card Layouts',
      selector: '[data-testid="content-grid"]',
      viewport: { width: 1920, height: 1080 },
      waitFor: '[data-testid="content-card"]',
      threshold: 0.02
    },
    {
      id: 'typography',
      name: 'Typography Rendering',
      selector: '[data-testid="typography-sample"]',
      viewport: { width: 1920, height: 1080 },
      threshold: 0.01
    },
    {
      id: 'icons-alignment',
      name: 'Icon Alignment and Sizing',
      selector: '[data-testid="icon-grid"]',
      viewport: { width: 1920, height: 1080 },
      threshold: 0.02
    }
  ];

  // Capture screenshot of element
  const captureElement = useCallback(async (
    selector: string,
    viewport: { width: number; height: number },
    hideElements: string[] = []
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      try {
        // Set viewport size
        if (viewport.width !== window.innerWidth || viewport.height !== window.innerHeight) {
          // In a real implementation, you'd use a headless browser
          // For demo, we'll simulate viewport changes
          document.documentElement.style.width = `${viewport.width}px`;
          document.documentElement.style.height = `${viewport.height}px`;
        }

        // Hide specified elements
        const hiddenElements: HTMLElement[] = [];
        hideElements.forEach(hideSelector => {
          const elements = document.querySelectorAll(hideSelector) as NodeListOf<HTMLElement>;
          elements.forEach(el => {
            hiddenElements.push(el);
            el.style.visibility = 'hidden';
          });
        });

        setTimeout(() => {
          const element = document.querySelector(selector) as HTMLElement;
          if (!element) {
            reject(new Error(`Element ${selector} not found`));
            return;
          }

          // Use html2canvas or similar library in real implementation
          // For demo, we'll create a canvas representation
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }

          const rect = element.getBoundingClientRect();
          canvas.width = rect.width;
          canvas.height = rect.height;

          // Fill with element's computed background
          const computedStyle = window.getComputedStyle(element);
          ctx.fillStyle = computedStyle.backgroundColor || '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Add some visual representation based on element content
          ctx.fillStyle = '#333333';
          ctx.font = '16px Arial';
          ctx.fillText(element.textContent?.substring(0, 50) || 'Element', 10, 30);

          // Add random pattern to simulate visual content
          for (let i = 0; i < 20; i++) {
            ctx.fillStyle = `hsl(${Math.random() * 360}, 50%, 50%)`;
            ctx.fillRect(
              Math.random() * canvas.width,
              Math.random() * canvas.height,
              20,
              20
            );
          }

          const dataUrl = canvas.toDataURL('image/png');

          // Restore hidden elements
          hiddenElements.forEach(el => {
            el.style.visibility = '';
          });

          // Restore viewport
          document.documentElement.style.width = '';
          document.documentElement.style.height = '';

          resolve(dataUrl);
        }, 500); // Wait for viewport changes to apply

      } catch (error) {
        reject(error);
      }
    });
  }, []);

  // Compare two images and get difference
  const compareImages = useCallback((
    baseline: string,
    current: string,
    threshold: number
  ): Promise<{
    pixelDifference: number;
    percentageDifference: number;
    diffImage?: string;
    passed: boolean;
  }> => {
    return new Promise((resolve, reject) => {
      try {
        const canvas = canvasRef.current;
        if (!canvas) {
          reject(new Error('Canvas not available'));
          return;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        const baselineImg = new Image();
        const currentImg = new Image();
        let imagesLoaded = 0;

        const checkBothLoaded = () => {
          imagesLoaded++;
          if (imagesLoaded === 2) {
            // Set canvas size to match images
            canvas.width = Math.max(baselineImg.width, currentImg.width);
            canvas.height = Math.max(baselineImg.height, currentImg.height);

            // Draw baseline image
            ctx.drawImage(baselineImg, 0, 0);
            const baselineData = ctx.getImageData(0, 0, canvas.width, canvas.height);

            // Draw current image
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(currentImg, 0, 0);
            const currentData = ctx.getImageData(0, 0, canvas.width, canvas.height);

            // Compare pixel by pixel
            let differentPixels = 0;
            const totalPixels = canvas.width * canvas.height;
            const diffData = ctx.createImageData(canvas.width, canvas.height);

            for (let i = 0; i < baselineData.data.length; i += 4) {
              const rDiff = Math.abs(baselineData.data[i] - currentData.data[i]);
              const gDiff = Math.abs(baselineData.data[i + 1] - currentData.data[i + 1]);
              const bDiff = Math.abs(baselineData.data[i + 2] - currentData.data[i + 2]);

              const totalDiff = rDiff + gDiff + bDiff;

              if (totalDiff > 30) { // Threshold for pixel difference
                differentPixels++;
                // Mark different pixels in red
                diffData.data[i] = 255;     // R
                diffData.data[i + 1] = 0;   // G
                diffData.data[i + 2] = 0;   // B
                diffData.data[i + 3] = 255; // A
              } else {
                // Keep original pixel
                diffData.data[i] = currentData.data[i];
                diffData.data[i + 1] = currentData.data[i + 1];
                diffData.data[i + 2] = currentData.data[i + 2];
                diffData.data[i + 3] = currentData.data[i + 3];
              }
            }

            const percentageDifference = (differentPixels / totalPixels) * 100;
            const passed = percentageDifference <= threshold * 100;

            // Create diff image
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.putImageData(diffData, 0, 0);
            const diffImage = canvas.toDataURL('image/png');

            resolve({
              pixelDifference: differentPixels,
              percentageDifference: percentageDifference,
              diffImage: diffImage,
              passed: passed
            });
          }
        };

        baselineImg.onload = checkBothLoaded;
        currentImg.onload = checkBothLoaded;
        baselineImg.onerror = () => reject(new Error('Failed to load baseline image'));
        currentImg.onerror = () => reject(new Error('Failed to load current image'));

        baselineImg.src = baseline;
        currentImg.src = current;

      } catch (error) {
        reject(error);
      }
    });
  }, []);

  // Run visual regression test for a single test case
  const runVisualTest = useCallback(async (testCase: VisualTestCase): Promise<VisualTestResult> => {
    try {
      // Wait for element to be ready
      if (testCase.waitFor) {
        const element = document.querySelector(testCase.waitFor);
        if (!element) {
          await new Promise((resolve, reject) => {
            const observer = new MutationObserver(() => {
              if (document.querySelector(testCase.waitFor!)) {
                observer.disconnect();
                resolve(undefined);
              }
            });

            observer.observe(document.body, {
              childList: true,
              subtree: true
            });

            setTimeout(() => {
              observer.disconnect();
              reject(new Error(`Wait element ${testCase.waitFor} not found`));
            }, 10000);
          });
        }
      }

      // Additional wait for animations/transitions
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Capture current image
      const currentImage = await captureElement(
        testCase.selector,
        testCase.viewport,
        testCase.hideElements
      );

      // Check if we have a baseline
      const baseline = baselineImages.get(testCase.id);

      if (!baseline) {
        // No baseline - create one
        setBaselineImages(prev => new Map(prev.set(testCase.id, currentImage)));

        return {
          testCase,
          status: 'warning',
          baseline: currentImage,
          current: currentImage,
          pixelDifference: 0,
          percentageDifference: 0,
          timestamp: Date.now()
        };
      }

      // Compare with baseline
      const comparison = await compareImages(
        baseline,
        currentImage,
        testCase.threshold || threshold
      );

      return {
        testCase,
        status: comparison.passed ? 'passed' : 'failed',
        baseline: baseline,
        current: currentImage,
        diff: comparison.diffImage,
        pixelDifference: comparison.pixelDifference,
        percentageDifference: comparison.percentageDifference,
        timestamp: Date.now()
      };

    } catch (error) {
      return {
        testCase,
        status: 'failed',
        pixelDifference: 0,
        percentageDifference: 100,
        timestamp: Date.now()
      };
    }
  }, [baselineImages, threshold, captureElement, compareImages]);

  // Run all visual regression tests
  const runVisualTests = useCallback(async () => {
    setIsRunning(true);
    setResults([]);
    announce('Starting visual regression tests');

    const testResults: VisualTestResult[] = [];

    for (const testCase of visualTestCases) {
      setCurrentTest(testCase.name);
      announce(`Running visual test: ${testCase.name}`);

      try {
        const result = await runVisualTest(testCase);
        testResults.push(result);
        setResults(prev => [...prev, result]);

        // Brief pause between tests
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Visual test failed for ${testCase.name}:`, error);
        testResults.push({
          testCase,
          status: 'failed',
          pixelDifference: 0,
          percentageDifference: 100,
          timestamp: Date.now()
        });
      }
    }

    setCurrentTest(null);
    onTestComplete(testResults);

    const passed = testResults.filter(r => r.status === 'passed').length;
    const failed = testResults.filter(r => r.status === 'failed').length;
    const warnings = testResults.filter(r => r.status === 'warning').length;

    announce(`Visual regression tests completed. ${passed} passed, ${failed} failed, ${warnings} warnings`);
    setIsRunning(false);
  }, [announce, runVisualTest, onTestComplete]);

  // Update baseline for a specific test
  const updateBaseline = useCallback((testId: string, newBaseline: string) => {
    setBaselineImages(prev => new Map(prev.set(testId, newBaseline)));
    announce(`Baseline updated for ${testId}`);
  }, [announce]);

  // Clear all baselines
  const clearBaselines = useCallback(() => {
    setBaselineImages(new Map());
    setResults([]);
    announce('All baselines cleared');
  }, [announce]);

  // Export test results
  const exportResults = useCallback(() => {
    const exportData = {
      timestamp: new Date().toISOString(),
      threshold,
      results,
      baselines: Object.fromEntries(baselineImages)
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `visual-regression-results-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    announce('Visual regression results exported');
  }, [threshold, results, baselineImages, announce]);

  return (
    <div className="bg-gray-800 rounded-lg p-6 space-y-6">
      <canvas ref={canvasRef} className="hidden" />

      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-white">Visual Regression Tester</h3>
        <div className="flex gap-2">
          <button
            onClick={runVisualTests}
            disabled={isRunning}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
            aria-label="Run visual regression tests"
          >
            {isRunning ? 'Running...' : 'Run Tests'}
          </button>
          <button
            onClick={clearBaselines}
            disabled={isRunning}
            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500 text-white"
            aria-label="Clear all baselines"
          >
            Clear Baselines
          </button>
          <button
            onClick={exportResults}
            disabled={isRunning || results.length === 0}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
            aria-label="Export test results"
          >
            Export
          </button>
        </div>
      </div>

      {/* Test Configuration */}
      <div className="bg-gray-700 p-4 rounded-lg">
        <h4 className="font-medium text-white mb-2">Configuration</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-300">Threshold:</span>
            <span className="ml-2 text-white">{(threshold * 100).toFixed(1)}%</span>
          </div>
          <div>
            <span className="text-gray-300">Test Cases:</span>
            <span className="ml-2 text-white">{visualTestCases.length}</span>
          </div>
          <div>
            <span className="text-gray-300">Baselines:</span>
            <span className="ml-2 text-white">{baselineImages.size}</span>
          </div>
          <div>
            <span className="text-gray-300">Completed:</span>
            <span className="ml-2 text-white">{results.length}</span>
          </div>
        </div>
      </div>

      {/* Current Test Status */}
      {isRunning && currentTest && (
        <div className="bg-gray-700 p-4 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="animate-spin w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full"></div>
            <span className="text-white font-medium">Running: {currentTest}</span>
          </div>
        </div>
      )}

      {/* Test Results */}
      {results.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-lg font-semibold text-white">Test Results</h4>
            <div className="flex space-x-4 text-sm">
              <span className="text-green-400">
                Passed: {results.filter(r => r.status === 'passed').length}
              </span>
              <span className="text-red-400">
                Failed: {results.filter(r => r.status === 'failed').length}
              </span>
              <span className="text-yellow-400">
                Warnings: {results.filter(r => r.status === 'warning').length}
              </span>
            </div>
          </div>

          <div className="grid gap-4 max-h-96 overflow-y-auto">
            {results.map((result, index) => (
              <div key={index} className={`border rounded-lg p-4 ${
                result.status === 'passed' ? 'border-green-500 bg-green-900/20' :
                result.status === 'failed' ? 'border-red-500 bg-red-900/20' :
                'border-yellow-500 bg-yellow-900/20'
              }`}>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h5 className="font-medium text-white">{result.testCase.name}</h5>
                    <p className="text-sm text-gray-300">{result.testCase.selector}</p>
                    <p className="text-xs text-gray-400">
                      {result.testCase.viewport.width}x{result.testCase.viewport.height}
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
                    {result.status !== 'warning' && (
                      <p className="text-sm text-gray-300 mt-1">
                        {result.percentageDifference.toFixed(2)}% diff
                      </p>
                    )}
                  </div>
                </div>

                {/* Image Preview */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {result.baseline && (
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Baseline</p>
                      <img
                        src={result.baseline}
                        alt="Baseline"
                        className="w-full h-20 object-cover rounded border"
                      />
                    </div>
                  )}
                  {result.current && (
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Current</p>
                      <img
                        src={result.current}
                        alt="Current"
                        className="w-full h-20 object-cover rounded border"
                      />
                    </div>
                  )}
                  {result.diff && (
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Difference</p>
                      <img
                        src={result.diff}
                        alt="Difference"
                        className="w-full h-20 object-cover rounded border"
                      />
                    </div>
                  )}
                  {result.status === 'failed' && result.current && (
                    <div className="flex items-center">
                      <button
                        onClick={() => updateBaseline(result.testCase.id, result.current!)}
                        className="px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs text-white"
                        aria-label={`Update baseline for ${result.testCase.name}`}
                      >
                        Update Baseline
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};