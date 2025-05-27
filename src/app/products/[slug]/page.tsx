'use client'

import { useState, useEffect } from 'react'
import Image from "next/image";
import Link from "next/link";
import { client } from '@/sanity/lib/client';
import { urlFor } from '@/sanity/lib/image';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useAuth } from '@/contexts/AuthContext';
import { createCartItem } from '@/lib/sanity/cart-helpers';
import { useParams } from 'next/navigation'

// Types
interface Product {
  _id: string
  name: string
  slug: {
    current: string
  }
  images: any[]
  modelWearingImage?: any
  certificateImage?: any
  price: number
  comparePrice?: number
  description: string
  specifications?: Array<{
    name: string
    value: string
  }>
  measurements?: string
  ijewel3dCode?: string
  productVideo?: any
  materials?: any[]
  gemstones?: any[]
  dimensions?: string
  certificateNumber?: string
  shippingInfo?: {
    isFreeShipping: boolean
    deliveryTime: number
    shippingNote: string
  }
  relatedProducts?: any[]
  frequentlyBoughtTogether?: any[]
}

// Media types for the product page
type ImageMedia = {
  type: 'image'
  src: string
  alt: string
}

type VideoMedia = {
  type: 'video'
  src: string
}

type ModelMedia = {
  type: '3dmodel'
  code: string
}

type ProductMedia = ImageMedia | VideoMedia | ModelMedia

// CSS to hide scrollbar for thumbnail navigation
const hideScrollbarCSS = `
  .hide-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .hide-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`;

