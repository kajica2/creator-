import { supabase } from '../../../utils/supabaseClient';
import { handlePostgrestError } from '../../../supabase/utils';

export type DuelStatus = 'pending' | 'active' | 'completed' | 'cancelled';

export interface DuelTagPlay {
  name: string;
  power?: number;
}

export interface TagDuel {
  id: string;
  challengerId: string | null;
  challengedId: string | null;
  challengerHandle: string;
  challengedHandle: string;
  stakeTags: string[];
  status: DuelStatus;
  winnerHandle?: string | null;
  metadata?: Record<string, any> | null;
  createdAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
  challengerScore?: number;
  challengedScore?: number;
  challengerCaptured?: string[];
  challengedCaptured?: string[];
}

export interface TagDuelRound {
  id: string;
  duelId: string;
  roundNumber: number;
  challengerTags: DuelTagPlay[];
  challengedTags: DuelTagPlay[];
  roundWinnerHandle?: string | null;
  capturedTags: string[];
  metrics?: Record<string, any>;
  createdAt: string;
}

export interface TagDuelScore {
  id: string;
  duelId: string;
  displayHandle: string;
  score: number;
  momentum: number;
  tagsCaptured: string[];
  updatedAt: string;
}

export interface TagDuelTransfer {
  id: string;
  duelId: string;
  roundId: string;
  tagName: string;
  fromHandle?: string | null;
  toHandle?: string | null;
  createdAt: string;
}

export interface CreateDuelInput {
  challengerHandle: string;
  challengedHandle: string;
  stakeTags: string[];
  challengerId?: string;
  challengedId?: string;
  metadata?: Record<string, any>;
}

export interface SubmitRoundInput {
  duelId: string;
  roundNumber: number;
  challengerHandle: string;
  challengedHandle: string;
  challengerTags: DuelTagPlay[];
  challengedTags: DuelTagPlay[];
}

export interface DuelDetails {
  duel: TagDuel;
  rounds: TagDuelRound[];
  scoreboard: TagDuelScore[];
  transfers: TagDuelTransfer[];
}

interface TagMetric {
  name: string;
  trendingScore: number;
  frequency: number;
}

const mapDuelRow = (row: any): TagDuel => ({
  id: row.id,
  challengerId: row.challenger_id,
  challengedId: row.challenged_id,
  challengerHandle: row.challenger_handle,
  challengedHandle: row.challenged_handle,
  stakeTags: row.stake_tags || [],
  status: row.status,
  winnerHandle: row.winner_handle,
  metadata: row.metadata,
  createdAt: row.created_at,
  startedAt: row.started_at,
  completedAt: row.completed_at,
  challengerScore: row.challenger_score,
  challengedScore: row.challenged_score,
  challengerCaptured: row.challenger_captured || [],
  challengedCaptured: row.challenged_captured || [],
});

const mapRoundRow = (row: any): TagDuelRound => ({
  id: row.id,
  duelId: row.duel_id,
  roundNumber: row.round_number,
  challengerTags: row.challenger_tags || [],
  challengedTags: row.challenged_tags || [],
  roundWinnerHandle: row.round_winner_handle,
  capturedTags: row.captured_tags || [],
  metrics: row.metrics || {},
  createdAt: row.created_at,
});

const mapScoreRow = (row: any): TagDuelScore => ({
  id: row.id,
  duelId: row.duel_id,
  displayHandle: row.display_handle,
  score: Number(row.score || 0),
  momentum: Number(row.momentum || 0),
  tagsCaptured: row.tags_captured || [],
  updatedAt: row.updated_at,
});

const mapTransferRow = (row: any): TagDuelTransfer => ({
  id: row.id,
  duelId: row.duel_id,
  roundId: row.round_id,
  tagName: row.tag_name,
  fromHandle: row.from_handle,
  toHandle: row.to_handle,
  createdAt: row.created_at,
});

class TagDuelService {
  async listDuels(status?: DuelStatus): Promise<TagDuel[]> {
    const query = supabase
      .from('tag_duel_overview')
      .select('*')
      .order('created_at', { ascending: false });

    if (status) {
      query.eq('status', status);
    }

    const { data, error } = await query;
    handlePostgrestError(error, 'Failed to list tag duels');

    return (data || []).map(mapDuelRow);
  }

