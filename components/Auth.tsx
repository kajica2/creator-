import React, { useCallback, useState } from 'react';
import { useSupabaseAuth } from '../hooks/useSupabaseAuth';

const GoogleIcon = () => (
    <svg className="w-5 h-5 mr-2" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
        <path fill="#4285F4" d="M24 9.5c3.9 0 6.9 1.6 9.3 3.9l7-7C35.9 2.2 30.5 0 24 0 14.9 0 7.3 5.4 3 13.2l8.4 6.5C13.1 13.2 18.2 9.5 24 9.5z"></path>
        <path fill="#34A853" d="M46.2 25.4c0-1.7-.2-3.4-.5-5H24v9.2h12.7c-.5 3-2.1 5.6-4.6 7.3l8.1 6.3c4.8-4.4 7.5-10.8 7.5-18.8z"></path>
        <path fill="#FBBC05" d="M11.4 28.2c-.4-1.2-.6-2.5-.6-3.8s.2-2.6.6-3.8l-8.4-6.5C1.2 17.6 0 20.7 0 24.4s1.2 6.8 3 9.7l8.4-6.5z"></path>
        <path fill="#EA4335" d="M24 48c6.5 0 12-2.1 16-5.7l-8.1-6.3c-2.1 1.4-4.8 2.3-7.9 2.3-6.1 0-11.2-3.7-13.1-8.8l-8.4 6.5C7.3 42.6 14.9 48 24 48z"></path>
        <path fill="none" d="M0 0h48v48H0z"></path>
    </svg>
);

export const Auth: React.FC = () => {
    const { user, loading, signInWithGoogle, signOut } = useSupabaseAuth();
    const [requestPending, setRequestPending] = useState(false);

    const handleSignIn = useCallback(async () => {
        try {
            setRequestPending(true);
            await signInWithGoogle();
        } catch (error) {
            console.error('Failed to initiate Supabase sign-in flow', error);
        } finally {
            setRequestPending(false);
        }
    }, [signInWithGoogle]);

    const handleSignOut = useCallback(async () => {
        try {
            setRequestPending(true);
            await signOut();
        } catch (error) {
            console.error('Failed to sign out of Supabase', error);
        } finally {
            setRequestPending(false);
        }
    }, [signOut]);

    if (loading) {
        return (
            <div className="h-9 w-9 rounded-full bg-gray-700/50 border border-gray-600 animate-pulse" aria-label="Authenticating" />
        );
    }

    if (user) {
        return (
            <div className="flex items-center space-x-2 bg-gray-700/50 border border-gray-600 rounded-full p-1 pl-3">
                <img src={user.picture || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.name)} alt={user.name} className="w-7 h-7 rounded-full" />
                <span className="text-sm font-medium text-gray-300 hidden sm:inline">{user.name}</span>
                <button
                    onClick={handleSignOut}
                    disabled={requestPending}
                    className="bg-gray-600 hover:bg-red-500/50 disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-semibold py-1.5 px-3 rounded-full transition-colors"
                >
                    Sign Out
                </button>
            </div>
        );
    }

    return (
        <button
            onClick={handleSignIn}
            disabled={requestPending}
            className="flex items-center text-sm font-semibold py-1.5 px-4 rounded-full transition-all border bg-white text-gray-800 hover:bg-gray-200 disabled:opacity-60 disabled:cursor-not-allowed border-gray-300"
        >
            <GoogleIcon />
            Sign in with Google
        </button>
    );
};
