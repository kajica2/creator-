import { useState, useEffect, useCallback } from 'react';
import { getObsidianSyncService, DocumentationChange, SyncStatus } from '../services/obsidian';
import * as chokidar from 'chokidar';
import * as path from 'path';

interface UseObsidianWatcherOptions {
  watchLocalFiles?: boolean;
  watchInterval?: number;
  autoSync?: boolean;
}

interface ObsidianWatcherState {
  syncStatus: SyncStatus;
  isWatching: boolean;
  lastChanges: DocumentationChange[];
  errors: string[];
}

export function useObsidianWatcher(options: UseObsidianWatcherOptions = {}) {
  const {
    watchLocalFiles = true,
    watchInterval = 5000,
    autoSync = true
  } = options;

  const [state, setState] = useState<ObsidianWatcherState>({
    syncStatus: {
      status: 'disconnected',
      lastSync: new Date(),
      filesChanged: 0,
      errors: []
    },
    isWatching: false,
    lastChanges: [],
    errors: []
  });

  const [fileWatcher, setFileWatcher] = useState<chokidar.FSWatcher | null>(null);

  const updateSyncStatus = useCallback(async () => {
    try {
      const syncService = getObsidianSyncService();
      const status = await syncService.getSyncStatus();
      setState(prev => ({ ...prev, syncStatus: status }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState(prev => ({
        ...prev,
        errors: [...prev.errors, errorMessage],
        syncStatus: {
          ...prev.syncStatus,
          status: 'error',
          errors: [errorMessage]
        }
      }));
    }
  }, []);

  const startWatching = useCallback(async () => {
    if (state.isWatching) return;

    try {
      setState(prev => ({ ...prev, isWatching: true, errors: [] }));

      const syncService = getObsidianSyncService();

      // Set up Obsidian sync service listeners
      const handleSyncStarted = () => {
        setState(prev => ({
          ...prev,
          syncStatus: { ...prev.syncStatus, status: 'syncing' }
        }));
      };

      const handleSyncCompleted = (data: { timestamp: Date }) => {
        setState(prev => ({
          ...prev,
          syncStatus: {
            ...prev.syncStatus,
            status: 'connected',
            lastSync: data.timestamp
          }
        }));
      };

      const handleSyncError = (error: Error) => {
        const errorMessage = error.message;
        setState(prev => ({
          ...prev,
          errors: [...prev.errors, errorMessage],
          syncStatus: {
            ...prev.syncStatus,
            status: 'error',
            errors: [...prev.syncStatus.errors, errorMessage]
          }
        }));
      };

      const handleDocumentationChanged = (change: DocumentationChange) => {
        setState(prev => ({
          ...prev,
          lastChanges: [change, ...prev.lastChanges.slice(0, 9)], // Keep last 10 changes
          syncStatus: {
            ...prev.syncStatus,
            filesChanged: prev.syncStatus.filesChanged + 1
          }
        }));
      };

      const handleFileCreated = (data: { path: string, source: string }) => {
        const change: DocumentationChange = {
          type: 'create',
          path: data.path,
          timestamp: new Date(),
          source: data.source as 'obsidian' | 'project'
        };
        handleDocumentationChanged(change);
      };

      const handleFileUpdated = (data: { path: string, source: string }) => {
        const change: DocumentationChange = {
          type: 'update',
          path: data.path,
          timestamp: new Date(),
          source: data.source as 'obsidian' | 'project'
        };
        handleDocumentationChanged(change);
      };

      // Register listeners
      syncService.on('syncStarted', handleSyncStarted);
      syncService.on('syncCompleted', handleSyncCompleted);
      syncService.on('syncError', handleSyncError);
      syncService.on('documentationChanged', handleDocumentationChanged);
      syncService.on('fileCreated', handleFileCreated);
      syncService.on('fileUpdated', handleFileUpdated);

      // Start file system watching for local project files
      if (watchLocalFiles) {
        const projectRoot = process.cwd();
        const watchPaths = [
          path.join(projectRoot, 'src', '**', '*.{ts,tsx,js,jsx}'),
          path.join(projectRoot, 'docs', '**', '*.md'),
          path.join(projectRoot, '*.md'),
          path.join(projectRoot, 'package.json')
        ];

        const watcher = chokidar.watch(watchPaths, {
          ignored: [
            '**/node_modules/**',
            '**/.git/**',
            '**/dist/**',
            '**/build/**'
          ],
          persistent: true,
          ignoreInitial: true
        });

        watcher.on('change', async (filePath) => {
          const change: DocumentationChange = {
            type: 'update',
            path: filePath,
            timestamp: new Date(),
            source: 'project'
          };

          handleDocumentationChanged(change);

          // Auto-sync if enabled
          if (autoSync) {
            try {
              await syncService.performSync();
            } catch (error) {
              handleSyncError(error instanceof Error ? error : new Error('Sync failed'));
            }
          }
        });

        watcher.on('add', async (filePath) => {
          const change: DocumentationChange = {
            type: 'create',
            path: filePath,
            timestamp: new Date(),
            source: 'project'
          };

          handleDocumentationChanged(change);

          if (autoSync) {
            try {
              await syncService.performSync();
            } catch (error) {
              handleSyncError(error instanceof Error ? error : new Error('Sync failed'));
            }
          }
        });

        watcher.on('unlink', async (filePath) => {
          const change: DocumentationChange = {
            type: 'delete',
            path: filePath,
            timestamp: new Date(),
            source: 'project'
          };

          handleDocumentationChanged(change);

          if (autoSync) {
            try {
              await syncService.performSync();
            } catch (error) {
              handleSyncError(error instanceof Error ? error : new Error('Sync failed'));
            }
          }
        });

        watcher.on('error', (error) => {
          handleSyncError(error instanceof Error ? error : new Error('File watcher error'));
        });

        setFileWatcher(watcher);
      }

      // Start the sync service
      if (autoSync) {
        await syncService.startSync();
      }

      // Initial status update
      await updateSyncStatus();

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start watching';
      setState(prev => ({
        ...prev,
        isWatching: false,
        errors: [...prev.errors, errorMessage]
      }));
    }
  }, [state.isWatching, watchLocalFiles, autoSync, updateSyncStatus]);

  const stopWatching = useCallback(() => {
    if (!state.isWatching) return;

    try {
      // Stop file watcher
      if (fileWatcher) {
        fileWatcher.close();
        setFileWatcher(null);
      }

      // Stop sync service
      const syncService = getObsidianSyncService();
      syncService.stopSync();

      // Remove all listeners
      syncService.removeAllListeners();

      setState(prev => ({
        ...prev,
        isWatching: false,
        syncStatus: { ...prev.syncStatus, status: 'disconnected' }
      }));

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to stop watching';
      setState(prev => ({
        ...prev,
        errors: [...prev.errors, errorMessage]
      }));
    }
  }, [state.isWatching, fileWatcher]);

  const forceSync = useCallback(async () => {
    try {
      const syncService = getObsidianSyncService();
      await syncService.performSync();
      await updateSyncStatus();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Force sync failed';
      setState(prev => ({
        ...prev,
        errors: [...prev.errors, errorMessage]
      }));
    }
  }, [updateSyncStatus]);

  const clearErrors = useCallback(() => {
    setState(prev => ({ ...prev, errors: [] }));
  }, []);

  const clearChanges = useCallback(() => {
    setState(prev => ({ ...prev, lastChanges: [] }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (fileWatcher) {
        fileWatcher.close();
      }
    };
  }, [fileWatcher]);

  // Periodic status updates
  useEffect(() => {
    if (!state.isWatching) return;

    const interval = setInterval(updateSyncStatus, watchInterval);
    return () => clearInterval(interval);
  }, [state.isWatching, watchInterval, updateSyncStatus]);

  return {
    ...state,
    startWatching,
    stopWatching,
    forceSync,
    clearErrors,
    clearChanges,
    updateSyncStatus
  };
}

export default useObsidianWatcher;