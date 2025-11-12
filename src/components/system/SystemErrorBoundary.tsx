import React, { Component, ErrorInfo, ReactNode } from 'react';
import { connectionManager } from '../../shared/system/ConnectionManager';
import { audioContextManager } from '../../shared/audio/AudioContextManager';
import { progressReporter } from '../../shared/system/ProgressStatusReporter';

interface Props {
  children: ReactNode;
  fallback?: (error: Error, retry: () => void) => ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  isOffline: boolean;
  audioError: boolean;
}

export class SystemErrorBoundary extends Component<Props, State> {
  private retryCount = 0;
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);

    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isOffline: false,
      audioError: false
    };
  }

  componentDidMount() {
    // Listen for connection changes
    connectionManager.subscribe((connectionState) => {
      this.setState({
        isOffline: !connectionState.isOnline || !connectionState.supabaseConnected
      });
    });

    // Listen for audio context issues
    audioContextManager.subscribe((audioState) => {
      this.setState({
        audioError: !audioState.isSupported || audioState.error !== undefined
      });
    });

    // Global error handlers
    window.addEventListener('error', this.handleGlobalError);
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection);
  }

  componentWillUnmount() {
    window.removeEventListener('error', this.handleGlobalError);
    window.removeEventListener('unhandledrejection', this.handleUnhandledRejection);
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      errorInfo
    });

    // Log error details
    console.error('SystemErrorBoundary caught error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      retryCount: this.retryCount
    });

    // Report error to progress system
    this.reportError(error, errorInfo);
  }

  handleGlobalError = (event: ErrorEvent) => {
    console.error('Global error:', event.error);

    // Handle specific error types
    if (event.error?.message?.includes('AudioContext')) {
      this.setState({ audioError: true });
    }

    if (event.error?.message?.includes('Failed to fetch') ||
        event.error?.message?.includes('ERR_NAME_NOT_RESOLVED')) {
      connectionManager.checkSupabaseConnection();
    }
  };

  handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    console.error('Unhandled promise rejection:', event.reason);

    // Handle network-related rejections
    if (event.reason?.message?.includes('Failed to fetch')) {
      connectionManager.checkSupabaseConnection();
      event.preventDefault(); // Prevent console spam
    }
  };

  reportError = (error: Error, errorInfo?: ErrorInfo) => {
    const reportId = `error_${Date.now()}`;
    progressReporter.createReport(reportId, 'Error Recovery', [
      'Analyze error',
      'Check system state',
      'Attempt recovery',
      'Restore functionality'
    ]);

    progressReporter.startStep(reportId, 0, 'Analyzing error...');
    progressReporter.updateStepProgress(reportId, 0, 50, `Error: ${error.message}`);
    progressReporter.completeStep(reportId, 0, 'Error analyzed');

    progressReporter.startStep(reportId, 1, 'Checking system state...');
    const isNetworkError = error.message?.includes('fetch') || error.message?.includes('network');
    const isAudioError = error.message?.includes('AudioContext') || error.message?.includes('audio');

    if (isNetworkError) {
      progressReporter.updateStepProgress(reportId, 1, 75, 'Network error detected');
    } else if (isAudioError) {
      progressReporter.updateStepProgress(reportId, 1, 75, 'Audio error detected');
    }
    progressReporter.completeStep(reportId, 1, 'System state checked');

    progressReporter.startStep(reportId, 2, 'Attempting recovery...');
    // Recovery will be handled by retry mechanism
  };

  retry = () => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null
      });

      // Trigger system recovery
      this.performSystemRecovery();
    }
  };

  performSystemRecovery = async () => {
    const reportId = `recovery_${Date.now()}`;
    progressReporter.createReport(reportId, 'System Recovery', [
      'Reset error state',
      'Check connectivity',
      'Restore audio context',
      'Clear caches'
    ]);

    try {
      // Step 1: Reset error state
      progressReporter.startStep(reportId, 0, 'Resetting error state...');
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null
      });
      progressReporter.completeStep(reportId, 0, 'Error state reset');

      // Step 2: Check connectivity
      progressReporter.startStep(reportId, 1, 'Checking connectivity...');
      await connectionManager.forceRetry();
      progressReporter.completeStep(reportId, 1, 'Connectivity checked');

      // Step 3: Restore audio context
      progressReporter.startStep(reportId, 2, 'Restoring audio context...');
      try {
        if (audioContextManager.getState().hasUserGesture) {
          await audioContextManager.resumeContext();
        }
        progressReporter.completeStep(reportId, 2, 'Audio context restored');
      } catch (audioError) {
        progressReporter.warnStep(reportId, 2, 'Audio context needs user gesture');
      }

      // Step 4: Clear caches
      progressReporter.startStep(reportId, 3, 'Clearing caches...');
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
      progressReporter.completeStep(reportId, 3, 'Caches cleared');

      progressReporter.completeReport(reportId, 'System recovery completed');

    } catch (error) {
      progressReporter.failReport(reportId, error instanceof Error ? error.message : 'Recovery failed');
    }
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback provided
      if (this.props.fallback) {
        return this.props.fallback(this.state.error!, this.retry);
      }

      // Default error UI
      return (
        <ErrorFallbackUI
          error={this.state.error!}
          errorInfo={this.state.errorInfo}
          isOffline={this.state.isOffline}
          audioError={this.state.audioError}
          retryCount={this.retryCount}
          maxRetries={this.maxRetries}
          onRetry={this.retry}
          onDiagnose={() => connectionManager.diagnoseConnection()}
          onClearData={() => {
            localStorage.clear();
            sessionStorage.clear();
            location.reload();
          }}
        />
      );
    }

    return this.props.children;
  }
}

