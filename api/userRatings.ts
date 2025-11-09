import { createClient, PostgrestError } from '@supabase/supabase-js';
import { verifySupabaseRequest } from './_supabaseAuth';

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const getSupabaseAdmin = () => {
  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
};

const supabaseAdmin = getSupabaseAdmin();

const formatError = (error: PostgrestError | null, fallback: string) =>
  error
    ? {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      }
    : { message: fallback };

const parseScore = (value: any): number | null => {
  const score = Number(value);
  if (Number.isInteger(score) && score >= 1 && score <= 5) {
    return score;
  }
  return null;
};

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

  if (!supabaseAdmin) {
    response.status(500).json({
      success: false,
      error: 'Supabase admin client is not configured',
    });
    return;
  }

  if (request.method === 'GET') {
    await handleGetRatings(request, response);
    return;
  }

  if (request.method === 'POST') {
    await handlePostRating(request, response);
    return;
  }

  response.status(405).json({ success: false, error: 'Method not allowed' });
}

async function handleGetRatings(request: any, response: any) {
  const { targetHandle, targetUserId } = request.query || {};

  if (!targetHandle && !targetUserId) {
    response.status(400).json({
      success: false,
      error: 'targetHandle or targetUserId is required',
    });
    return;
  }

  const filters: Record<string, any> = {};
  if (targetHandle) filters.target_handle = targetHandle;
  if (targetUserId) filters.target_user_id = targetUserId;

  const [{ data: summaryRow, error: summaryError }, { data: recentRows, error: recentError }] =
    await Promise.all([
      supabaseAdmin
        .from('user_rating_summary')
        .select('*')
        .match(filters)
        .maybeSingle(),
      supabaseAdmin
        .from('user_ratings')
        .select('*')
        .match(filters)
        .order('updated_at', { ascending: false })
        .limit(10),
    ]);

  if (summaryError || recentError) {
    response.status(400).json({
      success: false,
      error: 'Failed to load rating summary',
      details: [summaryError, recentError].filter(Boolean).map((error) => formatError(error, '')),
    });
    return;
  }

  response.status(200).json({
    success: true,
    data: {
      summary: summaryRow || {
        target_handle: targetHandle,
        target_user_id: targetUserId,
        average_score: null,
        total_ratings: 0,
      },
      recent: recentRows || [],
    },
  });
}

async function handlePostRating(request: any, response: any) {
  const auth = await verifySupabaseRequest(request);
  if (auth.error) {
    response.status(401).json({
      success: false,
      error: auth.error,
    });
    return;
  }

  const { targetHandle, targetUserId, score, feedback, reviewerHandle } = request.body || {};

  if (!targetHandle && !targetUserId) {
    response.status(400).json({
      success: false,
      error: 'targetHandle or targetUserId is required',
    });
    return;
  }

  const parsedScore = parseScore(score);
  if (parsedScore === null) {
    response.status(400).json({
      success: false,
      error: 'Score must be an integer between 1 and 5',
    });
    return;
  }

  const payload: Record<string, any> = {
    target_handle: targetHandle || null,
    target_user_id: targetUserId || null,
    reviewer_user_id: auth.user?.id || null,
    reviewer_handle: reviewerHandle || auth.user?.email || null,
    score: parsedScore,
    feedback: feedback || null,
  };

  const { data, error } = await supabaseAdmin
    .from('user_ratings')
    .upsert(payload, {
      onConflict: 'target_user_id,reviewer_user_id,target_handle,reviewer_handle',
    })
    .select('*')
    .single();

  if (error) {
    response.status(400).json({
      success: false,
      error: 'Failed to submit rating',
      details: formatError(error, 'Database error'),
    });
    return;
  }

  response.status(200).json({
    success: true,
    data,
  });
}

