import type { Model } from '@stacksjs/types'
import { schema } from '@stacksjs/validation'

export default {
  name: 'PlatformFee',
  table: 'platform_fees',
  primaryKey: 'id',
  autoIncrement: true,
  traits: {
    useTimestamps: {
      createdAt: true,
      updatedAt: false,
    },
    useSearch: {
      displayable: ['id', 'transactionType', 'nftId', 'mintAddress', 'saleAmount', 'feeAmount', 'feeBasisPoints', 'platformWallet'],
      searchable: ['transactionType', 'transactionSignature', 'mintAddress', 'platformWallet', 'sellerWallet', 'buyerWallet'],
      sortable: ['saleAmount', 'feeAmount', 'createdAt'],
      filterable: ['transactionType', 'platformWallet', 'nftId'],
    },
    useApi: {
      uri: 'platform-fees',
    },
  },

  attributes: {
    transactionType: {
      order: 1,
      fillable: true,
      validation: {
        rule: schema.string().required(),
        message: {
          required: 'Transaction type is required',
        },
      },
    },

    transactionSignature: {
      order: 2,
      fillable: true,
      validation: {
        rule: schema.string().optional(),
      },
    },

    nftId: {
      order: 3,
      fillable: true,
      validation: {
        rule: schema.number().optional(),
      },
    },

    mintAddress: {
      order: 4,
      fillable: true,
      validation: {
        rule: schema.string().optional(),
      },
    },

    saleAmount: {
      order: 5,
      fillable: true,
      validation: {
        rule: schema.number().required(),
        message: {
          required: 'Sale amount is required',
        },
      },
    },

    feeAmount: {
      order: 6,
      fillable: true,
      validation: {
        rule: schema.number().required(),
        message: {
          required: 'Fee amount is required',
        },
      },
    },

    feeBasisPoints: {
      order: 7,
      fillable: true,
      validation: {
        rule: schema.number().optional(),
      },
    },

    platformWallet: {
      order: 8,
      fillable: true,
      validation: {
        rule: schema.string().required(),
        message: {
          required: 'Platform wallet is required',
        },
      },
    },

    sellerWallet: {
      order: 9,
      fillable: true,
      validation: {
        rule: schema.string().optional(),
      },
    },

    buyerWallet: {
      order: 10,
      fillable: true,
      validation: {
        rule: schema.string().optional(),
      },
    },
  },
} satisfies Model
