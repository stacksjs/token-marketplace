import { Action } from '@stacksjs/actions'
import { db } from '@stacksjs/database'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'
import { getTokenService } from '../../Services/TokenService'
import { generateSlug } from '../helpers'

export default new Action({
  name: 'Sync Collection',
  description: 'Import a collection from on-chain data by its mint address',
  method: 'POST',

  async handle(request: RequestInstance) {
    const collectionMint = request.getParam('collectionMint')

    if (!collectionMint || typeof collectionMint !== 'string' || collectionMint.length < 32) {
      return response.json({ error: 'Valid collectionMint address is required' }, 400)
    }

    try {
      const tokenService = getTokenService()

      // Step 1: Fetch on-chain collection metadata
      const collectionData = await tokenService.getNFTData(collectionMint)
      if (!collectionData || !collectionData.metadata) {
        return response.json({ error: 'Collection not found on-chain' }, 404)
      }

      const onChainMeta = collectionData.metadata
      const offChainMeta = collectionData.offChainMetadata || {}

      const collectionName = onChainMeta.name?.replace(/\0/g, '').trim() || 'Unknown Collection'
      const collectionSlug = generateSlug(collectionName)
      const description = (offChainMeta as any)?.description || ''
      const imageUrl = (offChainMeta as any)?.image || ''
      const externalUrl = (offChainMeta as any)?.external_url || ''

      // Step 2: Check if collection already exists
      const existing = await db
        .selectFrom('collections')
        .selectAll()
        .where('mint_address', '=', collectionMint)
        .executeTakeFirst()

      let collectionId: number

      if (existing) {
        // Update existing collection
        await db
          .updateTable('collections')
          .set({
            name: collectionName,
            slug: collectionSlug,
            description,
            image_url: imageUrl,
            metadata_url: onChainMeta.uri || '',
            website: externalUrl,
            updated_at: new Date().toISOString(),
          })
          .where('id', '=', existing.id)
          .execute()

        collectionId = existing.id as number
      } else {
        // Insert new collection
        const result = await db
          .insertInto('collections')
          .values({
            name: collectionName,
            slug: collectionSlug,
            description,
            image_url: imageUrl,
            mint_address: collectionMint,
            metadata_url: onChainMeta.uri || '',
            website: externalUrl,
            is_live: 1,
            is_featured: 0,
            is_minting: 0,
            created_at: new Date().toISOString(),
          })
          .execute()

        // Fetch the inserted row to get the ID
        const inserted = await db
          .selectFrom('collections')
          .selectAll()
          .where('mint_address', '=', collectionMint)
          .executeTakeFirst()

        collectionId = inserted?.id as number
      }

      // Step 3: Fetch NFTs in this collection
      // Try Helius DAS first (faster, richer data), fall back to basic RPC
      let synced = 0
      let skipped = 0
      let totalFound = 0

      try {
        // Helius DAS — single call returns name, image, owner, attributes
        const nftResult = await tokenService.getCollectionNFTsViaHelius(collectionMint, { limit: 50 })
        totalFound = nftResult.total

        for (const nft of nftResult.items) {
          const existingNft = await db
            .selectFrom('nfts')
            .selectAll()
            .where('mint_address', '=', nft.mintAddress)
            .executeTakeFirst()

          if (existingNft) {
            skipped++
            continue
          }

          await db
            .insertInto('nfts')
            .values({
              collection_id: collectionId,
              name: nft.name || `NFT ${nft.mintAddress.slice(0, 8)}`,
              mint_address: nft.mintAddress,
              owner_wallet_address: nft.owner || '',
              description: nft.description || '',
              image_url: nft.imageUrl || '',
              attributes: nft.attributes?.length ? JSON.stringify(nft.attributes) : null,
              is_for_sale: 0,
              is_minting: 0,
              created_at: new Date().toISOString(),
            })
            .execute()

          synced++
        }
      } catch (heliusErr) {
        // Fallback to basic RPC (slower — fetches each NFT individually)
        console.warn('[SyncCollection] Helius unavailable, falling back to RPC:', heliusErr)

        const nftMints = await tokenService.getNFTsByCollection(collectionMint)
        totalFound = nftMints.length

        for (const mint of nftMints) {
          const existingNft = await db
            .selectFrom('nfts')
            .selectAll()
            .where('mint_address', '=', mint)
            .executeTakeFirst()

          if (existingNft) {
            skipped++
            continue
          }

          try {
            const nftData = await tokenService.getNFTData(mint)
            if (!nftData) continue

            const nftMeta = nftData.metadata || {}
            const nftOffChain = nftData.offChainMetadata || {}

            await db
              .insertInto('nfts')
              .values({
                collection_id: collectionId,
                name: (nftMeta as any).name?.replace(/\0/g, '').trim() || `NFT ${mint.slice(0, 8)}`,
                mint_address: mint,
                owner_wallet_address: nftData.owner || '',
                description: (nftOffChain as any)?.description || '',
                image_url: (nftOffChain as any)?.image || '',
                metadata_url: (nftMeta as any).uri || '',
                attributes: (nftOffChain as any)?.attributes ? JSON.stringify((nftOffChain as any).attributes) : null,
                is_for_sale: 0,
                is_minting: 0,
                created_at: new Date().toISOString(),
              })
              .execute()

            synced++
          } catch (err) {
            console.warn(`[SyncCollection] Failed to sync NFT ${mint}:`, err)
            skipped++
          }
        }
      }

      // Step 4: Update collection NFT count
      const nftCount = await db
        .selectFrom('nfts')
        .where('collection_id', '=', collectionId)
        .select(db.fn.count('id').as('count'))
        .executeTakeFirst()

      await db
        .updateTable('collections')
        .set({
          total_amount_of_nfts: Number(nftCount?.count || 0),
          updated_at: new Date().toISOString(),
        })
        .where('id', '=', collectionId)
        .execute()

      // Return result
      const collection = await db
        .selectFrom('collections')
        .selectAll()
        .where('id', '=', collectionId)
        .executeTakeFirst()

      return response.json({
        synced: true,
        collection: {
          id: collection?.id,
          name: collection?.name,
          slug: collection?.slug,
          mintAddress: collectionMint,
          totalNfts: Number(nftCount?.count || 0),
        },
        nfts: {
          found: totalFound,
          synced,
          skipped,
        },
        isNew: !existing,
      })
    } catch (error) {
      console.error('[SyncCollection] Failed:', error)
      return response.json({
        error: 'Failed to sync collection from on-chain data',
        details: error instanceof Error ? error.message : 'Unknown error',
      }, 500)
    }
  },
})
