import React from 'react';
import App from '../App';
import { AuthCallback } from './components/AuthProvider';

// Simple router component to handle auth callback
export function AppRouter() {
  // Check if we're on the auth callback route
  const isAuthCallback = typeof window !== 'undefined' &&
    window.location.pathname === '/auth/callback';

  if (isAuthCallback) {
    return <AuthCallback />;
  }

  return <App />;
}