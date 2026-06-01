import { createClient } from '@supabase/supabase-js';

// Default fallback values (replace with your actual production values)
const DEFAULT_SUPABASE_URL = 'https://ivqpmzoeorlfrgaeklat.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2cXBtem9lb3JsZnJnYWVrbGF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzMzAxOTUsImV4cCI6MjA5NTkwNjE5NX0.R2L2TR8PFRbGE-e3VDoM6z3hsGWTQqMgkW38bs22g0c';

// Get environment variables from various sources
// This handles both development (import.meta.env) and production (process.env) environments
const getEnvVariable = (key: string, defaultValue: string): string => {
  // Check Vite's import.meta.env (development)
  if (import.meta.env && import.meta.env[key]) {
    return import.meta.env[key] as string;
  }

  // Check process.env (production build)
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key] as string;
  }

  // Return default value if not found
  return defaultValue;
};

const supabaseUrl = getEnvVariable('VITE_SUPABASE_URL', DEFAULT_SUPABASE_URL);
const supabaseKey = getEnvVariable('VITE_SUPABASE_ANON_KEY', DEFAULT_SUPABASE_ANON_KEY);

console.log('Initializing Supabase client with URL:', supabaseUrl.substring(0, 20) + '...');

// Create and export the Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey);
