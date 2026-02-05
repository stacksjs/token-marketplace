import { db } from '@stacksjs/database'

export async function seed() {
  // Insert collections
  await db.insertInto('collections')
    .values([
      {
        name: 'Azuki',
        slug: 'azuki',
        description: 'A brand for the metaverse. Built by the community.',
        image_url: 'https://i.seadn.io/gae/H8jOCJuQokNqGBpkBN5wk1oZwO7LM8bNnrHCaekV2nKjnCqw6UB5oaH8XyNeBDj6bA_n1mjejzhFQUP3O1NfjFLHr3FOaeHcTOOT?auto=format&w=384',
        hero_image_url: 'https://i.seadn.io/gcs/files/1419bd2f8b8bcdbca8e1ac6cecd5dce8.png?auto=format&w=1920',
        is_live: 1,
        is_featured: 1,
        is_minting: 0,
        website: 'https://www.azuki.com/'
      },
      {
        name: 'Doodles',
        slug: 'doodles',
        description: 'A community-driven collectibles project featuring art by Burnt Toast.',
        image_url: 'https://i.seadn.io/gae/7B0qai02OdHA8P_EOVK672qUliyjQdQDGNrACxs7WnTgZAkJa_wWURnIFKeOh5VTf8cfTqW3wQpozGedaC9mteKphEOtztls02RlWQ?auto=format&w=384',
        hero_image_url: 'https://i.seadn.io/gcs/files/1c72c3f19d4eb8e47dfcfbae35c1cb82.png?auto=format&w=1920',
        is_live: 1,
        is_featured: 0,
        is_minting: 0,
        website: 'https://doodles.app/'
      },
      {
        name: 'Bored Ape Yacht Club',
        slug: 'bored-ape-yacht-club',
        description: 'BAYC is a collection of 10,000 Bored Ape NFTs—unique digital collectibles.',
        image_url: 'https://i.seadn.io/gae/Ju9CkWtV-1Okvf45wo8UctR-M9He2PjILP0oOvxE89AyiPPGtrR3gysu1Zgy0hjd2xKIgjJJtWIc0ybj4Vd7wv8t3pxDGHoJBzDB?auto=format&w=384',
        hero_image_url: 'https://i.seadn.io/gcs/files/e3e2f0bbd9ff0b01ce15e01a0cc02c33.png?auto=format&w=1920',
        is_live: 1,
        is_featured: 1,
        is_minting: 0,
        website: 'https://boredapeyachtclub.com/'
      },
      {
        name: 'Pudgy Penguins',
        slug: 'pudgy-penguins',
        description: 'Pudgy Penguins is a collection of 8,888 NFT penguins.',
        image_url: 'https://i.seadn.io/gae/yNi-XdGxsgQCPpqSio4G31ygAV6wURdIdInWRcFIl46UjUQ1eV7BEndGe8L661OoG-clRi7EgInLX4LPu9Jfw4fq0bnVYHqg7RFi?auto=format&w=384',
        hero_image_url: 'https://i.seadn.io/gcs/files/b97f7ff8a31f36a3ada7bf0d0c07d92c.png?auto=format&w=1920',
        is_live: 1,
        is_featured: 0,
        is_minting: 1,
        website: 'https://www.pudgypenguins.com/'
      }
    ])
    .execute()

  // Get collection IDs
  const collections = await db.selectFrom('collections').selectAll().execute()
  const azuki = collections.find(c => c.slug === 'azuki')
  const doodles = collections.find(c => c.slug === 'doodles')
  const bayc = collections.find(c => c.slug === 'bored-ape-yacht-club')
  const pudgy = collections.find(c => c.slug === 'pudgy-penguins')

  // Insert NFTs
  await db.insertInto('nfts')
    .values([
      // Azuki NFTs
      {
        collection_id: azuki?.id,
        name: 'Azuki #1234',
        token_id: '1234',
        description: 'Azuki starts with a collection of 10,000 avatars.',
        image_url: 'https://i.seadn.io/gae/H8jOCJuQokNqGBpkBN5wk1oZwO7LM8bNnrHCaekV2nKjnCqw6UB5oaH8XyNeBDj6bA_n1mjejzhFQUP3O1NfjFLHr3FOaeHcTOOT?auto=format&w=384',
        price: 12.5,
        is_for_sale: 1,
        is_minting: 0,
        rarity: 'Legendary',
        attributes: JSON.stringify({ background: 'Red', hair: 'Blue' })
      },
      {
        collection_id: azuki?.id,
        name: 'Azuki #5678',
        token_id: '5678',
        description: 'Azuki starts with a collection of 10,000 avatars.',
        image_url: 'https://i.seadn.io/gcs/files/9a1a2c6d9a1a2c6d9a1a2c6d9a1a2c6d.png?auto=format&w=384',
        price: 8.2,
        is_for_sale: 1,
        is_minting: 0,
        rarity: 'Epic',
        attributes: JSON.stringify({ background: 'Blue', hair: 'Green' })
      },
      // Doodles NFTs
      {
        collection_id: doodles?.id,
        name: 'Doodle #2345',
        token_id: '2345',
        description: 'A hand-drawn Doodle.',
        image_url: 'https://i.seadn.io/gae/7B0qai02OdHA8P_EOVK672qUliyjQdQDGNrACxs7WnTgZAkJa_wWURnIFKeOh5VTf8cfTqW3wQpozGedaC9mteKphEOtztls02RlWQ?auto=format&w=384',
        price: 5.8,
        is_for_sale: 1,
        is_minting: 0,
        rarity: 'Rare',
        attributes: JSON.stringify({ face: 'Happy', background: 'Yellow' })
      },
      // BAYC NFTs
      {
        collection_id: bayc?.id,
        name: 'Bored Ape #9999',
        token_id: '9999',
        description: 'A bored ape.',
        image_url: 'https://i.seadn.io/gae/Ju9CkWtV-1Okvf45wo8UctR-M9He2PjILP0oOvxE89AyiPPGtrR3gysu1Zgy0hjd2xKIgjJJtWIc0ybj4Vd7wv8t3pxDGHoJBzDB?auto=format&w=384',
        price: 85.0,
        is_for_sale: 1,
        is_minting: 0,
        rarity: 'Legendary',
        attributes: JSON.stringify({ mouth: 'Bored', fur: 'Gold' })
      },
      // Pudgy Penguins NFTs (minting)
      {
        collection_id: pudgy?.id,
        name: 'Pudgy #1111',
        token_id: '1111',
        description: 'A pudgy penguin.',
        image_url: 'https://i.seadn.io/gae/yNi-XdGxsgQCPpqSio4G31ygAV6wURdIdInWRcFIl46UjUQ1eV7BEndGe8L661OoG-clRi7EgInLX4LPu9Jfw4fq0bnVYHqg7RFi?auto=format&w=384',
        price: 0.1,
        is_for_sale: 0,
        is_minting: 1,
        mint_url: 'https://mint.pudgypenguins.com/',
        rarity: 'Common',
        attributes: JSON.stringify({ skin: 'Blue', accessory: 'Hat' })
      },
      {
        collection_id: pudgy?.id,
        name: 'Pudgy #2222',
        token_id: '2222',
        description: 'A pudgy penguin.',
        image_url: 'https://i.seadn.io/gcs/files/pudgy2222.png?auto=format&w=384',
        price: 0.1,
        is_for_sale: 0,
        is_minting: 1,
        mint_url: 'https://mint.pudgypenguins.com/',
        rarity: 'Uncommon',
        attributes: JSON.stringify({ skin: 'Pink', accessory: 'Scarf' })
      }
    ])
    .execute()

  console.log('Marketplace seed complete!')
}

// Run the seeder
seed()
