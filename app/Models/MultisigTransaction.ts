import type { Model } from '@stacksjs/types'
import { schema } from '@stacksjs/validation'

export default {
  name: 'MultisigTransaction',
  table: 'multisig_transactions',
  primaryKey: 'id',
  autoIncrement: true,
  belongsTo: ['MultisigAccount'],
  hasMany: ['MultisigSignature'],
  traits: {
    useUuid: true,
    useTimestamps: true,
    useSearch: {
      displayable: ['id', 'multisigAccountId', 'transactionType', 'proposerWallet', 'status', 'requiredSignatures', 'collectedSignatures'],
      searchable: ['transactionType', 'proposerWallet', 'executedSignature', 'status'],
      sortable: ['createdAt', 'expiresAt', 'collectedSignatures'],
      filterable: ['status', 'transactionType', 'multisigAccountId', 'proposerWallet'],
    },
    useApi: {
      uri: 'multisig-transactions',
    },
  },

  attributes: {
    multisigAccountId: {
      order: 1,
      fillable: true,
      validation: {
        rule: schema.number().required(),
        message: {
          required: 'Multisig account ID is required',
        },
      },
    },

    transactionType: {
      order: 2,
      fillable: true,
      validation: {
        rule: schema.string().required(),
        message: {
          required: 'Transaction type is required',
        },
      },
    },

    description: {
      order: 3,
      fillable: true,
      validation: {
        rule: schema.string().optional(),
      },
    },

    proposerWallet: {
      order: 4,
      fillable: true,
      validation: {
        rule: schema.string().required(),
        message: {
          required: 'Proposer wallet is required',
        },
      },
    },

    status: {
      order: 5,
      fillable: true,
      validation: {
        rule: schema.string().optional(),
      },
    },

    requiredSignatures: {
      order: 6,
      fillable: true,
      validation: {
        rule: schema.number().required(),
        message: {
          required: 'Required signatures count is required',
        },
      },
    },

    collectedSignatures: {
      order: 7,
      fillable: true,
      validation: {
        rule: schema.number().optional(),
      },
    },

    transactionData: {
      order: 8,
      fillable: true,
      validation: {
        rule: schema.string().optional(),
      },
    },

    expiresAt: {
      order: 9,
      fillable: true,
      validation: {
        rule: schema.string().optional(),
      },
    },

    executedSignature: {
      order: 10,
      fillable: true,
      validation: {
        rule: schema.string().optional(),
      },
    },
  },
} satisfies Model
