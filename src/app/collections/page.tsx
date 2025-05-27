'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { client } from '@/sanity/client'
import { urlForImage } from '@/sanity/client'
import { useWishlist } from '@/contexts/WishlistContext'
import { useAuth } from '@/contexts/AuthContext'
import { useCart } from '@/contexts/CartContext'
// Material UI components removed - using custom implementations instead
//import { formatCurrency } from '@/utils/formatCurrency'
//import { HeartIcon } from '@/utils/HeartIcon'
import './no-transitions.css'
import styles from './collections-override.module.css'

// Types for products and collections
interface Product {
  _id: string
  name: string
  slug: {
    current: string
  }
  images: any[]
  price: number
  comparePrice?: number
  categories?: any[]
  collections?: any[]
  materials?: any[]
  gemstones?: any[]
  isNew?: boolean
  isBestseller?: boolean
  description?: string
}

interface Collection {
  _id: string
  title: string
  slug: {
    current: string
  }
}

interface Category {
  _id: string
  name: string
  slug: {
    current: string
  }
}

interface Material {
  _id: string
  name: string
  slug: {
    current: string
  }
}

interface Gemstone {
  _id: string
  name: string
  slug: {
    current: string
  }
}

// Filter and sorting options
const sortOptions = [
  { name: 'Newest', value: 'newest' },
  { name: 'Price: Low to High', value: 'price-asc' },
  { name: 'Price: High to Low', value: 'price-desc' },
  { name: 'Name: A-Z', value: 'name-asc' },
]

