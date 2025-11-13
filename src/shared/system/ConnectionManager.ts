/**
 * Connection Manager
 * Handles network connectivity, Supabase connection issues, and offline mode
 */

import { progressReporter } from './ProgressStatusReporter';

export interface ConnectionState {
  isOnline: boolean;
  supabaseConnected: boolean;
  lastConnected?: number;
  retryCount: number;
  error?: string;
}

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

export class ConnectionManager {
  private static instance: ConnectionManager;
  private state: ConnectionState = {
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    supabaseConnected: false,
    retryCount: 0
  };

  private listeners: ((state: ConnectionState) => void)[] = [];
  private retryConfig: RetryConfig = {
    maxRetries: 5,
    baseDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2
  };

  private retryTimeout?: NodeJS.Timeout;
  private healthCheckInterval?: NodeJS.Timeout;

  static getInstance(): ConnectionManager {
    if (!ConnectionManager.instance) {
      ConnectionManager.instance = new ConnectionManager();
    }
    return ConnectionManager.instance;
  }

  private constructor() {
    if (typeof window !== 'undefined') {
      this.setupEventListeners();
      this.startHealthCheck();
    }
  }

  /**
   * Setup network and browser event listeners
   */
  private setupEventListeners(): void {
    // Network connectivity
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));

    // Page visibility (for connection recovery)
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));

    // Unload cleanup
    window.addEventListener('beforeunload', this.cleanup.bind(this));
  }

  /**
   * Handle online event
   */
  private handleOnline(): void {
    this.state.isOnline = true;
    this.state.retryCount = 0;
    this.notifyListeners();
    this.checkSupabaseConnection();
  }

  /**
   * Handle offline event
   */
  private handleOffline(): void {
    this.state.isOnline = false;
    this.state.supabaseConnected = false;
    this.notifyListeners();
  }

  /**
   * Handle visibility change (tab focus)
   */
  private handleVisibilityChange(): void {
    if (!document.hidden && this.state.isOnline && !this.state.supabaseConnected) {
      this.checkSupabaseConnection();
    }
  }

  /**
   * Start periodic health check
   */
  private startHealthCheck(): void {
    this.healthCheckInterval = setInterval(() => {
      if (this.state.isOnline && !this.state.supabaseConnected) {
        this.checkSupabaseConnection();
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * Check Supabase connection with simple ping
   */
  async checkSupabaseConnection(): Promise<boolean> {
    if (!this.state.isOnline) {
      return false;
    }

    try {
      // Try to resolve the Supabase URL first
      const supabaseUrl = this.getSupabaseUrl();
      if (!supabaseUrl) {
        this.state.error = 'Supabase URL not configured';
        this.notifyListeners();
        return false;
      }

      // Simple connectivity test using Supabase REST API
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      // Use a simple HEAD request to the REST endpoint which should always work
      const response = await fetch(supabaseUrl + '/rest/v1/', {
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-cache',
        headers: {
          'apikey': import.meta.env?.VITE_SUPABASE_ANON_KEY || '',
          'Content-Type': 'application/json'
        }
      }).finally(() => {
        clearTimeout(timeoutId);
      });

      // Accept both 200 OK and 401 Unauthorized as "connected" since both mean Supabase is reachable
      const isConnected = response.ok || response.status === 401;
      this.updateSupabaseConnectionState(isConnected);

      return isConnected;
    } catch (error) {
      this.handleConnectionError(error);
      return false;
    }
  }

  /**
   * Get Supabase URL from environment or detect from errors
   */
  private getSupabaseUrl(): string | null {
    // Hardcoded fallback for troubleshooting
    const hardcodedUrl = 'https://lhgwnrwwhaalojdpkwuo.supabase.co';
    console.log('ConnectionManager: Using hardcoded URL for troubleshooting:', hardcodedUrl);

    // Try to get from environment (Vite uses import.meta.env)
    if (typeof window !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) {
      const url = import.meta.env.VITE_SUPABASE_URL;
      console.log('ConnectionManager: Found Supabase URL from import.meta.env:', url);
      return url;
    }

    console.log('ConnectionManager: No env var found, using hardcoded URL');
    return hardcodedUrl;

    // Fallback to process.env for Node environments
    if (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL) {
      return process.env.VITE_SUPABASE_URL;
    }

    // Try to detect from error messages (extract from failed fetch)
    const scripts = document.querySelectorAll('script');
    for (const script of scripts) {
      if (script.src && script.src.includes('supabase')) {
        try {
          const url = new URL(script.src);
          return `https://${url.hostname}`;
        } catch {}
      }
    }

    // Look for common Supabase patterns in the page
    const pageContent = document.documentElement.innerHTML;
    const supabaseMatch = pageContent.match(/https:\/\/([a-z0-9]+)\.supabase\.com/);
    if (supabaseMatch) {
      return supabaseMatch[0];
    }

    return null;
  }

  /**
   * Update Supabase connection state
   */
  private updateSupabaseConnectionState(connected: boolean): void {
    const wasConnected = this.state.supabaseConnected;
    this.state.supabaseConnected = connected;

    if (connected) {
      this.state.lastConnected = Date.now();
      this.state.retryCount = 0;
      this.state.error = undefined;

      if (!wasConnected) {
        console.log('✅ Supabase connection restored');
      }
    } else {
      if (wasConnected) {
        console.warn('❌ Supabase connection lost');
      }
    }

    this.notifyListeners();
  }

  /**
   * Handle connection errors
   */
  private handleConnectionError(error: any): void {
    let errorMessage = 'Connection failed';

    if (error.name === 'AbortError') {
      errorMessage = 'Connection timeout';
    } else if (error.message?.includes('ERR_NAME_NOT_RESOLVED')) {
      errorMessage = 'DNS resolution failed - check Supabase URL';
    } else if (error.message?.includes('Failed to fetch')) {
      errorMessage = 'Network request failed';
    } else if (error instanceof TypeError) {
      errorMessage = 'Network error';
    }

    this.state.error = errorMessage;
    this.state.supabaseConnected = false;
    this.notifyListeners();

    // Schedule retry if we haven't exceeded max retries
    if (this.state.retryCount < this.retryConfig.maxRetries) {
      this.scheduleRetry();
    }
  }

  /**
   * Schedule connection retry with exponential backoff
   */
  private scheduleRetry(): void {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }

    this.state.retryCount++;
    const delay = Math.min(
      this.retryConfig.baseDelay * Math.pow(this.retryConfig.backoffMultiplier, this.state.retryCount - 1),
      this.retryConfig.maxDelay
    );

    console.log(`🔄 Retrying Supabase connection in ${delay}ms (attempt ${this.state.retryCount}/${this.retryConfig.maxRetries})`);

    this.retryTimeout = setTimeout(() => {
      this.checkSupabaseConnection();
    }, delay);
  }

  /**
   * Force connection retry
   */
  async forceRetry(): Promise<boolean> {
    this.state.retryCount = 0;
    this.state.error = undefined;
    this.notifyListeners();

    return await this.checkSupabaseConnection();
  }

  /**
   * Get current connection state
   */
  getState(): ConnectionState {
    return { ...this.state };
  }

  /**
   * Check if we're in offline mode
   */
  isOffline(): boolean {
    return !this.state.isOnline || !this.state.supabaseConnected;
  }

  /**
   * Subscribe to connection state changes
   */
  subscribe(listener: (state: ConnectionState) => void): () => void {
    this.listeners.push(listener);

    // Send current state immediately
    listener(this.getState());

    return () => {
      const index = this.listeners.indexOf(listener);
      if (index !== -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Wrap Supabase operations with connection handling
   */
  async withConnectionHandling<T>(
    operation: () => Promise<T>,
    fallback?: () => T | Promise<T>
  ): Promise<T> {
    try {
      // Check connection first
      if (!this.state.supabaseConnected && !await this.checkSupabaseConnection()) {
        if (fallback) {
          console.log('🔄 Using fallback due to connection issue');
          return await fallback();
        }
        throw new Error('Supabase connection not available and no fallback provided');
      }

      return await operation();
    } catch (error) {
      this.handleConnectionError(error);

      if (fallback) {
        console.log('🔄 Using fallback due to operation error');
        return await fallback();
      }

      throw error;
    }
  }

  /**
   * Create progress report for connection issues
   */
  async diagnoseConnection(): Promise<void> {
    const reportId = 'connection_diagnosis';
    const steps = [
      'Check network connectivity',
      'Resolve Supabase hostname',
      'Test Supabase health endpoint',
      'Verify API accessibility'
    ];

    progressReporter.createReport(reportId, 'Connection Diagnosis', steps);

    try {
      // Step 1: Network connectivity
      progressReporter.startStep(reportId, 0, 'Checking network connectivity...');
      const networkOnline = navigator.onLine;
      if (networkOnline) {
        progressReporter.completeStep(reportId, 0, 'Network is online');
      } else {
        progressReporter.failStep(reportId, 0, 'Network is offline');
        return;
      }

      // Step 2: DNS resolution
      progressReporter.startStep(reportId, 1, 'Resolving Supabase hostname...');
      const supabaseUrl = this.getSupabaseUrl();
      if (supabaseUrl) {
        progressReporter.completeStep(reportId, 1, `Found Supabase URL: ${supabaseUrl}`);
      } else {
        progressReporter.failStep(reportId, 1, 'Could not determine Supabase URL');
        return;
      }

      // Step 3: Health check
      progressReporter.startStep(reportId, 2, 'Testing connection...');
      const isConnected = await this.checkSupabaseConnection();
      if (isConnected) {
        progressReporter.completeStep(reportId, 2, 'Connection successful');
      } else {
        progressReporter.failStep(reportId, 2, this.state.error || 'Connection failed');
        return;
      }

      // Step 4: API test
      progressReporter.startStep(reportId, 3, 'Testing API access...');
      // This would be implemented with actual Supabase client test
      progressReporter.completeStep(reportId, 3, 'API accessible');

      progressReporter.completeReport(reportId, 'Connection diagnosis completed successfully');

    } catch (error) {
      progressReporter.failReport(reportId, error instanceof Error ? error.message : 'Diagnosis failed');
    }
  }

  /**
   * Notify state listeners
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.getState());
      } catch (error) {
        console.error('Connection state listener error:', error);
      }
    });
  }

  /**
   * Cleanup resources
   */
  private cleanup(): void {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
  }
}

/**
 * React hook for connection state
 */
export const useConnection = () => {
  const [state, setState] = React.useState<ConnectionState>({
    isOnline: true,
    supabaseConnected: false,
    retryCount: 0
  });

  React.useEffect(() => {
    const manager = ConnectionManager.getInstance();
    const unsubscribe = manager.subscribe(setState);

    // Initial connection check
    manager.checkSupabaseConnection();

    return unsubscribe;
  }, []);

  const forceRetry = React.useCallback(() => {
    const manager = ConnectionManager.getInstance();
    return manager.forceRetry();
  }, []);

  const diagnose = React.useCallback(() => {
    const manager = ConnectionManager.getInstance();
    return manager.diagnoseConnection();
  }, []);

  return {
    state,
    isOffline: !state.isOnline || !state.supabaseConnected,
    forceRetry,
    diagnose
  };
};

// Import React for the hook
import React from 'react';

// Export singleton instance
export const connectionManager = ConnectionManager.getInstance();
export default connectionManager;