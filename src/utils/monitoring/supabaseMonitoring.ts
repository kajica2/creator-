import { SentryUtils } from '../../config/sentry/sentry.config';
import { SupabaseClient } from '@supabase/supabase-js';

export interface SupabaseOperationContext {
  operation: 'select' | 'insert' | 'update' | 'delete' | 'rpc' | 'auth';
  table?: string;
  userId?: string;
  query?: string;
}

export class SupabaseMonitor {
  private static instance: SupabaseMonitor;
  private operationCounts: Map<string, number> = new Map();
  private slowQueries: Array<{ query: string; duration: number; timestamp: Date }> = [];

  static getInstance(): SupabaseMonitor {
    if (!SupabaseMonitor.instance) {
      SupabaseMonitor.instance = new SupabaseMonitor();
    }
    return SupabaseMonitor.instance;
  }

  // Wrap Supabase client with monitoring
  wrapSupabaseClient(client: SupabaseClient) {
    const originalFrom = client.from.bind(client);
    const originalAuth = client.auth;
    const originalRpc = client.rpc.bind(client);

    // Monitor table operations
    client.from = (table: string) => {
      const queryBuilder = originalFrom(table);
      return this.wrapQueryBuilder(queryBuilder, table);
    };

    // Monitor RPC calls
    client.rpc = (fn: string, args?: any, options?: any) => {
      const startTime = Date.now();
      const transaction = SentryUtils.trackSupabaseOperation('rpc', fn);

      SentryUtils.addBreadcrumb(
        `Supabase RPC call: ${fn}`,
        'db.rpc',
        { function: fn, args }
      );

      const result = originalRpc(fn, args, options);

      if (result instanceof Promise) {
        return result
          .then((response) => {
            const duration = Date.now() - startTime;
            this.trackOperation('rpc', fn, duration, true);
            transaction.finish();
            return response;
          })
          .catch((error) => {
            const duration = Date.now() - startTime;
            this.trackOperation('rpc', fn, duration, false);
            this.reportError(error, { operation: 'rpc', table: fn });
            transaction.finish();
            throw error;
          });
      }

      transaction.finish();
      return result;
    };

    // Monitor auth operations
    const originalSignIn = originalAuth.signInWithPassword?.bind(originalAuth);
    const originalSignUp = originalAuth.signUp?.bind(originalAuth);
    const originalSignOut = originalAuth.signOut?.bind(originalAuth);

    if (originalSignIn) {
      originalAuth.signInWithPassword = (credentials) => {
        const startTime = Date.now();
        const transaction = SentryUtils.trackSupabaseOperation('auth', 'signin');

        return originalSignIn(credentials)
          .then((response) => {
            const duration = Date.now() - startTime;
            this.trackOperation('auth', 'signin', duration, !response.error);

            if (response.data.user) {
              SentryUtils.setUserContext(response.data.user.id, response.data.user.email);
            }

            transaction.finish();
            return response;
          })
          .catch((error) => {
            const duration = Date.now() - startTime;
            this.trackOperation('auth', 'signin', duration, false);
            this.reportError(error, { operation: 'auth', table: 'signin' });
            transaction.finish();
            throw error;
          });
      };
    }

    if (originalSignUp) {
      originalAuth.signUp = (credentials) => {
        const startTime = Date.now();
        const transaction = SentryUtils.trackSupabaseOperation('auth', 'signup');

        return originalSignUp(credentials)
          .then((response) => {
            const duration = Date.now() - startTime;
            this.trackOperation('auth', 'signup', duration, !response.error);
            transaction.finish();
            return response;
          })
          .catch((error) => {
            const duration = Date.now() - startTime;
            this.trackOperation('auth', 'signup', duration, false);
            this.reportError(error, { operation: 'auth', table: 'signup' });
            transaction.finish();
            throw error;
          });
      };
    }

    if (originalSignOut) {
      originalAuth.signOut = () => {
        const startTime = Date.now();
        const transaction = SentryUtils.trackSupabaseOperation('auth', 'signout');

        return originalSignOut()
          .then((response) => {
            const duration = Date.now() - startTime;
            this.trackOperation('auth', 'signout', duration, !response.error);
            SentryUtils.setUserContext('', ''); // Clear user context
            transaction.finish();
            return response;
          })
          .catch((error) => {
            const duration = Date.now() - startTime;
            this.trackOperation('auth', 'signout', duration, false);
            this.reportError(error, { operation: 'auth', table: 'signout' });
            transaction.finish();
            throw error;
          });
      };
    }

    return client;
  }

