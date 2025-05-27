import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/types/supabase'

export function createClient() {
  // Create a server client
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
