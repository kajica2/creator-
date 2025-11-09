import type { Page, PromptType, StoredContentItem } from '../types';
import { supabase } from '../utils/supabaseClient';
import {
  handlePostgrestError,
  requireCurrentUserId,
  SupabaseQueryError,
} from './utils';

interface PersonaContentRow {
  id: string;
  persona_id: string;
  user_id: string;
  tool: string;
  prompt_type: PromptType;
  content: unknown;
  hashtags: string[] | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  personas?: {
    name: string;
  } | null;
}

const mapContentRow = (row: PersonaContentRow): StoredContentItem => ({
  id: row.id,
  personaId: row.persona_id,
  personaName: row.personas?.name ?? '',
  tool: row.tool as Page,
  type: row.prompt_type,
  content: row.content,
  hashtags: row.hashtags ?? [],
  metadata: (row.metadata as Record<string, unknown> | undefined) ?? {},
  timestamp: new Date(row.created_at).getTime(),
});

export const listContentByPersona = async (personaId: string): Promise<StoredContentItem[]> => {
  const userId = await requireCurrentUserId();
  const { data, error } = await supabase
    .from('persona_content')
    .select(
      'id, persona_id, user_id, tool, prompt_type, content, hashtags, metadata, created_at, personas(name)',
    )
    .eq('user_id', userId)
    .eq('persona_id', personaId)
    .order('created_at', { ascending: false });

  handlePostgrestError(error, 'Failed to fetch persona content');

  return (data ?? []).map(mapContentRow);
};

export const listAllContent = async (): Promise<StoredContentItem[]> => {
  const userId = await requireCurrentUserId();
  const { data, error } = await supabase
    .from('persona_content')
    .select(
      'id, persona_id, user_id, tool, prompt_type, content, hashtags, metadata, created_at, personas(name)',
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  handlePostgrestError(error, 'Failed to fetch persona content feed');

  return (data ?? []).map(mapContentRow);
};

export const listRecentContent = async (limit = 20): Promise<StoredContentItem[]> => {
  const userId = await requireCurrentUserId();
  const { data, error } = await supabase
    .from('persona_content')
    .select(
      'id, persona_id, user_id, tool, prompt_type, content, hashtags, metadata, created_at, personas(name)',
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  handlePostgrestError(error, 'Failed to fetch recent persona content');

  return (data ?? []).map(mapContentRow);
};

export const createPersonaContent = async (input: {
  personaId: string;
  tool: Page;
  promptType: PromptType;
  content: unknown;
  hashtags?: string[];
  metadata?: Record<string, unknown>;
}): Promise<StoredContentItem> => {
  const userId = await requireCurrentUserId();

  const { data, error } = await supabase
    .from('persona_content')
    .insert({
      persona_id: input.personaId,
      user_id: userId,
      tool: input.tool,
      prompt_type: input.promptType,
      content: input.content,
      hashtags: input.hashtags ?? [],
      metadata: input.metadata ?? {},
    })
    .select(
      'id, persona_id, user_id, tool, prompt_type, content, hashtags, metadata, created_at, personas(name)',
    )
    .single();

  handlePostgrestError(error, 'Failed to create persona content');

  if (!data) {
    throw new SupabaseQueryError('Persona content insert returned no data.');
  }

  return mapContentRow(data as PersonaContentRow);
};

export const deletePersonaContent = async (contentId: string): Promise<void> => {
  const userId = await requireCurrentUserId();

  const { error } = await supabase
    .from('persona_content')
    .delete()
    .eq('user_id', userId)
    .eq('id', contentId);

  handlePostgrestError(error, 'Failed to delete persona content');
};

export const searchPersonaContent = async (query: string): Promise<StoredContentItem[]> => {
  const trimmedQuery = query.trim().toLowerCase();

  if (!trimmedQuery) {
    return listRecentContent();
  }

  const allContent = await listRecentContent(200);

  return allContent.filter(item => {
    const personaNameMatch = item.personaName.toLowerCase().includes(trimmedQuery);
    const toolMatch = item.tool.toLowerCase().includes(trimmedQuery);
    const typeMatch = item.type.toLowerCase().includes(trimmedQuery);
    const hashtagMatch = item.hashtags.some(tag => tag.toLowerCase().includes(trimmedQuery));
    const metadataMatch = JSON.stringify(item.metadata ?? {})
      .toLowerCase()
      .includes(trimmedQuery);
    const contentMatch = JSON.stringify(item.content ?? {})
      .toLowerCase()
      .includes(trimmedQuery);

    return personaNameMatch || toolMatch || typeMatch || hashtagMatch || metadataMatch || contentMatch;
  });
};

