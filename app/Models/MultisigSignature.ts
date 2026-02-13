import type { Model } from '@stacksjs/types'
import { schema } from '@stacksjs/validation'

export default {
  name: 'MultisigSignature',
  table: 'multisig_signatures',
  primaryKey: 'id',
  autoIncrement: true,
  belongsTo: ['MultisigTransaction'],
  traits: {
    useTimestamps: {
      createdAt: true,
      updatedAt: false,
    },
    useApi: {
      uri: 'multisig-signatures',
    },
  },

  attributes: {
    multisigTransactionId: {
      order: 1,
      fillable: true,
      validation: {
        rule: schema.number().required(),
        message: {
          required: 'Multisig transaction ID is required',
        },
      },
    },

    signerWallet: {
      order: 2,
      fillable: true,
      validation: {
        rule: schema.string().required(),
        message: {
          required: 'Signer wallet is required',
        },
      },
    },

    signature: {
      order: 3,
      fillable: true,
      validation: {
        rule: schema.string().required(),
        message: {
          required: 'Signature is required',
        },
      },
    },

    signedAt: {
      order: 4,
      fillable: true,
      validation: {
        rule: schema.string().required(),
        message: {
          required: 'Signed at timestamp is required',
        },
      },
    },
  },
} satisfies Model
