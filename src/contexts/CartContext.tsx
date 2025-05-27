'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { createClient } from '@/lib/supabase/client'
import { CartItem } from '@/types/cart'
import { enrichCartItems, createCartItem } from '@/lib/sanity/cart-helpers'
import { checkCartTablesExist } from '@/lib/supabase/initialize-db'

interface CartContextType {
  items: CartItem[]
  itemCount: number
  isLoading: boolean
  addItem: (item: CartItem) => Promise<void>
  removeItem: (itemId: string) => Promise<void>
  updateQuantity: (itemId: string, quantity: number) => Promise<void>
  clearCart: () => Promise<void>
}

const CartContext = createContext<CartContextType>({
  items: [],
  itemCount: 0,
  isLoading: false,
  addItem: async () => {},
  removeItem: async () => {},
  updateQuantity: async () => {},
  clearCart: async () => {}
})

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [items, setItems] = useState<CartItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  // Calculate total items in cart
  const itemCount = items.reduce((total, item) => total + item.quantity, 0)

  // Helper function to load cart from local storage
  const loadFromLocalStorage = () => {
    try {
      const localCart = localStorage.getItem('orangesmith-cart')
      if (localCart) {
        setItems(JSON.parse(localCart))
      } else {
        setItems([])
      }
    } catch (storageError) {
      console.error('Error loading from localStorage:', storageError)
      setItems([])
    }
  }

  // Load cart using a simplified, more reliable approach
  useEffect(() => {
    const loadCart = async () => {
      setIsLoading(true)
      
      // First, try to load from localStorage to have immediate data
      // This ensures the cart is never empty during loading
      try {
        const localCart = localStorage.getItem('orangesmith-cart')
        if (localCart) {
          const parsedCart = JSON.parse(localCart)
          console.log('Loaded initial cart data from localStorage:', { itemCount: parsedCart.length })
          setItems(parsedCart)
        }
      } catch (localError) {
        console.warn('Could not load from localStorage:', localError)
      }
      
      // If user is logged in, try to load from Supabase
      // but use a very simplified approach that won't fail
      if (user) {
        console.log('User is logged in, checking for remote cart data...')
        try {
          // First make sure the cart tables exist
          const { data: tables } = await supabase
            .from('pg_tables')
            .select('tablename')
            .in('tablename', ['carts', 'cart_items'])
          
          const tablesExist = tables && tables.length === 2
          
          if (!tablesExist) {
            console.warn('Required cart tables not found in Supabase')
            setIsLoading(false)
            return
          }
          
          // Just look for cart items directly - don't worry about cart IDs
          // This is a simpler approach that won't fail with cart ID issues
          const { data: cartItems, error: itemsError } = await supabase
            .from('cart_items')
            .select('id, product_id, quantity, name, price, slug, variant')
            .eq('user_id', user.id)
          
          // If there's any error, just log it and continue with localStorage
          if (itemsError) {
            console.error('Error fetching cart items:', itemsError)
            setIsLoading(false)
            return
          }
          
          // If we successfully got cart items
          if (cartItems && cartItems.length > 0) {
            console.log(`Found ${cartItems.length} cart items in Supabase`)
            
            // Transform items to our Cart Item format
            const basicCartItems = cartItems.map(item => ({
              id: item.id,
              product_id: item.product_id,
              quantity: item.quantity,
              name: item.name || 'OrangeSmith Fine Jewelry',
              price: typeof item.price === 'number' ? item.price : 0,
              image: undefined, // Will be populated by enrichCartItems
              slug: typeof item.slug === 'string' ? item.slug : '',
              variant: item.variant
            }));
            
            try {
              // Enrich with Sanity data
              const enrichedItems = await enrichCartItems(basicCartItems);
              setItems(enrichedItems);
              
              // Save to localStorage as backup
              localStorage.setItem('orangesmith-cart', JSON.stringify(enrichedItems))
            } catch (enrichError) {
              console.error('Error enriching cart items:', enrichError);
              setItems(basicCartItems);
            }
          } else {
            console.log('No cart items found in Supabase')
          }
        } catch (error) {
          console.error('Failed to load cart from Supabase - using localStorage data instead:', error)
          // We already loaded from localStorage above, so no need to do it again
        }
      } else {
        console.log('User not logged in, using localStorage cart only')
        loadFromLocalStorage()
      }
      
      setIsLoading(false)
    }
    
    loadCart()
  }, [user, supabase])

  // Save cart to localStorage whenever it changes (for guest users)
  useEffect(() => {
    if (!user && !isLoading) {
      localStorage.setItem('orangesmith-cart', JSON.stringify(items))
    }
  }, [items, user, isLoading])

  // Helper function to get cart details
  const getCartDetails = async (userId: string, productId?: string) => {
    try {
      // Check if cart exists - use regular select to handle multiple carts case
      const { data: cartData, error } = await supabase
        .from('carts')
        .select('id')
        .eq('user_id', userId)
      
      let cart_id: string | undefined
      
      if (cartData && cartData.length > 0) {
        // Use the first cart if multiple exist
        cart_id = cartData[0].id
        console.log('Found existing cart:', cart_id)
        
        // If there are multiple carts, log a warning
        if (cartData.length > 1) {
          console.warn(`User has ${cartData.length} carts, using the first one (${cart_id})`)
        }
      } else {
        console.log('Creating new cart for user:', userId)
        // Create new cart
        const { data: newCart, error: insertError } = await supabase
          .from('carts')
          .insert({ user_id: userId })
          .select('id')
          .single()
      
        if (insertError) {
          console.error('Error creating cart:', insertError)
          throw new Error(`Failed to create cart: ${insertError.message}`)
        } else {
          console.log('Created new cart with ID:', newCart?.id)
          cart_id = newCart?.id
        }
      }
    
      let item_id: string | undefined
    
      if (productId && cart_id) {
        // Check if product is already in cart - using regular select instead of maybeSingle
        const { data: existingItems, error: findError } = await supabase
          .from('cart_items')
          .select('id')
          .eq('cart_id', cart_id)
          .eq('product_id', productId)
      
        if (findError) {
          console.error('Error finding cart item:', findError)
        } else if (existingItems && existingItems.length > 0) {
          // Use the first matching item if multiple exist
          item_id = existingItems[0].id
          console.log('Found existing cart item:', item_id)
          
          // If there are multiple matching items, log a warning
          if (existingItems.length > 1) {
            console.warn(`Found ${existingItems.length} duplicate items for product ${productId}, using the first one`)
            
            // Clean up duplicate items (keep the first one, delete others)
            const duplicateItemIds = existingItems.slice(1).map(item => item.id)
            
            if (duplicateItemIds.length > 0) {
              const { error: deleteError } = await supabase
                .from('cart_items')
                .delete()
                .in('id', duplicateItemIds)
                
              if (deleteError) {
                console.error('Error cleaning up duplicate cart items:', deleteError)
              } else {
                console.log(`Cleaned up ${duplicateItemIds.length} duplicate cart items`)
              }
            }
          }
        } else {
          console.log('Item not found in cart, will create new')
        }
      }
    
      if (!cart_id) {
        throw new Error('Failed to get or create cart')
      }
    
      return { cart_id, item_id }
    } catch (error) {
      console.error('Error in getCartDetails:', error)
      throw error
    }
  }

  // Add item to cart
  const addItem = async (item: CartItem) => {
    try {
      // Check if an identical product is already in the cart
      const existingItem = items.find(i => i.product_id === item.product_id)
      
      if (existingItem) {
        // If it exists, update the quantity instead
        const newQuantity = existingItem.quantity + (item.quantity || 1)
        await updateQuantity(existingItem.id, newQuantity)
        
        // Update in Supabase if user is logged in
        if (user) {
          const { error } = await supabase
            .from('cart_items')
            .update({ quantity: newQuantity })
            .eq('user_id', user.id)
            .eq('product_id', item.product_id)
            
          if (error) {
            console.error('Error updating cart quantity:', error)
          }
        }
        
        // Save to localStorage
        localStorage.setItem('orangesmith-cart', JSON.stringify(items))
        
      } else {
        // Add new item with quantity defaulting to 1 if not provided
        const newItem: CartItem = {
          ...item,
          quantity: item.quantity || 1,
          id: item.id || `cart-${Date.now()}` // Generate an ID if one wasn't provided
        }
        
        // Add to local state immediately
        setItems(prevItems => [...prevItems, newItem])
        
        // Save to localStorage
        try {
          const updatedItems = [...items, newItem]
          localStorage.setItem('orangesmith-cart', JSON.stringify(updatedItems))
        } catch (localError) {
          console.warn('Error saving cart to localStorage:', localError)
        }
        
        // If user is logged in, also save to Supabase
        if (user) {
          console.log('Saving item directly to cart_items table')
          
          // Create a cart item record with only the fields that exist in the database schema
          const cartItemData = {
            user_id: user.id,
            product_id: item.product_id,
            quantity: newItem.quantity,
            price: item.price || 0,
            variant: item.variant || null
            // Note: name and slug are not in the database schema
          }
          
          // Insert directly into cart_items without needing a cart_id
          const { data, error } = await supabase
            .from('cart_items')
            .insert(cartItemData)
            .select()
          
          if (error) {
            console.error('Database error adding item to cart:', error)
            // The item is already in the UI state, so the user can still proceed
          } else {
            console.log('Successfully added to database:', data)
            // Update the ID with the database-generated one
            if (data && data[0]) {
              setItems(prevItems => {
                return prevItems.map(i => 
                  i.id === newItem.id ? { ...i, id: data[0].id } : i
                )
              })
            }
          }
        }
      }
    } catch (error) {
      console.error('Error in addItem:', error)
      // Don't throw the error - this allows the cart to still work even if there's a database issue
    }
  }

  // Update item quantity
  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity < 1) return
    
    // Update local state immediately
    setItems(prevItems => prevItems.map(item => 
      item.id === itemId ? { ...item, quantity } : item
    ))
    
    // Update localStorage
    try {
      const updatedItems = items.map(item => 
        item.id === itemId ? { ...item, quantity } : item
      )
      localStorage.setItem('orangesmith-cart', JSON.stringify(updatedItems))
    } catch (localError) {
      console.warn('Error updating cart in localStorage:', localError)
    }
    
    // If user is logged in, update in Supabase
    if (user) {
      try {
        const { error } = await supabase
          .from('cart_items')
          .update({ quantity })
          .eq('id', itemId)
        
        if (error) {
          console.error('Error updating item quantity in database:', error)
        }
      } catch (error) {
        console.error('Exception updating item quantity:', error)
      }
    }
  }

  // Remove item from cart
  const removeItem = async (itemId: string) => {
    if (!itemId) {
      console.warn('Attempted to remove item with undefined ID');
      return;
    }
    
    // Find the item to be removed (so we can get product_id if needed)
    const itemToRemove = items.find(item => item.id === itemId)
    
    if (!itemToRemove) {
      console.warn(`Item with ID ${itemId} not found in cart state`);
      // Continue anyway to clean up any potential database entries
    }
    
    // Remove from local state immediately
    setItems(prevItems => prevItems.filter(item => item.id !== itemId))
    
    // Update localStorage
    try {
      const updatedItems = items.filter(item => item.id !== itemId)
      localStorage.setItem('orangesmith-cart', JSON.stringify(updatedItems))
    } catch (localError) {
      console.warn('Error updating cart in localStorage:', localError)
    }
    
    // If user is logged in, attempt database cleanup
    if (user) {
      try {
        // First try to find if the item exists in the database
        let product_id = itemToRemove?.product_id;
        
        // We'll try multiple approaches to ensure the item is removed
        
        // 1. If we have a product_id, try to remove by user_id + product_id
        if (product_id) {
          console.log(`Attempting to remove cart item with product_id: ${product_id}`);
          const { error: error1 } = await supabase
            .from('cart_items')
            .delete()
            .eq('user_id', user.id)
            .eq('product_id', product_id);
          
          if (error1) {
            console.log('First removal attempt failed, trying by ID:', error1);
          } else {
            console.log('Item successfully removed by product_id');
            return; // Success - exit early
          }
        }
        
        // 2. If the first approach failed or we don't have product_id, try by ID
        if (!itemId.startsWith('temp-') && !itemId.startsWith('cart-')) {
          console.log(`Attempting to remove cart item with direct ID: ${itemId}`);
          const { error: error2 } = await supabase
            .from('cart_items')
            .delete()
            .eq('id', itemId);
          
          if (error2) {
            console.log('Second removal attempt failed:', error2);
          } else {
            console.log('Item successfully removed by ID');
            return; // Success - exit early
          }
        }
        
        // If we reach here, both approaches failed or weren't applicable
        // This isn't necessarily an error - the item might not exist in the database
        // For example, if it was only in localStorage
        console.log('No database entry found to remove, item may only exist locally');
        
      } catch (error) {
        // Suppress error in UI but log for debugging
        console.log('Exception in cart item removal (suppressed):', error);
      }
    }
  }

  // Clear entire cart
  const clearCart = async () => {
    // Clear local state immediately
    setItems([])
    
    // Clear localStorage
    try {
      localStorage.setItem('orangesmith-cart', JSON.stringify([]))
    } catch (localError) {
      console.warn('Error clearing cart in localStorage:', localError)
    }
    
    // If user is logged in, also clear from Supabase
    if (user) {
      try {
        // Delete all cart items for this user directly - no need for cart_id
        const { error } = await supabase
          .from('cart_items')
          .delete()
          .eq('user_id', user.id)
        
        if (error) {
          console.error('Error clearing cart from database:', error)
        }
      } catch (error) {
        console.error('Exception clearing cart:', error)
      }
    }
  }


  const value: CartContextType = {
    items,
    itemCount,
    isLoading,
    addItem,
    removeItem,
    updateQuantity,
    clearCart
  }
  
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  
  return context
}
