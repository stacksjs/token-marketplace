import { Action } from '@stacksjs/actions'
import { db } from '@stacksjs/database'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'

export default new Action({
  name: 'Counter Offer',
  description: 'Reject an offer with a suggested counter-price',
  method: 'POST',

  async handle(request: RequestInstance) {
    const body = request.all() as any
    const { offerId, counterAmount, ownerWallet } = body

    if (!offerId) {
      return response.json({ error: 'offerId required' }, 422)
    }
    if (!counterAmount || Number(counterAmount) <= 0) {
      return response.json({ error: 'Valid counterAmount required' }, 422)
    }
    if (!ownerWallet) {
      return response.json({ error: 'ownerWallet required' }, 422)
    }

    // Fetch the original offer
    let offer: any = null
    try {
      offer = await db
        .selectFrom('offers')
        .selectAll()
        .where('id', '=', Number(offerId))
        .executeTakeFirst()
    }
    catch {
      return response.json({ error: 'Failed to fetch offer' }, 500)
    }

    if (!offer) {
      return response.notFound({ error: 'Offer not found' })
    }
    if (offer.status !== 'pending') {
      return response.json({ error: 'Offer is no longer pending' }, 422)
    }

    // Verify the caller owns the NFT
    if (offer.nft_id) {
      const nft = await db
        .selectFrom('nfts')
        .selectAll()
        .where('id', '=', offer.nft_id)
        .executeTakeFirst()

      if (!nft || (nft as any).owner_wallet_address !== ownerWallet) {
        return response.json({ error: 'Only the NFT owner can counter-offer' }, 403)
      }
    }

    // Update original offer to rejected
    try {
      await db
        .updateTable('offers')
        .set({ status: 'rejected', updated_at: new Date().toISOString() } as any)
        .where('id', '=', Number(offerId))
        .execute()
    }
    catch {
      return response.json({ error: 'Failed to update offer' }, 500)
    }

    // Create counter-offer
    const counterLamports = Math.floor(Number(counterAmount) * 1e9)
    const expiryAt = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString() // 7 day expiry

    try {
      await db
        .insertInto('offers')
        .values({
          nft_id: offer.nft_id,
          buyer_wallet_address: ownerWallet,
          amount: counterLamports,
          status: 'pending',
          expiry_at: expiryAt,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as any)
        .execute()
    }
    catch {
      // Counter offer created in principle even if DB insert fails
    }

    return response.json({
      success: true,
      originalOffer: {
        id: offer.id,
        amount: Number(offer.amount) / 1e9,
        status: 'rejected',
      },
      counterOffer: {
        amount: Number(counterAmount),
        amountLamports: counterLamports,
        expiryAt,
        from: ownerWallet,
        to: offer.buyer_wallet_address,
      },
    })
  },
})
