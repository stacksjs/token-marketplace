/**
 * WebSocket Service
 *
 * Channel-based WebSocket server for real-time marketplace updates.
 * Clients subscribe to channels (per-collection, per-NFT, per-wallet)
 * and receive events when marketplace state changes.
 *
 * Channels:
 *   - collection:{slug}  — floor price, listed count, new listings
 *   - nft:{mint}          — offers, price changes, ownership
 *   - wallet:{address}    — portfolio changes, offers received
 *
 * Integration:
 *   - Called from IndexerService when ownership changes
 *   - Called from marketplace Actions (list, buy, offer) on success
 *   - Called from TransactionListenerService on external transfers
 */

// ============================================
// Types
// ============================================

interface WSClient {
  id: string
  ws: WebSocket
  subscriptions: Set<string>
  lastPing: number
  connectedAt: number
}

export interface MarketplaceWSEvent {
  type: string
  data: Record<string, unknown>
  timestamp: number
}

export interface BroadcastPayload {
  type: string
  nftMint?: string
  collectionSlug?: string
  price?: number
  from?: string
  to?: string
  txSignature?: string
  [key: string]: unknown
}

// ============================================
// WebSocketService
// ============================================

class WebSocketService {
  private clients: Map<string, WSClient> = new Map()
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null
  private readonly HEARTBEAT_INTERVAL = 30_000
  private readonly STALE_THRESHOLD = 90_000 // 3 missed heartbeats

  /**
   * Handle a new WebSocket connection.
   * Registers the client and sets up message handling.
   */
  handleConnection(ws: WebSocket, clientId: string): void {
    const client: WSClient = {
      id: clientId,
      ws,
      subscriptions: new Set(),
      lastPing: Date.now(),
      connectedAt: Date.now(),
    }

    this.clients.set(clientId, client)

    ws.addEventListener('message', (event) => {
      this.handleMessage(clientId, event)
    })

    ws.addEventListener('close', () => {
      this.clients.delete(clientId)
    })

    ws.addEventListener('error', () => {
      this.clients.delete(clientId)
    })
  }

  /**
   * Handle incoming WebSocket messages from clients.
   */
  private handleMessage(clientId: string, event: MessageEvent): void {
    const client = this.clients.get(clientId)
    if (!client) return

    let msg: { type: string, channels?: string[] }
    try {
      msg = JSON.parse(typeof event.data === 'string' ? event.data : '')
    }
    catch {
      return
    }

    switch (msg.type) {
      case 'subscribe':
        if (Array.isArray(msg.channels)) {
          for (const channel of msg.channels) {
            if (typeof channel === 'string' && channel.length > 0) {
              client.subscriptions.add(channel)
            }
          }
          this.send(client.ws, {
            type: 'subscribed',
            data: { channels: Array.from(client.subscriptions) },
            timestamp: Date.now(),
          })
        }
        break

      case 'unsubscribe':
        if (Array.isArray(msg.channels)) {
          for (const channel of msg.channels) {
            client.subscriptions.delete(channel)
          }
        }
        break

      case 'pong':
        client.lastPing = Date.now()
        break
    }
  }

  /**
   * Subscribe a client to channels programmatically.
   */
  subscribe(clientId: string, channels: string[]): void {
    const client = this.clients.get(clientId)
    if (!client) return

    for (const channel of channels) {
      client.subscriptions.add(channel)
    }
  }

  /**
   * Unsubscribe a client from channels.
   */
  unsubscribe(clientId: string, channels: string[]): void {
    const client = this.clients.get(clientId)
    if (!client) return

    for (const channel of channels) {
      client.subscriptions.delete(channel)
    }
  }

  /**
   * Broadcast an event to all clients subscribed to any of the given channels.
   */
  broadcast(channels: string[], event: MarketplaceWSEvent): void {
    const payload = JSON.stringify(event)

    for (const [_clientId, client] of this.clients) {
      if (!this.isOpen(client.ws)) continue

      const isSubscribed = channels.some(ch => client.subscriptions.has(ch))
      if (isSubscribed) {
        this.sendRaw(client.ws, payload)
      }
    }
  }

