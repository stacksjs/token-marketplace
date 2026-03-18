import { Action } from '@stacksjs/actions'
import { db } from '@stacksjs/database'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'
import { getTokenService } from '../../Services/TokenService'
import { generateSlug } from '../helpers'

export default new Action({
  name: 'Discover Collections',
  description: 'Discover and import NFT collections using Helius DAS API',
  method: 'POST',

  async handle(request: RequestInstance) {
    const body = request.all()
    const creatorWallet: string = body?.creatorWallet || ''
    const autoImport: boolean = body?.autoImport !== false
    const syncNfts: boolean = body?.syncNfts === true
    const limit: number = Math.min(50, Math.max(1, Number(body?.limit) || 20))

    try {
      const tokenService = getTokenService()

      // Use Helius DAS to search for collections
      const collections = await tokenService.searchCollections({
        creatorWallet: creatorWallet || undefined,
        limit,
      })

      if (collections.length === 0) {
        return response.json({
          discovered: 0,
          imported: 0,
          message: creatorWallet
            ? 'No collections found for this creator wallet. Make sure the wallet has created NFT collections on the configured network.'
            : 'No collections discovered. Try providing a creatorWallet address.',
          collections: [],
        })
      }

      // Import discovered collections into DB
      const results: Array<{
        mintAddress: string
        name: string
        slug: string
        imageUrl: string
        size: number
        nftsSynced: number
        status: 'imported' | 'updated' | 'skipped'
      }> = []

      for (const coll of collections) {
        const name = coll.name?.replace(/\0/g, '').trim() || 'Unknown Collection'
        const slug = generateSlug(name)
        let status: 'imported' | 'updated' | 'skipped' = 'skipped'
        let nftsSynced = 0
        let collectionId: number | null = null

        if (autoImport) {
          const existing = await db
            .selectFrom('collections')
            .selectAll()
            .where('mint_address', '=', coll.mintAddress)
            .executeTakeFirst()

          if (existing) {
            await db
              .updateTable('collections')
              .set({
                name,
                slug,
                description: coll.description,
                image_url: coll.imageUrl,
                total_amount_of_nfts: coll.size,
                updated_at: new Date().toISOString(),
              })
              .where('id', '=', existing.id)
              .execute()

            collectionId = existing.id as number
            status = 'updated'
          } else {
            await db
              .insertInto('collections')
              .values({
                name,
                slug,
                description: coll.description,
                image_url: coll.imageUrl,
                mint_address: coll.mintAddress,
                is_live: 1,
                is_featured: 0,
                is_minting: 0,
                total_amount_of_nfts: coll.size,
                created_at: new Date().toISOString(),
              })
              .execute()

            const inserted = await db
              .selectFrom('collections')
              .selectAll()
              .where('mint_address', '=', coll.mintAddress)
              .executeTakeFirst()

            collectionId = inserted?.id as number
            status = 'imported'
          }

          // Optionally sync individual NFTs into the DB
          if (syncNfts && collectionId) {
            try {
              const nftResult = await tokenService.getCollectionNFTsViaHelius(coll.mintAddress, { limit: 50 })

              for (const nft of nftResult.items) {
                const existingNft = await db
                  .selectFrom('nfts')
                  .selectAll()
                  .where('mint_address', '=', nft.mintAddress)
                  .executeTakeFirst()

                if (existingNft) continue

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

                nftsSynced++
              }
            } catch (err) {
              console.warn(`[DiscoverCollections] Failed to sync NFTs for ${coll.mintAddress}:`, err)
            }
          }
        }

        results.push({
          mintAddress: coll.mintAddress,
          name,
          slug,
          imageUrl: coll.imageUrl,
          size: coll.size,
          nftsSynced,
          status,
        })
      }

      const imported = results.filter(r => r.status === 'imported').length
      const updated = results.filter(r => r.status === 'updated').length

      return response.json({
        creatorWallet: creatorWallet || null,
        discovered: results.length,
        imported,
        updated,
        collections: results,
      })
    } catch (error) {
      console.error('[DiscoverCollections] Failed:', error)

      const errMsg = error instanceof Error ? error.message : 'Unknown error'
      const isHeliusError = errMsg.includes('Helius')

      return response.json({
        error: 'Failed to discover collections',
        details: errMsg,
        ...(isHeliusError && {
          hint: 'Set HELIUS_API_KEY in your environment. Sign up for free at https://dev.helius.xyz',
        }),
      }, 500)
    }
  },
})
