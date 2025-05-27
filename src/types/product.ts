// Product type definition that aligns with your Sanity schema
export interface Product {
  _id: string;
  name: string;
  slug: {
    current: string;
  };
  price: number;
  comparePrice?: number;
  description?: string;
  images: any[]; // Sanity image references
  modelWearingImage?: any;
  certificateImage?: any;
  materials?: {
    _id: string;
    name: string;
    slug: {
      current: string;
    };
  }[];
  gemstones?: {
    _id: string;
    name: string;
    slug: {
      current: string;
    };
  }[];
  categories?: {
    _id: string;
    title: string;
    slug: {
      current: string;
    };
  }[];
  collections?: {
    _id: string;
    title: string;
    slug: {
      current: string;
    };
  }[];
  ijewel3dCode?: string;
  productVideo?: {
    asset: {
      url: string;
    };
  };
  certificateNumber?: string;
  featured?: boolean;
  new?: boolean;
  variants?: Array<{
    _key: string;
    material?: string;
    size?: string;
    gemstone?: string;
    price?: number;
  }>;
}
