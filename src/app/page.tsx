/// <reference path="../types/custom-elements.d.ts" />
import Image from "next/image";
import Link from "next/link";
import { client } from '@/sanity/client';
import { urlForImage } from '@/sanity/client';
import ClientWrapper from '@/components/ClientWrapper';
import Script from "next/script";

// Type definitions for our homepage content
type Hero = {
  title: string;
  description: string;
  backgroundImage?: any;
  cta?: { text: string; link: string; isMain: boolean }[];
};

type FeaturedCategories = {
  title: string;
  subtitle: string;
  categories?: {
    _id: string;
    title: string;
    slug: { current: string };
    image?: any;
  }[];
};

type FeaturedCollection = {
  title: string;
  subtitle: string;
  collection?: {
    _id: string;
    title: string;
    slug: { current: string };
  };
  featuredProducts?: {
    _id: string;
    name: string;
    slug: { current: string };
    price: number;
    images: any[];
  }[];
};

type Testimonials = {
  title: string;
  subtitle: string;
  testimonialsList?: {
    _id: string;
    name: string;
    location?: string;
    rating: number;
    quote: string;
    image?: any;
  }[];
};

type Newsletter = {
  title: string;
  description: string;
  buttonText: string;
};

type Value = {
  title: string;
  description: string;
  icon: string;
};

type HomepageData = {
  hero: Hero;
  featuredCategories: FeaturedCategories;
  featuredCollection: FeaturedCollection;
  testimonials: Testimonials;
  newsletter: Newsletter;
  values: Value[];
};

// This function fetches data at request time (Server Component)
async function getHomepageData(): Promise<HomepageData | null> {
  try {
    // Using Sanity client to fetch homepage data with a cache-busting timestamp
    const timestamp = new Date().getTime();
    
    // First fetch categories and collections separately to ensure they're available
    const allCategories = await client.fetch(`
      *[_type == "category"] {
        _id,
        title,
        slug,
        description,
        "image": image.asset->url
      }
    `);
    
    console.log('All available categories:', allCategories.length);
    
    // Then fetch homepage data
    const homepage = await client.fetch(`
      *[_type == "homepage"][0]{
        hero {
          title,
          description,
          backgroundImage,
          cta[] {
            text,
            link,
            isMain
          }
        },
        featuredCategories {
          title,
          subtitle,
          categories[]-> {
            _id,
            title,
            slug,
            description,
            "image": image.asset->url
          }
        },
        featuredCollection {
          title,
          subtitle,
          collection-> {
            _id,
            title,
            slug,
            description,
            "image": image.asset->url
          },
          featuredProducts[]-> {
            _id,
            name,
            slug,
            price,
            "images": images[].asset->url
          }
        },
        testimonials {
          title,
          subtitle,
          testimonialsList[]-> {
            _id,
            name,
            location,
            rating,
            quote,
            "image": image.asset->url
          }
        },
        newsletter {
          title,
          description,
          buttonText
        },
        values[] {
          title,
          description,
          icon
        }
      }
    `, { cache: 'no-store', next: { tags: [`homepage-${timestamp}`] } });
    
    console.log('Sanity homepage data fetched successfully:', !!homepage);
    
    // If there are no categories in the homepage or if they're empty, use the separately fetched categories
    if (!homepage?.featuredCategories?.categories || homepage.featuredCategories.categories.length === 0) {
      console.log('Using separately fetched categories because homepage categories are missing');
      if (homepage && homepage.featuredCategories) {
        homepage.featuredCategories.categories = allCategories;
      }
    } else {
      console.log('Homepage already has categories:', homepage?.featuredCategories?.categories?.length);
    }
    
    return homepage;
  } catch (error) {
    console.error('Error fetching homepage data:', error);
    return null;
  }
}