export default function CollectionsPage() {
  const { isInWishlist, addToWishlist, removeFromWishlist, items } = useWishlist()
  const { user } = useAuth()
  const { addItem } = useCart()
  const [products, setProducts] = useState<Product[]>([])
  const [collections, setCollections] = useState<Collection[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [materials, setMaterials] = useState<Material[]>([])
  const [gemstones, setGemstones] = useState<Gemstone[]>([])
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeCollection, setActiveCollection] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [activeMaterial, setActiveMaterial] = useState<string | null>(null)
  const [activeGemstone, setActiveGemstone] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState('newest')
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000])
  const [priceMin, setPriceMin] = useState<number>(0)
  const [priceMax, setPriceMax] = useState<number>(10000)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)

  // Fetch products and filtering options
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        
        // Fetch all collections
        const collectionsData = await client.fetch(`
          *[_type == "collection"] {
            _id,
            title,
            slug
          }
        `)
        
        // Fetch all categories
        const categoriesData = await client.fetch(`
          *[_type == "jewelryCategory"] {
            _id,
            name,
            slug
          }
        `)

        // Fetch all materials (metals like gold, silver, etc.)
        const materialsData = await client.fetch(`
          *[_type == "material"] {
            _id,
            name,
            slug
          }
        `)
        
        // Fetch all gemstones (diamonds, sapphires, etc.)
        const gemstonesData = await client.fetch(`
          *[_type == "gemstone"] {
            _id,
            name,
            slug
          }
        `)
        
        // Build query for products with filters
        let productsQuery = `*[_type == "product"`
        
        // Apply collection filter if selected
        if (activeCollection) {
          productsQuery += ` && references("${activeCollection}")`
        }
        
        // Apply category filter if selected
        if (activeCategory) {
          productsQuery += ` && references("${activeCategory}")`
        }
        
        // Apply material filter if selected
        if (activeMaterial) {
          productsQuery += ` && references("${activeMaterial}")`
        }
        
        // Apply gemstone filter if selected
        if (activeGemstone) {
          productsQuery += ` && references("${activeGemstone}")`
        }
        
        // Close the query and select fields
        productsQuery += `] {
          _id,
          name,
          slug,
          images,
          price,
          comparePrice,
          categories[]->{_id, name, slug},
          collections[]->{_id, title, slug},
          materials[]->{_id, name, slug},
          gemstones[]->{_id, name, slug},
          isNew,
          isBestseller
        }`
        
        let fetchedProducts = await client.fetch(productsQuery)
        
        // Apply price range filter
        fetchedProducts = fetchedProducts.filter((product: Product) => 
          product.price >= priceRange[0] && product.price <= priceRange[1]
        )
        
        // Apply sorting
        switch (sortBy) {
          case 'price-asc':
            fetchedProducts = fetchedProducts.sort((a: Product, b: Product) => a.price - b.price)
            break
          case 'price-desc':
            fetchedProducts = fetchedProducts.sort((a: Product, b: Product) => b.price - a.price)
            break
          case 'name-asc':
            fetchedProducts = fetchedProducts.sort((a: Product, b: Product) => 
              a.name.localeCompare(b.name))
            break
          case 'newest':
          default:
            // Newest is default from Sanity
            break
        }
        
        setCollections(collectionsData)
        setCategories(categoriesData)
        setMaterials(materialsData)
        setGemstones(gemstonesData)
        setProducts(fetchedProducts)
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchData()
  }, [activeCollection, activeCategory, activeMaterial, activeGemstone, priceRange, sortBy])

  // For display
  const displayProducts = products

  return (
    <div className="min-h-screen">
      {/* Global style to disable all transitions */}
      <style jsx global>{`
        * {
          transition: none !important;
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-property: none !important;
        }
      `}</style>
      {/* Page Header */}
      <div className="bg-gray-50 py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-display font-medium text-jetBlack mb-2">
            Our Collections
          </h1>
          <p className="text-lg text-slateGray max-w-2xl mx-auto">
            Discover our exclusive jewelry collections, crafted with precision and passion for those who appreciate timeless elegance.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 lg:py-16">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <div className="mb-4 md:mb-0">
            <h2 className="text-xl font-medium text-jetBlack">Fine Jewelry Collections</h2>
            <p className="text-slateGray text-sm">
              {isLoading 
                ? 'Loading products...' 
                : `Showing ${displayProducts.length} ${displayProducts.length === 1 ? 'product' : 'products'}`
              }
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3 items-center">
            {/* Collection Filter */}
            <div className="relative w-40">
              <select
                value={activeCollection || ''}
                onChange={(e) => setActiveCollection(e.target.value || null)}
                className="appearance-none w-full border border-gray-300 py-2 px-3 rounded-sm focus:outline-none focus:ring-1 focus:ring-vividOrange"
              >
                <option value="">All Collections</option>
                {collections.map((collection) => (
                  <option key={collection._id} value={collection._id}>
                    {collection.title}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2">
                <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 20 20" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            
            {/* Category Filter */}
            <div className="relative w-40">
              <select
                value={activeCategory || ''}
                onChange={(e) => setActiveCategory(e.target.value || null)}
                className="appearance-none w-full border border-gray-300 py-2 px-3 rounded-sm focus:outline-none focus:ring-1 focus:ring-vividOrange"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2">
                <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 20 20" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            
            {/* Sort By */}
            <div className="relative w-40">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none w-full border border-gray-300 py-2 px-3 rounded-sm focus:outline-none focus:ring-1 focus:ring-vividOrange"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2">
                <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 20 20" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-200 pt-6 mb-8 flex justify-between items-center">
          {/* Active Filter Tags */}
          <div className="flex flex-wrap gap-2">
            {activeCollection && collections.find(c => c._id === activeCollection) && (
              <div className="bg-gray-100 px-3 py-1 rounded-full text-xs font-medium flex items-center">
                Collection: {collections.find(c => c._id === activeCollection)?.title}
                <button 
                  onClick={() => setActiveCollection(null)}
                  className="ml-2 text-gray-500 hover:text-jetBlack"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
            
            {activeCategory && categories.find(c => c._id === activeCategory) && (
              <div className="bg-gray-100 px-3 py-1 rounded-full text-xs font-medium flex items-center">
                Category: {categories.find(c => c._id === activeCategory)?.name}
                <button 
                  onClick={() => setActiveCategory(null)}
                  className="ml-2 text-gray-500 hover:text-jetBlack"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
            
            {activeMaterial && materials.find(m => m._id === activeMaterial) && (
              <div className="bg-gray-100 px-3 py-1 rounded-full text-xs font-medium flex items-center">
                Material: {materials.find(m => m._id === activeMaterial)?.name}
                <button 
                  onClick={() => setActiveMaterial(null)}
                  className="ml-2 text-gray-500 hover:text-jetBlack"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
            
            {activeGemstone && gemstones.find(g => g._id === activeGemstone) && (
              <div className="bg-gray-100 px-3 py-1 rounded-full text-xs font-medium flex items-center">
                Gemstone: {gemstones.find(g => g._id === activeGemstone)?.name}
                <button 
                  onClick={() => setActiveGemstone(null)}
                  className="ml-2 text-gray-500 hover:text-jetBlack"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
            
            {(priceRange[0] > 0 || priceRange[1] < 10000) && (
              <div className="bg-gray-100 px-3 py-1 rounded-full text-xs font-medium flex items-center">
                Price: ${priceRange[0]} — ${priceRange[1]}
                <button 
                  onClick={() => {
                    setPriceRange([0, 10000]);
                    setPriceMin(0);
                    setPriceMax(10000);
                  }}
                  className="ml-2 text-gray-500 hover:text-jetBlack"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
          </div>
          
          {/* Advanced Filters Button */}
          <button 
            onClick={() => setShowAdvancedFilters(true)}
            className="flex items-center text-sm font-medium text-jetBlack hover:text-vividOrange #{styles.noTransition}"
          >
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Advanced Filters
          </button>
        </div>
        
        {/* Active Filters */}
        {(activeCollection || activeCategory || activeMaterial || activeGemstone || priceRange[0] > 0 || priceRange[1] < 10000) && (
          <div className="mb-6 flex flex-wrap gap-2">
            <span className="text-sm text-slateGray">Active Filters:</span>
            
            {activeCollection && collections.find(c => c._id === activeCollection) && (
              <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-sm">
                <span>Collection: {collections.find(c => c._id === activeCollection)?.title}</span>
                <button 
                  onClick={() => setActiveCollection(null)}
                  className="rounded-full w-4 h-4 flex items-center justify-center bg-gray-300 hover:bg-vividOrange hover:text-white ![transition:none] "
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                    <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                  </svg>
                </button>
              </div>
            )}
            
            {activeCategory && categories.find(c => c._id === activeCategory) && (
              <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-sm">
                <span>Category: {categories.find(c => c._id === activeCategory)?.name}</span>
                <button 
                  onClick={() => setActiveCategory(null)}
                  className="rounded-full w-4 h-4 flex items-center justify-center bg-gray-300 hover:bg-vividOrange hover:text-white ![transition:none] "
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                    <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                  </svg>
                </button>
              </div>
            )}
            
            {activeMaterial && materials.find(m => m._id === activeMaterial) && (
              <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-sm">
                <span>Material: {materials.find(m => m._id === activeMaterial)?.name}</span>
                <button 
                  onClick={() => setActiveMaterial(null)}
                  className="rounded-full w-4 h-4 flex items-center justify-center bg-gray-300 hover:bg-vividOrange hover:text-white ![transition:none] "
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                    <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                  </svg>
                </button>
              </div>
            )}
            
            {activeGemstone && gemstones.find(g => g._id === activeGemstone) && (
              <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-sm">
                <span>Gemstone: {gemstones.find(g => g._id === activeGemstone)?.name}</span>
                <button 
                  onClick={() => setActiveGemstone(null)}
                  className="rounded-full w-4 h-4 flex items-center justify-center bg-gray-300 hover:bg-vividOrange hover:text-white ![transition:none] "
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                    <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                  </svg>
                </button>
              </div>
            )}
            
            {(priceRange[0] > 0 || priceRange[1] < 10000) && (
              <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-sm">
                <span>Price: ${priceRange[0]} - ${priceRange[1]}</span>
                <button 
                  onClick={() => {
                    setPriceRange([0, 10000])
                    setPriceMin(0)
                    setPriceMax(10000)
                  }}
                  className="rounded-full w-4 h-4 flex items-center justify-center bg-gray-300 hover:bg-vividOrange hover:text-white ![transition:none] "
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                    <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        )}
        
        {/* Products */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {displayProducts.map((product) => (
            <div key={product._id} className="group">
              <Link href={`/products/${product.slug.current}`}>
                <div className="group relative overflow-hidden bg-white hover:shadow-sm  flex flex-col h-full border border-gray-100">
                  {/* Product badges */}
                  <div className="absolute top-2 left-2 z-10 flex flex-col gap-2">
                    {product.isNew && (
                      <span className="bg-vividOrange text-white text-xs px-2 py-1 rounded">
                        New
                      </span>
                    )}
                    {product.isBestseller && (
                      <span className="bg-jetBlack text-white text-xs px-2 py-1 rounded">
                        Bestseller
                      </span>
                    )}
                    {product.comparePrice && product.comparePrice > product.price && (
                      <span className="bg-red-500 text-white text-xs px-2 py-1 rounded">
                        Sale
                      </span>
                    )}
                  </div>
                  
                  {/* Product image */}
                  <div className="relative h-64 overflow-hidden p-4 flex items-center justify-center">
                    {product.images && product.images.length > 0 ? (
                      <Image 
                        src={urlForImage(product.images[0]).width(400).height(400).url()}
                        alt={product.name}
                        width={200}
                        height={200}
                        className="object-contain max-h-full max-w-[80%] transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-4/5 h-4/5 bg-gray-100 flex items-center justify-center">
                        <span className="text-gray-400">Image coming soon</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Product info */}
                  <div className="py-3 px-4 bg-white">
                    <h3 className="text-sm font-medium text-jetBlack line-clamp-2 group-hover:text-vividOrange ![transition:none] ">
                      {product.name}
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm font-bold text-jetBlack">
                        ${product.price?.toLocaleString()}
                        {product.comparePrice && product.comparePrice > product.price && (
                          <span className="ml-2 text-xs text-gray-400 line-through">
                            ${product.comparePrice.toLocaleString()}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
              
              <div className="flex gap-2 mt-2">
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    setQuickViewProduct(product);
                  }}
                  style={{
                    flex: 1, 
                    padding: '0.5rem 0', 
                    backgroundColor: 'white', 
                    border: '1px solid #000', 
                    color: '#000',
                    fontSize: '0.875rem', 
                    borderRadius: '0.25rem',
                    transition: 'none'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#000';
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = 'white';
                    e.currentTarget.style.color = '#000';
                  }}
                >
                  Quick View
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    if (!user) {
                      // Prompt login if not authenticated
                      alert('Please login to add items to your wishlist');
                      return;
                    }
                    
                    const productId = product._id;
                    const inWishlist = isInWishlist(productId);
                    const btn = e.currentTarget;
                    
                    if (inWishlist) {
                      // Find the item to remove
                      const item = items.find(item => item.product_id === productId);
                      if (item) {
                        removeFromWishlist(item.id);
                        
                        // Update button appearance immediately
                        btn.style.backgroundColor = 'white';
                        btn.style.borderColor = '#000';
                        btn.style.color = '#000';
                        
                        // Update SVG heart
                        const path = btn.querySelector('path');
                        if (path) {
                          path.setAttribute('d', 'm8 2.748-.717-.737C5.6.281 2.514.878 1.4 3.053c-.523 1.023-.641 2.5.314 4.385.92 1.815 2.834 3.989 6.286 6.357 3.452-2.368 5.365-4.542 6.286-6.357.955-1.886.838-3.362.314-4.385C13.486.878 10.4.28 8.717 2.01L8 2.748zM8 15C-7.333 4.868 3.279-3.04 7.824 1.143c.06.055.119.112.176.171a3.12 3.12 0 0 1 .176-.17C12.72-3.042 23.333 4.867 8 15z');
                        }
                      }
                    } else {
                      // Add to wishlist
                      addToWishlist({
                        id: `wish-${Date.now()}`,
                        product_id: productId,
                        name: product.name,
                        price: product.price,
                        image: product.images?.[0] || null,
                        slug: product.slug.current
                      });
                      
                      // Update button appearance immediately
                      btn.style.backgroundColor = '#ff6b00';
                      btn.style.borderColor = '#ff6b00';
                      btn.style.color = 'white';
                      
                      // Update SVG heart
                      const path = btn.querySelector('path');
                      if (path) {
                        path.setAttribute('d', 'M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314z');
                      }
                    }
                  }}
                  style={{
                    width: '2.5rem',
                    height: '2.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: isInWishlist(product._id) ? '1px solid #ff6b00' : '1px solid #000',
                    backgroundColor: isInWishlist(product._id) ? '#ff6b00' : 'white',
                    color: isInWishlist(product._id) ? 'white' : '#000',
                    borderRadius: '0.25rem'
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-heart" viewBox="0 0 16 16">
                    {isInWishlist(product._id) ? (
                      <path fillRule="evenodd" d="M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314z"/>
                    ) : (
                      <path d="m8 2.748-.717-.737C5.6.281 2.514.878 1.4 3.053c-.523 1.023-.641 2.5.314 4.385.92 1.815 2.834 3.989 6.286 6.357 3.452-2.368 5.365-4.542 6.286-6.357.955-1.886.838-3.362.314-4.385C13.486.878 10.4.28 8.717 2.01L8 2.748zM8 15C-7.333 4.868 3.279-3.04 7.824 1.143c.06.055.119.112.176.171a3.12 3.12 0 0 1 .176-.17C12.72-3.042 23.333 4.867 8 15z"/>
                    )}
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
        
        {/* Loading or empty state */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-vividOrange border-r-transparent"></div>
            <p className="mt-4 text-slateGray">Loading luxurious pieces...</p>
          </div>
        ) : products.length === 0 && !isLoading ? (
          <div className="text-center py-16">
            <h3 className="text-xl font-medium text-jetBlack mb-2">No products found</h3>
            <p className="text-slateGray mb-6">Try adjusting your filters or browse our other collections.</p>
            <button 
              onClick={() => {
                setActiveCollection(null)
                setActiveCategory(null)
                setActiveMaterial(null)
                setActiveGemstone(null)
                setPriceRange([0, 10000])
                setPriceMin(0)
                setPriceMax(10000)
                setSortBy('newest')
              }}
              className="px-6 py-2 bg-vividOrange text-white rounded hover:bg-opacity-90 ![transition:none] "
            >
              Clear All Filters
            </button>
          </div>
        ) : null}
      </div>

      {/* Quick View Modal */}
      {quickViewProduct && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          overflow: 'auto',
          backdropFilter: 'blur(4px)'
        }}>
          <div className="bg-white max-w-4xl w-full max-h-[90vh] overflow-auto rounded-lg shadow-xl relative">
            {/* Close button */}
            <button 
              onClick={() => setQuickViewProduct(null)}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                zIndex: 10,
                width: '2rem',
                height: '2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '9999px',
                backgroundColor: '#000',
                color: 'white',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                transition: 'none'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#ff6b00';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#000';
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
              </svg>
            </button>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
              {/* Product image */}
              <div className="flex items-center justify-center p-4">
                {quickViewProduct.images && quickViewProduct.images.length > 0 ? (
                  <Image 
                    src={urlForImage(quickViewProduct.images[0]).width(600).height(600).url()}
                    alt={quickViewProduct.name}
                    width={400}
                    height={400}
                    className="object-contain max-h-[400px] max-w-full"
                  />
                ) : (
                  <div className="w-full h-64 bg-gray-100 flex items-center justify-center">
                    <span className="text-gray-400">Image coming soon</span>
                  </div>
                )}
              </div>
              
              {/* Product details */}
              <div className="flex flex-col">
                <h2 className="text-xl font-medium text-jetBlack mb-2">{quickViewProduct.name}</h2>
                
                <div className="flex items-center mb-4">
                  <p className="text-lg font-bold text-jetBlack">
                    ${quickViewProduct.price?.toLocaleString()}
                  </p>
                  {quickViewProduct.comparePrice && quickViewProduct.comparePrice > quickViewProduct.price && (
                    <p className="ml-2 text-sm text-gray-400 line-through">
                      ${quickViewProduct.comparePrice.toLocaleString()}
                    </p>
                  )}
                </div>
                
                {/* Quick info */}
                <div className="mb-6 text-sm text-gray-600">
                  {quickViewProduct.categories && quickViewProduct.categories.length > 0 && (
                    <p className="mb-1">Category: {quickViewProduct.categories.map(c => c.name).join(', ')}</p>
                  )}
                  {quickViewProduct.materials && quickViewProduct.materials.length > 0 && (
                    <p className="mb-1">Material: {quickViewProduct.materials.map(m => m.name).join(', ')}</p>
                  )}
                  {quickViewProduct.gemstones && quickViewProduct.gemstones.length > 0 && (
                    <p className="mb-1">Gemstone: {quickViewProduct.gemstones.map(g => g.name).join(', ')}</p>
                  )}
                </div>
                
                {/* Description Preview */}
                {quickViewProduct.description && (
                  <div className="mb-6">
                    <h3 className="text-sm font-medium mb-2">Description</h3>
                    <p className="text-sm text-gray-600 line-clamp-4">{quickViewProduct.description}</p>
                  </div>
                )}
                
                {/* Action buttons */}
                <div className="mt-auto space-y-3">
                  <Link 
                    href={`/products/${quickViewProduct.slug.current}`}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '0.75rem 1rem',
                      backgroundColor: '#000',
                      color: 'white',
                      textAlign: 'center',
                      borderRadius: '0.25rem',
                      transition: 'none'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.opacity = '0.9';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.opacity = '1';
                    }}
                  >
                    View Details
                  </Link>
                  
                  <div className="flex gap-3">
                    <button 
                      onClick={() => {
                        addItem({
                          id: `cart-${Date.now()}`,
                          product_id: quickViewProduct._id,
                          name: quickViewProduct.name,
                          price: quickViewProduct.price,
                          image: quickViewProduct.images?.[0] || null,
                          quantity: 1,
                          slug: quickViewProduct.slug.current
                        });
                        
                        // Show confirmation
                        const toast = document.createElement('div');
                        toast.style.position = 'fixed';
                        toast.style.bottom = '1rem';
                        toast.style.left = '50%';
                        toast.style.transform = 'translateX(-50%)';
                        toast.style.backgroundColor = '#000';
                        toast.style.color = 'white';
                        toast.style.padding = '0.75rem 1.5rem';
                        toast.style.borderRadius = '0.5rem';
                        toast.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
                        toast.style.zIndex = '50';
                        toast.textContent = 'Added to cart';
                        document.body.appendChild(toast);
                        
                        // Remove toast after 3 seconds
                        setTimeout(() => {
                          toast.remove();
                        }, 3000);
                      }}
                      style={{
                        flex: 1,
                        padding: '0.5rem 0',
                        border: '1px solid #000',
                        color: '#000',
                        textAlign: 'center',
                        borderRadius: '0.25rem',
                        backgroundColor: 'white',
                        transition: 'none'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = '#000';
                        e.currentTarget.style.color = 'white';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = 'white';
                        e.currentTarget.style.color = '#000';
                      }}
                    >
                      Add to Cart
                    </button>
                    
                    <button
                      onClick={(e) => {
                        if (!user) {
                          alert('Please login to add items to your wishlist');
                          return;
                        }
                        
                        if (!quickViewProduct) return;
                        
                        const productId = quickViewProduct._id;
                        const inWishlist = isInWishlist(productId);
                        const btn = e.currentTarget;
                        
                        if (inWishlist) {
                          // Find the item to remove
                          const item = items.find(item => item.product_id === productId);
                          if (item) {
                            removeFromWishlist(item.id);
                            
                            // Update button appearance immediately
                            btn.style.backgroundColor = 'white';
                            btn.style.borderColor = '#000';
                            btn.style.color = '#000';
                            
                            // Update SVG heart
                            const path = btn.querySelector('path');
                            if (path) {
                              path.setAttribute('d', 'm8 2.748-.717-.737C5.6.281 2.514.878 1.4 3.053c-.523 1.023-.641 2.5.314 4.385.92 1.815 2.834 3.989 6.286 6.357 3.452-2.368 5.365-4.542 6.286-6.357.955-1.886.838-3.362.314-4.385C13.486.878 10.4.28 8.717 2.01L8 2.748zM8 15C-7.333 4.868 3.279-3.04 7.824 1.143c.06.055.119.112.176.171a3.12 3.12 0 0 1 .176-.17C12.72-3.042 23.333 4.867 8 15z');
                            }
                          }
                        }
                         else {
                          // Add to wishlist
                          if (quickViewProduct) {
                            addToWishlist({
                              id: `wish-${Date.now()}`,
                              product_id: productId,
                              name: quickViewProduct.name,
                              price: quickViewProduct.price,
                              image: quickViewProduct.images?.[0] || null,
                              slug: quickViewProduct.slug.current
                            });
                            
                            // Update button appearance immediately
                            btn.style.backgroundColor = '#ff6b00';
                            btn.style.borderColor = '#ff6b00';
                            btn.style.color = 'white';
                            
                            // Update SVG heart
                            const path = btn.querySelector('path');
                            if (path) {
                              path.setAttribute('d', 'M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314z');
                            }
                          }
                        }
                      }}
                      style={{
                        width: '3rem',
                        height: '3rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: isInWishlist(quickViewProduct._id) ? '1px solid #ff6b00' : '1px solid #000',
                        backgroundColor: isInWishlist(quickViewProduct._id) ? '#ff6b00' : 'white',
                        color: isInWishlist(quickViewProduct._id) ? 'white' : 'black',
                        borderRadius: '0.25rem',
                        transition: 'none'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = '#ff6b00';
                        e.currentTarget.style.borderColor = '#ff6b00';
                        e.currentTarget.style.color = 'white';
                      }}
                      onMouseOut={(e) => {
                        if (!isInWishlist(quickViewProduct._id)) {
                          e.currentTarget.style.backgroundColor = 'white';
                          e.currentTarget.style.borderColor = '#000';
                          e.currentTarget.style.color = 'black';
                        } else {
                          e.currentTarget.style.backgroundColor = '#ff6b00';
                          e.currentTarget.style.borderColor = '#ff6b00';
                          e.currentTarget.style.color = 'white';
                        }
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                        {isInWishlist(quickViewProduct._id) ? (
                          <path fillRule="evenodd" d="M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314z"/>
                        ) : (
                          <path d="m8 2.748-.717-.737C5.6.281 2.514.878 1.4 3.053c-.523 1.023-.641 2.5.314 4.385.92 1.815 2.834 3.989 6.286 6.357 3.452-2.368 5.365-4.542 6.286-6.357.955-1.886.838-3.362.314-4.385C13.486.878 10.4.28 8.717 2.01L8 2.748zM8 15C-7.333 4.868 3.279-3.04 7.824 1.143c.06.055.119.112.176.171a3.12 3.12 0 0 1 .176-.17C12.72-3.042 23.333 4.867 8 15z"/>
                        )}
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Filters Modal */}
      {showAdvancedFilters && (
        <div className="fixed inset-0 z-50 overflow-auto bg-white bg-opacity-90 backdrop-blur-sm flex items-center justify-center p-4">
          <div 
            className="bg-white max-w-3xl w-full rounded-md shadow-xl overflow-hidden animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-jetBlack">Advanced Filters</h3>
              <button
                onClick={() => setShowAdvancedFilters(false)}
                className="text-gray-400 hover:text-black #{styles.noTransition}"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Collection Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Collection</label>
                  <div className="relative">
                    <select
                      value={activeCollection || ''}
                      onChange={(e) => setActiveCollection(e.target.value || null)}
                      className="appearance-none w-full border border-gray-300 py-2 px-3 rounded-sm focus:outline-none focus:ring-1 focus:ring-vividOrange"
                    >
                      <option value="">All Collections</option>
                      {collections.map((collection) => (
                        <option key={collection._id} value={collection._id}>
                          {collection.title}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2">
                      <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 20 20" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
                
                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <div className="relative">
                    <select
                      value={activeCategory || ''}
                      onChange={(e) => setActiveCategory(e.target.value || null)}
                      className="appearance-none w-full border border-gray-300 py-2 px-3 rounded-sm focus:outline-none focus:ring-1 focus:ring-vividOrange"
                    >
                      <option value="">All Categories</option>
                      {categories.map((category) => (
                        <option key={category._id} value={category._id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2">
                      <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 20 20" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
                
                {/* Material Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Material</label>
                  <div className="relative">
                    <select
                      value={activeMaterial || ''}
                      onChange={(e) => setActiveMaterial(e.target.value || null)}
                      className="appearance-none w-full border border-gray-300 py-2 px-3 rounded-sm focus:outline-none focus:ring-1 focus:ring-vividOrange"
                    >
                      <option value="">All Materials</option>
                      {materials.map((material) => (
                        <option key={material._id} value={material._id}>
                          {material.name}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2">
                      <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 20 20" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
                
                {/* Gemstone Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Gemstone</label>
                  <div className="relative">
                    <select
                      value={activeGemstone || ''}
                      onChange={(e) => setActiveGemstone(e.target.value || null)}
                      className="appearance-none w-full border border-gray-300 py-2 px-3 rounded-sm focus:outline-none focus:ring-1 focus:ring-vividOrange"
                    >
                      <option value="">All Gemstones</option>
                      {gemstones.map((gemstone) => (
                        <option key={gemstone._id} value={gemstone._id}>
                          {gemstone.name}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2">
                      <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 20 20" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Price Range */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-4">Price Range: ${priceMin.toLocaleString()} — ${priceMax.toLocaleString()}</label>
                <div className="px-2 space-y-6">
                  {/* Price labels */}
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>$0</span>
                    <span>$2,500</span>
                    <span>$5,000</span>
                    <span>$7,500</span>
                    <span>$10,000+</span>
                  </div>
                  
                  {/* Custom range inputs */}
                  <div className="relative mt-2 mb-8">
                    {/* Track line */}
                    <div className="absolute h-1 w-full bg-gray-200 rounded-full"></div>
                    
                    {/* Active track */}
                    <div 
                      className="absolute h-1 bg-vividOrange rounded-full" 
                      style={{
                        left: `${(priceMin / 10000) * 100}%`,
                        width: `${((priceMax - priceMin) / 10000) * 100}%`
                      }}
                    ></div>
                    
                    {/* Min thumb */}
                    <input 
                      type="range" 
                      min={0} 
                      max={10000} 
                      step={100} 
                      value={priceMin}
                      onChange={(e) => {
                        const value = Number(e.target.value);
                        if (value < priceMax) {
                          setPriceMin(value);
                        }
                      }}
                      className="absolute w-full appearance-none bg-transparent pointer-events-none z-10"
                      style={{ height: '1rem', marginTop: '-0.375rem' }}
                    />
                    
                    {/* Max thumb */}
                    <input 
                      type="range" 
                      min={0} 
                      max={10000} 
                      step={100} 
                      value={priceMax}
                      onChange={(e) => {
                        const value = Number(e.target.value);
                        if (value > priceMin) {
                          setPriceMax(value);
                        }
                      }}
                      className="absolute w-full appearance-none bg-transparent pointer-events-none z-10"
                      style={{ height: '1rem', marginTop: '-0.375rem' }}
                    />
                  </div>
                  
                  {/* Input fields for precise values */}
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={priceMin}
                      onChange={(e) => {
                        const value = Number(e.target.value);
                        if (!isNaN(value) && value >= 0 && value < priceMax) {
                          setPriceMin(value);
                        }
                      }}
                      className="w-full border border-gray-300 py-2 px-3 rounded-sm focus:outline-none focus:ring-1 focus:ring-vividOrange"
                      placeholder="Min"
                    />
                    <span className="text-gray-500">—</span>
                    <input
                      type="number"
                      value={priceMax}
                      onChange={(e) => {
                        const value = Number(e.target.value);
                        if (!isNaN(value) && value > priceMin && value <= 10000) {
                          setPriceMax(value);
                        }
                      }}
                      className="w-full border border-gray-300 py-2 px-3 rounded-sm focus:outline-none focus:ring-1 focus:ring-vividOrange"
                      placeholder="Max"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
              <button
                onClick={() => {
                  setActiveCollection(null);
                  setActiveCategory(null);
                  setActiveMaterial(null);
                  setActiveGemstone(null);
                  setPriceRange([0, 10000]);
                  setPriceMin(0);
                  setPriceMax(10000);
                  setSortBy('newest');
                }}
                className="text-vividOrange hover:text-jetBlack flex items-center #{styles.noTransition}"
              >
                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear All Filters
              </button>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAdvancedFilters(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-sm hover:bg-gray-50 #{styles.noTransition}"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setPriceRange([priceMin, priceMax]);
                    setShowAdvancedFilters(false);
                  }}
                  className="px-4 py-2 bg-jetBlack text-white rounded-sm hover:bg-opacity-90 #{styles.noTransition}"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

