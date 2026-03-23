/**
 * Expire Offers Job
 *
 * Automatically expires offers that have passed their expiration time.
 * Should be run periodically (every minute recommended).
 *
 * Flow:
 *   1. Find active offers where expires_at <= now
 *   2. Update status to 'expired'
 *   3. Record marketplace events for expired offers
 *   4. Notify affected wallets via WebSocket
 */

import { db } from '@stacksjs/database'
import { wsService } from '../Services/WebSocketService'
import { indexerService } from '../Services/IndexerService'

export interface ExpireOffersResult {
  expiredCount: number
  errors: number
  processedAt: number
}

/**
 * Run the offer expiration job.
 */
export async function runExpireOffersJob(): Promise<ExpireOffersResult> {
  const now = new Date().toISOString()
  let expiredCount = 0
  let errors = 0

  try {
    // Find all active offers that have expired
    const expiredOffers = await db
      .selectFrom('offers')
      .selectAll()
      .where('status', '=', 'active')
      .where('expires_at', '<=', now)
      .execute()

    for (const offer of expiredOffers) {
      try {
        // Update offer status
        await db
          .updateTable('offers')
          .set({ status: 'expired', updated_at: now })
          .where('id', '=', offer.id)
          .execute()

        // Record marketplace event
        try {
          await indexerService.recordEvent(db, {
            type: 'offer_expired',
            mintAddress: offer.nft_mint || offer.mint_address || '',
            collectionId: offer.collection_id || '',
            fromWallet: offer.offerer_wallet || offer.buyer_wallet || '',
            price: Number(offer.amount || offer.offer_price || 0),
            metadata: { offerId: offer.id },
          })
        }
        catch {
          // Non-fatal: event recording failure
        }

        // Notify via WebSocket
        try {
          const wallet = offer.offerer_wallet || offer.buyer_wallet || ''
          if (wallet) {
            wsService.broadcastMarketplaceEvent({
              type: 'offer_expired',
              from: wallet,
              nftMint: offer.nft_mint || offer.mint_address || '',
              price: Number(offer.amount || offer.offer_price || 0),
            })
          }
        }
        catch {
          // Non-fatal: WS notification failure
        }

        expiredCount++
      }
      catch {
        errors++
      }
    }
  }
  catch {
    // Table may not exist yet
    errors++
  }

  return { expiredCount, errors, processedAt: Date.now() }
}

/**
 * Start periodic offer expiration.
 * Returns a cleanup function to stop the schedule.
 */
export function startExpireOffersSchedule(intervalMs: number = 60_000): () => void {
  const timer = setInterval(() => {
    runExpireOffersJob().catch(() => {})
  }, intervalMs)

  return () => clearInterval(timer)
}
