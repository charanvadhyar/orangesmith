import { type SchemaTypeDefinition } from 'sanity'

// Default blog schemas
import {blockContentType} from './blockContentType'
import {categoryType} from './categoryType'
import {postType} from './postType'
import {authorType} from './authorType'

// Custom jewelry e-commerce schemas
import {productType} from './productType'
import {jewelryCategoryType} from './jewelryCategoryType'
import {collectionType} from './collectionType'
import {testimonialType} from './testimonialType'
import {homepageType} from './homepageType'
import {materialType} from './materialType'
import {gemstoneType} from './gemstoneType'
import {navigationType} from './navigationType'

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [
    // Blog schemas
    blockContentType, 
    categoryType, 
    postType, 
    authorType,
    
    // E-commerce schemas
    productType,
    jewelryCategoryType,
    collectionType,
    testimonialType,
    homepageType,
    materialType,
    gemstoneType,
    navigationType
  ],
}
