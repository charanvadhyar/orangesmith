import {defineField, defineType} from 'sanity'

export const materialType = defineType({
  name: 'material',
  title: 'Material',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'name',
        maxLength: 96,
      },
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
    }),
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'materialType',
      title: 'Material Type',
      type: 'string',
      options: {
        list: [
          {title: 'Gold', value: 'gold'},
          {title: 'Silver', value: 'silver'},
          {title: 'Platinum', value: 'platinum'},
          {title: 'Rose Gold', value: 'rose-gold'},
          {title: 'White Gold', value: 'white-gold'},
          {title: 'Other', value: 'other'},
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'karat',
      title: 'Karat',
      type: 'string',
      description: 'For gold materials (e.g., 14K, 18K, 24K)',
    }),
    defineField({
      name: 'purity',
      title: 'Purity',
      type: 'string',
      description: 'For silver and other materials (e.g., 925 Sterling)',
    }),
    defineField({
      name: 'featured',
      title: 'Featured Material',
      type: 'boolean',
      initialValue: false,
    }),
  ],
  preview: {
    select: {
      title: 'name',
      media: 'image',
      materialType: 'materialType',
    },
    prepare({title, media, materialType}) {
      return {
        title,
        subtitle: materialType,
        media,
      }
    },
  },
})
