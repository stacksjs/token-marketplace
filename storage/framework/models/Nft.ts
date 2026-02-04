import type { Model } from '@stacksjs/types'
import { schema } from '@stacksjs/validation'

export default {
  name: 'Nft',
  table: 'nfts',
  primaryKey: 'id',
  autoIncrement: true,

  traits: {
    useUuid: true,
    useTimestamps: true,
    useSearch: {
      displayable: ['id', 'name', 'tokenId', 'price', 'isForSale', 'isMinting'],
      searchable: ['name', 'tokenId'],
      sortable: ['name', 'price', 'createdAt', 'updatedAt'],
      filterable: ['isForSale', 'isMinting', 'collectionId'],
    },

    useSeeder: {
      count: 20,
    },

    useApi: {
      uri: 'nfts',
    },

    observe: true,
  },

  belongsTo: ['Collection'],

  attributes: {
    name: {
      order: 1,
      fillable: true,
      validation: {
        rule: schema.string().required().max(100),
        message: {
          required: 'NFT name is required',
          max: 'Name must have a maximum of 100 characters',
        },
      },
      factory: faker => `${faker.word.adjective()} ${faker.word.noun()}`,
    },

    tokenId: {
      order: 2,
      fillable: true,
      validation: {
        rule: schema.string().max(100),
      },
      factory: faker => faker.string.alphanumeric(10),
    },

    description: {
      order: 3,
      fillable: true,
      validation: {
        rule: schema.string().max(1000),
      },
      factory: faker => faker.lorem.sentence(),
    },

    imageUrl: {
      order: 4,
      fillable: true,
      validation: {
        rule: schema.string(),
      },
      factory: faker => faker.image.url(),
    },

    price: {
      order: 5,
      fillable: true,
      validation: {
        rule: schema.number().min(0),
        message: {
          min: 'Price must be at least 0',
        },
      },
      factory: faker => faker.number.float({ min: 0.01, max: 100, fractionDigits: 4 }),
    },

    isForSale: {
      order: 6,
      fillable: true,
      validation: {
        rule: schema.boolean(),
      },
      factory: () => true,
    },

    isMinting: {
      order: 7,
      fillable: true,
      validation: {
        rule: schema.boolean(),
      },
      factory: () => false,
    },

    mintUrl: {
      order: 8,
      fillable: true,
      validation: {
        rule: schema.string(),
      },
      factory: faker => faker.internet.url(),
    },

    rarity: {
      order: 9,
      fillable: true,
      validation: {
        rule: schema.string().max(50),
      },
      factory: faker => faker.helpers.arrayElement(['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary']),
    },

    attributes: {
      order: 10,
      fillable: true,
      validation: {
        rule: schema.string(),
      },
      factory: (faker) => {
        return JSON.stringify({
          background: faker.color.human(),
          body: faker.helpers.arrayElement(['Standard', 'Gold', 'Diamond']),
          accessory: faker.word.noun(),
        })
      },
    },
  },

  dashboard: {
    highlight: true,
  },
} satisfies Model
