'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useWishlist } from '@/contexts/WishlistContext'
import { useCart } from '@/contexts/CartContext'
import { useAuth } from '@/contexts/AuthContext'
import { urlFor } from '@/sanity/lib/image'
import { formatCurrency } from '@/lib/utils'

export default function WishlistPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { items, removeFromWishlist } = useWishlist()
  const { addItem } = useCart()
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    // Simulate loading delay for user experience
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 500)
    
    return () => clearTimeout(timer)
  }, [])
  
  const handleAddToBag = (item: any) => {
    addItem({
      id: item.id,
      product_id: item.product_id || item.id, // Use product_id if available, fall back to id
      name: item.name,
      price: item.price,
      image: item.image,
      variant: item.variant,
      quantity: 1
    })
    
    // Optional: remove from wishlist after adding to bag
    // removeFromWishlist(item.id)
  }
  
  if (isLoading) {
    return (
      <div className="container mx-auto py-16 px-4 min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-center">
          <h2 className="text-2xl font-light mb-4">Loading your wishlist...</h2>
        </div>
      </div>
    )
  }
  
  return (
    <div className="container mx-auto py-16 px-4 min-h-screen">
      <h1 className="text-3xl font-light mb-8 text-center">YOUR WISHLIST</h1>
      
      {items.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-xl mb-8">Your wishlist is empty</p>
          {user ? (
            <p className="text-gray-600 mb-8">
              Add items to your wishlist by clicking the heart icon on product pages
            </p>
          ) : (
            <p className="text-gray-600 mb-8">
              Sign in to save items to your wishlist and access them from any device
            </p>
          )}
          <Link 
            href="/collections" 
            className="inline-block bg-black text-white px-8 py-3 hover:bg-gray-800 transition"
          >
            EXPLORE COLLECTIONS
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map((item) => (
            <div key={item.id} className="group">
              <div className="mb-4 aspect-square relative bg-gray-100 overflow-hidden">
                {item.image ? (
                  <Image
                    src={urlFor(item.image).width(500).height(500).url()}
                    alt={item.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                    <span className="text-gray-400">No image</span>
                  </div>
                )}
                
                <button
                  onClick={() => removeFromWishlist(item.id)}
                  className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center bg-white bg-opacity-80 rounded-full hover:bg-opacity-100 transition"
                  aria-label="Remove from wishlist"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-5 h-5 text-black"
                  >
                    <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                  </svg>
                </button>
              </div>
              
              <Link href={`/products/${typeof item.slug === 'object' ? item.slug.current : item.slug}`} className="block mb-1">
                <h3 className="font-medium">{item.name}</h3>
              </Link>
              
              {item.variant && (
                <p className="text-sm text-gray-500 mb-1">{item.variant}</p>
              )}
              
              <p className="text-sm mb-4">{formatCurrency(item.price)}</p>
              
              <button
                onClick={() => handleAddToBag(item)}
                className="w-full border border-black bg-white hover:bg-black hover:text-white transition py-2 text-sm"
              >
                ADD TO BAG
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
