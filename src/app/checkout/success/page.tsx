'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCart } from '@/contexts/CartContext'
import { formatCurrency } from '@/lib/utils'

export default function CheckoutSuccessPage() {
  const router = useRouter()
  const { items } = useCart()
  const [orderDetails, setOrderDetails] = useState({
    orderId: '',
    orderTotal: 0
  })
  
  // Load order details from localStorage
  useEffect(() => {
    // Check if we have order details in localStorage
    const orderId = localStorage.getItem('lastOrderId')
    const orderTotal = localStorage.getItem('lastOrderTotal')
    
    if (orderId && orderTotal) {
      setOrderDetails({
        orderId,
        orderTotal: parseFloat(orderTotal)
      })
    } else if (items.length > 0) {
      // If no order details but cart has items, redirect back to checkout
      router.push('/checkout')
    }
  }, [items, router])
  
  return (
    <div className="container mx-auto py-16 px-4 min-h-screen">
      <div className="max-w-2xl mx-auto text-center">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-8 w-8 text-black" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M5 13l4 4L19 7" 
              />
            </svg>
          </div>
          <h1 className="text-3xl font-light mb-4">ORDER CONFIRMED</h1>
          <p className="text-xl mb-2">Thank you for your purchase</p>
          <p className="text-gray-600">
            Order #ORS-{orderDetails.orderId.substring(0, 8)}
          </p>
          <p className="text-lg mt-4">
            Total: <span className="font-medium">{formatCurrency(orderDetails.orderTotal)}</span>
          </p>
        </div>
        
        <div className="bg-gray-50 p-8 mb-8">
          <h2 className="text-xl font-medium mb-4">WHAT'S NEXT?</h2>
          <div className="space-y-4 text-left">
            <div className="flex">
              <div className="mr-4">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-black text-white">
                  1
                </div>
              </div>
              <div>
                <h3 className="font-medium">Order Processing</h3>
                <p className="text-gray-600">
                  Your order is being processed and prepared for shipment. 
                  You will receive an email confirmation shortly.
                </p>
              </div>
            </div>
            
            <div className="flex">
              <div className="mr-4">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-black text-white">
                  2
                </div>
              </div>
              <div>
                <h3 className="font-medium">Shipping</h3>
                <p className="text-gray-600">
                  Once your order is ready, it will be shipped according to your selected shipping method.
                  You will receive tracking information via email.
                </p>
              </div>
            </div>
            
            <div className="flex">
              <div className="mr-4">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-black text-white">
                  3
                </div>
              </div>
              <div>
                <h3 className="font-medium">Delivery</h3>
                <p className="text-gray-600">
                  Your order will be carefully packaged in our signature gift box and delivered to your address.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link
            href="/account/orders"
            className="bg-black text-white px-8 py-3 hover:bg-gray-800 transition"
          >
            VIEW YOUR ORDERS
          </Link>
          
          <Link
            href="/collections"
            className="border border-black px-8 py-3 hover:bg-gray-100 transition"
          >
            CONTINUE SHOPPING
          </Link>
        </div>
      </div>
    </div>
  )
}
