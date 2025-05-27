'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'

export default function SupabaseDebug() {
  const [envVars, setEnvVars] = useState<{url: string, key: string}>({ url: '', key: '' })
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'success' | 'error'>('checking')
  const [errorDetails, setErrorDetails] = useState<string>('')
  const [availableTables, setAvailableTables] = useState<string[]>([])
  const { user } = useAuth()
  
  useEffect(() => {
    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    
    setEnvVars({
      url: supabaseUrl ? `${supabaseUrl.substring(0, 10)}...` : 'Not set',
      key: supabaseKey ? `${supabaseKey.substring(0, 5)}...` : 'Not set'
    })
    
    // Test Supabase connection
    async function testConnection() {
      try {
        const supabase = createClient()
        
        // Try to connect to Supabase
        const { data, error } = await supabase.from('carts').select('count')
        
        if (error) {
          throw error
        }
        
        // Check which tables exist
        const tableNames = ['carts', 'cart_items', 'profiles', 'orders', 'wishlist_items']
        const existingTables = []
        
        for (const table of tableNames) {
          const { error } = await supabase.from(table).select('count').limit(1)
          if (!error) {
            existingTables.push(table)
          }
        }
        
        setAvailableTables(existingTables)
        setConnectionStatus('success')
      } catch (error: any) {
        setConnectionStatus('error')
        
        // Format error details
        const formattedError = {
          message: error?.message || 'Unknown error',
          details: error?.details || '',
          code: error?.code || '',
          hint: error?.hint || ''
        }
        
        setErrorDetails(JSON.stringify(formattedError, null, 2))
      }
    }
    
    testConnection()
  }, [])
  
  return (
    <div className="p-4 border rounded-lg bg-gray-50 text-gray-800 max-w-2xl mx-auto my-4">
      <h2 className="text-lg font-semibold mb-2">Supabase Debug Information</h2>
      
      <div className="mb-4">
        <h3 className="font-medium">Environment Variables:</h3>
        <ul className="list-disc ml-6 text-sm">
          <li>NEXT_PUBLIC_SUPABASE_URL: {envVars.url}</li>
          <li>NEXT_PUBLIC_SUPABASE_ANON_KEY: {envVars.key}</li>
        </ul>
      </div>
      
      <div className="mb-4">
        <h3 className="font-medium">Authentication:</h3>
        <p className="text-sm">{user ? `Logged in as: ${user.email}` : 'Not logged in'}</p>
      </div>
      
      <div className="mb-4">
        <h3 className="font-medium">Connection Status:</h3>
        <div className={`text-sm ${connectionStatus === 'checking' ? 'text-yellow-600' : connectionStatus === 'success' ? 'text-green-600' : 'text-red-600'}`}>
          {connectionStatus === 'checking' ? 'Checking...' : connectionStatus === 'success' ? 'Connected' : 'Connection Error'}
        </div>
        
        {connectionStatus === 'error' && (
          <div className="mt-2">
            <h4 className="text-sm font-medium">Error Details:</h4>
            <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto mt-1">{errorDetails}</pre>
          </div>
        )}
      </div>
      
      {connectionStatus === 'success' && (
        <div>
          <h3 className="font-medium">Available Tables:</h3>
          {availableTables.length > 0 ? (
            <ul className="list-disc ml-6 text-sm">
              {availableTables.map(table => (
                <li key={table}>{table}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-red-600">No tables found</p>
          )}
        </div>
      )}
      
      <div className="mt-4 text-xs text-gray-600">
        <p>Common issues:</p>
        <ul className="list-disc ml-6">
          <li>Missing environment variables in .env.local file</li>
          <li>Incorrect Supabase URL or API key</li>
          <li>Missing cart tables in your Supabase database</li>
          <li>Supabase service might be down</li>
        </ul>
      </div>
    </div>
  )
}
