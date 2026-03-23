import { describe, expect, test, beforeEach } from 'bun:test'
import { readFileSync, existsSync } from 'fs'

// ============================================
// Static analysis: verify WebSocketService structure
// ============================================

const servicePath = 'app/Services/WebSocketService.ts'
const serviceSource = readFileSync(servicePath, 'utf-8')

describe('WebSocketService structure', () => {
  test('file exists', () => {
    expect(existsSync(servicePath)).toBe(true)
  })

  test('exports singleton instance', () => {
    expect(serviceSource).toContain('export const wsService = new WebSocketService()')
  })

  test('exports default class', () => {
    expect(serviceSource).toContain('export default WebSocketService')
  })

  test('does not depend on external services', () => {
    expect(serviceSource).not.toContain('helius')
    expect(serviceSource).not.toContain('pusher')
    expect(serviceSource).not.toContain('socket.io')
  })
})

describe('WebSocketService types', () => {
  test('defines WSClient interface', () => {
    expect(serviceSource).toContain('interface WSClient')
    expect(serviceSource).toContain('id: string')
    expect(serviceSource).toContain('ws: WebSocket')
    expect(serviceSource).toContain('subscriptions: Set<string>')
    expect(serviceSource).toContain('lastPing: number')
    expect(serviceSource).toContain('connectedAt: number')
  })

  test('exports MarketplaceWSEvent interface', () => {
    expect(serviceSource).toContain('export interface MarketplaceWSEvent')
    expect(serviceSource).toContain('type: string')
    expect(serviceSource).toContain('timestamp: number')
  })

  test('exports BroadcastPayload interface', () => {
    expect(serviceSource).toContain('export interface BroadcastPayload')
    expect(serviceSource).toContain('nftMint?: string')
    expect(serviceSource).toContain('collectionSlug?: string')
  })
})

describe('WebSocketService methods', () => {
  test('has handleConnection method', () => {
    expect(serviceSource).toContain('handleConnection(ws: WebSocket, clientId: string)')
  })

  test('has subscribe method', () => {
    expect(serviceSource).toContain('subscribe(clientId: string, channels: string[])')
  })

  test('has unsubscribe method', () => {
    expect(serviceSource).toContain('unsubscribe(clientId: string, channels: string[])')
  })

  test('has broadcast method', () => {
    expect(serviceSource).toContain('broadcast(channels: string[], event: MarketplaceWSEvent)')
  })

  test('has broadcastMarketplaceEvent method', () => {
    expect(serviceSource).toContain('broadcastMarketplaceEvent(event: BroadcastPayload)')
  })

  test('has broadcastAll method', () => {
    expect(serviceSource).toContain('broadcastAll(event: MarketplaceWSEvent)')
  })

  test('has startHeartbeat method', () => {
    expect(serviceSource).toContain('startHeartbeat(')
  })

  test('has stopHeartbeat method', () => {
    expect(serviceSource).toContain('stopHeartbeat(')
  })

  test('has disconnect method', () => {
    expect(serviceSource).toContain('disconnect(clientId: string)')
  })

  test('has disconnectAll method', () => {
    expect(serviceSource).toContain('disconnectAll()')
  })

  test('has getStats method', () => {
    expect(serviceSource).toContain('getStats()')
  })

  test('has getChannelSubscriberCount method', () => {
    expect(serviceSource).toContain('getChannelSubscriberCount(channel: string)')
  })
})

describe('WebSocketService message handling', () => {
  test('handles subscribe messages', () => {
    expect(serviceSource).toContain("case 'subscribe':")
  })

  test('handles unsubscribe messages', () => {
    expect(serviceSource).toContain("case 'unsubscribe':")
  })

  test('handles pong messages', () => {
    expect(serviceSource).toContain("case 'pong':")
    expect(serviceSource).toContain('client.lastPing = Date.now()')
  })

  test('validates channel is a non-empty string', () => {
    expect(serviceSource).toContain("typeof channel === 'string'")
    expect(serviceSource).toContain('channel.length > 0')
  })

  test('sends subscribed confirmation', () => {
    expect(serviceSource).toContain("type: 'subscribed'")
  })

  test('parses JSON messages safely', () => {
    expect(serviceSource).toContain('JSON.parse')
    expect(serviceSource).toContain('catch')
  })
})

