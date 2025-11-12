/**
 * Progress Status Reporter
 * Real-time progress tracking and status reporting for server operations
 */

export interface ProgressStep {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'warning';
  progress: number; // 0-100
  message?: string;
  error?: string;
  startTime?: number;
  endTime?: number;
  estimatedDuration?: number;
}

export interface ProgressReport {
  id: string;
  title: string;
  totalSteps: number;
  completedSteps: number;
  currentStep?: ProgressStep;
  steps: ProgressStep[];
  overallProgress: number;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'warning';
  startTime: number;
  endTime?: number;
  estimatedCompletion?: number;
}

export type ProgressCallback = (report: ProgressReport) => void;

export class ProgressStatusReporter {
  private static instance: ProgressStatusReporter;
  private reports: Map<string, ProgressReport> = new Map();
  private callbacks: Map<string, ProgressCallback[]> = new Map();

  static getInstance(): ProgressStatusReporter {
    if (!ProgressStatusReporter.instance) {
      ProgressStatusReporter.instance = new ProgressStatusReporter();
    }
    return ProgressStatusReporter.instance;
  }

  /**
   * Create a new progress report
   */
  createReport(id: string, title: string, steps: string[]): ProgressReport {
    const report: ProgressReport = {
      id,
      title,
      totalSteps: steps.length,
      completedSteps: 0,
      steps: steps.map((stepName, index) => ({
        id: `${id}_step_${index}`,
        name: stepName,
        status: 'pending',
        progress: 0
      })),
      overallProgress: 0,
      status: 'pending',
      startTime: Date.now()
    };

    this.reports.set(id, report);
    this.notifyCallbacks(id, report);
    return report;
  }

  /**
   * Update a specific step's progress
   */
  updateStep(
    reportId: string,
    stepIndex: number,
    updates: Partial<ProgressStep>
  ): void {
    const report = this.reports.get(reportId);
    if (!report || !report.steps[stepIndex]) return;

    const step = report.steps[stepIndex];
    Object.assign(step, updates);

    // Update timestamps
    if (updates.status === 'running' && !step.startTime) {
      step.startTime = Date.now();
    }
    if (['completed', 'failed'].includes(updates.status || '') && !step.endTime) {
      step.endTime = Date.now();
    }

    // Update current step
    if (updates.status === 'running') {
      report.currentStep = step;
    }

    // Calculate overall progress
    this.calculateOverallProgress(report);
    this.notifyCallbacks(reportId, report);
  }

  /**
   * Update step by name
   */
  updateStepByName(
    reportId: string,
    stepName: string,
    updates: Partial<ProgressStep>
  ): void {
    const report = this.reports.get(reportId);
    if (!report) return;

    const stepIndex = report.steps.findIndex(step => step.name === stepName);
    if (stepIndex !== -1) {
      this.updateStep(reportId, stepIndex, updates);
    }
  }

  /**
   * Mark step as started
   */
  startStep(reportId: string, stepIndex: number, message?: string): void {
    this.updateStep(reportId, stepIndex, {
      status: 'running',
      progress: 0,
      message: message || 'Starting...'
    });
  }

  /**
   * Update step progress
   */
  updateStepProgress(
    reportId: string,
    stepIndex: number,
    progress: number,
    message?: string
  ): void {
    this.updateStep(reportId, stepIndex, {
      progress: Math.max(0, Math.min(100, progress)),
      message
    });
  }

  /**
   * Mark step as completed
   */
  completeStep(reportId: string, stepIndex: number, message?: string): void {
    this.updateStep(reportId, stepIndex, {
      status: 'completed',
      progress: 100,
      message: message || 'Completed'
    });
  }

  /**
   * Mark step as failed
   */
  failStep(reportId: string, stepIndex: number, error: string): void {
    this.updateStep(reportId, stepIndex, {
      status: 'failed',
      error,
      message: 'Failed'
    });
  }

  /**
   * Mark step with warning
   */
  warnStep(reportId: string, stepIndex: number, message: string): void {
    this.updateStep(reportId, stepIndex, {
      status: 'warning',
      message
    });
  }

  /**
   * Complete entire report
   */
  completeReport(reportId: string, message?: string): void {
    const report = this.reports.get(reportId);
    if (!report) return;

    report.status = 'completed';
    report.endTime = Date.now();
    report.overallProgress = 100;

    // Mark any incomplete steps as completed
    report.steps.forEach(step => {
      if (step.status === 'pending' || step.status === 'running') {
        step.status = 'completed';
        step.progress = 100;
        step.endTime = Date.now();
      }
    });

    this.notifyCallbacks(reportId, report);
  }

  /**
   * Fail entire report
   */
  failReport(reportId: string, error: string): void {
    const report = this.reports.get(reportId);
    if (!report) return;

    report.status = 'failed';
    report.endTime = Date.now();

    // Mark current running step as failed
    if (report.currentStep && report.currentStep.status === 'running') {
      report.currentStep.status = 'failed';
      report.currentStep.error = error;
      report.currentStep.endTime = Date.now();
    }

    this.notifyCallbacks(reportId, report);
  }

  /**
   * Get a progress report
   */
  getReport(reportId: string): ProgressReport | undefined {
    return this.reports.get(reportId);
  }

