'use client'

import { useEffect, useState } from 'react'
import { useCart } from '@/contexts/CartContext'
import { urlFor } from '@/sanity/lib/image'

// This is a temporary component to debug Sanity image loading in the cart
export default function CartImageDebug() {
  const { items } = useCart()
  const [imageDebug, setImageDebug] = useState<any[]>([])
  
  useEffect(() => {
    if (items.length > 0) {
      const debug = items.map(item => {
        return {
          product_id: item.product_id,
          hasImage: !!item.image,
          imageType: item.image ? typeof item.image : 'none',
          imageKeys: item.image ? Object.keys(item.image) : [],
          imageStringified: item.image ? JSON.stringify(item.image) : 'none',
          urlResult: item.image ? urlFor(item.image).width(200).height(200).url() : 'none'
        }
      })
      setImageDebug(debug)
    }
  }, [items])
  
  if (items.length === 0) {
    return <p className="text-sm text-gray-500">Add items to cart to debug image loading</p>
  }
  
  return (
    <div className="bg-white border border-gray-200 p-4 rounded-lg mt-8">
      <h3 className="text-sm font-medium mb-2">Cart Image Debug (Admin Only)</h3>
      <div className="overflow-auto max-h-64">
        <pre className="text-xs">{JSON.stringify(imageDebug, null, 2)}</pre>
      </div>
    </div>
  )
}
