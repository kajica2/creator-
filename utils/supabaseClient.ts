import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';

// Environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// Validate environment variables
const missingEnvVars = [
  !supabaseUrl ? 'VITE_SUPABASE_URL' : null,
  !supabaseAnonKey ? 'VITE_SUPABASE_ANON_KEY' : null,
].filter(Boolean);

if (missingEnvVars.length > 0) {
  const message = `Missing required Supabase environment variables: ${missingEnvVars.join(
    ', ',
  )}. Please set them in your Vite environment (e.g. .env.local).`;
  console.error(message);
  throw new Error(message);
}

// Custom fetch with timeout and retry logic
const customFetch = (url: RequestInfo | URL, options: RequestInit = {}) => {
  const timeout = 30000; // 30 seconds timeout
  const maxRetries = 3;

  const fetchWithTimeout = (attempt = 1): Promise<Response> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    return fetch(url, {
      ...options,
      signal: controller.signal,
    })
      .then(response => {
        clearTimeout(timeoutId);
        return response;
      })
      .catch(error => {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
          throw new Error('Request timeout');
        }
        if (attempt < maxRetries) {
          console.log(`Retry attempt ${attempt} for ${url}`);
          return new Promise(resolve =>
            setTimeout(() => resolve(fetchWithTimeout(attempt + 1)), 1000 * attempt)
          );
        }
        throw error;
      });
  };

  return fetchWithTimeout();
};

// Create Supabase client with enhanced configuration
export const supabase: SupabaseClient = createClient(supabaseUrl!, supabaseAnonKey!, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'reamp-auth-token',
    flowType: 'pkce', // More secure auth flow
  },
  global: {
    fetch: customFetch,
    headers: {
      'x-application-name': 'reamp',
    },
  },
  db: {
    schema: 'public',
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Storage bucket names
export const STORAGE_BUCKETS = {
  IMAGES: 'images',
  AUDIO: 'audio',
  VIDEOS: 'videos',
  DOCUMENTS: 'documents',
  AVATARS: 'avatars',
  HASHTAG_IMAGES: 'hashtag-images',
} as const;

// Database table names
export const TABLES = {
  USERS: 'users',
  HASHTAGS: 'hashtags',
  USER_HASHTAGS: 'user_hashtags',
  CONTENT: 'content',
  PERSONAS: 'personas',
  PERSONA_CONTENT: 'persona_content',
  USER_AUTHORITY: 'user_tag_authority',
  TAG_SIMILARITY: 'tag_similarity',
  USER_BADGES: 'user_badges',
  OBSIDIAN_SYNC: 'obsidian_sync_status',
  OBSIDIAN_NOTES: 'obsidian_notes',
} as const;

// Realtime subscriptions manager
class RealtimeManager {
  private channels: Map<string, RealtimeChannel> = new Map();

  subscribe(
    table: string,
    callback: (payload: any) => void,
    event: 'INSERT' | 'UPDATE' | 'DELETE' | '*' = '*'
  ): RealtimeChannel {
    const channelName = `${table}-${event}`;

    if (this.channels.has(channelName)) {
      return this.channels.get(channelName)!;
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event,
          schema: 'public',
          table,
        },
        callback
      )
      .subscribe();

    this.channels.set(channelName, channel);
    return channel;
  }

  unsubscribe(channelName: string) {
    const channel = this.channels.get(channelName);
    if (channel) {
      supabase.removeChannel(channel);
      this.channels.delete(channelName);
    }
  }

  unsubscribeAll() {
    this.channels.forEach(channel => {
      supabase.removeChannel(channel);
    });
    this.channels.clear();
  }
}

export const realtimeManager = new RealtimeManager();

// Health check function
export async function checkSupabaseHealth(): Promise<{
  connected: boolean;
  latency?: number;
  error?: string;
}> {
  const startTime = Date.now();

  try {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw error;
    }

    const latency = Date.now() - startTime;
    return { connected: true, latency };
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Helper function for storage URLs
export function getPublicUrl(bucket: string, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

// Helper function for signed URLs (temporary access)
export async function getSignedUrl(
  bucket: string,
  path: string,
  expiresIn = 3600
): Promise<{ url?: string; error?: Error }> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);

  if (error) {
    return { error };
  }

  return { url: data.signedUrl };
}

// User authority scoring functions
export async function updateUserAuthority(
  userId: string,
  tagId: string,
  score: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from(TABLES.USER_AUTHORITY)
      .upsert({
        user_id: userId,
        tag_id: tagId,
        authority_score: score,
        last_updated: new Date().toISOString(),
      });

    if (error) throw error;
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Tag similarity functions
export async function getRelatedTags(
  tagId: string,
  limit = 10
): Promise<{ tags?: any[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from(TABLES.TAG_SIMILARITY)
      .select('tag2_id, similarity_score')
      .eq('tag1_id', tagId)
      .order('similarity_score', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return { tags: data };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Export types for TypeScript
export type { SupabaseClient, RealtimeChannel };

// Log connection status
if (typeof window !== 'undefined') {
  checkSupabaseHealth().then(health => {
    if (health.connected) {
      console.log(`✅ Supabase connected (latency: ${health.latency}ms)`);
    } else {
      console.error('❌ Supabase connection failed:', health.error);
    }
  });
}