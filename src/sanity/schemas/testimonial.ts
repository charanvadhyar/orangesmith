export default {
  name: 'testimonial',
  title: 'Testimonial',
  type: 'document',
  fields: [
    {
      name: 'name',
      title: 'Customer Name',
      type: 'string',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'location',
      title: 'Customer Location',
      type: 'string',
    },
    {
      name: 'image',
      title: 'Customer Image',
      type: 'image',
      options: {
        hotspot: true,
      },
    },
    {
      name: 'rating',
      title: 'Rating',
      type: 'number',
      options: {
        list: [
          { title: '5 Stars', value: 5 },
          { title: '4 Stars', value: 4 },
          { title: '3 Stars', value: 3 },
          { title: '2 Stars', value: 2 },
          { title: '1 Star', value: 1 },
        ],
      },
      validation: (Rule: any) => Rule.required().min(1).max(5),
    },
    {
      name: 'quote',
      title: 'Testimonial Text',
      type: 'text',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'productReference',
      title: 'Product Referenced',
      type: 'reference',
      to: { type: 'product' },
    },
    {
      name: 'featured',
      title: 'Featured Testimonial',
      type: 'boolean',
      initialValue: false,
    },
    {
      name: 'date',
      title: 'Date',
      type: 'date',
    },
    {
      name: 'order',
      title: 'Display Order',
      type: 'number',
      description: 'Order to display testimonials',
    },
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'quote',
      media: 'image',
      rating: 'rating',
    },
    prepare({ title, subtitle, media, rating }: any) {
      return {
        title: `${title} (${rating} ★)`,
        subtitle: subtitle,
        media,
      };
    },
  },
}
