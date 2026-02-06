import type { Model } from '@stacksjs/types'
import { schema } from '@stacksjs/validation'

export default {
  name: 'Presale',
  table: 'presales',
  primaryKey: 'id',
  autoIncrement: true,
  belongsTo: ['Collection'],
  hasMany: ['MintTransaction'],
  traits: {
    useUuid: true,
    useTimestamps: true,
    useSearch: {
      displayable: ['id', 'discount', 'maxMintsPerWallet', 'isActive', 'presaleStartsAt', 'presaleExpiresAt'],
      searchable: ['merkleRoot'],
      sortable: ['createdAt', 'presaleStartsAt', 'presaleExpiresAt'],
      filterable: ['isActive', 'collectionId'],
    },

    useApi: {
      uri: 'presales',
    },
  },

  attributes: {
    collectionId: {
      order: 1,
      fillable: true,
      validation: {
        rule: schema.number().required(),
      },
    },

    walletAddresses: {
      order: 2,
      fillable: true,
      validation: {
        rule: schema.string().optional(),
      },
    },

    merkleRoot: {
      order: 3,
      fillable: true,
      validation: {
        rule: schema.string().optional(),
      },
    },

    discount: {
      order: 4,
      fillable: true,
      validation: {
        rule: schema.number().optional().min(0).max(10000),
        message: {
          min: 'Discount cannot be negative',
          max: 'Discount cannot exceed 100% (10000 basis points)',
        },
      },
      factory: faker => faker.number.int({ min: 500, max: 3000 }), // 5-30% discount
    },

    maxMintsPerWallet: {
      order: 5,
      fillable: true,
      validation: {
        rule: schema.number().optional().min(1),
        message: {
          min: 'Max mints per wallet must be at least 1',
        },
      },
      factory: faker => faker.number.int({ min: 1, max: 5 }),
    },

    presaleStartsAt: {
      order: 6,
      fillable: true,
      validation: {
        rule: schema.string().optional(),
      },
    },

    presaleExpiresAt: {
      order: 7,
      fillable: true,
      validation: {
        rule: schema.string().optional(),
      },
    },

    isActive: {
      order: 8,
      fillable: true,
      validation: {
        rule: schema.boolean().optional(),
      },
      factory: faker => faker.datatype.boolean(),
    },
  },

  dashboard: {
    highlight: false,
  },
} satisfies Model
