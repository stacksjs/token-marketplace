import type { Model } from '@stacksjs/types'
import { schema } from '@stacksjs/validation'

export default {
  name: 'Nft',
  table: 'nfts',
  primaryKey: 'id',
  autoIncrement: true,
  belongsTo: ['Collection'],
  traits: {
    useUuid: true,
    useTimestamps: true,
    useSearch: {
      displayable: ['id', 'name', 'tokenId', 'description', 'price', 'isForSale', 'isMinting', 'rarity'],
      searchable: ['name', 'tokenId', 'description', 'rarity'],
      sortable: ['name', 'price', 'createdAt'],
      filterable: ['isForSale', 'isMinting', 'rarity', 'collectionId'],
    },

    useSeeder: {
      count: 10,
    },

    useApi: {
      uri: 'nfts',
    },
  },

  attributes: {
    collectionId: {
      order: 1,
      fillable: true,
      validation: {
        rule: schema.number().optional(),
      },
      factory: () => 1,
    },

    name: {
      order: 2,
      fillable: true,
      validation: {
        rule: schema.string().required().max(255),
        message: {
          max: 'NFT name must have a maximum of 255 characters',
        },
      },
      factory: faker => `${faker.word.adjective()} ${faker.word.noun()} #${faker.number.int({ min: 1, max: 9999 })}`,
    },

    tokenId: {
      order: 3,
      fillable: true,
      validation: {
        rule: schema.string().optional(),
      },
      factory: faker => faker.number.int({ min: 1, max: 9999 }).toString(),
    },

    description: {
      order: 4,
      fillable: true,
      validation: {
        rule: schema.string().optional(),
      },
      factory: faker => faker.lorem.sentence(),
    },

    imageUrl: {
      order: 5,
      fillable: true,
      validation: {
        rule: schema.string().optional(),
      },
      factory: faker => faker.image.url(),
    },

    price: {
      order: 6,
      fillable: true,
      validation: {
        rule: schema.number().optional().min(0),
        message: {
          min: 'Price cannot be negative',
        },
      },
      factory: faker => faker.number.float({ min: 0.01, max: 100, fractionDigits: 2 }),
    },

    isForSale: {
      order: 7,
      fillable: true,
      validation: {
        rule: schema.boolean().optional(),
      },
      factory: faker => faker.datatype.boolean(),
    },

    isMinting: {
      order: 8,
      fillable: true,
      validation: {
        rule: schema.boolean().optional(),
      },
      factory: faker => faker.datatype.boolean(),
    },

    mintUrl: {
      order: 9,
      fillable: true,
      validation: {
        rule: schema.string().optional(),
      },
      factory: faker => faker.internet.url(),
    },

    rarity: {
      order: 10,
      fillable: true,
      validation: {
        rule: schema.enum(['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary']).optional(),
      },
      factory: faker => faker.helpers.arrayElement(['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary']),
    },

    attributes: {
      order: 11,
      fillable: true,
      validation: {
        rule: schema.string().optional(),
      },
      factory: faker => JSON.stringify({ trait: faker.word.adjective(), value: faker.word.noun() }),
    },
  },

  dashboard: {
    highlight: true,
  },
} satisfies Model
