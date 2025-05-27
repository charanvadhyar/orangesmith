import { createBrowserClient } from '@supabase/ssr'

// Using the Supabase URL and API key with fallbacks to ensure build works
export function createClient() {
  // Fallback values from the previously found .env.local file
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gutwmgzafhpdvktnwmss.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd1dHdtZ3phZmhwZHZrdG53bXNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0NjExMjgsImV4cCI6MjA2MzAzNzEyOH0.yo92XB1FRXvpWOqrb-WkBg_8lL1pOOgM9v3IMjURMYU';

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