// This is a fallback configuration in case the CMS data isn't available yet
const fallbackData: HomepageData = {
  hero: {
    title: 'Timeless Elegance, Extraordinary Craftsmanship',
    description: 'Discover our exquisite collection of fine jewelry, crafted with passion and precision for moments that last forever.',
    cta: [
      { text: 'Explore Collections', link: '/collections', isMain: true },
      { text: 'New Arrivals', link: '/jewelry/new-arrivals', isMain: false }
    ]
  },
  featuredCategories: {
    title: 'Jewelry Categories',
    subtitle: 'Browse our curated selection of fine jewelry categories, each piece a testament to our dedication to excellence.',
    categories: []
  },
  featuredCollection: {
    title: 'The Celestial Collection',
    subtitle: 'Inspired by the cosmic wonders above, our Celestial Collection captures the brilliance of the night sky in every piece.',
    collection: undefined,
    featuredProducts: []
  },
  testimonials: {
    title: 'From Our Customers',
    subtitle: 'Hear what our valued customers have to say about their OrangeSmith experience.',
    testimonialsList: []
  },
  newsletter: {
    title: 'Join Our Newsletter',
    description: 'Subscribe to receive updates on new collections, exclusive offers, and jewelry care tips.',
    buttonText: 'Subscribe'
  },
  values: [
    {
      title: 'Ethical Sourcing',
      description: 'All our gemstones and precious metals are ethically sourced, ensuring our jewelry is as responsible as it is beautiful.',
      icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z'
    },
    {
      title: 'Master Craftsmanship',
      description: 'Each piece is meticulously crafted by skilled artisans with decades of experience, ensuring exceptional quality in every detail.',
      icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z'
    },
    {
      title: 'Personalized Service',
      description: 'We provide a tailored experience from consultation to aftercare, ensuring your jewelry journey is as extraordinary as our pieces.',
      icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'
    }
  ]
};

