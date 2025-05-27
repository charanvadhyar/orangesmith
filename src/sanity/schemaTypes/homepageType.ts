import {defineField, defineType} from 'sanity'

export const homepageType = defineType({
  name: 'homepage',
  title: 'Homepage',
  type: 'document',
  fields: [
    defineField({
      name: 'announcementBar',
      title: 'Announcement Bar',
      type: 'object',
      fields: [
        {name: 'enabled', title: 'Enable Announcement Bar', type: 'boolean', initialValue: true},
        {name: 'text', title: 'Announcement Text', type: 'string'},
        {name: 'link', title: 'Announcement Link', type: 'string'},
        {name: 'backgroundColor', title: 'Background Color', type: 'string', description: 'HEX color code (e.g., #000000)', initialValue: '#1a1a1a'},
        {name: 'textColor', title: 'Text Color', type: 'string', description: 'HEX color code (e.g., #ffffff)', initialValue: '#ffffff'},
      ],
    }),
    defineField({
      name: 'hero',
      title: 'Hero Section',
      type: 'object',
      fields: [
        {name: 'title', title: 'Title', type: 'string'},
        {name: 'description', title: 'Description', type: 'text'},
        {name: 'backgroundImage', title: 'Background Image', type: 'image', options: {hotspot: true}},
        {
          name: 'cta',
          title: 'Call to Action Buttons',
          type: 'array',
          of: [
            {
              type: 'object',
              fields: [
                {name: 'text', title: 'Button Text', type: 'string'},
                {name: 'link', title: 'Button Link', type: 'string'},
                {name: 'isMain', title: 'Is Main Button', type: 'boolean'},
              ],
            },
          ],
        },
      ],
    }),
    defineField({
      name: 'featuredCategories',
      title: 'Featured Categories',
      type: 'object',
      fields: [
        {name: 'title', title: 'Section Title', type: 'string'},
        {name: 'subtitle', title: 'Section Subtitle', type: 'text'},
        {
          name: 'categories',
          title: 'Categories',
          type: 'array',
          of: [{type: 'reference', to: {type: 'jewelryCategory'}}],
        },
      ],
    }),
    defineField({
      name: 'featuredCollection',
      title: 'Featured Collection',
      type: 'object',
      fields: [
        {name: 'title', title: 'Section Title', type: 'string'},
        {name: 'subtitle', title: 'Section Subtitle', type: 'text'},
        {name: 'collection', title: 'Collection', type: 'reference', to: {type: 'collection'}},
        {
          name: 'featuredProducts',
          title: 'Featured Products',
          type: 'array',
          of: [{type: 'reference', to: {type: 'product'}}],
        },
      ],
    }),
    defineField({
      name: 'testimonials',
      title: 'Testimonials Section',
      type: 'object',
      fields: [
        {name: 'title', title: 'Section Title', type: 'string'},
        {name: 'subtitle', title: 'Section Subtitle', type: 'text'},
        {
          name: 'testimonialsList',
          title: 'Testimonials',
          type: 'array',
          of: [{type: 'reference', to: {type: 'testimonial'}}],
        },
      ],
    }),
    defineField({
      name: 'newsletter',
      title: 'Newsletter Section',
      type: 'object',
      fields: [
        {name: 'title', title: 'Section Title', type: 'string'},
        {name: 'description', title: 'Description', type: 'text'},
        {name: 'buttonText', title: 'Button Text', type: 'string'},
      ],
    }),
    defineField({
      name: 'values',
      title: 'Values Section',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {name: 'title', title: 'Value Title', type: 'string'},
            {name: 'description', title: 'Value Description', type: 'text'},
            {name: 'icon', title: 'Icon', type: 'string', description: 'SVG path or icon name'},
          ],
        },
      ],
    }),
  ],
  preview: {
    prepare() {
      return {
        title: 'Homepage',
      }
    },
  },
})
