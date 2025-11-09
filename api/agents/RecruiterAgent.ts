import { AgentHandler, AgentMessage } from '../core/AgentOrchestrator';
import { supabase } from '../../utils/supabaseClient';
import { handlePostgrestError } from '../../supabase/utils';

type OpportunityStatus = 'draft' | 'active' | 'paused' | 'filled' | 'closed';
type OpportunityPriority = 'low' | 'medium' | 'high' | 'critical';
type InviteStatus = 'pending' | 'sent' | 'accepted' | 'declined' | 'expired';

export interface RecruiterOpportunityInput {
  recruiterId?: string;
  title: string;
  description?: string;
  targetProfile?: Record<string, any>;
  tags?: string[];
  status?: OpportunityStatus;
  priority?: OpportunityPriority;
  expectedValue?: number;
  autoInvite?: boolean;
  metadata?: Record<string, any>;
  sourceChannel?: string;
  dueAt?: string;
}

export interface RecruiterInviteInput {
  recruiterId?: string;
  opportunityId: string;
  inviteeEmail: string;
  inviteeUserId?: string;
  status?: InviteStatus;
  metadata?: Record<string, any>;
  expiresAt?: string;
}

export interface RecruiterAnalyticsPayload {
  recruiterId?: string;
}

const generateId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  // RFC4122 version 4 compliant fallback
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = (Math.random() * 16) | 0;
    const value = char === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
};

export default class RecruiterAgent implements AgentHandler {
  async handle(message: AgentMessage): Promise<any> {
    const { type, payload } = message;

    if (!payload || typeof payload !== 'object') {
      throw new Error('RecruiterAgent requires a payload object.');
    }

    switch (type) {
      case 'pipeline':
        return this.processPipeline(payload, message);
      case 'request':
      case 'command':
      case 'status':
        return this.processRequest(payload, message);
      default:
        throw new Error(`Unsupported message type for RecruiterAgent: ${type}`);
    }
  }

  private async processRequest(payload: any, message: AgentMessage) {
    const action = payload.action || 'createOpportunity';

    switch (action) {
      case 'createOpportunity':
        return this.createOpportunity(payload, message.userId);

      case 'inviteCandidates':
        return this.inviteCandidates(payload, message.userId);

      case 'getAnalytics':
        return this.getAnalytics(payload);

      case 'updateOpportunityStatus':
        return this.updateOpportunityStatus(payload, message.userId);

      default:
        throw new Error(`Unknown recruiter action: ${action}`);
    }
  }

  private async processPipeline(payload: any, message: AgentMessage) {
    const opportunityData: RecruiterOpportunityInput = payload.opportunity || payload;
    const inviteList: RecruiterInviteInput[] = payload.invites || [];

    const opportunity = await this.createOpportunity(opportunityData, message.userId);

    let invites: any[] = [];
    if (inviteList.length > 0) {
      invites = await this.inviteCandidates(
        {
          invites: inviteList.map((invite) => ({
            ...invite,
            opportunityId: opportunity.id,
          })),
        },
        message.userId,
      );
    }

    return {
      opportunity,
      invites,
    };
  }

