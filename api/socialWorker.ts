import { createClient } from '@supabase/supabase-js';
import { verifySupabaseRequest } from './_supabaseAuth';
import SocialPostingService from '../src/services/social/SocialPostingService';

const service = new SocialPostingService({
  instagram:
    process.env.INSTAGRAM_ACCESS_TOKEN && process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID
      ? {
          accessToken: process.env.INSTAGRAM_ACCESS_TOKEN,
          businessAccountId: process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID,
        }
      : undefined,
  youtube:
    process.env.YOUTUBE_API_KEY && process.env.YOUTUBE_ACCESS_TOKEN
      ? {
          apiKey: process.env.YOUTUBE_API_KEY,
          accessToken: process.env.YOUTUBE_ACCESS_TOKEN,
          privacyStatus: 'unlisted',
        }
      : undefined,
});

export default async function handler(request: any, response: any) {
  response.setHeader('Access-Control-Allow-Credentials', 'true');
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  response.setHeader(
    'Access-Control-Allow-Headers',
    'Authorization, Content-Type, X-CSRF-Token, X-Requested-With',
  );

  if (request.method === 'OPTIONS') {
    response.status(200).end();
    return;
  }

  const auth = await verifySupabaseRequest(request);
  if (auth.error) {
    response.status(401).json({ success: false, error: auth.error });
    return;
  }

  if (request.method === 'GET') {
    const status = request.query?.status || 'queued';
    const { data, error } = await supabaseAdmin()
      .from('social_posts')
      .select('*')
      .eq('status', status)
      .order('scheduled_at', { ascending: true })
      .limit(25);

    if (error) {
      response.status(400).json({ success: false, error: error.message });
      return;
    }

    response.status(200).json({ success: true, data });
    return;
  }

  if (request.method === 'POST') {
    try {
      const processed = await service.processDuePosts();
      response.status(200).json({
        success: true,
        processedCount: processed.length,
      });
    } catch (err) {
      response.status(500).json({
        success: false,
        error: err instanceof Error ? err.message : 'Failed to process social posts',
      });
    }
    return;
  }

  response.status(405).json({ success: false, error: 'Method not allowed' });
}

function supabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Supabase admin client not configured.');
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