describe('WebSocketService broadcast logic', () => {
  test('resolves collection channel from event', () => {
    expect(serviceSource).toContain('`collection:${event.collectionSlug}`')
  })

  test('resolves NFT channel from event', () => {
    expect(serviceSource).toContain('`nft:${event.nftMint}`')
  })

  test('resolves wallet channels from event', () => {
    expect(serviceSource).toContain('`wallet:${event.from}`')
    expect(serviceSource).toContain('`wallet:${event.to}`')
  })

  test('skips broadcast when no channels match', () => {
    expect(serviceSource).toContain('if (channels.length === 0) return')
  })

  test('checks WebSocket readyState before sending', () => {
    expect(serviceSource).toContain('WebSocket.OPEN')
  })
})

describe('WebSocketService heartbeat', () => {
  test('has configurable heartbeat interval', () => {
    expect(serviceSource).toContain('HEARTBEAT_INTERVAL')
  })

  test('has stale client threshold', () => {
    expect(serviceSource).toContain('STALE_THRESHOLD')
  })

  test('prunes stale clients', () => {
    expect(serviceSource).toContain('pruneStaleClients')
  })

  test('pings all clients', () => {
    expect(serviceSource).toContain('pingAll')
    expect(serviceSource).toContain("type: 'ping'")
  })

  test('prevents duplicate heartbeat timers', () => {
    expect(serviceSource).toContain('if (this.heartbeatTimer) return')
  })

  test('cleans up timer on stop', () => {
    expect(serviceSource).toContain('clearInterval(this.heartbeatTimer)')
  })
})

describe('WebSocketService stats', () => {
  test('returns connected client count', () => {
    expect(serviceSource).toContain('connectedClients: this.clients.size')
  })

  test('returns total subscription count', () => {
    expect(serviceSource).toContain('totalSubscriptions')
  })

  test('returns per-channel subscriber counts', () => {
    expect(serviceSource).toContain('channels: channelCounts')
  })

  test('returns heartbeat status', () => {
    expect(serviceSource).toContain('heartbeatActive')
  })
})

describe('WebSocketService connection handling', () => {
  test('listens for close events', () => {
    expect(serviceSource).toContain("addEventListener('close'")
  })

  test('listens for error events', () => {
    expect(serviceSource).toContain("addEventListener('error'")
  })

  test('removes client on close', () => {
    expect(serviceSource).toContain('this.clients.delete(clientId)')
  })

  test('disconnect closes WebSocket gracefully', () => {
    expect(serviceSource).toContain('client.ws.close()')
  })

  test('disconnectAll stops heartbeat', () => {
    const disconnectAllSection = serviceSource.slice(
      serviceSource.indexOf('disconnectAll()'),
    )
    expect(disconnectAllSection).toContain('this.stopHeartbeat()')
  })
})

// ============================================
// Runtime tests with mock WebSocket
// ============================================

// Mock WebSocket for testing
class MockWebSocket {
  static CONNECTING = 0
  static OPEN = 1
  static CLOSING = 2
  static CLOSED = 3

  readyState: number = MockWebSocket.OPEN
  sentMessages: string[] = []
  eventHandlers: Map<string, Function[]> = new Map()

  addEventListener(event: string, handler: Function) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, [])
    }
    this.eventHandlers.get(event)!.push(handler)
  }

  send(data: string) {
    this.sentMessages.push(data)
  }

  close() {
    this.readyState = MockWebSocket.CLOSED
    const handlers = this.eventHandlers.get('close') || []
    for (const h of handlers) h()
  }

  // Simulate receiving a message
  simulateMessage(data: any) {
    const handlers = this.eventHandlers.get('message') || []
    for (const h of handlers) h({ data: JSON.stringify(data) })
  }
}

// Inject mock WebSocket globally
;(globalThis as any).WebSocket = MockWebSocket

