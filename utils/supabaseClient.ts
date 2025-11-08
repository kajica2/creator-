import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// Check if we're in production and provide fallback values
const isProduction = import.meta.env.PROD;
const fallbackUrl = 'https://ghhedylreulxoptiyreb.supabase.co';
const fallbackKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoaGVkeWxyZXVseG9wdGl5cmViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1OTY1MDcsImV4cCI6MjA3ODE3MjUwN30.lUsn5Y_-hwlq4JaLtdxhbsaVwlIOfCn1P8P6YAQbDyE';

const finalUrl = supabaseUrl || (isProduction ? fallbackUrl : '');
const finalKey = supabaseAnonKey || (isProduction ? fallbackKey : '');

if (!finalUrl) {
  console.warn('Missing VITE_SUPABASE_URL. Supabase client will not be initialized correctly.');
}

if (!finalKey) {
  console.warn('Missing VITE_SUPABASE_ANON_KEY. Supabase client will not be initialized correctly.');
}

export const supabase = createClient(finalUrl, finalKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
