import type { Persona } from '../types';
import { supabase } from '../utils/supabaseClient';
import {
  handlePostgrestError,
  requireCurrentUserId,
  SupabaseQueryError,
} from './utils';

interface PersonaRow {
  id: string;
  user_id: string;
  name: string;
  context: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  content_count: number | null;
}

const mapPersonaRow = (row: PersonaRow): Persona => ({
  id: row.id,
  name: row.name,
  context: row.context ?? '',
  isDefault: Boolean(row.is_default),
  createdAt: new Date(row.created_at).getTime(),
  updatedAt: new Date(row.updated_at).getTime(),
  contentCount: row.content_count ?? 0,
});

export const listPersonas = async (): Promise<Persona[]> => {
  const userId = await requireCurrentUserId();
  const { data, error } = await supabase
    .from('personas')
    .select(
      'id, user_id, name, context, is_default, created_at, updated_at, content_count',
    )
    .eq('user_id', userId)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: true });

  handlePostgrestError(error, 'Failed to fetch personas');

  return (data ?? []).map(mapPersonaRow);
};

export const getPersonaById = async (personaId: string): Promise<Persona | null> => {
  const userId = await requireCurrentUserId();
  const { data, error } = await supabase
    .from('personas')
    .select(
      'id, user_id, name, context, is_default, created_at, updated_at, content_count',
    )
    .eq('user_id', userId)
    .eq('id', personaId)
    .maybeSingle();

  handlePostgrestError(error, 'Failed to fetch persona');

  return data ? mapPersonaRow(data as PersonaRow) : null;
};

export const createPersona = async (input: {
  name: string;
  context?: string;
  isDefault?: boolean;
}): Promise<Persona> => {
  const userId = await requireCurrentUserId();

  const { data, error } = await supabase
    .from('personas')
    .insert({
      user_id: userId,
      name: input.name.trim(),
      context: input.context ?? '',
      is_default: Boolean(input.isDefault),
    })
    .select(
      'id, user_id, name, context, is_default, created_at, updated_at, content_count',
    )
    .single();

  handlePostgrestError(error, 'Failed to create persona');

  if (!data) {
    throw new SupabaseQueryError('Personas insert returned no data.');
  }

  return mapPersonaRow(data as PersonaRow);
};

export const updatePersona = async (
  personaId: string,
  updates: {
    name?: string;
    context?: string;
    isDefault?: boolean;
  },
): Promise<Persona> => {
  const userId = await requireCurrentUserId();

  const payload: Record<string, unknown> = {};
  if (updates.name !== undefined) payload.name = updates.name.trim();
  if (updates.context !== undefined) payload.context = updates.context;
  if (updates.isDefault !== undefined) payload.is_default = updates.isDefault;

  const { data, error } = await supabase
    .from('personas')
    .update({
      ...payload,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('id', personaId)
    .select(
      'id, user_id, name, context, is_default, created_at, updated_at, content_count',
    )
    .single();

  handlePostgrestError(error, 'Failed to update persona');

  if (!data) {
    throw new SupabaseQueryError('Persona update returned no data.');
  }

  return mapPersonaRow(data as PersonaRow);
};

export const deletePersona = async (personaId: string): Promise<void> => {
  const userId = await requireCurrentUserId();

  const { error } = await supabase
    .from('personas')
    .delete()
    .eq('user_id', userId)
    .eq('id', personaId);

  handlePostgrestError(error, 'Failed to delete persona');
};

export const ensureDefaultPersona = async (): Promise<Persona> => {
  const existing = await listPersonas();
  const defaultPersona = existing.find(persona => persona.isDefault);

  if (defaultPersona) {
    return defaultPersona;
  }

  const fallback = existing[0];
  if (fallback) {
    if (!fallback.isDefault) {
      return updatePersona(fallback.id, { isDefault: true });
    }
    return fallback;
  }

  return createPersona({
    name: 'Default Persona',
    context: '',
    isDefault: true,
  });
};

export const setDefaultPersona = async (personaId: string): Promise<void> => {
  const userId = await requireCurrentUserId();

  const { error: clearError } = await supabase
    .from('personas')
    .update({ is_default: false })
    .eq('user_id', userId)
    .neq('id', personaId);

  handlePostgrestError(clearError, 'Failed to clear default persona flag');

  const { error } = await supabase
    .from('personas')
    .update({ is_default: true })
    .eq('user_id', userId)
    .eq('id', personaId);

  handlePostgrestError(error, 'Failed to set default persona');
};