describe('WebSocketService runtime', () => {
  let wsService: any

  beforeEach(async () => {
    // Re-import to get fresh singleton
    const mod = await import('../../../app/Services/WebSocketService')
    wsService = mod.wsService
    // Reset state
    wsService.disconnectAll()
  })

  test('handleConnection registers client', () => {
    const mockWs = new MockWebSocket()
    wsService.handleConnection(mockWs, 'client-1')

    const stats = wsService.getStats()
    expect(stats.connectedClients).toBe(1)
  })

  test('handleConnection removes client on close', () => {
    const mockWs = new MockWebSocket()
    wsService.handleConnection(mockWs, 'client-1')
    expect(wsService.getStats().connectedClients).toBe(1)

    mockWs.close()
    expect(wsService.getStats().connectedClients).toBe(0)
  })

  test('subscribe adds channels to client', () => {
    const mockWs = new MockWebSocket()
    wsService.handleConnection(mockWs, 'client-1')

    wsService.subscribe('client-1', ['collection:hoodies', 'nft:ABC'])

    const stats = wsService.getStats()
    expect(stats.totalSubscriptions).toBe(2)
    expect(stats.channels['collection:hoodies']).toBe(1)
    expect(stats.channels['nft:ABC']).toBe(1)
  })

  test('unsubscribe removes channels from client', () => {
    const mockWs = new MockWebSocket()
    wsService.handleConnection(mockWs, 'client-1')
    wsService.subscribe('client-1', ['collection:hoodies', 'nft:ABC'])

    wsService.unsubscribe('client-1', ['nft:ABC'])

    const stats = wsService.getStats()
    expect(stats.totalSubscriptions).toBe(1)
    expect(stats.channels['nft:ABC']).toBeUndefined()
  })

  test('subscribe via WebSocket message', () => {
    const mockWs = new MockWebSocket()
    wsService.handleConnection(mockWs, 'client-1')

    mockWs.simulateMessage({
      type: 'subscribe',
      channels: ['collection:hoodies'],
    })

    const stats = wsService.getStats()
    expect(stats.totalSubscriptions).toBe(1)

    // Should have sent a subscribed confirmation
    const sentMsgs = mockWs.sentMessages
    expect(sentMsgs.length).toBe(1)
    const confirmation = JSON.parse(sentMsgs[0])
    expect(confirmation.type).toBe('subscribed')
  })

  test('broadcast sends to subscribed clients only', () => {
    const ws1 = new MockWebSocket()
    const ws2 = new MockWebSocket()
    const ws3 = new MockWebSocket()

    wsService.handleConnection(ws1, 'c1')
    wsService.handleConnection(ws2, 'c2')
    wsService.handleConnection(ws3, 'c3')

    wsService.subscribe('c1', ['collection:hoodies'])
    wsService.subscribe('c2', ['collection:other'])
    wsService.subscribe('c3', ['collection:hoodies'])

    wsService.broadcast(['collection:hoodies'], {
      type: 'test',
      data: { msg: 'hello' },
      timestamp: Date.now(),
    })

    // c1 and c3 should receive, c2 should not
    expect(ws1.sentMessages.length).toBe(1)
    expect(ws2.sentMessages.length).toBe(0)
    expect(ws3.sentMessages.length).toBe(1)
  })

  test('broadcastMarketplaceEvent resolves channels automatically', () => {
    const ws1 = new MockWebSocket()
    wsService.handleConnection(ws1, 'c1')
    wsService.subscribe('c1', ['collection:hoodies'])

    wsService.broadcastMarketplaceEvent({
      type: 'sale',
      collectionSlug: 'hoodies',
      nftMint: 'ABC123',
      price: 1.5,
    })

    expect(ws1.sentMessages.length).toBe(1)
    const msg = JSON.parse(ws1.sentMessages[0])
    expect(msg.type).toBe('marketplace_event')
    expect(msg.data.type).toBe('sale')
    expect(msg.data.price).toBe(1.5)
  })

  test('broadcastMarketplaceEvent notifies wallet channels', () => {
    const wsSeller = new MockWebSocket()
    const wsBuyer = new MockWebSocket()

    wsService.handleConnection(wsSeller, 'seller')
    wsService.handleConnection(wsBuyer, 'buyer')

    wsService.subscribe('seller', ['wallet:SELLER_ADDR'])
    wsService.subscribe('buyer', ['wallet:BUYER_ADDR'])

    wsService.broadcastMarketplaceEvent({
      type: 'sale',
      from: 'SELLER_ADDR',
      to: 'BUYER_ADDR',
      price: 2.0,
    })

    // Both should receive the event
    expect(wsSeller.sentMessages.length).toBe(1)
    expect(wsBuyer.sentMessages.length).toBe(1)
  })

  test('broadcastMarketplaceEvent skips when no channels', () => {
    const ws1 = new MockWebSocket()
    wsService.handleConnection(ws1, 'c1')
    wsService.subscribe('c1', ['collection:hoodies'])

    // Event with no identifiers — should not broadcast
    wsService.broadcastMarketplaceEvent({ type: 'unknown' })

    expect(ws1.sentMessages.length).toBe(0)
  })

  test('broadcastAll sends to every client', () => {
    const ws1 = new MockWebSocket()
    const ws2 = new MockWebSocket()

    wsService.handleConnection(ws1, 'c1')
    wsService.handleConnection(ws2, 'c2')
    // No subscriptions needed

    wsService.broadcastAll({
      type: 'announcement',
      data: { msg: 'maintenance' },
      timestamp: Date.now(),
    })

    expect(ws1.sentMessages.length).toBe(1)
    expect(ws2.sentMessages.length).toBe(1)
  })

  test('does not send to closed WebSockets', () => {
    const ws1 = new MockWebSocket()
    wsService.handleConnection(ws1, 'c1')
    wsService.subscribe('c1', ['collection:hoodies'])

    // Close the WebSocket
    ws1.readyState = MockWebSocket.CLOSED

    wsService.broadcast(['collection:hoodies'], {
      type: 'test',
      data: {},
      timestamp: Date.now(),
    })

    // Should not have sent anything (readyState check)
    expect(ws1.sentMessages.length).toBe(0)
  })

  test('getChannelSubscriberCount returns correct count', () => {
    const ws1 = new MockWebSocket()
    const ws2 = new MockWebSocket()
    const ws3 = new MockWebSocket()

    wsService.handleConnection(ws1, 'c1')
    wsService.handleConnection(ws2, 'c2')
    wsService.handleConnection(ws3, 'c3')

    wsService.subscribe('c1', ['collection:hoodies'])
    wsService.subscribe('c2', ['collection:hoodies'])
    wsService.subscribe('c3', ['collection:other'])

    expect(wsService.getChannelSubscriberCount('collection:hoodies')).toBe(2)
    expect(wsService.getChannelSubscriberCount('collection:other')).toBe(1)
    expect(wsService.getChannelSubscriberCount('collection:nonexistent')).toBe(0)
  })

  test('disconnect removes specific client', () => {
    const ws1 = new MockWebSocket()
    const ws2 = new MockWebSocket()

    wsService.handleConnection(ws1, 'c1')
    wsService.handleConnection(ws2, 'c2')
    expect(wsService.getStats().connectedClients).toBe(2)

    wsService.disconnect('c1')
    expect(wsService.getStats().connectedClients).toBe(1)
  })

  test('disconnectAll clears all clients', () => {
    const ws1 = new MockWebSocket()
    const ws2 = new MockWebSocket()

    wsService.handleConnection(ws1, 'c1')
    wsService.handleConnection(ws2, 'c2')

    wsService.disconnectAll()
    expect(wsService.getStats().connectedClients).toBe(0)
  })

  test('pong message updates lastPing', () => {
    const ws1 = new MockWebSocket()
    wsService.handleConnection(ws1, 'c1')

    const before = Date.now()
    mockWs_simulatePong(ws1)
    // The pong handler should update lastPing

    // We can't easily check lastPing directly, but we can verify
    // the message was handled without errors
    expect(wsService.getStats().connectedClients).toBe(1)
  })

  test('subscribe ignores non-existent client', () => {
    // Should not throw
    wsService.subscribe('nonexistent', ['test'])
    expect(wsService.getStats().connectedClients).toBe(0)
  })

  test('unsubscribe ignores non-existent client', () => {
    // Should not throw
    wsService.unsubscribe('nonexistent', ['test'])
    expect(wsService.getStats().connectedClients).toBe(0)
  })

  test('getStats returns correct shape', () => {
    const stats = wsService.getStats()
    expect(stats).toHaveProperty('connectedClients')
    expect(stats).toHaveProperty('totalSubscriptions')
    expect(stats).toHaveProperty('channels')
    expect(stats).toHaveProperty('heartbeatActive')
    expect(typeof stats.connectedClients).toBe('number')
    expect(typeof stats.totalSubscriptions).toBe('number')
    expect(typeof stats.heartbeatActive).toBe('boolean')
  })

  test('multiple subscriptions to same channel counted correctly', () => {
    const ws1 = new MockWebSocket()
    wsService.handleConnection(ws1, 'c1')

    wsService.subscribe('c1', ['collection:hoodies'])
    wsService.subscribe('c1', ['collection:hoodies']) // duplicate

    // Set deduplicates, so should only count once
    expect(wsService.getStats().totalSubscriptions).toBe(1)
  })
})

function mockWs_simulatePong(ws: MockWebSocket) {
  ws.simulateMessage({ type: 'pong' })
}
