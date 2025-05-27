'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { client } from '@/sanity/lib/client'
import { urlFor } from '@/sanity/lib/image'
import { useParams } from 'next/navigation'

// Types
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
  ijewel3dCode?: string
  modelWearingImage?: any
}

interface Collection {
  _id: string
  title: string
  slug: {
    current: string
  }
  description?: string
  image?: any
  heroImage?: any
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

export default function CategoryPage() {
  const params = useParams()
  const slug = params.slug as string
  
  const [products, setProducts] = useState<Product[]>([])
  const [collection, setCollection] = useState<Collection | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [sortBy, setSortBy] = useState('newest')
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000])
  const [activeMaterial, setActiveMaterial] = useState<string | null>(null)
  const [activeGemstone, setActiveGemstone] = useState<string | null>(null)
  const [activeFilterTab, setActiveFilterTab] = useState<'metal' | 'gemstone' | 'price' | null>(null)
  const [materials, setMaterials] = useState<Material[]>([])
  const [gemstones, setGemstones] = useState<Gemstone[]>([])

  // Fetch products specific to this collection
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        
        // 1. First fetch the collection details
        const collectionData = await client.fetch(`
          *[_type == "collection" && slug.current == "${slug}"][0] {
            _id,
            title,
            slug,
            description,
            image,
            heroImage
          }
        `)
        
        if (!collectionData) {
          console.error('Collection not found')
          setIsLoading(false)
          return
        }
        
        // Debug collection data, especially hero image
        console.log('Collection data:', collectionData);
        console.log('Collection hero image data:', collectionData.heroImage);
        
        setCollection(collectionData)
        
        // Fetch all materials and gemstones for filters
        const materialsData = await client.fetch(`
          *[_type == "material"] {
            _id,
            name,
            slug
          }
        `)
        
        const gemstonesData = await client.fetch(`
          *[_type == "gemstone"] {
            _id,
            name,
            slug
          }
        `)
        
        setMaterials(materialsData)
        setGemstones(gemstonesData)
        
        // 2. Then fetch products in this collection
        let productsQuery = `*[_type == "product" && references("${collectionData._id}"`
        
        // Apply material filter if selected
        if (activeMaterial) {
          productsQuery += ` && references("${activeMaterial}")`
        }
        
        // Apply gemstone filter if selected
        if (activeGemstone) {
          productsQuery += ` && references("${activeGemstone}")`
        }
        
        // Close the query and select fields
        productsQuery += `)] {
          _id,
          name,
          slug,
          images,
          modelWearingImage,
          price,
          comparePrice,
          ijewel3dCode,
          categories[]->{_id, name, slug},
          collections[]->{_id, title, slug},
          materials[]->{_id, name, slug},
          gemstones[]->{_id, name, slug},
          isNew,
          isBestseller
        }`
        
        let fetchedProducts = await client.fetch(productsQuery)
        
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
            // Assuming newest is the default order from Sanity
            break
        }
        
        // Apply price range filter
        fetchedProducts = fetchedProducts.filter((product: Product) => 
          product.price >= priceRange[0] && product.price <= priceRange[1]
        )
        
        setProducts(fetchedProducts)
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    if (slug) {
      fetchData()
    }
  }, [slug, sortBy, priceRange, activeMaterial, activeGemstone])

  // Fallback products if no data yet
  const fallbackProducts = Array(6).fill(null).map((_, index) => ({
    _id: `placeholder-${index}`,
    name: 'Elegant Jewelry Piece',
    slug: { current: '#' },
    images: [],
    price: 1299.99,
    comparePrice: index % 2 === 0 ? 1599.99 : undefined,
    isNew: index % 3 === 0,
    isBestseller: index % 4 === 0,
  }))

  // Display products or fallback
  const displayProducts = products.length > 0 ? products : !isLoading ? [] : fallbackProducts

  if (!collection && !isLoading) {
    return (
      <div className="container mx-auto px-4 py-32 text-center">
        <h1 className="text-3xl font-display font-medium mb-4">Collection Not Found</h1>
        <p className="mb-8 text-slateGray">The collection you're looking for doesn't exist or has been removed.</p>
        <Link href="/collections" className="inline-block px-6 py-3 bg-vividOrange text-white rounded hover:bg-opacity-90 transition-colors">
          View All Collections
        </Link>
      </div>
    )
  }

  // Handle click on filter dropdown
  const handleFilterClick = (filter: 'metal' | 'gemstone' | 'price') => {
    if (activeFilterTab === filter) {
      setActiveFilterTab(null)
    } else {
      setActiveFilterTab(filter)
    }
  }

  return (
    <div className="bg-white">
      {/* Collection Header */}
      <div className="bg-gray-50 py-16 relative">
        {collection?.heroImage ? (
          <div className="absolute inset-0 opacity-30 overflow-hidden">
            {/* Simplified image handling to prevent hydration errors */}
            <Image 
              src={urlFor(collection.heroImage).width(1200).height(400).url()}
              alt={collection.title || 'Collection Hero Banner'}
              fill
              sizes="100vw"
              quality={90}
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-r from-white via-transparent to-white"></div>
          </div>
        ) : (
          // Fallback background when no image is available
          <div className="absolute inset-0 opacity-10 overflow-hidden bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200"></div>
        )}
        <div className="container mx-auto px-4 text-center relative z-10">
          <h1 className="text-4xl md:text-5xl font-display font-medium text-jetBlack mb-2">
            {collection?.title || 'Loading...'}
          </h1>
          {collection?.description && (
            <p className="text-lg text-slateGray max-w-2xl mx-auto">
              {collection.description}
            </p>
          )}
        </div>
      </div>

      {/* Main content area with title and sort controls */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-8">
        {/* Collection title and sort controls */}
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-display font-medium">{collection?.title || 'Collection'}</h2>
              <p className="text-slateGray mt-1">
                {isLoading 
                  ? 'Loading products...' 
                  : `Showing ${displayProducts.length} ${displayProducts.length === 1 ? 'product' : 'products'}`
                }
              </p>
            </div>
            <div className="flex items-center">
              <label htmlFor="sort" className="mr-2 text-slateGray">Sort by</label>
              <select 
                id="sort" 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="p-2 border border-gray-300 rounded"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
        {/* Horizontal filter bar */}
        <div className="mb-8">
          <div className="bg-white p-4 rounded-md">
            <div className="flex flex-wrap items-center gap-6">
              {/* Filter label */}
              <div>
                <h3 className="font-medium text-gray-900">Filter By:</h3>
              </div>
              
              {/* Metal Filter */}
              <div className="">
                <select
                  value={activeMaterial || ''}
                  onChange={(e) => setActiveMaterial(e.target.value === '' ? null : e.target.value)}
                  className="p-2 border border-gray-300 rounded min-w-[120px]"
                >
                  <option value="">All Metals</option>
                  {materials.map(material => (
                    <option key={material._id} value={material._id}>
                      {material.name}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Gemstone Filter */}
              <div className="">
                <select
                  value={activeGemstone || ''}
                  onChange={(e) => setActiveGemstone(e.target.value === '' ? null : e.target.value)}
                  className="p-2 border border-gray-300 rounded min-w-[120px]"
                >
                  <option value="">All Gemstones</option>
                  {gemstones.map(gemstone => (
                    <option key={gemstone._id} value={gemstone._id}>
                      {gemstone.name}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Price Range Filter */}
              <div className="">
                <select 
                  value={`${priceRange[0]}-${priceRange[1]}`}
                  onChange={(e) => {
                    const [min, max] = e.target.value.split('-').map(val => parseInt(val));
                    setPriceRange([min, max]);
                  }}
                  className="p-2 border border-gray-300 rounded min-w-[140px]"
                >
                  <option value="0-10000">Any Price</option>
                  <option value="0-500">Under $500</option>
                  <option value="500-1000">$500 - $1,000</option>
                  <option value="1000-2000">$1,000 - $2,000</option>
                  <option value="2000-5000">$2,000 - $5,000</option>
                  <option value="5000-10000">$5,000+</option>
                </select>
              </div>
              
              {/* Clear All Filters */}
              {(activeMaterial || activeGemstone || priceRange[0] > 0 || priceRange[1] < 10000) && (
                <button 
                  onClick={() => {
                    setActiveMaterial(null);
                    setActiveGemstone(null);
                    setPriceRange([0, 10000]);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* Product grid */}
        <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-8">
              {displayProducts.map((product) => (
                <div key={product._id} className="group relative overflow-hidden rounded-md bg-white border border-gray-200 hover:shadow-md transition-all duration-300 hover:border-vividOrange flex flex-col h-full max-w-xs mx-auto w-full">
                  {product.isNew && (
                  <span className="absolute top-2 left-2 bg-vividOrange text-white text-xs px-2 py-1 rounded">New</span>
                )}
                  {/* Wishlist button */}
                  <button className="absolute top-3 right-3 z-10 w-6 h-6 flex items-center justify-center">
                    <svg className="w-5 h-5 text-gray-500 hover:text-vividOrange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </button>

                  {/* Product image with hover effect */}
                  <Link href={`/products/${product.slug?.current || '#'}`}>
                    <div className="relative h-56 lg:h-64 overflow-hidden p-5 flex items-center justify-center">
                      {/* Regular product image */}
                      {product.images && product.images.length > 0 ? (
                        <Image 
                          src={urlFor(product.images[0]).width(300).height(300).url()}
                          alt={product.name}
                          width={150}
                          height={150}
                          className="object-contain max-h-full max-w-[80%] group-hover:opacity-0 transition-opacity duration-300"
                        />
                      ) : (
                        <div className="w-4/5 h-4/5 bg-gray-100 flex items-center justify-center">
                          <span className="text-gray-400">Image coming soon</span>
                        </div>
                      )}
                      
                      {/* Model wearing image (shown on hover) */}
                      {'modelWearingImage' in product && product.modelWearingImage ? (
                        <Image
                          src={urlFor(product.modelWearingImage).width(600).height(600).url()}
                          alt={`Model wearing ${product.name}`}
                          width={600}
                          height={600}
                          className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"
                        />
                      ) : product.images && product.images.length > 0 ? (
                        <Image 
                          src={urlFor(product.images[0]).width(600).height(600).url()}
                          alt={product.name}
                          width={600}
                          height={600}
                          className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        />
                      ) : null}
                      
                      {/* Add to bag button that appears on hover */}
                      <div className="absolute bottom-1 left-0 right-0 mx-auto w-max opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                        <button className="bg-black text-white text-xs px-4 py-2 rounded-md flex items-center space-x-1.5 hover:bg-vividOrange transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                          </svg>
                          <span>Add to Bag</span>
                        </button>
                      </div>
                    </div>
                  </Link>
                  
                  {/* Product metadata */}
                  <div className="py-4 px-3 flex-grow flex flex-col justify-between">
                    {/* Product name */}
                    <Link href={`/products/${product.slug?.current || '#'}`}>
                      <h3 className="text-xs font-medium text-gray-800 line-clamp-2 mb-1 group-hover:text-vividOrange transition-colors">
                        {product.name}
                      </h3>
                    </Link>
                    
                    {/* Price */}
                    <div className="mt-3">
                      <p className="text-sm font-bold text-gray-900">
                        <span className="font-bold text-vividOrange">${product.price?.toLocaleString()}</span>
                        {product.comparePrice && (
                          <span className="text-gray-500 text-xs ml-1 line-through">${product.comparePrice.toLocaleString()}</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Empty state */}
            {displayProducts.length === 0 && !isLoading && (
              <div className="text-center py-16">
                <h3 className="text-xl font-medium text-jetBlack mb-2">No products found</h3>
                <p className="text-slateGray mb-6">Try adjusting your filters or browse our other collections.</p>
                <Link 
                  href="/collections"
                  className="px-6 py-2 bg-vividOrange text-white rounded hover:bg-opacity-90 transition-colors"
                >
                  View All Collections
                </Link>
              </div>
            )}
            
            {/* Loading state */}
            {isLoading && (
              <div className="text-center py-12">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-vividOrange border-r-transparent"></div>
                <p className="mt-4 text-slateGray">Loading luxurious pieces...</p>
              </div>
            )}
          </div>
        </div>
      </div>
  )
}