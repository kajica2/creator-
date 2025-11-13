import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { logEntrance } from '../services/entrance/logEntrance';
import { supabase } from '../../utils/supabaseClient';
import { useSupabaseAuth } from '../../hooks/useSupabaseAuth';
import { DatabaseSetup } from './DatabaseSetup';
import SupabasePanel from './SupabasePanel';
import { PersistentFooter } from './PersistentFooter';

export function EntranceHub(): JSX.Element {
  const {
    user,
    loading,
    signInWithGoogle,
    signInWithEmailPassword,
    signUpWithEmailPassword,
    sendMagicLink,
    connectGoogleDrive,
    latestProviderTokens,
    signOut,
  } = useSupabaseAuth();

  const [selectedRole, setSelectedRole] = useState<SelectedRole>('landing');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAdminAuthPending, setIsAdminAuthPending] = useState(false);
  const [adminStage, setAdminStage] = useState<'login' | 'dashboard'>('login');
  const [hasLoggedAdminEntry, setHasLoggedAdminEntry] = useState(false);
  const [adminLogId, setAdminLogId] = useState<string | null>(null);
  const [geminiStatus, setGeminiStatus] = useState<GeminiStatus>('idle');
  const [geminiError, setGeminiError] = useState<string | null>(null);
  const [driveLogged, setDriveLogged] = useState(false);
  const [entranceLogs, setEntranceLogs] = useState<EntranceLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [credentialSummary, setCredentialSummary] = useState<AdminCredentialSummary | null>(null);

  const visitIdRef = useRef<string>(createVisitId());

  const visitorDescription = useMemo(
    () => 'Explore public tools with read-only access. No authentication required.',
    []
  );
  const userDescription = useMemo(
    () => 'Access personalized features and save preferences. Basic authentication optional.',
    []
  );
  const adminDescription = useMemo(
    () =>
      'Full access to analytics, Drive integration, and Gemini workflows. Requires Supabase credentials.',
    []
  );

  const resetMessages = useCallback(() => {
    setStatusMessage(null);
    setErrorMessage(null);
  }, []);

  const handleVisitorEntrance = useCallback(async () => {
    resetMessages();
    setIsProcessing(true);
    try {
      await logEntrance({
        role: 'visitor',
        metadata: { visitId: visitIdRef.current },
      });
      setSelectedRole('visitor');
      setStatusMessage('Visitor session recorded.');
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Unable to log visitor entrance.'));
    } finally {
      setIsProcessing(false);
    }
  }, [resetMessages]);

  const handleUserEntrance = useCallback(async () => {
    resetMessages();
    setIsProcessing(true);
    try {
      await logEntrance({
        role: 'user',
        metadata: { visitId: visitIdRef.current },
      });
      setSelectedRole('user');
      setStatusMessage('User entrance recorded.');
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Unable to log user entrance.'));
    } finally {
      setIsProcessing(false);
    }
  }, [resetMessages]);

  const handleAdminSelected = useCallback(() => {
    resetMessages();
    setSelectedRole('admin');
    setAdminStage(user ? 'dashboard' : 'login');
    setStatusMessage('Admin access requires Supabase authentication.');
  }, [resetMessages, user]);

  useEffect(() => {
    if (selectedRole !== 'admin') {
      return;
    }

    if (!user) {
      setAdminStage('login');
      setHasLoggedAdminEntry(false);
      setDriveLogged(false);
      setCredentialSummary(null);
      setEntranceLogs([]);
      return;
    }

    setAdminStage('dashboard');
  }, [selectedRole, user]);

  const fetchAdminData = useCallback(async () => {
    if (!user) {
      return;
    }

    setIsLoadingLogs(true);
    try {
      const [{ data: logs, error: logsError }, { data: profile, error: profileError }] = await Promise.all([
        supabase
          .from('entrance_logs')
          .select('id, role, ip_address, user_agent, drive_connected, created_at')
          .order('created_at', { ascending: false })
          .limit(50),
        supabase
          .from('admin_users')
          .select('email, gemini_api_key_last4, drive_refresh_token, created_at')
          .eq('id', user.id)
          .maybeSingle(),
      ]);

      if (logsError) {
        throw logsError;
      }
      if (profileError) {
        throw profileError;
      }

      setEntranceLogs(
        (logs ?? []).map(item => ({
          id: item.id,
          role: item.role,
          ipAddress: item.ip_address,
          userAgent: item.user_agent,
          driveConnected: item.drive_connected,
          createdAt: item.created_at,
        }))
      );

      setCredentialSummary(
        profile
          ? {
              email: profile.email ?? '',
              geminiKeyLast4: profile.gemini_api_key_last4 ?? null,
              driveConnected: Boolean(profile.drive_refresh_token),
              createdAt: profile.created_at ?? null,
            }
          : null
      );
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Failed to load admin analytics.'));
    } finally {
      setIsLoadingLogs(false);
    }
  }, [user]);

  useEffect(() => {
    if (selectedRole === 'admin' && adminStage === 'dashboard' && user) {
      void fetchAdminData();
    }
  }, [selectedRole, adminStage, user, fetchAdminData]);

  useEffect(() => {
    if (selectedRole !== 'admin' || !user || hasLoggedAdminEntry) {
      return;
    }

    setIsProcessing(true);
    logEntrance({
      role: 'admin',
      metadata: { visitId: visitIdRef.current },
    })
      .then(result => {
        setAdminLogId(result.logId);
        setStatusMessage('Admin entrance recorded.');
      })
      .catch(error => {
        setErrorMessage(getErrorMessage(error, 'Failed to log admin entrance.'));
      })
      .finally(() => {
        setHasLoggedAdminEntry(true);
        setIsProcessing(false);
      });
  }, [selectedRole, user, hasLoggedAdminEntry]);

  useEffect(() => {
    if (selectedRole !== 'admin' || !user) {
      return;
    }
    if (!latestProviderTokens.refreshToken) {
      return;
    }
    if (driveLogged) {
      return;
    }

    logEntrance({
      role: 'admin',
      drive: { isConnected: true, refreshToken: latestProviderTokens.refreshToken },
      metadata: { visitId: visitIdRef.current },
    })
      .then(() => {
        setDriveLogged(true);
        setStatusMessage('Google Drive refresh token securely stored.');
        void fetchAdminData();
      })
      .catch(error => {
        setErrorMessage(getErrorMessage(error, 'Failed to persist Google Drive token.'));
      });
  }, [selectedRole, user, latestProviderTokens.refreshToken, driveLogged, fetchAdminData]);

  const handleAdminSignIn = useCallback(
    async (credentials: EmailCredentials) => {
      setIsAdminAuthPending(true);
      resetMessages();
      try {
        await signInWithEmailPassword(credentials);
        setStatusMessage('Signed in. Loading admin dashboard…');
      } catch (error) {
        setErrorMessage(getErrorMessage(error, 'Email sign-in failed.'));
      } finally {
        setIsAdminAuthPending(false);
      }
    },
    [signInWithEmailPassword, resetMessages]
  );

  const handleUserGoogleSignIn = useCallback(async () => {
    resetMessages();
    try {
      await signInWithGoogle();
      setStatusMessage('Redirecting to Google for quick authentication…');
    } catch (error) {
      // Handle OAuth configuration error specifically
      if (error instanceof Error && error.name === 'OAuthConfigurationError') {
        setErrorMessage(
          'Google OAuth not configured. Please enable Google OAuth provider in Supabase Dashboard. See docs/OAUTH_CONFIGURATION_GUIDE.md for setup instructions.'
        );
      } else {
        setErrorMessage(getErrorMessage(error, 'Google sign-in failed.'));
      }
    }
  }, [signInWithGoogle, resetMessages]);

  const handleAdminSignUp = useCallback(
    async (credentials: EmailCredentials) => {
      setIsAdminAuthPending(true);
      resetMessages();
      try {
        await signUpWithEmailPassword(credentials);
        setStatusMessage('Account created. Please verify your inbox.');
      } catch (error) {
        const message = getErrorMessage(error, 'Account creation failed.');
        setErrorMessage(message);
        throw new Error(message);
      } finally {
        setIsAdminAuthPending(false);
      }
    },
    [signUpWithEmailPassword, resetMessages]
  );

  const handleMagicLink = useCallback(
    async ({ email }: MagicLinkPayload) => {
      setIsAdminAuthPending(true);
      resetMessages();
      try {
        await sendMagicLink({ email });
        setStatusMessage('Magic link sent. Check your email.');
      } catch (error) {
        const message = getErrorMessage(error, 'Magic link request failed.');
        setErrorMessage(message);
        throw new Error(message);
      } finally {
        setIsAdminAuthPending(false);
      }
    },
    [sendMagicLink, resetMessages]
  );

  const handleSaveGeminiKey = useCallback(
    async ({ apiKey, projectId }: GeminiFormPayload) => {
      setGeminiStatus('saving');
      setGeminiError(null);
      try {
        await logEntrance({
          role: 'admin',
          gemini: {
            apiKey: apiKey.trim(),
            projectId: projectId ? projectId.trim() : undefined,
          },
          metadata: { visitId: visitIdRef.current },
        });
        setGeminiStatus('success');
        setStatusMessage('Gemini API key stored successfully.');
        void fetchAdminData();
      } catch (error) {
        setGeminiStatus('error');
        const message = getErrorMessage(error, 'Failed to store Gemini API key.');
        setGeminiError(message);
        setErrorMessage(message);
      }
    },
    [fetchAdminData]
  );

  const handleConnectDrive = useCallback(async () => {
    resetMessages();
    try {
      await connectGoogleDrive();
      setStatusMessage('Redirecting to Google for Drive permissions…');
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Unable to start Google Drive connection.'));
    }
  }, [connectGoogleDrive, resetMessages]);

  const handleRefreshLogs = useCallback(async () => {
    resetMessages();
    await fetchAdminData();
    setStatusMessage('Admin analytics refreshed.');
  }, [fetchAdminData, resetMessages]);

  const handleAdminSignOut = useCallback(async () => {
    resetMessages();
    try {
      await signOut();
      setSelectedRole('landing');
      setStatusMessage('Signed out successfully.');
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Sign-out failed.'));
    }
  }, [signOut, resetMessages]);

  return (
    <div className="relative min-h-screen pb-16">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-10 py-16 px-4 sm:px-6 lg:px-8">
        <header className="space-y-3 text-center">
          <p className="inline-flex items-center rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-300">
            Session Entrances
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Choose your access lane to the Viral Hashtag & Image AI platform
          </h1>
          <p className="mx-auto max-w-3xl text-base text-slate-300">
            Every entrance logs IP and cookie metadata securely in Supabase. Admins must authenticate and
            connect Google Drive plus Gemini before gaining full control.
          </p>
        </header>

      {(statusMessage || errorMessage) && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            errorMessage
              ? 'border-red-500/40 bg-red-500/10 text-red-200'
              : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
          }`}
        >
          {errorMessage ?? statusMessage}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        <RoleCard
          title="Visitor"
          summary={visitorDescription}
          accent="from-slate-800 to-slate-900"
          actionLabel="Enter as Visitor"
          onClick={handleVisitorEntrance}
          disabled={isProcessing}
        />
        <RoleCard
          title="User"
          summary={userDescription}
          accent="from-blue-800 to-blue-900"
          actionLabel="Enter as User"
          onClick={handleUserEntrance}
          disabled={isProcessing}
        />
        <RoleCard
          title="Admin"
          summary={adminDescription}
          accent="from-purple-800 to-purple-900"
          actionLabel="Admin Control Room"
          onClick={handleAdminSelected}
          disabled={loading || isProcessing}
        />
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl shadow-black/20">
        {selectedRole === 'visitor' && <VisitorView />}
        {selectedRole === 'user' && <UserView onSignInWithGoogle={handleUserGoogleSignIn} />}
        {selectedRole === 'admin' && (
          <>
            {adminStage === 'login' && (
              <AdminLoginForm
                isLoading={loading}
                isSubmitting={isAdminAuthPending}
                errorMessage={errorMessage}
                onSignIn={handleAdminSignIn}
                onSignUp={handleAdminSignUp}
                onMagicLink={handleMagicLink}
              />
            )}
            {adminStage === 'dashboard' && user && (
              <AdminDashboard
                userEmail={user.email}
                adminLogId={adminLogId}
                logs={entranceLogs}
                isLoadingLogs={isLoadingLogs}
                onRefreshLogs={handleRefreshLogs}
                onConnectDrive={handleConnectDrive}
                driveConnected={credentialSummary?.driveConnected ?? false}
                onSaveGeminiKey={handleSaveGeminiKey}
                geminiStatus={geminiStatus}
                geminiError={geminiError}
                geminiKeyLast4={credentialSummary?.geminiKeyLast4 ?? null}
                onSignOut={handleAdminSignOut}
              />
            )}
          </>
        )}
        {selectedRole === 'landing' && (
          <div className="space-y-4 text-slate-300">
            <h2 className="text-xl font-semibold text-white">Pick a lane to get started</h2>
            <p>
              We instrument every entrance for compliance and analytics. Visitor and User modes are frictionless,
              while Admins must validate through Supabase Auth, connect Google Drive, and supply a Gemini API key.
            </p>
          </div>
        )}
      </div>
    </section>
    <PersistentFooter onNavigate={() => {}} />
  </div>
  );
}

function RoleCard(props: RoleCardProps): JSX.Element {
  const { title, summary, actionLabel, onClick, disabled, accent } = props;
  return (
    <article className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
      <div className={`absolute inset-0 bg-gradient-to-br ${accent} opacity-60 transition-opacity group-hover:opacity-80`} />
      <div className="relative z-10 flex h-full flex-col justify-between space-y-4 p-6">
        <div className="space-y-3">
          <h2 className="text-xl font-semibold text-white">{title}</h2>
          <p className="text-sm text-slate-200/90">{summary}</p>
        </div>
        <button
          type="button"
          onClick={onClick}
          disabled={disabled}
          className="inline-flex items-center justify-center rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {actionLabel}
        </button>
      </div>
    </article>
  );
}

function VisitorView(): JSX.Element {
  const handleAccessApp = () => {
    window.location.href = '?app=true';
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-white">Visitor Mode</h2>
      <p className="text-sm text-slate-300">
        You are browsing as a visitor. Your IP address and a sanitized snapshot of cookies were logged for auditing.
        Visitor mode grants read-only access to public data and sample AI outputs. Upgrade to User for persistent
        personalization or request Admin credentials for full control.
      </p>

      {/* Quick Access to Main App */}
      <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">🚀 Try Content Creation Tools</h3>
            <p className="text-sm text-slate-300">Access all AI-powered content creation tools</p>
          </div>
          <button
            onClick={handleAccessApp}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg"
          >
            Launch App
          </button>
        </div>
      </div>

      <ul className="grid gap-3 text-sm text-slate-200/80 sm:grid-cols-2">
        <li className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">Hashtag explorer (read-only)</li>
        <li className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">Sample AI media gallery</li>
        <li className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">Public performance dashboards</li>
        <li className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">Live release notes timeline</li>
      </ul>
    </div>
  );
}

function UserView(props: UserViewProps): JSX.Element {
  const { onSignInWithGoogle } = props;

  const handleAccessApp = () => {
    window.location.href = '?app=true';
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-white">User Mode</h2>
        <p className="text-sm text-slate-300">
          User mode unlocks personalized hashtag curation, saved AI prompts, and progress dashboards. Authenticate with
          Supabase or continue anonymously for transient sessions.
        </p>
      </div>

      {/* Quick Access to Main App */}
      <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">🎨 Content Creation Suite</h3>
            <p className="text-sm text-slate-300">Full access to all AI-powered creation tools</p>
          </div>
          <button
            onClick={handleAccessApp}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg"
          >
            Launch App
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Fast entry</h3>
        <p className="mt-2 text-sm text-slate-300">
          Sign in with Google to synchronize settings across devices, or explore anonymously with limited storage.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => onSignInWithGoogle().catch(() => {
              // errors surfaced via context consumer
            })}
            className="inline-flex items-center rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
          >
            Continue with Google
          </button>
          <span className="text-xs text-slate-400">
            Authentication optional. We still log entrance metadata for analytics compliance.
          </span>
        </div>
      </div>
    </div>
  );
}

function AdminLoginForm(props: AdminLoginFormProps): JSX.Element {
  const { isLoading, isSubmitting, errorMessage, onSignIn, onSignUp, onMagicLink } = props;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localMessage, setLocalMessage] = useState<string | null>(null);

  const disabled = isLoading || isSubmitting;

  const handleSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLocalMessage(null);
    await onSignIn({ email, password });
  };

  const handleSignUp = async () => {
    setLocalMessage(null);
    try {
      await onSignUp({ email, password });
      setLocalMessage('Account created. Verify your email to finish activation.');
    } catch {
      // Error surfaced by parent handler
    }
  };

  const handleMagicLink = async () => {
    setLocalMessage(null);
    try {
      await onMagicLink({ email });
      setLocalMessage('Magic link dispatched. Check your inbox.');
    } catch {
      // Error surfaced by parent handler
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-white">Admin Authentication</h2>
        <p className="text-sm text-slate-300">
          Admin access mandates Supabase email + password credentials. Magic link fallback is available, and all other
          providers remain disabled.
        </p>
      </div>
      <form onSubmit={handleSignIn} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={event => setEmail(event.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/40"
            />
          </label>
          <label className="flex flex-col space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Password</span>
            <input
              type="password"
              required
              value={password}
              onChange={event => setPassword(event.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/40"
            />
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={disabled}
            className="inline-flex items-center rounded-full bg-purple-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/60 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={handleSignUp}
            className="inline-flex items-center rounded-full border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-slate-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-slate-400/40 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Create admin account
          </button>
          <button
            type="button"
            disabled={disabled || !email}
            onClick={handleMagicLink}
            className="inline-flex items-center rounded-full border border-emerald-500/60 px-4 py-2 text-sm font-semibold text-emerald-200 transition hover:border-emerald-400 hover:text-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Send magic link
          </button>
        </div>
      </form>
      {(errorMessage || localMessage) && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            errorMessage
              ? 'border-red-500/40 bg-red-500/10 text-red-200'
              : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100'
          }`}
        >
          {errorMessage ?? localMessage}
        </div>
      )}
      <p className="text-xs text-slate-500">
        By continuing you consent to logging of IP, cookie snapshot, user agent, Google Drive tokens, and Gemini API key
        metadata for compliance and auditing.
      </p>
    </div>
  );
}

