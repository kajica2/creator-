import * as Sentry from '@sentry/react';

export interface AlertConfig {
  errorRateThreshold: number; // Percentage
  responseTimeThreshold: number; // Milliseconds
  quotaUsageThreshold: number; // Percentage
  userImpactThreshold: number; // Number of affected users
}

export interface AlertRule {
  id: string;
  type: 'error_rate' | 'response_time' | 'quota_usage' | 'user_impact' | 'custom';
  condition: string;
  threshold: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  cooldownMinutes: number;
}

export interface Alert {
  id: string;
  ruleId: string;
  type: string;
  message: string;
  severity: string;
  triggeredAt: Date;
  resolved: boolean;
  resolvedAt?: Date;
  metadata: any;
}

export class AlertManager {
  private static instance: AlertManager;
  private config: AlertConfig;
  private rules: AlertRule[] = [];
  private activeAlerts: Alert[] = [];
  private alertHistory: Alert[] = [];
  private cooldowns: Map<string, Date> = new Map();

  private constructor() {
    this.config = {
      errorRateThreshold: 5, // 5% error rate
      responseTimeThreshold: 5000, // 5 seconds
      quotaUsageThreshold: 80, // 80% quota usage
      userImpactThreshold: 10, // 10 users affected
    };

    this.setupDefaultRules();
    this.startMonitoring();
  }

  static getInstance(): AlertManager {
    if (!AlertManager.instance) {
      AlertManager.instance = new AlertManager();
    }
    return AlertManager.instance;
  }

  private setupDefaultRules() {
    this.rules = [
      {
        id: 'high-error-rate',
        type: 'error_rate',
        condition: 'error_rate > threshold',
        threshold: this.config.errorRateThreshold,
        severity: 'high',
        enabled: true,
        cooldownMinutes: 15,
      },
      {
        id: 'slow-ai-generation',
        type: 'response_time',
        condition: 'avg_response_time > threshold',
        threshold: this.config.responseTimeThreshold,
        severity: 'medium',
        enabled: true,
        cooldownMinutes: 10,
      },
      {
        id: 'quota-exhaustion',
        type: 'quota_usage',
        condition: 'quota_usage > threshold',
        threshold: this.config.quotaUsageThreshold,
        severity: 'critical',
        enabled: true,
        cooldownMinutes: 30,
      },
      {
        id: 'user-impact',
        type: 'user_impact',
        condition: 'affected_users > threshold',
        threshold: this.config.userImpactThreshold,
        severity: 'high',
        enabled: true,
        cooldownMinutes: 20,
      },
      {
        id: 'authentication-failures',
        type: 'custom',
        condition: 'auth_error_rate > 10',
        threshold: 10,
        severity: 'medium',
        enabled: true,
        cooldownMinutes: 10,
      },
      {
        id: 'ai-model-failures',
        type: 'custom',
        condition: 'ai_generation_failures > 5',
        threshold: 5,
        severity: 'high',
        enabled: true,
        cooldownMinutes: 15,
      },
      {
        id: 'database-slowdown',
        type: 'custom',
        condition: 'db_slow_queries > 3',
        threshold: 3,
        severity: 'medium',
        enabled: true,
        cooldownMinutes: 10,
      },
    ];
  }

  // Check conditions and trigger alerts
  checkAlerts(metrics: {
    errorRate?: number;
    avgResponseTime?: number;
    quotaUsage?: number;
    affectedUsers?: number;
    customMetrics?: Record<string, number>;
  }) {
    for (const rule of this.rules) {
      if (!rule.enabled || this.isInCooldown(rule.id)) {
        continue;
      }

      const shouldTrigger = this.evaluateRule(rule, metrics);

      if (shouldTrigger) {
        this.triggerAlert(rule, metrics);
      }
    }
  }

  private evaluateRule(rule: AlertRule, metrics: any): boolean {
    switch (rule.type) {
      case 'error_rate':
        return (metrics.errorRate || 0) > rule.threshold;

      case 'response_time':
        return (metrics.avgResponseTime || 0) > rule.threshold;

      case 'quota_usage':
        return (metrics.quotaUsage || 0) > rule.threshold;

      case 'user_impact':
        return (metrics.affectedUsers || 0) > rule.threshold;

      case 'custom':
        return this.evaluateCustomRule(rule, metrics);

      default:
        return false;
    }
  }

