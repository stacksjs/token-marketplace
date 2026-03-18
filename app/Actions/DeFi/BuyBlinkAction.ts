import { Action } from '@stacksjs/actions'
import { db } from '@stacksjs/database'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'

export default new Action({
  name: 'Buy Blink Action',
  description: 'Blink-compatible buy endpoint for shareable NFT purchase URLs',
  method: 'POST',

  async handle(request: RequestInstance) {
    const body = request.all() as any
    const { mint, account } = body

    if (!mint || !account) {
      return response.json({ error: 'mint and account required' }, 422)
    }

    // Look up NFT
    const nft = await db
      .selectFrom('nfts')
      .selectAll()
      .where('mint_address', '=', mint)
      .executeTakeFirst()

    if (!nft) {
      return response.json({ error: 'NFT not found' }, 404)
    }

    if (!(nft as any).is_for_sale && !(nft as any).listing_price) {
      return response.json({ error: 'NFT is not for sale' }, 422)
    }

    const price = (nft as any).listing_price
      ? Number((nft as any).listing_price) / 1e9
      : Number((nft as any).price || 0)

    // In production, build buy transaction via ts-tokens
    return response.json({
      transaction: 'buy-blink-transaction-placeholder',
      message: `Buy ${nft.name} for ${price.toFixed(2)} SOL`,
    })
  },
})
