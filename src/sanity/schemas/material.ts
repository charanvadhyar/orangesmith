export default {
  name: 'material',
  title: 'Material',
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
      name: 'materialType',
      title: 'Material Type',
      type: 'string',
      options: {
        list: [
          { title: 'Gold', value: 'gold' },
          { title: 'Silver', value: 'silver' },
          { title: 'Platinum', value: 'platinum' },
          { title: 'Rose Gold', value: 'rose-gold' },
          { title: 'White Gold', value: 'white-gold' },
          { title: 'Other', value: 'other' },
        ],
      },
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'karat',
      title: 'Karat',
      type: 'string',
      description: 'For gold materials (e.g., 14K, 18K, 24K)',
    },
    {
      name: 'purity',
      title: 'Purity',
      type: 'string',
      description: 'For silver and other materials (e.g., 925 Sterling)',
    },
    {
      name: 'featured',
      title: 'Featured Material',
      type: 'boolean',
      initialValue: false,
    },
  ],
  preview: {
    select: {
      title: 'name',
      media: 'image',
      materialType: 'materialType',
    },
    prepare({ title, media, materialType }: any) {
      return {
        title,
        subtitle: materialType,
        media,
      };
    },
  },
}
