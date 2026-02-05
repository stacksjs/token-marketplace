import type { Model } from '@stacksjs/types'
import { schema } from '@stacksjs/validation'

export default {
  name: 'Collection',
  table: 'collections',
  primaryKey: 'id',
  autoIncrement: true,
  hasMany: ['Nft'],
  traits: {
    useUuid: true,
    useTimestamps: true,
    useSearch: {
      displayable: ['id', 'name', 'slug', 'description', 'isLive', 'isFeatured', 'isMinting'],
      searchable: ['name', 'slug', 'description'],
      sortable: ['name', 'createdAt'],
      filterable: ['isLive', 'isFeatured', 'isMinting'],
    },

    useSeeder: {
      count: 5,
    },

    useApi: {
      uri: 'collections',
    },
  },

  attributes: {
    name: {
      order: 1,
      fillable: true,
      validation: {
        rule: schema.string().required().max(255),
        message: {
          max: 'Collection name must have a maximum of 255 characters',
        },
      },
      factory: faker => faker.company.name(),
    },

    slug: {
      order: 2,
      unique: true,
      fillable: true,
      validation: {
        rule: schema.string().required().max(255),
        message: {
          max: 'Slug must have a maximum of 255 characters',
        },
      },
      factory: faker => faker.helpers.slugify(faker.company.name()).toLowerCase(),
    },

    description: {
      order: 3,
      fillable: true,
      validation: {
        rule: schema.string().optional(),
      },
      factory: faker => faker.lorem.paragraph(),
    },

    imageUrl: {
      order: 4,
      fillable: true,
      validation: {
        rule: schema.string().optional(),
      },
      factory: faker => faker.image.url(),
    },

    heroImageUrl: {
      order: 5,
      fillable: true,
      validation: {
        rule: schema.string().optional(),
      },
      factory: faker => faker.image.url(),
    },

    isLive: {
      order: 6,
      fillable: true,
      validation: {
        rule: schema.boolean().optional(),
      },
      factory: faker => faker.datatype.boolean(),
    },

    isFeatured: {
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

    website: {
      order: 9,
      fillable: true,
      validation: {
        rule: schema.string().optional(),
      },
      factory: faker => faker.internet.url(),
    },
  },

  dashboard: {
    highlight: true,
  },
} satisfies Model
