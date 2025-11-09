export type SocialPlatform = 'instagram' | 'youtube';

export type SocialPostStatus = 'queued' | 'processing' | 'posted' | 'failed';

export interface SocialPostRecord {
  id: string;
  platform: SocialPlatform;
  status: SocialPostStatus;
  mediaUrl?: string | null;
  thumbnailUrl?: string | null;
  caption?: string | null;
  title?: string | null;
  tags?: string[];
  scheduledAt: string;
  postedAt?: string | null;
  errorMessage?: string | null;
  metadata?: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
}

export interface EnqueueSocialPostInput {
  platform: SocialPlatform;
  mediaUrl?: string;
  thumbnailUrl?: string;
  caption?: string;
  title?: string;
  tags?: string[];
  scheduledAt?: Date;
  metadata?: Record<string, any>;
}

export interface SocialWorkerContext {
  post: SocialPostRecord;
  accessToken: string;
}

export interface SocialWorker {
  publish(context: SocialWorkerContext): Promise<{
    externalId?: string;
    publishedAt: string;
  }>;
}

