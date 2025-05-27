'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'

export default function SupabaseStatus() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [tables, setTables] = useState<string[]>([])
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const { user } = useAuth()
  
  useEffect(() => {
    async function checkConnection() {
      try {
        const supabase = createClient()
        
        // Check if we can connect to Supabase
        const { data, error } = await supabase.from('carts').select('count')
        
        if (error) throw error
        
        // Check which tables exist
        const tableNames = ['carts', 'cart_items', 'wishlist_items', 'orders', 'profiles', 'addresses']
        const existingTables = []
        
        for (const table of tableNames) {
          const { error } = await supabase.from(table).select('count').limit(1)
          if (!error) existingTables.push(table)
        }
        
        setTables(existingTables)
        setStatus('success')
      } catch (error) {
        console.error('Supabase connection error:', error)
        setErrorMsg(error instanceof Error ? error.message : 'Unknown error')
        setStatus('error')
      }
    }
    
    checkConnection()
  }, [])
  
  if (status === 'loading') {
    return <div className="p-4 bg-gray-100 rounded-md mb-4">Checking Supabase connection...</div>
  }
  
  if (status === 'error') {
    return (
      <div className="p-4 bg-red-50 text-red-800 rounded-md mb-4">
        <h3 className="font-medium">Supabase Connection Error</h3>
        <p className="text-sm mt-1">{errorMsg}</p>
      </div>
    )
  }
  
  return (
    <div className="p-4 bg-green-50 text-green-800 rounded-md mb-4">
      <h3 className="font-medium">Supabase Connection Successful</h3>
      <p className="text-sm mt-1">Available tables: {tables.join(', ')}</p>
      <p className="text-xs mt-2">{user ? `Logged in as: ${user.email}` : 'Not logged in'}</p>
    </div>
  )
}
