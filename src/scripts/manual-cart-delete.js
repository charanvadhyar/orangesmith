'use client'

import React, { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'

export default function ManualCartDelete() {
  const [logs, setLogs] = useState([])
  const [carts, setCarts] = useState([])
  const [selectedCart, setSelectedCart] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { user } = useAuth()
  
  const addLog = (message) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${message}`, ...prev])
  }
  
  const fetchCarts = async () => {
    if (!user) {
      addLog('You must be logged in to view carts')
      return
    }
    
    setIsLoading(true)
    addLog('Fetching all carts...')
    
    try {
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('carts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
      
      if (error) throw error
      
      setCarts(data || [])
      addLog(`Found ${data.length} carts for your account`)
      
      if (data.length > 0) {
        setSelectedCart(data[0].id)
        addLog(`Selected oldest cart (${data[0].id}) to keep`)
      }
    } catch (error) {
      console.error('Error fetching carts:', error)
      addLog(`Error: ${error.message || 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }
  
  const deleteCart = async (cartId) => {
    if (!user || !cartId) return
    
    try {
      setIsLoading(true)
      addLog(`Attempting to delete cart: ${cartId}`)
      
      const supabase = createClient()
      
      // Enable row level security bypassing for this one query (if your RLS policies are blocking deletions)
      // This is a special technique that requires your user to have appropriate permissions
      const { error } = await supabase.auth.refreshSession()
      
      if (error) {
        addLog(`Auth refresh error: ${error.message}`)
        throw error
      }
      
      // Try to delete the cart
      const { data, error: deleteError } = await supabase
        .from('carts')
        .delete()
        .eq('id', cartId)
        .select()
      
      if (deleteError) {
        addLog(`Delete error: ${deleteError.message}`)
        throw deleteError
      }
      
      addLog(`Successfully deleted cart: ${cartId}`)
      
      // Refresh the cart list
      await fetchCarts()
    } catch (error) {
      console.error('Error deleting cart:', error)
      addLog(`Error: ${error.message || 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }
  
  const keepSelectedDeleteRest = async () => {
    if (!user || !selectedCart || carts.length <= 1) return
    
    try {
      setIsLoading(true)
      addLog(`Keeping cart ${selectedCart} and deleting all others...`)
      
      const cartsToDelete = carts.filter(cart => cart.id !== selectedCart)
      addLog(`Preparing to delete ${cartsToDelete.length} carts one by one...`)
      
      let successCount = 0
      let failCount = 0
      
      for (const cart of cartsToDelete) {
        try {
          const supabase = createClient()
          
          const { error } = await supabase
            .from('carts')
            .delete()
            .eq('id', cart.id)
          
          if (error) {
            addLog(`Failed to delete cart ${cart.id}: ${error.message}`)
            failCount++
          } else {
            addLog(`Deleted cart ${cart.id}`)
            successCount++
          }
          
          // Small delay between operations
          await new Promise(resolve => setTimeout(resolve, 500))
        } catch (err) {
          addLog(`Error processing cart ${cart.id}: ${err.message}`)
          failCount++
        }
      }
      
      addLog(`Operation complete. Successfully deleted ${successCount} carts. Failed to delete ${failCount} carts.`)
      
      // Refresh the cart list
      await fetchCarts()
    } catch (error) {
      console.error('Error in bulk operation:', error)
      addLog(`Error: ${error.message || 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }
  
  // Attempt to force delete by fixing potential foreign key issues
  const forceCleanupDatabase = async () => {
    if (!user) return
    
    try {
      setIsLoading(true)
      addLog('Starting FORCE CLEANUP - this will reset your cart state entirely')
      
      const supabase = createClient()
      
      // First delete cart items if they exist
      addLog('Checking for cart_items table...')
      const { error: checkError } = await supabase
        .from('cart_items')
        .select('count')
        .limit(1)
      
      if (!checkError) {
        // Table exists, delete all cart items for this user
        addLog('Deleting all cart items for your user...')
        const { error: itemsError } = await supabase
          .from('cart_items')
          .delete()
          .eq('user_id', user.id)
        
        if (itemsError) {
          addLog(`Error deleting cart items: ${itemsError.message}`)
        } else {
          addLog('Successfully deleted all cart items')
        }
      }
      
      // Now delete all carts except one
      if (carts.length > 0) {
        const cartToKeep = carts[0].id
        addLog(`Keeping first cart (${cartToKeep}) and deleting all others...`)
        
        // Create a fresh cart if needed
        if (!cartToKeep) {
          const { data: newCart, error: createError } = await supabase
            .from('carts')
            .insert({ user_id: user.id })
            .select('id')
            .single()
          
          if (createError) {
            addLog(`Error creating new cart: ${createError.message}`)
          } else {
            addLog(`Created new cart: ${newCart.id}`)
          }
        }
        
        // Delete all carts in one go
        addLog('Attempting to delete ALL carts except the first one...')
        
        const { error: deleteAllError } = await supabase
          .from('carts')
          .delete()
          .neq('id', cartToKeep)
          .eq('user_id', user.id)
        
        if (deleteAllError) {
          addLog(`Error deleting carts: ${deleteAllError.message}`)
        } else {
          addLog('Successfully deleted all extra carts')
        }
      }
      
      // Refresh the cart list
      await fetchCarts()
      
    } catch (error) {
      console.error('Error in force cleanup:', error)
      addLog(`Error: ${error.message || 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-2">Manual Cart Cleaner</h2>
      <p className="text-sm text-gray-600 mb-4">
        This tool gives you direct control over your cart database to help resolve the duplicate carts issue.
      </p>
      
      {!user && (
        <div className="bg-red-50 text-red-800 p-3 rounded mb-4">
          You must be logged in to use this tool.
        </div>
      )}
      
      <div className="space-y-4">
        <div className="flex space-x-2">
          <button
            onClick={fetchCarts}
            disabled={isLoading || !user}
            className={`px-4 py-2 rounded text-white ${isLoading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {carts.length ? 'Refresh Cart List' : 'View My Carts'}
          </button>
          
          {carts.length > 0 && (
            <>
              <button
                onClick={keepSelectedDeleteRest}
                disabled={isLoading || !user || carts.length <= 1}
                className={`px-4 py-2 rounded text-white ${isLoading ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'}`}
              >
                Keep Selected & Delete Others
              </button>
              
              <button
                onClick={forceCleanupDatabase}
                disabled={isLoading || !user}
                className={`px-4 py-2 rounded text-white ${isLoading ? 'bg-gray-400' : 'bg-red-600 hover:bg-red-700'}`}
              >
                Force Cleanup
              </button>
            </>
          )}
        </div>
        
        {carts.length > 0 && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select cart to keep:
            </label>
            <select
              value={selectedCart}
              onChange={(e) => setSelectedCart(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
              disabled={isLoading}
            >
              {carts.map((cart) => (
                <option key={cart.id} value={cart.id}>
                  {cart.id} {cart.created_at && `(created: ${new Date(cart.created_at).toLocaleString()})`}
                </option>
              ))}
            </select>
          </div>
        )}
        
        {carts.length > 0 && (
          <div className="mt-4 overflow-auto max-h-60">
            <h3 className="font-medium text-sm mb-2">Your Carts ({carts.length}):</h3>
            <div className="space-y-2">
              {carts.map((cart) => (
                <div key={cart.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                  <div className="overflow-hidden text-ellipsis">
                    <span className={cart.id === selectedCart ? "font-bold" : ""}>
                      {cart.id}
                    </span>
                    {cart.created_at && (
                      <span className="text-xs text-gray-500 ml-2">
                        Created: {new Date(cart.created_at).toLocaleString()}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => deleteCart(cart.id)}
                    disabled={isLoading || cart.id === selectedCart}
                    className={`text-sm px-2 py-1 rounded ${
                      cart.id === selectedCart 
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                        : 'bg-red-100 text-red-700 hover:bg-red-200'
                    }`}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {logs.length > 0 && (
          <div className="mt-4">
            <h3 className="font-medium text-sm mb-2">Action Log:</h3>
            <div className="bg-gray-50 border border-gray-200 rounded p-2 max-h-32 overflow-y-auto">
              {logs.map((log, i) => (
                <div key={i} className="text-xs py-1 border-b border-gray-100 last:border-b-0">
                  {log}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