export default async function Home() {
  // Fetch data from Sanity
  const data = await getHomepageData();
  
  // Extract data from either Sanity or fallback with default values
  const {
    hero = fallbackData.hero,
    featuredCategories = fallbackData.featuredCategories, 
    featuredCollection = fallbackData.featuredCollection,
    testimonials = fallbackData.testimonials,
    newsletter = fallbackData.newsletter,
    values = fallbackData.values
  } = data || fallbackData;
  
  return (
    <ClientWrapper>
      <Script src="https://clooned.com/wp-content/uploads/cloons/scripts/clooned.js" strategy="afterInteractive" />
      <div className="w-full">
      {/* Hero Section */}
      <section className="relative h-[85vh] w-full overflow-hidden">
        {/* Gradient overlay for vibrant background to ensure text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-black/10 z-10"></div>
        <div className="relative h-full w-full">
          {/* Background image with null check */}
          {hero && hero.backgroundImage ? (
            <Image 
              src={urlForImage(hero.backgroundImage).url()}
              alt="Luxury jewelry banner"
              fill
              priority
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-r from-champagneGold to-vividOrange opacity-10"></div>
          )}
          <div className="absolute inset-0 flex items-center z-20">
            <div className="container mx-auto px-4 md:px-12 lg:px-16">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="ml-4 md:ml-12 lg:ml-20 text-left">
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-light text-white leading-tight mb-6">
                    {hero?.title || fallbackData.hero.title}
                  </h1>
                  <p className="text-lg md:text-xl text-white/90 mb-8 font-light">
                    {hero?.description || fallbackData.hero.description}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4">
                    {(hero?.cta || fallbackData.hero.cta)?.map((button, index) => {
                      // For "Explore Collections", we want to apply the border style
                      const isExploreCollections = button.text.includes("Explore Collections");
                      
                      return (
                        <Link 
                          key={index}
                          href={button.link} 
                          className={`px-8 py-3 font-medium transition-all duration-300 ${
                            isExploreCollections
                              ? 'border border-white text-white hover:border-vividOrange hover:border-opacity-80 hover:bg-transparent' 
                              : 'bg-vividOrange text-white hover:bg-opacity-90'
                          }`}
                        >
                          {button.text}
                        </Link>
                      );
                    })}
                  </div>
                </div>
                <div className="hidden md:flex justify-center items-center h-[500px]">
                  <div className="w-full h-full relative p-4 z-30">
                    <clooned-object features="lsc;dt;fs" oid="29a4fd0c9da240c08f1991622a84fc96"></clooned-object>
                    <Script
                      src="https://cdn.clooned.com/web-components/clooned-object.js"
                      strategy="afterInteractive"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Categories Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-display font-bold text-jetBlack mb-4">
              {featuredCategories?.title || fallbackData.featuredCategories.title}
            </h2>
            <p className="text-slateGray max-w-2xl mx-auto">
              {featuredCategories?.subtitle || fallbackData.featuredCategories.subtitle}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredCategories?.categories && Array.isArray(featuredCategories.categories) && featuredCategories.categories.length > 0 ? (
              featuredCategories.categories.map((category) => (
                <div key={category._id} className="group relative overflow-hidden rounded-lg">
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-all duration-300 z-10"></div>
                  {category.image ? (
                    <Image 
                      src={typeof category.image === 'string' ? category.image : urlForImage(category.image).url()}
                      alt={category.title}
                      width={400}
                      height={500}
                      className="w-full h-[300px] object-cover"
                    />
                  ) : (
                    <div className="bg-lightGray w-full h-[300px]"></div>
                  )}
                  <div className="absolute inset-0 flex flex-col items-center justify-center z-20 p-4">
                    <h3 className="text-xl font-medium text-white mb-2">{category.title}</h3>
                    <div className="mt-2">
                      <Link 
                        href={`/collections/${category.slug.current}`}
                        className="px-4 py-2 bg-white/80 text-jetBlack text-sm rounded-md hover:bg-white transition-colors"
                      >
                        Explore Collection
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              // Fallback for when no categories are defined yet
              ['Rings', 'Necklaces', 'Earrings', 'Bracelets'].map((categoryName, index) => (
                <div key={index} className="group relative overflow-hidden rounded-lg">
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-all duration-300 z-10"></div>
                  <div className="bg-lightGray w-full h-[300px]"></div>
                  <div className="absolute inset-0 flex flex-col items-center justify-center z-20 p-4">
                    <h3 className="text-xl font-medium text-white mb-2">{categoryName}</h3>
                    <div className="mt-2">
                      <Link 
                        href={`/collections/${categoryName.toLowerCase()}`}
                        className="px-4 py-2 bg-white/80 text-jetBlack text-sm rounded-md hover:bg-white transition-colors"
                      >
                        Explore Collection
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Featured Collection */}
      <section className="py-16 bg-lightGray">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-3xl font-display font-bold text-jetBlack mb-4">
              {featuredCollection?.title || fallbackData.featuredCollection.title}
            </h2>
            <p className="text-slateGray">
              {featuredCollection?.subtitle || fallbackData.featuredCollection.subtitle}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            {featuredCollection?.featuredProducts && Array.isArray(featuredCollection.featuredProducts) && featuredCollection.featuredProducts.length > 0 ? (
              featuredCollection.featuredProducts.map((product) => (
                <div key={product._id} className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  {product.images && product.images.length > 0 ? (
                    <Image 
                      src={typeof product.images[0] === 'string' ? product.images[0] : urlForImage(product.images[0]).url()}
                      alt={product.name}
                      width={400}
                      height={400}
                      className="w-full h-[300px] object-cover"
                    />
                  ) : (
                    <div className="bg-gray-100 w-full h-[300px] flex items-center justify-center">
                      <span className="text-gray-400">No image available</span>
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-medium text-lg text-jetBlack">{product.name}</h3>
                    <p className="text-vividOrange font-medium mt-2">${product.price?.toFixed(2)}</p>
                    <Link 
                      href={`/products/${product.slug.current}`}
                      className="mt-4 inline-block px-6 py-2 bg-jetBlack text-white text-sm rounded hover:bg-opacity-90 transition-colors"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              // Fallback products when none are defined yet
              Array.from({length: 3}).map((_, index) => (
                <div key={index} className="bg-white rounded-lg overflow-hidden shadow-sm">
                  <div className="bg-gray-100 w-full h-[300px]"></div>
                  <div className="p-4">
                    <h3 className="font-medium text-lg text-jetBlack">Stunning Jewelry Piece</h3>
                    <p className="text-vividOrange font-medium mt-2">$999.00</p>
                    <button 
                      className="mt-4 px-6 py-2 bg-jetBlack text-white text-sm rounded hover:bg-opacity-90 transition-colors"
                    >
                      Coming Soon
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-display font-bold text-jetBlack mb-4">
              {testimonials?.title || fallbackData.testimonials.title}
            </h2>
            <p className="text-slateGray max-w-2xl mx-auto">
              {testimonials?.subtitle || fallbackData.testimonials.subtitle}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials?.testimonialsList && Array.isArray(testimonials.testimonialsList) && testimonials.testimonialsList.length > 0 ? (
              testimonials.testimonialsList.map((testimonial) => (
                <div key={testimonial._id} className="bg-lightGray p-8 rounded-lg">
                  <div className="flex items-center mb-4">
                    {testimonial.image ? (
                      <Image 
                        src={urlForImage(testimonial.image).url()}
                        alt={testimonial.name}
                        width={48}
                        height={48}
                        className="w-12 h-12 rounded-full object-cover mr-4"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gray-300 mr-4"></div>
                    )}
                    <div>
                      <h4 className="font-medium text-jetBlack">{testimonial.name}</h4>
                      {testimonial.location && (
                        <p className="text-sm text-slateGray">{testimonial.location}</p>
                      )}
                      <div className="flex text-vividOrange">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className={i < testimonial.rating ? "" : "text-gray-300"}>
                            ★
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-slateGray">
                    "{testimonial.quote}"
                  </p>
                </div>
              ))
            ) : (
              // Fallback testimonials
              [
                {
                  name: 'Emma Johnson',
                  quote: 'The engagement ring I purchased exceeded all expectations. The craftsmanship is impeccable and the diamonds catch light beautifully. Customer service was exceptional throughout.',
                  rating: 5
                },
                {
                  name: 'Michael Chen',
                  quote: 'I was looking for the perfect anniversary gift and found exactly what I needed. The jewelry arrived in elegant packaging and my wife absolutely loves her new necklace.',
                  rating: 5
                },
                {
                  name: 'Sophia Rodriguez',
                  quote: 'I\'ve purchased several pieces from OrangeSmith over the years and have always been impressed with the quality. Their customer service team is responsive and shipping is always prompt.',
                  rating: 5
                }
              ].map((testimonial, index) => (
                <div key={index} className="bg-lightGray p-8 rounded-lg">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 rounded-full bg-gray-300 mr-4"></div>
                    <div>
                      <h4 className="font-medium text-jetBlack">{testimonial.name}</h4>
                      <div className="flex text-vividOrange">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className={i < testimonial.rating ? "" : "text-gray-300"}>
                            ★
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-slateGray">
                    "{testimonial.quote}"
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 bg-champagneGold text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-display font-bold mb-4">
              {newsletter?.title || fallbackData.newsletter.title}
            </h2>
            <p className="mb-8">
              {newsletter?.description || fallbackData.newsletter.description}
            </p>
            <form className="flex flex-col sm:flex-row gap-4">
              <input 
                type="email" 
                placeholder="Your email address" 
                className="flex-1 px-6 py-3 rounded text-jetBlack focus:outline-none focus:ring-2 focus:ring-vividOrange"
              />
              <button 
                type="submit" 
                className="px-8 py-3 bg-jetBlack text-white font-medium rounded hover:bg-opacity-90 transition-all"
              >
                {newsletter?.buttonText || fallbackData.newsletter.buttonText}
              </button>
            </form>
            <p className="text-sm mt-4 text-white/80">
              By subscribing, you agree to our Privacy Policy and consent to receive updates.
            </p>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {values && Array.isArray(values) ? values.map((value, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-full bg-lightGray">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-vividOrange" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={value.icon} />
                  </svg>
                </div>
                <h3 className="text-xl font-display font-medium text-jetBlack mb-3">{value.title}</h3>
                <p className="text-slateGray">
                  {value.description}
                </p>
              </div>
            )) : fallbackData.values.map((value, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-full bg-lightGray">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-vividOrange" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={value.icon} />
                  </svg>
                </div>
                <h3 className="text-xl font-display font-medium text-jetBlack mb-3">{value.title}</h3>
                <p className="text-slateGray">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
      </div>
    </ClientWrapper>
  );
}
