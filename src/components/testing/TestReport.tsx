import React, { useState, useMemo, useCallback } from 'react';
import { TestSuite } from './UXTestSuite';
import { PerformanceData } from './PerformanceMonitor';

export interface TestReportProps {
  testSuites: TestSuite[];
  performanceData: PerformanceData;
  onClose: () => void;
}

interface TestMetrics {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  warningTests: number;
  totalDuration: number;
  successRate: number;
  avgTestDuration: number;
  criticalFailures: number;
  performanceScore: number;
}

export const TestReport: React.FC<TestReportProps> = ({
  testSuites,
  performanceData,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'details' | 'performance' | 'recommendations'>('summary');
  const [exportFormat, setExportFormat] = useState<'json' | 'csv' | 'html'>('json');

  // Calculate comprehensive metrics
  const metrics = useMemo((): TestMetrics => {
    const allTests = testSuites.flatMap(suite => suite.tests);
    const totalTests = allTests.length;
    const passedTests = allTests.filter(test => test.status === 'passed').length;
    const failedTests = allTests.filter(test => test.status === 'failed').length;
    const warningTests = allTests.filter(test => test.status === 'skipped').length;
    const totalDuration = allTests.reduce((acc, test) => acc + test.duration, 0);
    const successRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;
    const avgTestDuration = totalTests > 0 ? totalDuration / totalTests : 0;

    // Critical failures (failures in essential systems)
    const criticalTests = allTests.filter(test =>
      test.testName.toLowerCase().includes('accessibility') ||
      test.testName.toLowerCase().includes('performance') ||
      test.testName.toLowerCase().includes('security')
    );
    const criticalFailures = criticalTests.filter(test => test.status === 'failed').length;

    // Performance score based on various metrics
    let performanceScore = 100;
    if (performanceData.framerate < 60) performanceScore -= 20;
    if (performanceData.memoryUsage > 50) performanceScore -= 15;
    if (performanceData.largestContentfulPaint > 2500) performanceScore -= 15;
    if (performanceData.firstInputDelay > 100) performanceScore -= 10;
    if (performanceData.cumulativeLayoutShift > 0.1) performanceScore -= 10;
    if (successRate < 90) performanceScore -= (100 - successRate);

    return {
      totalTests,
      passedTests,
      failedTests,
      warningTests,
      totalDuration,
      successRate,
      avgTestDuration,
      criticalFailures,
      performanceScore: Math.max(0, performanceScore)
    };
  }, [testSuites, performanceData]);

  // Generate recommendations based on test results
  const recommendations = useMemo(() => {
    const recs: Array<{ category: string; priority: 'high' | 'medium' | 'low'; issue: string; solution: string }> = [];

    // Performance recommendations
    if (performanceData.framerate < 55) {
      recs.push({
        category: 'Performance',
        priority: 'high',
        issue: `Low frame rate detected (${performanceData.framerate} FPS)`,
        solution: 'Optimize render performance, reduce DOM manipulations, use React.memo for expensive components'
      });
    }

    if (performanceData.memoryUsage > 100) {
      recs.push({
        category: 'Performance',
        priority: 'high',
        issue: `High memory usage (${performanceData.memoryUsage.toFixed(1)}MB)`,
        solution: 'Implement memory cleanup, optimize data structures, add component unmounting logic'
      });
    }

    if (performanceData.largestContentfulPaint > 4000) {
      recs.push({
        category: 'Performance',
        priority: 'high',
        issue: `Poor Largest Contentful Paint (${performanceData.largestContentfulPaint.toFixed(0)}ms)`,
        solution: 'Optimize image loading, implement lazy loading, reduce bundle size, use CDN'
      });
    }

    if (performanceData.cumulativeLayoutShift > 0.25) {
      recs.push({
        category: 'Performance',
        priority: 'medium',
        issue: `High Cumulative Layout Shift (${performanceData.cumulativeLayoutShift.toFixed(3)})`,
        solution: 'Reserve space for images and ads, use CSS aspect ratios, avoid inserting content above existing content'
      });
    }

    // Test failure recommendations
    const failedSuites = testSuites.filter(suite => suite.failedTests > 0);
    failedSuites.forEach(suite => {
      const failureRate = (suite.failedTests / suite.totalTests) * 100;

      if (suite.name.includes('Accessibility') && failureRate > 10) {
        recs.push({
          category: 'Accessibility',
          priority: 'high',
          issue: `${failureRate.toFixed(0)}% accessibility test failures`,
          solution: 'Add ARIA labels, improve keyboard navigation, ensure proper color contrast'
        });
      }

      if (suite.name.includes('Mobile') && failureRate > 15) {
        recs.push({
          category: 'Mobile UX',
          priority: 'medium',
          issue: `${failureRate.toFixed(0)}% mobile UX test failures`,
          solution: 'Improve touch targets, optimize for smaller screens, test gesture recognition'
        });
      }

      if (suite.name.includes('Visual') && failureRate > 20) {
        recs.push({
          category: 'Visual',
          priority: 'medium',
          issue: `${failureRate.toFixed(0)}% visual regression test failures`,
          solution: 'Update baselines, fix CSS inconsistencies, test across browsers and devices'
        });
      }
    });

    // Critical system recommendations
    if (metrics.criticalFailures > 0) {
      recs.push({
        category: 'Critical',
        priority: 'high',
        issue: `${metrics.criticalFailures} critical system failures detected`,
        solution: 'Address critical failures immediately as they affect core functionality and user safety'
      });
    }

    // Success rate recommendations
    if (metrics.successRate < 80) {
      recs.push({
        category: 'Quality',
        priority: 'high',
        issue: `Low overall test success rate (${metrics.successRate.toFixed(1)}%)`,
        solution: 'Review failing tests, improve code quality, add error handling and validation'
      });
    }

    return recs.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }, [testSuites, performanceData, metrics]);

  // Export test results
  const exportResults = useCallback(() => {
    const exportData = {
      timestamp: new Date().toISOString(),
      metrics,
      testSuites,
      performanceData,
      recommendations,
      summary: {
        totalDuration: metrics.totalDuration,
        successRate: metrics.successRate,
        performanceScore: metrics.performanceScore,
        criticalIssues: metrics.criticalFailures
      }
    };

    let content: string;
    let filename: string;
    let mimeType: string;

    switch (exportFormat) {
      case 'csv':
        const csvRows = [
          ['Test Suite', 'Test Name', 'Status', 'Duration (ms)', 'Details'].join(','),
          ...testSuites.flatMap(suite =>
            suite.tests.map(test =>
              [
                `"${suite.name}"`,
                `"${test.testName}"`,
                test.status,
                test.duration.toFixed(2),
                `"${test.details.replace(/"/g, '""')}"`
              ].join(',')
            )
          )
        ];
        content = csvRows.join('\n');
        filename = `test-report-${Date.now()}.csv`;
        mimeType = 'text/csv';
        break;

      case 'html':
        content = `
<!DOCTYPE html>
<html>
<head>
    <title>UX Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #1f2937; color: white; padding: 20px; border-radius: 8px; }
        .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin: 20px 0; }
        .metric { background: #f3f4f6; padding: 16px; border-radius: 8px; }
        .suite { margin: 20px 0; border: 1px solid #e5e7eb; border-radius: 8px; }
        .suite-header { background: #f9fafb; padding: 12px; font-weight: bold; }
        .test { padding: 8px 12px; border-bottom: 1px solid #e5e7eb; }
        .passed { color: #059669; }
        .failed { color: #dc2626; }
        .warning { color: #d97706; }
    </style>
</head>
<body>
    <div class="header">
        <h1>UX Test Report</h1>
        <p>Generated: ${new Date().toLocaleString()}</p>
    </div>

    <div class="metrics">
        <div class="metric">
            <h3>Total Tests</h3>
            <p>${metrics.totalTests}</p>
        </div>
        <div class="metric">
            <h3>Success Rate</h3>
            <p>${metrics.successRate.toFixed(1)}%</p>
        </div>
        <div class="metric">
            <h3>Performance Score</h3>
            <p>${metrics.performanceScore.toFixed(0)}/100</p>
        </div>
        <div class="metric">
            <h3>Critical Failures</h3>
            <p>${metrics.criticalFailures}</p>
        </div>
    </div>

    ${testSuites.map(suite => `
        <div class="suite">
            <div class="suite-header">${suite.name}</div>
            ${suite.tests.map(test => `
                <div class="test">
                    <span class="${test.status}">${test.testName}</span> -
                    <span>${test.status}</span>
                    (${test.duration.toFixed(2)}ms)
                </div>
            `).join('')}
        </div>
    `).join('')}
</body>
</html>`;
        filename = `test-report-${Date.now()}.html`;
        mimeType = 'text/html';
        break;

      default: // json
        content = JSON.stringify(exportData, null, 2);
        filename = `test-report-${Date.now()}.json`;
        mimeType = 'application/json';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [exportFormat, metrics, testSuites, performanceData, recommendations]);

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 70) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-600';
      case 'medium': return 'bg-yellow-600';
      case 'low': return 'bg-blue-600';
      default: return 'bg-gray-600';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white">UX Test Report</h2>
          <div className="flex items-center space-x-4">
            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value as any)}
              className="bg-gray-800 text-white rounded px-3 py-1 border border-gray-600"
              aria-label="Select export format"
            >
              <option value="json">JSON</option>
              <option value="csv">CSV</option>
              <option value="html">HTML</option>
            </select>
            <button
              onClick={exportResults}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
              aria-label="Export test report"
            >
              Export
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 text-white"
              aria-label="Close test report"
            >
              Close
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-700">
          {[
            { id: 'summary', label: 'Summary' },
            { id: 'details', label: 'Test Details' },
            { id: 'performance', label: 'Performance' },
            { id: 'recommendations', label: 'Recommendations' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-b-2 border-blue-500 text-blue-400'
                  : 'text-gray-400 hover:text-white'
              }`}
              aria-label={`View ${tab.label} tab`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Summary Tab */}
          {activeTab === 'summary' && (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="bg-gray-800 p-4 rounded-lg text-center">
                  <h3 className="text-lg font-medium text-gray-300">Total Tests</h3>
                  <p className="text-3xl font-bold text-white">{metrics.totalTests}</p>
                </div>
                <div className="bg-gray-800 p-4 rounded-lg text-center">
                  <h3 className="text-lg font-medium text-gray-300">Success Rate</h3>
                  <p className={`text-3xl font-bold ${getScoreColor(metrics.successRate)}`}>
                    {metrics.successRate.toFixed(1)}%
                  </p>
                </div>
                <div className="bg-gray-800 p-4 rounded-lg text-center">
                  <h3 className="text-lg font-medium text-gray-300">Performance Score</h3>
                  <p className={`text-3xl font-bold ${getScoreColor(metrics.performanceScore)}`}>
                    {metrics.performanceScore.toFixed(0)}/100
                  </p>
                </div>
                <div className="bg-gray-800 p-4 rounded-lg text-center">
                  <h3 className="text-lg font-medium text-gray-300">Critical Issues</h3>
                  <p className={`text-3xl font-bold ${metrics.criticalFailures > 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {metrics.criticalFailures}
                  </p>
                </div>
              </div>

              {/* Test Results Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-900/30 border border-green-500 p-4 rounded-lg">
                  <h4 className="font-medium text-green-300 mb-2">Passed Tests</h4>
                  <p className="text-2xl font-bold text-green-400">{metrics.passedTests}</p>
                  <p className="text-sm text-green-300">
                    {((metrics.passedTests / metrics.totalTests) * 100).toFixed(1)}% of total
                  </p>
                </div>
                <div className="bg-red-900/30 border border-red-500 p-4 rounded-lg">
                  <h4 className="font-medium text-red-300 mb-2">Failed Tests</h4>
                  <p className="text-2xl font-bold text-red-400">{metrics.failedTests}</p>
                  <p className="text-sm text-red-300">
                    {((metrics.failedTests / metrics.totalTests) * 100).toFixed(1)}% of total
                  </p>
                </div>
                <div className="bg-yellow-900/30 border border-yellow-500 p-4 rounded-lg">
                  <h4 className="font-medium text-yellow-300 mb-2">Skipped Tests</h4>
                  <p className="text-2xl font-bold text-yellow-400">{metrics.warningTests}</p>
                  <p className="text-sm text-yellow-300">
                    {((metrics.warningTests / metrics.totalTests) * 100).toFixed(1)}% of total
                  </p>
                </div>
              </div>

              {/* Suite Overview */}
              <div>
                <h3 className="text-xl font-semibold text-white mb-4">Test Suite Overview</h3>
                <div className="space-y-3">
                  {testSuites.map((suite, index) => {
                    const suiteSuccessRate = suite.totalTests > 0 ? (suite.passedTests / suite.totalTests) * 100 : 0;
                    return (
                      <div key={index} className="bg-gray-800 p-4 rounded-lg">
                        <div className="flex justify-between items-center">
                          <h4 className="font-medium text-white">{suite.name}</h4>
                          <span className={`px-2 py-1 rounded text-sm ${
                            suiteSuccessRate >= 90 ? 'bg-green-600 text-white' :
                            suiteSuccessRate >= 70 ? 'bg-yellow-600 text-black' :
                            'bg-red-600 text-white'
                          }`}>
                            {suiteSuccessRate.toFixed(0)}%
                          </span>
                        </div>
                        <p className="text-gray-300 text-sm mt-1">{suite.description}</p>
                        <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
                          <div>
                            <span className="text-gray-400">Passed:</span>
                            <span className="ml-2 text-green-400 font-medium">{suite.passedTests}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Failed:</span>
                            <span className="ml-2 text-red-400 font-medium">{suite.failedTests}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Total:</span>
                            <span className="ml-2 text-white font-medium">{suite.totalTests}</span>
                          </div>
                        </div>
                        {/* Progress Bar */}
                        <div className="w-full bg-gray-700 rounded-full h-2 mt-3">
                          <div
                            className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${suiteSuccessRate}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Test Details Tab */}
          {activeTab === 'details' && (
            <div className="space-y-6">
              {testSuites.map((suite, suiteIndex) => (
                <div key={suiteIndex} className="bg-gray-800 rounded-lg overflow-hidden">
                  <div className="bg-gray-700 p-4">
                    <h3 className="text-lg font-semibold text-white">{suite.name}</h3>
                    <p className="text-gray-300 text-sm">{suite.description}</p>
                  </div>
                  <div className="divide-y divide-gray-700">
                    {suite.tests.map((test, testIndex) => (
                      <div key={testIndex} className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-medium text-white">{test.testName}</h4>
                            <p className="text-gray-300 text-sm mt-1">{test.details}</p>
                            {test.screenshot && (
                              <p className="text-gray-400 text-xs mt-1">Screenshot: {test.screenshot}</p>
                            )}
                          </div>
                          <div className="flex items-center space-x-3 ml-4">
                            <span className="text-gray-400 text-sm">
                              {test.duration.toFixed(2)}ms
                            </span>
                            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                              test.status === 'passed' ? 'bg-green-600 text-white' :
                              test.status === 'failed' ? 'bg-red-600 text-white' :
                              'bg-yellow-600 text-black'
                            }`}>
                              {test.status}
                            </div>
                          </div>
                        </div>
                        {test.metrics && Object.keys(test.metrics).length > 0 && (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
                            {Object.entries(test.metrics).map(([key, value]) => (
                              <div key={key} className="bg-gray-900 p-2 rounded text-xs">
                                <span className="text-gray-400">{key}:</span>
                                <span className="ml-1 text-white">{value}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Performance Tab */}
          {activeTab === 'performance' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Core Web Vitals */}
                <div className="bg-gray-800 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-white mb-4">Core Web Vitals</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Largest Contentful Paint</span>
                      <span className={`font-medium ${
                        performanceData.largestContentfulPaint < 2500 ? 'text-green-400' :
                        performanceData.largestContentfulPaint < 4000 ? 'text-yellow-400' :
                        'text-red-400'
                      }`}>
                        {performanceData.largestContentfulPaint.toFixed(0)}ms
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">First Input Delay</span>
                      <span className={`font-medium ${
                        performanceData.firstInputDelay < 100 ? 'text-green-400' :
                        performanceData.firstInputDelay < 300 ? 'text-yellow-400' :
                        'text-red-400'
                      }`}>
                        {performanceData.firstInputDelay.toFixed(0)}ms
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Cumulative Layout Shift</span>
                      <span className={`font-medium ${
                        performanceData.cumulativeLayoutShift < 0.1 ? 'text-green-400' :
                        performanceData.cumulativeLayoutShift < 0.25 ? 'text-yellow-400' :
                        'text-red-400'
                      }`}>
                        {performanceData.cumulativeLayoutShift.toFixed(3)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Runtime Performance */}
                <div className="bg-gray-800 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-white mb-4">Runtime Performance</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Frame Rate</span>
                      <span className={`font-medium ${
                        performanceData.framerate >= 58 ? 'text-green-400' :
                        performanceData.framerate >= 45 ? 'text-yellow-400' :
                        'text-red-400'
                      }`}>
                        {performanceData.framerate.toFixed(0)} FPS
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Memory Usage</span>
                      <span className={`font-medium ${
                        performanceData.memoryUsage < 50 ? 'text-green-400' :
                        performanceData.memoryUsage < 100 ? 'text-yellow-400' :
                        'text-red-400'
                      }`}>
                        {performanceData.memoryUsage.toFixed(1)}MB
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Network Latency</span>
                      <span className={`font-medium ${
                        performanceData.networkLatency < 100 ? 'text-green-400' :
                        performanceData.networkLatency < 300 ? 'text-yellow-400' :
                        'text-red-400'
                      }`}>
                        {performanceData.networkLatency.toFixed(0)}ms
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance Score Breakdown */}
              <div className="bg-gray-800 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-4">Performance Score Breakdown</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Overall Score</span>
                    <div className="flex items-center space-x-3">
                      <div className="w-32 bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 h-2 rounded-full"
                          style={{ width: `${metrics.performanceScore}%` }}
                        />
                      </div>
                      <span className={`font-bold ${getScoreColor(metrics.performanceScore)}`}>
                        {metrics.performanceScore.toFixed(0)}/100
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Recommendations Tab */}
          {activeTab === 'recommendations' && (
            <div className="space-y-6">
              <div className="bg-gray-800 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-4">Test Results Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-400">{metrics.passedTests}</p>
                    <p className="text-gray-300">Passed</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-400">{metrics.failedTests}</p>
                    <p className="text-gray-300">Failed</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-yellow-400">{metrics.warningTests}</p>
                    <p className="text-gray-300">Warnings</p>
                  </div>
                </div>
              </div>

              {recommendations.length > 0 ? (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Recommended Actions</h3>
                  {recommendations.map((rec, index) => (
                    <div key={index} className="bg-gray-800 p-4 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-white">{rec.category}</h4>
                        <span className={`px-2 py-1 rounded text-xs font-medium text-white ${getPriorityColor(rec.priority)}`}>
                          {rec.priority.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-gray-300 mb-3">{rec.issue}</p>
                      <div className="bg-gray-700 p-3 rounded">
                        <p className="text-gray-200 text-sm">
                          <strong>Solution:</strong> {rec.solution}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-green-900/30 border border-green-500 p-6 rounded-lg text-center">
                  <h3 className="text-lg font-semibold text-green-300 mb-2">Great Job!</h3>
                  <p className="text-green-200">
                    All tests are passing well. No critical recommendations at this time.
                    Continue monitoring performance and user experience.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};