import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.warn('SUPABASE_URL is not set. API routes will fail to verify tokens.');
}

if (!serviceRoleKey) {
  console.warn('SUPABASE_SERVICE_ROLE_KEY is not set. API routes will fail to verify tokens.');
}

const supabaseAdmin = supabaseUrl && serviceRoleKey
  ? createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null;

export async function verifySupabaseRequest(request) {
  const header = request.headers?.authorization || request.headers?.Authorization;

  if (!header || typeof header !== 'string' || !header.startsWith('Bearer ')) {
    return { error: 'Missing or invalid Authorization header' };
  }

  if (!supabaseAdmin) {
    return { error: 'Supabase admin client is not configured' };
  }

  const token = header.replace('Bearer ', '').trim();

  if (!token) {
    return { error: 'Empty Supabase access token' };
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);

  if (error) {
    console.error('Supabase token verification failed:', error.message);
    return { error: 'Invalid Supabase access token' };
  }

  return { user: data.user, token };
}
