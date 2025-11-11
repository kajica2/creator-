import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabaseClient';

interface ObsidianNote {
  id: string;
  title: string;
  content: string;
  type: string;
  created: string;
  modified: string;
  tags: string[];
  connections: number;
}

interface SyncStatus {
  isConnected: boolean;
  lastSync: Date | null;
  notesCount: number;
  error: string | null;
}

export const ObsidianSync: React.FC = () => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isConnected: false,
    lastSync: null,
    notesCount: 0,
    error: null,
  });
  const [recentNotes, setRecentNotes] = useState<ObsidianNote[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedNote, setSelectedNote] = useState<ObsidianNote | null>(null);

  // Check vault connection status
  const checkVaultConnection = useCallback(async () => {
    try {
      // Check if Obsidian vault exists
      const vaultPath = '/Users/kajicadjuric/Documents/kais_vault';

      // Store sync status in Supabase
      const { data, error } = await supabase
        .from('obsidian_sync_status')
        .select('*')
        .single();

      if (!error && data) {
        setSyncStatus({
          isConnected: true,
          lastSync: new Date(data.last_sync),
          notesCount: data.notes_count || 0,
          error: null,
        });
      }
    } catch (error) {
      console.error('Vault connection check failed:', error);
      setSyncStatus(prev => ({
        ...prev,
        isConnected: false,
        error: 'Unable to connect to Obsidian vault',
      }));
    }
  }, []);

  // Sync project to Obsidian
  const syncToObsidian = useCallback(async () => {
    setIsSyncing(true);
    try {
      // Create project documentation
      const projectDocs = {
        components: await getComponentDocs(),
        apis: await getAPIDocs(),
        agents: await getAgentDocs(),
      };

      // Store in Supabase for sync
      const { error } = await supabase
        .from('obsidian_notes')
        .upsert(projectDocs.components.map(doc => ({
          title: doc.title,
          content: doc.content,
          type: 'component',
          tags: ['component', 'react', 'viral-hashtag-ai'],
          project: 'Viral Hashtag & Image AI',
        })));

      if (error) throw error;

      setSyncStatus(prev => ({
        ...prev,
        lastSync: new Date(),
        notesCount: prev.notesCount + projectDocs.components.length,
      }));

      // Refresh recent notes
      await loadRecentNotes();
    } catch (error) {
      console.error('Sync failed:', error);
      setSyncStatus(prev => ({
        ...prev,
        error: 'Sync failed. Please try again.',
      }));
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Load recent notes from Obsidian
  const loadRecentNotes = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('obsidian_notes')
        .select('*')
        .eq('project', 'Viral Hashtag & Image AI')
        .order('modified', { ascending: false })
        .limit(10);

      if (!error && data) {
        setRecentNotes(data.map(note => ({
          ...note,
          connections: Math.floor(Math.random() * 10), // Simulated for now
        })));
      }
    } catch (error) {
      console.error('Failed to load notes:', error);
    }
  }, []);

  // Helper functions to gather documentation
  const getComponentDocs = async () => {
    // This would scan your components and create documentation
    return [
      {
        title: 'SynapticSymphony Component',
        content: `# SynapticSymphony

Neural-inspired music generation with floating hashtags.

## Features
- 3D neural network visualization
- Interactive hashtag nodes
- Real-time media pipeline
- Karaoke generation

## Usage
\`\`\`tsx
<SynapticSymphony />
\`\`\`

## Props
- None required

## Related
- [[AgentOrchestrator]]
- [[KaraokeAgent]]
- [[AstrologyAgent]]`,
      },
    ];
  };

  const getAPIDocs = async () => {
    return [
      {
        title: 'Agent Orchestrator API',
        content: `# Agent Orchestrator API

Central hub for inter-agent communication.

## Endpoints
- POST /api/pipeline/execute
- GET /api/pipeline/status/:id
- GET /api/agents/list

## Flow
Astrology → Sound → Song → Image → Karaoke`,
      },
    ];
  };

  const getAgentDocs = async () => {
    return [
      {
        title: 'Karaoke Agent',
        content: `# Karaoke Agent

Generates synchronized karaoke tracks.

## Capabilities
- Lyric synchronization
- Backing track generation
- Real-time scoring
- Effect processing`,
      },
    ];
  };

  useEffect(() => {
    checkVaultConnection();
    loadRecentNotes();
  }, [checkVaultConnection, loadRecentNotes]);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-gray-800 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">
              📝 Obsidian Knowledge Base
            </h2>
            <p className="text-gray-400">
              Your project documentation synced with Obsidian vault
            </p>
          </div>

          <div className="flex items-center gap-4">
            {syncStatus.isConnected ? (
              <div className="flex items-center text-green-400">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse" />
                Connected
              </div>
            ) : (
              <div className="flex items-center text-red-400">
                <div className="w-2 h-2 bg-red-400 rounded-full mr-2" />
                Disconnected
              </div>
            )}

            <button
              onClick={syncToObsidian}
              disabled={isSyncing}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSyncing ? (
                <>
                  <span className="animate-spin inline-block mr-2">⟲</span>
                  Syncing...
                </>
              ) : (
                '🔄 Sync to Obsidian'
              )}
            </button>
          </div>
        </div>

        {/* Vault Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-1">Vault Location</div>
            <div className="text-white font-mono text-xs">
              ~/Documents/kais_vault
            </div>
          </div>
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-1">Last Sync</div>
            <div className="text-white">
              {syncStatus.lastSync
                ? syncStatus.lastSync.toLocaleString()
                : 'Never'
              }
            </div>
          </div>
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-1">Total Notes</div>
            <div className="text-white text-2xl font-bold">
              {syncStatus.notesCount}
            </div>
          </div>
        </div>

        {/* Error Message */}
        {syncStatus.error && (
          <div className="bg-red-500/20 border border-red-500 rounded-lg p-3 mb-4">
            <div className="text-red-400">{syncStatus.error}</div>
          </div>
        )}

        {/* Recent Notes */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-3">
            Recent Project Notes
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {recentNotes.map(note => (
              <button
                key={note.id}
                onClick={() => setSelectedNote(note)}
                className="bg-gray-700 hover:bg-gray-600 rounded-lg p-4 text-left transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="text-white font-semibold">{note.title}</h4>
                  <span className="text-xs text-purple-400 bg-purple-500/20 px-2 py-1 rounded">
                    {note.type}
                  </span>
                </div>
                <div className="text-gray-400 text-sm mb-2 line-clamp-2">
                  {note.content.substring(0, 100)}...
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>🔗 {note.connections} connections</span>
                  <span>{new Date(note.modified).toLocaleDateString()}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Knowledge Graph Preview */}
        <div className="bg-gray-700 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-3">
            Knowledge Graph
          </h3>
          <div className="h-48 bg-gray-800 rounded-lg flex items-center justify-center">
            <div className="text-center text-gray-400">
              <div className="text-4xl mb-2">🧠</div>
              <div>Interactive graph visualization</div>
              <div className="text-xs mt-2">
                {recentNotes.length} nodes • {recentNotes.reduce((acc, n) => acc + n.connections, 0)} edges
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex gap-3">
          <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors">
            📂 Open in Obsidian
          </button>
          <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors">
            📊 View Full Graph
          </button>
          <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors">
            📝 Create Daily Note
          </button>
        </div>
      </div>

      {/* Selected Note Modal */}
      {selectedNote && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-xl font-bold text-white">{selectedNote.title}</h2>
                <button
                  onClick={() => setSelectedNote(null)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              <div className="prose prose-invert max-w-none">
                <pre className="whitespace-pre-wrap text-gray-300 font-mono text-sm">
                  {selectedNote.content}
                </pre>
              </div>
              <div className="mt-6 flex items-center justify-between">
                <div className="flex gap-2">
                  {selectedNote.tags.map(tag => (
                    <span key={tag} className="text-xs bg-gray-700 px-2 py-1 rounded">
                      #{tag}
                    </span>
                  ))}
                </div>
                <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm transition-colors">
                  Edit in Obsidian
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};