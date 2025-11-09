import { SocialWorker, SocialWorkerContext } from './types';

interface YouTubePublishOptions {
  privacyStatus?: 'private' | 'public' | 'unlisted';
  categoryId?: string;
}

export class YouTubeWorker implements SocialWorker {
  constructor(
    private apiKey: string,
    private accessToken: string,
    private options: YouTubePublishOptions = {},
  ) {}

  async publish(context: SocialWorkerContext): Promise<{ externalId?: string; publishedAt: string }> {
    const { post } = context;

    if (!post.mediaUrl) {
      throw new Error('YouTube requires a mediaUrl to ingest video.');
    }

    const snippet = {
      title: post.title || 'AI Generated Short',
      description: post.caption || '',
      tags: post.tags || [],
      categoryId: this.options.categoryId || '22', // People & Blogs
    };

    const status = {
      privacyStatus: this.options.privacyStatus || 'unlisted',
      selfDeclaredMadeForKids: false,
      embeddable: true,
    };

    // In production you would upload the binary using the resumable upload protocol.
    // Here we simulate the operation by calling a placeholder endpoint to keep the worker testable.
    const metadata = {
      snippet,
      status,
    };

    const response = await fetch('https://youtube.googleapis.com/youtube/v3/videos?part=snippet,status', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'X-Upload-Content-Type': 'video/mp4',
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': this.apiKey,
      },
      body: JSON.stringify(metadata),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`YouTube publishing failed: ${errorText}`);
    }

    const data = (await response.json()) as { id?: string };

    return {
      externalId: data.id,
      publishedAt: new Date().toISOString(),
    };
  }
}

export default YouTubeWorker;

