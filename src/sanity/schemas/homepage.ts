export default {
  name: 'homepage',
  title: 'Homepage',
  type: 'document',
  fields: [
    {
      name: 'hero',
      title: 'Hero Section',
      type: 'object',
      fields: [
        { name: 'title', title: 'Title', type: 'string' },
        { name: 'description', title: 'Description', type: 'text' },
        { name: 'backgroundImage', title: 'Background Image', type: 'image', options: { hotspot: true } },
        { 
          name: 'cta',
          title: 'Call to Action Buttons',
          type: 'array',
          of: [{ 
            type: 'object', 
            fields: [
              { name: 'text', title: 'Button Text', type: 'string' },
              { name: 'link', title: 'Button Link', type: 'string' },
              { name: 'isMain', title: 'Is Main Button', type: 'boolean' }
            ]
          }]
        }
      ]
    },
    {
      name: 'featuredCategories',
      title: 'Featured Categories',
      type: 'object',
      fields: [
        { name: 'title', title: 'Section Title', type: 'string' },
        { name: 'subtitle', title: 'Section Subtitle', type: 'text' },
        { 
          name: 'categories', 
          title: 'Categories', 
          type: 'array', 
          of: [{ type: 'reference', to: { type: 'category' } }] 
        }
      ]
    },
    {
      name: 'featuredCollection',
      title: 'Featured Collection',
      type: 'object',
      fields: [
        { name: 'title', title: 'Section Title', type: 'string' },
        { name: 'subtitle', title: 'Section Subtitle', type: 'text' },
        { name: 'collection', title: 'Collection', type: 'reference', to: { type: 'collection' } },
        { 
          name: 'featuredProducts', 
          title: 'Featured Products', 
          type: 'array', 
          of: [{ type: 'reference', to: { type: 'product' } }] 
        }
      ]
    },
    {
      name: 'testimonials',
      title: 'Testimonials Section',
      type: 'object',
      fields: [
        { name: 'title', title: 'Section Title', type: 'string' },
        { name: 'subtitle', title: 'Section Subtitle', type: 'text' },
        { 
          name: 'testimonialsList', 
          title: 'Testimonials', 
          type: 'array', 
          of: [{ type: 'reference', to: { type: 'testimonial' } }] 
        }
      ]
    },
    {
      name: 'newsletter',
      title: 'Newsletter Section',
      type: 'object',
      fields: [
        { name: 'title', title: 'Section Title', type: 'string' },
        { name: 'description', title: 'Description', type: 'text' },
        { name: 'buttonText', title: 'Button Text', type: 'string' }
      ]
    },
    {
      name: 'values',
      title: 'Values Section',
      type: 'array',
      of: [{ 
        type: 'object', 
        fields: [
          { name: 'title', title: 'Value Title', type: 'string' },
          { name: 'description', title: 'Value Description', type: 'text' },
          { name: 'icon', title: 'Icon', type: 'string', description: 'SVG path or icon name' }
        ]
      }]
    }
  ],
  preview: {
    select: {
      title: 'hero.title',
    },
    prepare({ title }: { title: string }) {
      return {
        title: 'Homepage',
        subtitle: title,
      }
    },
  },
}
