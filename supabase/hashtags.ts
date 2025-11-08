import { supabase } from '../utils/supabaseClient';
import type { Hashtag, HashtagCategory, HashtagSize, ReadySet } from '../types';

type HashtagSizeValues = `${HashtagSize}`;

interface HashtagCategoryRow {
  id: string;
  name: string;
  description?: string | null;
  hashtags?: HashtagRow[] | null;
}

interface HashtagRow {
  id: string;
  name: string;
  display_count?: string | null;
  size: HashtagSizeValues;
  tags?: string[] | null;
  popularity_score?: number | null;
  related_hashtags?: string[] | null;
}

interface ReadySetRow {
  id: string;
  title: string;
  description?: string | null;
  hashtags: string[];
  is_favorite?: boolean | null;
  created_at: string;
  updated_at: string;
  category:
    | {
        id: string;
        name: string;
      }
    | Array<{
        id: string;
        name: string;
      }>
    | null;
}

const toHashtagSize = (size: HashtagSizeValues): HashtagSize => {
  return size as HashtagSize;
};

const computeSetSize = (hashtagCount: number): HashtagSize => {
  if (hashtagCount >= 10) return 'Mega' as HashtagSize;
  if (hashtagCount >= 7) return 'Large' as HashtagSize;
  if (hashtagCount >= 5) return 'Medium' as HashtagSize;
  if (hashtagCount >= 3) return 'Small' as HashtagSize;
  return 'Micro' as HashtagSize;
};

const mapHashtagRow = (row: HashtagRow): Hashtag => ({
  name: row.name,
  count: row.display_count ?? '',
  size: toHashtagSize(row.size),
  tags: row.tags ?? undefined,
  popularityScore: row.popularity_score ?? undefined,
  relatedHashtags: row.related_hashtags ?? undefined,
});

const mapCategoryRow = (row: HashtagCategoryRow): HashtagCategory => ({
  category: row.name,
  hashtags: (row.hashtags ?? []).map(mapHashtagRow),
});

const mapReadySetRow = (row: ReadySetRow): ReadySet => {
  const categoryPayload = Array.isArray(row.category) ? row.category[0] : row.category;

  return {
    id: row.id,
    title: row.title,
    hashtags: row.hashtags ?? [],
    category: categoryPayload?.name ?? 'Uncategorised',
    description: row.description ?? undefined,
    size: computeSetSize(row.hashtags?.length ?? 0),
    isFavorite: Boolean(row.is_favorite),
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime(),
  };
};

export const HASHTAG_CATEGORIES_QUERY_KEY = ['supabase', 'hashtags', 'categories'] as const;
export const READY_SETS_QUERY_KEY = ['supabase', 'hashtags', 'ready-sets'] as const;

export async function fetchHashtagCategories(): Promise<HashtagCategory[]> {
  const { data, error } = await supabase
    .from('hashtag_categories')
    .select(
      `
        id,
        name,
        description,
        hashtags:hashtags (
          id,
          name,
          display_count,
          size,
          tags,
          popularity_score,
          related_hashtags
        )
      `,
    )
    .order('name', { ascending: true })
    .order('name', { foreignTable: 'hashtags', ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return [];
  }

  return data.map(mapCategoryRow);
}

export async function fetchReadySets(): Promise<ReadySet[]> {
  const { data, error } = await supabase
    .from('ready_sets')
    .select(
      `
        id,
        title,
        description,
        hashtags,
        is_favorite,
        created_at,
        updated_at,
        category:hashtag_categories (
          id,
          name
        )
      `,
    )
    .order('title', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return [];
  }

  return data.map(mapReadySetRow);
}


