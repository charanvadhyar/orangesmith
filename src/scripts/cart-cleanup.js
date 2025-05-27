'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'

export default function CartCleanup() {
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState('')
  const [details, setDetails] = useState([])
  const { user } = useAuth()
  
  const runCleanup = async () => {
    if (!user) {
      setMessage('You must be logged in to run the cart cleanup')
      return
    }
    
    setStatus('running')
    setMessage('Analyzing cart data...')
    
    try {
      const supabase = createClient()
      
      // Get all carts for the current user
      const { data: carts, error: cartsError } = await supabase
        .from('carts')
        .select('id')
        .eq('user_id', user.id)
        
      if (cartsError) throw cartsError
      
      if (!carts || carts.length === 0) {
        setMessage('No carts found for your account')
        setStatus('completed')
        return
      }
      
      setDetails(prev => [...prev, `Found ${carts.length} carts for your account`])
      
      if (carts.length === 1) {
        setMessage('Your cart is already clean (only one cart found)')
        setStatus('completed')
        return
      }
      
      // Keep the first cart, delete the rest
      const primaryCartId = carts[0].id
      const cartsToDelete = carts.slice(1).map(c => c.id)
      
      setDetails(prev => [...prev, `Keeping cart ${primaryCartId}`])
      setDetails(prev => [...prev, `Removing ${cartsToDelete.length} duplicate carts`])
      
      // Process in smaller batches to avoid potential limits
      const BATCH_SIZE = 20
      let deletedCount = 0
      
      setDetails(prev => [...prev, `Processing deletion in batches of ${BATCH_SIZE}...`])
      
      // Delete duplicate carts in batches
      for (let i = 0; i < cartsToDelete.length; i += BATCH_SIZE) {
        const batch = cartsToDelete.slice(i, i + BATCH_SIZE)
        
        try {
          setDetails(prev => [...prev, `Deleting batch ${Math.floor(i/BATCH_SIZE) + 1} of ${Math.ceil(cartsToDelete.length/BATCH_SIZE)} (${batch.length} carts)`])
          
          const { error: deleteError } = await supabase
            .from('carts')
            .delete()
            .in('id', batch)
            
          if (deleteError) {
            console.error('Error deleting batch:', deleteError)
            setDetails(prev => [...prev, `Error in batch ${Math.floor(i/BATCH_SIZE) + 1}: ${deleteError.message}`])
          } else {
            deletedCount += batch.length
            setDetails(prev => [...prev, `Successfully deleted batch ${Math.floor(i/BATCH_SIZE) + 1} (${deletedCount}/${cartsToDelete.length} total)`])
          }
        } catch (batchError) {
          console.error('Error processing batch:', batchError)
          setDetails(prev => [...prev, `Exception in batch ${Math.floor(i/BATCH_SIZE) + 1}: ${batchError.message || 'Unknown error'}`])
        }
        
        // Small delay between batches to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 300))
      }
      
      setDetails(prev => [...prev, `Completed deletion of ${deletedCount}/${cartsToDelete.length} duplicate carts`])
      
      // Get all cart items for the user
      const { data: userItems, error: itemsError } = await supabase
        .from('cart_items')
        .select('id, product_id, user_id')
        .eq('user_id', user.id)
        
      if (itemsError) throw itemsError
      
      if (userItems && userItems.length > 0) {
        setDetails(prev => [...prev, `Found ${userItems.length} total cart items belonging to you`])
        
        // There's no cart_id column, so we don't need to check for orphaned items
        // We'll keep all cart items since they're associated with the user directly
        setDetails(prev => [...prev, `All cart items are associated directly with your user ID, not with specific carts`])
        setDetails(prev => [...prev, `No need to clean up cart items`])
      } else {
        setDetails(prev => [...prev, `No cart items found for your account`])
      }
      
      setMessage('Cart cleanup completed successfully')
      setStatus('completed')
      
    } catch (error) {
      console.error('Error during cart cleanup:', error)
      setMessage(`Error: ${error.message || 'Unknown error occurred'}`)
      setStatus('error')
    }
  }
  
  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Cart Database Cleanup</h2>
      
      <p className="mb-4 text-sm text-gray-600">
        This utility will fix issues with multiple cart entries by cleaning up duplicate carts in the database.
        It keeps your primary cart and removes any duplicates.
      </p>
      
      <div className="mb-4">
        <button 
          onClick={runCleanup}
          disabled={status === 'running' || !user}
          className={`w-full py-2 px-4 rounded ${
            status === 'running' 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {status === 'running' ? 'Running...' : 'Run Cart Cleanup'}
        </button>
      </div>
      
      {message && (
        <div className={`p-3 rounded mb-4 ${
          status === 'error' 
            ? 'bg-red-100 text-red-800' 
            : status === 'completed' 
              ? 'bg-green-100 text-green-800'
              : 'bg-blue-100 text-blue-800'
        }`}>
          {message}
        </div>
      )}
      
      {details.length > 0 && (
        <div className="mt-4 border-t pt-4">
          <h3 className="text-sm font-semibold mb-2">Details:</h3>
          <ul className="text-xs text-gray-600 space-y-1">
            {details.map((detail, index) => (
              <li key={index}>• {detail}</li>
            ))}
          </ul>
        </div>
      )}
      
      {!user && (
        <div className="text-sm text-red-600 mt-2">
          You must be logged in to use this utility
        </div>
      )}
    </div>
  )
}
