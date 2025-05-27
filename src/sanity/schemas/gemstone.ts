export default {
  name: 'gemstone',
  title: 'Gemstone',
  type: 'document',
  fields: [
    {
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'name',
        maxLength: 96,
      },
    },
    {
      name: 'description',
      title: 'Description',
      type: 'text',
    },
    {
      name: 'image',
      title: 'Image',
      type: 'image',
      options: {
        hotspot: true,
      },
    },
    {
      name: 'color',
      title: 'Color',
      type: 'string',
    },
    {
      name: 'clarity',
      title: 'Clarity',
      type: 'string',
      description: 'For diamonds (e.g., IF, VVS1, VS2)',
    },
    {
      name: 'cut',
      title: 'Cut',
      type: 'string',
      description: 'For diamonds (e.g., Excellent, Very Good, Good)',
    },
    {
      name: 'gemstoneType',
      title: 'Gemstone Type',
      type: 'string',
      options: {
        list: [
          { title: 'Diamond', value: 'diamond' },
          { title: 'Ruby', value: 'ruby' },
          { title: 'Sapphire', value: 'sapphire' },
          { title: 'Emerald', value: 'emerald' },
          { title: 'Pearl', value: 'pearl' },
          { title: 'Amethyst', value: 'amethyst' },
          { title: 'Topaz', value: 'topaz' },
          { title: 'Other', value: 'other' },
        ],
      },
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'featured',
      title: 'Featured Gemstone',
      type: 'boolean',
      initialValue: false,
    },
    {
      name: 'birthstone',
      title: 'Birthstone Month',
      type: 'string',
      options: {
        list: [
          { title: 'January', value: 'january' },
          { title: 'February', value: 'february' },
          { title: 'March', value: 'march' },
          { title: 'April', value: 'april' },
          { title: 'May', value: 'may' },
          { title: 'June', value: 'june' },
          { title: 'July', value: 'july' },
          { title: 'August', value: 'august' },
          { title: 'September', value: 'september' },
          { title: 'October', value: 'october' },
          { title: 'November', value: 'november' },
          { title: 'December', value: 'december' },
        ],
      },
    },
  ],
  preview: {
    select: {
      title: 'name',
      media: 'image',
      gemstoneType: 'gemstoneType',
    },
    prepare({ title, media, gemstoneType }: any) {
      return {
        title,
        subtitle: gemstoneType,
        media,
      };
    },
  },
}