  /**
   * Get all active reports
   */
  getActiveReports(): ProgressReport[] {
    return Array.from(this.reports.values()).filter(
      report => report.status === 'running' || report.status === 'pending'
    );
  }

  /**
   * Subscribe to progress updates
   */
  subscribe(reportId: string, callback: ProgressCallback): () => void {
    if (!this.callbacks.has(reportId)) {
      this.callbacks.set(reportId, []);
    }
    this.callbacks.get(reportId)!.push(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.callbacks.get(reportId) || [];
      const index = callbacks.indexOf(callback);
      if (index !== -1) {
        callbacks.splice(index, 1);
      }
    };
  }

  /**
   * Subscribe to all progress updates
   */
  subscribeToAll(callback: (reportId: string, report: ProgressReport) => void): () => void {
    const globalCallbacks = this.callbacks.get('*') || [];
    globalCallbacks.push(callback as any);
    this.callbacks.set('*', globalCallbacks);

    return () => {
      const callbacks = this.callbacks.get('*') || [];
      const index = callbacks.indexOf(callback as any);
      if (index !== -1) {
        callbacks.splice(index, 1);
      }
    };
  }

  /**
   * Clear completed reports
   */
  clearCompleted(): void {
    const completed = Array.from(this.reports.entries()).filter(
      ([, report]) => report.status === 'completed'
    );

    completed.forEach(([id]) => {
      this.reports.delete(id);
      this.callbacks.delete(id);
    });
  }

  /**
   * Calculate overall progress for a report
   */
  private calculateOverallProgress(report: ProgressReport): void {
    const totalProgress = report.steps.reduce((sum, step) => sum + step.progress, 0);
    report.overallProgress = Math.round(totalProgress / report.steps.length);

    // Update completed steps count
    report.completedSteps = report.steps.filter(step => step.status === 'completed').length;

    // Update overall status
    if (report.steps.some(step => step.status === 'failed')) {
      report.status = 'failed';
    } else if (report.steps.some(step => step.status === 'warning')) {
      report.status = 'warning';
    } else if (report.completedSteps === report.totalSteps) {
      report.status = 'completed';
      report.endTime = Date.now();
    } else if (report.steps.some(step => step.status === 'running')) {
      report.status = 'running';
    }

    // Calculate estimated completion time
    if (report.status === 'running' && report.overallProgress > 0) {
      const elapsed = Date.now() - report.startTime;
      const estimatedTotal = (elapsed / report.overallProgress) * 100;
      report.estimatedCompletion = report.startTime + estimatedTotal;
    }
  }

  /**
   * Notify all callbacks for a report
   */
  private notifyCallbacks(reportId: string, report: ProgressReport): void {
    // Notify specific report callbacks
    const callbacks = this.callbacks.get(reportId) || [];
    callbacks.forEach(callback => {
      try {
        callback(report);
      } catch (error) {
        console.error('Progress callback error:', error);
      }
    });

    // Notify global callbacks
    const globalCallbacks = this.callbacks.get('*') || [];
    globalCallbacks.forEach((callback: any) => {
      try {
        callback(reportId, report);
      } catch (error) {
        console.error('Global progress callback error:', error);
      }
    });
  }
}

/**
 * Utility functions for common progress reporting patterns
 */
export const ProgressUtils = {
  /**
   * Create a simple progress reporter for async operations
   */
  async withProgress<T>(
    title: string,
    steps: string[],
    operation: (reporter: ProgressStatusReporter, reportId: string) => Promise<T>
  ): Promise<T> {
    const reporter = ProgressStatusReporter.getInstance();
    const reportId = `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      reporter.createReport(reportId, title, steps);
      const result = await operation(reporter, reportId);
      reporter.completeReport(reportId);
      return result;
    } catch (error) {
      reporter.failReport(reportId, error instanceof Error ? error.message : String(error));
      throw error;
    }
  },

  /**
   * Track progress of an array of async operations
   */
  async trackBatch<T>(
    reportId: string,
    items: T[],
    operation: (item: T, index: number) => Promise<void>
  ): Promise<void> {
    const reporter = ProgressStatusReporter.getInstance();
    const stepIndex = 0; // Assumes this is called within a step

    for (let i = 0; i < items.length; i++) {
      const progress = (i / items.length) * 100;
      reporter.updateStepProgress(reportId, stepIndex, progress, `Processing ${i + 1} of ${items.length}`);

      await operation(items[i], i);
    }

    reporter.updateStepProgress(reportId, stepIndex, 100, `Completed all ${items.length} items`);
  },

  /**
   * Simulate progress for operations without granular progress info
   */
  simulateProgress(
    reportId: string,
    stepIndex: number,
    duration: number,
    message: string = 'Processing...'
  ): () => void {
    const reporter = ProgressStatusReporter.getInstance();
    const startTime = Date.now();
    let progress = 0;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      progress = Math.min(90, (elapsed / duration) * 100); // Cap at 90% until actually complete
      reporter.updateStepProgress(reportId, stepIndex, progress, message);

      if (elapsed >= duration) {
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }
};

// Export singleton instance
export const progressReporter = ProgressStatusReporter.getInstance();
export default progressReporter;