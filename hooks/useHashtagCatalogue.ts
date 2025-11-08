import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { HashtagCategory, ReadySet } from '../types';
import { hashtagCategories as fallbackCategories, readySets as fallbackReadySets } from '../data/hashtags';
import {
  HASHTAG_CATEGORIES_QUERY_KEY,
  READY_SETS_QUERY_KEY,
  fetchHashtagCategories,
  fetchReadySets,
} from '../supabase/hashtags';

const parseBooleanEnv = (value: string | undefined): boolean => {
  if (value === undefined) {
    return true;
  }
  const normalised = value.toLowerCase();
  return !['0', 'false', 'off', 'no'].includes(normalised);
};

const isSupabaseDataEnabled = parseBooleanEnv(import.meta.env.VITE_SUPABASE_DATA as string | undefined);

interface SupabaseQueryResult<T> {
  data: T;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => void;
  isSupabaseEnabled: boolean;
  isUsingFallback: boolean;
}

const resolveQueryState = <T,>(
  enabled: boolean,
  queryData: {
    data: T | undefined;
    isLoading: boolean;
    isFetching: boolean;
    isError: boolean;
    error: unknown;
    refetch: () => void;
  },
  fallbackData: T,
): SupabaseQueryResult<T> => {
  const shouldUseFallback = !enabled || queryData.isError || !queryData.data;

  return {
    data: shouldUseFallback ? fallbackData : (queryData.data as T),
    isLoading: enabled ? queryData.isLoading : false,
    isFetching: enabled ? queryData.isFetching : false,
    isError: enabled ? queryData.isError : false,
    error: enabled ? queryData.error : undefined,
    refetch: queryData.refetch,
    isSupabaseEnabled: enabled,
    isUsingFallback: shouldUseFallback,
  };
};

export const useHashtagCategories = (): SupabaseQueryResult<HashtagCategory[]> => {
  const query = useQuery({
    queryKey: HASHTAG_CATEGORIES_QUERY_KEY,
    queryFn: fetchHashtagCategories,
    enabled: isSupabaseDataEnabled,
  });

  const fallback = useMemo(() => fallbackCategories, []);

  return resolveQueryState(isSupabaseDataEnabled, query, fallback);
};

export const useReadySets = (): SupabaseQueryResult<ReadySet[]> => {
  const query = useQuery({
    queryKey: READY_SETS_QUERY_KEY,
    queryFn: fetchReadySets,
    enabled: isSupabaseDataEnabled,
  });

  const fallback = useMemo(() => fallbackReadySets, []);

  return resolveQueryState(isSupabaseDataEnabled, query, fallback);
};


