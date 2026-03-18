import { Action } from '@stacksjs/actions'
import { db } from '@stacksjs/database'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'

export default new Action({
  name: 'Batch Buy NFTs',
  description: 'Build batch purchase transaction for multiple listed NFTs',
  method: 'POST',

  async handle(request: RequestInstance) {
    const body = request.all() as any
    const { mints, buyer } = body

    if (!Array.isArray(mints) || mints.length === 0) {
      return response.json({ error: 'mints array required' }, 422)
    }
    if (!buyer) {
      return response.json({ error: 'buyer wallet address required' }, 422)
    }
    if (mints.length > 20) {
      return response.json({ error: 'Maximum 20 NFTs per batch purchase' }, 422)
    }

    const purchases: any[] = []
    const errors: any[] = []
    let totalCost = 0
    let totalFees = 0

    for (const mint of mints) {
      const nft = await db
        .selectFrom('nfts')
        .selectAll()
        .where('mint_address', '=', mint)
        .executeTakeFirst()

      if (!nft) {
        errors.push({ mint, error: 'NFT not found' })
        continue
      }
      if (!(nft as any).is_for_sale && !(nft as any).listing_price) {
        errors.push({ mint, error: 'Not listed for sale' })
        continue
      }
      if ((nft as any).owner_wallet_address === buyer) {
        errors.push({ mint, error: 'Cannot buy your own NFT' })
        continue
      }

      const price = (nft as any).listing_price
        ? Number((nft as any).listing_price) / 1e9
        : Number((nft as any).price || 0)

      const platformFee = price * 0.01
      const royalty = price * 0.05

      purchases.push({
        nftId: nft.id,
        mint,
        name: nft.name,
        price,
        platformFee: Number(platformFee.toFixed(6)),
        royalty: Number(royalty.toFixed(6)),
        seller: (nft as any).owner_wallet_address,
      })

      totalCost += price
      totalFees += platformFee + royalty
    }

    if (purchases.length === 0) {
      return response.json({ error: 'No valid NFTs to purchase', errors }, 422)
    }

    return response.json({
      transaction: 'batch-buy-placeholder',
      purchases,
      totalCost: Number(totalCost.toFixed(6)),
      totalFees: Number(totalFees.toFixed(6)),
      totalItems: purchases.length,
      errors: errors.length > 0 ? errors : undefined,
    })
  },
})
