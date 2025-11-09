// biome-ignore-file lint/nursery/preferLogicalPropertyNames -- Supabase tables expose width/height columns
import type { PostgrestError } from '@supabase/supabase-js';
import { supabase } from '../utils/supabaseClient';

export class SupabaseAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SupabaseAuthError';
  }
}

export class SupabaseQueryError extends Error {
  constructor(message: string, readonly originalError?: PostgrestError) {
    super(message);
    this.name = 'SupabaseQueryError';
  }
}

export const requireCurrentUserId = async (): Promise<string> => {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw new SupabaseAuthError(error.message);
  }

  if (!user) {
    throw new SupabaseAuthError('User is not authenticated.');
  }

  return user.id;
};

export const handlePostgrestError = (error: PostgrestError | null, context: string) => {
  if (error) {
    throw new SupabaseQueryError(`${context}: ${error.message}`, error);
  }
};

export type RecruiterOpportunityStatus =
  | 'draft'
  | 'active'
  | 'paused'
  | 'filled'
  | 'closed';

export type RecruiterOpportunityPriority = 'low' | 'medium' | 'high' | 'critical';

export interface RecruiterOpportunityPayload {
  title: string;
  description?: string;
  targetProfile?: Record<string, any>;
  tags?: string[];
  status?: RecruiterOpportunityStatus;
  priority?: RecruiterOpportunityPriority;
  expectedValue?: number;
  autoInvite?: boolean;
  metadata?: Record<string, any>;
  sourceChannel?: string;
  dueAt?: string;
}

export interface RecruiterInvitePayload {
  opportunityId: string;
  inviteeEmail: string;
  inviteeUserId?: string;
  status?: 'pending' | 'sent' | 'accepted' | 'declined' | 'expired';
  metadata?: Record<string, any>;
  expiresAt?: string;
}

export interface RecruiterAnalytics {
  overview: any;
  recentOpportunities: any[];
  recentInvites: any[];
  inviteStats: {
    total: number;
    byStatus: Record<string, number>;
  };
}

