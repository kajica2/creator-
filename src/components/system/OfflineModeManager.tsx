import React, { useState, useEffect } from 'react';
import { useConnection } from '../../shared/system/ConnectionManager';
import { ProgressStatusDisplay } from './ProgressStatusDisplay';

interface OfflineModeManagerProps {
  children: React.ReactNode;
}

export const OfflineModeManager: React.FC<OfflineModeManagerProps> = ({ children }) => {
  const { state, isOffline, forceRetry, diagnose } = useConnection();
  const [showOfflineMessage, setShowOfflineMessage] = useState(false);
  const [offlineData, setOfflineData] = useState<any>(null);

  useEffect(() => {
    // Show offline message after a delay when offline
    if (isOffline) {
      const timer = setTimeout(() => {
        setShowOfflineMessage(true);
      }, 2000);

      return () => clearTimeout(timer);
    } else {
      setShowOfflineMessage(false);
    }
  }, [isOffline]);

  useEffect(() => {
    // Load offline data from localStorage
    try {
      const stored = localStorage.getItem('offline_data');
      if (stored) {
        setOfflineData(JSON.parse(stored));
      }
    } catch (error) {
      console.warn('Failed to load offline data:', error);
    }
  }, []);

  const saveOfflineData = (data: any) => {
    try {
      localStorage.setItem('offline_data', JSON.stringify(data));
      setOfflineData(data);
    } catch (error) {
      console.warn('Failed to save offline data:', error);
    }
  };

  const clearOfflineData = () => {
    localStorage.removeItem('offline_data');
    setOfflineData(null);
  };

  if (!isOffline) {
    return (
      <>
        {children}
        {/* Connection restored notification */}
        {state.lastConnected && Date.now() - state.lastConnected < 5000 && (
          <div className="fixed top-4 right-4 z-50">
            <div className="bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Connection restored</span>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      {children}

      {/* Offline Mode Banner */}
      {showOfflineMessage && (
        <div className="fixed top-0 left-0 right-0 z-40 bg-yellow-600 text-white">
          <div className="max-w-7xl mx-auto px-4 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">
                  {!state.isOnline ? 'No internet connection' : 'Supabase service unavailable'}
                </span>
                <span className="text-yellow-200 text-sm">
                  - Running in offline mode
                </span>
              </div>

              <div className="flex items-center space-x-2">
                {state.retryCount > 0 && (
                  <span className="text-yellow-200 text-sm">
                    Retry {state.retryCount}/5
                  </span>
                )}

                <button
                  onClick={forceRetry}
                  className="px-3 py-1 bg-yellow-700 hover:bg-yellow-800 rounded text-sm font-medium transition-colors"
                  disabled={state.retryCount >= 5}
                >
                  Retry
                </button>

                <button
                  onClick={() => setShowOfflineMessage(false)}
                  className="p-1 hover:bg-yellow-700 rounded transition-colors"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Offline Mode Overlay */}
      <OfflineModeOverlay
        connectionState={state}
        offlineData={offlineData}
        onRetry={forceRetry}
        onDiagnose={diagnose}
        onSaveData={saveOfflineData}
        onClearData={clearOfflineData}
      />
    </>
  );
};

interface OfflineModeOverlayProps {
  connectionState: any;
  offlineData: any;
  onRetry: () => void;
  onDiagnose: () => void;
  onSaveData: (data: any) => void;
  onClearData: () => void;
}

const OfflineModeOverlay: React.FC<OfflineModeOverlayProps> = ({
  connectionState,
  offlineData,
  onRetry,
  onDiagnose,
  onSaveData,
  onClearData
}) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <>
      {/* Floating Status Widget */}
      <div className="fixed bottom-4 left-4 z-50">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="bg-gray-800 hover:bg-gray-700 text-white p-3 rounded-full shadow-lg border border-gray-600 transition-colors"
        >
          <div className="relative">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M17.778 8.222c-4.296-4.296-11.26-4.296-15.556 0A1 1 0 01.808 6.808c5.076-5.077 13.308-5.077 18.384 0a1 1 0 01-1.414 1.414zM14.95 11.05a7 7 0 00-9.9 0 1 1 0 01-1.414-1.414 9 9 0 0112.728 0 1 1 0 01-1.414 1.414zM12.12 13.88a3 3 0 00-4.24 0 1 1 0 01-1.415-1.414 5 5 0 017.07 0 1 1 0 01-1.415 1.414zM9 16a1 1 0 012 0v1a1 1 0 11-2 0v-1z" clipRule="evenodd" />
            </svg>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          </div>
        </button>
      </div>

      {/* Detailed Offline Panel */}
      {showDetails && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-lg border border-gray-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h2 className="text-lg font-semibold text-white">Offline Mode</h2>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Connection Status */}
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="font-medium text-white mb-3">Connection Status</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Network:</span>
                    <span className={connectionState.isOnline ? 'text-green-400' : 'text-red-400'}>
                      {connectionState.isOnline ? 'Online' : 'Offline'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Supabase:</span>
                    <span className={connectionState.supabaseConnected ? 'text-green-400' : 'text-red-400'}>
                      {connectionState.supabaseConnected ? 'Connected' : 'Disconnected'}
                    </span>
                  </div>
                  {connectionState.error && (
                    <div className="text-red-400 text-sm mt-2">
                      Error: {connectionState.error}
                    </div>
                  )}
                </div>
              </div>

              {/* Available Features */}
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="font-medium text-white mb-3">Available Features</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <FeatureStatus name="Local Storage" available={true} />
                  <FeatureStatus name="Audio Processing" available={true} />
                  <FeatureStatus name="Image Generation" available={false} />
                  <FeatureStatus name="Cloud Sync" available={false} />
                  <FeatureStatus name="Settings" available={true} />
                  <FeatureStatus name="History" available={!!offlineData} />
                </div>
              </div>

              {/* Offline Data */}
              {offlineData && (
                <div className="bg-gray-800 rounded-lg p-4">
                  <h3 className="font-medium text-white mb-3">Saved Data</h3>
                  <div className="text-sm text-gray-400">
                    <div>Items saved: {Object.keys(offlineData).length}</div>
                    <div>Last updated: {new Date(offlineData.timestamp || Date.now()).toLocaleString()}</div>
                  </div>
                  <button
                    onClick={onClearData}
                    className="mt-2 text-red-400 hover:text-red-300 text-sm"
                  >
                    Clear offline data
                  </button>
                </div>
              )}

              {/* Actions */}
              <div className="flex space-x-3">
                <button
                  onClick={onRetry}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium text-white transition-colors"
                >
                  Retry Connection
                </button>
                <button
                  onClick={onDiagnose}
                  className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium text-white transition-colors"
                >
                  Diagnose
                </button>
              </div>

              {/* Progress Display */}
              <ProgressStatusDisplay showAllReports={true} compact={true} />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

interface FeatureStatusProps {
  name: string;
  available: boolean;
}

const FeatureStatus: React.FC<FeatureStatusProps> = ({ name, available }) => (
  <div className="flex items-center space-x-2">
    <div className={`w-2 h-2 rounded-full ${available ? 'bg-green-500' : 'bg-gray-500'}`} />
    <span className={available ? 'text-white' : 'text-gray-500'}>{name}</span>
  </div>
);

export default OfflineModeManager;