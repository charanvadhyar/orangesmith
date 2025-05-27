import {defineField, defineType} from 'sanity'

export const gemstoneType = defineType({
  name: 'gemstone',
  title: 'Gemstone',
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
      name: 'color',
      title: 'Color',
      type: 'string',
    }),
    defineField({
      name: 'clarity',
      title: 'Clarity',
      type: 'string',
      description: 'For diamonds (e.g., IF, VVS1, VS2)',
    }),
    defineField({
      name: 'cut',
      title: 'Cut',
      type: 'string',
      description: 'For diamonds (e.g., Excellent, Very Good, Good)',
    }),
    defineField({
      name: 'gemstoneType',
      title: 'Gemstone Type',
      type: 'string',
      options: {
        list: [
          {title: 'Diamond', value: 'diamond'},
          {title: 'Ruby', value: 'ruby'},
          {title: 'Sapphire', value: 'sapphire'},
          {title: 'Emerald', value: 'emerald'},
          {title: 'Pearl', value: 'pearl'},
          {title: 'Amethyst', value: 'amethyst'},
          {title: 'Topaz', value: 'topaz'},
          {title: 'Other', value: 'other'},
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'featured',
      title: 'Featured Gemstone',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'birthstone',
      title: 'Birthstone Month',
      type: 'string',
      options: {
        list: [
          {title: 'January', value: 'january'},
          {title: 'February', value: 'february'},
          {title: 'March', value: 'march'},
          {title: 'April', value: 'april'},
          {title: 'May', value: 'may'},
          {title: 'June', value: 'june'},
          {title: 'July', value: 'july'},
          {title: 'August', value: 'august'},
          {title: 'September', value: 'september'},
          {title: 'October', value: 'october'},
          {title: 'November', value: 'november'},
          {title: 'December', value: 'december'},
        ],
      },
    }),
  ],
  preview: {
    select: {
      title: 'name',
      media: 'image',
      gemstoneType: 'gemstoneType',
    },
    prepare({title, media, gemstoneType}) {
      return {
        title,
        subtitle: gemstoneType,
        media,
      }
    },
  },
})
