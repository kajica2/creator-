import { SocialWorker, SocialWorkerContext } from './types';

interface InstagramPublishResponse {
  id: string;
  status?: string;
}

export class InstagramWorker implements SocialWorker {
  private readonly graphApiVersion: string;

  constructor(private businessAccountId: string, graphApiVersion: string = 'v19.0') {
    this.graphApiVersion = graphApiVersion;
  }

  async publish(context: SocialWorkerContext): Promise<{ externalId?: string; publishedAt: string }> {
    const { post, accessToken } = context;

    if (!post.mediaUrl) {
      throw new Error('Instagram requires mediaUrl for publishing.');
    }

    const endpointBase = `https://graph.facebook.com/${this.graphApiVersion}/${this.businessAccountId}`;

    // Step 1: Create media container
    const containerPayload = new URLSearchParams({
      image_url: post.mediaUrl,
      caption: post.caption || '',
      access_token: accessToken,
    });

    const containerResponse = await fetch(`${endpointBase}/media`, {
      method: 'POST',
      body: containerPayload,
    });

    if (!containerResponse.ok) {
      const errorText = await containerResponse.text();
      throw new Error(`Instagram container creation failed: ${errorText}`);
    }

    const containerData = (await containerResponse.json()) as InstagramPublishResponse;

    if (!containerData.id) {
      throw new Error('Instagram did not return a container id.');
    }

    // Step 2: Publish media container
    const publishPayload = new URLSearchParams({
      creation_id: containerData.id,
      access_token: accessToken,
    });

    const publishResponse = await fetch(`${endpointBase}/media_publish`, {
      method: 'POST',
      body: publishPayload,
    });

    if (!publishResponse.ok) {
      const errorText = await publishResponse.text();
      throw new Error(`Instagram publishing failed: ${errorText}`);
    }

    const publishData = (await publishResponse.json()) as InstagramPublishResponse;

    return {
      externalId: publishData.id,
      publishedAt: new Date().toISOString(),
    };
  }
}

export default InstagramWorker;

