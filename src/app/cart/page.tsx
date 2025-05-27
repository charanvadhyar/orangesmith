'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useCart } from '@/contexts/CartContext'
import { useAuth } from '@/contexts/AuthContext'
import { urlFor } from '@/sanity/lib/image'
import { formatCurrency } from '@/lib/utils'

export default function Cart() {
  const { items, removeItem, updateQuantity, clearCart, isLoading } = useCart()
  const { user } = useAuth()
  
  // Calculate subtotal
  const subtotal = items.reduce((total, item) => {
    return total + (item.price * item.quantity)
  }, 0)
  
  // Format currency consistently
  const formatPrice = (price: number) => {
    return formatCurrency(price)
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-16 px-4 min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-center">
          <header className="mb-10">
            <h1 className="text-3xl font-light tracking-wide">Shopping Cart</h1>
            <div className="h-px bg-gray-200 w-20 mt-2"></div>
          </header>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-16 px-4 min-h-screen">
      <header className="mb-10">
        <h1 className="text-3xl font-light tracking-wide">Shopping Cart</h1>
        <div className="h-px bg-gray-200 w-20 mt-2"></div>
      </header>

      
      {items.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-xl mb-8">Your bag is empty</p>
          <Link 
            href="/collections" 
            className="inline-block bg-black text-white px-8 py-3 hover:bg-gray-800 transition"
          >
            CONTINUE SHOPPING
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {/* Cart Items */}
            <div className="space-y-6">
              {items.map((item, index) => (
                <div key={item.id || `cart-item-${index}`} className="grid grid-cols-5 gap-4 border-b border-gray-200 pb-6">
                  <div className="col-span-2 sm:col-span-1">
                    <div className="aspect-square relative bg-gray-50 border border-gray-200 overflow-hidden">
                      {item.image ? (
                        <Image 
                          src={urlFor(item.image).width(400).height(400).url()}
                          alt={item.name || 'Luxury Jewelry'}
                          fill
                          className="object-cover hover:scale-105 transition-transform"
                          priority
                          sizes="(max-width: 640px) 50vw, 25vw"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="flex flex-col items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-300 mb-1" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 2a4 4 0 100 8 4 4 0 000-8zm0 10a6 6 0 100-12 6 6 0 000 12z" clipRule="evenodd" />
                              <path d="M10 12a7.966 7.966 0 01-5.3-2.053A1 1 0 013.9 9.1a9 9 0 0012.2 0 1 1 0 01-.2.847A7.967 7.967 0 0110 12z" />
                            </svg>
                            <span className="text-xs text-gray-400 font-light tracking-wide uppercase">
                              {item.name ? item.name.split(' ')[0] : 'OrangeSmith Fine Jewelry'}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="col-span-3 sm:col-span-4 ml-4 sm:ml-6 flex flex-col">
                    <h3 className="font-light text-lg mb-1">{item.name}</h3>
                    <p className="text-gray-600 text-sm mb-1">{formatPrice(item.price)}</p>
                    {/* Display variant information */}
                    {item.variant && (
                      <div className="mb-2">
                        <p className="text-xs text-gray-500 uppercase tracking-wider">
                          {item.variant}
                        </p>
                      </div>
                    )}
                    
                    <div className="mt-2 flex items-center gap-2">
                      <button 
                        onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                        className="w-8 h-8 flex items-center justify-center border border-gray-300 text-gray-600 focus:outline-none hover:bg-gray-50"
                        aria-label="Decrease quantity"
                      >
                        -
                      </button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center border border-gray-300 text-gray-600 focus:outline-none hover:bg-gray-50"
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>
                    
                    {/* View item & Remove buttons */}
                    <div className="mt-auto flex items-center gap-4">
                      {item.slug && typeof item.slug === 'string' && (
                        <Link 
                          href={`/products/${encodeURIComponent(item.slug)}`}
                          className="text-xs text-gray-600 uppercase tracking-wider hover:text-black transition-colors"
                        >
                          View Details
                        </Link>
                      )}
                      <button 
                        onClick={() => removeItem(item.id)}
                        className="text-xs text-red-600 uppercase tracking-wider hover:text-red-800 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="lg:col-span-1">
            {/* Order Summary */}
            <div className="bg-gray-50 p-6 sticky top-24">
              <div className="flex justify-between items-center pb-6 mb-6 border-b border-gray-200">
                <h2 className="text-xl font-light">Order Summary</h2>
                <span className="text-sm text-gray-600">{items.length} {items.length === 1 ? 'item' : 'items'}</span>
              </div>
              <div className="space-y-3 mb-8">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping</span>
                  <span className="text-gray-500 text-xs">Calculated at checkout</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Taxes</span>
                  <span className="text-gray-500 text-xs">Calculated at checkout</span>
                </div>
              </div>
              
              <div className="border-t border-gray-200 pt-4 mb-6">
                <div className="flex justify-between items-center py-4">
                  <span className="text-lg font-light">Subtotal</span>
                  <span className="text-xl">{formatPrice(subtotal)}</span>
                </div>
                <div className="mb-2 text-xs text-gray-500 text-right">
                  Shipping and taxes calculated at checkout
                </div>
                
                <div className="mt-6">
                  <Link 
                    href={user ? "/checkout" : "/login?redirect=/checkout"}
                    className="block w-full bg-black text-white py-3 px-4 text-center hover:bg-gray-800 transition tracking-wide font-light"
                  >
                    {user ? "Proceed to Checkout" : "Sign In to Checkout"}
                  </Link>
                </div>
              </div>
              
              <Link
                href="/collections"
                className="block text-center text-sm border border-gray-300 px-6 py-3 w-full hover:bg-gray-50 transition mt-4 text-gray-700 uppercase tracking-wider font-light"
              >
                Continue Shopping
              </Link>
              
              {items.length > 0 && (
                <>
                  <button
                    onClick={() => clearCart()}
                    className="block text-center text-xs text-gray-500 w-full mt-4 hover:text-gray-700 transition tracking-wider uppercase"
                  >
                    Clear Cart
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
