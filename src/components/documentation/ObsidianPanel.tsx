import React, { useState, useEffect } from 'react';
import {
  getObsidianSyncService,
  getObsidianConfig,
  updateObsidianConfig,
  SyncStatus,
  ObsidianConfig
} from '../../services/obsidian';

interface ObsidianPanelProps {
  className?: string;
}

export const ObsidianPanel: React.FC<ObsidianPanelProps> = ({ className = '' }) => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    status: 'disconnected',
    lastSync: new Date(),
    filesChanged: 0,
    errors: []
  });
  const [config, setConfig] = useState<ObsidianConfig>(getObsidianConfig());
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    updateSyncStatus();

    const syncService = getObsidianSyncService();

    const handleSyncStarted = () => {
      setIsSyncing(true);
      setSyncStatus(prev => ({ ...prev, status: 'syncing' }));
    };

    const handleSyncCompleted = () => {
      setIsSyncing(false);
      updateSyncStatus();
    };

    const handleSyncError = (error: Error) => {
      setIsSyncing(false);
      setSyncStatus(prev => ({
        ...prev,
        status: 'error',
        errors: [...prev.errors, error.message]
      }));
    };

    syncService.on('syncStarted', handleSyncStarted);
    syncService.on('syncCompleted', handleSyncCompleted);
    syncService.on('syncError', handleSyncError);

    return () => {
      syncService.off('syncStarted', handleSyncStarted);
      syncService.off('syncCompleted', handleSyncCompleted);
      syncService.off('syncError', handleSyncError);
    };
  }, []);

  const updateSyncStatus = async () => {
    try {
      const syncService = getObsidianSyncService();
      const status = await syncService.getSyncStatus();
      setSyncStatus(status);
    } catch (error) {
      setSyncStatus(prev => ({
        ...prev,
        status: 'error',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }));
    }
  };

  const handleStartSync = async () => {
    try {
      setIsSyncing(true);
      const syncService = getObsidianSyncService();
      await syncService.startSync();
    } catch (error) {
      setIsSyncing(false);
      setSyncStatus(prev => ({
        ...prev,
        status: 'error',
        errors: [...prev.errors, error instanceof Error ? error.message : 'Unknown error']
      }));
    }
  };

  const handleStopSync = () => {
    const syncService = getObsidianSyncService();
    syncService.stopSync();
    setIsSyncing(false);
    setSyncStatus(prev => ({ ...prev, status: 'disconnected' }));
  };

  const handleForceSync = async () => {
    try {
      setIsSyncing(true);
      const syncService = getObsidianSyncService();
      await syncService.performSync();
      setIsSyncing(false);
    } catch (error) {
      setIsSyncing(false);
      setSyncStatus(prev => ({
        ...prev,
        status: 'error',
        errors: [...prev.errors, error instanceof Error ? error.message : 'Unknown error']
      }));
    }
  };

  const handleConfigSave = (newConfig: Partial<ObsidianConfig>) => {
    updateObsidianConfig(newConfig);
    setConfig(getObsidianConfig());
    setIsConfigOpen(false);
    updateSyncStatus();
  };

  const getStatusColor = () => {
    switch (syncStatus.status) {
      case 'connected': return 'text-green-600';
      case 'syncing': return 'text-blue-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = () => {
    switch (syncStatus.status) {
      case 'connected': return '🟢';
      case 'syncing': return '🔄';
      case 'error': return '🔴';
      default: return '⚫';
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Obsidian Documentation</h3>
        <button
          onClick={() => setIsConfigOpen(!isConfigOpen)}
          className="text-gray-500 hover:text-gray-700"
          title="Configure Obsidian"
        >
          ⚙️
        </button>
      </div>

      {/* Status Display */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span>{getStatusIcon()}</span>
            <span className={`font-medium ${getStatusColor()}`}>
              {syncStatus.status.charAt(0).toUpperCase() + syncStatus.status.slice(1)}
            </span>
          </div>
          <span className="text-sm text-gray-500">
            Last sync: {syncStatus.lastSync.toLocaleTimeString()}
          </span>
        </div>

        {syncStatus.filesChanged > 0 && (
          <div className="mt-2 text-sm text-gray-600">
            {syncStatus.filesChanged} files changed
          </div>
        )}

        {syncStatus.errors.length > 0 && (
          <div className="mt-2">
            {syncStatus.errors.map((error, index) => (
              <div key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                {error}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Control Buttons */}
      <div className="flex space-x-2 mb-4">
        {syncStatus.status === 'disconnected' || syncStatus.status === 'error' ? (
          <button
            onClick={handleStartSync}
            disabled={isSyncing}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSyncing ? 'Starting...' : 'Start Sync'}
          </button>
        ) : (
          <button
            onClick={handleStopSync}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Stop Sync
          </button>
        )}

        <button
          onClick={handleForceSync}
          disabled={isSyncing}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSyncing ? 'Syncing...' : 'Force Sync'}
        </button>
      </div>

      {/* Configuration Panel */}
      {isConfigOpen && (
        <ObsidianConfigPanel
          config={config}
          onSave={handleConfigSave}
          onCancel={() => setIsConfigOpen(false)}
        />
      )}

      {/* Documentation Structure */}
      <div className="border-t pt-4">
        <h4 className="font-medium text-gray-900 mb-2">Documentation Structure</h4>
        <div className="text-sm text-gray-600 space-y-1">
          <div>📁 {config.documentationPath}/</div>
          <div className="ml-4">📁 agents/ - Agent documentation</div>
          <div className="ml-4">📁 components/ - React component docs</div>
          <div className="ml-4">📁 api/ - API documentation</div>
          <div className="ml-4">📁 architecture/ - System design</div>
          <div className="ml-4">📄 project-overview.md</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="border-t pt-4 mt-4">
        <h4 className="font-medium text-gray-900 mb-2">Quick Actions</h4>
        <div className="grid grid-cols-2 gap-2">
          <button className="text-sm px-3 py-2 bg-gray-100 rounded hover:bg-gray-200">
            📄 Open in Obsidian
          </button>
          <button className="text-sm px-3 py-2 bg-gray-100 rounded hover:bg-gray-200">
            🔍 Browse Vault
          </button>
          <button className="text-sm px-3 py-2 bg-gray-100 rounded hover:bg-gray-200">
            📊 Generate Report
          </button>
          <button className="text-sm px-3 py-2 bg-gray-100 rounded hover:bg-gray-200">
            🔄 Refresh Docs
          </button>
        </div>
      </div>
    </div>
  );
};

interface ObsidianConfigPanelProps {
  config: ObsidianConfig;
  onSave: (config: Partial<ObsidianConfig>) => void;
  onCancel: () => void;
}

const ObsidianConfigPanel: React.FC<ObsidianConfigPanelProps> = ({ config, onSave, onCancel }) => {
  const [formConfig, setFormConfig] = useState<ObsidianConfig>(config);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formConfig);
  };

  return (
    <div className="border-t pt-4 mt-4">
      <h4 className="font-medium text-gray-900 mb-4">Obsidian Configuration</h4>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            API URL
          </label>
          <input
            type="text"
            value={formConfig.apiUrl}
            onChange={(e) => setFormConfig(prev => ({ ...prev, apiUrl: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="http://localhost"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Port
          </label>
          <input
            type="number"
            value={formConfig.port}
            onChange={(e) => setFormConfig(prev => ({ ...prev, port: parseInt(e.target.value) || 27123 }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="27123"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Vault Name
          </label>
          <input
            type="text"
            value={formConfig.vaultName}
            onChange={(e) => setFormConfig(prev => ({ ...prev, vaultName: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="viral-hashtag-ai"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Documentation Path
          </label>
          <input
            type="text"
            value={formConfig.documentationPath}
            onChange={(e) => setFormConfig(prev => ({ ...prev, documentationPath: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Projects/Viral-Hashtag-AI"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            API Token (Optional)
          </label>
          <input
            type="password"
            value={formConfig.token || ''}
            onChange={(e) => setFormConfig(prev => ({ ...prev, token: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Your Obsidian API token"
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="autoSync"
            checked={formConfig.autoSync}
            onChange={(e) => setFormConfig(prev => ({ ...prev, autoSync: e.target.checked }))}
            className="mr-2"
          />
          <label htmlFor="autoSync" className="text-sm text-gray-700">
            Enable automatic sync
          </label>
        </div>

        {formConfig.autoSync && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sync Interval (seconds)
            </label>
            <input
              type="number"
              value={formConfig.syncInterval}
              onChange={(e) => setFormConfig(prev => ({ ...prev, syncInterval: parseInt(e.target.value) || 300 }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="10"
              placeholder="300"
            />
          </div>
        )}

        <div className="flex space-x-2 pt-4">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Save Configuration
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};