import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../../utils/supabaseClient';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<{ error?: AuthError }>;
  signOut: () => Promise<{ error?: AuthError | null }>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Error getting session:', error);
        setError(error.message);
      } else {
        setSession(session);
        setUser(session?.user ?? null);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, session);

      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Handle different auth events
      switch (event) {
        case 'SIGNED_IN':
          console.log('User signed in:', session?.user?.email);
          setError(null);
          break;
        case 'SIGNED_OUT':
          console.log('User signed out');
          setError(null);
          break;
        case 'TOKEN_REFRESHED':
          console.log('Token refreshed');
          break;
        case 'USER_UPDATED':
          console.log('User updated');
          break;
        default:
          break;
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current origin for redirect
      const origin = window.location.origin;
      const redirectTo = `${origin}/auth/callback`;

      console.log('Initiating Google OAuth with redirect:', redirectTo);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
          scopes: 'email profile openid',
        },
      });

      if (error) {
        console.error('Google OAuth error:', error);
        setError(error.message);
        return { error };
      }

      console.log('Google OAuth initiated successfully:', data);
      return {};
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Unexpected error during Google OAuth:', err);
      setError(errorMessage);
      return { error: { message: errorMessage } as AuthError };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('Sign out error:', error);
        setError(error.message);
        return { error };
      }

      console.log('User signed out successfully');
      return {};
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Unexpected error during sign out:', err);
      setError(errorMessage);
      return { error: { message: errorMessage } as AuthError };
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    error,
    signInWithGoogle,
    signOut,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Auth callback component for handling OAuth redirects
export function AuthCallback() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Auth callback error:', error);
          setError(error.message);
        } else if (data.session) {
          console.log('Auth callback successful:', data.session.user?.email);
          // Redirect to main app
          window.location.href = '/';
        } else {
          setError('No session found after OAuth callback');
        }
      } catch (err) {
        console.error('Unexpected error in auth callback:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    handleAuthCallback();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-lg">Completing sign in...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <p className="text-lg text-red-400 mb-4">Authentication failed</p>
          <p className="text-sm text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.href = '/'}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            Return to App
          </button>
        </div>
      </div>
    );
  }

  return null;
}