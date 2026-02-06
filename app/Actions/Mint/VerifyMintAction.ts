import { Action } from '@stacksjs/actions'
import { db } from '@stacksjs/database'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'

export default new Action({
  name: 'Verify Mint',
  description: 'Verify a pending mint transaction on-chain',
  method: 'POST',

  async handle(request: RequestInstance) {
    const body = await request.json()

    const { transactionId, transactionSignature } = body

    if (!transactionId && !transactionSignature) {
      return response.json({
        error: 'transactionId or transactionSignature is required',
      }, 400)
    }

    // Find the mint transaction
    let mintTransaction
    if (transactionId) {
      mintTransaction = await db
        .selectFrom('mint_transactions')
        .selectAll()
        .where('uuid', '=', transactionId)
        .executeTakeFirst()
    } else {
      mintTransaction = await db
        .selectFrom('mint_transactions')
        .selectAll()
        .where('transaction_signature', '=', transactionSignature)
        .executeTakeFirst()
    }

    if (!mintTransaction) {
      return response.notFound({ error: 'Mint transaction not found' })
    }

    // If already confirmed or failed, return current status
    if (mintTransaction.status === 'confirmed' || mintTransaction.status === 'failed') {
      return response.json({
        verified: mintTransaction.status === 'confirmed',
        transaction: {
          id: mintTransaction.uuid,
          status: mintTransaction.status,
          mintAddress: mintTransaction.mint_address,
          transactionSignature: mintTransaction.transaction_signature,
          errorMessage: mintTransaction.error_message,
        },
      })
    }

    // For pending/processing transactions, we would verify on-chain
    // In a real implementation, this would check the Solana network
    // For now, we return the current status

    return response.json({
      verified: false,
      transaction: {
        id: mintTransaction.uuid,
        status: mintTransaction.status,
        mintAddress: mintTransaction.mint_address,
        transactionSignature: mintTransaction.transaction_signature,
        message: 'Transaction is still being processed',
      },
    })
  },
})
