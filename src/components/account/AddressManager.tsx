'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'

type Address = {
  id: string
  name: string
  address_line1: string
  address_line2: string | null
  city: string
  state: string
  postal_code: string
  country: string
  is_default: boolean
  is_billing: boolean
  is_shipping: boolean
}

export default function AddressManager() {
  const { user } = useAuth()
  const [addresses, setAddresses] = useState<Address[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'United States',
    is_default: false,
    is_billing: false,
    is_shipping: true
  })
  
  // Load addresses
  useEffect(() => {
    async function loadAddresses() {
      if (!user) return
      
      try {
        setIsLoading(true)
        const supabase = createClient()
        
        const { data, error } = await supabase
          .from('addresses')
          .select('*')
          .eq('user_id', user.id)
          .order('is_default', { ascending: false })
        
        if (error) throw error
        
        setAddresses(data || [])
      } catch (error) {
        console.error('Error loading addresses:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadAddresses()
  }, [user])
  
  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined
    
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    })
  }
  
  // Set up form for editing
  const handleEdit = (address: Address) => {
    setFormData({
      name: address.name,
      address_line1: address.address_line1,
      address_line2: address.address_line2 || '',
      city: address.city,
      state: address.state,
      postal_code: address.postal_code,
      country: address.country,
      is_default: address.is_default,
      is_billing: address.is_billing,
      is_shipping: address.is_shipping
    })
    
    setEditingAddress(address)
    setShowAddForm(true)
  }
  
  // Reset form 
  const resetForm = () => {
    setFormData({
      name: '',
      address_line1: '',
      address_line2: '',
      city: '',
      state: '',
      postal_code: '',
      country: 'United States',
      is_default: false,
      is_billing: false,
      is_shipping: true
    })
    
    setEditingAddress(null)
    setShowAddForm(false)
  }
  
  // Save address
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) return
    
    try {
      const supabase = createClient()
      
      // If an address is being set as default, update all other addresses to not be default
      if (formData.is_default) {
        await supabase
          .from('addresses')
          .update({ is_default: false })
          .eq('user_id', user.id)
      }
      
      if (editingAddress) {
        // Update existing address
        const { error } = await supabase
          .from('addresses')
          .update({
            name: formData.name,
            address_line1: formData.address_line1,
            address_line2: formData.address_line2 || null,
            city: formData.city,
            state: formData.state,
            postal_code: formData.postal_code,
            country: formData.country,
            is_default: formData.is_default,
            is_billing: formData.is_billing,
            is_shipping: formData.is_shipping,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingAddress.id)
        
        if (error) throw error
      } else {
        // Create new address
        const { error } = await supabase
          .from('addresses')
          .insert({
            user_id: user.id,
            name: formData.name,
            address_line1: formData.address_line1,
            address_line2: formData.address_line2 || null,
            city: formData.city,
            state: formData.state,
            postal_code: formData.postal_code,
            country: formData.country,
            is_default: formData.is_default,
            is_billing: formData.is_billing,
            is_shipping: formData.is_shipping
          })
        
        if (error) throw error
      }
      
      // Reload addresses
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
      
      if (error) throw error
      
      setAddresses(data || [])
      resetForm()
    } catch (error) {
      console.error('Error saving address:', error)
    }
  }
  
  // Delete address
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this address?')) return
    
    try {
      const supabase = createClient()
      
      const { error } = await supabase
        .from('addresses')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      
      setAddresses(addresses.filter(address => address.id !== id))
    } catch (error) {
      console.error('Error deleting address:', error)
    }
  }
  
  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
        <div className="space-y-4">
          <div className="h-32 bg-gray-100 rounded"></div>
          <div className="h-32 bg-gray-100 rounded"></div>
        </div>
      </div>
    )
  }
  
  return (
    <div>
      {!showAddForm ? (
        <>
          {addresses.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-slateGray mb-4">You don't have any saved addresses yet.</p>
              <button 
                onClick={() => setShowAddForm(true)}
                className="px-6 py-2 bg-jetBlack text-white rounded hover:bg-gray-800 transition-colors"
              >
                Add New Address
              </button>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-medium">Your Addresses</h2>
                <button 
                  onClick={() => setShowAddForm(true)}
                  className="px-4 py-2 bg-jetBlack text-white text-sm rounded hover:bg-gray-800 transition-colors"
                >
                  Add New Address
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {addresses.map(address => (
                  <div key={address.id} className="border border-gray-200 rounded p-4 relative">
                    {address.is_default && (
                      <span className="absolute top-2 right-2 text-xs bg-gray-100 px-2 py-1 rounded">
                        Default
                      </span>
                    )}
                    
                    <div className="mb-2 font-medium">{address.name}</div>
                    <div className="text-sm text-slateGray mb-4">
                      <div>{address.address_line1}</div>
                      {address.address_line2 && <div>{address.address_line2}</div>}
                      <div>{address.city}, {address.state} {address.postal_code}</div>
                      <div>{address.country}</div>
                    </div>
                    
                    <div className="text-xs text-gray-500 mb-4">
                      {address.is_billing && address.is_shipping ? (
                        <span>Billing & Shipping</span>
                      ) : address.is_billing ? (
                        <span>Billing</span>
                      ) : (
                        <span>Shipping</span>
                      )}
                    </div>
                    
                    <div className="flex space-x-3">
                      <button 
                        onClick={() => handleEdit(address)}
                        className="text-sm text-vividOrange hover:underline"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(address.id)}
                        className="text-sm text-gray-500 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      ) : (
        <div className="bg-gray-50 p-6 rounded">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-medium">
              {editingAddress ? 'Edit Address' : 'Add New Address'}
            </h2>
            <button 
              onClick={resetForm}
              className="text-sm text-gray-500 hover:underline"
            >
              Cancel
            </button>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="name" className="block text-sm font-medium text-slateGray mb-1">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded"
                required
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="address_line1" className="block text-sm font-medium text-slateGray mb-1">
                Street Address
              </label>
              <input
                id="address_line1"
                name="address_line1"
                type="text"
                value={formData.address_line1}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded"
                required
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="address_line2" className="block text-sm font-medium text-slateGray mb-1">
                Apartment, suite, etc. (optional)
              </label>
              <input
                id="address_line2"
                name="address_line2"
                type="text"
                value={formData.address_line2}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-slateGray mb-1">
                  City
                </label>
                <input
                  id="city"
                  name="city"
                  type="text"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="state" className="block text-sm font-medium text-slateGray mb-1">
                  State / Province
                </label>
                <input
                  id="state"
                  name="state"
                  type="text"
                  value={formData.state}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded"
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="postal_code" className="block text-sm font-medium text-slateGray mb-1">
                  Postal Code
                </label>
                <input
                  id="postal_code"
                  name="postal_code"
                  type="text"
                  value={formData.postal_code}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="country" className="block text-sm font-medium text-slateGray mb-1">
                  Country
                </label>
                <select
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded"
                  required
                >
                  <option value="United States">United States</option>
                  <option value="Canada">Canada</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="Australia">Australia</option>
                  <option value="France">France</option>
                  <option value="Germany">Germany</option>
                  <option value="Japan">Japan</option>
                </select>
              </div>
            </div>
            
            <div className="space-y-2 mb-6">
              <div className="flex items-center">
                <input
                  id="is_default"
                  name="is_default"
                  type="checkbox"
                  checked={formData.is_default}
                  onChange={handleChange}
                  className="mr-2"
                />
                <label htmlFor="is_default" className="text-sm text-slateGray">
                  Set as default address
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  id="is_shipping"
                  name="is_shipping"
                  type="checkbox"
                  checked={formData.is_shipping}
                  onChange={handleChange}
                  className="mr-2"
                />
                <label htmlFor="is_shipping" className="text-sm text-slateGray">
                  Use as shipping address
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  id="is_billing"
                  name="is_billing"
                  type="checkbox"
                  checked={formData.is_billing}
                  onChange={handleChange}
                  className="mr-2"
                />
                <label htmlFor="is_billing" className="text-sm text-slateGray">
                  Use as billing address
                </label>
              </div>
            </div>
            
            <button 
              type="submit"
              className="px-6 py-2 bg-jetBlack text-white rounded hover:bg-gray-800 transition-colors"
            >
              {editingAddress ? 'Update Address' : 'Save Address'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
