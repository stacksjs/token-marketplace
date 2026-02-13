import type { Model } from '@stacksjs/types'
import { schema } from '@stacksjs/validation'

export default {
  name: 'Bid',
  table: 'bids',
  primaryKey: 'id',
  autoIncrement: true,
  belongsTo: ['Auction'],
  traits: {
    useUuid: true,
    useTimestamps: true,
    useSearch: {
      displayable: ['id', 'auctionId', 'bidderWalletAddress', 'amount', 'status'],
      searchable: ['bidderWalletAddress', 'transactionSignature', 'status'],
      sortable: ['amount', 'createdAt'],
      filterable: ['status', 'auctionId', 'bidderWalletAddress'],
    },
    useApi: {
      uri: 'bids',
    },
  },

  attributes: {
    auctionId: {
      order: 1,
      fillable: true,
      validation: {
        rule: schema.number().optional(),
      },
    },

    bidderWalletAddress: {
      order: 2,
      fillable: true,
      validation: {
        rule: schema.string().optional(),
      },
    },

    amount: {
      order: 3,
      fillable: true,
      validation: {
        rule: schema.number().optional(),
      },
    },

    transactionSignature: {
      order: 4,
      fillable: true,
      validation: {
        rule: schema.string().optional(),
      },
    },

    status: {
      order: 5,
      fillable: true,
      validation: {
        rule: schema.string().optional(),
      },
    },
  },
} satisfies Model
