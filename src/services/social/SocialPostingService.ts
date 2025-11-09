import { supabase } from '../../../utils/supabaseClient';
import { handlePostgrestError } from '../../../supabase/utils';
import {
  EnqueueSocialPostInput,
  SocialPostRecord,
  SocialPlatform,
  SocialWorker,
} from './types';
import { InstagramWorker } from './InstagramWorker';
import { YouTubeWorker } from './YouTubeWorker';

interface SocialPostingServiceOptions {
  instagram?: {
    accessToken: string;
    businessAccountId: string;
  };
  youtube?: {
    apiKey: string;
    accessToken: string;
    privacyStatus?: 'private' | 'public' | 'unlisted';
  };
}

export class SocialPostingService {
  private instagramWorker?: SocialWorker;
  private youtubeWorker?: SocialWorker;
  private instagramAccessToken?: string;
  private youtubeAccessToken?: string;

  constructor(options: SocialPostingServiceOptions) {
    if (options.instagram) {
      this.instagramWorker = new InstagramWorker(
        options.instagram.businessAccountId,
      );
      this.instagramAccessToken = options.instagram.accessToken;
    }

    if (options.youtube) {
      this.youtubeWorker = new YouTubeWorker(
        options.youtube.apiKey,
        options.youtube.accessToken,
        { privacyStatus: options.youtube.privacyStatus },
      );
      this.youtubeAccessToken = options.youtube.accessToken;
    }
  }

  async enqueuePost(input: EnqueueSocialPostInput): Promise<SocialPostRecord> {
    const { data, error } = await supabase
      .from('social_posts')
      .insert({
        platform: input.platform,
        media_url: input.mediaUrl || null,
        thumbnail_url: input.thumbnailUrl || null,
        caption: input.caption || null,
        title: input.title || null,
        tags: input.tags || [],
        scheduled_at: (input.scheduledAt || new Date()).toISOString(),
        metadata: input.metadata || {},
      })
      .select('*')
      .single();

    handlePostgrestError(error, 'Failed to enqueue social post');
    return this.mapRow(data);
  }

  async processDuePosts(limit: number = 5): Promise<SocialPostRecord[]> {
    const nowIso = new Date().toISOString();

    const { data: rows, error } = await supabase
      .from('social_posts')
      .select('*')
      .eq('status', 'queued')
      .lte('scheduled_at', nowIso)
      .order('scheduled_at', { ascending: true })
      .limit(limit);

    handlePostgrestError(error, 'Failed to fetch queued social posts');

    const processed: SocialPostRecord[] = [];

    for (const row of rows || []) {
      const post = this.mapRow(row);
      try {
        await this.markAsProcessing(post.id);
        await this.dispatchPost(post);
        processed.push(await this.markAsPosted(post.id));
      } catch (err) {
        await this.markAsFailed(post.id, err instanceof Error ? err.message : String(err));
      }
    }

    return processed;
  }

  private async dispatchPost(post: SocialPostRecord): Promise<void> {
    const worker = this.getWorker(post.platform);
    const accessToken = await this.resolveAccessToken(post.platform);

    const result = await worker.publish({
      post,
      accessToken,
    });

    await supabase
      .from('social_post_attempts')
      .insert({
        social_post_id: post.id,
        status: 'posted',
        response: result,
      });
  }

  private getWorker(platform: SocialPlatform): SocialWorker {
    if (platform === 'instagram' && this.instagramWorker) {
      return this.instagramWorker;
    }
    if (platform === 'youtube' && this.youtubeWorker) {
      return this.youtubeWorker;
    }
    throw new Error(`Worker for platform ${platform} is not configured.`);
  }

  private async resolveAccessToken(platform: SocialPlatform): Promise<string> {
    if (platform === 'instagram' && this.instagramAccessToken) {
      return this.instagramAccessToken;
    }
    if (platform === 'youtube' && this.youtubeAccessToken) {
      return this.youtubeAccessToken;
    }
    throw new Error(`Unable to resolve access token for ${platform}`);
  }

  private async markAsProcessing(postId: string) {
    const { error } = await supabase
      .from('social_posts')
      .update({ status: 'processing' })
      .eq('id', postId);

    handlePostgrestError(error, 'Failed to mark post as processing');
  }

  private async markAsPosted(postId: string): Promise<SocialPostRecord> {
    const { data, error } = await supabase
      .from('social_posts')
      .update({
        status: 'posted',
        posted_at: new Date().toISOString(),
        error_message: null,
      })
      .eq('id', postId)
      .select('*')
      .single();

    handlePostgrestError(error, 'Failed to mark post as posted');
    return this.mapRow(data);
  }

  private async markAsFailed(postId: string, message: string) {
    await supabase
      .from('social_posts')
      .update({
        status: 'failed',
        error_message: message,
      })
      .eq('id', postId);

    await supabase
      .from('social_post_attempts')
      .insert({
        social_post_id: postId,
        status: 'failed',
        response: { error: message },
      });
  }

  private mapRow(row: any): SocialPostRecord {
    return {
      id: row.id,
      platform: row.platform,
      status: row.status,
      mediaUrl: row.media_url,
      thumbnailUrl: row.thumbnail_url,
      caption: row.caption,
      title: row.title,
      tags: row.tags || [],
      scheduledAt: row.scheduled_at,
      postedAt: row.posted_at,
      errorMessage: row.error_message,
      metadata: row.metadata,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export default SocialPostingService;