  private wrapQueryBuilder(queryBuilder: any, table: string) {
    const operations = ['select', 'insert', 'update', 'delete'];

    operations.forEach(operation => {
      if (queryBuilder[operation]) {
        const original = queryBuilder[operation].bind(queryBuilder);
        queryBuilder[operation] = (...args: any[]) => {
          const result = original(...args);

          // If the result has a promise-like method, wrap it
          if (result && typeof result.then === 'function') {
            return this.wrapPromise(result, operation, table, args);
          }

          return result;
        };
      }
    });

    return queryBuilder;
  }

  private wrapPromise(promise: Promise<any>, operation: string, table: string, args?: any[]) {
    const startTime = Date.now();
    const transaction = SentryUtils.trackSupabaseOperation(operation, table);

    SentryUtils.addBreadcrumb(
      `Supabase ${operation} on ${table}`,
      'db.query',
      {
        operation,
        table,
        hasFilter: args && args.length > 0,
      }
    );

    return promise
      .then((response) => {
        const duration = Date.now() - startTime;
        this.trackOperation(operation, table, duration, !response.error);

        // Track slow queries
        if (duration > 1000) {
          this.slowQueries.push({
            query: `${operation} on ${table}`,
            duration,
            timestamp: new Date(),
          });

          SentryUtils.addBreadcrumb(
            'Slow Supabase query detected',
            'db.slow',
            { operation, table, duration }
          );
        }

        // Log query results for analysis
        if (response.data) {
          SentryUtils.addBreadcrumb(
            `Query returned ${response.data.length || 0} rows`,
            'db.result',
            {
              operation,
              table,
              rowCount: Array.isArray(response.data) ? response.data.length : response.data ? 1 : 0,
              duration,
            }
          );
        }

        transaction.finish();
        return response;
      })
      .catch((error) => {
        const duration = Date.now() - startTime;
        this.trackOperation(operation, table, duration, false);
        this.reportError(error, { operation, table });
        transaction.finish();
        throw error;
      });
  }

  private trackOperation(operation: string, table: string, duration: number, success: boolean) {
    const key = `${operation}-${table}`;
    const count = this.operationCounts.get(key) || 0;
    this.operationCounts.set(key, count + 1);

    // Performance tracking
    if (duration > 500) {
      SentryUtils.addBreadcrumb(
        'Slow Supabase operation',
        'performance.slow',
        {
          operation,
          table,
          duration,
          operationCount: count + 1,
        }
      );
    }

    // Error rate tracking
    if (!success) {
      SentryUtils.addBreadcrumb(
        'Supabase operation failed',
        'db.error',
        {
          operation,
          table,
          duration,
          operationCount: count + 1,
        }
      );
    }
  }

  private reportError(error: any, context: SupabaseOperationContext) {
    const errorDetails = {
      message: error.message,
      code: error.code,
      hint: error.hint,
      details: error.details,
    };

    SentryUtils.addBreadcrumb(
      'Supabase error occurred',
      'db.error',
      {
        ...context,
        errorDetails,
      }
    );

    // Enhanced error reporting with context
    const enhancedError = new Error(`Supabase ${context.operation} Error: ${error.message}`);
    enhancedError.stack = error.stack;

    SentryUtils.reportAIError(enhancedError, {
      type: 'database' as any,
      model: 'supabase',
      prompt: `${context.operation} on ${context.table}`,
      response: errorDetails,
    });
  }

  // Get monitoring statistics
  getOperationStats() {
    return {
      operationCounts: Object.fromEntries(this.operationCounts),
      slowQueries: this.slowQueries.slice(-10), // Last 10 slow queries
      totalOperations: Array.from(this.operationCounts.values()).reduce((a, b) => a + b, 0),
    };
  }

  // Get performance insights
  getPerformanceInsights() {
    const insights = [];

    // Analyze slow queries
    if (this.slowQueries.length > 5) {
      insights.push({
        type: 'slow_queries',
        message: `${this.slowQueries.length} slow queries detected in the last session`,
        recommendation: 'Consider adding indexes or optimizing query structure',
      });
    }

    // Analyze operation patterns
    const operationFrequency = new Map<string, number>();
    for (const [operation, count] of this.operationCounts.entries()) {
      const opType = operation.split('-')[0];
      operationFrequency.set(opType, (operationFrequency.get(opType) || 0) + count);
    }

    const selectCount = operationFrequency.get('select') || 0;
    const writeCount = (operationFrequency.get('insert') || 0) +
                     (operationFrequency.get('update') || 0) +
                     (operationFrequency.get('delete') || 0);

    if (selectCount > writeCount * 10) {
      insights.push({
        type: 'read_heavy',
        message: 'Application is read-heavy',
        recommendation: 'Consider implementing caching strategies',
      });
    }

    return insights;
  }

  // Clear monitoring data (useful for testing or reset)
  clearMonitoringData() {
    this.operationCounts.clear();
    this.slowQueries = [];
  }
}