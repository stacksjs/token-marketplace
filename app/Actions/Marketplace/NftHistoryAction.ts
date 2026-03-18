import { Action } from '@stacksjs/actions'
import { db } from '@stacksjs/database'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'

export default new Action({
  name: 'NFT History',
  description: 'Fetch activity history for a single NFT: sales, listings, transfers, offers',
  method: 'GET',

  async handle(request: RequestInstance) {
    const id = Number(request.getParam('id'))

    const nft = await db
      .selectFrom('nfts')
      .select(['id'])
      .where('id', '=', id)
      .executeTakeFirst()

    if (!nft) {
      return response.notFound({ error: 'NFT not found' })
    }

    // Fetch transactions related to this NFT
    let history: any[] = []
    try {
      const transactions = await db
        .selectFrom('transactions')
        .selectAll()
        .where('nft_id', '=', id)
        .execute()

      history = transactions
        .map((tx: any) => ({
          type: tx.type || 'transfer',
          from: tx.from_wallet_address || tx.seller_wallet_address || null,
          to: tx.to_wallet_address || tx.buyer_wallet_address || null,
          price: tx.amount ? Number(tx.amount) / 1e9 : null,
          timestamp: tx.created_at,
          txSignature: tx.transaction_signature || tx.signature || null,
        }))
        .sort((a: any, b: any) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime())
    }
    catch {
      // transactions table may not exist yet
    }

    return response.json({ nftId: id, history })
  },
})
