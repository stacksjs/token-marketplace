import type { Model } from '@stacksjs/types'
import { schema } from '@stacksjs/validation'

export default {
  name: 'Auction',
  table: 'auctions',
  primaryKey: 'id',
  autoIncrement: true,
  belongsTo: ['Nft'],
  hasMany: ['Bid'],
  traits: {
    useUuid: true,
    useTimestamps: true,
    useSearch: {
      displayable: ['id', 'nftId', 'mintAddress', 'sellerWalletAddress', 'auctionType', 'startingPrice', 'currentBid', 'status'],
      searchable: ['mintAddress', 'sellerWalletAddress', 'highestBidderWallet', 'settlementSignature', 'status'],
      sortable: ['startingPrice', 'currentBid', 'startsAt', 'endsAt', 'createdAt'],
      filterable: ['status', 'auctionType', 'nftId', 'sellerWalletAddress'],
    },
    useApi: {
      uri: 'auctions',
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

    sellerWalletAddress: {
      order: 3,
      fillable: true,
      validation: {
        rule: schema.string().optional(),
      },
    },

    auctionType: {
      order: 4,
      fillable: true,
      validation: {
        rule: schema.string().optional(),
      },
    },

    startingPrice: {
      order: 5,
      fillable: true,
      validation: {
        rule: schema.number().optional(),
      },
    },

    reservePrice: {
      order: 6,
      fillable: true,
      validation: {
        rule: schema.number().optional(),
      },
    },

    currentBid: {
      order: 7,
      fillable: true,
      validation: {
        rule: schema.number().optional(),
      },
    },

    highestBidderWallet: {
      order: 8,
      fillable: true,
      validation: {
        rule: schema.string().optional(),
      },
    },

    startsAt: {
      order: 9,
      fillable: true,
      validation: {
        rule: schema.string().optional(),
      },
    },

    endsAt: {
      order: 10,
      fillable: true,
      validation: {
        rule: schema.string().optional(),
      },
    },

    status: {
      order: 11,
      fillable: true,
      validation: {
        rule: schema.string().optional(),
      },
    },

    settlementSignature: {
      order: 12,
      fillable: true,
      validation: {
        rule: schema.string().optional(),
      },
    },
  },
} satisfies Model
