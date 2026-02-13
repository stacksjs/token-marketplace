import { Action } from '@stacksjs/actions'
import { db } from '@stacksjs/database'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'
import { getTokenService } from '../../Services/TokenService'

export default new Action({
  name: 'Bulk Create NFTs',
  description: 'Create multiple NFTs in a batch',
  method: 'POST',
  async handle(request: RequestInstance) {
    const body = await request.json()
    const { items, collectionId, sellerFeeBasisPoints } = body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return response.json({ error: 'items array is required and must not be empty' }, 400)
    }

    if (items.length > 100) {
      return response.json({ error: 'Maximum 100 items per request' }, 400)
    }

    for (let i = 0; i < items.length; i++) {
      if (!items[i].name || !items[i].uri) {
        return response.json({ error: `Item at index ${i} must have name and uri` }, 400)
      }
    }

    let collectionMint: string | undefined
    let dbCollectionId: number | undefined
    if (collectionId) {
      const collection = await db
        .selectFrom('collections')
        .select(['id', 'mint_address'])
        .where('id', '=', Number(collectionId))
        .executeTakeFirst()
      if (collection) {
        collectionMint = collection.mint_address || undefined
        dbCollectionId = collection.id
      }
    }

    try {
      const tokenService = getTokenService()
      const results = await tokenService.batchCreateNFTs(
        items,
        { collection: collectionMint, sellerFeeBasisPoints },
      )

      let created = 0
      let failed = 0

      for (let i = 0; i < results.length; i++) {
        if (results[i].success && results[i].mint) {
          created++
          await db
            .insertInto('nfts')
            .values({
              name: items[i].name,
              mint_address: results[i].mint,
              metadata_url: items[i].uri || null,
              collection_id: dbCollectionId || null,
              is_for_sale: 0,
              is_minting: 0,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            } as any)
            .execute()
        } else {
          failed++
        }
      }

      return response.json({
        success: true,
        created,
        failed,
        results,
      })
    } catch (error) {
      return response.json({
        error: 'Failed to batch create NFTs',
        details: error instanceof Error ? error.message : 'Unknown error',
      }, 500)
    }
  },
})
