'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { formatCurrency } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

type Order = {
  id: string
  created_at: string
  status: string
  total: number
  items: {
    id: string
    product_id: string
    name: string
    price: number
    quantity: number
    image?: string
  }[]
}

export default function OrdersPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null)
  const [isLoadingOrders, setIsLoadingOrders] = useState(true)
  
  // Fetch orders from Supabase when component mounts
  useEffect(() => {
    async function fetchOrders() {
      if (!user) return
      
      const supabase = createClient()
      
      try {
        // Get orders
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
        
        if (ordersError) throw ordersError
        
        // For each order, get order items
        if (ordersData) {
          const ordersWithItems = await Promise.all(
            ordersData.map(async (order) => {
              const { data: itemsData, error: itemsError } = await supabase
                .from('order_items')
                .select('*')
                .eq('order_id', order.id)
              
              if (itemsError) throw itemsError
              
              return {
                ...order,
                items: itemsData || []
              }
            })
          )
          
          setOrders(ordersWithItems)
        }
      } catch (error) {
        console.error('Error fetching orders:', error)
      } finally {
        setIsLoadingOrders(false)
      }
    }
    
    if (user) {
      fetchOrders()
    } else if (!isLoading) {
      router.push('/login?redirect=/account/orders')
    }
  }, [user, isLoading, router])
  
  // Toggle order details
  const toggleOrderDetails = (orderId: string) => {
    if (activeOrderId === orderId) {
      setActiveOrderId(null)
    } else {
      setActiveOrderId(orderId)
    }
  }
  
  if (isLoading || isLoadingOrders) {
    return (
      <div className="container mx-auto py-16 px-4 min-h-screen">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-8"></div>
            <div className="h-40 bg-gray-100 rounded-md mb-4"></div>
            <div className="h-40 bg-gray-100 rounded-md mb-4"></div>
          </div>
        </div>
      </div>
    )
  }
  
  if (!user) {
    return null // Redirect handled by useEffect
  }
  
  return (
    <div className="container mx-auto py-16 px-4 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-light mb-8">YOUR ORDERS</h1>
        
        {orders.length === 0 ? (
          <div className="bg-gray-50 p-8 text-center">
            <h2 className="text-xl mb-4">No orders yet</h2>
            <p className="mb-6 text-gray-600">
              When you make a purchase, your orders will appear here.
            </p>
            <Link
              href="/collections"
              className="inline-block bg-black text-white px-8 py-3 hover:bg-gray-800 transition"
            >
              START SHOPPING
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="border border-gray-200">
                <div 
                  className="p-4 bg-gray-50 flex justify-between items-center cursor-pointer"
                  onClick={() => toggleOrderDetails(order.id)}
                >
                  <div>
                    <div className="font-medium">Order #{order.id.slice(-6).toUpperCase()}</div>
                    <div className="text-sm text-gray-500">
                      {new Date(order.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <div className="mr-4 text-right">
                      <div className="font-medium">{formatCurrency(order.total)}</div>
                      <div className="text-sm text-gray-500">
                        {order.status === 'completed' ? 'Delivered' : 
                         order.status === 'processing' ? 'Processing' : 
                         order.status === 'shipped' ? 'Shipped' : 'Ordered'}
                      </div>
                    </div>
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className={`h-5 w-5 transform transition-transform ${activeOrderId === order.id ? 'rotate-180' : ''}`}
                      viewBox="0 0 20 20" 
                      fill="currentColor"
                    >
                      <path 
                        fillRule="evenodd" 
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" 
                        clipRule="evenodd" 
                      />
                    </svg>
                  </div>
                </div>
                
                {activeOrderId === order.id && (
                  <div className="p-4 border-t border-gray-200">
                    <div className="mb-6">
                      <h3 className="font-medium mb-2">Items</h3>
                      <div className="space-y-4">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex items-start">
                            <div className="w-16 h-16 bg-gray-100 mr-4 relative flex-shrink-0">
                              {item.image && (
                                <Image
                                  src={item.image}
                                  alt={item.name}
                                  fill
                                  className="object-cover"
                                />
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium">{item.name}</div>
                              <div className="text-sm text-gray-500">
                                Quantity: {item.quantity}
                              </div>
                              <div className="text-sm text-gray-500">
                                {formatCurrency(item.price)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="font-medium mb-2">Shipping Address</h3>
                        <div className="text-sm text-gray-600">
                          <p>John Doe</p>
                          <p>123 Main St</p>
                          <p>Apt 4B</p>
                          <p>New York, NY 10001</p>
                          <p>United States</p>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="font-medium mb-2">Order Summary</h3>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Subtotal</span>
                            <span>{formatCurrency(order.total - 15 - (order.total * 0.08))}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Shipping</span>
                            <span>{formatCurrency(15)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Tax</span>
                            <span>{formatCurrency(order.total * 0.08)}</span>
                          </div>
                          <div className="flex justify-between font-medium pt-2 border-t border-gray-200 mt-2">
                            <span>Total</span>
                            <span>{formatCurrency(order.total)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {order.status !== 'completed' && (
                      <div className="mt-6 flex justify-end">
                        <Link
                          href={`/account/orders/${order.id}`}
                          className="text-sm underline"
                        >
                          Track Order
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
