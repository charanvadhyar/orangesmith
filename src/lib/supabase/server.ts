import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/types/supabase'

export function createClient() {
  // Create a server client with fallback values to ensure build works
  // Fallback values from the previously found .env.local file
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gutwmgzafhpdvktnwmss.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd1dHdtZ3phZmhwZHZrdG53bXNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0NjExMjgsImV4cCI6MjA2MzAzNzEyOH0.yo92XB1FRXvpWOqrb-WkBg_8lL1pOOgM9v3IMjURMYU';
  
  const supabase = createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        async get(name: string) {
          return (await cookies()).get(name)?.value
        },
        async set(name: string, value: string, options: CookieOptions) {
          (await cookies()).set(name, value, options)
        },
        async remove(name: string, options: CookieOptions) {
          (await cookies()).set(name, '', { ...options, maxAge: 0 })
        },
      },
    }
  )
  
  return supabase
}
