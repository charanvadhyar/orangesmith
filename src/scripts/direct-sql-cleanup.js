'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import React from 'react'

export default function DirectSQLCleanup() {
  const [status, setStatus] = useState('idle')
  const [logs, setLogs] = useState([])
  const { user } = useAuth()
  
  const addLog = (message) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`])
  }
  
  const runCleanup = async () => {
    if (!user) {
      addLog('You must be logged in to run this cleanup')
      return
    }
    
    setStatus('running')
    addLog('Starting advanced cart cleanup...')
    
    try {
      const supabase = createClient()
      
      // First, get all carts for this user to count them
      const { data: userCarts, error: countError } = await supabase
        .from('carts')
        .select('id')
        .eq('user_id', user.id)
      
      if (countError) {
        throw countError
      }
      
      const initialCount = userCarts ? userCarts.length : 0
      addLog(`Found ${initialCount} carts for your account before cleanup`)
      
      if (initialCount <= 1) {
        addLog('No duplicate carts to clean up')
        setStatus('completed')
        return
      }
      
      // Get the first cart to keep
      const { data: firstCart, error: firstCartError } = await supabase
        .from('carts')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(1)
        .single()
      
      if (firstCartError) {
        throw firstCartError
      }
      
      const cartToKeep = firstCart.id
      addLog(`Keeping oldest cart: ${cartToKeep}`)
      
      // Process deletions using batch approach for greater reliability
      addLog('Starting bulk cart deletion...')
      
      // We'll process the deletions in batches to avoid any potential limitations
      const BATCH_SIZE = 20
      const cartsToDelete = userCarts.filter(cart => cart.id !== cartToKeep)
      
      addLog(`Preparing to delete ${cartsToDelete.length} carts in batches of ${BATCH_SIZE}`)
      
      let totalDeleted = 0
      
      // Process in batches
      for (let i = 0; i < cartsToDelete.length; i += BATCH_SIZE) {
        const batch = cartsToDelete.slice(i, i + BATCH_SIZE)
        const batchIds = batch.map(cart => cart.id)
        
        addLog(`Processing batch ${Math.floor(i/BATCH_SIZE) + 1} of ${Math.ceil(cartsToDelete.length/BATCH_SIZE)} (${batchIds.length} carts)`)
        
        try {
          // Delete this batch of carts
          const { data: deleted, error: batchError } = await supabase
            .from('carts')
            .delete()
            .in('id', batchIds)
            .select('id')
          
          if (batchError) {
            addLog(`Error in batch ${Math.floor(i/BATCH_SIZE) + 1}: ${batchError.message}`)
          } else {
            const deletedCount = deleted?.length || 0
            totalDeleted += deletedCount
            addLog(`Successfully deleted ${deletedCount} carts in batch ${Math.floor(i/BATCH_SIZE) + 1}`)
          }
          
          // Small delay between batches
          await new Promise(resolve => setTimeout(resolve, 300))
          
        } catch (err) {
          addLog(`Exception in batch ${Math.floor(i/BATCH_SIZE) + 1}: ${err.message}`)
        }
      }
      
      addLog(`Completed deletion process. Deleted ${totalDeleted} out of ${cartsToDelete.length} duplicate carts.`)
      
      // Check how many carts remain
      const { data: remainingCarts, error: finalCountError } = await supabase
        .from('carts')
        .select('id')
        .eq('user_id', user.id)
      
      if (finalCountError) {
        throw finalCountError
      }
      
      const finalCount = remainingCarts ? remainingCarts.length : 0
      addLog(`Cleanup complete. You now have ${finalCount} cart(s).`)
      addLog(`Removed ${initialCount - finalCount} duplicate carts.`)
      
      setStatus('completed')
    } catch (error) {
      console.error('Error during SQL cleanup:', error)
      addLog(`Error: ${error.message || 'Unknown error occurred'}`)
      setStatus('error')
    }
  }
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <h2 className="text-xl font-semibold mb-2">Advanced Database Cleanup</h2>
      <p className="text-gray-600 text-sm mb-4">
        This utility uses direct SQL operations to efficiently clean up a large number of duplicate carts.
      </p>
      
      <div className="mb-4">
        <button
          onClick={runCleanup}
          disabled={status === 'running' || !user}
          className={`px-4 py-2 rounded font-medium ${
            status === 'running' 
              ? 'bg-gray-300 cursor-not-allowed' 
              : 'bg-red-600 hover:bg-red-700 text-white'
          }`}
        >
          {status === 'running' ? 'Cleaning...' : 'Run Advanced Cleanup'}
        </button>
      </div>
      
      {logs.length > 0 && (
        <div className="mt-4">
          <h3 className="font-medium text-sm mb-2">Process Log:</h3>
          <div className="bg-gray-50 border border-gray-200 rounded p-2 max-h-60 overflow-y-auto text-xs font-mono">
            {logs.map((log, i) => (
              <div key={i} className="py-1">{log}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