  private async createOpportunity(
    payload: RecruiterOpportunityInput,
    fallbackRecruiterId?: string,
  ) {
    const recruiterId = payload.recruiterId || fallbackRecruiterId || null;

    if (!payload.title) {
      throw new Error('Opportunity title is required.');
    }

    const insertPayload = {
      recruiter_id: recruiterId,
      title: payload.title,
      description: payload.description || null,
      target_profile: payload.targetProfile || null,
      tags: payload.tags || [],
      status: payload.status || 'draft',
      priority: payload.priority || 'medium',
      expected_value: payload.expectedValue ?? null,
      auto_invite: payload.autoInvite ?? false,
      metadata: payload.metadata || null,
      source_channel: payload.sourceChannel || 'agent',
      due_at: payload.dueAt || null,
      last_activity_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('recruiter_opportunities')
      .insert(insertPayload)
      .select('*')
      .single();

    handlePostgrestError(error, 'Failed to create recruiter opportunity');

    if (recruiterId) {
      await supabase.from('recruiter_activity_log').insert({
        recruiter_id: recruiterId,
        opportunity_id: data?.id,
        action: 'opportunity_created',
        details: {
          title: payload.title,
          tags: payload.tags || [],
          priority: payload.priority || 'medium',
        },
      });
    }

    return data;
  }

  private async inviteCandidates(
    payload: { invites: RecruiterInviteInput[] },
    fallbackRecruiterId?: string,
  ) {
    if (!payload.invites || payload.invites.length === 0) {
      return [];
    }

    const formattedInvites = payload.invites.map((invite) => ({
      id: generateId(),
      recruiter_id: invite.recruiterId || fallbackRecruiterId || null,
      opportunity_id: invite.opportunityId,
      invitee_email: invite.inviteeEmail,
      invitee_user_id: invite.inviteeUserId || null,
      status: invite.status || 'pending',
      metadata: invite.metadata || null,
      invite_token: generateId(),
      expires_at: invite.expiresAt || null,
    }));

    const { data, error } = await supabase
      .from('recruiter_invites')
      .insert(formattedInvites)
      .select('*');

    handlePostgrestError(error, 'Failed to create recruiter invites');

    const recruiterId = payload.invites[0]?.recruiterId || fallbackRecruiterId;

    if (recruiterId) {
      const activityEntries = formattedInvites.map((invite) => ({
        recruiter_id: recruiterId,
        opportunity_id: invite.opportunity_id,
        invite_id: invite.id,
        action: 'invite_sent',
        details: {
          email: invite.invitee_email,
          status: invite.status || 'pending',
        },
      }));

      await supabase.from('recruiter_activity_log').insert(activityEntries);
    }

    return data;
  }

  private async updateOpportunityStatus(
    payload: { opportunityId: string; status: OpportunityStatus },
    fallbackRecruiterId?: string,
  ) {
    if (!payload.opportunityId) {
      throw new Error('opportunityId is required to update status.');
    }

    if (!payload.status) {
      throw new Error('status is required to update opportunity.');
    }

    const { data, error } = await supabase
      .from('recruiter_opportunities')
      .update({
        status: payload.status,
        last_activity_at: new Date().toISOString(),
      })
      .eq('id', payload.opportunityId)
      .select('*')
      .single();

    handlePostgrestError(error, 'Failed to update recruiter opportunity status');

    if (fallbackRecruiterId) {
      await supabase.from('recruiter_activity_log').insert({
        recruiter_id: fallbackRecruiterId,
        opportunity_id: payload.opportunityId,
        action: 'opportunity_status_updated',
        details: {
          status: payload.status,
        },
      });
    }

    return data;
  }

  private async getAnalytics(payload: RecruiterAnalyticsPayload) {
    const { recruiterId } = payload;

    if (!recruiterId) {
      throw new Error('recruiterId is required to fetch analytics.');
    }

    const [{ data: overview, error: overviewError }, { data: opportunities, error: opportunitiesError }, { data: recentInvites, error: invitesError }] =
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
          .limit(15),
      ]);

    handlePostgrestError(overviewError, 'Failed to fetch recruiter analytics overview');
    handlePostgrestError(opportunitiesError, 'Failed to fetch recruiter opportunity rollup');
    handlePostgrestError(invitesError, 'Failed to fetch recruiter invite history');

    const inviteStats = (recentInvites || []).reduce(
      (acc, invite) => {
        acc.total += 1;
        acc.byStatus[invite.status as InviteStatus] =
          (acc.byStatus[invite.status as InviteStatus] || 0) + 1;
        return acc;
      },
      {
        total: 0,
        byStatus: {} as Record<InviteStatus, number>,
      },
    );

    return {
      overview,
      recentOpportunities: opportunities || [],
      recentInvites: recentInvites || [],
      inviteStats,
    };
  }

  getCapabilities(): string[] {
    return [
      'opportunity-creation',
      'candidate-invitation',
      'recruiter-analytics',
      'opportunity-status-tracking',
    ];
  }

  getStatus(): 'ready' | 'busy' | 'error' {
    return 'ready';
  }
}

