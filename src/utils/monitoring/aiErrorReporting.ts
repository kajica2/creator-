import { SentryUtils } from '../../config/sentry/sentry.config';

export interface AIOperationContext {
  type: 'hashtag' | 'image' | 'audio';
  model: string;
  prompt?: string;
  parameters?: Record<string, any>;
  userId?: string;
  sessionId?: string;
}

export interface AIErrorMetrics {
  errorRate: number;
  avgResponseTime: number;
  quotaUsage: number;
  successRate: number;
}

export class AIErrorReporter {
  private static instance: AIErrorReporter;
  private errorCounts: Map<string, number> = new Map();
  private operationMetrics: Map<string, AIErrorMetrics> = new Map();

  static getInstance(): AIErrorReporter {
    if (!AIErrorReporter.instance) {
      AIErrorReporter.instance = new AIErrorReporter();
    }
    return AIErrorReporter.instance;
  }

  // Track AI operation start
  startOperation(context: AIOperationContext) {
    const operationKey = `${context.type}-${context.model}`;

    SentryUtils.setAIContext(context.type, context.model, context.prompt);
    SentryUtils.addBreadcrumb(
      `Starting ${context.type} generation`,
      'ai.operation',
      {
        model: context.model,
        hasPrompt: !!context.prompt,
        parameters: context.parameters,
      }
    );

    return SentryUtils.trackAIGeneration(context.type, context.model);
  }

  // Report AI operation success
  reportSuccess(context: AIOperationContext, responseTime: number, result?: any) {
    const operationKey = `${context.type}-${context.model}`;

    SentryUtils.addBreadcrumb(
      `${context.type} generation completed`,
      'ai.success',
      {
        responseTime,
        resultSize: result ? JSON.stringify(result).length : 0,
      }
    );

    this.updateMetrics(operationKey, true, responseTime);
  }

  // Report AI operation errors
  reportError(context: AIOperationContext, error: Error, additionalData?: any) {
    const operationKey = `${context.type}-${context.model}`;

    // Increment error count
    const currentCount = this.errorCounts.get(operationKey) || 0;
    this.errorCounts.set(operationKey, currentCount + 1);

    // Categorize error types
    const errorType = this.categorizeError(error);

    SentryUtils.reportAIError(error, {
      type: context.type,
      model: context.model,
      prompt: context.prompt,
      response: additionalData,
    });

    SentryUtils.addBreadcrumb(
      `${context.type} generation failed`,
      'ai.error',
      {
        errorType,
        errorMessage: error.message,
        operationCount: currentCount + 1,
        additionalData,
      }
    );

    this.updateMetrics(operationKey, false, 0);

    // Check for error patterns that might indicate system issues
    this.analyzeErrorPatterns(operationKey, errorType);

    return errorType;
  }

  // Report quota/rate limit errors specifically
  reportQuotaError(context: AIOperationContext, error: Error, quotaInfo?: {
    limit: number;
    used: number;
    resetTime?: Date;
  }) {
    const service = `${context.model}-${context.type}`;

    SentryUtils.reportQuotaError(service, error, quotaInfo);

    SentryUtils.addBreadcrumb(
      'Quota limit exceeded',
      'quota.error',
      {
        service,
        quotaInfo,
        operationType: context.type,
      }
    );

    // Track quota usage patterns
    this.trackQuotaUsage(service, quotaInfo);
  }

  // Report API errors with detailed context
  reportAPIError(context: AIOperationContext, error: any, response?: any) {
    const errorDetails = {
      status: response?.status,
      statusText: response?.statusText,
      headers: response?.headers,
      data: response?.data,
    };

    SentryUtils.addBreadcrumb(
      'API request failed',
      'api.error',
      {
        operationType: context.type,
        model: context.model,
        errorDetails,
      }
    );

    // Enhanced error for API failures
    const enhancedError = new Error(`${context.type} API Error: ${error.message}`);
    enhancedError.stack = error.stack;

    SentryUtils.reportAIError(enhancedError, {
      type: context.type,
      model: context.model,
      prompt: context.prompt,
      response: errorDetails,
    });
  }

  // Get error metrics for monitoring dashboard
  getErrorMetrics(): Record<string, AIErrorMetrics> {
    return Object.fromEntries(this.operationMetrics);
  }

  // Get error patterns for analysis
  getErrorPatterns(): Array<{
    operation: string;
    errorCount: number;
    errorRate: number;
  }> {
    return Array.from(this.operationMetrics.entries()).map(([operation, metrics]) => ({
      operation,
      errorCount: this.errorCounts.get(operation) || 0,
      errorRate: metrics.errorRate,
    }));
  }

