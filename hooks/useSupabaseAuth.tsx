import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { AuthChangeEvent, Session, User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../utils/supabaseClient';
import type { User } from '../types';

interface EmailCredentials {
  email: string;
  password: string;
}

interface MagicLinkPayload {
  email: string;
}

interface SupabaseAuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmailPassword: (credentials: EmailCredentials) => Promise<void>;
  signUpWithEmailPassword: (credentials: EmailCredentials) => Promise<void>;
  sendMagicLink: (payload: MagicLinkPayload) => Promise<void>;
  connectGoogleDrive: () => Promise<void>;
  latestProviderTokens: {
    accessToken: string | null;
    refreshToken: string | null;
  };
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const SupabaseAuthContext = createContext<SupabaseAuthContextValue | undefined>(undefined);

const mapUser = (supabaseUser: SupabaseUser | null, session: Session | null): User | null => {
  if (!supabaseUser || !session) {
    return null;
  }

  const metadata = supabaseUser.user_metadata || {};
  const displayName = metadata.full_name || metadata.name || supabaseUser.email?.split('@')[0] || 'User';
  const avatarUrl = metadata.avatar_url || metadata.picture || '';

  return {
    id: supabaseUser.id,
    name: displayName,
    email: supabaseUser.email ?? '',
    picture: avatarUrl,
    accessToken: session.access_token,
  };
};

export const SupabaseAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [providerAccessToken, setProviderAccessToken] = useState<string | null>(null);
  const [providerRefreshToken, setProviderRefreshToken] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const initialise = async () => {
      setLoading(true);
      const { data, error } = await supabase.auth.getSession();
      if (!isMounted) return;

      if (error) {
        console.error('Failed to initialise Supabase session:', error.message);
      }
      setSession(data.session ?? null);
      setSupabaseUser(data.session?.user ?? null);
      setProviderAccessToken(data.session?.provider_token ?? null);
      setProviderRefreshToken((data as any)?.session?.provider_refresh_token ?? null);
      setLoading(false);
    };

    initialise();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, newSession) => {
      if (!isMounted) {
        return;
      }

      if (event === 'SIGNED_OUT') {
        setSession(null);
        setSupabaseUser(null);
        setProviderAccessToken(null);
        setProviderRefreshToken(null);
        return;
      }

      setSession(newSession);
      setSupabaseUser(newSession?.user ?? null);
      setProviderAccessToken(newSession?.provider_token ?? null);
      setProviderRefreshToken((newSession as any)?.provider_refresh_token ?? null);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function signInWithGoogle() {
    const redirectTo = window.location.origin;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
      },
    });

    if (error) {
      console.error('Supabase Google sign-in failed:', error.message);
      throw error;
    }
  }

  async function signInWithEmailPassword({ email, password }: EmailCredentials) {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Supabase email sign-in failed:', error.message);
      throw error;
    }
  }

  async function signUpWithEmailPassword({ email, password }: EmailCredentials) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/admin`,
      },
    });

    if (error) {
      console.error('Supabase email sign-up failed:', error.message);
      throw error;
    }
  }

  async function sendMagicLink({ email }: MagicLinkPayload) {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${window.location.origin}/admin`,
      },
    });

    if (error) {
      console.error('Supabase magic link request failed:', error.message);
      throw error;
    }
  }

  async function connectGoogleDrive() {
    const { data, error } = await supabase.auth.linkWithOAuth({
      provider: 'google',
      options: {
        scopes: 'openid email https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.readonly',
        redirectTo: `${window.location.origin}/admin`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) {
      console.error('Supabase Google Drive linking failed:', error.message);
      throw error;
    }

    if (data?.url) {
      window.location.assign(data.url);
    }
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Supabase sign-out failed:', error.message);
      throw error;
    }
  }

  async function refreshSession() {
    const { data, error } = await supabase.auth.refreshSession();
    if (error) {
      console.error('Supabase session refresh failed:', error.message);
      throw error;
    }
    setSession(data.session ?? null);
    setSupabaseUser(data.session?.user ?? null);
    setProviderAccessToken(data.session?.provider_token ?? null);
    setProviderRefreshToken((data as any)?.session?.provider_refresh_token ?? null);
  }

  const value = useMemo<SupabaseAuthContextValue>(() => ({
    user: mapUser(supabaseUser, session),
    session,
    loading,
    signInWithGoogle,
    signInWithEmailPassword,
    signUpWithEmailPassword,
    sendMagicLink,
    connectGoogleDrive,
    latestProviderTokens: {
      accessToken: providerAccessToken,
      refreshToken: providerRefreshToken,
    },
    signOut,
    refreshSession,
  }), [session, supabaseUser, loading, providerAccessToken, providerRefreshToken]);

  return (
    <SupabaseAuthContext.Provider value={value}>
      {children}
    </SupabaseAuthContext.Provider>
  );
};

export const useSupabaseAuth = (): SupabaseAuthContextValue => {
  const context = useContext(SupabaseAuthContext);
  if (!context) {
    throw new Error('useSupabaseAuth must be used within a SupabaseAuthProvider');
  }
  return context;
};