interface ErrorFallbackUIProps {
  error: Error;
  errorInfo: ErrorInfo | null;
  isOffline: boolean;
  audioError: boolean;
  retryCount: number;
  maxRetries: number;
  onRetry: () => void;
  onDiagnose: () => void;
  onClearData: () => void;
}

const ErrorFallbackUI: React.FC<ErrorFallbackUIProps> = ({
  error,
  errorInfo,
  isOffline,
  audioError,
  retryCount,
  maxRetries,
  onRetry,
  onDiagnose,
  onClearData
}) => {
  const getErrorType = () => {
    if (isOffline) return 'Connection Error';
    if (audioError) return 'Audio Error';
    if (error.message?.includes('ChunkLoadError')) return 'Loading Error';
    return 'Application Error';
  };

  const getErrorSuggestions = () => {
    const suggestions = [];

    if (isOffline) {
      suggestions.push('Check your internet connection');
      suggestions.push('Verify Supabase service is available');
    }

    if (audioError) {
      suggestions.push('Click anywhere to enable audio');
      suggestions.push('Check browser audio permissions');
    }

    if (error.message?.includes('ChunkLoadError')) {
      suggestions.push('Clear browser cache and refresh');
      suggestions.push('Application may have been updated');
    }

    if (suggestions.length === 0) {
      suggestions.push('Try refreshing the page');
      suggestions.push('Clear browser data if problem persists');
    }

    return suggestions;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-6">
        {/* Error Header */}
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-500/20 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-red-500 mb-2">{getErrorType()}</h1>
          <p className="text-gray-400">Something went wrong with the application</p>
        </div>

        {/* Status Indicators */}
        <div className="grid grid-cols-2 gap-4">
          <div className={`p-3 rounded-lg border ${isOffline ? 'border-red-500/50 bg-red-500/10' : 'border-green-500/50 bg-green-500/10'}`}>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isOffline ? 'bg-red-500' : 'bg-green-500'}`} />
              <span className="text-sm">
                Connection: {isOffline ? 'Offline' : 'Online'}
              </span>
            </div>
          </div>
          <div className={`p-3 rounded-lg border ${audioError ? 'border-yellow-500/50 bg-yellow-500/10' : 'border-green-500/50 bg-green-500/10'}`}>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${audioError ? 'bg-yellow-500' : 'bg-green-500'}`} />
              <span className="text-sm">
                Audio: {audioError ? 'Needs Permission' : 'Available'}
              </span>
            </div>
          </div>
        </div>

        {/* Error Details */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-2">Error Details</h3>
          <p className="text-red-400 font-mono text-sm mb-2">{error.message}</p>
          {retryCount > 0 && (
            <p className="text-yellow-400 text-sm">
              Retry attempts: {retryCount} / {maxRetries}
            </p>
          )}
        </div>

        {/* Suggestions */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3">Suggested Solutions</h3>
          <ul className="space-y-2">
            {getErrorSuggestions().map((suggestion, index) => (
              <li key={index} className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                <span className="text-gray-300">{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          {retryCount < maxRetries && (
            <button
              onClick={onRetry}
              className="flex-1 min-w-[120px] px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
            >
              Try Again
            </button>
          )}

          <button
            onClick={onDiagnose}
            className="flex-1 min-w-[120px] px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors"
          >
            Diagnose Issue
          </button>

          <button
            onClick={() => window.location.reload()}
            className="flex-1 min-w-[120px] px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors"
          >
            Refresh Page
          </button>

          <button
            onClick={onClearData}
            className="flex-1 min-w-[120px] px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors"
          >
            Clear All Data
          </button>
        </div>

        {/* Technical Details (Collapsible) */}
        <details className="bg-gray-800 rounded-lg p-4">
          <summary className="cursor-pointer text-sm text-gray-400 hover:text-white">
            Technical Details
          </summary>
          <div className="mt-3 space-y-2 text-xs text-gray-500 font-mono">
            <div>
              <strong>Error:</strong> {error.name} - {error.message}
            </div>
            {error.stack && (
              <div>
                <strong>Stack Trace:</strong>
                <pre className="mt-1 whitespace-pre-wrap">{error.stack}</pre>
              </div>
            )}
            {errorInfo?.componentStack && (
              <div>
                <strong>Component Stack:</strong>
                <pre className="mt-1 whitespace-pre-wrap">{errorInfo.componentStack}</pre>
              </div>
            )}
            <div>
              <strong>User Agent:</strong> {navigator.userAgent}
            </div>
            <div>
              <strong>Timestamp:</strong> {new Date().toISOString()}
            </div>
          </div>
        </details>
      </div>
    </div>
  );
};

export default SystemErrorBoundary;