  private evaluateCustomRule(rule: AlertRule, metrics: any): boolean {
    const customMetrics = metrics.customMetrics || {};

    switch (rule.id) {
      case 'authentication-failures':
        return (customMetrics.authErrorRate || 0) > rule.threshold;

      case 'ai-model-failures':
        return (customMetrics.aiGenerationFailures || 0) > rule.threshold;

      case 'database-slowdown':
        return (customMetrics.dbSlowQueries || 0) > rule.threshold;

      default:
        return false;
    }
  }

  private triggerAlert(rule: AlertRule, metrics: any) {
    const alert: Alert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ruleId: rule.id,
      type: rule.type,
      message: this.generateAlertMessage(rule, metrics),
      severity: rule.severity,
      triggeredAt: new Date(),
      resolved: false,
      metadata: { rule, metrics },
    };

    this.activeAlerts.push(alert);
    this.alertHistory.push(alert);
    this.setCooldown(rule.id, rule.cooldownMinutes);

    // Report to Sentry
    this.reportToSentry(alert);

    // Trigger notifications
    this.notifyAlert(alert);

    console.warn(`[ALERT TRIGGERED] ${alert.message}`, alert);
  }

  private generateAlertMessage(rule: AlertRule, metrics: any): string {
    switch (rule.id) {
      case 'high-error-rate':
        return `High error rate detected: ${(metrics.errorRate || 0).toFixed(1)}% (threshold: ${rule.threshold}%)`;

      case 'slow-ai-generation':
        return `Slow AI response detected: ${(metrics.avgResponseTime || 0).toFixed(0)}ms (threshold: ${rule.threshold}ms)`;

      case 'quota-exhaustion':
        return `Quota usage critical: ${(metrics.quotaUsage || 0).toFixed(1)}% (threshold: ${rule.threshold}%)`;

      case 'user-impact':
        return `High user impact: ${metrics.affectedUsers || 0} users affected (threshold: ${rule.threshold})`;

      case 'authentication-failures':
        return `Authentication failure spike: ${(metrics.customMetrics?.authErrorRate || 0).toFixed(1)}% failure rate`;

      case 'ai-model-failures':
        return `AI generation failures: ${metrics.customMetrics?.aiGenerationFailures || 0} recent failures`;

      case 'database-slowdown':
        return `Database performance degradation: ${metrics.customMetrics?.dbSlowQueries || 0} slow queries`;

      default:
        return `Alert triggered for rule: ${rule.id}`;
    }
  }

  private reportToSentry(alert: Alert) {
    Sentry.withScope((scope) => {
      scope.setTag('alert_type', alert.type);
      scope.setTag('alert_severity', alert.severity);
      scope.setLevel(this.mapSeverityToSentryLevel(alert.severity));

      scope.setContext('alert_details', {
        alertId: alert.id,
        ruleId: alert.ruleId,
        triggeredAt: alert.triggeredAt.toISOString(),
        message: alert.message,
        metadata: alert.metadata,
      });

      const error = new Error(`Alert: ${alert.message}`);
      Sentry.captureException(error);
    });
  }

  private mapSeverityToSentryLevel(severity: string): any {
    switch (severity) {
      case 'critical': return 'fatal';
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'info';
    }
  }

  private notifyAlert(alert: Alert) {
    // In a real application, you might send emails, Slack notifications, etc.
    // For now, we'll use browser notifications if available
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`Viral AI Alert: ${alert.severity.toUpperCase()}`, {
        body: alert.message,
        icon: '/icon-192.png',
        tag: alert.ruleId,
      });
    }

    // Also trigger a custom event for UI components to listen to
    window.dispatchEvent(new CustomEvent('viralai-alert', {
      detail: alert,
    }));
  }

  // Resolve an alert
  resolveAlert(alertId: string) {
    const alert = this.activeAlerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      alert.resolvedAt = new Date();

      // Remove from active alerts
      this.activeAlerts = this.activeAlerts.filter(a => a.id !== alertId);

      console.info(`[ALERT RESOLVED] ${alert.message}`);
    }
  }

  // Auto-resolve alerts that are no longer valid
  checkAutoResolution(metrics: any) {
    for (const alert of this.activeAlerts.slice()) {
      const rule = this.rules.find(r => r.id === alert.ruleId);
      if (rule && !this.evaluateRule(rule, metrics)) {
        this.resolveAlert(alert.id);
      }
    }
  }

  private isInCooldown(ruleId: string): boolean {
    const cooldownEnd = this.cooldowns.get(ruleId);
    return cooldownEnd ? new Date() < cooldownEnd : false;
  }

  private setCooldown(ruleId: string, minutes: number) {
    const cooldownEnd = new Date();
    cooldownEnd.setMinutes(cooldownEnd.getMinutes() + minutes);
    this.cooldowns.set(ruleId, cooldownEnd);
  }

  private startMonitoring() {
    // Clean up old alerts and cooldowns every 5 minutes
    setInterval(() => {
      // Remove old cooldowns
      const now = new Date();
      for (const [ruleId, cooldownEnd] of this.cooldowns.entries()) {
        if (now >= cooldownEnd) {
          this.cooldowns.delete(ruleId);
        }
      }

      // Remove old alert history (keep last 100)
      if (this.alertHistory.length > 100) {
        this.alertHistory = this.alertHistory.slice(-100);
      }
    }, 5 * 60 * 1000);
  }

  // Public API methods
  getActiveAlerts(): Alert[] {
    return this.activeAlerts.slice();
  }

  getAlertHistory(limit = 50): Alert[] {
    return this.alertHistory.slice(-limit);
  }

  getAlertRules(): AlertRule[] {
    return this.rules.slice();
  }

  updateRule(ruleId: string, updates: Partial<AlertRule>) {
    const rule = this.rules.find(r => r.id === ruleId);
    if (rule) {
      Object.assign(rule, updates);
    }
  }

  addCustomRule(rule: Omit<AlertRule, 'id'>) {
    const newRule: AlertRule = {
      ...rule,
      id: `custom-${Date.now()}`,
    };
    this.rules.push(newRule);
    return newRule.id;
  }

  removeRule(ruleId: string) {
    this.rules = this.rules.filter(r => r.id !== ruleId);

    // Also resolve any active alerts for this rule
    for (const alert of this.activeAlerts.filter(a => a.ruleId === ruleId)) {
      this.resolveAlert(alert.id);
    }
  }

  updateConfig(config: Partial<AlertConfig>) {
    this.config = { ...this.config, ...config };
  }

  getConfig(): AlertConfig {
    return { ...this.config };
  }

  // Request notification permissions
  async requestNotificationPermission() {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }
}