  async getDuelDetails(duelId: string): Promise<DuelDetails> {
    const [
      { data: duelRow, error: duelError },
      { data: roundRows, error: roundsError },
      { data: scoreRows, error: scoresError },
      { data: transferRows, error: transfersError },
    ] = await Promise.all([
      supabase.from('tag_duel_overview').select('*').eq('id', duelId).maybeSingle(),
      supabase
        .from('tag_duel_rounds')
        .select('*')
        .eq('duel_id', duelId)
        .order('round_number', { ascending: true }),
      supabase
        .from('tag_duel_scores')
        .select('*')
        .eq('duel_id', duelId)
        .order('score', { ascending: false }),
      supabase
        .from('tag_duel_tag_transfers')
        .select('*')
        .eq('duel_id', duelId)
        .order('created_at', { ascending: true }),
    ]);

    handlePostgrestError(duelError, 'Failed to fetch duel');
    handlePostgrestError(roundsError, 'Failed to fetch duel rounds');
    handlePostgrestError(scoresError, 'Failed to fetch duel scores');
    handlePostgrestError(transfersError, 'Failed to fetch duel transfers');

    if (!duelRow) {
      throw new Error('Duel not found');
    }

    return {
      duel: mapDuelRow(duelRow),
      rounds: (roundRows || []).map(mapRoundRow),
      scoreboard: (scoreRows || []).map(mapScoreRow),
      transfers: (transferRows || []).map(mapTransferRow),
    };
  }

  async createDuel(input: CreateDuelInput): Promise<TagDuel> {
    if (!input.challengerHandle || !input.challengedHandle) {
      throw new Error('Challenger and opponent handles are required');
    }

    const { data, error } = await supabase
      .from('tag_duels')
      .insert({
        challenger_id: input.challengerId || null,
        challenged_id: input.challengedId || null,
        challenger_handle: input.challengerHandle,
        challenged_handle: input.challengedHandle,
        stake_tags: input.stakeTags || [],
        metadata: input.metadata || {},
      })
      .select('*')
      .single();

    handlePostgrestError(error, 'Failed to create tag duel');

    return mapDuelRow(data);
  }

  async startDuel(duelId: string): Promise<TagDuel> {
    const { data, error } = await supabase
      .from('tag_duels')
      .update({
        status: 'active',
        started_at: new Date().toISOString(),
      })
      .eq('id', duelId)
      .select('*')
      .single();

    handlePostgrestError(error, 'Failed to start duel');
    return mapDuelRow(data);
  }

  async submitRound(input: SubmitRoundInput): Promise<DuelDetails> {
    if (!input.challengerTags?.length && !input.challengedTags?.length) {
      throw new Error('At least one tag must be played in a round');
    }

    const duelDetails = await this.getDuelDetails(input.duelId);
    if (duelDetails.duel.status === 'pending') {
      await this.startDuel(input.duelId);
    }

    const challengerMetrics = await this.evaluateTagSet(input.challengerTags);
    const challengedMetrics = await this.evaluateTagSet(input.challengedTags);

    const challengerScore = challengerMetrics.totalScore;
    const challengedScore = challengedMetrics.totalScore;
    let roundWinnerHandle: string | null = null;
    let capturedTags: string[] = [];

    if (challengerScore > challengedScore) {
      roundWinnerHandle = input.challengerHandle;
      capturedTags = this.computeCapturedTags(input.challengerTags, input.challengedTags);
    } else if (challengedScore > challengerScore) {
      roundWinnerHandle = input.challengedHandle;
      capturedTags = this.computeCapturedTags(input.challengedTags, input.challengerTags);
    }

    const metrics = {
      challenger: challengerMetrics,
      challenged: challengedMetrics,
      roundWinner: roundWinnerHandle,
    };

    const { data: roundRow, error: roundError } = await supabase
      .from('tag_duel_rounds')
      .insert({
        duel_id: input.duelId,
        round_number: input.roundNumber,
        challenger_tags: input.challengerTags,
        challenged_tags: input.challengedTags,
        round_winner_handle: roundWinnerHandle,
        captured_tags: capturedTags,
        metrics,
      })
      .select('*')
      .single();

    handlePostgrestError(roundError, 'Failed to record duel round');

    const challengerDelta = challengerScore;
    const challengedDelta = challengedScore;

    await this.updateScorecard({
      duelId: input.duelId,
      handle: input.challengerHandle,
      deltaScore: challengerDelta,
      capturedTags: roundWinnerHandle === input.challengerHandle ? capturedTags : [],
      momentumDelta: challengerDelta - challengedDelta,
    });

    await this.updateScorecard({
      duelId: input.duelId,
      handle: input.challengedHandle,
      deltaScore: challengedDelta,
      capturedTags: roundWinnerHandle === input.challengedHandle ? capturedTags : [],
      momentumDelta: challengedDelta - challengerDelta,
    });

    if (capturedTags.length > 0 && roundWinnerHandle) {
      const fromHandle =
        roundWinnerHandle === input.challengerHandle
          ? input.challengedHandle
          : input.challengerHandle;

      await this.recordTransfers(
        input.duelId,
        roundRow.id,
        capturedTags.map((tag) => ({
          tagName: tag,
          fromHandle,
          toHandle: roundWinnerHandle!,
        })),
      );
    }

    return this.getDuelDetails(input.duelId);
  }

