import { SanityImageSource } from '@sanity/image-url/lib/types/types'

export interface CartItem {
  id: string
  product_id: string
  name: string
  price: number
  quantity: number
  variant?: string
  image?: SanityImageSource
  slug?: string
}

export interface WishlistItem {
  id: string
  product_id: string
  name: string
  price: number
  variant?: string
  slug: string
  image?: SanityImageSource
}
