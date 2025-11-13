import { supabase } from '../../utils/supabaseClient';

export interface TableInfo {
  name: string;
  exists: boolean;
  columns?: ColumnInfo[];
  rowCount?: number;
  hasRLS?: boolean;
  policies?: string[];
}

export interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  default?: string;
}

export interface DatabaseHealth {
  connected: boolean;
  tablesChecked: number;
  tablesExist: number;
  tablesMissing: number;
  tables: TableInfo[];
  migrationStatus: 'complete' | 'partial' | 'none' | 'unknown';
  recommendations: string[];
  lastChecked: Date;
}

// Expected tables from our migrations
const EXPECTED_TABLES = [
  'hashtag_categories',
  'hashtags',
  'ready_sets',
  'personas',
  'persona_content',
  'user_game_state',
  'credit_transactions',
  'sentry_navigation_items',
  'automated_tag_clusters',
  'media_assets',
  'tag_duels',
  'user_ratings',
  'social_post_queue',
  'obsidian_sync_status',
  'obsidian_notes'
];

export class DatabaseHealthChecker {
  private static instance: DatabaseHealthChecker;
  private lastHealthCheck: DatabaseHealth | null = null;
  private checkInProgress = false;

  static getInstance(): DatabaseHealthChecker {
    if (!this.instance) {
      this.instance = new DatabaseHealthChecker();
    }
    return this.instance;
  }

  async checkDatabaseHealth(): Promise<DatabaseHealth> {
    if (this.checkInProgress) {
      return this.lastHealthCheck || this.getDefaultHealth();
    }

    this.checkInProgress = true;

    try {
      const health: DatabaseHealth = {
        connected: false,
        tablesChecked: 0,
        tablesExist: 0,
        tablesMissing: 0,
        tables: [],
        migrationStatus: 'unknown',
        recommendations: [],
        lastChecked: new Date()
      };

      // Test basic connectivity
      const { data: session, error: authError } = await supabase.auth.getSession();
      if (authError) {
        health.recommendations.push('Failed to connect to Supabase authentication');
        return health;
      }

      health.connected = true;

      // Check table existence
      const tableResults = await this.checkTables();
      health.tables = tableResults;
      health.tablesChecked = tableResults.length;
      health.tablesExist = tableResults.filter(t => t.exists).length;
      health.tablesMissing = tableResults.filter(t => !t.exists).length;

      // Determine migration status
      health.migrationStatus = this.determineMigrationStatus(health);

      // Generate recommendations
      health.recommendations = this.generateRecommendations(health);

      this.lastHealthCheck = health;
      return health;

    } catch (error) {
      console.error('Database health check failed:', error);
      return {
        connected: false,
        tablesChecked: 0,
        tablesExist: 0,
        tablesMissing: EXPECTED_TABLES.length,
        tables: EXPECTED_TABLES.map(name => ({ name, exists: false })),
        migrationStatus: 'unknown',
        recommendations: [
          'Database health check failed',
          error instanceof Error ? error.message : 'Unknown error'
        ],
        lastChecked: new Date()
      };
    } finally {
      this.checkInProgress = false;
    }
  }

  private async checkTables(): Promise<TableInfo[]> {
    const results: TableInfo[] = [];

    for (const tableName of EXPECTED_TABLES) {
      try {
        const tableInfo = await this.checkTable(tableName);
        results.push(tableInfo);
      } catch (error) {
        console.warn(`Failed to check table ${tableName}:`, error);
        results.push({
          name: tableName,
          exists: false
        });
      }
    }

    return results;
  }

  private async checkTable(tableName: string): Promise<TableInfo> {
    const tableInfo: TableInfo = {
      name: tableName,
      exists: false
    };

    try {
      // Try to query the table with LIMIT 0 to check existence
      const { data, error, count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact' })
        .limit(0);

      if (error) {
        // Check if it's a "relation does not exist" error
        if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
          tableInfo.exists = false;
        } else if (error.message?.includes('permission denied')) {
          // Table exists but no permission (still counts as exists)
          tableInfo.exists = true;
          tableInfo.rowCount = 0;
        } else {
          // Table exists but other error
          tableInfo.exists = true;
        }
      } else {
        tableInfo.exists = true;
        tableInfo.rowCount = count || 0;
      }

      // Try to get column information if table exists
      if (tableInfo.exists) {
        try {
          const columns = await this.getTableColumns(tableName);
          tableInfo.columns = columns;
        } catch (columnError) {
          console.warn(`Failed to get columns for ${tableName}:`, columnError);
        }
      }

    } catch (error) {
      console.warn(`Error checking table ${tableName}:`, error);
      tableInfo.exists = false;
    }

    return tableInfo;
  }

