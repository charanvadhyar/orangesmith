'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { client } from '@/sanity/client'
import { urlForImage } from '@/sanity/client'
import { useAuth } from '@/contexts/AuthContext'
import { useCart } from '@/contexts/CartContext'
import { useWishlist } from '@/contexts/WishlistContext'

interface NavItem {
  href: string
  label: string
  submenu?: { href: string; label: string }[]
}

interface Navigation {
  title: string
  navId: string
  items: NavItem[]
  logo?: any // Sanity image reference
}

interface AnnouncementBar {
  enabled: boolean
  text: string
  link: string
  backgroundColor: string
  textColor: string
}

// Default navigation items to show while loading from Sanity
const defaultNavItems: NavItem[] = [
  { href: '/', label: 'Home' },
  { 
    href: '/collections', 
    label: 'Collections',
    submenu: [
      { href: '/collections/rings', label: 'Rings' },
      { href: '/collections/necklaces', label: 'Necklaces' },
      { href: '/collections/earrings', label: 'Earrings' },
      { href: '/collections/bracelets', label: 'Bracelets' },
    ]
  },
  { href: '/about', label: 'About' },
  { href: '/blog', label: 'Blog' },
  { href: '/contact', label: 'Contact' }
]

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null)
  const [scrolled, setScrolled] = useState(false)
  const [announcementBar, setAnnouncementBar] = useState<AnnouncementBar | null>(null)
  const [navLinks, setNavLinks] = useState<NavItem[]>(defaultNavItems)
  const [logo, setLogo] = useState<any>(null)
  const pathname = usePathname()
  
  // Use contexts for authentication, cart and wishlist
  const { user } = useAuth()
  const { items: cartItems, itemCount: cartItemCount } = useCart()
  const { items: wishlistItems } = useWishlist()
  
  // Fetch announcement bar and navigation data from Sanity
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch announcement bar
        const announcementData = await client.fetch(`*[_type == "homepage"][0].announcementBar`)
        if (announcementData && announcementData.enabled) {
          setAnnouncementBar(announcementData)
        }
        
        // Use the Header navigation that was created in Sanity Studio
        const navId = "Header";
        
        // Fetch navigation and logo
        const navData = await client.fetch(`*[_type == "navigation" && navId == "${navId}"][0]{
          title,
          navId,
          items,
          logo
        }`)
        
        // If Header navigation doesn't exist, fall back to main navigation
        let finalNavData = navData;
        if (!finalNavData) {
          finalNavData = await client.fetch(`*[_type == "navigation" && navId == "main"][0]{
            title,
            navId,
            items,
            logo
          }`)
        }
        
        if (finalNavData) {
          // Set navigation items
          if (finalNavData.items && finalNavData.items.length > 0) {
            setNavLinks(finalNavData.items)
          }
          
          // Set logo if available
          if (finalNavData.logo) {
            setLogo(finalNavData.logo)
          }
        }
      } catch (error) {
        console.error('Error fetching data from Sanity:', error)
      }
    }
    
    fetchData()
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      // Only trigger the scrolled state after scrolling past the header height
      setScrolled(window.scrollY > 120)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const toggleMenu = () => {
    setIsOpen(!isOpen)
    if (isOpen) setOpenSubmenu(null)
  }

  const toggleSubmenu = (label: string) => {
    setOpenSubmenu(openSubmenu === label ? null : label)
  }

  return (
    <div className="relative">
      {/* Announcement Bar - Always at the very top */}
      {announcementBar && (
        <div 
          className="w-full py-2 text-center text-sm" 
          style={{ 
            backgroundColor: announcementBar.backgroundColor || '#1a1a1a', 
            color: announcementBar.textColor || '#ffffff' 
 }}
        >
          {announcementBar.link ? (
            <Link href={announcementBar.link} className="hover:underline">
              {announcementBar.text}
            </Link>
          ) : (
            <span>{announcementBar.text}</span>
          )}
        </div>
      )}

      {/* Main Navigation */}
      <header className={`w-full z-50 relative transition-all duration-500 ${scrolled ? 'shadow-md bg-white/95 backdrop-blur-sm' : 'bg-white'}`}>
        <div className="container mx-auto px-4 md:px-6">
          {/* Three-column layout with logo in center */}
          <div className="flex items-center justify-between py-2">
            {/* Left column - Contact links */}
            <div className="hidden md:flex items-center space-x-6">
              <Link href="/contact-us" className="text-sm text-jetBlack hover:text-vividOrange">
                Contact Us
              </Link>
              <Link href="/find-store" className="text-sm text-jetBlack hover:text-vividOrange">
                Find a Store
              </Link>
            </div>
            
            {/* Center column - Logo */}
            <div className="flex items-center justify-center flex-grow md:flex-grow-0">
              <Link href="/" className="flex items-center">
                {logo ? (
                  /* Sanity Logo Image */
                  <Image 
                    src={urlForImage(logo).url()} 
                    alt="OrangeSmith"
                    width={450}
                    height={225}
                    priority
                    className="w-auto" 
                    style={{objectFit: 'contain', height: '80px'}}
                  />
                ) : (
                  /* Text Logo as fallback */
                  <span className="text-2xl md:text-4xl font-display font-bold text-jetBlack">
                    OrangeSmith
                  </span>
                )}
              </Link>
            </div>
            
            {/* Right column - Account links and icons */}
            <div className="hidden md:flex items-center space-x-6">
              {user ? (
                <Link href="/account" className="text-sm text-jetBlack hover:text-vividOrange flex items-center space-x-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>Account</span>
                </Link>
              ) : (
                <Link href="/account" className="text-sm text-jetBlack hover:text-vividOrange">
                  Login
                </Link>
              )}
              <div className="flex items-center space-x-4">
                <Link href="/wishlist" aria-label="Wishlist" className="text-jetBlack hover:text-vividOrange relative inline-block">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  {wishlistItems.length > 0 && (
                    <span className="absolute -top-2 -right-2 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-sm border border-white" style={{ backgroundColor: '#ff6b00' }}>
                      {wishlistItems.length}
                    </span>
                  )}
                </Link>
                <Link href="/cart" aria-label="Cart" className="text-jetBlack hover:text-vividOrange relative inline-block">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  {cartItemCount > 0 && (
                    <span className="absolute -top-2 -right-2 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-sm border border-white" style={{ backgroundColor: '#ff6b00' }}>
                      {cartItemCount}
                    </span>
                  )}
                </Link>
                <button aria-label="Search" className="text-jetBlack hover:text-vividOrange">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Main Navigation Below Logo */}
          <nav className="border-t border-b border-gray-200 py-3 hidden lg:block">
            <ul className="flex justify-center items-center space-x-10">
              {navLinks.map((link) => (
                <li key={link.href} className="relative group">
                  {link.submenu ? (
                    <button 
                      onClick={() => toggleSubmenu(link.label)}
                      className={`flex items-center text-sm font-medium hover:text-vividOrange transition-colors ${
                        pathname.startsWith(link.href) ? 'text-vividOrange' : 'text-jetBlack'
                      }`}
                  >
                    {link.label}
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className="h-4 w-4 ml-1 transform group-hover:rotate-180 transition-transform" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                ) : (
                  <Link 
                    href={link.href}
                    className={`text-sm font-medium hover:text-vividOrange transition-colors ${
                      pathname === link.href ? 'text-vividOrange' : 'text-jetBlack'
                    }`}
                  >
                    {link.label}
                  </Link>
                )}
                
                {/* Submenu */}
                {link.submenu && (
                  <div className="absolute left-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right z-[60]">
                    <div className="py-1">
                      {link.submenu.map((subItem) => (
                        <Link 
                          key={subItem.href} 
                          href={subItem.href}
                          className={`block px-4 py-2 text-sm hover:bg-gray-100 ${
                            pathname === subItem.href ? 'text-vividOrange' : 'text-jetBlack'
                          }`}
                        >
                          {subItem.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden text-jetBlack"
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            {isOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </nav>
      </div>

      {/* Mobile Menu */}
      <div
        className={`lg:hidden fixed inset-0 z-40 bg-white transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full overflow-y-auto pb-20">
          <div className="px-4 py-4 flex justify-between items-center border-b">
            <Link href="/" className="flex items-center" onClick={() => setIsOpen(false)}>
              <span className="text-2xl font-display font-bold text-jetBlack">OrangeSmith</span>
            </Link>
            <button
              aria-label="Close menu"
              className="text-jetBlack"
              onClick={toggleMenu}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <nav className="mt-4 px-4">
            <ul className="space-y-4">
              {navLinks.map((link) => (
                <li key={link.href}>
                  {link.submenu ? (
                    <>
                      <button
                        onClick={() => toggleSubmenu(link.label)}
                        className="flex items-center justify-between w-full text-jetBlack py-2"
                      >
                        <span className="font-medium">{link.label}</span>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className={`h-4 w-4 transition-transform duration-200 transform ${
                            openSubmenu === link.label ? 'rotate-180' : ''
                          }`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {openSubmenu === link.label && (
                        <ul className="pl-4 mt-2 space-y-2 border-l-2 border-gray-200">
                          {link.submenu.map((subItem) => (
                            <li key={subItem.href}>
                              <Link
                                href={subItem.href}
                                className="block py-1 text-jetBlack hover:text-vividOrange"
                                onClick={toggleMenu}
                              >
                                {subItem.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </>
                  ) : (
                    <Link
                      href={link.href}
                      className="block py-2 text-jetBlack font-medium hover:text-vividOrange"
                      onClick={toggleMenu}
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          {/* Mobile menu footer removed to avoid duplicate icons */}
        </div>
      </div>
    </header>
    </div>
  )
}

export default Navbar
