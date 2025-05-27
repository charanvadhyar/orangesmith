export default {
  name: 'coupon',
  title: 'Coupon',
  type: 'document',
  fields: [
    {
      name: 'code',
      title: 'Coupon Code',
      type: 'string',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'description',
      title: 'Description',
      type: 'text',
    },
    {
      name: 'discountType',
      title: 'Discount Type',
      type: 'string',
      options: {
        list: [
          { title: 'Percentage', value: 'percentage' },
          { title: 'Fixed Amount', value: 'fixed' }
        ],
        layout: 'radio',
      },
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'discountValue',
      title: 'Discount Value',
      type: 'number',
      validation: (Rule: any) => Rule.required().positive(),
    },
    {
      name: 'minimumPurchase',
      title: 'Minimum Purchase Amount',
      type: 'number',
      description: 'Minimum order total required to use this coupon',
    },
    {
      name: 'startDate',
      title: 'Start Date',
      type: 'datetime',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'endDate',
      title: 'End Date',
      type: 'datetime',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'isActive',
      title: 'Active',
      type: 'boolean',
      initialValue: true,
    },
    {
      name: 'usageLimit',
      title: 'Usage Limit',
      type: 'number',
      description: 'Maximum number of times this coupon can be used',
    },
    {
      name: 'perCustomerUsageLimit',
      title: 'Per Customer Usage Limit',
      type: 'number',
      description: 'Maximum number of times a customer can use this coupon',
    },
    {
      name: 'applicableCategories',
      title: 'Applicable Categories',
      type: 'array',
      of: [{ type: 'reference', to: { type: 'category' } }],
      description: 'Leave empty to apply to all categories',
    },
    {
      name: 'applicableCollections',
      title: 'Applicable Collections',
      type: 'array',
      of: [{ type: 'reference', to: { type: 'collection' } }],
      description: 'Leave empty to apply to all collections',
    },
  ],
  preview: {
    select: {
      title: 'code',
      subtitle: 'discountType',
      discountValue: 'discountValue',
    },
    prepare({ title, subtitle, discountValue }: any) {
      const discount = subtitle === 'percentage' ? `${discountValue}%` : `$${discountValue}`;
      return {
        title,
        subtitle: `${subtitle === 'percentage' ? 'Percentage' : 'Fixed'} - ${discount}`,
      };
    },
  },
}
