import * as Sentry from '@sentry/react';

// MCP (Model Context Protocol) Integration for Sentry
// This provides enhanced debugging capabilities for AI applications

export interface MCPConfig {
  enabled: boolean;
  contextDepth: number;
  aiModelTracking: boolean;
  performanceThreshold: number;
}

export interface MCPContext {
  modelName: string;
  inputTokens?: number;
  outputTokens?: number;
  promptTemplate?: string;
  responseMetadata?: any;
  conversationId?: string;
  userId?: string;
}

export class SentryMCPIntegration {
  private config: MCPConfig;
  private contextHistory: MCPContext[] = [];
  private performanceMetrics: Map<string, number[]> = new Map();

  constructor(config: MCPConfig = {
    enabled: true,
    contextDepth: 10,
    aiModelTracking: true,
    performanceThreshold: 5000,
  }) {
    this.config = config;
    this.setupMCPHooks();
  }

  private setupMCPHooks() {
    if (!this.config.enabled) return;

    // Hook into Sentry's beforeSend to enhance error reports with MCP context
    const originalBeforeSend = Sentry.getCurrentHub().getClient()?.getOptions().beforeSend;

    Sentry.getCurrentHub().getClient()?.getOptions && Object.assign(
      Sentry.getCurrentHub().getClient()!.getOptions(),
      {
        beforeSend: (event: any) => {
          // Add MCP context to all error reports
          event = this.enhanceEventWithMCPContext(event);

          // Call original beforeSend if it exists
          if (originalBeforeSend) {
            return originalBeforeSend(event);
          }

          return event;
        },
      }
    );

    // Set up performance monitoring for AI operations
    this.setupPerformanceMonitoring();
  }

  // Capture AI model context for enhanced debugging
  captureAIContext(context: MCPContext) {
    if (!this.config.enabled) return;

    // Store context history
    this.contextHistory.push({
      ...context,
      timestamp: Date.now(),
    } as any);

    // Keep only recent context based on configured depth
    if (this.contextHistory.length > this.config.contextDepth) {
      this.contextHistory.shift();
    }

    // Set Sentry context
    Sentry.setContext('ai_model_context', {
      current: context,
      history: this.contextHistory.slice(-3), // Last 3 interactions
      totalInteractions: this.contextHistory.length,
    });

    // Add breadcrumb
    Sentry.addBreadcrumb({
      category: 'ai.context',
      message: `AI interaction with ${context.modelName}`,
      level: 'info',
      data: {
        model: context.modelName,
        inputTokens: context.inputTokens,
        outputTokens: context.outputTokens,
        conversationId: context.conversationId,
      },
    });
  }

  // Track AI model performance metrics
  trackAIPerformance(modelName: string, responseTime: number, tokenCount?: number) {
    if (!this.config.enabled) return;

    // Store performance data
    const modelMetrics = this.performanceMetrics.get(modelName) || [];
    modelMetrics.push(responseTime);

    // Keep only last 100 measurements per model
    if (modelMetrics.length > 100) {
      modelMetrics.shift();
    }

    this.performanceMetrics.set(modelName, modelMetrics);

    // Alert on performance degradation
    if (responseTime > this.config.performanceThreshold) {
      Sentry.addBreadcrumb({
        category: 'performance.ai',
        message: `Slow AI response detected: ${modelName}`,
        level: 'warning',
        data: {
          responseTime,
          threshold: this.config.performanceThreshold,
          modelName,
          tokenCount,
        },
      });
    }

    // Calculate and report performance trends
    if (modelMetrics.length >= 10) {
      const avgResponseTime = modelMetrics.reduce((a, b) => a + b, 0) / modelMetrics.length;
      const recentAvg = modelMetrics.slice(-5).reduce((a, b) => a + b, 0) / 5;

      if (recentAvg > avgResponseTime * 1.5) {
        Sentry.addBreadcrumb({
          category: 'performance.degradation',
          message: `Performance degradation detected for ${modelName}`,
          level: 'warning',
          data: {
            avgResponseTime,
            recentAvg,
            degradationPercent: ((recentAvg - avgResponseTime) / avgResponseTime) * 100,
          },
        });
      }
    }
  }

  // Enhanced error reporting for AI operations
  reportAIError(error: Error, context: MCPContext, additionalData?: any) {
    if (!this.config.enabled) return;

    Sentry.withScope((scope) => {
      // Set AI-specific tags
      scope.setTag('error_source', 'ai_operation');
      scope.setTag('ai_model', context.modelName);

      if (context.conversationId) {
        scope.setTag('conversation_id', context.conversationId);
      }

      // Set detailed context
      scope.setContext('ai_operation', {
        modelName: context.modelName,
        inputTokens: context.inputTokens,
        outputTokens: context.outputTokens,
        promptTemplate: context.promptTemplate?.substring(0, 200),
        responseMetadata: additionalData,
        contextHistory: this.contextHistory.slice(-3),
      });

      // Add fingerprint for similar errors
      scope.setFingerprint([
        'ai-error',
        context.modelName,
        error.message.substring(0, 50),
      ]);

      Sentry.captureException(error);
    });
  }