  /**
   * Broadcast a marketplace event with automatic channel resolution.
   * Determines which channels to notify based on the event data.
   */
  broadcastMarketplaceEvent(event: BroadcastPayload): void {
    const channels: string[] = []

    if (event.collectionSlug) {
      channels.push(`collection:${event.collectionSlug}`)
    }

    if (event.nftMint) {
      channels.push(`nft:${event.nftMint}`)
    }

    if (event.from) {
      channels.push(`wallet:${event.from}`)
    }

    if (event.to) {
      channels.push(`wallet:${event.to}`)
    }

    if (channels.length === 0) return

    this.broadcast(channels, {
      type: 'marketplace_event',
      data: event as Record<string, unknown>,
      timestamp: Date.now(),
    })
  }

  /**
   * Send a message to all connected clients (no channel filter).
   */
  broadcastAll(event: MarketplaceWSEvent): void {
    const payload = JSON.stringify(event)

    for (const [_clientId, client] of this.clients) {
      if (this.isOpen(client.ws)) {
        this.sendRaw(client.ws, payload)
      }
    }
  }

  /**
   * Start the heartbeat interval.
   * Pings all clients and disconnects stale ones.
   */
  startHeartbeat(intervalMs?: number): void {
    if (this.heartbeatTimer) return

    const interval = intervalMs || this.HEARTBEAT_INTERVAL

    this.heartbeatTimer = setInterval(() => {
      this.pruneStaleClients()
      this.pingAll()
    }, interval)
  }

  /**
   * Stop the heartbeat interval.
   */
  stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  /**
   * Ping all connected clients.
   */
  private pingAll(): void {
    const pingMsg = JSON.stringify({ type: 'ping' })
    for (const [_clientId, client] of this.clients) {
      if (this.isOpen(client.ws)) {
        this.sendRaw(client.ws, pingMsg)
      }
    }
  }

  /**
   * Remove clients that haven't responded to pings.
   */
  private pruneStaleClients(): void {
    const now = Date.now()
    for (const [clientId, client] of this.clients) {
      if (now - client.lastPing > this.STALE_THRESHOLD) {
        try {
          client.ws.close()
        }
        catch {
          // Already closed
        }
        this.clients.delete(clientId)
      }
    }
  }

  /**
   * Disconnect a specific client.
   */
  disconnect(clientId: string): void {
    const client = this.clients.get(clientId)
    if (client) {
      try {
        client.ws.close()
      }
      catch {
        // Already closed
      }
      this.clients.delete(clientId)
    }
  }

  /**
   * Disconnect all clients and reset state.
   */
  disconnectAll(): void {
    for (const [_clientId, client] of this.clients) {
      try {
        client.ws.close()
      }
      catch {
        // Already closed
      }
    }
    this.clients.clear()
    this.stopHeartbeat()
  }

  /**
   * Get service stats for monitoring.
   */
  getStats(): {
    connectedClients: number
    totalSubscriptions: number
    channels: Record<string, number>
    heartbeatActive: boolean
  } {
    const channelCounts: Record<string, number> = {}

    let totalSubscriptions = 0
    for (const [_clientId, client] of this.clients) {
      totalSubscriptions += client.subscriptions.size
      for (const channel of client.subscriptions) {
        channelCounts[channel] = (channelCounts[channel] || 0) + 1
      }
    }

    return {
      connectedClients: this.clients.size,
      totalSubscriptions,
      channels: channelCounts,
      heartbeatActive: this.heartbeatTimer !== null,
    }
  }

  /**
   * Get the number of subscribers for a specific channel.
   */
  getChannelSubscriberCount(channel: string): number {
    let count = 0
    for (const [_clientId, client] of this.clients) {
      if (client.subscriptions.has(channel)) count++
    }
    return count
  }

  /**
   * Check if a WebSocket is in OPEN state.
   */
  private isOpen(ws: WebSocket): boolean {
    return ws.readyState === WebSocket.OPEN
  }

  /**
   * Send a typed message to a WebSocket.
   */
  private send(ws: WebSocket, event: MarketplaceWSEvent): void {
    if (this.isOpen(ws)) {
      ws.send(JSON.stringify(event))
    }
  }

  /**
   * Send a raw string to a WebSocket.
   */
  private sendRaw(ws: WebSocket, payload: string): void {
    if (this.isOpen(ws)) {
      ws.send(payload)
    }
  }
}

// Singleton
export const wsService = new WebSocketService()
export default WebSocketService