export const createRecruiterOpportunity = async (
  payload: RecruiterOpportunityPayload,
  recruiterId?: string,
) => {
  const insertPayload = {
    recruiter_id: recruiterId || null,
    title: payload.title,
    description: payload.description || null,
    target_profile: payload.targetProfile || null,
    tags: payload.tags || [],
    status: payload.status || 'draft',
    priority: payload.priority || 'medium',
    expected_value: payload.expectedValue ?? null,
    auto_invite: payload.autoInvite ?? false,
    metadata: payload.metadata || null,
    source_channel: payload.sourceChannel || 'app',
    due_at: payload.dueAt || null,
    last_activity_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('recruiter_opportunities')
    .insert(insertPayload)
    .select('*')
    .single();

  handlePostgrestError(error, 'Failed to create recruiter opportunity');
  return data;
};

export const createRecruiterInvites = async (
  invites: RecruiterInvitePayload[],
  recruiterId?: string,
) => {
  if (invites.length === 0) return [];

  const formattedInvites = invites.map((invite) => ({
    recruiter_id: recruiterId || null,
    opportunity_id: invite.opportunityId,
    invitee_email: invite.inviteeEmail,
    invitee_user_id: invite.inviteeUserId || null,
    status: invite.status || 'pending',
    metadata: invite.metadata || null,
    expires_at: invite.expiresAt || null,
  }));

  const { data, error } = await supabase
    .from('recruiter_invites')
    .insert(formattedInvites)
    .select('*');

  handlePostgrestError(error, 'Failed to create recruiter invites');
  return data;
};

export const fetchRecruiterAnalytics = async (
  recruiterId: string,
): Promise<RecruiterAnalytics> => {
  const [{ data: overview, error: overviewError }, { data: opportunities, error: opportunitiesError }, { data: invites, error: invitesError }] =
    await Promise.all([
      supabase
        .from('recruiter_dashboard_stats')
        .select('*')
        .eq('recruiter_id', recruiterId)
        .maybeSingle(),
      supabase
        .from('recruiter_opportunities')
        .select('id,title,status,priority,expected_value,last_activity_at,updated_at')
        .eq('recruiter_id', recruiterId)
        .order('updated_at', { ascending: false })
        .limit(10),
      supabase
        .from('recruiter_invites')
        .select('id,invitee_email,status,opportunity_id,created_at,responded_at')
        .eq('recruiter_id', recruiterId)
        .order('created_at', { ascending: false })
        .limit(25),
    ]);

  handlePostgrestError(overviewError, 'Failed to load recruiter overview');
  handlePostgrestError(opportunitiesError, 'Failed to load recruiter opportunities');
  handlePostgrestError(invitesError, 'Failed to load recruiter invites');

  const inviteStats = (invites || []).reduce(
    (acc, invite) => {
      acc.total += 1;
      const status = invite.status || 'pending';
      acc.byStatus[status] = (acc.byStatus[status] || 0) + 1;
      return acc;
    },
    {
      total: 0,
      byStatus: {} as Record<string, number>,
    },
  );

  return {
    overview,
    recentOpportunities: opportunities || [],
    recentInvites: invites || [],
    inviteStats,
  };
};

export interface UserRatingSummary {
  averageScore: number | null;
  totalRatings: number;
  fiveStar: number;
  fourStar: number;
  threeStar: number;
  twoStar: number;
  oneStar: number;
  lastReviewedAt?: string | null;
}

export interface SubmitUserRatingInput {
  targetHandle: string;
  targetUserId?: string;
  score: number;
  feedback?: string;
  reviewerHandle?: string;
}

export const fetchUserRatingSummary = async (
  targetHandle: string,
): Promise<UserRatingSummary> => {
  const { data, error } = await supabase
    .from('user_rating_summary')
    .select('*')
    .eq('target_handle', targetHandle)
    .maybeSingle();

  handlePostgrestError(error, 'Failed to load user rating summary');

  if (!data) {
    return {
      averageScore: null,
      totalRatings: 0,
      fiveStar: 0,
      fourStar: 0,
      threeStar: 0,
      twoStar: 0,
      oneStar: 0,
      lastReviewedAt: null,
    };
  }

  return {
    averageScore: data.average_score,
    totalRatings: data.total_ratings,
    fiveStar: data.five_star,
    fourStar: data.four_star,
    threeStar: data.three_star,
    twoStar: data.two_star,
    oneStar: data.one_star,
    lastReviewedAt: data.last_reviewed_at,
  };
};

export const submitUserRating = async (input: SubmitUserRatingInput) => {
  const { data, error } = await supabase
    .from('user_ratings')
    .upsert(
      {
        target_handle: input.targetHandle,
        target_user_id: input.targetUserId || null,
        score: input.score,
        feedback: input.feedback || null,
        reviewer_handle: input.reviewerHandle || null,
      },
      { onConflict: 'target_user_id,reviewer_user_id,target_handle,reviewer_handle' },
    )
    .select('*')
    .single();

  handlePostgrestError(error, 'Failed to submit user rating');
  return data;
};

export type MediaAssetCategory = 'image' | 'video' | 'audio' | 'document' | 'other';

export interface MediaAssetContextLink {
  id: number;
  media_asset_id: string;
  context_type: string;
  context_id: string | null;
  project_id: string | null;
  created_at: string;
}

export interface MediaAssetRecord {
  id: string;
  user_id: string | null;
  company_url: string | null;
  collection_name: string | null;
  notes: string | null;
  original_filename: string;
  mime_type: string;
  asset_category: MediaAssetCategory | null;
  size_bytes: number | null;
  ['width']: number | null;
  ['height']: number | null;
  duration_ms: number | null;
  checksum: string | null;
  tags: string[] | null;
  summary: string | null;
  metadata: Record<string, any> | null;
  storage_bucket: string | null;
  storage_path: string | null;
  source_url: string | null;
  is_favorite: boolean | null;
  created_at: string;
  updated_at: string;
  last_accessed_at: string | null;
  media_asset_context_links?: MediaAssetContextLink[];
}

export interface UpdateMediaAssetPayload {
  collectionName?: string | null;
  notes?: string | null;
  tags?: string[];
  isFavorite?: boolean;
  summary?: string | null;
  lastAccessedAt?: string | null;
  metadata?: Record<string, any>;
}

export const fetchUserMediaAssets = async (userId: string): Promise<MediaAssetRecord[]> => {
  const { data, error } = await supabase
    .from('media_assets')
    .select('*, media_asset_context_links(id, context_type, context_id, project_id, created_at)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  handlePostgrestError(error, 'Failed to load media assets');
  return (data as MediaAssetRecord[]) ?? [];
};

export const updateMediaAsset = async (assetId: string, updates: UpdateMediaAssetPayload) => {
  const patch: Record<string, any> = {};

  if ('collectionName' in updates) patch.collection_name = updates.collectionName ?? null;
  if ('notes' in updates) patch.notes = updates.notes ?? null;
  if ('tags' in updates) patch.tags = updates.tags ?? [];
  if ('isFavorite' in updates) patch.is_favorite = updates.isFavorite ?? false;
  if ('summary' in updates) patch.summary = updates.summary ?? null;
  if ('lastAccessedAt' in updates) patch.last_accessed_at = updates.lastAccessedAt ?? null;
  if ('metadata' in updates) patch.metadata = updates.metadata ?? {};

  if (Object.keys(patch).length === 0) {
    return null;
  }

  const { data, error } = await supabase
    .from('media_assets')
    .update(patch)
    .eq('id', assetId)
    .select('*, media_asset_context_links(id, context_type, context_id, project_id, created_at)')
    .single();

  handlePostgrestError(error, 'Failed to update media asset');
  return data as MediaAssetRecord;
};

export const setMediaAssetContexts = async (assetId: string, contextTypes: string[]) => {
  await supabase.from('media_asset_context_links').delete().eq('media_asset_id', assetId);

  if (contextTypes.length === 0) {
    return;
  }

  const payload = contextTypes.map((contextType) => ({
    media_asset_id: assetId,
    context_type: contextType,
  }));

  const { error } = await supabase.from('media_asset_context_links').insert(payload);
  handlePostgrestError(error, 'Failed to update media asset contexts');
};

