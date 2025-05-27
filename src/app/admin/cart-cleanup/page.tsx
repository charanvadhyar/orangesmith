'use client'

import { Suspense } from 'react'
import CartCleanup from '@/scripts/cart-cleanup'
import DirectSQLCleanup from '@/scripts/direct-sql-cleanup'
import ManualCartDelete from '@/scripts/manual-cart-delete'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'

export default function CartCleanupPage() {
  const { user } = useAuth()
  
  return (
    <div className="container mx-auto py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-light text-gray-900 mb-2">Cart Database Maintenance</h1>
            <p className="text-gray-600">Fix issues with duplicate cart entries in your database</p>
          </div>
          <Link 
            href="/"
            className="text-sm text-gray-600 border border-gray-300 px-4 py-2 rounded hover:bg-gray-50"
          >
            Back to Home
          </Link>
        </header>
        
        <div className="bg-white shadow-sm rounded-lg p-6 mb-8">
          <h2 className="text-lg font-medium mb-4">Why am I seeing cart errors?</h2>
          <p className="mb-3">
            You're experiencing issues because your user account has multiple cart entries in the database. 
            This can happen when:
          </p>
          <ul className="list-disc ml-6 mb-4 text-gray-700 space-y-1">
            <li>Sessions are created multiple times</li>
            <li>The cart creation process was interrupted</li>
            <li>Database synchronization issues occurred</li>
          </ul>
          <p>
            The utility below will clean up your cart data by keeping only the primary cart and removing duplicates.
          </p>
        </div>
        
        <div className="text-sm font-medium text-amber-800 bg-amber-50 p-4 mb-6 rounded-lg border border-amber-200">
          You have <strong>86 duplicate carts</strong> in your database. Since the automated cleanup methods were unsuccessful, we've created a manual tool that gives you direct control over cart deletion.
        </div>

        <Suspense fallback={<div className="p-8 text-center">Loading cleanup utilities...</div>}>
          <div className="mb-8">
            <h3 className="text-lg font-medium mb-2">Manual Cart Deletion Tool</h3>
            <p className="text-sm text-gray-600 mb-4">This interactive tool gives you direct control to view and delete specific carts one by one or in bulk.</p>
            <ManualCartDelete />
          </div>
          
          <div className="my-8 border-t border-gray-200 pt-8">
            <h3 className="text-lg font-medium mb-2">Automated Cleanup Methods</h3>
            <p className="text-sm text-gray-600 mb-4">These automated methods were not effective in your specific case, but are included for reference.</p>
            
            <div className="opacity-50 pointer-events-none">
              <DirectSQLCleanup />
              
              <div className="my-4 pt-4">
                <h4 className="text-base font-medium mb-2">Standard Cleanup</h4>
                <CartCleanup />
              </div>
            </div>
          </div>
        </Suspense>
        
        {!user && (
          <div className="mt-8 bg-amber-50 border border-amber-200 p-4 rounded-lg">
            <h3 className="font-medium text-amber-800 mb-2">Authentication Required</h3>
            <p className="text-amber-700">
              You need to be logged in to use the cart cleanup utility. Please{' '}
              <Link href="/login" className="underline hover:text-amber-900">log in</Link> to continue.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
