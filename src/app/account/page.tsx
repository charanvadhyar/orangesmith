'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useWishlist } from '@/contexts/WishlistContext'
import Link from 'next/link'
import AddressManager from '@/components/account/AddressManager'
import ProfileManager from '@/components/account/ProfileManager'

export default function AccountPage() {
  const { user, isLoading, signOut } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('dashboard')
  const { items: wishlistItems } = useWishlist() // Move hook to top level

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [isLoading, user, router])

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse text-slateGray">Loading...</div>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect via useEffect
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-16">
      <nav className="mb-8 text-sm text-slateGray">
        <Link href="/" className="hover:text-vividOrange">Home</Link>
        <span className="mx-2">/</span>
        <span>My Account</span>
      </nav>
      
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <div className="md:w-1/4">
          <div className="bg-white p-6 border border-gray-200 rounded-sm mb-6">
            <div className="mb-6">
              <h2 className="text-lg font-medium text-jetBlack mb-2">My Account</h2>
              <p className="text-sm text-slateGray">{user.email}</p>
            </div>
            
            <nav>
              <ul className="space-y-2">
                <li>
                  <button 
                    onClick={() => setActiveTab('dashboard')}
                    className={`w-full text-left px-4 py-2 text-sm rounded ${
                      activeTab === 'dashboard' 
                        ? 'bg-gray-100 text-jetBlack font-medium' 
                        : 'text-slateGray hover:bg-gray-50'
                    }`}
                  >
                    Dashboard
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setActiveTab('orders')}
                    className={`w-full text-left px-4 py-2 text-sm rounded ${
                      activeTab === 'orders' 
                        ? 'bg-gray-100 text-jetBlack font-medium' 
                        : 'text-slateGray hover:bg-gray-50'
                    }`}
                  >
                    Orders
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setActiveTab('addresses')}
                    className={`w-full text-left px-4 py-2 text-sm rounded ${
                      activeTab === 'addresses' 
                        ? 'bg-gray-100 text-jetBlack font-medium' 
                        : 'text-slateGray hover:bg-gray-50'
                    }`}
                  >
                    Addresses
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setActiveTab('wishlist')}
                    className={`w-full text-left px-4 py-2 text-sm rounded ${
                      activeTab === 'wishlist' 
                        ? 'bg-gray-100 text-jetBlack font-medium' 
                        : 'text-slateGray hover:bg-gray-50'
                    }`}
                  >
                    Wishlist
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setActiveTab('settings')}
                    className={`w-full text-left px-4 py-2 text-sm rounded ${
                      activeTab === 'settings' 
                        ? 'bg-gray-100 text-jetBlack font-medium' 
                        : 'text-slateGray hover:bg-gray-50'
                    }`}
                  >
                    Account Settings
                  </button>
                </li>
                <li>
                  <button 
                    onClick={handleSignOut}
                    className="w-full text-left px-4 py-2 text-sm text-slateGray hover:bg-gray-50 rounded"
                  >
                    Sign Out
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="md:w-3/4">
          {activeTab === 'dashboard' && (
            <div className="bg-white p-6 border border-gray-200 rounded-sm">
              <h1 className="text-xl font-medium text-jetBlack mb-6">Dashboard</h1>
              <p className="text-slateGray mb-4">
                Welcome to your account dashboard, {user.email}.
              </p>
              <p className="text-slateGray mb-4">
                From here you can view your recent orders, manage your shipping addresses, 
                and edit your account settings.
              </p>
            </div>
          )}
          
          {activeTab === 'orders' && (
            <div className="bg-white p-6 border border-gray-200 rounded-sm">
              <h1 className="text-xl font-medium text-jetBlack mb-6">My Orders</h1>
              <div className="text-right mb-4">
                <Link 
                  href="/account/orders"
                  className="text-vividOrange hover:underline"
                >
                  View All Orders
                </Link>
              </div>
            </div>
          )}
          
          {activeTab === 'addresses' && (
            <div className="bg-white p-6 border border-gray-200 rounded-sm">
              <h1 className="text-xl font-medium text-jetBlack mb-6">My Addresses</h1>
              <AddressManager />
            </div>
          )}
          
          {activeTab === 'wishlist' && (
            <div className="bg-white p-6 border border-gray-200 rounded-sm">
              <h1 className="text-xl font-medium text-jetBlack mb-6">My Wishlist</h1>
              
              {wishlistItems.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-slateGray mb-4">Your wishlist is empty.</p>
                  <Link 
                    href="/collections"
                    className="inline-block px-6 py-2 bg-jetBlack text-white rounded hover:bg-gray-800 transition-colors"
                  >
                    Explore Collections
                  </Link>
                </div>
              ) : (
                <div className="text-right mb-4">
                  <Link 
                    href="/wishlist"
                    className="text-vividOrange hover:underline"
                  >
                    View Full Wishlist
                  </Link>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'settings' && (
            <div className="bg-white p-6 border border-gray-200 rounded-sm">
              <h1 className="text-xl font-medium text-jetBlack mb-6">Account Settings</h1>
              <ProfileManager />
              
              <div className="border-t pt-6 mt-6">
                <button 
                  type="button"
                  onClick={handleSignOut}
                  className="px-6 py-2 bg-jetBlack text-white rounded hover:bg-gray-800 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
