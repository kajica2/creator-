import React, { useState, useEffect } from 'react';
import { AIErrorReporter } from '../../utils/monitoring/aiErrorReporting';
import { SupabaseMonitor } from '../../utils/monitoring/supabaseMonitoring';
import { sentryMCP, MCPUtils } from '../../../config/sentry/mcp-integration';

interface ErrorMetric {
  operation: string;
  errorCount: number;
  errorRate: number;
  avgResponseTime: number;
  successRate: number;
}

interface PerformanceInsight {
  type: string;
  message: string;
  recommendation: string;
  severity: 'low' | 'medium' | 'high';
}

export function MonitoringDashboard() {
  const [aiMetrics, setAiMetrics] = useState<Record<string, any>>({});
  const [supabaseMetrics, setSupabaseMetrics] = useState<any>({});
  const [errorPatterns, setErrorPatterns] = useState<ErrorMetric[]>([]);
  const [insights, setInsights] = useState<PerformanceInsight[]>([]);
  const [mcpPatterns, setMcpPatterns] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        setIsLoading(true);

        // Get AI error metrics
        const aiReporter = AIErrorReporter.getInstance();
        const aiErrorMetrics = aiReporter.getErrorMetrics();
        const aiErrorPatterns = aiReporter.getErrorPatterns();

        // Get Supabase metrics
        const supabaseMonitor = SupabaseMonitor.getInstance();
        const supabaseStats = supabaseMonitor.getOperationStats();
        const supabaseInsights = supabaseMonitor.getPerformanceInsights();

        // Get MCP analysis
        const mcpAnalysis = sentryMCP.analyzeErrorPatterns();

        setAiMetrics(aiErrorMetrics);
        setSupabaseMetrics(supabaseStats);
        setErrorPatterns(aiErrorPatterns);
        setInsights([...supabaseInsights, ...mcpAnalysis]);
        setMcpPatterns(mcpAnalysis);
      } catch (error) {
        console.error('Failed to load monitoring metrics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMetrics();

    // Refresh metrics every 30 seconds
    const interval = setInterval(loadMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Loading monitoring data...</span>
      </div>
    );
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const formatResponseTime = (time: number) => {
    if (time < 1000) return `${time.toFixed(0)}ms`;
    return `${(time / 1000).toFixed(1)}s`;
  };

  return (
    <div className="monitoring-dashboard p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">
          System Monitoring Dashboard
        </h2>
        <div className="flex items-center space-x-2">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            <span className="text-sm text-gray-600">Live Monitoring</span>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* AI Operations Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            AI Operations
          </h3>
          <div className="space-y-3">
            {Object.entries(aiMetrics).map(([operation, metrics]: [string, any]) => (
              <div key={operation} className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">
                  {operation.replace('-', ' ').toUpperCase()}
                </span>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {metrics.successRate.toFixed(1)}% success
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatResponseTime(metrics.avgResponseTime)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Database Operations
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">
                Total Operations
              </span>
              <span className="text-sm font-medium text-gray-900">
                {supabaseMetrics.totalOperations || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">
                Slow Queries
              </span>
              <span className="text-sm font-medium text-red-600">
                {supabaseMetrics.slowQueries?.length || 0}
              </span>
            </div>
            {Object.entries(supabaseMetrics.operationCounts || {}).slice(0, 5).map(([op, count]: [string, any]) => (
              <div key={op} className="flex justify-between items-center">
                <span className="text-xs text-gray-600">
                  {op.replace('-', ' ')}
                </span>
                <span className="text-xs text-gray-900">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Error Patterns
          </h3>
          <div className="space-y-3">
            {errorPatterns.slice(0, 5).map((pattern, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">
                  {pattern.operation}
                </span>
                <div className="text-right">
                  <div className={`text-sm font-medium ${
                    pattern.errorRate > 10 ? 'text-red-600' :
                    pattern.errorRate > 5 ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {pattern.errorRate.toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-500">
                    {pattern.errorCount} errors
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Performance Insights */}
      {insights.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Performance Insights
          </h3>
          <div className="space-y-4">
            {insights.map((insight, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${getSeverityColor(insight.severity)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        insight.severity === 'high' ? 'bg-red-100 text-red-800' :
                        insight.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {insight.severity.toUpperCase()}
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {insight.type.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-gray-700">
                      {insight.message}
                    </p>
                    <p className="mt-1 text-sm font-medium text-gray-800">
                      💡 {insight.recommendation}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MCP Analysis */}
      {mcpPatterns.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            AI Context Analysis (MCP)
          </h3>
          <div className="space-y-4">
            {mcpPatterns.map((pattern, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${getSeverityColor(pattern.severity)}`}
              >
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-sm font-semibold text-gray-900">
                    {pattern.type.replace('_', ' ').toUpperCase()}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    pattern.severity === 'high' ? 'bg-red-600 text-white' :
                    pattern.severity === 'medium' ? 'bg-yellow-600 text-white' :
                    'bg-blue-600 text-white'
                  }`}>
                    {pattern.severity}
                  </span>
                </div>
                <p className="text-sm text-gray-700 mb-2">{pattern.description}</p>
                <p className="text-sm font-medium text-gray-800">
                  📋 {pattern.recommendation}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Slow Queries */}
      {supabaseMetrics.slowQueries?.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Slow Queries
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Query
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {supabaseMetrics.slowQueries.map((query: any, index: number) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {query.query}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                      {formatResponseTime(query.duration)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(query.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Debugging Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => {
              console.log('Opening Sentry dashboard...');
              window.open('https://sentry.io', '_blank');
            }}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm"
          >
            Open Sentry Dashboard
          </button>
          <button
            onClick={() => {
              const errorMetrics = AIErrorReporter.getInstance().getErrorMetrics();
              console.log('AI Error Metrics:', errorMetrics);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            Export AI Metrics
          </button>
          <button
            onClick={() => {
              const supabaseStats = SupabaseMonitor.getInstance().getOperationStats();
              console.log('Supabase Stats:', supabaseStats);
            }}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
          >
            Export DB Stats
          </button>
          <button
            onClick={() => {
              sentryMCP.clearHistory();
              window.location.reload();
            }}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
          >
            Clear Monitoring Data
          </button>
        </div>
      </div>
    </div>
  );
}