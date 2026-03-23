import { describe, expect, test } from 'bun:test'
import { readFileSync, existsSync } from 'fs'

// ============================================
// Static analysis: verify ws-client.js structure
// ============================================

const clientPath = 'public/js/ws-client.js'
const clientSource = readFileSync(clientPath, 'utf-8')

describe('ws-client.js file structure', () => {
  test('file exists', () => {
    expect(existsSync(clientPath)).toBe(true)
  })

  test('defines MarketplaceWS class', () => {
    expect(clientSource).toContain('class MarketplaceWS')
  })

  test('has constructor', () => {
    expect(clientSource).toContain('constructor(options)')
  })

  test('exports for module environments', () => {
    expect(clientSource).toContain('module.exports')
  })
})

describe('ws-client.js connection management', () => {
  test('has connect method', () => {
    expect(clientSource).toContain('connect()')
  })

  test('has disconnect method', () => {
    expect(clientSource).toContain('disconnect()')
  })

  test('has scheduleReconnect method', () => {
    expect(clientSource).toContain('scheduleReconnect()')
  })

  test('uses exponential backoff for reconnection', () => {
    expect(clientSource).toContain('this.reconnectDelay * 2')
    expect(clientSource).toContain('this.maxReconnectDelay')
  })

  test('resets reconnect delay on successful connection', () => {
    expect(clientSource).toContain('this.reconnectDelay = 1000')
  })

  test('defaults to wss protocol for https', () => {
    expect(clientSource).toContain("'wss:'")
    expect(clientSource).toContain("'ws:'")
  })

  test('prevents duplicate connections', () => {
    expect(clientSource).toContain('WebSocket.CONNECTING')
    expect(clientSource).toContain('WebSocket.OPEN')
  })
})

describe('ws-client.js subscription', () => {
  test('has subscribe method', () => {
    expect(clientSource).toContain('subscribe(channel)')
  })

  test('has unsubscribe method', () => {
    expect(clientSource).toContain('unsubscribe(channel)')
  })

  test('stores subscriptions in a Set', () => {
    expect(clientSource).toContain('this.subscriptions = new Set()')
    expect(clientSource).toContain('this.subscriptions.add(channel)')
    expect(clientSource).toContain('this.subscriptions.delete(channel)')
  })

  test('resubscribes after reconnect', () => {
    expect(clientSource).toContain('this.subscriptions.size > 0')
    expect(clientSource).toContain('Array.from(this.subscriptions)')
  })

  test('sends subscribe message to server', () => {
    expect(clientSource).toContain("type: 'subscribe'")
  })

  test('sends unsubscribe message to server', () => {
    expect(clientSource).toContain("type: 'unsubscribe'")
  })
})

describe('ws-client.js event handling', () => {
  test('has on method for event listeners', () => {
    expect(clientSource).toContain('on(eventType, handler)')
  })

  test('has once method for one-time listeners', () => {
    expect(clientSource).toContain('once(eventType, handler)')
  })

  test('has emit method', () => {
    expect(clientSource).toContain('emit(eventType, data)')
  })

  test('returns unsubscribe function from on()', () => {
    expect(clientSource).toContain('return () => {')
    expect(clientSource).toContain('handlers.splice(idx, 1)')
  })

  test('uses Map for listeners', () => {
    expect(clientSource).toContain('this.listeners = new Map()')
  })

  test('handles listener errors gracefully', () => {
    expect(clientSource).toContain("console.error('[MarketplaceWS] Handler error:'")
  })

  test('creates snapshot of handlers to handle removal during iteration', () => {
    expect(clientSource).toContain('handlers.slice()')
  })
})

describe('ws-client.js heartbeat', () => {
  test('responds to ping with pong', () => {
    expect(clientSource).toContain("msg.type === 'ping'")
    expect(clientSource).toContain("type: 'pong'")
  })
})

describe('ws-client.js state', () => {
  test('has getState method', () => {
    expect(clientSource).toContain('getState()')
  })

  test('tracks connected state', () => {
    expect(clientSource).toContain('this.isConnected')
  })

  test('tracks reconnecting state', () => {
    expect(clientSource).toContain('this.reconnectTimer')
  })

  test('emits connected event', () => {
    expect(clientSource).toContain("this.emit('connected'")
  })

  test('emits disconnected event', () => {
    expect(clientSource).toContain("this.emit('disconnected'")
  })
})

describe('ws-client.js message parsing', () => {
  test('parses JSON messages safely', () => {
    expect(clientSource).toContain('JSON.parse(event.data)')
  })

  test('handles parse errors gracefully', () => {
    expect(clientSource).toContain('catch (e)')
  })
})

describe('ws-client.js disconnect', () => {
  test('clears reconnect timer on disconnect', () => {
    expect(clientSource).toContain('clearTimeout(this.reconnectTimer)')
  })

  test('prevents auto-reconnect on intentional disconnect', () => {
    expect(clientSource).toContain('this.ws.onclose = null')
  })

  test('closes WebSocket on disconnect', () => {
    expect(clientSource).toContain('this.ws.close()')
  })

  test('nulls WebSocket reference', () => {
    expect(clientSource).toContain('this.ws = null')
  })
})
