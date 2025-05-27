'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCart } from '@/contexts/CartContext'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'

// Component for each step in the checkout process
const CheckoutStep = ({ 
  title, 
  isActive, 
  isCompleted, 
  children, 
  onEdit 
}: { 
  title: string, 
  isActive: boolean, 
  isCompleted: boolean, 
  children: React.ReactNode,
  onEdit?: () => void 
}) => {
  return (
    <div className={`border ${isActive ? 'border-black' : 'border-gray-200'} mb-6`}>
      <div className="flex justify-between items-center p-4 bg-gray-50">
        <h3 className="font-medium text-lg">{title}</h3>
        {isCompleted && !isActive && (
          <button 
            onClick={onEdit} 
            className="text-sm underline"
          >
            Edit
          </button>
        )}
      </div>
      {isActive && (
        <div className="p-6">
          {children}
        </div>
      )}
    </div>
  )
}

export default function CheckoutPage() {
  const router = useRouter()
  const { items, clearCart } = useCart()
  const { user } = useAuth()
  
  const [activeStep, setActiveStep] = useState('contact')
  const [subtotal, setSubtotal] = useState(0)
  const [shippingCost, setShippingCost] = useState(0)
  const [tax, setTax] = useState(0)
  
  // Form states
  const [contactInfo, setContactInfo] = useState({
    email: user?.email || '',
    phone: '',
    contactComplete: false
  })
  
  const [shippingInfo, setShippingInfo] = useState({
    firstName: '',
    lastName: '',
    address: '',
    apartment: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States',
    shippingComplete: false
  })
  
  const [shippingMethod, setShippingMethod] = useState({
    method: 'standard',
    shippingMethodComplete: false
  })
  
  const [paymentInfo, setPaymentInfo] = useState({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: '',
    sameAsShipping: true,
    paymentComplete: false
  })
  
  // Calculate order totals
  useEffect(() => {
    const total = items.reduce((sum, item) => {
      return sum + (item.price * item.quantity)
    }, 0)
    setSubtotal(total)
    
    // Calculate estimated tax (for demo purposes)
    setTax(total * 0.08) // Assuming 8% tax rate
    
    // Set shipping cost based on method
    if (shippingMethod.method === 'express') {
      setShippingCost(35)
    } else if (shippingMethod.method === 'standard') {
      setShippingCost(15)
    } else {
      setShippingCost(0)
    }
  }, [items, shippingMethod.method])
  
  // Check if user is logged in
  useEffect(() => {
    if (!user) {
      router.push('/login?redirect=/checkout')
    }
  }, [user, router])
  
  // Handle contact form submission
  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setContactInfo({ ...contactInfo, contactComplete: true })
    setActiveStep('shipping')
  }
  
  // Handle shipping form submission
  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setShippingInfo({ ...shippingInfo, shippingComplete: true })
    setActiveStep('shipping-method')
  }
  
  // Handle shipping method selection
  const handleShippingMethodSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setShippingMethod({ ...shippingMethod, shippingMethodComplete: true })
    setActiveStep('payment')
  }
  
  // Handle payment form submission
  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPaymentInfo({ ...paymentInfo, paymentComplete: true })
    
    // Submit order (in a real app, this would call an API)
    handlePlaceOrder()
  }
  
  // Place order
  const handlePlaceOrder = async () => {
    try {
      if (!user) {
        throw new Error('User must be logged in to place an order')
      }

      // Calculate final order total
      const orderTotal = subtotal + shippingCost + tax

      // Create supabase client
      const supabase = createClient()
      
      // First, create the order record
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          status: 'pending',
          total: orderTotal,
          shipping_fee: shippingCost,
          tax: tax,
          payment_method: 'Credit Card', // From the form
          notes: `Shipping method: ${shippingMethod.method === 'express' ? 'Express' : 'Standard'}`
        })
        .select('id')
        .single()
      
      if (orderError) {
        throw new Error(`Failed to create order: ${orderError.message}`)
      }
      
      if (!orderData || !orderData.id) {
        throw new Error('Order created but no ID returned')
      }
      
      console.log('Order created with ID:', orderData.id)
      
      // Now create order items for each cart item
      const orderItems = items.map(item => ({
        order_id: orderData.id,
        product_id: item.product_id,
        name: item.name || 'OrangeSmith Fine Jewelry',
        price: item.price,
        quantity: item.quantity,
        variant: item.variant || null,
        // Generate a placeholder image URL if none exists
        image_url: item.image ? `https://cdn.sanity.io/images/${item.image}` : null
      }))
      
      // Insert all order items
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)
      
      if (itemsError) {
        console.error('Error saving order items:', itemsError)
        // Even if there's an error with items, we'll continue since the order was created
      }
      
      // Create shipping address record
      const { error: addressError } = await supabase
        .from('addresses')
        .insert({
          user_id: user.id,
          name: `${shippingInfo.firstName} ${shippingInfo.lastName}`,
          address_line1: shippingInfo.address,
          address_line2: shippingInfo.apartment,
          city: shippingInfo.city,
          state: shippingInfo.state,
          postal_code: shippingInfo.zipCode,
          country: shippingInfo.country,
          is_default: false,
          is_shipping: true
        })

      if (addressError) {
        console.error('Error saving shipping address:', addressError)
        // Continue even if address save fails
      }

      // Store the order ID in localStorage for reference on the success page
      localStorage.setItem('lastOrderId', orderData.id)
      localStorage.setItem('lastOrderTotal', orderTotal.toString())
      
      // Clear cart
      await clearCart()
      
      // Redirect to success page
      router.push('/checkout/success')
      
    } catch (error) {
      console.error('Error placing order:', error)
      alert('There was an error processing your order. Please try again.')
    }
  }
  
  // If cart is empty, redirect to cart page
  if (items.length === 0) {
    return (
      <div className="container mx-auto py-16 px-4 min-h-screen">
        <div className="text-center py-16">
          <h1 className="text-3xl font-light mb-8">YOUR BAG IS EMPTY</h1>
          <p className="mb-8">Add items to your bag before proceeding to checkout</p>
          <Link 
            href="/cart" 
            className="inline-block bg-black text-white px-8 py-3 hover:bg-gray-800 transition"
          >
            RETURN TO BAG
          </Link>
        </div>
      </div>
    )
  }
  
  return (
    <div className="container mx-auto py-16 px-4 min-h-screen">
      <h1 className="text-3xl font-light mb-12 text-center">CHECKOUT</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {/* Contact Information */}
          <CheckoutStep 
            title="Contact Information" 
            isActive={activeStep === 'contact'} 
            isCompleted={contactInfo.contactComplete}
            onEdit={() => setActiveStep('contact')}
          >
            <form onSubmit={handleContactSubmit}>
              <div className="mb-4">
                <label htmlFor="email" className="block mb-2 text-sm">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  className="w-full p-2 border border-gray-300"
                  value={contactInfo.email}
                  onChange={(e) => setContactInfo({...contactInfo, email: e.target.value})}
                  required
                />
              </div>
              
              <div className="mb-6">
                <label htmlFor="phone" className="block mb-2 text-sm">
                  Phone Number (for delivery updates)
                </label>
                <input
                  type="tel"
                  id="phone"
                  className="w-full p-2 border border-gray-300"
                  value={contactInfo.phone}
                  onChange={(e) => setContactInfo({...contactInfo, phone: e.target.value})}
                  required
                />
              </div>
              
              <button 
                type="submit"
                className="bg-black text-white px-6 py-3 w-full hover:bg-gray-800 transition"
              >
                CONTINUE TO SHIPPING
              </button>
            </form>
          </CheckoutStep>
          
          {/* Shipping Address */}
          <CheckoutStep 
            title="Shipping Address" 
            isActive={activeStep === 'shipping'} 
            isCompleted={shippingInfo.shippingComplete}
            onEdit={() => setActiveStep('shipping')}
          >
            <form onSubmit={handleShippingSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="firstName" className="block mb-2 text-sm">
                    First Name
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    className="w-full p-2 border border-gray-300"
                    value={shippingInfo.firstName}
                    onChange={(e) => setShippingInfo({...shippingInfo, firstName: e.target.value})}
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="lastName" className="block mb-2 text-sm">
                    Last Name
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    className="w-full p-2 border border-gray-300"
                    value={shippingInfo.lastName}
                    onChange={(e) => setShippingInfo({...shippingInfo, lastName: e.target.value})}
                    required
                  />
                </div>
              </div>
              
              <div className="mb-4">
                <label htmlFor="address" className="block mb-2 text-sm">
                  Address
                </label>
                <input
                  type="text"
                  id="address"
                  className="w-full p-2 border border-gray-300"
                  value={shippingInfo.address}
                  onChange={(e) => setShippingInfo({...shippingInfo, address: e.target.value})}
                  required
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="apartment" className="block mb-2 text-sm">
                  Apartment, suite, etc. (optional)
                </label>
                <input
                  type="text"
                  id="apartment"
                  className="w-full p-2 border border-gray-300"
                  value={shippingInfo.apartment}
                  onChange={(e) => setShippingInfo({...shippingInfo, apartment: e.target.value})}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label htmlFor="city" className="block mb-2 text-sm">
                    City
                  </label>
                  <input
                    type="text"
                    id="city"
                    className="w-full p-2 border border-gray-300"
                    value={shippingInfo.city}
                    onChange={(e) => setShippingInfo({...shippingInfo, city: e.target.value})}
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="state" className="block mb-2 text-sm">
                    State
                  </label>
                  <input
                    type="text"
                    id="state"
                    className="w-full p-2 border border-gray-300"
                    value={shippingInfo.state}
                    onChange={(e) => setShippingInfo({...shippingInfo, state: e.target.value})}
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="zipCode" className="block mb-2 text-sm">
                    ZIP Code
                  </label>
                  <input
                    type="text"
                    id="zipCode"
                    className="w-full p-2 border border-gray-300"
                    value={shippingInfo.zipCode}
                    onChange={(e) => setShippingInfo({...shippingInfo, zipCode: e.target.value})}
                    required
                  />
                </div>
              </div>
              
              <div className="mb-6">
                <label htmlFor="country" className="block mb-2 text-sm">
                  Country
                </label>
                <select
                  id="country"
                  className="w-full p-2 border border-gray-300"
                  value={shippingInfo.country}
                  onChange={(e) => setShippingInfo({...shippingInfo, country: e.target.value})}
                  required
                >
                  <option value="United States">United States</option>
                  <option value="Canada">Canada</option>
                  <option value="United Kingdom">United Kingdom</option>
                </select>
              </div>
              
              <button 
                type="submit"
                className="bg-black text-white px-6 py-3 w-full hover:bg-gray-800 transition"
              >
                CONTINUE TO SHIPPING METHOD
              </button>
            </form>
          </CheckoutStep>
          
          {/* Shipping Method */}
          <CheckoutStep 
            title="Shipping Method" 
            isActive={activeStep === 'shipping-method'} 
            isCompleted={shippingMethod.shippingMethodComplete}
            onEdit={() => setActiveStep('shipping-method')}
          >
            <form onSubmit={handleShippingMethodSubmit}>
              <div className="space-y-4 mb-6">
                <div className="border border-gray-200 p-4 flex items-start">
                  <input 
                    type="radio" 
                    id="standard" 
                    name="shippingMethod"
                    className="mt-1 mr-3"
                    checked={shippingMethod.method === 'standard'}
                    onChange={() => setShippingMethod({...shippingMethod, method: 'standard'})}
                    required
                  />
                  <label htmlFor="standard" className="flex-1">
                    <div className="flex justify-between">
                      <span className="font-medium">Standard Shipping</span>
                      <span className="font-medium">{formatCurrency(15)}</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Delivery in 5-7 business days
                    </p>
                  </label>
                </div>
                
                <div className="border border-gray-200 p-4 flex items-start">
                  <input 
                    type="radio" 
                    id="express" 
                    name="shippingMethod"
                    className="mt-1 mr-3"
                    checked={shippingMethod.method === 'express'}
                    onChange={() => setShippingMethod({...shippingMethod, method: 'express'})}
                  />
                  <label htmlFor="express" className="flex-1">
                    <div className="flex justify-between">
                      <span className="font-medium">Express Shipping</span>
                      <span className="font-medium">{formatCurrency(35)}</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Delivery in 2-3 business days
                    </p>
                  </label>
                </div>
              </div>
              
              <button 
                type="submit"
                className="bg-black text-white px-6 py-3 w-full hover:bg-gray-800 transition"
              >
                CONTINUE TO PAYMENT
              </button>
            </form>
          </CheckoutStep>
          
          {/* Payment Information */}
          <CheckoutStep 
            title="Payment" 
            isActive={activeStep === 'payment'} 
            isCompleted={paymentInfo.paymentComplete}
            onEdit={() => setActiveStep('payment')}
          >
            <form onSubmit={handlePaymentSubmit}>
              <div className="mb-4">
                <label htmlFor="cardNumber" className="block mb-2 text-sm">
                  Card Number
                </label>
                <input
                  type="text"
                  id="cardNumber"
                  placeholder="1234 5678 9012 3456"
                  className="w-full p-2 border border-gray-300"
                  value={paymentInfo.cardNumber}
                  onChange={(e) => setPaymentInfo({...paymentInfo, cardNumber: e.target.value})}
                  required
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="cardName" className="block mb-2 text-sm">
                  Name on Card
                </label>
                <input
                  type="text"
                  id="cardName"
                  className="w-full p-2 border border-gray-300"
                  value={paymentInfo.cardName}
                  onChange={(e) => setPaymentInfo({...paymentInfo, cardName: e.target.value})}
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label htmlFor="expiryDate" className="block mb-2 text-sm">
                    Expiry Date (MM/YY)
                  </label>
                  <input
                    type="text"
                    id="expiryDate"
                    placeholder="MM/YY"
                    className="w-full p-2 border border-gray-300"
                    value={paymentInfo.expiryDate}
                    onChange={(e) => setPaymentInfo({...paymentInfo, expiryDate: e.target.value})}
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="cvv" className="block mb-2 text-sm">
                    CVV
                  </label>
                  <input
                    type="text"
                    id="cvv"
                    placeholder="123"
                    className="w-full p-2 border border-gray-300"
                    value={paymentInfo.cvv}
                    onChange={(e) => setPaymentInfo({...paymentInfo, cvv: e.target.value})}
                    required
                  />
                </div>
              </div>
              
              <div className="mb-6">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="sameAsShipping"
                    className="mr-2"
                    checked={paymentInfo.sameAsShipping}
                    onChange={(e) => setPaymentInfo({...paymentInfo, sameAsShipping: e.target.checked})}
                  />
                  <label htmlFor="sameAsShipping" className="text-sm">
                    Billing address same as shipping address
                  </label>
                </div>
              </div>
              
              <button 
                type="submit"
                className="bg-black text-white px-6 py-3 w-full hover:bg-gray-800 transition"
              >
                PLACE ORDER
              </button>
            </form>
          </CheckoutStep>
        </div>
        
        <div className="lg:col-span-1">
          {/* Order Summary */}
          <div className="bg-gray-50 p-6 sticky top-24">
            <h2 className="text-xl font-medium mb-4">ORDER SUMMARY</h2>
            
            <div className="max-h-80 overflow-y-auto mb-6">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between py-2 border-b border-gray-200">
                  <div className="flex items-center">
                    <span className="text-gray-600 mr-2">{item.quantity}×</span>
                    <span>{item.name}</span>
                  </div>
                  <span>{formatCurrency(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>
                  {shippingMethod.shippingMethodComplete 
                    ? formatCurrency(shippingCost) 
                    : 'Calculated next'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Estimated Tax</span>
                <span>{formatCurrency(tax)}</span>
              </div>
            </div>
            
            <div className="border-t border-gray-200 pt-4">
              <div className="flex justify-between font-medium">
                <span>Total</span>
                <span>{formatCurrency(subtotal + shippingCost + tax)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
