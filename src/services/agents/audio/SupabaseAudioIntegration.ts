import { supabase } from '../../../utils/supabaseClient';
import {
  AudioProject,
  GeneratedComposition,
  VoiceOutput,
  BeatPattern,
  SupabaseAudioMetadata,
  AudioAgentType,
  SocialMediaFormat
} from './types';

/**
 * Supabase integration for audio metadata and storage
 * This module handles storing audio projects, metadata, and generated content
 * in Supabase for persistence and sharing across sessions
 */

export class SupabaseAudioIntegration {
  private userId?: string;

  constructor(userId?: string) {
    this.userId = userId;
  }

  /**
   * Initialize the integration and create necessary tables if they don't exist
   */
  async initialize(): Promise<void> {
    try {
      await this.createTablesIfNotExist();
      console.log('📊 Supabase audio integration initialized');
    } catch (error) {
      console.warn('Supabase audio integration initialization failed:', error);
    }
  }

  /**
   * Create audio-related tables if they don't exist
   */
  private async createTablesIfNotExist(): Promise<void> {
    try {
      // Audio Projects table
      await supabase.rpc('create_audio_projects_table_if_not_exists');

      // Audio Metadata table
      await supabase.rpc('create_audio_metadata_table_if_not_exists');

      // Audio Compositions table
      await supabase.rpc('create_audio_compositions_table_if_not_exists');

      // Audio Voices table
      await supabase.rpc('create_audio_voices_table_if_not_exists');

      // Audio Beats table
      await supabase.rpc('create_audio_beats_table_if_not_exists');

      console.log('📊 Audio tables verified/created');
    } catch (error) {
      // Tables might already exist or RPC functions might not be available
      console.warn('Table creation check failed (tables may already exist):', error);
    }
  }

  /**
   * Save an audio project to Supabase
   */
  async saveProject(project: AudioProject): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('audio_projects')
        .upsert({
          id: project.id,
          user_id: this.userId,
          name: project.name,
          tempo: project.tempo,
          key: project.key,
          time_signature: project.timeSignature,
          master_volume: project.masterVolume,
          tracks: project.tracks,
          metadata: project.metadata,
          created_at: project.metadata.createdAt,
          updated_at: new Date()
        })
        .select()
        .single();

      if (error) throw error;

