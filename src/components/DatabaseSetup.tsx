import React, { useState, useEffect } from 'react';
import {
  DatabaseHealth,
  TableInfo,
  checkSupabaseDatabaseHealth,
  databaseHealthChecker
} from '../utils/databaseHealthChecker';

interface DatabaseSetupProps {
  onHealthUpdate?: (health: DatabaseHealth) => void;
}

export const DatabaseSetup: React.FC<DatabaseSetupProps> = ({ onHealthUpdate }) => {
  const [health, setHealth] = useState<DatabaseHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    loadDatabaseHealth();
  }, []);

  const loadDatabaseHealth = async () => {
    try {
      setLoading(true);
      const healthResult = await checkSupabaseDatabaseHealth();
      setHealth(healthResult);
      onHealthUpdate?.(healthResult);
    } catch (error) {
      console.error('Failed to check database health:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      const healthResult = await databaseHealthChecker.forceRefresh();
      setHealth(healthResult);
      onHealthUpdate?.(healthResult);
    } catch (error) {
      console.error('Failed to refresh database health:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete': return '✅';
      case 'partial': return '⚠️';
      case 'none': return '❌';
      default: return '❓';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete': return 'text-green-400';
      case 'partial': return 'text-yellow-400';
      case 'none': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const generateSetupSQL = () => {
    if (!health) return '';

    const missingTables = health.tables.filter(t => !t.exists);
    if (missingTables.length === 0) return '';

    let sql = '-- Missing Tables Setup SQL\\n\\n';

    if (missingTables.some(t => t.name.includes('hashtag'))) {
      sql += '-- Run: 001_create_hashtag_tables.sql\\n';
    }

    if (missingTables.some(t => t.name === 'user_game_state')) {
      sql += '-- Run: 20241112_credits_system.sql\\n';
    }

    if (missingTables.some(t => t.name === 'personas')) {
      sql += '-- Run: 004_create_persona_tables.sql\\n';
    }

    sql += '\\n-- Or run all migrations in order:\\n';
    sql += 'psql -h <host> -d <database> -f supabase/migrations/001_create_hashtag_tables.sql\\n';
    sql += 'psql -h <host> -d <database> -f supabase/migrations/20241112_credits_system.sql\\n';

    return sql;
  };

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="h-3 bg-gray-700 rounded w-full mb-2"></div>
          <div className="h-3 bg-gray-700 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (!health) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="text-center">
          <div className="text-red-400 text-2xl mb-2">❌</div>
          <h3 className="text-lg font-semibold text-white mb-2">Database Check Failed</h3>
          <p className="text-gray-400 mb-4">Unable to check database health</p>
          <button
            onClick={loadDatabaseHealth}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{getStatusIcon(health.migrationStatus)}</span>
          <div>
            <h2 className="text-xl font-bold text-white">Database Health</h2>
            <p className="text-sm text-gray-400">
              Last checked: {health.lastChecked.toLocaleTimeString()}
            </p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-4 py-2 rounded transition-colors"
        >
          {refreshing ? '🔄 Checking...' : '🔄 Refresh'}
        </button>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-700 rounded-lg p-4">
          <div className="text-center">
            <div className={`text-2xl font-bold ${health.connected ? 'text-green-400' : 'text-red-400'}`}>
              {health.connected ? '✅' : '❌'}
            </div>
            <p className="text-sm text-gray-400">Connection</p>
            <p className="text-white font-semibold">{health.connected ? 'Connected' : 'Failed'}</p>
          </div>
        </div>

        <div className="bg-gray-700 rounded-lg p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">{health.tablesExist}</div>
            <p className="text-sm text-gray-400">Tables Found</p>
            <p className="text-white font-semibold">of {health.tablesChecked} expected</p>
          </div>
        </div>

        <div className="bg-gray-700 rounded-lg p-4">
          <div className="text-center">
            <div className={`text-2xl font-bold ${health.tablesMissing > 0 ? 'text-yellow-400' : 'text-green-400'}`}>
              {health.tablesMissing}
            </div>
            <p className="text-sm text-gray-400">Missing Tables</p>
            <p className="text-white font-semibold">{health.tablesMissing > 0 ? 'Need Setup' : 'Complete'}</p>
          </div>
        </div>

        <div className="bg-gray-700 rounded-lg p-4">
          <div className="text-center">
            <div className={`text-2xl font-bold ${getStatusColor(health.migrationStatus)}`}>
              {getStatusIcon(health.migrationStatus)}
            </div>
            <p className="text-sm text-gray-400">Migration Status</p>
            <p className="text-white font-semibold capitalize">{health.migrationStatus}</p>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {health.recommendations.length > 0 && (
        <div className="bg-gray-700 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
            💡 Recommendations
          </h3>
          <div className="space-y-2">
            {health.recommendations.map((rec, index) => (
              <div
                key={index}
                className={`p-3 rounded border-l-4 ${
                  rec.includes('✅')
                    ? 'bg-green-900/50 border-green-500 text-green-200'
                    : rec.includes('❌') || rec.includes('Failed')
                    ? 'bg-red-900/50 border-red-500 text-red-200'
                    : 'bg-yellow-900/50 border-yellow-500 text-yellow-200'
                }`}
              >
                {rec}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Table Details */}
      <div className="space-y-4">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center space-x-2 text-purple-400 hover:text-purple-300 transition-colors"
        >
          <span>{showDetails ? '▼' : '▶'}</span>
          <span>Table Details ({health.tables.length})</span>
        </button>

        {showDetails && (
          <div className="bg-gray-700 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-600">
                    <th className="text-left p-3 text-white">Table Name</th>
                    <th className="text-left p-3 text-white">Status</th>
                    <th className="text-left p-3 text-white">Rows</th>
                    <th className="text-left p-3 text-white">Columns</th>
                  </tr>
                </thead>
                <tbody>
                  {health.tables.map((table, index) => (
                    <tr
                      key={table.name}
                      className={`border-b border-gray-600 ${
                        index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-700'
                      }`}
                    >
                      <td className="p-3">
                        <code className="bg-gray-900 px-2 py-1 rounded text-sm text-purple-300">
                          {table.name}
                        </code>
                      </td>
                      <td className="p-3">
                        <span className={`inline-flex items-center space-x-1 ${
                          table.exists ? 'text-green-400' : 'text-red-400'
                        }`}>
                          <span>{table.exists ? '✅' : '❌'}</span>
                          <span>{table.exists ? 'Exists' : 'Missing'}</span>
                        </span>
                      </td>
                      <td className="p-3 text-gray-300">
                        {table.rowCount !== undefined ? table.rowCount.toLocaleString() : '—'}
                      </td>
                      <td className="p-3 text-gray-300">
                        {table.columns?.length || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Setup SQL */}
      {health.tablesMissing > 0 && (
        <div className="bg-gray-700 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
            🛠️ Setup Instructions
          </h3>
          <div className="bg-gray-900 rounded-lg p-4">
            <pre className="text-green-400 text-sm overflow-x-auto whitespace-pre-wrap">
              {generateSetupSQL()}
            </pre>
          </div>
          <div className="mt-4 flex space-x-2">
            <button
              onClick={() => navigator.clipboard?.writeText(generateSetupSQL())}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm transition-colors"
            >
              📋 Copy SQL
            </button>
            <a
              href="https://app.supabase.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm transition-colors"
            >
              🔗 Open Supabase Dashboard
            </a>
          </div>
        </div>
      )}
    </div>
  );
};