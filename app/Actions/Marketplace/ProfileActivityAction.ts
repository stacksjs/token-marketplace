import { Action } from '@stacksjs/actions'
import { db } from '@stacksjs/database'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'

export default new Action({
  name: 'Profile Activity',
  description: 'Fetch transaction activity for a wallet address',
  method: 'GET',

  async handle(request: RequestInstance) {
    const wallet = request.getParam('wallet')

    if (!wallet) {
      return response.json({ error: 'wallet address required' }, 422)
    }

    let activity: any[] = []

    try {
      // Fetch transactions where wallet is buyer or seller
      const transactions = await db
        .selectFrom('transactions')
        .selectAll()
        .execute()

      const walletTxns = transactions.filter((tx: any) =>
        tx.from_wallet_address === wallet
        || tx.to_wallet_address === wallet
        || tx.seller_wallet_address === wallet
        || tx.buyer_wallet_address === wallet,
      )

      activity = await Promise.all(walletTxns.map(async (tx: any) => {
        const nft = tx.nft_id
          ? await db.selectFrom('nfts').selectAll().where('id', '=', tx.nft_id).executeTakeFirst()
          : null

        return {
          type: tx.type || 'transfer',
          nft: nft ? { id: nft.id, name: nft.name, image: (nft as any).image_url } : null,
          price: tx.amount ? Number(tx.amount) / 1e9 : null,
          timestamp: tx.created_at,
          txSignature: tx.transaction_signature || tx.signature,
        }
      }))

      activity.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime())
    }
    catch {
      // transactions table may not exist
    }

    return response.json({ wallet, activity })
  },
})
