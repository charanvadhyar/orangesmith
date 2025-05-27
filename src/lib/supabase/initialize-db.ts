import { SupabaseClient } from '@supabase/supabase-js'

/**
 * Initializes the e-commerce database schema in Supabase
 * This ensures all required tables for cart, wishlist, and order functionality exist
 */
export async function initializeEcommerceSchema(supabase: SupabaseClient) {
  console.log('Checking and initializing Orange Smith database schema...')
  
  try {
    // Check if schema has been initialized already
    const { error: schemaCheckError } = await supabase
      .from('schema_version')
      .select('version')
      .limit(1)
    
    // If schema_version table exists, we assume schema is initialized
    if (!schemaCheckError) {
      console.log('Database schema already initialized')
      return true
    }
    
    // Log error details but continue with initialization
    console.log('Schema not initialized, creating tables:', schemaCheckError.message)
    
    // Attempt to create schema_version table first
    await supabase.rpc('create_schema_version_table')
    
    // Create carts table
    await supabase.rpc('create_carts_table')
    
    // Create cart_items table
    await supabase.rpc('create_cart_items_table')
    
    // Create wishlist table
    await supabase.rpc('create_wishlist_table')
    
    // Create orders table
    await supabase.rpc('create_orders_table')
    
    // Create order_items table
    await supabase.rpc('create_order_items_table')
    
    // Insert schema version
    await supabase
      .from('schema_version')
      .insert({ version: '1.0.0', updated_at: new Date().toISOString() })
    
    console.log('Database schema initialized successfully')
    return true
  } catch (error) {
    console.error('Failed to initialize database schema:', error)
    return false
  }
}

/**
 * Checks if the Supabase tables required for cart functionality exist
 */
export async function checkCartTablesExist(supabase: SupabaseClient): Promise<boolean> {
  try {
    // Try to query the carts table
    const { error: cartsError } = await supabase
      .from('carts')
      .select('count')
      .limit(1)
    
    if (cartsError) {
      console.error('Carts table check failed:', cartsError.message)
      return false
    }
    
    // Try to query the cart_items table
    const { error: cartItemsError } = await supabase
      .from('cart_items')
      .select('count')
      .limit(1)
    
    if (cartItemsError) {
      console.error('Cart items table check failed:', cartItemsError.message)
      return false
    }
    
    return true
  } catch (error) {
    console.error('Error checking cart tables:', error)
    return false
  }
}
