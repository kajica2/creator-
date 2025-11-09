import React, { Component, ErrorInfo, ReactNode } from 'react';
import * as Sentry from '@sentry/react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });

    // Report to Sentry with additional context
    Sentry.withScope((scope) => {
      scope.setTag('error_boundary', true);
      scope.setContext('error_info', {
        componentStack: errorInfo.componentStack,
        errorBoundary: this.constructor.name,
      });

      Sentry.captureException(error);
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="error-boundary">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-lg mx-auto mt-8">
            <div className="flex items-center mb-4">
              <svg
                className="w-6 h-6 text-red-500 mr-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h2 className="text-lg font-semibold text-red-800">
                Something went wrong
              </h2>
            </div>

            <p className="text-red-700 mb-4">
              We've encountered an unexpected error. Our team has been notified and is working to fix it.
            </p>

            <div className="space-y-3">
              <button
                onClick={() => this.setState({ hasError: false, error: undefined, errorInfo: undefined })}
                className="w-full bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>

              <button
                onClick={() => window.location.reload()}
                className="w-full bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700 transition-colors"
              >
                Reload Page
              </button>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4">
                <summary className="text-red-600 cursor-pointer font-medium">
                  Error Details (Development)
                </summary>
                <pre className="mt-2 p-3 bg-red-100 rounded text-sm text-red-800 overflow-auto">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// HOC for wrapping components with error boundaries
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WrappedComponent(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}

// Specialized error boundary for AI operations
interface AIErrorBoundaryProps extends Props {
  operationType: 'hashtag' | 'image' | 'audio';
  model?: string;
}

export class AIErrorBoundary extends Component<AIErrorBoundaryProps, State> {
  constructor(props: AIErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });

    // Report AI-specific errors to Sentry
    Sentry.withScope((scope) => {
      scope.setTag('error_boundary', 'ai_operation');
      scope.setTag('ai_operation_type', this.props.operationType);
      if (this.props.model) {
        scope.setTag('ai_model', this.props.model);
      }

      scope.setContext('ai_error_info', {
        operationType: this.props.operationType,
        model: this.props.model,
        componentStack: errorInfo.componentStack,
      });

      Sentry.captureException(error);
    });

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      const operationName = this.props.operationType;

      return (
        <div className="ai-error-boundary">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <svg
                className="w-6 h-6 text-yellow-500 mr-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3 className="text-lg font-medium text-yellow-800">
                {operationName} Generation Failed
              </h3>
            </div>

            <p className="text-yellow-700 mb-4">
              We couldn't generate your {operationName} at this time. This might be due to:
            </p>

            <ul className="list-disc list-inside text-yellow-700 mb-4 space-y-1">
              <li>AI service temporarily unavailable</li>
              <li>Rate limit exceeded</li>
              <li>Invalid input parameters</li>
              <li>Network connectivity issues</li>
            </ul>

            <button
              onClick={() => this.setState({ hasError: false, error: undefined, errorInfo: undefined })}
              className="bg-yellow-600 text-white py-2 px-4 rounded hover:bg-yellow-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}