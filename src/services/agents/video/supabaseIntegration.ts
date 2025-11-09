/**
 * Video Agent Supabase Integration
 * Database operations and metadata management for video content
 */

import { supabase } from '../../../utils/supabaseClient';
import {
  VideoProject,
  VideoOutput,
  VideoAsset,
  VideoAnalytics,
  VideoPipeline,
  PlatformVideoFormat
} from './types';
import { memoryManager } from '../MemoryManager';

export class VideoSupabaseIntegration {
  private isInitialized: boolean = false;
  private memoryKey: string = 'video-supabase';

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('🗄️ Initializing Video Supabase Integration...');

      // Check database connection
      const { error } = await supabase.from('video_projects').select('count').limit(1);
      if (error && !error.message.includes('does not exist')) {
        throw error;
      }

      // Initialize database tables if they don't exist
      await this.initializeTables();

      // Initialize memory store
      await memoryManager.createStore(this.memoryKey, {
        tableSchemas: this.getTableSchemas(),
        performance: {
          totalQueries: 0,
          averageResponseTime: 0,
          errorRate: 0
        }
      });

      this.isInitialized = true;
      console.log('✅ Video Supabase Integration initialized successfully');

    } catch (error) {
      console.error('❌ Failed to initialize Video Supabase Integration:', error);
      throw error;
    }
  }

  private async initializeTables(): Promise<void> {
    console.log('📋 Initializing video database tables...');

    // Note: In a real implementation, these would be proper SQL migrations
    // This is a simplified version for demonstration

    const tables = [
      {
        name: 'video_projects',
        schema: `
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          name TEXT NOT NULL,
          description TEXT,
          status TEXT CHECK (status IN ('draft', 'in_progress', 'completed', 'error')),
          target_platforms TEXT[],
          metadata JSONB,
          timeline JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          user_id UUID REFERENCES auth.users(id)
        `
      },
      {
        name: 'video_outputs',
        schema: `
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          project_id UUID REFERENCES video_projects(id) ON DELETE CASCADE,
          platform TEXT NOT NULL,
          format JSONB,
          url TEXT NOT NULL,
          status TEXT CHECK (status IN ('processing', 'completed', 'error')),
          metadata JSONB,
          thumbnail JSONB,
          analytics JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          user_id UUID REFERENCES auth.users(id)
        `
      },
      {
        name: 'video_assets',
        schema: `
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          project_id UUID REFERENCES video_projects(id) ON DELETE CASCADE,
          type TEXT CHECK (type IN ('video', 'image', 'audio', 'font', 'graphic')),
          name TEXT NOT NULL,
          source TEXT NOT NULL,
          metadata JSONB,
          tags TEXT[],
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          user_id UUID REFERENCES auth.users(id)
        `
      },
      {
        name: 'video_analytics',
        schema: `
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          output_id UUID REFERENCES video_outputs(id) ON DELETE CASCADE,
          platform TEXT NOT NULL,
          viral_potential JSONB,
          engagement JSONB,
          technical JSONB,
          trends JSONB,
          performance_metrics JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          user_id UUID REFERENCES auth.users(id)
        `
      },
      {
        name: 'video_pipelines',
        schema: `
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          name TEXT NOT NULL,
          description TEXT,
          stages JSONB,
          status TEXT CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
          input JSONB,
          output JSONB,
          progress JSONB,
          performance JSONB,
          configuration JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          user_id UUID REFERENCES auth.users(id)
        `
      },
      {
        name: 'video_templates',
        schema: `
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          name TEXT NOT NULL,
          description TEXT,
          category TEXT,
          tags TEXT[],
          target_platforms TEXT[],
          structure JSONB,
          parameters JSONB,
          preview JSONB,
          popularity JSONB,
          is_public BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          user_id UUID REFERENCES auth.users(id)
        `
      }
    ];

    // Note: In production, use proper database migrations
    console.log('📝 Database tables schema defined (would be created via migrations)');
  }

  // Video Project Operations
  async saveVideoProject(project: VideoProject, userId: string): Promise<string> {
    try {
      console.log(`💾 Saving video project: ${project.name}`);

      const { data, error } = await supabase
        .from('video_projects')
        .upsert({
          id: project.id,
          name: project.name,
          description: project.description,
          status: project.status,
          target_platforms: project.targetPlatforms,
          metadata: project.metadata,
          timeline: project.timeline,
          updated_at: new Date().toISOString(),
          user_id: userId
        })
        .select()
        .single();

      if (error) throw error;

      // Save associated assets
      if (project.assets && project.assets.length > 0) {
        await this.saveVideoAssets(project.assets, project.id, userId);
      }

      // Save outputs
      if (project.outputs && project.outputs.length > 0) {
        await this.saveVideoOutputs(project.outputs, project.id, userId);
      }

      console.log(`✅ Video project saved with ID: ${data.id}`);
      return data.id;

    } catch (error) {
      console.error('❌ Error saving video project:', error);
      throw error;
    }
  }

  async getVideoProject(projectId: string, userId: string): Promise<VideoProject | null> {
    try {
      const { data, error } = await supabase
        .from('video_projects')
        .select(`
          *,
          video_outputs (*),
          video_assets (*)
        `)
        .eq('id', projectId)
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }

      return this.mapDatabaseToProject(data);

    } catch (error) {
      console.error('❌ Error retrieving video project:', error);
      throw error;
    }
  }

  async getUserVideoProjects(userId: string, limit: number = 50): Promise<VideoProject[]> {
    try {
      const { data, error } = await supabase
        .from('video_projects')
        .select(`
          *,
          video_outputs (count),
          video_assets (count)
        `)
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data.map(this.mapDatabaseToProject);

    } catch (error) {
      console.error('❌ Error retrieving user video projects:', error);
      throw error;
    }
  }

  // Video Output Operations
  async saveVideoOutputs(outputs: VideoOutput[], projectId: string, userId: string): Promise<void> {
    try {
      console.log(`💾 Saving ${outputs.length} video outputs for project ${projectId}`);

      const outputData = outputs.map(output => ({
        id: output.id,
        project_id: projectId,
        platform: output.platform,
        format: output.format,
        url: output.url,
        status: output.status,
        metadata: output.metadata,
        thumbnail: output.thumbnail,
        analytics: output.analytics,
        user_id: userId
      }));

      const { error } = await supabase
        .from('video_outputs')
        .upsert(outputData);

      if (error) throw error;

      console.log('✅ Video outputs saved successfully');

    } catch (error) {
      console.error('❌ Error saving video outputs:', error);
      throw error;
    }
  }

  async getVideoOutputsByPlatform(platform: string, userId: string, limit: number = 20): Promise<VideoOutput[]> {
    try {
      const { data, error } = await supabase
        .from('video_outputs')
        .select('*')
        .eq('platform', platform)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data.map(this.mapDatabaseToOutput);

    } catch (error) {
      console.error('❌ Error retrieving video outputs by platform:', error);
      throw error;
    }
  }

  // Video Asset Operations
  async saveVideoAssets(assets: VideoAsset[], projectId: string, userId: string): Promise<void> {
    try {
      const assetData = assets.map(asset => ({
        id: asset.id,
        project_id: projectId,
        type: asset.type,
        name: asset.name,
        source: asset.source,
        metadata: asset.metadata,
        tags: asset.tags,
        user_id: userId
      }));

      const { error } = await supabase
        .from('video_assets')
        .upsert(assetData);

      if (error) throw error;

    } catch (error) {
      console.error('❌ Error saving video assets:', error);
      throw error;
    }
  }

  // Analytics Operations
  async saveVideoAnalytics(analytics: VideoAnalytics, outputId: string, platform: string, userId: string): Promise<void> {
    try {
      console.log(`📊 Saving analytics for output ${outputId} on ${platform}`);

      const { error } = await supabase
        .from('video_analytics')
        .upsert({
          output_id: outputId,
          platform,
          viral_potential: analytics.viralPotential,
          engagement: analytics.engagement,
          technical: analytics.technical,
          trends: analytics.trends,
          performance_metrics: {
            recordedAt: new Date().toISOString(),
            version: '1.0'
          },
          user_id: userId
        });

      if (error) throw error;

      console.log('✅ Video analytics saved successfully');

    } catch (error) {
      console.error('❌ Error saving video analytics:', error);
      throw error;
    }
  }

  async getVideoAnalytics(outputId: string, userId: string): Promise<VideoAnalytics | null> {
    try {
      const { data, error } = await supabase
        .from('video_analytics')
        .select('*')
        .eq('output_id', outputId)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      return {
        viralPotential: data.viral_potential,
        engagement: data.engagement,
        technical: data.technical,
        trends: data.trends
      };

    } catch (error) {
      console.error('❌ Error retrieving video analytics:', error);
      throw error;
    }
  }

  // Pipeline Operations
  async savePipeline(pipeline: VideoPipeline, userId: string): Promise<void> {
    try {
      console.log(`💾 Saving pipeline: ${pipeline.name}`);

      const { error } = await supabase
        .from('video_pipelines')
        .upsert({
          id: pipeline.id,
          name: pipeline.name,
          description: pipeline.description,
          stages: pipeline.stages,
          status: pipeline.status,
          input: pipeline.input,
          output: pipeline.output,
          progress: pipeline.progress,
          performance: pipeline.performance,
          configuration: pipeline.configuration,
          user_id: userId
        });

      if (error) throw error;

      console.log('✅ Pipeline saved successfully');

    } catch (error) {
      console.error('❌ Error saving pipeline:', error);
      throw error;
    }
  }

  // Template Operations
  async saveVideoTemplate(template: any, userId: string, isPublic: boolean = false): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('video_templates')
        .insert({
          name: template.name,
          description: template.description,
          category: template.category,
          tags: template.tags,
          target_platforms: template.targetPlatforms,
          structure: template.structure,
          parameters: template.parameters,
          preview: template.preview,
          popularity: template.popularity,
          is_public: isPublic,
          user_id: userId
        })
        .select()
        .single();

      if (error) throw error;

      return data.id;

    } catch (error) {
      console.error('❌ Error saving video template:', error);
      throw error;
    }
  }

  async getVideoTemplates(userId: string, includePublic: boolean = true): Promise<any[]> {
    try {
      let query = supabase
        .from('video_templates')
        .select('*');

      if (includePublic) {
        query = query.or(`user_id.eq.${userId},is_public.eq.true`);
      } else {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];

    } catch (error) {
      console.error('❌ Error retrieving video templates:', error);
      throw error;
    }
  }

  // Performance and Analytics
  async getVideoPerformanceStats(userId: string, timeframe: 'day' | 'week' | 'month' = 'week'): Promise<any> {
    try {
      const dateOffset = {
        day: 1,
        week: 7,
        month: 30
      }[timeframe];

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - dateOffset);

      const { data, error } = await supabase
        .from('video_outputs')
        .select(`
          platform,
          status,
          analytics,
          created_at
        `)
        .eq('user_id', userId)
        .gte('created_at', startDate.toISOString());

      if (error) throw error;

      return this.analyzePerformanceData(data);

    } catch (error) {
      console.error('❌ Error retrieving performance stats:', error);
      throw error;
    }
  }

  private analyzePerformanceData(data: any[]): any {
    const stats = {
      totalVideos: data.length,
      byPlatform: {} as Record<string, number>,
      byStatus: {} as Record<string, number>,
      averageQuality: 0,
      viralPotential: 0
    };

    let totalQuality = 0;
    let totalViral = 0;
    let qualityCount = 0;
    let viralCount = 0;

    data.forEach(item => {
      // Count by platform
      stats.byPlatform[item.platform] = (stats.byPlatform[item.platform] || 0) + 1;

      // Count by status
      stats.byStatus[item.status] = (stats.byStatus[item.status] || 0) + 1;

      // Calculate averages
      if (item.analytics?.qualityScore) {
        totalQuality += item.analytics.qualityScore;
        qualityCount++;
      }

      if (item.analytics?.viralPotential?.score) {
        totalViral += item.analytics.viralPotential.score;
        viralCount++;
      }
    });

    stats.averageQuality = qualityCount > 0 ? totalQuality / qualityCount : 0;
    stats.viralPotential = viralCount > 0 ? totalViral / viralCount : 0;

    return stats;
  }

  // Utility Methods
  private mapDatabaseToProject(data: any): VideoProject {
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      status: data.status,
      targetPlatforms: data.target_platforms,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      metadata: data.metadata,
      timeline: data.timeline,
      assets: data.video_assets || [],
      outputs: data.video_outputs || []
    };
  }

  private mapDatabaseToOutput(data: any): VideoOutput {
    return {
      id: data.id,
      platform: data.platform,
      format: data.format,
      url: data.url,
      status: data.status,
      metadata: data.metadata,
      thumbnail: data.thumbnail,
      analytics: data.analytics
    };
  }

  private getTableSchemas(): any {
    return {
      video_projects: {
        columns: ['id', 'name', 'description', 'status', 'target_platforms', 'metadata', 'timeline', 'created_at', 'updated_at', 'user_id'],
        relationships: ['video_outputs', 'video_assets']
      },
      video_outputs: {
        columns: ['id', 'project_id', 'platform', 'format', 'url', 'status', 'metadata', 'thumbnail', 'analytics', 'created_at', 'user_id'],
        relationships: ['video_projects', 'video_analytics']
      },
      video_assets: {
        columns: ['id', 'project_id', 'type', 'name', 'source', 'metadata', 'tags', 'created_at', 'user_id'],
        relationships: ['video_projects']
      },
      video_analytics: {
        columns: ['id', 'output_id', 'platform', 'viral_potential', 'engagement', 'technical', 'trends', 'performance_metrics', 'created_at', 'user_id'],
        relationships: ['video_outputs']
      },
      video_pipelines: {
        columns: ['id', 'name', 'description', 'stages', 'status', 'input', 'output', 'progress', 'performance', 'configuration', 'created_at', 'user_id'],
        relationships: []
      },
      video_templates: {
        columns: ['id', 'name', 'description', 'category', 'tags', 'target_platforms', 'structure', 'parameters', 'preview', 'popularity', 'is_public', 'created_at', 'user_id'],
        relationships: []
      }
    };
  }

  // Public API
  async getStatus(): Promise<any> {
    const memoryData = await memoryManager.retrieve(this.memoryKey);

    return {
      isInitialized: this.isInitialized,
      tablesCount: Object.keys(this.getTableSchemas()).length,
      performance: memoryData?.performance || {},
      lastActivity: new Date().toISOString()
    };
  }

  async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up Video Supabase Integration...');
    this.isInitialized = false;
    console.log('✅ Video Supabase Integration cleanup complete');
  }
}

// Export singleton instance
export const videoSupabaseIntegration = new VideoSupabaseIntegration();
export default videoSupabaseIntegration;