      console.log(`💾 Project saved: ${project.name}`);
      return data.id;
    } catch (error) {
      throw new Error(`Failed to save project: ${error}`);
    }
  }

  /**
   * Load an audio project from Supabase
   */
  async loadProject(projectId: string): Promise<AudioProject | null> {
    try {
      const { data, error } = await supabase
        .from('audio_projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (error) throw error;
      if (!data) return null;

      const project: AudioProject = {
        id: data.id,
        name: data.name,
        tracks: data.tracks,
        masterVolume: data.master_volume,
        tempo: data.tempo,
        key: data.key,
        timeSignature: data.time_signature,
        metadata: {
          ...data.metadata,
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at)
        }
      };

      console.log(`📂 Project loaded: ${project.name}`);
      return project;
    } catch (error) {
      console.error('Failed to load project:', error);
      return null;
    }
  }

  /**
   * Save a generated composition
   */
  async saveComposition(composition: GeneratedComposition, projectId?: string): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('audio_compositions')
        .upsert({
          id: composition.id,
          user_id: this.userId,
          project_id: projectId,
          title: composition.title,
          style: composition.metadata.style,
          key: composition.metadata.key,
          tempo: composition.metadata.tempo,
          duration: composition.metadata.duration,
          sequence: composition.sequence,
          tracks: composition.tracks,
          metadata: composition.metadata,
          created_at: composition.metadata.generatedAt,
          updated_at: new Date()
        })
        .select()
        .single();

      if (error) throw error;

      // Save metadata entry
      await this.saveAudioMetadata({
        id: composition.id,
        project_id: projectId || '',
        agent_type: 'composer',
        metadata: composition.metadata,
        created_at: composition.metadata.generatedAt,
        updated_at: new Date(),
        tags: [composition.metadata.style, `${composition.metadata.tempo}bpm`],
        social_optimized: false
      });

      console.log(`🎵 Composition saved: ${composition.title}`);
      return data.id;
    } catch (error) {
      throw new Error(`Failed to save composition: ${error}`);
    }
  }

  /**
   * Save a generated voice
   */
  async saveVoice(voice: VoiceOutput, projectId?: string, audioUrl?: string): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('audio_voices')
        .upsert({
          id: voice.id,
          user_id: this.userId,
          project_id: projectId,
          text: voice.text,
          language: voice.metadata.language,
          word_count: voice.metadata.wordCount,
          duration: voice.duration,
          voice_config: voice.voiceConfig,
          audio_url: audioUrl,
          metadata: voice.metadata,
          created_at: voice.metadata.generatedAt,
          updated_at: new Date()
        })
        .select()
        .single();

      if (error) throw error;

      // Save metadata entry
      await this.saveAudioMetadata({
        id: voice.id,
        project_id: projectId || '',
        agent_type: 'voice-synthesizer',
        metadata: voice.metadata,
        audio_url: audioUrl,
        created_at: voice.metadata.generatedAt,
        updated_at: new Date(),
        tags: [voice.metadata.language, voice.voiceConfig.voice],
        social_optimized: false
      });

      console.log(`🎤 Voice saved: ${voice.text.substring(0, 50)}...`);
      return data.id;
    } catch (error) {
      throw new Error(`Failed to save voice: ${error}`);
    }
  }

  /**
   * Save a generated beat pattern
   */
  async saveBeatPattern(beat: BeatPattern, projectId?: string): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('audio_beats')
        .upsert({
          id: beat.id,
          user_id: this.userId,
          project_id: projectId,
          name: beat.name,
          tempo: beat.tempo,
          time_signature: beat.timeSignature,
          length: beat.length,
          pattern: beat.pattern,
          instruments: Array.from(new Set(beat.pattern.map(p => p.instrument))),
          created_at: new Date(),
          updated_at: new Date()
        })
        .select()
        .single();

      if (error) throw error;

      // Save metadata entry
      await this.saveAudioMetadata({
        id: beat.id,
        project_id: projectId || '',
        agent_type: 'beat-generator',
        metadata: {
          tempo: beat.tempo,
          timeSignature: beat.timeSignature,
          length: beat.length,
          instrumentCount: new Set(beat.pattern.map(p => p.instrument)).size
        },
        created_at: new Date(),
        updated_at: new Date(),
        tags: [`${beat.tempo}bpm`, 'drum-pattern'],
        social_optimized: false
      });

      console.log(`🥁 Beat pattern saved: ${beat.name}`);
      return data.id;
    } catch (error) {
      throw new Error(`Failed to save beat pattern: ${error}`);
    }
  }

  /**
   * Save audio metadata
   */
  async saveAudioMetadata(metadata: SupabaseAudioMetadata): Promise<void> {
    try {
      const { error } = await supabase
        .from('audio_metadata')
        .upsert({
          id: metadata.id,
          user_id: this.userId,
          project_id: metadata.project_id,
          agent_type: metadata.agent_type,
          metadata: metadata.metadata,
          audio_url: metadata.audio_url,
          tags: metadata.tags,
          social_optimized: metadata.social_optimized,
          created_at: metadata.created_at,
          updated_at: metadata.updated_at
        });

      if (error) throw error;
    } catch (error) {
      console.error('Failed to save audio metadata:', error);
    }
  }

  /**
   * Upload audio file to Supabase Storage
   */
  async uploadAudioFile(
    audioBuffer: ArrayBuffer,
    fileName: string,
    format: string = 'wav'
  ): Promise<string | null> {
    try {
      const file = new Blob([audioBuffer], {
        type: `audio/${format}`
      });

      const filePath = `audio/${this.userId}/${Date.now()}-${fileName}.${format}`;

      const { data, error } = await supabase.storage
        .from('audio-files')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('audio-files')
        .getPublicUrl(filePath);

      console.log(`☁️ Audio file uploaded: ${fileName}`);
      return urlData.publicUrl;
    } catch (error) {
      console.error('Failed to upload audio file:', error);
      return null;
    }
  }

  /**
   * Get user's projects
   */
  async getUserProjects(): Promise<AudioProject[]> {
    try {
      const { data, error } = await supabase
        .from('audio_projects')
        .select('*')
        .eq('user_id', this.userId)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      return data.map(item => ({
        id: item.id,
        name: item.name,
        tracks: item.tracks,
        masterVolume: item.master_volume,
        tempo: item.tempo,
        key: item.key,
        timeSignature: item.time_signature,
        metadata: {
          ...item.metadata,
          createdAt: new Date(item.created_at),
          updatedAt: new Date(item.updated_at)
        }
      }));
    } catch (error) {
      console.error('Failed to get user projects:', error);
      return [];
    }
  }

  /**
   * Get user's compositions
   */
  async getUserCompositions(): Promise<GeneratedComposition[]> {
    try {
      const { data, error } = await supabase
        .from('audio_compositions')
        .select('*')
        .eq('user_id', this.userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map(item => ({
        id: item.id,
        title: item.title,
        sequence: item.sequence,
        tracks: item.tracks,
        metadata: {
          ...item.metadata,
          generatedAt: new Date(item.created_at)
        }
      }));
    } catch (error) {
      console.error('Failed to get user compositions:', error);
      return [];
    }
  }

  /**
   * Search audio content by tags
   */
  async searchByTags(tags: string[]): Promise<SupabaseAudioMetadata[]> {
    try {
      const { data, error } = await supabase
        .from('audio_metadata')
        .select('*')
        .eq('user_id', this.userId)
        .overlaps('tags', tags)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map(item => ({
        id: item.id,
        project_id: item.project_id,
        agent_type: item.agent_type,
        metadata: item.metadata,
        audio_url: item.audio_url,
        created_at: new Date(item.created_at),
        updated_at: new Date(item.updated_at),
        tags: item.tags,
        social_optimized: item.social_optimized
      }));
    } catch (error) {
      console.error('Failed to search by tags:', error);
      return [];
    }
  }

  /**
   * Mark content as social media optimized
   */
  async markSocialOptimized(
    contentId: string,
    platform: string,
    format: SocialMediaFormat
  ): Promise<void> {
    try {
      await supabase
        .from('audio_metadata')
        .update({
          social_optimized: true,
          metadata: {
            ...format,
            optimizedFor: platform,
            optimizedAt: new Date()
          },
          updated_at: new Date()
        })
        .eq('id', contentId);

      console.log(`📱 Content marked as optimized for ${platform}: ${contentId}`);
    } catch (error) {
      console.error('Failed to mark as social optimized:', error);
    }
  }

  /**
   * Get analytics for user's audio content
   */
  async getAnalytics(): Promise<any> {
    try {
      const [projects, compositions, voices, beats] = await Promise.all([
        this.getUserProjects(),
        this.getUserCompositions(),
        this.getUserVoices(),
        this.getUserBeats()
      ]);

      const analytics = {
        totalProjects: projects.length,
        totalCompositions: compositions.length,
        totalVoices: voices.length,
        totalBeats: beats.length,
        styleBreakdown: this.getStyleBreakdown(compositions),
        tempoAnalysis: this.getTempoAnalysis([...compositions, ...beats]),
        languageBreakdown: this.getLanguageBreakdown(voices),
        recentActivity: this.getRecentActivity(projects, compositions, voices, beats)
      };

      console.log('📊 Analytics generated:', analytics);
      return analytics;
    } catch (error) {
      console.error('Failed to generate analytics:', error);
      return null;
    }
  }

  private async getUserVoices(): Promise<VoiceOutput[]> {
    try {
      const { data, error } = await supabase
        .from('audio_voices')
        .select('*')
        .eq('user_id', this.userId);

      if (error) throw error;

      return data.map(item => ({
        id: item.id,
        text: item.text,
        audioBuffer: new ArrayBuffer(0), // Not loaded
        duration: item.duration,
        voiceConfig: item.voice_config,
        metadata: {
          ...item.metadata,
          generatedAt: new Date(item.created_at)
        }
      }));
    } catch (error) {
      console.error('Failed to get user voices:', error);
      return [];
    }
  }

  private async getUserBeats(): Promise<BeatPattern[]> {
    try {
      const { data, error } = await supabase
        .from('audio_beats')
        .select('*')
        .eq('user_id', this.userId);

      if (error) throw error;

      return data.map(item => ({
        id: item.id,
        name: item.name,
        timeSignature: item.time_signature,
        tempo: item.tempo,
        length: item.length,
        pattern: item.pattern
      }));
    } catch (error) {
      console.error('Failed to get user beats:', error);
      return [];
    }
  }

  private getStyleBreakdown(compositions: GeneratedComposition[]): Record<string, number> {
    const breakdown: Record<string, number> = {};
    compositions.forEach(comp => {
      const style = comp.metadata.style;
      breakdown[style] = (breakdown[style] || 0) + 1;
    });
    return breakdown;
  }

  private getTempoAnalysis(items: any[]): any {
    const tempos = items.map(item => item.metadata?.tempo || item.tempo).filter(Boolean);
    if (tempos.length === 0) return null;

    return {
      average: Math.round(tempos.reduce((a, b) => a + b, 0) / tempos.length),
      min: Math.min(...tempos),
      max: Math.max(...tempos),
      distribution: this.getTempoDistribution(tempos)
    };
  }

  private getTempoDistribution(tempos: number[]): Record<string, number> {
    const ranges = {
      'Slow (60-90)': 0,
      'Moderate (91-120)': 0,
      'Fast (121-150)': 0,
      'Very Fast (151+)': 0
    };

    tempos.forEach(tempo => {
      if (tempo <= 90) ranges['Slow (60-90)']++;
      else if (tempo <= 120) ranges['Moderate (91-120)']++;
      else if (tempo <= 150) ranges['Fast (121-150)']++;
      else ranges['Very Fast (151+)']++;
    });

    return ranges;
  }

  private getLanguageBreakdown(voices: VoiceOutput[]): Record<string, number> {
    const breakdown: Record<string, number> = {};
    voices.forEach(voice => {
      const lang = voice.metadata.language;
      breakdown[lang] = (breakdown[lang] || 0) + 1;
    });
    return breakdown;
  }

  private getRecentActivity(
    projects: AudioProject[],
    compositions: GeneratedComposition[],
    voices: VoiceOutput[],
    beats: BeatPattern[]
  ): any[] {
    const activities: any[] = [];

    projects.forEach(p => activities.push({
      type: 'project',
      name: p.name,
      date: p.metadata.updatedAt
    }));

    compositions.forEach(c => activities.push({
      type: 'composition',
      name: c.title,
      date: c.metadata.generatedAt
    }));

    voices.forEach(v => activities.push({
      type: 'voice',
      name: v.text.substring(0, 50) + '...',
      date: v.metadata.generatedAt
    }));

    // Sort by date and return most recent 10
    return activities
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);
  }

  /**
   * Set user ID for the integration
   */
  setUserId(userId: string): void {
    this.userId = userId;
  }

  /**
   * Get current user ID
   */
  getUserId(): string | undefined {
    return this.userId;
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.userId = undefined;
    console.log('📊 Supabase audio integration disposed');
  }
}

// Export convenience function
export const createSupabaseAudioIntegration = (userId?: string): SupabaseAudioIntegration => {
  return new SupabaseAudioIntegration(userId);
};