// Convenience functions for specific alert types
export const alertUtils = {
  checkAIPerformance: (metrics: {
    hashtag: { errorRate: number; avgTime: number };
    image: { errorRate: number; avgTime: number };
    audio: { errorRate: number; avgTime: number };
  }) => {
    const manager = AlertManager.getInstance();

    Object.entries(metrics).forEach(([type, data]) => {
      manager.checkAlerts({
        errorRate: data.errorRate,
        avgResponseTime: data.avgTime,
        customMetrics: {
          [`${type}_error_rate`]: data.errorRate,
          [`${type}_response_time`]: data.avgTime,
        },
      });
    });
  },

  checkQuotaUsage: (quotas: Record<string, { used: number; limit: number }>) => {
    const manager = AlertManager.getInstance();

    Object.entries(quotas).forEach(([service, quota]) => {
      const usage = (quota.used / quota.limit) * 100;
      manager.checkAlerts({
        quotaUsage: usage,
        customMetrics: {
          [`${service}_quota_usage`]: usage,
        },
      });
    });
  },

  reportUserImpact: (affectedUsers: number, errorType: string) => {
    const manager = AlertManager.getInstance();
    manager.checkAlerts({
      affectedUsers,
      customMetrics: {
        [`${errorType}_affected_users`]: affectedUsers,
      },
    });
  },
};