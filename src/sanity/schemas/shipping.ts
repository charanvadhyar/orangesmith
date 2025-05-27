export default {
  name: 'shipping',
  title: 'Shipping Options',
  type: 'document',
  fields: [
    {
      name: 'name',
      title: 'Shipping Method Name',
      type: 'string',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'description',
      title: 'Description',
      type: 'text',
      description: 'Details about delivery timeframe and handling',
    },
    {
      name: 'price',
      title: 'Price',
      type: 'number',
      validation: (Rule: any) => Rule.required().min(0),
    },
    {
      name: 'estimatedDeliveryDays',
      title: 'Estimated Delivery Days',
      type: 'object',
      fields: [
        { name: 'min', title: 'Minimum Days', type: 'number' },
        { name: 'max', title: 'Maximum Days', type: 'number' },
      ],
    },
    {
      name: 'type',
      title: 'Shipping Type',
      type: 'string',
      options: {
        list: [
          { title: 'Standard Shipping', value: 'standard' },
          { title: 'Express Shipping', value: 'express' },
          { title: 'Overnight Shipping', value: 'overnight' },
          { title: 'Free Shipping', value: 'free' },
          { title: 'International Shipping', value: 'international' },
          { title: 'Store Pickup', value: 'pickup' },
          { title: 'Special Handling', value: 'special' },
        ],
      },
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'isDefault',
      title: 'Default Option',
      type: 'boolean',
      description: 'Set as default shipping option',
      initialValue: false,
    },
    {
      name: 'isActive',
      title: 'Active',
      type: 'boolean',
      initialValue: true,
    },
    {
      name: 'freeShippingThreshold',
      title: 'Free Shipping Threshold',
      type: 'number',
      description: 'Order amount above which this shipping method becomes free (0 for always charged)',
    },
    {
      name: 'availableCountries',
      title: 'Available Countries',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'Leave empty if available worldwide',
    },
    {
      name: 'excludedCountries',
      title: 'Excluded Countries',
      type: 'array',
      of: [{ type: 'string' }],
    },
    {
      name: 'requiresSignature',
      title: 'Requires Signature',
      type: 'boolean',
      initialValue: true,
      description: 'Whether this shipping method requires signature on delivery',
    },
    {
      name: 'trackingProvided',
      title: 'Tracking Provided',
      type: 'boolean',
      initialValue: true,
    },
    {
      name: 'insuranceIncluded',
      title: 'Insurance Included',
      type: 'boolean',
      initialValue: true,
      description: 'Whether this shipping method includes insurance',
    },
    {
      name: 'order',
      title: 'Display Order',
      type: 'number',
      description: 'Order to display shipping options in checkout',
    },
  ],
  preview: {
    select: {
      title: 'name',
      price: 'price',
      type: 'type',
    },
    prepare({ title, price, type }: any) {
      return {
        title,
        subtitle: `${type} - $${price}`,
      };
    },
  },
}
