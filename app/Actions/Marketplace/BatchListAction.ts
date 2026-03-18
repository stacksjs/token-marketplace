import { Action } from '@stacksjs/actions'
import { db } from '@stacksjs/database'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'

export default new Action({
  name: 'Batch List NFTs',
  description: 'Build batch listing transaction for multiple NFTs',
  method: 'POST',

  async handle(request: RequestInstance) {
    const body = request.all() as any
    const { items, seller } = body

    if (!Array.isArray(items) || items.length === 0) {
      return response.json({ error: 'items array required with {mint, price} objects' }, 422)
    }
    if (!seller) {
      return response.json({ error: 'seller wallet address required' }, 422)
    }
    if (items.length > 20) {
      return response.json({ error: 'Maximum 20 NFTs per batch listing' }, 422)
    }

    const results: any[] = []
    const errors: any[] = []

    for (const item of items) {
      if (!item.mint || !item.price || Number(item.price) <= 0) {
        errors.push({ mint: item.mint, error: 'Invalid mint or price' })
        continue
      }

      const nft = await db
        .selectFrom('nfts')
        .selectAll()
        .where('mint_address', '=', item.mint)
        .executeTakeFirst()

      if (!nft) {
        errors.push({ mint: item.mint, error: 'NFT not found' })
        continue
      }
      if ((nft as any).owner_wallet_address !== seller) {
        errors.push({ mint: item.mint, error: 'Not the owner' })
        continue
      }
      if ((nft as any).is_for_sale) {
        errors.push({ mint: item.mint, error: 'Already listed' })
        continue
      }

      results.push({
        nftId: nft.id,
        mint: item.mint,
        price: Number(item.price),
        priceLamports: Math.floor(Number(item.price) * 1e9),
      })
    }

    if (results.length === 0) {
      return response.json({ error: 'No valid NFTs to list', errors }, 422)
    }

    // In production, this would build a batch transaction using ts-tokens/batch
    // For now, return the prepared listing data for the client to process
    const totalFees = results.reduce((sum, r) => sum + r.price * 0.01, 0)
    const totalRoyalties = results.reduce((sum, r) => sum + r.price * 0.05, 0)

    return response.json({
      transaction: 'batch-list-placeholder',
      listings: results,
      totalItems: results.length,
      totalFees: Number(totalFees.toFixed(6)),
      totalRoyalties: Number(totalRoyalties.toFixed(6)),
      errors: errors.length > 0 ? errors : undefined,
    })
  },
})
