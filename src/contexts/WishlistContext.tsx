'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { createClient } from '@/lib/supabase/client'
import { WishlistItem } from '@/types/cart'
import { Product } from '@/types/product'

interface WishlistContextType {
  items: WishlistItem[]
  isLoading: boolean
  addToWishlist: (item: WishlistItem) => Promise<void>
  removeFromWishlist: (itemId: string) => Promise<void>
  isInWishlist: (productId: string) => boolean
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined)

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [items, setItems] = useState<WishlistItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  // Load wishlist using a simplified, more reliable approach
  useEffect(() => {
    const loadWishlist = async () => {
      setIsLoading(true)
      
      // First, try to load from localStorage to have immediate data
      // This ensures the wishlist is never empty during loading
      try {
        const localWishlist = localStorage.getItem('orangesmith-wishlist')
        if (localWishlist) {
          const parsedWishlist = JSON.parse(localWishlist)
          console.log('Loaded initial wishlist data from localStorage:', { itemCount: parsedWishlist.length })
          setItems(parsedWishlist)
        }
      } catch (localError) {
        console.warn('Could not load wishlist from localStorage:', localError)
      }
      
      // If user is logged in, try to load from Supabase
      // but use a very simplified approach that won't fail
      if (user) {
        console.log('User is logged in, checking for remote wishlist data...')
        try {
          // First make sure the wishlist tables exist
          const { data: tables } = await supabase
            .from('pg_tables')
            .select('tablename')
            .in('tablename', ['wishlists', 'wishlist_items'])
          
          const tablesExist = tables && tables.length === 2
          
          if (!tablesExist) {
            console.warn('Required wishlist tables not found in Supabase')
            setIsLoading(false)
            return
          }
          
          // Just look for wishlist items directly - don't worry about wishlist IDs
          // This is a simpler approach that won't fail with wishlist ID issues
          const { data: wishlistItems, error: itemsError } = await supabase
            .from('wishlist_items')
            .select('id, product_id')
            .eq('user_id', user.id)
          
          // If there's any error, just log it and continue with localStorage
          if (itemsError) {
            console.error('Error fetching wishlist items:', itemsError)
            setIsLoading(false)
            return
          }
          
          // If we successfully got wishlist items
          if (wishlistItems && wishlistItems.length > 0) {
            console.log(`Found ${wishlistItems.length} wishlist items in Supabase`)
            
            // Transform items to our Wishlist Item format
            const formattedItems = wishlistItems.map(item => ({
              id: item.id,
              product_id: item.product_id,
              name: 'Luxury Jewelry Item',
              price: 0,
              slug: '',
              image: undefined
            } as WishlistItem))
            
            setItems(formattedItems)
            
            // Save to localStorage as backup
            localStorage.setItem('orangesmith-wishlist', JSON.stringify(formattedItems))
          } else {
            console.log('No wishlist items found in Supabase')
          }
        } catch (error) {
          console.error('Failed to load wishlist from Supabase - using localStorage data instead:', error)
          // We already loaded from localStorage above, so no need to do it again
        }
      } else {
        // Load from localStorage for guest users
        const savedWishlist = localStorage.getItem('orangesmith-wishlist')
        if (savedWishlist) {
          try {
            setItems(JSON.parse(savedWishlist))
          } catch (e) {
            setItems([])
          }
        }
      }
      
      setIsLoading(false)
    }
    
    loadWishlist()
  }, [user, supabase])

  // Save wishlist to localStorage whenever it changes (for guest users)
  useEffect(() => {
    if (!user && !isLoading) {
      localStorage.setItem('orangesmith-wishlist', JSON.stringify(items))
    }
  }, [items, user, isLoading])

  // Add product to wishlist
  const addToWishlist = async (item: WishlistItem): Promise<void> => {
    // Check if product is already in wishlist
    if (isInWishlist(item.product_id)) return
    
    // Generate a temporary ID if needed
    const newItem = {
      ...item,
      id: item.id || `wish-${Date.now()}`
    }
    
    // Add to local state immediately
    setItems(prevItems => [...prevItems, newItem])
    
    // Save to localStorage
    try {
      const currentItems = [...items, newItem]
      localStorage.setItem('orangesmith-wishlist', JSON.stringify(currentItems))
    } catch (localError) {
      console.warn('Error saving wishlist to localStorage:', localError)
    }
    
    // If user is logged in, also save to Supabase
    if (user) {
      try {
        // Add directly to wishlist_items without requiring a wishlist record
        // Only send fields that match the database schema
        const wishlistItemData = {
          user_id: user.id,
          product_id: item.product_id
          // created_at is handled by the database default
        }

        const { data, error } = await supabase
          .from('wishlist_items')
          .insert(wishlistItemData)
          .select('id')
        
        if (error) {
          console.error('Error adding to wishlist in Supabase:', error)
          return
        }
        
        // If successful, update the ID to match the database ID
        if (data && data[0]) {
          setItems(prevItems => prevItems.map(i => 
            i.id === newItem.id ? { ...i, id: data[0].id } : i
          ))
        }
      } catch (error) {
        console.error('Exception adding to wishlist:', error)
      }
    }
  }

  // Remove product from wishlist
  const removeFromWishlist = async (itemId: string): Promise<void> => {
    // Find the item to be removed (so we can get product_id if needed)
    const itemToRemove = items.find(item => item.id === itemId)
    
    // Remove from local state immediately
    setItems(prevItems => prevItems.filter(item => item.id !== itemId))
    
    // Update localStorage
    try {
      const updatedItems = items.filter(item => item.id !== itemId)
      localStorage.setItem('orangesmith-wishlist', JSON.stringify(updatedItems))
    } catch (localError) {
      console.warn('Error updating wishlist in localStorage:', localError)
    }
    
    // If user is logged in, remove from Supabase
    if (user && itemToRemove) {
      try {
        // Check if the ID is a UUID (Supabase) or a temporary ID
        // If it's a temporary ID, find by product_id instead
        let query = supabase.from('wishlist_items').delete()
        
        if (itemId.startsWith('temp-') || itemId.startsWith('wish-')) {
          // This is a temporary ID generated client-side, so we need to find by product_id
          query = query.eq('user_id', user.id).eq('product_id', itemToRemove.product_id)
        } else {
          // This is likely a Supabase UUID, so we can delete directly by ID
          query = query.eq('id', itemId)
        }
        
        const { error } = await query
        
        if (error) {
          console.error('Error removing item from wishlist in Supabase:', error)
        }
      } catch (error) {
        console.error('Exception removing from wishlist:', error)
      }
    }
  }

  // Check if product is in wishlist
  const isInWishlist = (productId: string): boolean => {
    return items.some(item => item.product_id === productId)
  }

  // We no longer need the getWishlistDetails helper function
  // Our approach now works directly with wishlist_items

  const value = {
    items,
    isLoading,
    addToWishlist,
    removeFromWishlist,
    isInWishlist
  }
  
  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
}

export function useWishlist() {
  const context = useContext(WishlistContext)
  
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider')
  }
  
  return context
}
