'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'

type Profile = {
  id: string
  first_name: string | null
  last_name: string | null
  phone: string | null
}

export default function ProfileManager() {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [message, setMessage] = useState({ text: '', type: '' })
  
  // Form state
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: ''
  })
  
  // Password form state
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  })
  
  // Load profile data
  useEffect(() => {
    async function loadProfile() {
      if (!user) return
      
      try {
        setIsLoading(true)
        const supabase = createClient()
        
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        if (error && error.code !== 'PGRST116') {
          // PGRST116 means no row found, which is expected for new users
          throw error
        }
        
        if (data) {
          setFormData({
            first_name: data.first_name || '',
            last_name: data.last_name || '',
            phone: data.phone || ''
          })
        }
      } catch (error) {
        console.error('Error loading profile:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadProfile()
  }, [user])
  
  // Handle input change for profile
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    
    setFormData({
      ...formData,
      [name]: value
    })
  }
  
  // Handle input change for password
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    
    setPasswordData({
      ...passwordData,
      [name]: value
    })
  }
  
  // Save profile
  const handleSubmitProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) return
    
    try {
      setMessage({ text: '', type: '' })
      const supabase = createClient()
      
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          first_name: formData.first_name || null,
          last_name: formData.last_name || null,
          phone: formData.phone || null,
          updated_at: new Date().toISOString()
        })
      
      if (error) throw error
      
      setMessage({ 
        text: 'Profile updated successfully', 
        type: 'success' 
      })
      
      // Clear message after 3 seconds
      setTimeout(() => {
        setMessage({ text: '', type: '' })
      }, 3000)
    } catch (error) {
      console.error('Error updating profile:', error)
      setMessage({ 
        text: 'Error updating profile. Please try again.', 
        type: 'error' 
      })
    }
  }
  
  // Change password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) return
    
    if (passwordData.new_password !== passwordData.confirm_password) {
      setMessage({
        text: 'New passwords do not match',
        type: 'error'
      })
      return
    }
    
    try {
      setMessage({ text: '', type: '' })
      const supabase = createClient()
      
      const { error } = await supabase.auth.updateUser({
        password: passwordData.new_password
      })
      
      if (error) throw error
      
      setMessage({ 
        text: 'Password updated successfully', 
        type: 'success' 
      })
      
      // Reset form
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: ''
      })
      
      // Hide password form
      setShowChangePassword(false)
      
      // Clear message after 3 seconds
      setTimeout(() => {
        setMessage({ text: '', type: '' })
      }, 3000)
    } catch (error) {
      console.error('Error changing password:', error)
      setMessage({ 
        text: 'Error changing password. Please try again.', 
        type: 'error' 
      })
    }
  }
  
  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-10 bg-gray-100 rounded mb-4"></div>
        <div className="h-10 bg-gray-100 rounded mb-4"></div>
        <div className="h-10 bg-gray-100 rounded mb-4"></div>
      </div>
    )
  }
  
  return (
    <div>
      {message.text && (
        <div className={`mb-6 p-4 rounded ${
          message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {message.text}
        </div>
      )}
      
      <div className="mb-8">
        <h2 className="text-lg font-medium mb-4">Profile Information</h2>
        
        <form onSubmit={handleSubmitProfile} className="max-w-lg">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="first_name" className="block text-sm font-medium text-slateGray mb-1">
                First Name
              </label>
              <input
                id="first_name"
                name="first_name"
                type="text"
                value={formData.first_name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded"
              />
            </div>
            
            <div>
              <label htmlFor="last_name" className="block text-sm font-medium text-slateGray mb-1">
                Last Name
              </label>
              <input
                id="last_name"
                name="last_name"
                type="text"
                value={formData.last_name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded"
              />
            </div>
          </div>
          
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-slateGray mb-1">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded bg-gray-50"
            />
            <p className="text-xs text-gray-500 mt-1">
              To change your email, please contact customer support.
            </p>
          </div>
          
          <div className="mb-6">
            <label htmlFor="phone" className="block text-sm font-medium text-slateGray mb-1">
              Phone Number
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              placeholder="(Optional) For delivery updates"
              className="w-full px-4 py-2 border border-gray-300 rounded"
            />
          </div>
          
          <button 
            type="submit"
            className="px-6 py-2 bg-jetBlack text-white rounded hover:bg-gray-800 transition-colors"
          >
            Update Profile
          </button>
        </form>
      </div>
      
      <div className="mb-6 border-t border-gray-200 pt-6">
        <h2 className="text-lg font-medium mb-4">Password</h2>
        
        {!showChangePassword ? (
          <button 
            onClick={() => setShowChangePassword(true)}
            className="text-vividOrange hover:underline"
          >
            Change Password
          </button>
        ) : (
          <form onSubmit={handleChangePassword} className="max-w-lg">
            <div className="mb-4">
              <label htmlFor="current_password" className="block text-sm font-medium text-slateGray mb-1">
                Current Password
              </label>
              <input
                id="current_password"
                name="current_password"
                type="password"
                value={passwordData.current_password}
                onChange={handlePasswordChange}
                className="w-full px-4 py-2 border border-gray-300 rounded"
                required
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="new_password" className="block text-sm font-medium text-slateGray mb-1">
                New Password
              </label>
              <input
                id="new_password"
                name="new_password"
                type="password"
                value={passwordData.new_password}
                onChange={handlePasswordChange}
                className="w-full px-4 py-2 border border-gray-300 rounded"
                required
                minLength={6}
              />
              <p className="text-xs text-gray-500 mt-1">
                Password must be at least 6 characters long
              </p>
            </div>
            
            <div className="mb-6">
              <label htmlFor="confirm_password" className="block text-sm font-medium text-slateGray mb-1">
                Confirm New Password
              </label>
              <input
                id="confirm_password"
                name="confirm_password"
                type="password"
                value={passwordData.confirm_password}
                onChange={handlePasswordChange}
                className="w-full px-4 py-2 border border-gray-300 rounded"
                required
              />
            </div>
            
            <div className="flex space-x-4">
              <button 
                type="submit"
                className="px-6 py-2 bg-jetBlack text-white rounded hover:bg-gray-800 transition-colors"
              >
                Update Password
              </button>
              
              <button 
                type="button"
                onClick={() => {
                  setShowChangePassword(false)
                  setPasswordData({
                    current_password: '',
                    new_password: '',
                    confirm_password: ''
                  })
                }}
                className="px-6 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
