import type { Model } from '@stacksjs/types'
import { schema } from '@stacksjs/validation'

export default {
  name: 'CandyMachine',
  table: 'candy_machines',
  primaryKey: 'id',
  autoIncrement: true,
  belongsTo: ['Collection'],
  hasMany: ['MintTransaction'],
  traits: {
    useUuid: true,
    useTimestamps: true,
    useSearch: {
      displayable: ['id', 'candyMachineAddress', 'status', 'itemsAvailable', 'itemsRedeemed', 'mintPrice'],
      searchable: ['candyMachineAddress', 'symbol', 'creatorAddress'],
      sortable: ['createdAt', 'itemsRedeemed', 'mintPrice'],
      filterable: ['status', 'version', 'collectionId'],
    },

    useApi: {
      uri: 'candy-machines',
    },
  },

  attributes: {
    collectionId: {
      order: 1,
      fillable: true,
      validation: {
        rule: schema.number().optional(),
      },
    },

    candyMachineAddress: {
      order: 2,
      unique: true,
      fillable: true,
      validation: {
        rule: schema.string().optional(),
      },
    },

    version: {
      order: 3,
      fillable: true,
      validation: {
        rule: schema.enum(['v2', 'v3']).optional(),
      },
      factory: () => 'v3',
    },

    status: {
      order: 4,
      fillable: true,
      validation: {
        rule: schema.enum(['not_started', 'deploying', 'ready', 'minting', 'sold_out', 'paused', 'failed']).optional(),
      },
      factory: () => 'not_started',
    },

    message: {
      order: 5,
      fillable: true,
      validation: {
        rule: schema.string().optional(),
      },
    },

    statusChangedAt: {
      order: 6,
      fillable: true,
      validation: {
        rule: schema.string().optional(),
      },
    },

    itemsAvailable: {
      order: 7,
      fillable: true,
      validation: {
        rule: schema.number().optional().min(0),
      },
      factory: faker => faker.number.int({ min: 100, max: 10000 }),
    },

    itemsRedeemed: {
      order: 8,
      fillable: true,
      validation: {
        rule: schema.number().optional().min(0),
      },
      factory: () => 0,
    },

    mintPrice: {
      order: 9,
      fillable: true,
      validation: {
        rule: schema.number().optional().min(0),
        message: {
          min: 'Mint price cannot be negative',
        },
      },
      factory: faker => faker.number.int({ min: 1000000, max: 5000000000 }), // lamports
    },

    sellerFeeBasisPoints: {
      order: 10,
      fillable: true,
      validation: {
        rule: schema.number().optional().min(0).max(10000),
        message: {
          max: 'Seller fee cannot exceed 100% (10000 basis points)',
        },
      },
      factory: () => 500, // 5%
    },

    symbol: {
      order: 11,
      fillable: true,
      validation: {
        rule: schema.string().optional().max(10),
      },
      factory: faker => faker.string.alpha({ length: { min: 2, max: 5 } }).toUpperCase(),
    },

    isMutable: {
      order: 12,
      fillable: true,
      validation: {
        rule: schema.boolean().optional(),
      },
      factory: () => true,
    },

    configLineSettings: {
      order: 13,
      fillable: true,
      validation: {
        rule: schema.string().optional(),
      },
    },

    guardsConfig: {
      order: 14,
      fillable: true,
      validation: {
        rule: schema.string().optional(),
      },
    },

    creatorAddress: {
      order: 15,
      fillable: true,
      validation: {
        rule: schema.string().optional(),
      },
    },

    treasuryAddress: {
      order: 16,
      fillable: true,
      validation: {
        rule: schema.string().optional(),
      },
    },
  },

  dashboard: {
    highlight: true,
  },
} satisfies Model