  private async getTableColumns(tableName: string): Promise<ColumnInfo[]> {
    try {
      // Use information_schema to get column details
      const { data, error } = await supabase.rpc('get_table_columns', {
        table_name: tableName
      });

      if (error || !data) {
        // Fallback: try a simple select to at least confirm table structure
        const { data: sampleData, error: selectError } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);

        if (!selectError && sampleData && sampleData.length > 0) {
          // Infer columns from sample data
          const columns: ColumnInfo[] = [];
          for (const key in sampleData[0]) {
            columns.push({
              name: key,
              type: typeof sampleData[0][key],
              nullable: true // Can't determine from sample
            });
          }
          return columns;
        }
        return [];
      }

      return data.map((col: any) => ({
        name: col.column_name,
        type: col.data_type,
        nullable: col.is_nullable === 'YES',
        default: col.column_default
      }));

    } catch (error) {
      console.warn(`Failed to get columns for ${tableName}:`, error);
      return [];
    }
  }

  private determineMigrationStatus(health: DatabaseHealth): 'complete' | 'partial' | 'none' | 'unknown' {
    const { tablesExist, tablesChecked } = health;

    if (tablesExist === 0) return 'none';
    if (tablesExist === tablesChecked) return 'complete';
    if (tablesExist > 0) return 'partial';
    return 'unknown';
  }

  private generateRecommendations(health: DatabaseHealth): string[] {
    const recommendations: string[] = [];

    if (!health.connected) {
      recommendations.push('Check Supabase URL and anon key configuration');
      return recommendations;
    }

    if (health.migrationStatus === 'none') {
      recommendations.push('No tables found - run initial database setup');
      recommendations.push('Execute migration files in /supabase/migrations/');
    }

    if (health.migrationStatus === 'partial') {
      recommendations.push(`${health.tablesMissing} tables missing from database`);
      const missingTables = health.tables
        .filter(t => !t.exists)
        .map(t => t.name);

      if (missingTables.includes('user_game_state')) {
        recommendations.push('Credits system not setup - run 20241112_credits_system.sql');
      }

      if (missingTables.includes('hashtags')) {
        recommendations.push('Core hashtag tables missing - run 001_create_hashtag_tables.sql');
      }
    }

    if (health.migrationStatus === 'complete') {
      // Check for tables with 0 rows that should have data
      const emptyImportantTables = health.tables
        .filter(t => t.exists && t.rowCount === 0 &&
                ['hashtags', 'hashtag_categories', 'ready_sets'].includes(t.name));

      if (emptyImportantTables.length > 0) {
        recommendations.push('Core tables are empty - consider running seed data migrations');
      }
    }

    if (recommendations.length === 0) {
      recommendations.push('Database appears healthy ✅');
    }

    return recommendations;
  }

  private getDefaultHealth(): DatabaseHealth {
    return {
      connected: false,
      tablesChecked: 0,
      tablesExist: 0,
      tablesMissing: EXPECTED_TABLES.length,
      tables: [],
      migrationStatus: 'unknown',
      recommendations: ['Database health check not performed'],
      lastChecked: new Date()
    };
  }

  // Quick check method for components
  async quickHealthCheck(): Promise<{ connected: boolean; tablesOk: boolean; issues: number }> {
    try {
      if (this.lastHealthCheck &&
          Date.now() - this.lastHealthCheck.lastChecked.getTime() < 30000) {
        // Use cached result if less than 30 seconds old
        const health = this.lastHealthCheck;
        return {
          connected: health.connected,
          tablesOk: health.migrationStatus === 'complete',
          issues: health.tablesMissing + health.recommendations.length
        };
      }

      // Quick connectivity test
      const { error } = await supabase.auth.getSession();
      return {
        connected: !error,
        tablesOk: false, // Unknown without full check
        issues: error ? 1 : 0
      };

    } catch (error) {
      return {
        connected: false,
        tablesOk: false,
        issues: 1
      };
    }
  }

  // Get cached health or trigger new check
  getLastHealth(): DatabaseHealth | null {
    return this.lastHealthCheck;
  }

  // Clear cache and force recheck
  async forceRefresh(): Promise<DatabaseHealth> {
    this.lastHealthCheck = null;
    return this.checkDatabaseHealth();
  }
}

// Export singleton instance
export const databaseHealthChecker = DatabaseHealthChecker.getInstance();

// Utility functions for components
export async function checkSupabaseDatabaseHealth(): Promise<DatabaseHealth> {
  return databaseHealthChecker.checkDatabaseHealth();
}

export async function getQuickDatabaseStatus(): Promise<{ connected: boolean; tablesOk: boolean; issues: number }> {
  return databaseHealthChecker.quickHealthCheck();
}