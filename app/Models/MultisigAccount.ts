import type { Model } from '@stacksjs/types'
import { schema } from '@stacksjs/validation'

export default {
  name: 'MultisigAccount',
  table: 'multisig_accounts',
  primaryKey: 'id',
  autoIncrement: true,
  hasMany: ['MultisigTransaction'],
  traits: {
    useUuid: true,
    useTimestamps: true,
    useSearch: {
      displayable: ['id', 'address', 'name', 'threshold', 'totalSigners', 'authorityType', 'status'],
      searchable: ['address', 'name', 'creatorWallet', 'targetMint', 'status'],
      sortable: ['name', 'createdAt', 'threshold'],
      filterable: ['status', 'authorityType', 'creatorWallet'],
    },
    useApi: {
      uri: 'multisig-accounts',
    },
  },

  attributes: {
    address: {
      order: 1,
      fillable: true,
      validation: {
        rule: schema.string().optional(),
      },
    },

    name: {
      order: 2,
      fillable: true,
      validation: {
        rule: schema.string().required(),
        message: {
          required: 'Name is required',
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

    threshold: {
      order: 4,
      fillable: true,
      validation: {
        rule: schema.number().required(),
        message: {
          required: 'Threshold is required',
        },
      },
    },

    totalSigners: {
      order: 5,
      fillable: true,
      validation: {
        rule: schema.number().required(),
        message: {
          required: 'Total signers is required',
        },
      },
    },

    signers: {
      order: 6,
      fillable: true,
      validation: {
        rule: schema.string().required(),
        message: {
          required: 'Signers is required',
        },
      },
    },

    authorityType: {
      order: 7,
      fillable: true,
      validation: {
        rule: schema.string().optional(),
      },
    },

    targetMint: {
      order: 8,
      fillable: true,
      validation: {
        rule: schema.string().optional(),
      },
    },

    creatorWallet: {
      order: 9,
      fillable: true,
      validation: {
        rule: schema.string().required(),
        message: {
          required: 'Creator wallet is required',
        },
      },
    },

    status: {
      order: 10,
      fillable: true,
      validation: {
        rule: schema.string().optional(),
      },
    },
  },
} satisfies Model
