import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { AuthChangeEvent, Session, User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../utils/supabaseClient';
import type { User } from '../types';

interface SupabaseAuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
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
        return;
      }

      setSession(newSession);
      setSupabaseUser(newSession?.user ?? null);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
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
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Supabase sign-out failed:', error.message);
      throw error;
    }
  };

  const refreshSession = async () => {
    const { data, error } = await supabase.auth.refreshSession();
    if (error) {
      console.error('Supabase session refresh failed:', error.message);
      throw error;
    }
    setSession(data.session ?? null);
    setSupabaseUser(data.session?.user ?? null);
  };

  const value = useMemo<SupabaseAuthContextValue>(() => ({
    user: mapUser(supabaseUser, session),
    session,
    loading,
    signInWithGoogle,
    signOut,
    refreshSession,
  }), [session, supabaseUser, loading]);

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