  async declareWinner(duelId: string, winnerHandle: string): Promise<TagDuel> {
    const { data, error } = await supabase
      .from('tag_duels')
      .update({
        status: 'completed',
        winner_handle: winnerHandle,
        completed_at: new Date().toISOString(),
      })
      .eq('id', duelId)
      .select('*')
      .single();

    handlePostgrestError(error, 'Failed to complete duel');
    return mapDuelRow(data);
  }

  async recordTransfers(
    duelId: string,
    roundId: string,
    transfers: Array<{ tagName: string; fromHandle?: string; toHandle?: string }>,
  ): Promise<TagDuelTransfer[]> {
    if (transfers.length === 0) return [];

    const payload = transfers.map((transfer) => ({
      duel_id: duelId,
      round_id: roundId,
      tag_name: transfer.tagName,
      from_handle: transfer.fromHandle || null,
      to_handle: transfer.toHandle || null,
    }));

    const { data, error } = await supabase
      .from('tag_duel_tag_transfers')
      .insert(payload)
      .select('*');

    handlePostgrestError(error, 'Failed to record tag transfers');
    return (data || []).map(mapTransferRow);
  }

  private async updateScorecard(input: {
    duelId: string;
    handle: string;
    deltaScore: number;
    capturedTags: string[];
    momentumDelta: number;
  }): Promise<TagDuelScore> {
    const { data: existingRow, error: existingError } = await supabase
      .from('tag_duel_scores')
      .select('*')
      .eq('duel_id', input.duelId)
      .eq('display_handle', input.handle)
      .maybeSingle();

    handlePostgrestError(existingError, 'Failed to load duel scorecard');

    const newScore = Number(existingRow?.score || 0) + input.deltaScore;
    const newMomentum = Number(existingRow?.momentum || 0) + input.momentumDelta;
    const captured = new Set(existingRow?.tags_captured || []);
    input.capturedTags.forEach((tag) => captured.add(tag));

    const { data, error } = await supabase
      .from('tag_duel_scores')
      .upsert(
        {
          id: existingRow?.id,
          duel_id: input.duelId,
          user_id: existingRow?.user_id || null,
          display_handle: input.handle,
          score: newScore,
          momentum: newMomentum,
          tags_captured: Array.from(captured),
        },
        { onConflict: 'duel_id,display_handle' },
      )
      .select('*')
      .single();

    handlePostgrestError(error, 'Failed to update duel scorecard');
    return mapScoreRow(data);
  }

  private computeCapturedTags(
    winnerTags: DuelTagPlay[],
    opponentTags: DuelTagPlay[],
  ): string[] {
    const opponentSet = new Set(opponentTags.map((tag) => tag.name.toLowerCase()));
    return winnerTags
      .map((tag) => tag.name)
      .filter((tag) => !opponentSet.has(tag.toLowerCase()));
  }

  private async evaluateTagSet(tags: DuelTagPlay[]): Promise<{
    totalScore: number;
    totalTrending: number;
    totalFrequency: number;
    breakdown: Array<TagMetric & { contribution: number; weight: number }>;
  }> {
    if (tags.length === 0) {
      return {
        totalScore: 0,
        totalTrending: 0,
        totalFrequency: 0,
        breakdown: [],
      };
    }

    const tagNames = Array.from(new Set(tags.map((tag) => tag.name)));
    const metrics = await this.fetchTagMetrics(tagNames);
    let totalScore = 0;
    let totalTrending = 0;
    let totalFrequency = 0;

    const breakdown = tags.map((tag) => {
      const metric =
        metrics.find((item) => item.name.toLowerCase() === tag.name.toLowerCase()) ||
        ({ name: tag.name, trendingScore: 5, frequency: 1 } as TagMetric);

      const weight = tag.power ?? 1;
      const contribution = metric.trendingScore * 2 + metric.frequency * 1.5 + weight * 10;

      totalTrending += metric.trendingScore;
      totalFrequency += metric.frequency;
      totalScore += contribution;

      return {
        ...metric,
        contribution,
        weight,
      };
    });

    return {
      totalScore,
      totalTrending,
      totalFrequency,
      breakdown,
    };
  }

  private async fetchTagMetrics(tags: string[]): Promise<TagMetric[]> {
    if (tags.length === 0) return [];

    const { data, error } = await supabase
      .from('hashtag_trending')
      .select('name, calculated_trending_score, frequency')
      .in('name', tags);

    if (error) {
      console.warn('Falling back to heuristic tag metrics:', error.message);
      return tags.map((name) => ({
        name,
        trendingScore: Math.random() * 10,
        frequency: Math.random() * 5,
      }));
    }

    return (data || []).map((row: any) => ({
      name: row.name,
      trendingScore: Number(row.calculated_trending_score || 0),
      frequency: Number(row.frequency || 0),
    }));
  }
}

export const tagDuelService = new TagDuelService();