  // Intelligent issue detection based on AI patterns
  analyzeErrorPatterns(): Array<{
    type: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
    recommendation: string;
  }> {
    const patterns = [];

    // Analyze performance trends
    for (const [modelName, metrics] of this.performanceMetrics.entries()) {
      if (metrics.length < 5) continue;

      const recent = metrics.slice(-5);
      const avgRecent = recent.reduce((a, b) => a + b, 0) / recent.length;
      const avgOverall = metrics.reduce((a, b) => a + b, 0) / metrics.length;

      if (avgRecent > avgOverall * 2) {
        patterns.push({
          type: 'performance_degradation',
          severity: 'high' as const,
          description: `${modelName} showing significant performance degradation`,
          recommendation: 'Check API status and consider switching models or implementing fallbacks',
        });
      }
    }

    // Analyze context patterns
    const modelUsage = new Map<string, number>();
    this.contextHistory.forEach(ctx => {
      modelUsage.set(ctx.modelName, (modelUsage.get(ctx.modelName) || 0) + 1);
    });

    // Detect over-reliance on single model
    for (const [model, usage] of modelUsage.entries()) {
      if (usage > this.contextHistory.length * 0.8) {
        patterns.push({
          type: 'model_dependency',
          severity: 'medium' as const,
          description: `High dependency on ${model} (${usage}/${this.contextHistory.length} requests)`,
          recommendation: 'Consider implementing model diversity for better resilience',
        });
      }
    }

    return patterns;
  }

  private enhanceEventWithMCPContext(event: any) {
    if (!this.config.enabled) return event;

    // Add current AI context to error reports
    if (this.contextHistory.length > 0) {
      event.contexts = event.contexts || {};
      event.contexts.mcp_session = {
        recentInteractions: this.contextHistory.slice(-3),
        totalInteractions: this.contextHistory.length,
        performanceMetrics: this.getPerformanceSummary(),
        detectedPatterns: this.analyzeErrorPatterns(),
      };
    }

    // Add performance context
    if (event.transaction) {
      const modelPerf = this.performanceMetrics.get(event.transaction);
      if (modelPerf) {
        event.contexts.performance = {
          avgResponseTime: modelPerf.reduce((a, b) => a + b, 0) / modelPerf.length,
          recentResponseTime: modelPerf.slice(-1)[0],
          sampleSize: modelPerf.length,
        };
      }
    }

    return event;
  }

  private setupPerformanceMonitoring() {
    // Monitor for performance issues
    setInterval(() => {
      const patterns = this.analyzeErrorPatterns();
      const highSeverityPatterns = patterns.filter(p => p.severity === 'high');

      if (highSeverityPatterns.length > 0) {
        Sentry.addBreadcrumb({
          category: 'mcp.analysis',
          message: `Detected ${highSeverityPatterns.length} high-severity issues`,
          level: 'warning',
          data: {
            patterns: highSeverityPatterns,
          },
        });
      }
    }, 60000); // Check every minute
  }

  private getPerformanceSummary() {
    const summary: any = {};

    for (const [model, metrics] of this.performanceMetrics.entries()) {
      if (metrics.length === 0) continue;

      summary[model] = {
        avgResponseTime: metrics.reduce((a, b) => a + b, 0) / metrics.length,
        minResponseTime: Math.min(...metrics),
        maxResponseTime: Math.max(...metrics),
        sampleSize: metrics.length,
      };
    }

    return summary;
  }

  // Public API methods
  getContextHistory() {
    return this.contextHistory.slice();
  }

  getPerformanceMetrics() {
    return new Map(this.performanceMetrics);
  }

  clearHistory() {
    this.contextHistory = [];
    this.performanceMetrics.clear();
  }

  updateConfig(newConfig: Partial<MCPConfig>) {
    this.config = { ...this.config, ...newConfig };
  }
}

// Global MCP integration instance
export const sentryMCP = new SentryMCPIntegration();

// Convenience functions for common use cases
export const MCPUtils = {
  // Track hashtag generation
  trackHashtagGeneration: (model: string, prompt: string, responseTime: number, hashtags: string[]) => {
    sentryMCP.captureAIContext({
      modelName: model,
      promptTemplate: prompt,
      outputTokens: hashtags.length,
      responseMetadata: { hashtagCount: hashtags.length },
    });

    sentryMCP.trackAIPerformance(model, responseTime, hashtags.length);
  },

  // Track image generation
  trackImageGeneration: (model: string, prompt: string, responseTime: number, success: boolean) => {
    sentryMCP.captureAIContext({
      modelName: model,
      promptTemplate: prompt,
      responseMetadata: { success, generationType: 'image' },
    });

    sentryMCP.trackAIPerformance(model, responseTime);
  },

  // Track audio generation
  trackAudioGeneration: (model: string, text: string, responseTime: number, duration?: number) => {
    sentryMCP.captureAIContext({
      modelName: model,
      promptTemplate: text,
      responseMetadata: { audioDuration: duration, generationType: 'audio' },
    });

    sentryMCP.trackAIPerformance(model, responseTime);
  },

  // Report AI errors with MCP context
  reportError: (error: Error, model: string, operation: string, context?: any) => {
    sentryMCP.reportAIError(error, {
      modelName: model,
      responseMetadata: { operation, ...context },
    });
  },
};