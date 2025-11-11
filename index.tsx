
import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import { SupabaseAuthProvider } from './hooks/useSupabaseAuth';
import { AccessibilityProvider } from './src/hooks/useAccessibility';
import { queryClient } from './utils/queryClient';
import './src/index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AccessibilityProvider>
      <SupabaseAuthProvider>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </SupabaseAuthProvider>
    </AccessibilityProvider>
  </React.StrictMode>
);
