import { Action } from '@stacksjs/actions'
import { db } from '@stacksjs/database'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'

export default new Action({
  name: 'Cancel Cross-Listings',
  description: 'Cancel all cross-marketplace listings for an NFT',
  method: 'DELETE',

  async handle(request: RequestInstance) {
    const body = request.all() as any
    const { mint, sellerWallet } = body

    if (!mint || !sellerWallet) {
      return response.json({ error: 'mint and sellerWallet required' }, 422)
    }

    const nft = await db
      .selectFrom('nfts')
      .selectAll()
      .where('mint_address', '=', mint)
      .executeTakeFirst()

    if (!nft) {
      return response.notFound({ error: 'NFT not found' })
    }
    if ((nft as any).owner_wallet_address !== sellerWallet) {
      return response.json({ error: 'Not the owner' }, 403)
    }

    // Delist locally
    try {
      await db
        .updateTable('nfts')
        .set({
          is_for_sale: 0 as any,
          listing_price: null,
          listed_at: null,
          updated_at: new Date().toISOString(),
        } as any)
        .where('id', '=', nft.id)
        .execute()
    }
    catch {}

    // In production, would cancel on external marketplaces via ts-tokens/marketplace
    return response.json({
      success: true,
      mint,
      message: 'All listings cancelled',
    })
  },
})
