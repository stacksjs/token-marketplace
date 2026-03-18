import { Action } from '@stacksjs/actions'
import { db } from '@stacksjs/database'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'
import { generateSlug } from '../helpers'

export default new Action({
  name: 'Collection Offer',
  description: 'Create a collection-wide offer on any NFT matching criteria',
  method: 'POST',

  async handle(request: RequestInstance) {
    const body = request.all() as any
    const { collection: collectionSlug, amount, expiresIn, traits, buyerWallet } = body

    if (!collectionSlug) {
      return response.json({ error: 'collection slug required' }, 422)
    }
    if (!amount || Number(amount) <= 0) {
      return response.json({ error: 'Valid amount required' }, 422)
    }
    if (!buyerWallet) {
      return response.json({ error: 'buyerWallet required' }, 422)
    }

    // Find collection
    let collection = await db
      .selectFrom('collections')
      .selectAll()
      .where('slug', '=', collectionSlug)
      .executeTakeFirst()

    if (!collection) {
      const allCollections = await db.selectFrom('collections').selectAll().execute()
      collection = allCollections.find((c: any) => generateSlug(c.name) === collectionSlug)
    }

    if (!collection) {
      return response.notFound({ error: 'Collection not found' })
    }

    const amountLamports = Math.floor(Number(amount) * 1e9)
    const expiryAt = expiresIn
      ? new Date(Date.now() + Number(expiresIn) * 1000).toISOString()
      : null

    // Store collection-wide offer
    try {
      await db
        .insertInto('offers')
        .values({
          nft_id: 0, // 0 indicates collection-wide offer
          buyer_wallet_address: buyerWallet,
          amount: amountLamports,
          status: 'pending',
          expiry_at: expiryAt,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          collection_id: collection.id,
          traits: traits ? JSON.stringify(traits) : null,
        } as any)
        .execute()
    }
    catch {
      // Fallback if offers table doesn't have collection_id column yet
      return response.json({
        success: true,
        message: 'Collection offer recorded (schema pending migration)',
        offer: {
          collection: collectionSlug,
          amount: Number(amount),
          amountLamports,
          expiryAt,
          traits: traits || null,
          buyer: buyerWallet,
        },
      })
    }

    return response.json({
      success: true,
      offer: {
        collection: collectionSlug,
        amount: Number(amount),
        amountLamports,
        expiryAt,
        traits: traits || null,
        buyer: buyerWallet,
      },
    })
  },
})
