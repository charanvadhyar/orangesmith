import { CartItem } from '@/types/cart'
import { Product } from '@/types/product'
import { client } from '@/sanity/lib/client'
import { urlFor } from '@/sanity/lib/image'

/**
 * Enriches cart items with full product data from Sanity
 * 
 * This allows us to display complete product information in the cart
 * without having to store all product data in Supabase
 */
export async function enrichCartItems(cartItems: CartItem[]): Promise<CartItem[]> {
  if (!cartItems.length) return []

  // Get all product IDs from the cart
  const productIds = cartItems.map(item => item.product_id)

  // Create a GROQ query to fetch all products at once
  // Customized for Orange Smith's existing Sanity schema 
  const query = `*[_type == "product" && _id in $ids]{
    _id,
    name,
    "slug": slug.current,
    price,
    // Get complete image information with expanded asset reference
    "images": images[]{
      "asset": asset->
    },
    materials[]->{name},
    gemstones[]->{name},
    // Fetch only what we need from variants
    "variants": variants[]{
      _key,
      material,
      size,
      gemstone
    }
  }`

  // Fetch all products from Sanity in a single query
  const products = await client.fetch<Product[]>(query, { ids: productIds })

  // Create a map for quick lookup
  const productMap = new Map<string, Product>()
  products.forEach(product => {
    productMap.set(product._id, product)
  })

  // Enrich each cart item with its product data
  return cartItems.map(item => {
    const product = productMap.get(item.product_id)
    
    if (product) {
      // Log for debugging purposes
      console.log('Product found:', product._id);
      console.log('Product images:', product.images);
      
      return {
        ...item,
        name: product.name,
        price: product.price,
        // Only set the image if the product has images
        // The image reference structure should match what Sanity expects
        image: product.images && product.images.length > 0 ? {
          _type: 'image',
          asset: product.images[0].asset
        } : undefined,
        slug: typeof product.slug === 'string' ? product.slug : ''
      }
    }
    
    // Return the original item if the product can't be found
    return item
  })
}

/**
 * Creates a cart item from a product
 */
export function createCartItem(product: Product, quantity = 1, variant?: string): CartItem {
  return {
    id: `${product._id}-${Date.now()}`, // Generate a temporary ID
    product_id: product._id,
    name: product.name,
    price: product.price,
    quantity,
    variant,
    // Use the first image if available - structure properly for Sanity image URL builder
    image: product.images && product.images.length > 0 ? {
      _type: 'image',
      asset: product.images[0].asset
    } : undefined,
    // Handle slug conversion from Sanity format to string
    slug: product.slug && typeof product.slug === 'object' && product.slug.current ? 
          product.slug.current : ''
  }
}

/**
 * Gets a formatted display string for variant options
 * Handles different variant formats based on Orange Smith's product schema
 */
export function getVariantDisplay(product: Product, variantId?: string): string {
  if (!variantId || !product.variants) return '';
  
  // Type guard to ensure variants exists and is an array
  const variants = Array.isArray(product.variants) ? product.variants : [];
  
  // Find the variant with the matching key
  const variant = variants.find(v => v && typeof v === 'object' && v._key === variantId);
  if (!variant) return '';
  
  // Generate variant display based on available attributes
  const parts = [];
  
  if (variant.material) parts.push(variant.material);
  if (variant.size) parts.push(`Size ${variant.size}`);
  if (variant.gemstone) parts.push(variant.gemstone);
  
  return parts.join(' | ');
}
