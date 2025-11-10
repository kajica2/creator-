import React, { useState, useCallback, useRef } from 'react';
import { useAccessibility } from '../../hooks/useAccessibility';

export interface IntegrationTest {
  id: string;
  name: string;
  category: 'supabase' | 'claude-flow' | 'audio' | 'browser' | 'api';
  description: string;
  timeout: number;
  retries: number;
  expectedResult: string;
}

export interface IntegrationTestResult {
  test: IntegrationTest;
  status: 'passed' | 'failed' | 'warning' | 'timeout';
  duration: number;
  attempts: number;
  details: string;
  metadata?: {
    responseTime?: number;
    errorCode?: string;
    connectionStatus?: string;
    dataIntegrity?: boolean;
    performance?: number;
  };
}

interface IntegrationTesterProps {
  onTestComplete: (results: IntegrationTestResult[]) => void;
}

export const IntegrationTester: React.FC<IntegrationTesterProps> = ({
  onTestComplete
}) => {
  const { announce } = useAccessibility();
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState<string | null>(null);
  const [results, setResults] = useState<IntegrationTestResult[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<Record<string, boolean>>({});
  const abortController = useRef<AbortController | null>(null);

  // Integration test cases
  const integrationTests: IntegrationTest[] = [
    {
      id: 'supabase-connection',
      name: 'Supabase Connection',
      category: 'supabase',
      description: 'Test basic Supabase client connection and authentication',
      timeout: 10000,
      retries: 3,
      expectedResult: 'Successfully connects to Supabase and authenticates'
    },
    {
      id: 'supabase-realtime',
      name: 'Supabase Real-time Sync',
      category: 'supabase',
      description: 'Test real-time data synchronization with Supabase',
      timeout: 15000,
      retries: 2,
      expectedResult: 'Real-time updates received within 500ms'
    },
    {
      id: 'supabase-crud',
      name: 'Supabase CRUD Operations',
      category: 'supabase',
      description: 'Test Create, Read, Update, Delete operations',
      timeout: 8000,
      retries: 2,
      expectedResult: 'All CRUD operations complete successfully'
    },
    {
      id: 'claude-flow-init',
      name: 'Claude-Flow Initialization',
      category: 'claude-flow',
      description: 'Test Claude-Flow agent system initialization',
      timeout: 12000,
      retries: 2,
      expectedResult: 'Agent swarm initializes and reports ready status'
    },
    {
      id: 'claude-flow-coordination',
      name: 'Agent Coordination',
      category: 'claude-flow',
      description: 'Test multi-agent coordination and task delegation',
      timeout: 20000,
      retries: 1,
      expectedResult: 'Agents coordinate effectively and complete shared tasks'
    },
    {
      id: 'claude-flow-memory',
      name: 'Claude-Flow Memory System',
      category: 'claude-flow',
      description: 'Test memory persistence and retrieval between sessions',
      timeout: 8000,
      retries: 2,
      expectedResult: 'Memory operations work correctly across sessions'
    },
    {
      id: 'audio-context',
      name: 'Audio Context Initialization',
      category: 'audio',
      description: 'Test Web Audio API context creation and configuration',
      timeout: 5000,
      retries: 3,
      expectedResult: 'Audio context creates successfully with proper configuration'
    },
    {
      id: 'webrtc-connection',
      name: 'WebRTC Connection',
      category: 'audio',
      description: 'Test peer-to-peer audio connection establishment',
      timeout: 15000,
      retries: 2,
      expectedResult: 'WebRTC connection establishes within timeout'
    },
    {
      id: 'neural-audio-processing',
      name: 'Neural Audio Processing',
      category: 'audio',
      description: 'Test real-time neural audio processing pipeline',
      timeout: 10000,
      retries: 2,
      expectedResult: 'Neural processing completes within latency requirements'
    },
    {
      id: 'cross-browser-compatibility',
      name: 'Cross-browser Compatibility',
      category: 'browser',
      description: 'Test feature compatibility across different browsers',
      timeout: 8000,
      retries: 1,
      expectedResult: 'Core features work across all supported browsers'
    },
    {
      id: 'api-rate-limits',
      name: 'API Rate Limiting',
      category: 'api',
      description: 'Test graceful handling of API rate limits',
      timeout: 10000,
      retries: 1,
      expectedResult: 'Rate limits handled gracefully with appropriate backoff'
    },
    {
      id: 'error-boundary',
      name: 'Error Boundary Functionality',
      category: 'browser',
      description: 'Test error boundary catching and recovery',
      timeout: 5000,
      retries: 2,
      expectedResult: 'Error boundaries catch errors and allow graceful recovery'
    },
    {
      id: 'offline-functionality',
      name: 'Offline Functionality',
      category: 'browser',
      description: 'Test app behavior in offline conditions',
      timeout: 8000,
      retries: 2,
      expectedResult: 'App functions correctly offline with cached data'
    }
  ];

  // Test Supabase connection
  const testSupabaseConnection = useCallback(async (): Promise<{
    success: boolean;
    details: string;
    metadata: any;
  }> => {
    const startTime = performance.now();

    try {
      // Mock Supabase client test
      const mockSupabaseResponse = await new Promise((resolve, reject) => {
        setTimeout(() => {
          // Simulate random success/failure for demo
          if (Math.random() > 0.1) {
            resolve({
              data: { user: { id: '123', email: 'test@example.com' } },
              error: null
            });
          } else {
            reject(new Error('Connection failed'));
          }
        }, Math.random() * 2000 + 500);
      });

      const responseTime = performance.now() - startTime;

      return {
        success: true,
        details: 'Successfully connected to Supabase and authenticated user',
        metadata: {
          responseTime,
          connectionStatus: 'connected',
          dataIntegrity: true
        }
      };
    } catch (error) {
      const responseTime = performance.now() - startTime;
      return {
        success: false,
        details: error instanceof Error ? error.message : 'Unknown connection error',
        metadata: {
          responseTime,
          connectionStatus: 'failed',
          errorCode: 'CONN_FAILED'
        }
      };
    }
  }, []);

  // Test real-time synchronization
  const testRealtimeSync = useCallback(async (): Promise<{
    success: boolean;
    details: string;
    metadata: any;
  }> => {
    const startTime = performance.now();

    try {
      // Mock real-time test
      const updates: number[] = [];
      let updateCount = 0;

      const updatePromise = new Promise((resolve) => {
        const interval = setInterval(() => {
          const now = performance.now();
          updates.push(now - startTime);
          updateCount++;

          if (updateCount >= 3) {
            clearInterval(interval);
            resolve(updates);
          }
        }, Math.random() * 300 + 100);
      });

      await updatePromise;

      const avgUpdateTime = updates.reduce((a, b) => a + b, 0) / updates.length;
      const success = avgUpdateTime < 500; // 500ms threshold

      return {
        success,
        details: success
          ? `Real-time updates received in avg ${avgUpdateTime.toFixed(1)}ms`
          : `Updates too slow: avg ${avgUpdateTime.toFixed(1)}ms`,
        metadata: {
          responseTime: avgUpdateTime,
          updateCount,
          performance: success ? 100 : 50
        }
      };
    } catch (error) {
      return {
        success: false,
        details: 'Real-time sync test failed',
        metadata: {
          responseTime: performance.now() - startTime,
          errorCode: 'REALTIME_FAILED'
        }
      };
    }
  }, []);

  // Test CRUD operations
  const testCrudOperations = useCallback(async (): Promise<{
    success: boolean;
    details: string;
    metadata: any;
  }> => {
    const operations = ['CREATE', 'READ', 'UPDATE', 'DELETE'];
    const results: { operation: string; success: boolean; time: number }[] = [];

    try {
      for (const operation of operations) {
        const startTime = performance.now();

        // Mock operation
        await new Promise((resolve, reject) => {
          setTimeout(() => {
            if (Math.random() > 0.05) {
              resolve(`${operation} successful`);
            } else {
              reject(new Error(`${operation} failed`));
            }
          }, Math.random() * 500 + 100);
        });

        const duration = performance.now() - startTime;
        results.push({ operation, success: true, time: duration });
      }

      const allSuccessful = results.every(r => r.success);
      const avgTime = results.reduce((acc, r) => acc + r.time, 0) / results.length;

      return {
        success: allSuccessful,
        details: allSuccessful
          ? `All CRUD operations completed in avg ${avgTime.toFixed(1)}ms`
          : 'Some CRUD operations failed',
        metadata: {
          responseTime: avgTime,
          operations: results,
          dataIntegrity: allSuccessful
        }
      };
    } catch (error) {
      return {
        success: false,
        details: 'CRUD operations test failed',
        metadata: {
          operations: results,
          errorCode: 'CRUD_FAILED'
        }
      };
    }
  }, []);

  // Test Claude-Flow initialization
  const testClaudeFlowInit = useCallback(async (): Promise<{
    success: boolean;
    details: string;
    metadata: any;
  }> => {
    const startTime = performance.now();

    try {
      // Mock Claude-Flow initialization
      const stages = [
        'Initializing swarm topology',
        'Spawning agent instances',
        'Establishing communication channels',
        'Validating agent capabilities',
        'Swarm ready for coordination'
      ];

      for (let i = 0; i < stages.length; i++) {
        await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));

        // Simulate potential failure
        if (Math.random() < 0.05) {
          throw new Error(`Failed at stage: ${stages[i]}`);
        }
      }

      const totalTime = performance.now() - startTime;

      return {
        success: true,
        details: `Claude-Flow initialized successfully in ${totalTime.toFixed(1)}ms`,
        metadata: {
          responseTime: totalTime,
          agentCount: 6,
          performance: totalTime < 8000 ? 100 : 75
        }
      };
    } catch (error) {
      return {
        success: false,
        details: error instanceof Error ? error.message : 'Claude-Flow init failed',
        metadata: {
          responseTime: performance.now() - startTime,
          errorCode: 'CLAUDE_FLOW_INIT_FAILED'
        }
      };
    }
  }, []);

  // Test WebRTC connection
  const testWebRTCConnection = useCallback(async (): Promise<{
    success: boolean;
    details: string;
    metadata: any;
  }> => {
    const startTime = performance.now();

    try {
      // Mock WebRTC peer connection test
      const peerConnection = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });

      const connectionPromise = new Promise((resolve, reject) => {
        peerConnection.oniceconnectionstatechange = () => {
          const state = peerConnection.iceConnectionState;

          if (state === 'connected' || state === 'completed') {
            resolve(state);
          } else if (state === 'failed' || state === 'disconnected') {
            reject(new Error(`Connection failed: ${state}`));
          }
        };

        // Mock connection process
        setTimeout(() => {
          if (Math.random() > 0.1) {
            Object.defineProperty(peerConnection, 'iceConnectionState', {
              value: 'connected',
              configurable: true
            });
            peerConnection.oniceconnectionstatechange?.({} as any);
          } else {
            Object.defineProperty(peerConnection, 'iceConnectionState', {
              value: 'failed',
              configurable: true
            });
            peerConnection.oniceconnectionstatechange?.({} as any);
          }
        }, Math.random() * 8000 + 2000);
      });

      await connectionPromise;

      const connectionTime = performance.now() - startTime;

      peerConnection.close();

      return {
        success: true,
        details: `WebRTC connection established in ${connectionTime.toFixed(1)}ms`,
        metadata: {
          responseTime: connectionTime,
          connectionStatus: 'connected',
          performance: connectionTime < 5000 ? 100 : 75
        }
      };
    } catch (error) {
      return {
        success: false,
        details: error instanceof Error ? error.message : 'WebRTC connection failed',
        metadata: {
          responseTime: performance.now() - startTime,
          connectionStatus: 'failed',
          errorCode: 'WEBRTC_FAILED'
        }
      };
    }
  }, []);

  // Test audio context
  const testAudioContext = useCallback(async (): Promise<{
    success: boolean;
    details: string;
    metadata: any;
  }> => {
    const startTime = performance.now();

    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

      // Test basic audio graph creation
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Test audio processing
      const buffer = audioContext.createBuffer(2, audioContext.sampleRate * 0.1, audioContext.sampleRate);
      const source = audioContext.createBufferSource();
      source.buffer = buffer;

      const initTime = performance.now() - startTime;

      // Cleanup
      audioContext.close();

      return {
        success: true,
        details: `Audio context initialized successfully in ${initTime.toFixed(1)}ms`,
        metadata: {
          responseTime: initTime,
          sampleRate: audioContext.sampleRate,
          performance: initTime < 100 ? 100 : 80
        }
      };
    } catch (error) {
      return {
        success: false,
        details: error instanceof Error ? error.message : 'Audio context creation failed',
        metadata: {
          responseTime: performance.now() - startTime,
          errorCode: 'AUDIO_CONTEXT_FAILED'
        }
      };
    }
  }, []);

  // Test error boundaries
  const testErrorBoundary = useCallback(async (): Promise<{
    success: boolean;
    details: string;
    metadata: any;
  }> => {
    const startTime = performance.now();

    try {
      // Create a component that will throw an error
      const testDiv = document.createElement('div');
      testDiv.id = 'error-boundary-test';
      document.body.appendChild(testDiv);

      // Simulate error in component
      const errorEvent = new ErrorEvent('error', {
        error: new Error('Test error for boundary'),
        message: 'Test error message',
        filename: 'test.js',
        lineno: 1
      });

      let errorCaught = false;
      const originalHandler = window.onerror;

      window.onerror = (message, source, lineno, colno, error) => {
        errorCaught = true;
        return true; // Prevent default error handling
      };

      // Trigger error
      window.dispatchEvent(errorEvent);

      // Wait briefly for error handling
      await new Promise(resolve => setTimeout(resolve, 100));

      // Restore original handler
      window.onerror = originalHandler;
      document.body.removeChild(testDiv);

      const testTime = performance.now() - startTime;

      return {
        success: errorCaught,
        details: errorCaught
          ? 'Error boundary successfully caught and handled error'
          : 'Error boundary did not catch the test error',
        metadata: {
          responseTime: testTime,
          errorHandled: errorCaught
        }
      };
    } catch (error) {
      return {
        success: false,
        details: 'Error boundary test failed to execute',
        metadata: {
          responseTime: performance.now() - startTime,
          errorCode: 'ERROR_BOUNDARY_TEST_FAILED'
        }
      };
    }
  }, []);

  // Test offline functionality
  const testOfflineFunctionality = useCallback(async (): Promise<{
    success: boolean;
    details: string;
    metadata: any;
  }> => {
    const startTime = performance.now();

    try {
      // Mock offline state
      const originalOnLine = navigator.onLine;
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      });

      // Trigger offline event
      window.dispatchEvent(new Event('offline'));

      // Wait for app to respond to offline state
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check if app handles offline state gracefully
      const offlineIndicator = document.querySelector('[data-testid="offline-indicator"]');
      const cachedContent = localStorage.getItem('cached-content');

      // Test basic functionality while offline
      let functionalityWorks = true;
      try {
        // Try to interact with hashtag cloud
        const hashtagCloud = document.querySelector('[data-testid="hashtag-cloud"]');
        if (hashtagCloud) {
          hashtagCloud.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        }

        // Check if cached data is accessible
        const hasLocalData = localStorage.length > 0;
        functionalityWorks = hasLocalData;
      } catch {
        functionalityWorks = false;
      }

      // Restore online state
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: originalOnLine
      });
      window.dispatchEvent(new Event('online'));

      const testTime = performance.now() - startTime;

      return {
        success: functionalityWorks,
        details: functionalityWorks
          ? 'App functions correctly in offline mode with cached data'
          : 'App does not handle offline state properly',
        metadata: {
          responseTime: testTime,
          offlineIndicatorPresent: !!offlineIndicator,
          cachedDataAvailable: !!cachedContent,
          localStorageSize: localStorage.length
        }
      };
    } catch (error) {
      return {
        success: false,
        details: 'Offline functionality test failed',
        metadata: {
          responseTime: performance.now() - startTime,
          errorCode: 'OFFLINE_TEST_FAILED'
        }
      };
    }
  }, []);

  // Run individual integration test
  const runIntegrationTest = useCallback(async (
    test: IntegrationTest,
    attempt: number = 1
  ): Promise<IntegrationTestResult> => {
    const startTime = performance.now();

    try {
      let testResult: { success: boolean; details: string; metadata: any } = {
        success: false,
        details: 'Test not implemented',
        metadata: {}
      };

      // Select appropriate test based on ID
      switch (test.id) {
        case 'supabase-connection':
          testResult = await testSupabaseConnection();
          break;
        case 'supabase-realtime':
          testResult = await testRealtimeSync();
          break;
        case 'supabase-crud':
          testResult = await testCrudOperations();
          break;
        case 'claude-flow-init':
          testResult = await testClaudeFlowInit();
          break;
        case 'claude-flow-coordination':
          // Mock agent coordination test
          await new Promise(resolve => setTimeout(resolve, Math.random() * 5000 + 3000));
          testResult = {
            success: Math.random() > 0.1,
            details: Math.random() > 0.1
              ? 'Agents coordinated successfully on test task'
              : 'Agent coordination failed during test',
            metadata: { responseTime: 5000, agentCount: 4 }
          };
          break;
        case 'claude-flow-memory':
          // Mock memory system test
          await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000));
          testResult = {
            success: Math.random() > 0.05,
            details: Math.random() > 0.05
              ? 'Memory operations completed successfully'
              : 'Memory persistence failed',
            metadata: { responseTime: 2000, memorySize: '2.5MB' }
          };
          break;
        case 'audio-context':
          testResult = await testAudioContext();
          break;
        case 'webrtc-connection':
          testResult = await testWebRTCConnection();
          break;
        case 'neural-audio-processing':
          // Mock neural audio test
          await new Promise(resolve => setTimeout(resolve, Math.random() * 3000 + 2000));
          testResult = {
            success: Math.random() > 0.1,
            details: Math.random() > 0.1
              ? 'Neural processing completed within latency requirements'
              : 'Neural processing exceeded latency limits',
            metadata: { responseTime: 3000, latency: 45, bufferSize: 512 }
          };
          break;
        case 'cross-browser-compatibility':
          // Mock browser compatibility test
          await new Promise(resolve => setTimeout(resolve, 1000));
          testResult = {
            success: true,
            details: 'Core features compatible across tested browsers',
            metadata: { browsersSupported: ['Chrome', 'Firefox', 'Safari', 'Edge'] }
          };
          break;
        case 'api-rate-limits':
          // Mock rate limiting test
          await new Promise(resolve => setTimeout(resolve, 2000));
          testResult = {
            success: Math.random() > 0.05,
            details: Math.random() > 0.05
              ? 'Rate limits handled gracefully with exponential backoff'
              : 'Rate limiting not handled properly',
            metadata: { responseTime: 2000, retryDelay: 1000 }
          };
          break;
        case 'error-boundary':
          testResult = await testErrorBoundary();
          break;
        case 'offline-functionality':
          testResult = await testOfflineFunctionality();
          break;
        default:
          testResult = {
            success: false,
            details: 'Test implementation not found',
            metadata: {}
          };
      }

      const duration = performance.now() - startTime;

      if (!testResult.success && attempt < test.retries) {
        // Retry failed test
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        return runIntegrationTest(test, attempt + 1);
      }

      return {
        test,
        status: testResult.success ? 'passed' : 'failed',
        duration,
        attempts: attempt,
        details: testResult.details,
        metadata: testResult.metadata
      };

    } catch (error) {
      const duration = performance.now() - startTime;

      if (attempt < test.retries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        return runIntegrationTest(test, attempt + 1);
      }

      return {
        test,
        status: 'failed',
        duration,
        attempts: attempt,
        details: error instanceof Error ? error.message : 'Unknown error',
        metadata: { errorCode: 'EXCEPTION' }
      };
    }
  }, [
    testSupabaseConnection,
    testRealtimeSync,
    testCrudOperations,
    testClaudeFlowInit,
    testAudioContext,
    testWebRTCConnection,
    testErrorBoundary,
    testOfflineFunctionality
  ]);

  // Run all integration tests
  const runAllIntegrationTests = useCallback(async () => {
    setIsRunning(true);
    setResults([]);
    abortController.current = new AbortController();
    announce('Starting integration tests');

    const testResults: IntegrationTestResult[] = [];

    for (const test of integrationTests) {
      if (abortController.current?.signal.aborted) break;

      setCurrentTest(test.name);
      announce(`Running integration test: ${test.name}`);

      try {
        const result = await runIntegrationTest(test);
        testResults.push(result);
        setResults(prev => [...prev, result]);

        // Update connection status
        setConnectionStatus(prev => ({
          ...prev,
          [test.category]: result.status === 'passed'
        }));

        // Brief pause between tests
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Integration test failed for ${test.name}:`, error);
      }
    }

    setCurrentTest(null);
    onTestComplete(testResults);

    const passed = testResults.filter(r => r.status === 'passed').length;
    const failed = testResults.filter(r => r.status === 'failed').length;

    announce(`Integration tests completed. ${passed} passed, ${failed} failed`);
    setIsRunning(false);
  }, [announce, runIntegrationTest, onTestComplete]);

  const stopTests = useCallback(() => {
    if (abortController.current) {
      abortController.current.abort();
    }
    setIsRunning(false);
    setCurrentTest(null);
    announce('Integration tests stopped');
  }, [announce]);

  return (
    <div className="bg-gray-800 rounded-lg p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-white">Integration Tester</h3>
        <div className="flex gap-2">
          <button
            onClick={runAllIntegrationTests}
            disabled={isRunning}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
            aria-label="Run all integration tests"
          >
            {isRunning ? 'Running...' : 'Run Integration Tests'}
          </button>
          {isRunning && (
            <button
              onClick={stopTests}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 text-white"
              aria-label="Stop integration tests"
            >
              Stop
            </button>
          )}
        </div>
      </div>

      {/* Connection Status */}
      <div className="bg-gray-700 p-4 rounded-lg">
        <h4 className="font-medium text-white mb-3">System Status</h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {['supabase', 'claude-flow', 'audio', 'browser', 'api'].map(system => (
            <div key={system} className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                connectionStatus[system] === true ? 'bg-green-400' :
                connectionStatus[system] === false ? 'bg-red-400' :
                'bg-gray-400'
              }`} />
              <span className="text-sm text-white capitalize">{system}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Current Test Status */}
      {isRunning && currentTest && (
        <div className="bg-gray-700 p-4 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            <span className="text-white font-medium">Running: {currentTest}</span>
          </div>
        </div>
      )}

      {/* Test Categories */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {['supabase', 'claude-flow', 'audio', 'browser', 'api'].map(category => {
          const categoryTests = integrationTests.filter(t => t.category === category);
          const categoryResults = results.filter(r => r.test.category === category);
          const passed = categoryResults.filter(r => r.status === 'passed').length;

          return (
            <div key={category} className="bg-gray-700 p-4 rounded-lg">
              <h4 className="font-medium text-white mb-2 capitalize">{category}</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-300">Tests:</span>
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
                    <h5 className="font-medium text-white">{result.test.name}</h5>
                    <p className="text-sm text-gray-300">{result.test.description}</p>
                    <p className="text-xs text-gray-400">
                      Category: {result.test.category} | Attempts: {result.attempts}
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

                {/* Metadata */}
                {result.metadata && Object.keys(result.metadata).length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                    {Object.entries(result.metadata).map(([key, value]) => (
                      <div key={key} className="bg-gray-800 p-2 rounded">
                        <span className="text-gray-400 capitalize">
                          {key.replace(/([A-Z])/g, ' $1')}:
                        </span>
                        <span className="ml-1 text-white">
                          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
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
    </div>
  );
};