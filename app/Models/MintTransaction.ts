import type { Model } from '@stacksjs/types'
import { schema } from '@stacksjs/validation'

export default {
  name: 'MintTransaction',
  table: 'mint_transactions',
  primaryKey: 'id',
  autoIncrement: true,
  belongsTo: ['CandyMachine', 'Nft', 'Presale'],
  traits: {
    useUuid: true,
    useTimestamps: true,
    useSearch: {
      displayable: ['id', 'walletAddress', 'transactionSignature', 'status', 'mintAddress', 'amountPaid'],
      searchable: ['walletAddress', 'transactionSignature', 'mintAddress'],
      sortable: ['createdAt', 'amountPaid'],
      filterable: ['status', 'candyMachineId', 'presaleId'],
    },

    useApi: {
      uri: 'mint-transactions',
    },
  },

  attributes: {
    candyMachineId: {
      order: 1,
      fillable: true,
      validation: {
        rule: schema.number().optional(),
      },
    },

    nftId: {
      order: 2,
      fillable: true,
      validation: {
        rule: schema.number().optional(),
      },
    },

    walletAddress: {
      order: 3,
      fillable: true,
      validation: {
        rule: schema.string().required(),
        message: {
          required: 'Wallet address is required',
        },
      },
    },

    transactionSignature: {
      order: 4,
      unique: true,
      fillable: true,
      validation: {
        rule: schema.string().optional(),
      },
    },

    status: {
      order: 5,
      fillable: true,
      validation: {
        rule: schema.enum(['pending', 'processing', 'confirmed', 'failed']).optional(),
      },
      factory: () => 'pending',
    },

    mintAddress: {
      order: 6,
      fillable: true,
      validation: {
        rule: schema.string().optional(),
      },
    },

    errorMessage: {
      order: 7,
      fillable: true,
      validation: {
        rule: schema.string().optional(),
      },
    },

    amountPaid: {
      order: 8,
      fillable: true,
      validation: {
        rule: schema.number().optional().min(0),
      },
      factory: faker => faker.number.int({ min: 1000000, max: 5000000000 }), // lamports
    },

    presaleId: {
      order: 9,
      fillable: true,
      validation: {
        rule: schema.number().optional(),
      },
    },
  },

  dashboard: {
    highlight: false,
  },
} satisfies Model
