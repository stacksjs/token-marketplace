import type { Model } from '@stacksjs/types'
import { schema } from '@stacksjs/validation'

export default {
  name: 'Collection',
  table: 'collections',
  primaryKey: 'id',
  autoIncrement: true,

  traits: {
    useUuid: true,
    useTimestamps: true,
    useSearch: {
      displayable: ['id', 'name', 'slug', 'description', 'isLive', 'isFeatured', 'isMinting'],
      searchable: ['name', 'slug', 'description'],
      sortable: ['name', 'createdAt', 'updatedAt'],
      filterable: ['isLive', 'isFeatured', 'isMinting'],
    },

    useSeeder: {
      count: 10,
    },

    useApi: {
      uri: 'collections',
    },

    observe: true,
  },

  hasMany: ['Nft'],

  attributes: {
    name: {
      order: 1,
      fillable: true,
      validation: {
        rule: schema.string().required().max(100),
        message: {
          required: 'Collection name is required',
          max: 'Name must have a maximum of 100 characters',
        },
      },
      factory: faker => faker.company.name(),
    },

    slug: {
      order: 2,
      unique: true,
      fillable: true,
      validation: {
        rule: schema.string().required().max(100),
        message: {
          required: 'Slug is required',
          max: 'Slug must have a maximum of 100 characters',
        },
      },
      factory: faker => faker.helpers.slugify(faker.company.name().toLowerCase()),
    },

    description: {
      order: 3,
      fillable: true,
      validation: {
        rule: schema.string().max(500),
        message: {
          max: 'Description must have a maximum of 500 characters',
        },
      },
      factory: faker => faker.lorem.paragraph(),
    },

    imageUrl: {
      order: 4,
      fillable: true,
      validation: {
        rule: schema.string(),
      },
      factory: faker => faker.image.url(),
    },

    heroImageUrl: {
      order: 5,
      fillable: true,
      validation: {
        rule: schema.string(),
      },
      factory: faker => faker.image.url(),
    },

    isLive: {
      order: 6,
      fillable: true,
      validation: {
        rule: schema.boolean(),
      },
      factory: () => false,
    },

    isFeatured: {
      order: 7,
      fillable: true,
      validation: {
        rule: schema.boolean(),
      },
      factory: () => false,
    },

    isMinting: {
      order: 8,
      fillable: true,
      validation: {
        rule: schema.boolean(),
      },
      factory: () => false,
    },

    website: {
      order: 9,
      fillable: true,
      validation: {
        rule: schema.string(),
      },
      factory: faker => faker.internet.url(),
    },
  },

  dashboard: {
    highlight: true,
  },
} satisfies Model
