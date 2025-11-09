# Social Posting Workers

## Overview

The Social Posting Service powers automated distribution of premium media to Instagram Reels and YouTube Shorts. It uses Supabase-managed queues and dedicated workers for each platform.

- Queue table: `social_posts`
- Attempt log: `social_post_attempts`
- REST endpoint: `/api/socialWorker`
- Service orchestrator: `src/services/social/SocialPostingService.ts`

## Workflow

1. **Enqueue**
   ```ts
   await socialPostingService.enqueuePost({
     platform: 'instagram',
     mediaUrl: 'https://cdn.example.com/reel.mp4',
     caption: '#ai #creators',
     scheduledAt: new Date(Date.now() + 5 * 60_000),
   });
   ```
2. **Dispatch**
   - `POST /api/socialWorker` runs the queue (requires Supabase auth token)
   - Service selects due posts (`status = 'queued'` and `scheduled_at <= now`)
3. **Publish**
   - `InstagramWorker` calls the Graph API (`/media` → `/media_publish`)
   - `YouTubeWorker` calls the YouTube Data API (`videos.insert`)
4. **Record**
   - On success: `social_posts.status = 'posted'`
   - On failure: `social_posts.status = 'failed'` + attempt logged

## Environment Variables

```
INSTAGRAM_ACCESS_TOKEN=...
INSTAGRAM_BUSINESS_ACCOUNT_ID=...
YOUTUBE_API_KEY=...
YOUTUBE_ACCESS_TOKEN=...
```

## Monitoring

Use the `SocialWorkerDashboard` component (embedded in `GamificationDashboard.tsx`) to inspect the queue and trigger workers manually during testing.

```tsx
<SocialWorkerDashboard />
```

## Testing

- `tests/unit/instagramWorker.test.ts` mocks the Graph API calls
- Use Vitest to validate worker logic  
  `npm run test -- --run tests/unit/instagramWorker.test.ts`

## Notes

- Tokens should be rotated and stored in a secure secret manager.
- In production adopt resumable uploads for YouTube and container polling for Instagram.
- Extend `SocialPostingService` with webhooks to sync status back to Supabase for real-time dashboards.

