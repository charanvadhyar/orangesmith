'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { checkCartTablesExist } from '@/lib/supabase/initialize-db'

export default function HomepageDebug() {
  const [diagnosticInfo, setDiagnosticInfo] = useState({
    supabaseConnection: 'checking...',
    cartTables: 'checking...',
    cartError: null as string | null,
  })
  const { user } = useAuth()
  
  useEffect(() => {
    async function runDiagnostics() {
      const supabase = createClient()
      
      // Check Supabase connection
      try {
        const { data, error } = await supabase.from('carts').select('count').limit(1)
        if (error) {
          setDiagnosticInfo(prev => ({
            ...prev,
            supabaseConnection: `Error: ${error.message || 'Unknown error'}`
          }))
        } else {
          setDiagnosticInfo(prev => ({
            ...prev,
            supabaseConnection: 'Connected'
          }))
        }
        
        // Check if cart tables exist
        const tablesExist = await checkCartTablesExist(supabase)
        setDiagnosticInfo(prev => ({
          ...prev,
          cartTables: tablesExist ? 'Tables exist' : 'Tables missing'
        }))
        
        // Instead of testing cart operations directly, we'll just report the status
        if (user) {
          try {
            // Get count of carts for the user
            const { data: cartsData, error: cartsError } = await supabase
              .from('carts')
              .select('id')
              .eq('user_id', user.id)
            
            if (cartsError) {
              console.error('Error checking carts:', cartsError)
              
              // Only set a generic message to avoid displaying errors that might confuse users
              setDiagnosticInfo(prev => ({
                ...prev,
                cartError: 'Could not check cart status - see console for details'
              }))
            } else {
              // Show cart count information
              const cartCount = cartsData?.length || 0
              setDiagnosticInfo(prev => ({
                ...prev,
                cartError: cartCount === 0
                  ? 'No carts found' 
                  : cartCount === 1
                    ? null // No error when exactly one cart exists
                    : `Multiple carts (${cartCount}) - visit /admin/cart-cleanup to fix`
              }))
            }
          } catch (error: any) {
            console.error('Unexpected cart check error:', error)
            setDiagnosticInfo(prev => ({
              ...prev,
              cartError: 'Internal error while checking cart status'
            }))
          }
        }
      } catch (error: any) {
        setDiagnosticInfo({
          supabaseConnection: `Connection failed: ${error?.message || 'Unknown error'}`,
          cartTables: 'Check failed',
          cartError: error ? JSON.stringify(error) : 'Unknown error'
        })
      }
    }
    
    runDiagnostics()
  }, [user])
  
  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white border border-gray-200 shadow-lg rounded-lg p-4 max-w-xs text-sm">
      <h3 className="font-bold text-red-600 mb-2">Supabase Diagnostics</h3>
      <ul className="space-y-1">
        <li><span className="font-medium">Connection:</span> {diagnosticInfo.supabaseConnection}</li>
        <li><span className="font-medium">Cart Tables:</span> {diagnosticInfo.cartTables}</li>
        {diagnosticInfo.cartError && (
          <li><span className="font-medium">Error:</span> {diagnosticInfo.cartError}</li>
        )}
        <li><span className="font-medium">Auth:</span> {user ? `Logged in as ${user.email}` : 'Not logged in'}</li>
        <li><span className="font-medium">ENV:</span> {process.env.NODE_ENV}</li>
      </ul>
      <div className="mt-2 text-xs text-gray-500">
        <p>Supabase URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'}</p>
        <p>Supabase Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}</p>
      </div>
    </div>
  )
}
