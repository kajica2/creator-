import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { DatabaseSetup } from './DatabaseSetup';
import {
  Database,
  Table,
  Users,
  Settings,
  BarChart3,
  RefreshCw,
  ExternalLink,
  Eye,
  Edit,
  Trash2,
  Plus,
  Search,
  Download,
  Upload
} from 'lucide-react';

interface SupabasePanelProps {
  className?: string;
}

interface TableInfo {
  schema: string;
  name: string;
  type: string;
  estimated_count?: number;
}

interface DatabaseStats {
  totalTables: number;
  totalRows: number;
  databaseSize: string;
  activeConnections: number;
  lastBackup?: string;
}

export const SupabasePanel: React.FC<SupabasePanelProps> = ({ className = '' }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'tables' | 'users' | 'sql' | 'health'>('overview');
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sqlQuery, setSqlQuery] = useState('SELECT * FROM ');
  const [sqlResult, setSqlResult] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadDatabaseInfo();
  }, []);

  const loadDatabaseInfo = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get database tables from information_schema
      const { data: tablesData, error: tablesError } = await supabase
        .from('information_schema.tables')
        .select('table_schema, table_name, table_type')
        .eq('table_schema', 'public');

      if (tablesError) {
        console.warn('Could not fetch from information_schema, trying alternative method');
        // Fallback: try to get tables from known schema
        const knownTables = [
          'hashtag_categories', 'hashtags', 'ready_sets', 'personas', 'persona_content',
          'user_game_state', 'credit_transactions', 'sentry_navigation_items',
          'automated_tag_clusters', 'media_assets', 'tag_duels', 'user_ratings',
          'social_post_queue', 'obsidian_sync_status', 'obsidian_notes'
        ];

        const tableInfoPromises = knownTables.map(async (tableName) => {
          try {
            const { count, error } = await supabase
              .from(tableName)
              .select('*', { count: 'exact', head: true });

            return {
              schema: 'public',
              name: tableName,
              type: 'BASE TABLE',
              estimated_count: count || 0
            };
          } catch {
            return {
              schema: 'public',
              name: tableName,
              type: 'BASE TABLE',
              estimated_count: 0
            };
          }
        });

        const fallbackTables = await Promise.all(tableInfoPromises);
        setTables(fallbackTables);
      } else {
        setTables(tablesData?.map(t => ({
          schema: t.table_schema,
          name: t.table_name,
          type: t.table_type,
          estimated_count: undefined
        })) || []);
      }

      // Calculate basic stats
      setStats({
        totalTables: tables.length,
        totalRows: 0, // Would need to sum all table counts
        databaseSize: 'N/A',
        activeConnections: 1,
        lastBackup: new Date().toISOString()
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load database info');
    } finally {
      setLoading(false);
    }
  };

  const executeSQLQuery = async () => {
    if (!sqlQuery.trim()) return;

    setLoading(true);
    try {
      // For safety, only allow SELECT queries
      if (!sqlQuery.trim().toUpperCase().startsWith('SELECT')) {
        throw new Error('Only SELECT queries are allowed for security');
      }

      const { data, error } = await supabase.rpc('execute_sql', {
        query: sqlQuery
      });

      if (error) throw error;
      setSqlResult(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'SQL execution failed');
      setSqlResult([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredTables = tables.filter(table =>
    table.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'tables' as const, label: 'Tables', icon: <Table className="w-4 h-4" /> },
    { id: 'users' as const, label: 'Users', icon: <Users className="w-4 h-4" /> },
    { id: 'sql' as const, label: 'SQL Editor', icon: <Database className="w-4 h-4" /> },
    { id: 'health' as const, label: 'Health Check', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <div className={`bg-gray-800 rounded-lg border border-gray-700 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <Database className="w-6 h-6 text-green-400" />
          <div>
            <h2 className="text-xl font-bold text-white">Supabase Admin Panel</h2>
            <p className="text-sm text-gray-400">Database management and monitoring</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={loadDatabaseInfo}
            disabled={loading}
            className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <a
            href="https://app.supabase.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Open Supabase</span>
          </a>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-900/50 border border-red-500 rounded-lg text-red-200 text-sm">
          {error}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex space-x-1 p-6 pb-0">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === tab.id
                ? 'bg-purple-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Tables</p>
                    <p className="text-2xl font-bold text-white">{stats?.totalTables || tables.length}</p>
                  </div>
                  <Table className="w-8 h-8 text-blue-400" />
                </div>
              </div>
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Active Connections</p>
                    <p className="text-2xl font-bold text-white">{stats?.activeConnections || 1}</p>
                  </div>
                  <Users className="w-8 h-8 text-green-400" />
                </div>
              </div>
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Database Size</p>
                    <p className="text-2xl font-bold text-white">{stats?.databaseSize || 'N/A'}</p>
                  </div>
                  <Database className="w-8 h-8 text-purple-400" />
                </div>
              </div>
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Last Backup</p>
                    <p className="text-sm font-medium text-white">
                      {stats?.lastBackup ? new Date(stats.lastBackup).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <Download className="w-8 h-8 text-yellow-400" />
                </div>
              </div>
            </div>

            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setActiveTab('tables')}
                  className="flex items-center space-x-3 p-4 bg-gray-600 hover:bg-gray-500 rounded-lg transition-colors"
                >
                  <Table className="w-5 h-5 text-blue-400" />
                  <span className="text-white">Browse Tables</span>
                </button>
                <button
                  onClick={() => setActiveTab('sql')}
                  className="flex items-center space-x-3 p-4 bg-gray-600 hover:bg-gray-500 rounded-lg transition-colors"
                >
                  <Database className="w-5 h-5 text-green-400" />
                  <span className="text-white">SQL Editor</span>
                </button>
                <button
                  onClick={() => setActiveTab('health')}
                  className="flex items-center space-x-3 p-4 bg-gray-600 hover:bg-gray-500 rounded-lg transition-colors"
                >
                  <Settings className="w-5 h-5 text-purple-400" />
                  <span className="text-white">Health Check</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tables Tab */}
        {activeTab === 'tables' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Database Tables</h3>
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search tables..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full bg-gray-700 rounded-lg overflow-hidden">
                <thead className="bg-gray-600">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-200">Table Name</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-200">Schema</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-200">Type</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-200">Est. Rows</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-200">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-600">
                  {filteredTables.map((table, index) => (
                    <tr key={`${table.schema}.${table.name}`} className="hover:bg-gray-600">
                      <td className="px-4 py-3">
                        <code className="text-purple-300 bg-gray-800 px-2 py-1 rounded text-sm">
                          {table.name}
                        </code>
                      </td>
                      <td className="px-4 py-3 text-gray-300">{table.schema}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {table.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-300">
                        {table.estimated_count !== undefined ? table.estimated_count.toLocaleString() : 'N/A'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setSqlQuery(`SELECT * FROM ${table.name} LIMIT 10;`);
                              setActiveTab('sql');
                            }}
                            className="p-1 text-gray-400 hover:text-white"
                            title="View data"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            className="p-1 text-gray-400 hover:text-white"
                            title="Edit structure"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SQL Editor Tab */}
        {activeTab === 'sql' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">SQL Editor</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  SQL Query (SELECT only for security)
                </label>
                <textarea
                  value={sqlQuery}
                  onChange={(e) => setSqlQuery(e.target.value)}
                  className="w-full h-32 p-4 bg-gray-900 border border-gray-600 rounded-lg text-white font-mono text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="SELECT * FROM your_table LIMIT 10;"
                />
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={executeSQLQuery}
                  disabled={loading || !sqlQuery.trim()}
                  className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <Database className="w-4 h-4" />
                  <span>Execute Query</span>
                </button>
                <button
                  onClick={() => setSqlQuery('')}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* SQL Results */}
            {sqlResult.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-md font-semibold text-white">Query Results ({sqlResult.length} rows)</h4>
                <div className="overflow-x-auto max-h-96">
                  <table className="w-full bg-gray-700 rounded-lg overflow-hidden text-sm">
                    <thead className="bg-gray-600">
                      <tr>
                        {Object.keys(sqlResult[0] || {}).map(key => (
                          <th key={key} className="px-3 py-2 text-left text-xs font-semibold text-gray-200">
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-600">
                      {sqlResult.map((row, index) => (
                        <tr key={index} className="hover:bg-gray-600">
                          {Object.values(row).map((value, cellIndex) => (
                            <td key={cellIndex} className="px-3 py-2 text-gray-300">
                              {value === null ? (
                                <span className="text-gray-500 italic">NULL</span>
                              ) : (
                                String(value).length > 50 ?
                                  String(value).substring(0, 50) + '...' :
                                  String(value)
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Health Check Tab */}
        {activeTab === 'health' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Database Health Check</h3>
            <DatabaseSetup />
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">User Management</h3>
            <div className="bg-gray-700 rounded-lg p-6 text-center">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-300">User management features coming soon...</p>
              <p className="text-sm text-gray-500 mt-2">
                For now, use the Supabase dashboard to manage users and authentication.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupabasePanel;