import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { InstagramWorker } from '../../src/services/social/InstagramWorker';

describe('InstagramWorker', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.resetAllMocks();
    vi.unstubAllGlobals();
  });

  it('throws when mediaUrl is missing', async () => {
    const worker = new InstagramWorker('business-account-id');

    await expect(
      worker.publish({
        post: {
          id: 'test',
          platform: 'instagram',
          status: 'queued',
          caption: 'Hello world',
          tags: [],
          scheduledAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as any,
        accessToken: 'token',
      }),
    ).rejects.toThrow(/requires mediaUrl/i);
  });

  it('calls Instagram Graph API to publish media', async () => {
    const worker = new InstagramWorker('business-account-id');
    const mockFetch = vi.mocked(fetch);

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'container123' }),
    } as any);

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'media456' }),
    } as any);

    const result = await worker.publish({
      post: {
        id: 'test',
        platform: 'instagram',
        status: 'queued',
        mediaUrl: 'https://example.com/media.jpg',
        caption: 'Caption',
        tags: [],
        scheduledAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as any,
      accessToken: 'token',
    });

    expect(result.externalId).toBe('media456');
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});

