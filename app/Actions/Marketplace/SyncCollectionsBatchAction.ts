import { Action } from '@stacksjs/actions'
import { db } from '@stacksjs/database'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'
import { getTokenService } from '../../Services/TokenService'
import { generateSlug } from '../helpers'

export default new Action({
  name: 'Sync Collections Batch',
  description: 'Import multiple collections from on-chain data by mint addresses',
  method: 'POST',

  async handle(request: RequestInstance) {
    const body = request.all()
    const collectionMints: string[] = body?.collectionMints || []

    if (!Array.isArray(collectionMints) || collectionMints.length === 0) {
      return response.json({
        error: 'collectionMints array is required (array of Solana mint addresses)',
      }, 400)
    }

    if (collectionMints.length > 20) {
      return response.json({ error: 'Maximum 20 collections per batch' }, 400)
    }

    const tokenService = getTokenService()
    const results: Array<{
      mintAddress: string
      status: 'synced' | 'updated' | 'failed'
      name?: string
      slug?: string
      nftsFound?: number
      error?: string
    }> = []

    for (const mint of collectionMints) {
      if (!mint || typeof mint !== 'string' || mint.length < 32) {
        results.push({ mintAddress: mint, status: 'failed', error: 'Invalid address' })
        continue
      }

      try {
        // Fetch collection metadata from chain
        const collectionData = await tokenService.getNFTData(mint)
        if (!collectionData?.metadata) {
          results.push({ mintAddress: mint, status: 'failed', error: 'Not found on-chain' })
          continue
        }

        const onChainMeta = collectionData.metadata
        const offChainMeta = collectionData.offChainMetadata || {}

        const name = (onChainMeta as any).name?.replace(/\0/g, '').trim() || 'Unknown Collection'
        const slug = generateSlug(name)
        const description = (offChainMeta as any)?.description || ''
        const imageUrl = (offChainMeta as any)?.image || ''
        const externalUrl = (offChainMeta as any)?.external_url || ''

        // Check if already exists
        const existing = await db
          .selectFrom('collections')
          .selectAll()
          .where('mint_address', '=', mint)
          .executeTakeFirst()

        if (existing) {
          await db
            .updateTable('collections')
            .set({
              name,
              slug,
              description,
              image_url: imageUrl,
              metadata_url: (onChainMeta as any).uri || '',
              website: externalUrl,
              updated_at: new Date().toISOString(),
            })
            .where('id', '=', existing.id)
            .execute()

          results.push({ mintAddress: mint, status: 'updated', name, slug })
        } else {
          await db
            .insertInto('collections')
            .values({
              name,
              slug,
              description,
              image_url: imageUrl,
              mint_address: mint,
              metadata_url: (onChainMeta as any).uri || '',
              website: externalUrl,
              is_live: 1,
              is_featured: 0,
              is_minting: 0,
              created_at: new Date().toISOString(),
            })
            .execute()

          results.push({ mintAddress: mint, status: 'synced', name, slug })
        }

        // Fetch NFT count for this collection
        const nftMints = await tokenService.getNFTsByCollection(mint)
        const lastResult = results[results.length - 1]
        lastResult.nftsFound = nftMints.length

        // Update total count
        const inserted = await db
          .selectFrom('collections')
          .selectAll()
          .where('mint_address', '=', mint)
          .executeTakeFirst()

        if (inserted) {
          await db
            .updateTable('collections')
            .set({
              total_amount_of_nfts: nftMints.length,
              updated_at: new Date().toISOString(),
            })
            .where('id', '=', inserted.id)
            .execute()
        }
      } catch (err) {
        results.push({
          mintAddress: mint,
          status: 'failed',
          error: err instanceof Error ? err.message : 'Unknown error',
        })
      }
    }

    const synced = results.filter(r => r.status === 'synced').length
    const updated = results.filter(r => r.status === 'updated').length
    const failed = results.filter(r => r.status === 'failed').length

    return response.json({
      total: collectionMints.length,
      synced,
      updated,
      failed,
      results,
    })
  },
})
