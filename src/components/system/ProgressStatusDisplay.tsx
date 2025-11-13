import React, { useState, useEffect } from 'react';
import { progressReporter, ProgressReport, ProgressStep } from '../../shared/system/ProgressStatusReporter';
import { getQuickDatabaseStatus } from '../../utils/databaseHealthChecker';

interface ProgressStatusDisplayProps {
  reportId?: string;
  showAllReports?: boolean;
  compact?: boolean;
  className?: string;
}

export const ProgressStatusDisplay: React.FC<ProgressStatusDisplayProps> = ({
  reportId,
  showAllReports = false,
  compact = false,
  className = ''
}) => {
  const [reports, setReports] = useState<Map<string, ProgressReport>>(new Map());
  const [selectedReportId, setSelectedReportId] = useState<string | null>(reportId || null);
  const [dbStatus, setDbStatus] = useState<{ connected: boolean; tablesOk: boolean; issues: number } | null>(null);

  useEffect(() => {
    if (reportId) {
      // Subscribe to specific report
      const unsubscribe = progressReporter.subscribe(reportId, (report) => {
        setReports(prev => new Map(prev.set(reportId, report)));
      });

      // Get initial state
      const report = progressReporter.getReport(reportId);
      if (report) {
        setReports(prev => new Map(prev.set(reportId, report)));
      }

      return unsubscribe;
    } else if (showAllReports) {
      // Subscribe to all reports
      const unsubscribe = progressReporter.subscribeToAll((id, report) => {
        setReports(prev => new Map(prev.set(id, report)));
      });

      // Get initial active reports
      const activeReports = progressReporter.getActiveReports();
      const reportsMap = new Map();
      activeReports.forEach(report => reportsMap.set(report.id, report));
      setReports(reportsMap);

      return unsubscribe;
    }
  }, [reportId, showAllReports]);

  // Check database status periodically
  useEffect(() => {
    const checkDbStatus = async () => {
      try {
        const status = await getQuickDatabaseStatus();
        setDbStatus(status);
      } catch (error) {
        console.warn('Database status check failed:', error);
        setDbStatus({ connected: false, tablesOk: false, issues: 1 });
      }
    };

    checkDbStatus();
    const interval = setInterval(checkDbStatus, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: ProgressStep['status']) => {
    switch (status) {
      case 'completed': return 'text-green-500';
      case 'running': return 'text-blue-500';
      case 'failed': return 'text-red-500';
      case 'warning': return 'text-yellow-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: ProgressStep['status']) => {
    switch (status) {
      case 'completed':
        return <CheckIcon className="w-4 h-4" />;
      case 'running':
        return <SpinnerIcon className="w-4 h-4 animate-spin" />;
      case 'failed':
        return <XIcon className="w-4 h-4" />;
      case 'warning':
        return <WarningIcon className="w-4 h-4" />;
      default:
        return <ClockIcon className="w-4 h-4" />;
    }
  };

  const formatDuration = (startTime: number, endTime?: number) => {
    const duration = (endTime || Date.now()) - startTime;
    const seconds = Math.floor(duration / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ${seconds % 60}s`;
  };

  const formatETA = (estimatedCompletion?: number) => {
    if (!estimatedCompletion) return null;
    const eta = Math.max(0, estimatedCompletion - Date.now());
    const seconds = Math.floor(eta / 1000);
    if (seconds < 60) return `ETA: ${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `ETA: ${minutes}m ${seconds % 60}s`;
  };

  const reportsToShow = showAllReports
    ? Array.from(reports.values())
    : selectedReportId && reports.has(selectedReportId)
    ? [reports.get(selectedReportId)!]
    : [];

  if (reportsToShow.length === 0) {
    return null;
  }

  if (compact) {
    return (
      <div className={`space-y-2 ${className}`}>
        {reportsToShow.map(report => (
          <div key={report.id} className="bg-gray-800 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-white">{report.title}</span>
              <span className="text-xs text-gray-400">
                {report.overallProgress}%
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  report.status === 'failed' ? 'bg-red-500' :
                  report.status === 'warning' ? 'bg-yellow-500' :
                  report.status === 'completed' ? 'bg-green-500' : 'bg-blue-500'
                }`}
                style={{ width: `${report.overallProgress}%` }}
              />
            </div>
            {report.currentStep && (
              <div className="mt-2 text-xs text-gray-400">
                {report.currentStep.message || report.currentStep.name}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {reportsToShow.map(report => (
        <div key={report.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          {/* Report Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-white">{report.title}</h3>
              <div className="flex items-center space-x-4 text-sm text-gray-400">
                <span>
                  {report.completedSteps} of {report.totalSteps} steps completed
                </span>
                <span>{formatDuration(report.startTime, report.endTime)}</span>
                {report.estimatedCompletion && report.status === 'running' && (
                  <span>{formatETA(report.estimatedCompletion)}</span>
                )}
              </div>
            </div>
            <div className={`flex items-center space-x-2 ${getStatusColor(report.status)}`}>
              {getStatusIcon(report.status)}
              <span className="font-medium capitalize">{report.status}</span>
            </div>
          </div>

          {/* Overall Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-400 mb-1">
              <span>Overall Progress</span>
              <span>{report.overallProgress}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-300 ${
                  report.status === 'failed' ? 'bg-red-500' :
                  report.status === 'warning' ? 'bg-yellow-500' :
                  report.status === 'completed' ? 'bg-green-500' : 'bg-blue-500'
                }`}
                style={{ width: `${report.overallProgress}%` }}
              />
            </div>
          </div>

          {/* Steps List */}
          <div className="space-y-2">
            {report.steps.map((step, index) => (
              <div key={step.id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-700/50">
                <div className={`flex-shrink-0 ${getStatusColor(step.status)}`}>
                  {getStatusIcon(step.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-white truncate">
                      {step.name}
                    </span>
                    <span className="text-xs text-gray-400 ml-2">
                      {step.progress}%
                    </span>
                  </div>
                  {step.message && (
                    <p className="text-xs text-gray-400 truncate">{step.message}</p>
                  )}
                  {step.error && (
                    <p className="text-xs text-red-400 truncate">{step.error}</p>
                  )}
                </div>
                {step.status === 'running' && step.progress > 0 && (
                  <div className="w-16 h-1 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all duration-300"
                      style={{ width: `${step.progress}%` }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          {report.status === 'completed' && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => progressReporter.clearCompleted()}
                className="text-xs px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-md text-gray-300"
              >
                Clear Completed
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// Icon Components
const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
  </svg>
);

const SpinnerIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

const XIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
  </svg>
);

const WarningIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
  </svg>
);

const ClockIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
  </svg>
);

export default ProgressStatusDisplay;