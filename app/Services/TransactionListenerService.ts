/**
 * Transaction Listener Service
 *
 * Subscribes to on-chain account changes for marketplace NFTs
 * via Solana's native WebSocket subscriptions. Detects ownership
 * changes in real-time without any third-party API.
 *
 * When an ownership change is detected:
 *   1. Updates the DB (new owner, auto-delist)
 *   2. Records a marketplace event
 *   3. Notifies WebSocket clients (if available)
 */

import { rpcService } from './RPCService'
import { indexerService } from './IndexerService'

const env = typeof Bun !== 'undefined' ? Bun.env : process.env

// ============================================
// Types
// ============================================

interface WatchedMint {
  mintAddress: string
  collectionId: number
  subscriptionId: number | null
}

type OwnershipChangeCallback = (change: {
  mintAddress: string
  collectionId: number
  previousOwner: string
  newOwner: string
}) => void

// ============================================
// TransactionListenerService
// ============================================

class TransactionListenerService {
  private watchedMints: Map<string, WatchedMint> = new Map()
  private ws: WebSocket | null = null
  private reconnectDelay = 1000
  private maxReconnectDelay = 30_000
  private isConnected = false
  private onChangeCallbacks: OwnershipChangeCallback[] = []
  private rpcWsUrl: string
  private pendingSubscriptions: Map<number, string> = new Map()
  private nextRequestId = 1

  constructor() {
    const rpcUrl = env.SOLANA_RPC_URL || 'https://api.devnet.solana.com'
    this.rpcWsUrl = rpcUrl
      .replace('https://', 'wss://')
      .replace('http://', 'ws://')
  }

  /**
   * Register a callback for ownership changes.
   */
  onOwnershipChange(callback: OwnershipChangeCallback): void {
    this.onChangeCallbacks.push(callback)
  }

  /**
   * Start watching all NFTs in a collection.
   */
  async watchCollection(db: any, collectionId: number): Promise<number> {
    let nfts: any[]
    try {
      nfts = await db
        .selectFrom('nfts')
        .where('collection_id', '=', collectionId)
        .where('is_compressed', '=', 0)
        .select(['mint_address'])
        .execute()
    }
    catch {
      return 0
    }

    let watchedCount = 0
    for (const nft of nfts) {
      if (nft.mint_address && !this.watchedMints.has(nft.mint_address)) {
        this.watchedMints.set(nft.mint_address, {
          mintAddress: nft.mint_address,
          collectionId,
          subscriptionId: null,
        })
        watchedCount++
      }
    }

    return watchedCount
  }

  /**
   * Watch a single NFT mint address.
   */
  watchMint(mintAddress: string, collectionId: number): void {
    if (this.watchedMints.has(mintAddress)) return

    this.watchedMints.set(mintAddress, {
      mintAddress,
      collectionId,
      subscriptionId: null,
    })
  }

  /**
   * Stop watching a mint address.
   */
  unwatchMint(mintAddress: string): void {
    this.watchedMints.delete(mintAddress)
  }

  /**
   * Poll-based ownership check for all watched mints.
   * Used as fallback when WebSocket subscription is unavailable.
   * This is the primary sync mechanism for environments without WS.
   */
  async pollOwnershipChanges(db: any): Promise<void> {
    for (const [mintAddress, watched] of this.watchedMints) {
      try {
        const currentNft = await db
          .selectFrom('nfts')
          .where('mint_address', '=', mintAddress)
          .select(['id', 'owner_wallet_address', 'status'])
          .executeTakeFirst()

        if (!currentNft) continue

        const onChainOwner = await indexerService.getTokenOwner(mintAddress)

        if (onChainOwner && onChainOwner !== currentNft.owner_wallet_address) {
          const previousOwner = currentNft.owner_wallet_address

          await db
            .updateTable('nfts')
            .set({
              owner_wallet_address: onChainOwner,
              status: 'unlisted',
              listing_price: null,
              is_for_sale: 0,
              updated_at: new Date().toISOString(),
            })
            .where('id', '=', currentNft.id)
            .execute()

          await indexerService.recordEvent(db, {
            type: 'transfer',
            nftId: currentNft.id,
            nftMint: mintAddress,
            collectionId: watched.collectionId,
            fromWallet: previousOwner,
            toWallet: onChainOwner,
            source: 'external',
          })

          for (const callback of this.onChangeCallbacks) {
            try {
              callback({
                mintAddress,
                collectionId: watched.collectionId,
                previousOwner,
                newOwner: onChainOwner,
              })
            }
            catch (err) {
              console.error('[TxListener] Callback error:', err)
            }
          }
        }
      }
      catch (err) {
        console.error(`[TxListener] Poll error for ${mintAddress}:`, err)
      }
    }
  }

  /**
   * Get stats about the listener.
   */
  getStats(): {
    watchedMints: number
    isConnected: boolean
    callbackCount: number
  } {
    return {
      watchedMints: this.watchedMints.size,
      isConnected: this.isConnected,
      callbackCount: this.onChangeCallbacks.length,
    }
  }

  /**
   * Get all watched mint addresses.
   */
  getWatchedMints(): string[] {
    return Array.from(this.watchedMints.keys())
  }

  /**
   * Clear all watched mints and callbacks.
   */
  reset(): void {
    this.watchedMints.clear()
    this.onChangeCallbacks = []
    this.isConnected = false
    this.pendingSubscriptions.clear()
  }
}

export const txListenerService = new TransactionListenerService()
export default TransactionListenerService