function AdminDashboard(props: AdminDashboardProps): JSX.Element {
  const {
    userEmail,
    adminLogId,
    logs,
    isLoadingLogs,
    onRefreshLogs,
    onConnectDrive,
    driveConnected,
    onSaveGeminiKey,
    geminiStatus,
    geminiError,
    geminiKeyLast4,
    onSignOut,
  } = props;

  const [apiKey, setApiKey] = useState('');
  const [projectId, setProjectId] = useState('');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSaveGeminiKey({ apiKey, projectId });
    setApiKey('');
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Admin Control Room</h2>
          <p className="text-sm text-slate-300">
            Signed in as <span className="font-semibold text-white">{userEmail}</span>. Latest log id:{' '}
            <span className="font-mono text-emerald-300">{adminLogId ?? 'pending…'}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={onSignOut}
          className="inline-flex items-center rounded-full border border-red-500/60 px-4 py-2 text-sm font-semibold text-red-200 transition hover:border-red-400 hover:text-red-100 focus:outline-none focus:ring-2 focus:ring-red-400/40"
        >
          Sign out
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-4 rounded-xl border border-slate-800 bg-slate-950/60 p-5">
          <header className="space-y-1">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Google Drive</h3>
            <p className="text-sm text-slate-300">
              Connect to Google Drive to ingest campaign creatives. We request offline access and log refresh tokens in
              Supabase using service-role privileges.
            </p>
          </header>
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                driveConnected ? 'bg-emerald-500/20 text-emerald-200' : 'bg-slate-700 text-slate-200'
              }`}
            >
              {driveConnected ? 'Drive connected' : 'Drive not connected'}
            </span>
            <button
              type="button"
              onClick={onConnectDrive}
              className="inline-flex items-center rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
            >
              Connect Google Drive
            </button>
          </div>
          <p className="text-xs text-slate-500">
            On successful OAuth, a refresh token is stored in the `admin_users` table via the `log-entrance` Supabase
            Edge Function.
          </p>
        </section>

        <section className="space-y-4 rounded-xl border border-slate-800 bg-slate-950/60 p-5">
          <header className="space-y-1">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Gemini API key</h3>
            <p className="text-sm text-slate-300">
              Provide your Google Gemini API key to unlock AI generation. Keys are persisted in `admin_users` with RLS
              constraints restricting exposure to the owning admin account.
            </p>
          </header>
          <form onSubmit={handleSubmit} className="space-y-3">
            <label className="flex flex-col space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Gemini API key</span>
              <input
                type="text"
                required
                value={apiKey}
                onChange={event => setApiKey(event.target.value)}
                placeholder="AIzz...."
                className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/40"
              />
            </label>
            <label className="flex flex-col space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Gemini project id</span>
              <input
                type="text"
                value={projectId}
                onChange={event => setProjectId(event.target.value)}
                placeholder="projects/your-gemini-project"
                className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/40"
              />
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                className="inline-flex items-center rounded-full bg-purple-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/60"
              >
                {geminiStatus === 'saving' ? 'Saving…' : 'Store Gemini key'}
              </button>
              {geminiKeyLast4 && (
                <span className="text-xs font-semibold text-slate-400">
                  Current key ending in{' '}
                  <span className="font-mono text-emerald-300">{geminiKeyLast4}</span>
                </span>
              )}
            </div>
          </form>
          {(geminiStatus === 'success' || geminiError) && (
            <div
              className={`rounded-lg border px-4 py-3 text-sm ${
                geminiError
                  ? 'border-red-500/30 bg-red-500/10 text-red-200'
                  : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100'
              }`}
            >
              {geminiError ?? 'Gemini API key linked successfully.'}
            </div>
          )}
        </section>
      </div>

      <section className="space-y-4 rounded-xl border border-slate-800 bg-slate-950/60 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Entrance activity log</h3>
            <p className="text-xs text-slate-500">
              Records captured through the Supabase Edge Function with IP, cookie snapshot, Drive, and Gemini metadata.
            </p>
          </div>
          <button
            type="button"
            onClick={onRefreshLogs}
            className="inline-flex items-center rounded-full border border-slate-600 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:border-slate-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-slate-400/40"
          >
            Refresh
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-800 text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="px-3 py-2">Timestamp</th>
                <th className="px-3 py-2">Role</th>
                <th className="px-3 py-2">IP</th>
                <th className="px-3 py-2">Drive</th>
                <th className="px-3 py-2">User agent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {logs.map(entry => (
                <tr key={entry.id} className="text-slate-200">
                  <td className="px-3 py-2 font-mono text-xs text-slate-400">{formatTimestamp(entry.createdAt)}</td>
                  <td className="px-3 py-2 capitalize">{entry.role}</td>
                  <td className="px-3 py-2 font-mono text-xs">{entry.ipAddress ?? 'unknown'}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-1 text-2xs font-semibold ${
                        entry.driveConnected ? 'bg-emerald-500/20 text-emerald-200' : 'bg-slate-700 text-slate-200'
                      }`}
                    >
                      {entry.driveConnected ? 'linked' : 'none'}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-400 line-clamp-2">{entry.userAgent ?? 'unknown'}</td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-4 text-center text-xs text-slate-500">
                    {isLoadingLogs ? 'Loading logs…' : 'No entrance activity captured yet.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Supabase Admin Panel */}
      <SupabasePanel className="mt-6" />
    </div>
  );
}