  private categorizeError(error: Error): string {
    const message = error.message.toLowerCase();

    if (message.includes('rate limit') || message.includes('quota')) {
      return 'quota_exceeded';
    }

    if (message.includes('timeout') || message.includes('network')) {
      return 'network_error';
    }

    if (message.includes('unauthorized') || message.includes('forbidden')) {
      return 'authentication_error';
    }

    if (message.includes('invalid') || message.includes('bad request')) {
      return 'validation_error';
    }

    if (message.includes('server error') || message.includes('internal')) {
      return 'server_error';
    }

    return 'unknown_error';
  }

  private updateMetrics(operationKey: string, success: boolean, responseTime: number) {
    const current = this.operationMetrics.get(operationKey) || {
      errorRate: 0,
      avgResponseTime: 0,
      quotaUsage: 0,
      successRate: 100,
    };

    const errorCount = this.errorCounts.get(operationKey) || 0;
    const totalOperations = errorCount + (success ? 1 : 0);

    this.operationMetrics.set(operationKey, {
      errorRate: totalOperations > 0 ? (errorCount / totalOperations) * 100 : 0,
      avgResponseTime: success ? (current.avgResponseTime + responseTime) / 2 : current.avgResponseTime,
      quotaUsage: current.quotaUsage, // Updated separately
      successRate: totalOperations > 0 ? ((totalOperations - errorCount) / totalOperations) * 100 : 100,
    });
  }

  private analyzeErrorPatterns(operationKey: string, errorType: string) {
    const errorCount = this.errorCounts.get(operationKey) || 0;

    // Alert on high error rates
    if (errorCount > 5) {
      SentryUtils.addBreadcrumb(
        'High error rate detected',
        'error.pattern',
        {
          operationKey,
          errorType,
          errorCount,
        }
      );
    }

    // Alert on specific error patterns
    if (errorType === 'quota_exceeded' && errorCount > 2) {
      SentryUtils.addBreadcrumb(
        'Repeated quota errors',
        'quota.pattern',
        {
          operationKey,
          errorCount,
          recommendation: 'Consider implementing better rate limiting',
        }
      );
    }
  }

  private trackQuotaUsage(service: string, quotaInfo?: any) {
    if (!quotaInfo) return;

    const usagePercentage = (quotaInfo.used / quotaInfo.limit) * 100;

    SentryUtils.addBreadcrumb(
      'Quota usage tracked',
      'quota.usage',
      {
        service,
        usagePercentage,
        remaining: quotaInfo.limit - quotaInfo.used,
      }
    );

    // Update metrics
    const operationKey = service;
    const current = this.operationMetrics.get(operationKey);
    if (current) {
      current.quotaUsage = usagePercentage;
      this.operationMetrics.set(operationKey, current);
    }
  }
}

// Convenience functions for specific AI operations
export const hashtagErrorReporter = {
  reportGeneration: (error: Error, prompt: string, model: string, additionalData?: any) => {
    const reporter = AIErrorReporter.getInstance();
    return reporter.reportError(
      { type: 'hashtag', model, prompt },
      error,
      additionalData
    );
  },

  reportSuccess: (prompt: string, model: string, responseTime: number, hashtags: string[]) => {
    const reporter = AIErrorReporter.getInstance();
    return reporter.reportSuccess(
      { type: 'hashtag', model, prompt },
      responseTime,
      { hashtagCount: hashtags.length, hashtags: hashtags.slice(0, 5) }
    );
  },
};

export const imageErrorReporter = {
  reportGeneration: (error: Error, prompt: string, model: string, additionalData?: any) => {
    const reporter = AIErrorReporter.getInstance();
    return reporter.reportError(
      { type: 'image', model, prompt },
      error,
      additionalData
    );
  },

  reportSuccess: (prompt: string, model: string, responseTime: number, imageUrl?: string) => {
    const reporter = AIErrorReporter.getInstance();
    return reporter.reportSuccess(
      { type: 'image', model, prompt },
      responseTime,
      { imageGenerated: !!imageUrl, imageSize: imageUrl?.length }
    );
  },
};

export const audioErrorReporter = {
  reportGeneration: (error: Error, text: string, model: string, additionalData?: any) => {
    const reporter = AIErrorReporter.getInstance();
    return reporter.reportError(
      { type: 'audio', model, prompt: text },
      error,
      additionalData
    );
  },

  reportSuccess: (text: string, model: string, responseTime: number, audioUrl?: string) => {
    const reporter = AIErrorReporter.getInstance();
    return reporter.reportSuccess(
      { type: 'audio', model, prompt: text },
      responseTime,
      { audioGenerated: !!audioUrl, audioSize: audioUrl?.length }
    );
  },
};