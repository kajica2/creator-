import React from 'react';
import ReactDOM from 'react-dom/client';
import { initializeSentry } from '../config/sentry/sentry.config';
import { SupabaseMonitor } from './utils/monitoring/supabaseMonitoring';
import { supabase } from './utils/supabaseClient';
import { SupabaseAuthProvider } from '../hooks/useSupabaseAuth';
import App from './App.tsx';
import './index.css';

// Initialize Sentry before anything else
initializeSentry();

// Wrap Supabase client with monitoring
const monitoredSupabase = SupabaseMonitor.getInstance().wrapSupabaseClient(supabase);

// Make monitored client available globally for the app
(window as any).__monitoredSupabase = monitoredSupabase;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SupabaseAuthProvider>
      <App />
    </SupabaseAuthProvider>
  </React.StrictMode>,
);