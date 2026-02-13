import type { Model } from '@stacksjs/types'
import { schema } from '@stacksjs/validation'

export default {
  name: 'Offer',
  table: 'offers',
  primaryKey: 'id',
  autoIncrement: true,
  belongsTo: ['Nft'],
  traits: {
    useUuid: true,
    useTimestamps: true,
    useSearch: {
      displayable: ['id', 'nftId', 'mintAddress', 'buyerWalletAddress', 'amount', 'currency', 'status', 'expiryAt'],
      searchable: ['mintAddress', 'buyerWalletAddress', 'transactionSignature', 'status'],
      sortable: ['amount', 'createdAt', 'expiryAt'],
      filterable: ['status', 'currency', 'nftId', 'buyerWalletAddress'],
    },
    useApi: {
      uri: 'offers',
    },
  },

  attributes: {
    nftId: {
      order: 1,
      fillable: true,
      validation: {
        rule: schema.number().optional(),
      },
    },

    mintAddress: {
      order: 2,
      fillable: true,
      validation: {
        rule: schema.string().optional(),
      },
    },

    buyerWalletAddress: {
      order: 3,
      fillable: true,
      validation: {
        rule: schema.string().optional(),
      },
    },

    amount: {
      order: 4,
      fillable: true,
      validation: {
        rule: schema.number().optional(),
      },
    },

    currency: {
      order: 5,
      fillable: true,
      validation: {
        rule: schema.string().optional(),
      },
    },

    status: {
      order: 6,
      fillable: true,
      validation: {
        rule: schema.string().optional(),
      },
    },

    expiryAt: {
      order: 7,
      fillable: true,
      validation: {
        rule: schema.string().optional(),
      },
    },

    transactionSignature: {
      order: 8,
      fillable: true,
      validation: {
        rule: schema.string().optional(),
      },
    },
  },
} satisfies Model
