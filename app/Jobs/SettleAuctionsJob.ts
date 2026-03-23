/**
 * Settle Auctions Job
 *
 * Automatically settles ended auctions and handles anti-snipe extensions.
 * Should be run periodically (every minute recommended).
 *
 * Flow:
 *   1. Find active auctions where ends_at <= now
 *   2. Check for anti-snipe: extend if recent bid in last N minutes
 *   3. For ended auctions: settle with highest bidder or mark as failed
 *   4. Record marketplace events and notify via WebSocket
 */

import { db } from '@stacksjs/database'
import { wsService } from '../Services/WebSocketService'
import { indexerService } from '../Services/IndexerService'

export interface SettleAuctionsResult {
  settled: number
  failed: number
  extended: number
  errors: number
  processedAt: number
}

/**
 * Run the auction settlement job.
 */
export async function runSettleAuctionsJob(): Promise<SettleAuctionsResult> {
  const now = new Date()
  const nowStr = now.toISOString()
  let settled = 0
  let failed = 0
  let extended = 0
  let errors = 0

  try {
    // Find all active auctions that have ended
    const endedAuctions = await db
      .selectFrom('auctions')
      .selectAll()
      .where('status', '=', 'active')
      .where('ends_at', '<=', nowStr)
      .execute()

    for (const auction of endedAuctions) {
      try {
        // Check for anti-snipe extension
        const antiSnipeMinutes = Number(auction.anti_snipe_minutes || 0)
        if (antiSnipeMinutes > 0) {
          const isExtended = await checkAntiSnipe(auction, antiSnipeMinutes, now)
          if (isExtended) {
            extended++
            continue
          }
        }

        // Get highest bid
        const highestBid = await db
          .selectFrom('bids')
          .selectAll()
          .where('auction_id', '=', auction.id)
          .orderBy('amount', 'desc')
          .limit(1)
          .executeTakeFirst()

        const reservePrice = Number(auction.reserve_price || 0)

        if (highestBid && Number(highestBid.amount) >= reservePrice) {
          // Auction succeeded — settle
          await db
            .updateTable('auctions')
            .set({ status: 'settled', updated_at: nowStr })
            .where('id', '=', auction.id)
            .execute()

          // Record event
          try {
            await indexerService.recordEvent(db, {
              type: 'auction_settled',
              mintAddress: auction.mint_address || '',
              collectionId: '',
              fromWallet: auction.seller_wallet_address || '',
              toWallet: highestBid.bidder_wallet || '',
              price: Number(highestBid.amount),
              metadata: { auctionId: auction.id },
            })
          }
          catch {
            // Non-fatal
          }

          // Notify via WebSocket
          notifyAuctionResult(auction, 'settled', highestBid)
          settled++
        }
        else {
          // Reserve not met or no bids — failed
          await db
            .updateTable('auctions')
            .set({ status: 'failed', updated_at: nowStr })
            .where('id', '=', auction.id)
            .execute()

          notifyAuctionResult(auction, 'failed')
          failed++
        }
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

  return { settled, failed, extended, errors, processedAt: Date.now() }
}

/**
 * Check if an auction should be extended due to anti-snipe rules.
 * If a bid was placed within the last N minutes of the auction,
 * extend the end time by N minutes.
 */
async function checkAntiSnipe(
  auction: any,
  antiSnipeMinutes: number,
  now: Date,
): Promise<boolean> {
  try {
    const endsAt = new Date(auction.ends_at)
    const snipeWindow = new Date(endsAt.getTime() - antiSnipeMinutes * 60_000)

    // Check if any bid was placed in the snipe window
    const recentBid = await db
      .selectFrom('bids')
      .select('id')
      .where('auction_id', '=', auction.id)
      .where('created_at', '>=', snipeWindow.toISOString())
      .executeTakeFirst()

    if (recentBid) {
      // Extend auction by anti_snipe_minutes
      const newEnd = new Date(now.getTime() + antiSnipeMinutes * 60_000)
      await db
        .updateTable('auctions')
        .set({
          ends_at: newEnd.toISOString(),
          updated_at: now.toISOString(),
        })
        .where('id', '=', auction.id)
        .execute()

      // Notify about extension
      try {
        wsService.broadcastMarketplaceEvent({
          type: 'auction_extended',
          nftMint: auction.mint_address || '',
          from: auction.seller_wallet_address || '',
        })
      }
      catch {
        // Non-fatal
      }

      return true
    }
  }
  catch {
    // Non-fatal
  }

  return false
}

/**
 * Notify WebSocket clients about auction result.
 */
function notifyAuctionResult(auction: any, result: string, winningBid?: any): void {
  try {
    wsService.broadcastMarketplaceEvent({
      type: `auction_${result}`,
      nftMint: auction.mint_address || '',
      from: auction.seller_wallet_address || '',
      to: winningBid?.bidder_wallet || '',
      price: winningBid ? Number(winningBid.amount) : 0,
    })
  }
  catch {
    // Non-fatal
  }
}

/**
 * Start periodic auction settlement.
 * Returns a cleanup function to stop the schedule.
 */
export function startSettleAuctionsSchedule(intervalMs: number = 60_000): () => void {
  const timer = setInterval(() => {
    runSettleAuctionsJob().catch(() => {})
  }, intervalMs)

  return () => clearInterval(timer)
}