export default function ProductPage() {
  const params = useParams()
  const slug = params.slug as string
  
  const [product, setProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)
  const [relatedProducts, setRelatedProducts] = useState<any[]>([])
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalImage, setModalImage] = useState(0)
  
  useEffect(() => {
    const fetchProductData = async () => {
      try {
        setIsLoading(true)
        
        // Fetch the product data
        const productData = await client.fetch(`
          *[_type == "product" && slug.current == "${slug}"][0] {
            _id,
            name,
            slug,
            images,
            modelWearingImage,
            certificateImage,
            price,
            comparePrice,
            description,
            specifications,
            measurements,
            ijewel3dCode,
            productVideo,
            dimensions,
            certificateNumber,
            materials[]->{_id, name, slug},
            gemstones[]->{_id, name, slug},
            shippingInfo,
            "relatedProducts": relatedProducts[]->{ 
              _id, 
              name, 
              slug, 
              images, 
              price 
            },
            "frequentlyBoughtTogether": frequentlyBoughtTogether[]->{ 
              _id, 
              name, 
              slug, 
              images, 
              price 
            }
          }
        `)
        
        setProduct(productData)
        
        // Get similar products if no related products are specified
        if (!productData.relatedProducts || productData.relatedProducts.length === 0) {
          // Find products in the same categories
          const similarProducts = await client.fetch(`
            *[_type == "product" && 
              _id != "${productData._id}" && 
              count((categories[]->_id)[@ in ${JSON.stringify(productData.categories?.map((c: any) => c._id) || [])}]) > 0
            ][0...4] {
              _id,
              name,
              slug,
              images,
              price
            }
          `)
          
          setRelatedProducts(similarProducts)
        } else {
          setRelatedProducts(productData.relatedProducts)
        }
      } catch (error) {
        console.error("Error fetching product:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (slug) {
      fetchProductData()
    }
  }, [slug])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-vividOrange border-r-transparent"></div>
          <p className="mt-4 text-slateGray">Loading product details...</p>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-medium text-jetBlack mb-2">Product Not Found</h1>
          <p className="text-slateGray mb-6">The product you're looking for doesn't exist or has been removed.</p>
          <Link href="/collections" className="inline-block px-6 py-2 bg-vividOrange text-white rounded hover:bg-opacity-90 transition-colors">
            Browse Collections
          </Link>
        </div>
      </div>
    )
  }

  // Split the product media into a 2-column grid
  const productMedia: ProductMedia[] = []
  
  // Add main product images
  if (product.images && product.images.length > 0) {
    productMedia.push(...product.images.map(img => ({
      type: 'image',
      src: urlFor(img).width(600).height(600).url(),
      alt: product.name
    } as ImageMedia)))
  }
  
  // Add model wearing image if available
  if (product.modelWearingImage) {
    productMedia.push({
      type: 'image',
      src: urlFor(product.modelWearingImage).width(600).height(600).url(),
      alt: `Model wearing ${product.name}`
    } as ImageMedia)
  }
  
  // Add certificate image if available
  if (product.certificateImage) {
    productMedia.push({
      type: 'image',
      src: urlFor(product.certificateImage).width(600).height(600).url(),
      alt: `Certificate for ${product.name}`
    } as ImageMedia)
  }
  
  // If there's a 3D model code, add it
  if (product.ijewel3dCode) {
    productMedia.push({
      type: '3dmodel',
      code: product.ijewel3dCode // This should be the slug from iJewel
    } as ModelMedia)
  }
  
  // If there's a video, add it
  if (product.productVideo && product.productVideo.asset && product.productVideo.asset.url) {
    productMedia.push({
      type: 'video',
      src: product.productVideo.asset.url
    } as VideoMedia)
  }
  
  // Add to Cart Button Component
  function AddToCartButton({ product }: { product: any }) {
    const { addItem, isLoading } = useCart();
    const [isAdding, setIsAdding] = useState(false);
    const [added, setAdded] = useState(false);
    const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
    const [quantity, setQuantity] = useState(1);

    // Check if product has variants
    const hasVariants = product.variants && Array.isArray(product.variants) && product.variants.length > 0;

    const handleAddToCart = async () => {
      setIsAdding(true);
      try {
        if (!product._id) {
          throw new Error('Product ID is required');
        }
        
        // Create a properly formatted cart item using our helper function
        // Include the selected variant if one is chosen
        const cartItem = createCartItem(
          product, 
          quantity, 
          selectedVariant ? selectedVariant : undefined
        );
        
        console.log('Adding to cart:', cartItem);
        await addItem(cartItem);
        setAdded(true);
        setTimeout(() => setAdded(false), 3000); // Reset after 3 seconds
      } catch (error) {
        console.error('Error adding to cart:', error);
        // Could add toast notification here
      } finally {
        setIsAdding(false);
      }
    };

    return (
      <div className="space-y-4">
        {/* Variant selector if product has variants */}
        {hasVariants && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Options</label>
            <select
              value={selectedVariant || ''}
              onChange={(e) => setSelectedVariant(e.target.value || null)}
              className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-none shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
            >
              <option value="">Select an option</option>
              {product.variants.map((variant: any) => (
                <option key={variant._key} value={variant._key}>
                  {variant.material ? `${variant.material} ` : ''}
                  {variant.size ? `Size ${variant.size} ` : ''}
                  {variant.gemstone ? `with ${variant.gemstone}` : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Quantity selector */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-10 h-10 border border-r-0 border-gray-300 flex items-center justify-center"
              aria-label="Decrease quantity"
            >
              -
            </button>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-16 h-10 border border-gray-300 text-center focus:outline-none focus:ring-1 focus:ring-gray-500"
            />
            <button
              type="button"
              onClick={() => setQuantity(quantity + 1)}
              className="w-10 h-10 border border-l-0 border-gray-300 flex items-center justify-center"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
        </div>
        
        <button 
          onClick={handleAddToCart}
          disabled={isAdding || isLoading || (hasVariants && !selectedVariant)}
          className="w-full bg-black hover:bg-gray-800 text-white font-medium py-3 px-6 rounded-none transition-colors flex items-center justify-center text-sm uppercase tracking-wider disabled:opacity-70"
        >
          {isAdding ? 'Adding...' : added ? 'Added to Bag ✓' : 'Add to Bag'}
        </button>
      </div>
    );
  }

  // Add to Wishlist Button Component
  function AddToWishlistButton({ product }: { product: any }) {
    const { addToWishlist, removeFromWishlist, isInWishlist, isLoading } = useWishlist();
    const { user } = useAuth();
    const [isProcessing, setIsProcessing] = useState(false);
    
    const productInWishlist = isInWishlist(product._id);

    const handleWishlistToggle = async () => {
      setIsProcessing(true);
      try {
        if (productInWishlist) {
          // For removal, we just need the ID
          await removeFromWishlist(product._id);
        } else {
          // Create a properly formatted wishlist item
          const wishlistItem = {
            id: `temp-${Date.now()}`,
            product_id: product._id,
            name: product.name || 'OrangeSmith Fine Jewelry',
            price: product.price || 0,
            slug: product.slug?.current || '',
            image: product.images?.[0] || null
          };
          await addToWishlist(wishlistItem);
        }
      } catch (error) {
        console.error('Error updating wishlist', error);
      } finally {
        setIsProcessing(false);
      }
    };

    return (
      <button 
        onClick={handleWishlistToggle}
        disabled={isProcessing || isLoading}
        className="w-full border border-black hover:bg-gray-50 text-black font-medium py-3 px-6 rounded-none transition-colors flex items-center justify-center text-sm uppercase tracking-wider disabled:opacity-70"
      >
        {isProcessing ? 'Processing...' : (
          <>
            {productInWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className={`ml-2 h-5 w-5 ${productInWishlist ? 'fill-current' : 'stroke-current fill-none'}`} 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="1.5" 
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </>
        )}
      </button>
    );
  }

  return (
    <div className="bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Breadcrumbs */}
        <nav className="flex mb-6 text-xs text-gray-500">
          <Link href="/" className="hover:text-gray-800">Home</Link>
          <span className="mx-2">/</span>
          <Link href="/collections" className="hover:text-gray-800">Collections</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-800">{product.name}</span>
        </nav>
        
        {/* Product Information Section */}
        <div className="flex flex-col lg:flex-row gap-16">
          {/* Left Column - Product Media */}
          <div className="lg:w-[60%]">
            {/* Desktop Image Grid - hidden on mobile */}
            <div className="hidden lg:grid grid-cols-2 gap-2 mb-2">
              {/* First large hero image */}
              <div className="aspect-square bg-gray-50 rounded-sm overflow-hidden cursor-pointer" onClick={() => {
                if (productMedia.length > 0 && productMedia[0].type === 'image') {
                  setModalImage(0)
                  setIsModalOpen(true)
                }
              }}>
                {productMedia.length > 0 ? (
                  productMedia[0].type === 'image' ? (
                    <Image
                      src={(productMedia[0] as ImageMedia).src}
                      alt={(productMedia[0] as ImageMedia).alt}
                      width={600}
                      height={600}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-50"></div>
                  )
                ) : (
                  <div className="w-full h-full bg-gray-50"></div>
                )}
              </div>
              
              {/* 3D Model Viewer in the first row */}
              {product.ijewel3dCode ? (
                <div className="aspect-square bg-gray-50 rounded-sm overflow-hidden">
                  <iframe 
                    title={`3D Model - ${product.name}`}
                    frameBorder="0"
                    allowFullScreen={true}
                    allow="autoplay; fullscreen; xr-spatial-tracking; web-share"
                    src={`https://ijewel.design/embedded?slug=${product.ijewel3dCode}&isTitle=false&isAutoplay=true&isTransparentBackground=true&isConfigurator=false&isShare=false`}
                    className="w-full h-full"
                    style={{ width: '100%', height: '100%' }}
                  ></iframe>
                </div>
              ) : (
                /* Second image - person wearing item - shown in first row if no 3D model */
                <div className="aspect-square bg-gray-50 rounded-sm overflow-hidden cursor-pointer" onClick={() => {
                  if (product.modelWearingImage) {
                    // Handle separately since it might not be in productMedia
                    const modelImageIndex = productMedia.findIndex(m => 
                      m.type === 'image' && (m as ImageMedia).src.includes(product.modelWearingImage!._ref)
                    );
                    setModalImage(modelImageIndex !== -1 ? modelImageIndex : 0)
                    setIsModalOpen(true)
                  } else if (productMedia.length > 1 && productMedia[1].type === 'image') {
                    setModalImage(1)
                    setIsModalOpen(true)
                  }
                }}>
                  {product.modelWearingImage ? (
                    <Image
                      src={urlFor(product.modelWearingImage).width(600).height(600).url()}
                      alt={`Model wearing ${product.name}`}
                      width={600}
                      height={600}
                      className="w-full h-full object-cover"
                    />
                  ) : productMedia.length > 1 ? (
                    productMedia[1].type === 'image' ? (
                      <Image
                        src={(productMedia[1] as ImageMedia).src}
                        alt={(productMedia[1] as ImageMedia).alt}
                        width={600}
                        height={600}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-50"></div>
                    )
                  ) : (
                    <div className="w-full h-full bg-gray-50"></div>
                  )}
                </div>
              )}

              {/* Additional product images - shown in second position when 3D model exists */}
              {product.ijewel3dCode && (
                <div className="aspect-square bg-gray-50 rounded-sm overflow-hidden cursor-pointer" onClick={() => {
                  if (productMedia.length > 1 && productMedia[1].type === 'image') {
                    setModalImage(1)
                    setIsModalOpen(true)
                  }
                }}>
                  {productMedia.length > 1 ? (
                    productMedia[1].type === 'image' ? (
                      <Image
                        src={(productMedia[1] as ImageMedia).src}
                        alt={(productMedia[1] as ImageMedia).alt}
                        width={600}
                        height={600}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-50"></div>
                    )
                  ) : (
                    <div className="w-full h-full bg-gray-50"></div>
                  )}
                </div>
              )}
              
              {/* Additional product images */}
              <div className="aspect-square bg-gray-50 rounded-sm overflow-hidden cursor-pointer" onClick={() => {
                if (productMedia.length > 2 && productMedia[2].type === 'image') {
                  setModalImage(2)
                  setIsModalOpen(true)
                }
              }}>
                {productMedia.length > 2 ? (
                  productMedia[2].type === 'image' ? (
                    <Image
                      src={(productMedia[2] as ImageMedia).src}
                      alt={(productMedia[2] as ImageMedia).alt}
                      width={600}
                      height={600}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-50"></div>
                  )
                ) : (
                  <div className="w-full h-full bg-gray-50"></div>
                )}
              </div>
              
              {/* Certificate Image */}
              {product.certificateImage && (
                <div className="aspect-square bg-gray-50 rounded-sm overflow-hidden">
                  <Image
                    src={urlFor(product.certificateImage).width(600).height(600).url()}
                    alt={`Certificate for ${product.name}`}
                    width={600}
                    height={600}
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
            </div>
            
            {/* Mobile Slider - visible only on mobile */}
            <div className="lg:hidden relative mb-6">
              <div className="overflow-hidden aspect-square bg-gray-50 rounded-sm">
                {/* Main Slide */}
                {currentSlide < productMedia.length && productMedia[currentSlide].type === 'image' ? (
                  <div onClick={() => {
                    setModalImage(currentSlide)
                    setIsModalOpen(true)
                  }} className="w-full h-full cursor-pointer">
                    <Image
                      src={(productMedia[currentSlide] as ImageMedia).src}
                      alt={(productMedia[currentSlide] as ImageMedia).alt}
                      width={600}
                      height={600}
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : currentSlide < productMedia.length && productMedia[currentSlide].type === '3dmodel' ? (
                  <iframe 
                    title={`3D Model - ${product.name}`}
                    frameBorder="0"
                    allowFullScreen={true}
                    allow="autoplay; fullscreen; xr-spatial-tracking; web-share"
                    src={`https://ijewel.design/embedded?slug=${(productMedia[currentSlide] as ModelMedia).code}&isTitle=false&isAutoplay=true&isTransparentBackground=true&isConfigurator=false&isShare=false`}
                    className="w-full h-full"
                    style={{ width: '100%', height: '100%' }}
                  ></iframe>
                ) : currentSlide < productMedia.length && productMedia[currentSlide].type === 'video' ? (
                  <video 
                    src={(productMedia[currentSlide] as VideoMedia).src} 
                    controls
                    className="w-full h-full object-contain"
                  ></video>
                ) : (
                  <div className="w-full h-full bg-gray-50"></div>
                )}

                {/* Navigation Arrows */}
                {productMedia.length > 1 && (
                  <>
                    <button 
                      onClick={() => setCurrentSlide(prev => (prev === 0 ? productMedia.length - 1 : prev - 1))}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-white bg-opacity-75 rounded-full p-2 shadow-sm"
                      aria-label="Previous image"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button 
                      onClick={() => setCurrentSlide(prev => (prev === productMedia.length - 1 ? 0 : prev + 1))}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-white bg-opacity-75 rounded-full p-2 shadow-sm"
                      aria-label="Next image"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </>
                )}
              </div>
              
              {/* Dots indicator */}
              {productMedia.length > 1 && (
                <div className="flex justify-center mt-4 space-x-2">
                  {productMedia.map((_, index) => (
                    <button 
                      key={index} 
                      onClick={() => setCurrentSlide(index)}
                      className={`w-2 h-2 rounded-full ${currentSlide === index ? 'bg-gray-800' : 'bg-gray-300'}`}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
            
            {/* If video exists, show it below the grid (only on desktop) */}
            {product.productVideo && product.productVideo.asset && product.productVideo.asset.url && (
              <div className="hidden lg:block mt-4 aspect-video bg-gray-50 rounded-sm overflow-hidden">
                <video 
                  src={product.productVideo.asset.url} 
                  controls
                  className="w-full h-full object-contain"
                  poster={product.images && product.images.length > 0 ? urlFor(product.images[0]).width(600).height(600).url() : undefined}
                ></video>
              </div>
            )}
          </div>
          
          {/* Right Column - Product Details */}
          <div className="lg:w-[40%] flex flex-col">
            {/* Product Title */}
            <h1 className="text-xl font-medium text-gray-900 mb-2">{product.name}</h1>
              
            {/* Price */}
            <div className="mb-6">
              <p className="text-base text-gray-900">
                ${product.price?.toLocaleString()}
                {product.comparePrice && (
                  <span className="text-gray-500 text-sm ml-2 line-through">${product.comparePrice.toLocaleString()}</span>
                )}
              </p>
            </div>

            {/* Display Material Info */}
            <div className="mb-8">
              {product.materials && product.materials.length > 0 && (
                <div className="mb-2 text-sm text-gray-600">Metal: {product.materials.map(m => m.name).join(', ')}</div>
              )}
              {product.gemstones && product.gemstones.length > 0 && (
                <div className="text-sm text-gray-600">Gemstones: {product.gemstones.map(g => g.name).join(', ')}</div>
              )}
            </div>
              
            {/* Shipping Info - Simple text */}
            <div className="mb-8 text-sm text-gray-600">
              <div>4 Days Standard Shipping</div>
            </div>
              
            {/* Add to Cart and Wishlist Buttons */}
            <div className="mb-8 space-y-4">
              <AddToCartButton product={product} />
              <AddToWishlistButton product={product} />
            </div>
            
            {/* Certificate */}
            {product.certificateNumber && (
              <div className="mb-8 p-4 border border-gray-200 rounded-md">
                <h3 className="text-sm font-medium text-jetBlack mb-2">Certificate Information</h3>
                <p className="text-sm text-slateGray">Certificate Number: {product.certificateNumber}</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Image Modal/Lightbox */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-white flex items-center justify-center">
            <style dangerouslySetInnerHTML={{ __html: hideScrollbarCSS }} />
            <div className="relative w-full h-full max-w-[1400px] max-h-[90vh] mx-auto flex flex-col">
              {/* Product title at top */}
              <div className="py-4 px-6 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-lg font-medium text-gray-900">{product.name}</h2>
                {/* Close button */}
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                  aria-label="Close modal"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Main content area */}
              <div className="flex flex-grow overflow-hidden">
                {/* Left thumbnail navigation */}
                <div className="w-24 border-r border-gray-100 overflow-y-auto py-4 hide-scrollbar">
                  {/* 3D Model thumbnail if exists */}
                  {product.ijewel3dCode && (
                    <button 
                      onClick={() => {
                        // Find the 3D model in productMedia
                        const modelIndex = productMedia.findIndex(m => m.type === '3dmodel');
                        if (modelIndex >= 0) {
                          setModalImage(modelIndex);
                        }
                      }}
                      className={`w-16 h-16 mx-auto mb-3 relative border ${productMedia.findIndex(m => m.type === '3dmodel') === modalImage ? 'border-2 border-gray-900' : 'border-gray-200'} overflow-hidden`}
                    >
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l-3 3m0 0l-3-3m3 3V7" />
                        </svg>
                        <span className="absolute bottom-0 w-full text-center text-[9px] font-medium bg-gray-100 py-1">3D</span>
                      </div>
                    </button>
                  )}
                  
                  {/* Image thumbnails */}
                  {productMedia
                    .filter(media => media.type === 'image')
                    .map((media, index) => {
                      const actualIndex = productMedia.findIndex(m => m === media);
                      return (
                        <button 
                          key={index} 
                          onClick={() => setModalImage(actualIndex)}
                          className={`w-16 h-16 mx-auto mb-3 ${modalImage === actualIndex ? 'border-2 border-gray-900' : 'border border-gray-200'} overflow-hidden`}
                        >
                          <Image
                            src={(media as ImageMedia).src}
                            alt={(media as ImageMedia).alt}
                            width={80}
                            height={80}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      );
                    })}
                    
                  {/* Video thumbnail if exists */}
                  {product.productVideo && product.productVideo.asset && product.productVideo.asset.url && (
                    <button 
                      className={`w-16 h-16 mx-auto mb-3 relative border border-gray-200 overflow-hidden`}
                    >
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </button>
                  )}
                </div>
                
                {/* Main image container */}
                <div className="flex-grow relative flex items-center justify-center p-8">
                  <div className="relative w-full h-full flex items-center justify-center">
                    {modalImage < productMedia.length && productMedia[modalImage].type === 'image' ? (
                      <>
                        <Image
                          src={(productMedia[modalImage] as ImageMedia).src}
                          alt={(productMedia[modalImage] as ImageMedia).alt}
                          width={1200}
                          height={1200}
                          className="max-h-[70vh] max-w-full object-contain"
                        />
                        {/* Magnify icon */}
                        <button className="absolute bottom-2 right-2 p-2 bg-white bg-opacity-75 rounded-full shadow-sm">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        </button>
                      </>
                    ) : modalImage < productMedia.length && productMedia[modalImage].type === '3dmodel' ? (
                      <div className="w-full h-[70vh] bg-gray-50">
                        <iframe 
                          title={`3D Model - ${product.name}`}
                          frameBorder="0"
                          allowFullScreen={true}
                          allow="autoplay; fullscreen; xr-spatial-tracking; web-share"
                          src={`https://ijewel.design/embedded?slug=${(productMedia[modalImage] as ModelMedia).code}&isTitle=false&isAutoplay=true&isTransparentBackground=true&isConfigurator=false&isShare=false`}
                          className="w-full h-full"
                          style={{ width: '100%', height: '100%' }}
                        ></iframe>
                      </div>
                    ) : (
                      <div className="w-full h-[70vh] bg-gray-50"></div>
                    )}
                  </div>

                  {/* Navigation arrows */}
                  {productMedia.length > 1 && (
                    <>
                      <button 
                        onClick={() => {
                          // Find the previous viewable media (image or 3D model)
                          let prevIndex = modalImage - 1;
                          while (prevIndex >= 0) {
                            if (['image', '3dmodel'].includes(productMedia[prevIndex].type)) break;
                            prevIndex--;
                          }
                          if (prevIndex < 0) {
                            // Loop back to the end
                            prevIndex = productMedia.length - 1;
                            while (prevIndex > modalImage) {
                              if (['image', '3dmodel'].includes(productMedia[prevIndex].type)) break;
                              prevIndex--;
                            }
                          }
                          setModalImage(prevIndex);
                        }}
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-white rounded-full p-2 shadow-sm z-10"
                        aria-label="Previous image"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <button 
                        onClick={() => {
                          // Find the next viewable media (image or 3D model)
                          let nextIndex = modalImage + 1;
                          while (nextIndex < productMedia.length) {
                            if (['image', '3dmodel'].includes(productMedia[nextIndex].type)) break;
                            nextIndex++;
                          }
                          if (nextIndex >= productMedia.length) {
                            // Loop back to the beginning
                            nextIndex = 0;
                            while (nextIndex < modalImage) {
                              if (['image', '3dmodel'].includes(productMedia[nextIndex].type)) break;
                              nextIndex++;
                            }
                          }
                          setModalImage(nextIndex);
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-white rounded-full p-2 shadow-sm z-10"
                        aria-label="Next image"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Product Details Section */}
        <div className="mt-16">
          <h2 className="text-xl font-medium text-gray-900 mb-8">Product Details</h2>
          
          <div className="flex flex-col lg:flex-row gap-12 mt-8">
            {/* Left Column - Specifications */}
            <div className="lg:w-1/2">
              <div className="">
                <h3 className="text-base font-medium text-gray-900 mb-4">Specifications</h3>
                
                {product.specifications && product.specifications.length > 0 ? (
                  <div className="space-y-3">
                    {product.specifications.map((spec, index) => (
                      <div key={index} className="flex">
                        <div className="w-1/3 text-sm text-gray-600">{spec.name}</div>
                        <div className="w-2/3 text-sm text-gray-900">{spec.value}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-600">
                    {product.dimensions ? (
                      <div className="flex mb-2">
                        <div className="w-1/3 text-gray-600">Dimensions</div>
                        <div className="w-2/3 text-gray-900">{product.dimensions}</div>
                      </div>
                    ) : null}
                    
                    {product.materials && product.materials.length > 0 ? (
                      <div className="flex mb-2">
                        <div className="w-1/3 text-gray-600">Materials</div>
                        <div className="w-2/3 text-gray-900">{product.materials.map(m => m.name).join(', ')}</div>
                      </div>
                    ) : null}
                    
                    {product.gemstones && product.gemstones.length > 0 ? (
                      <div className="flex mb-2">
                        <div className="w-1/3 text-gray-600">Gemstones</div>
                        <div className="w-2/3 text-gray-900">{product.gemstones.map(g => g.name).join(', ')}</div>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
            
            {/* Right Column - Description & Measurements */}
            <div className="lg:w-1/2">
              <div className="">
                <h3 className="text-base font-medium text-gray-900 mb-4">Description</h3>
                <div className="text-sm leading-relaxed text-gray-600 mb-8 whitespace-pre-line">
                  {product.description}
                </div>
                
                {product.measurements && (
                  <>
                    <h3 className="text-base font-medium text-gray-900 mb-4">Measurements</h3>
                    <div className="text-sm text-gray-600 whitespace-pre-line">
                      {product.measurements}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Related Products Section */}
        {((product.relatedProducts && product.relatedProducts.length > 0) || relatedProducts.length > 0) && (
          <div className="mt-24 border-t border-gray-200 pt-16">
            <h2 className="text-xl font-medium text-gray-900 mb-10">
              {(product.relatedProducts && product.relatedProducts.length > 0) ? 'You Might Also Like' : 'You Might Also Like'}
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {(product.relatedProducts && product.relatedProducts.length > 0 ? product.relatedProducts : relatedProducts).map((relatedProduct) => (
                <Link key={relatedProduct._id} href={`/products/${relatedProduct.slug.current}`}>
                  <div className="group relative overflow-hidden bg-white hover:shadow-sm transition-all duration-300 flex flex-col h-full">
                    <div className="relative h-48 overflow-hidden p-4 flex items-center justify-center">
                      {relatedProduct.images && relatedProduct.images.length > 0 ? (
                        <Image 
                          src={urlFor(relatedProduct.images[0]).width(300).height(300).url()}
                          alt={relatedProduct.name}
                          width={150}
                          height={150}
                          className="object-contain max-h-full max-w-[80%]"
                        />
                      ) : (
                        <div className="w-4/5 h-4/5 bg-gray-100 flex items-center justify-center">
                          <span className="text-gray-400">Image coming soon</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="py-3 px-3">
                      <h3 className="text-xs font-medium text-gray-800 line-clamp-2 mb-1 group-hover:text-vividOrange transition-colors">
                        {relatedProduct.name}
                      </h3>
                      
                      <div className="mt-2">
                        <p className="text-sm font-bold text-gray-900">
                          <span className="text-gray-900">${relatedProduct.price?.toLocaleString()}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
        
        {/* Frequently Bought Together Section */}
        {product.frequentlyBoughtTogether && product.frequentlyBoughtTogether.length > 0 && (
          <div className="mt-24 border-t border-gray-200 pt-16">
            <h2 className="text-xl font-medium text-gray-900 mb-10">Frequently Bought Together</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {product.frequentlyBoughtTogether.map((relatedProduct) => (
                <Link key={relatedProduct._id} href={`/products/${relatedProduct.slug.current}`}>
                  <div className="group relative overflow-hidden bg-white hover:shadow-sm transition-all duration-300 flex flex-col h-full">
                    <div className="relative h-48 overflow-hidden p-4 flex items-center justify-center">
                      {relatedProduct.images && relatedProduct.images.length > 0 ? (
                        <Image 
                          src={urlFor(relatedProduct.images[0]).width(300).height(300).url()}
                          alt={relatedProduct.name}
                          width={150}
                          height={150}
                          className="object-contain max-h-full max-w-[80%]"
                        />
                      ) : (
                        <div className="w-4/5 h-4/5 bg-gray-100 flex items-center justify-center">
                          <span className="text-gray-400">Image coming soon</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="py-3 px-3">
                      <h3 className="text-xs font-medium text-gray-800 line-clamp-2 mb-1 group-hover:text-vividOrange transition-colors">
                        {relatedProduct.name}
                      </h3>
                      
                      <div className="mt-2">
                        <p className="text-sm font-bold text-gray-900">
                          <span className="text-gray-900">${relatedProduct.price?.toLocaleString()}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
