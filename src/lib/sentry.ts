import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/react';

export function initSentry() {
  // Only initialize in production or if SENTRY_DSN is set
  const dsn = import.meta.env.VITE_SENTRY_DSN;

  if (!dsn) {
    console.log('Sentry DSN not configured, skipping initialization');
    return;
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    integrations: [
      new BrowserTracing({
        // Set sampling rates
        tracingOrigins: [
          'localhost',
          'reamp-sooty.vercel.app',
          /^\//,
        ],
        // Performance Monitoring
        routingInstrumentation: Sentry.reactRouterV6Instrumentation(
          window.history
        ),
      }),
      new Sentry.Replay({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    // Performance Monitoring
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,

    // Session Replay
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    // Release tracking
    release: import.meta.env.VITE_APP_VERSION || 'unknown',

    // Error filtering
    beforeSend(event, hint) {
      // Filter out non-critical errors
      if (event.exception) {
        const error = hint.originalException;

        // Skip network errors in development
        if (!import.meta.env.PROD && error instanceof TypeError &&
            error.message.includes('Failed to fetch')) {
          return null;
        }

        // Skip authentication errors (handled by app)
        if (error?.message?.includes('Auth session missing')) {
          return null;
        }

        // Add user context if available
        const user = getCurrentUser();
        if (user) {
          event.user = {
            id: user.id,
            email: user.email,
          };
        }
      }

      return event;
    },

    // Breadcrumb filtering
    beforeBreadcrumb(breadcrumb) {
      // Filter out noisy breadcrumbs
      if (breadcrumb.category === 'console' && breadcrumb.level === 'debug') {
        return null;
      }

      // Add custom context to navigation breadcrumbs
      if (breadcrumb.category === 'navigation') {
        breadcrumb.data = {
          ...breadcrumb.data,
          timestamp: new Date().toISOString(),
        };
      }

      return breadcrumb;
    },
  });
}

// Helper to get current user from localStorage
function getCurrentUser() {
  try {
    const authData = localStorage.getItem('reamp-auth-token');
    if (authData) {
      const parsed = JSON.parse(authData);
      return parsed?.user || null;
    }
  } catch {
    return null;
  }
  return null;
}

// Custom error capture with context
export function captureError(error: Error, context?: Record<string, any>) {
  Sentry.captureException(error, {
    contexts: {
      custom: context || {},
    },
  });
}

// Track custom events
export function trackEvent(eventName: string, data?: Record<string, any>) {
  Sentry.captureMessage(eventName, {
    level: 'info',
    extra: data,
  });
}

// Add user context
export function setUserContext(user: { id: string; email?: string; username?: string }) {
  Sentry.setUser(user);
}

// Clear user context on logout
export function clearUserContext() {
  Sentry.setUser(null);
}

// Performance monitoring helpers
export function startTransaction(name: string, op: string = 'navigation') {
  return Sentry.startTransaction({
    name,
    op,
  });
}

// Track API performance
export function trackApiCall(endpoint: string, duration: number, success: boolean) {
  const transaction = Sentry.getCurrentHub().getScope()?.getTransaction();
  if (transaction) {
    const span = transaction.startChild({
      op: 'http',
      description: endpoint,
    });
    span.setStatus(success ? 'ok' : 'internal_error');
    span.finish();
  }
}

// AI Integration tracking
export function trackAICall(provider: string, operation: string, success: boolean, duration?: number) {
  Sentry.addBreadcrumb({
    category: 'ai',
    message: `${provider} ${operation}`,
    level: success ? 'info' : 'error',
    data: {
      provider,
      operation,
      success,
      duration,
    },
  });
}