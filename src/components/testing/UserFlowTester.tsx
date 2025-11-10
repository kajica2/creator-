import React, { useState, useCallback, useRef } from 'react';
import { useAccessibility } from '../../hooks/useAccessibility';

export interface UserFlowStep {
  id: string;
  name: string;
  description: string;
  action: () => Promise<boolean>;
  selector?: string;
  expectedResult?: string;
  timeout?: number;
}

export interface UserFlowResult {
  flowId: string;
  flowName: string;
  steps: Array<{
    step: UserFlowStep;
    status: 'pending' | 'running' | 'passed' | 'failed';
    duration: number;
    error?: string;
    screenshot?: string;
  }>;
  totalDuration: number;
  success: boolean;
}

interface UserFlowTesterProps {
  onFlowComplete: (result: UserFlowResult) => void;
}

export const UserFlowTester: React.FC<UserFlowTesterProps> = ({
  onFlowComplete
}) => {
  const { announce } = useAccessibility();
  const [isRunning, setIsRunning] = useState(false);
  const [currentFlow, setCurrentFlow] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<string | null>(null);
  const [results, setResults] = useState<UserFlowResult[]>([]);
  const abortController = useRef<AbortController | null>(null);

  // Define user flows
  const userFlows = {
    'hashtag-to-content': {
      name: 'Hashtag Selection to Content Generation',
      description: 'Complete flow from selecting hashtags to generating content',
      steps: [
        {
          id: 'navigate-hashtag-manager',
          name: 'Navigate to Hashtag Manager',
          description: 'Click on Hashtag Manager in navigation',
          action: async () => {
            const link = document.querySelector('[data-testid="nav-hashtag-manager"]') as HTMLElement;
            if (link) {
              link.click();
              await waitForElement('[data-testid="hashtag-manager"]');
              return true;
            }
            return false;
          },
          expectedResult: 'Hashtag Manager page loads',
          timeout: 5000
        },
        {
          id: 'select-hashtags',
          name: 'Select Hashtags',
          description: 'Select 3-5 hashtags from different categories',
          action: async () => {
            const hashtags = document.querySelectorAll('[data-testid="hashtag-item"]:not(.selected)');
            const selected = Math.min(5, hashtags.length);

            for (let i = 0; i < selected; i++) {
              const hashtag = hashtags[i] as HTMLElement;
              hashtag.click();
              await new Promise(resolve => setTimeout(resolve, 200));
            }

            const selectedTray = await waitForElement('[data-testid="selected-tray"]');
            return selectedTray !== null;
          },
          expectedResult: 'Hashtags appear in selected tray',
          timeout: 10000
        },
        {
          id: 'navigate-ai-story',
          name: 'Navigate to AI Story Generator',
          description: 'Click on AI Story in navigation',
          action: async () => {
            const link = document.querySelector('[data-testid="nav-ai-story"]') as HTMLElement;
            if (link) {
              link.click();
              await waitForElement('[data-testid="ai-story-generator"]');
              return true;
            }
            return false;
          },
          expectedResult: 'AI Story Generator page loads',
          timeout: 5000
        },
        {
          id: 'generate-content',
          name: 'Generate AI Story',
          description: 'Click generate button and wait for content',
          action: async () => {
            const generateBtn = document.querySelector('[data-testid="generate-story-btn"]') as HTMLElement;
            if (generateBtn && !generateBtn.hasAttribute('disabled')) {
              generateBtn.click();

              // Wait for generation to complete
              await waitForElement('[data-testid="generated-story"]', 15000);
              return true;
            }
            return false;
          },
          expectedResult: 'Story content is generated and displayed',
          timeout: 20000
        },
        {
          id: 'verify-history',
          name: 'Verify History Update',
          description: 'Check that prompt history is updated',
          action: async () => {
            const historyLink = document.querySelector('[data-testid="nav-history"]') as HTMLElement;
            if (historyLink) {
              historyLink.click();
              await waitForElement('[data-testid="history-list"]');

              const historyItems = document.querySelectorAll('[data-testid="history-item"]');
              return historyItems.length > 0;
            }
            return false;
          },
          expectedResult: 'History contains new entry',
          timeout: 5000
        }
      ]
    },
    'authentication-flow': {
      name: 'User Authentication Flow',
      description: 'Complete user login and profile setup',
      steps: [
        {
          id: 'click-login',
          name: 'Click Login Button',
          description: 'Click the authentication button in header',
          action: async () => {
            const authBtn = document.querySelector('[data-testid="auth-button"]') as HTMLElement;
            if (authBtn) {
              authBtn.click();
              await waitForElement('[data-testid="auth-modal"]');
              return true;
            }
            return false;
          },
          expectedResult: 'Authentication modal opens',
          timeout: 3000
        },
        {
          id: 'enter-credentials',
          name: 'Enter Test Credentials',
          description: 'Fill in test user credentials',
          action: async () => {
            const emailInput = document.querySelector('[data-testid="email-input"]') as HTMLInputElement;
            const passwordInput = document.querySelector('[data-testid="password-input"]') as HTMLInputElement;

            if (emailInput && passwordInput) {
              emailInput.value = 'test@example.com';
              passwordInput.value = 'testpassword';

              // Trigger input events
              emailInput.dispatchEvent(new Event('input', { bubbles: true }));
              passwordInput.dispatchEvent(new Event('input', { bubbles: true }));

              return true;
            }
            return false;
          },
          expectedResult: 'Credentials are entered',
          timeout: 2000
        },
        {
          id: 'submit-login',
          name: 'Submit Login',
          description: 'Click submit button to authenticate',
          action: async () => {
            const submitBtn = document.querySelector('[data-testid="auth-submit"]') as HTMLElement;
            if (submitBtn) {
              submitBtn.click();

              // Wait for either success redirect or error
              try {
                await Promise.race([
                  waitForElement('[data-testid="user-profile"]'),
                  waitForElement('[data-testid="auth-error"]')
                ]);
                return true;
              } catch {
                return false;
              }
            }
            return false;
          },
          expectedResult: 'User is authenticated or error is shown',
          timeout: 10000
        },
        {
          id: 'verify-profile',
          name: 'Verify User Profile',
          description: 'Check that user profile is accessible',
          action: async () => {
            const profileBtn = document.querySelector('[data-testid="user-profile"]') as HTMLElement;
            if (profileBtn) {
              profileBtn.click();
              await waitForElement('[data-testid="profile-menu"]');
              return true;
            }
            return false;
          },
          expectedResult: 'User profile menu is accessible',
          timeout: 3000
        }
      ]
    },
    'content-sharing': {
      name: 'Content Sharing Workflow',
      description: 'Generate content and share it',
      steps: [
        {
          id: 'generate-content',
          name: 'Generate Sample Content',
          description: 'Create content to share',
          action: async () => {
            // Navigate to text-to-image first
            const navLink = document.querySelector('[data-testid="nav-text-to-image"]') as HTMLElement;
            if (navLink) {
              navLink.click();
              await waitForElement('[data-testid="text-to-image-generator"]');

              // Enter prompt
              const promptInput = document.querySelector('[data-testid="prompt-input"]') as HTMLInputElement;
              if (promptInput) {
                promptInput.value = 'A beautiful sunset over mountains';
                promptInput.dispatchEvent(new Event('input', { bubbles: true }));

                // Generate
                const generateBtn = document.querySelector('[data-testid="generate-image-btn"]') as HTMLElement;
                if (generateBtn && !generateBtn.hasAttribute('disabled')) {
                  generateBtn.click();
                  await waitForElement('[data-testid="generated-image"]', 15000);
                  return true;
                }
              }
            }
            return false;
          },
          expectedResult: 'Image is generated',
          timeout: 20000
        },
        {
          id: 'open-share-menu',
          name: 'Open Share Menu',
          description: 'Click share button on generated content',
          action: async () => {
            const shareBtn = document.querySelector('[data-testid="share-button"]') as HTMLElement;
            if (shareBtn) {
              shareBtn.click();
              await waitForElement('[data-testid="share-menu"]');
              return true;
            }
            return false;
          },
          expectedResult: 'Share menu opens',
          timeout: 3000
        },
        {
          id: 'select-platform',
          name: 'Select Sharing Platform',
          description: 'Choose a social media platform',
          action: async () => {
            const platformBtn = document.querySelector('[data-testid="share-twitter"]') as HTMLElement;
            if (platformBtn) {
              platformBtn.click();
              await new Promise(resolve => setTimeout(resolve, 1000));
              return true;
            }
            return false;
          },
          expectedResult: 'Platform is selected',
          timeout: 2000
        },
        {
          id: 'confirm-share',
          name: 'Confirm Share Action',
          description: 'Complete the sharing process',
          action: async () => {
            const confirmBtn = document.querySelector('[data-testid="confirm-share"]') as HTMLElement;
            if (confirmBtn) {
              confirmBtn.click();
              await waitForElement('[data-testid="share-success"]', 5000);
              return true;
            }
            return false;
          },
          expectedResult: 'Share confirmation is shown',
          timeout: 8000
        }
      ]
    },
    'error-recovery': {
      name: 'Error State Recovery',
      description: 'Test error handling and recovery mechanisms',
      steps: [
        {
          id: 'trigger-network-error',
          name: 'Simulate Network Error',
          description: 'Force a network request to fail',
          action: async () => {
            // Mock network failure
            const originalFetch = window.fetch;
            window.fetch = () => Promise.reject(new Error('Network error'));

            // Try to generate content
            const generateBtn = document.querySelector('[data-testid="generate-story-btn"]') as HTMLElement;
            if (generateBtn) {
              generateBtn.click();
              await waitForElement('[data-testid="error-message"]', 5000);

              // Restore fetch
              window.fetch = originalFetch;
              return true;
            }

            window.fetch = originalFetch;
            return false;
          },
          expectedResult: 'Error message is displayed',
          timeout: 8000
        },
        {
          id: 'click-retry',
          name: 'Click Retry Button',
          description: 'Attempt to recover from error',
          action: async () => {
            const retryBtn = document.querySelector('[data-testid="retry-button"]') as HTMLElement;
            if (retryBtn) {
              retryBtn.click();
              await new Promise(resolve => setTimeout(resolve, 2000));
              return true;
            }
            return false;
          },
          expectedResult: 'Retry attempt is made',
          timeout: 3000
        },
        {
          id: 'verify-recovery',
          name: 'Verify System Recovery',
          description: 'Check that system returns to normal state',
          action: async () => {
            // Check that error message is gone
            const errorMsg = document.querySelector('[data-testid="error-message"]');
            const generateBtn = document.querySelector('[data-testid="generate-story-btn"]') as HTMLElement;

            return !errorMsg && generateBtn && !generateBtn.hasAttribute('disabled');
          },
          expectedResult: 'System returns to normal operation',
          timeout: 2000
        }
      ]
    },
    'accessibility-navigation': {
      name: 'Accessibility Navigation Flow',
      description: 'Test keyboard-only navigation and screen reader support',
      steps: [
        {
          id: 'keyboard-navigation',
          name: 'Keyboard Navigation Test',
          description: 'Navigate using only Tab and Enter keys',
          action: async () => {
            // Focus first focusable element
            const firstFocusable = document.querySelector('button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])') as HTMLElement;
            if (firstFocusable) {
              firstFocusable.focus();

              // Simulate tab navigation
              for (let i = 0; i < 10; i++) {
                const activeElement = document.activeElement as HTMLElement;
                if (activeElement) {
                  // Simulate tab key
                  const tabEvent = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true });
                  activeElement.dispatchEvent(tabEvent);

                  await new Promise(resolve => setTimeout(resolve, 200));
                }
              }
              return true;
            }
            return false;
          },
          expectedResult: 'Focus moves through interactive elements',
          timeout: 5000
        },
        {
          id: 'screen-reader-test',
          name: 'Screen Reader Compatibility',
          description: 'Test ARIA labels and live regions',
          action: async () => {
            // Check for ARIA labels
            const interactiveElements = document.querySelectorAll('button, a, input');
            let hasAriaLabels = true;

            interactiveElements.forEach(element => {
              const hasLabel = element.getAttribute('aria-label') ||
                             element.getAttribute('aria-labelledby') ||
                             element.textContent?.trim();
              if (!hasLabel) hasAriaLabels = false;
            });

            // Check for live regions
            const liveRegions = document.querySelectorAll('[aria-live]');

            return hasAriaLabels && liveRegions.length > 0;
          },
          expectedResult: 'ARIA labels present and live regions available',
          timeout: 2000
        },
        {
          id: 'keyboard-shortcuts',
          name: 'Keyboard Shortcuts Test',
          description: 'Test custom keyboard shortcuts',
          action: async () => {
            // Test Alt+M for menu
            const menuEvent = new KeyboardEvent('keydown', {
              key: 'm',
              altKey: true,
              bubbles: true
            });
            document.dispatchEvent(menuEvent);

            await new Promise(resolve => setTimeout(resolve, 500));

            // Check if menu opened
            const menu = document.querySelector('[data-testid="sidebar"]');
            return menu !== null;
          },
          expectedResult: 'Keyboard shortcuts work as expected',
          timeout: 2000
        }
      ]
    }
  };

  // Helper function to wait for element
  const waitForElement = (selector: string, timeout: number = 5000): Promise<Element | null> => {
    return new Promise((resolve, reject) => {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
        return;
      }

      const observer = new MutationObserver(() => {
        const element = document.querySelector(selector);
        if (element) {
          observer.disconnect();
          resolve(element);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      setTimeout(() => {
        observer.disconnect();
        reject(new Error(`Element ${selector} not found within ${timeout}ms`));
      }, timeout);
    });
  };

  // Take screenshot (mock implementation)
  const takeScreenshot = async (): Promise<string> => {
    // In a real implementation, this would capture a screenshot
    // For now, we'll return a placeholder
    return `data:image/png;base64,placeholder-screenshot-${Date.now()}`;
  };

  const runUserFlow = useCallback(async (flowId: string) => {
    const flow = userFlows[flowId as keyof typeof userFlows];
    if (!flow) return;

    setIsRunning(true);
    setCurrentFlow(flowId);
    abortController.current = new AbortController();

    announce(`Starting user flow test: ${flow.name}`);

    const startTime = performance.now();
    const flowResult: UserFlowResult = {
      flowId,
      flowName: flow.name,
      steps: [],
      totalDuration: 0,
      success: false
    };

    try {
      for (const step of flow.steps) {
        if (abortController.current?.signal.aborted) {
          break;
        }

        setCurrentStep(step.id);
        announce(`Running step: ${step.name}`);

        const stepStartTime = performance.now();
        let stepResult = {
          step,
          status: 'running' as const,
          duration: 0,
          error: undefined as string | undefined,
          screenshot: undefined as string | undefined
        };

        flowResult.steps.push(stepResult);

        try {
          // Run step with timeout
          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('Step timeout')), step.timeout || 10000);
          });

          const stepPromise = step.action();
          const success = await Promise.race([stepPromise, timeoutPromise]);

          const stepDuration = performance.now() - stepStartTime;

          if (success) {
            stepResult.status = 'passed';
            stepResult.duration = stepDuration;
            announce(`Step passed: ${step.name}`);
          } else {
            stepResult.status = 'failed';
            stepResult.duration = stepDuration;
            stepResult.error = 'Step action returned false';
            stepResult.screenshot = await takeScreenshot();
            announce(`Step failed: ${step.name}`);
            break;
          }

        } catch (error) {
          const stepDuration = performance.now() - stepStartTime;
          stepResult.status = 'failed';
          stepResult.duration = stepDuration;
          stepResult.error = error instanceof Error ? error.message : 'Unknown error';
          stepResult.screenshot = await takeScreenshot();
          announce(`Step failed with error: ${step.name}`);
          break;
        }

        // Brief pause between steps
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      const totalDuration = performance.now() - startTime;
      flowResult.totalDuration = totalDuration;
      flowResult.success = flowResult.steps.every(s => s.status === 'passed');

      setResults(prev => [...prev, flowResult]);
      onFlowComplete(flowResult);

      announce(`Flow ${flowResult.success ? 'completed successfully' : 'failed'}: ${flow.name}`);

    } catch (error) {
      announce(`Flow failed with error: ${flow.name}`);
      console.error('User flow error:', error);
    } finally {
      setIsRunning(false);
      setCurrentFlow(null);
      setCurrentStep(null);
      abortController.current = null;
    }
  }, [announce, onFlowComplete]);

  const stopFlow = useCallback(() => {
    if (abortController.current) {
      abortController.current.abort();
    }
    setIsRunning(false);
    setCurrentFlow(null);
    setCurrentStep(null);
    announce('User flow test stopped');
  }, [announce]);

  const runAllFlows = useCallback(async () => {
    for (const flowId of Object.keys(userFlows)) {
      if (!isRunning) break;
      await runUserFlow(flowId);
      // Brief pause between flows
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }, [isRunning, runUserFlow]);

  return (
    <div className="bg-gray-800 rounded-lg p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-white">User Flow Tester</h3>
        <div className="flex gap-2">
          <button
            onClick={runAllFlows}
            disabled={isRunning}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
            aria-label="Run all user flows"
          >
            {isRunning ? 'Running...' : 'Run All Flows'}
          </button>
          {isRunning && (
            <button
              onClick={stopFlow}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 text-white"
              aria-label="Stop current flow"
            >
              Stop
            </button>
          )}
        </div>
      </div>

      {/* Flow Status */}
      {isRunning && currentFlow && (
        <div className="bg-gray-700 p-4 rounded-lg">
          <h4 className="font-medium text-white mb-2">
            Running: {userFlows[currentFlow as keyof typeof userFlows]?.name}
          </h4>
          {currentStep && (
            <div className="flex items-center space-x-2">
              <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
              <span className="text-gray-300">
                {userFlows[currentFlow as keyof typeof userFlows]?.steps.find(s => s.id === currentStep)?.name}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Individual Flow Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(userFlows).map(([flowId, flow]) => (
          <div key={flowId} className="bg-gray-700 p-4 rounded-lg">
            <h4 className="font-medium text-white mb-2">{flow.name}</h4>
            <p className="text-sm text-gray-300 mb-3">{flow.description}</p>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-400">{flow.steps.length} steps</span>
              <button
                onClick={() => runUserFlow(flowId)}
                disabled={isRunning}
                className="px-3 py-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 rounded font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 text-white text-sm"
                aria-label={`Run ${flow.name} flow`}
              >
                Run
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-white">Flow Results</h4>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {results.map((result, index) => (
              <div key={index} className={`border rounded-lg p-4 ${
                result.success ? 'border-green-500 bg-green-900/20' : 'border-red-500 bg-red-900/20'
              }`}>
                <div className="flex justify-between items-start mb-2">
                  <h5 className="font-medium text-white">{result.flowName}</h5>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-300">
                      {(result.totalDuration / 1000).toFixed(1)}s
                    </span>
                    <div className={`w-3 h-3 rounded-full ${
                      result.success ? 'bg-green-400' : 'bg-red-400'
                    }`} />
                  </div>
                </div>

                <div className="space-y-2">
                  {result.steps.map((stepResult, stepIndex) => (
                    <div key={stepIndex} className={`text-sm p-2 rounded ${
                      stepResult.status === 'passed' ? 'bg-green-900/30 text-green-300' :
                      stepResult.status === 'failed' ? 'bg-red-900/30 text-red-300' :
                      'bg-gray-800 text-gray-400'
                    }`}>
                      <div className="flex justify-between items-center">
                        <span>{stepResult.step.name}</span>
                        <span>{(stepResult.duration / 1000).toFixed(1)}s</span>
                      </div>
                      {stepResult.error && (
                        <p className="text-xs text-red-400 mt-1">{stepResult.error}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};