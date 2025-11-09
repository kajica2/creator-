import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';

export interface SentryConfig {
  dsn: string;
  environment: string;
  debug: boolean;
  tracesSampleRate: number;
  profilesSampleRate: number;
}

export const sentryConfig: SentryConfig = {
  dsn: import.meta.env.VITE_SENTRY_DSN || '',
  environment: import.meta.env.NODE_ENV || 'development',
  debug: import.meta.env.NODE_ENV === 'development',
  tracesSampleRate: import.meta.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  profilesSampleRate: import.meta.env.NODE_ENV === 'production' ? 0.1 : 1.0,
};

export function initializeSentry() {
  if (!sentryConfig.dsn) {
    console.warn('Sentry DSN not configured. Error tracking disabled.');
    return;
  }

  Sentry.init({
    dsn: sentryConfig.dsn,
    environment: sentryConfig.environment,
    debug: sentryConfig.debug,
    integrations: [
      new BrowserTracing({
        // Capture interactions with React components
        tracePropagationTargets: [
          'localhost',
          /^https:\/\/[^/]*\.supabase\.co/,
          /^https:\/\/api\.openai\.com/,
          /^https:\/\/api\.stability\.ai/,
          /^https:\/\/api\.eleven-labs\.io/,
        ],
      }),
      // Custom integration for AI operations
      {
        name: 'AIOperationsIntegration',
        setupOnce() {
          // Custom setup for AI operation tracking
        },
      },
    ],
    tracesSampleRate: sentryConfig.tracesSampleRate,
    profilesSampleRate: sentryConfig.profilesSampleRate,

    // Custom error filtering for AI-specific issues
    beforeSend(event) {
      // Filter out expected development errors
      if (sentryConfig.debug && event.exception) {
        const error = event.exception.values?.[0];
        if (error?.value?.includes('ResizeObserver loop limit exceeded')) {
          return null;
        }
      }

      // Add AI operation context
      if (event.contexts?.ai_operation) {
        event.tags = {
          ...event.tags,
          ai_operation_type: event.contexts.ai_operation.type,
          ai_model: event.contexts.ai_operation.model,
        };
      }

      return event;
    },

    // Performance monitoring for AI operations
    beforeSendTransaction(event) {
      // Add custom tags for AI operations
      if (event.transaction?.includes('ai-generation')) {
        event.tags = {
          ...event.tags,
          operation_type: 'ai_generation',
        };
      }

      if (event.transaction?.includes('supabase')) {
        event.tags = {
          ...event.tags,
          operation_type: 'database',
        };
      }

      return event;
    },
  });

  // Set up global error handlers
  window.addEventListener('unhandledrejection', (event) => {
    Sentry.captureException(event.reason);
  });
}

// Custom Sentry utilities for AI operations
export const SentryUtils = {
  // Track AI generation operations
  trackAIGeneration(type: 'hashtag' | 'image' | 'audio', model: string) {
    return Sentry.startTransaction({
      name: `AI Generation: ${type}`,
      op: 'ai.generation',
      tags: {
        ai_type: type,
        ai_model: model,
      },
    });
  },

  // Track Supabase operations
  trackSupabaseOperation(operation: string, table?: string) {
    return Sentry.startTransaction({
      name: `Supabase: ${operation}`,
      op: 'db.query',
      tags: {
        db_operation: operation,
        db_table: table,
      },
    });
  },

  // Add user context
  setUserContext(userId: string, email?: string) {
    Sentry.setUser({
      id: userId,
      email,
    });
  },

  // Add AI operation context
  setAIContext(type: string, model: string, prompt?: string) {
    Sentry.setContext('ai_operation', {
      type,
      model,
      prompt: prompt?.substring(0, 100), // Truncate long prompts
      timestamp: new Date().toISOString(),
    });
  },

  // Report AI errors with context
  reportAIError(error: Error, context: {
    type: 'hashtag' | 'image' | 'audio';
    model: string;
    prompt?: string;
    response?: any;
  }) {
    Sentry.withScope((scope) => {
      scope.setTag('error_type', 'ai_generation');
      scope.setTag('ai_type', context.type);
      scope.setTag('ai_model', context.model);

      scope.setContext('ai_operation', {
        type: context.type,
        model: context.model,
        prompt: context.prompt?.substring(0, 200),
        response: context.response ? JSON.stringify(context.response).substring(0, 500) : null,
      });

      Sentry.captureException(error);
    });
  },

  // Report quota/rate limit errors
  reportQuotaError(service: string, error: Error, usage?: any) {
    Sentry.withScope((scope) => {
      scope.setTag('error_type', 'quota_limit');
      scope.setTag('service', service);
      scope.setLevel('warning');

      scope.setContext('quota_info', {
        service,
        usage,
        timestamp: new Date().toISOString(),
      });

      Sentry.captureException(error);
    });
  },

  // Performance monitoring
  addBreadcrumb(message: string, category: string, data?: any) {
    Sentry.addBreadcrumb({
      message,
      category,
      data,
      timestamp: Date.now() / 1000,
    });
  },
};