function createVisitId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `visit_${Math.random().toString(36).slice(2, 10)}`;
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}

function formatTimestamp(timestamp: string) {
  try {
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(timestamp));
  } catch {
    return timestamp;
  }
}

type SelectedRole = 'landing' | 'visitor' | 'user' | 'admin';
type GeminiStatus = 'idle' | 'saving' | 'success' | 'error';

interface RoleCardProps {
  title: string;
  summary: string;
  actionLabel: string;
  accent: string;
  disabled?: boolean;
  onClick: () => void;
}

interface UserViewProps {
  onSignInWithGoogle: () => Promise<void>;
}

interface AdminLoginFormProps {
  isLoading: boolean;
  isSubmitting: boolean;
  errorMessage: string | null;
  onSignIn: (credentials: EmailCredentials) => Promise<void>;
  onSignUp: (credentials: EmailCredentials) => Promise<void>;
  onMagicLink: (payload: MagicLinkPayload) => Promise<void>;
}

interface AdminDashboardProps {
  userEmail: string;
  adminLogId: string | null;
  logs: EntranceLog[];
  isLoadingLogs: boolean;
  onRefreshLogs: () => Promise<void>;
  onConnectDrive: () => Promise<void>;
  driveConnected: boolean;
  onSaveGeminiKey: (payload: GeminiFormPayload) => Promise<void>;
  geminiStatus: GeminiStatus;
  geminiError: string | null;
  geminiKeyLast4: string | null;
  onSignOut: () => Promise<void>;
}

interface EntranceLog {
  id: string;
  role: 'visitor' | 'user' | 'admin';
  ipAddress: string | null;
  userAgent: string | null;
  driveConnected: boolean;
  createdAt: string;
}

interface AdminCredentialSummary {
  email: string;
  geminiKeyLast4: string | null;
  driveConnected: boolean;
  createdAt: string | null;
}

interface EmailCredentials {
  email: string;
  password: string;
}

interface MagicLinkPayload {
  email: string;
}

interface GeminiFormPayload {
  apiKey: string;
  projectId?: string;
}

