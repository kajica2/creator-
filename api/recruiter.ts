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

const formatPostgrestError = (error: PostgrestError | null) => {
  if (!error) return null;
  return {
    message: error.message,
    details: error.details,
    hint: error.hint,
    code: error.code,
  };
};

const parseRecruiterId = (idParam: unknown): string | null => {
  if (typeof idParam === 'string' && idParam.trim().length > 0) {
    return idParam.trim();
  }

  if (Array.isArray(idParam) && idParam.length > 0) {
    const candidate = idParam[0];
    return typeof candidate === 'string' ? candidate.trim() : null;
  }

  return null;
};

export default async function handler(request: any, response: any) {
  response.setHeader('Access-Control-Allow-Credentials', 'true');
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader(
    'Access-Control-Allow-Methods',
    'GET,OPTIONS'
  );
  response.setHeader(
    'Access-Control-Allow-Headers',
    'Authorization, X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (request.method === 'OPTIONS') {
    response.status(200).end();
    return;
  }

  if (request.method !== 'GET') {
    response.status(405).json({ success: false, error: 'Method not allowed' });
    return;
  }

  if (!supabaseAdmin) {
    response.status(500).json({
      success: false,
      error: 'Supabase admin client is not configured',
    });
    return;
  }

  try {
    const authResult = await verifySupabaseRequest(request);

    if (authResult.error) {
      response.status(401).json({
        success: false,
        error: authResult.error,
      });
      return;
    }

    const recruiterId =
      parseRecruiterId(request.query?.recruiterId) || authResult.user?.id;

    if (!recruiterId) {
      response.status(400).json({
        success: false,
        error: 'Missing recruiterId parameter',
      });
      return;
    }

    const [
      { data: overview, error: overviewError },
      { data: recentOpportunities, error: opportunitiesError },
      { data: recentInvites, error: invitesError },
      { data: activityLog, error: activityError },
    ] = await Promise.all([
      supabaseAdmin
        .from('recruiter_dashboard_stats')
        .select('*')
        .eq('recruiter_id', recruiterId)
        .maybeSingle(),
      supabaseAdmin
        .from('recruiter_opportunities')
        .select('id,title,status,priority,expected_value,last_activity_at,updated_at')
        .eq('recruiter_id', recruiterId)
        .order('updated_at', { ascending: false })
        .limit(12),
      supabaseAdmin
        .from('recruiter_invites')
        .select('id,invitee_email,status,opportunity_id,created_at,responded_at')
        .eq('recruiter_id', recruiterId)
        .order('created_at', { ascending: false })
        .limit(25),
      supabaseAdmin.rpc('get_recruiter_recent_activity', {
        p_recruiter_id: recruiterId,
        p_limit: 25,
      }),
    ]);

    const errors = [
      formatPostgrestError(overviewError),
      formatPostgrestError(opportunitiesError),
      formatPostgrestError(invitesError),
      formatPostgrestError(activityError),
    ].filter(Boolean);

    if (errors.length > 0) {
      response.status(400).json({
        success: false,
        error: 'Failed to load recruiter analytics',
        details: errors,
      });
      return;
    }

    const inviteStats = (recentInvites || []).reduce(
      (acc: { total: number; byStatus: Record<string, number> }, invite: any) => {
        acc.total += 1;
        const status = invite.status || 'pending';
        acc.byStatus[status] = (acc.byStatus[status] || 0) + 1;
        return acc;
      },
      { total: 0, byStatus: {} },
    );

    response.status(200).json({
      success: true,
      data: {
        overview,
        recentOpportunities: recentOpportunities || [],
        recentInvites: recentInvites || [],
        inviteStats,
        recentActivity: activityLog || [],
      },
    });
  } catch (error: any) {
    const message =
      error instanceof Error ? error.message : 'Failed to load recruiter analytics';
    response.status(500).json({
      success: false,
      error: message,
    });
  }
}

