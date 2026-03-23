/**
 * MarketplaceWS — Browser WebSocket client for real-time marketplace updates.
 *
 * Features:
 *   - Auto-reconnect with exponential backoff
 *   - Channel-based subscriptions
 *   - Event listeners by type
 *   - Heartbeat (pong) response
 *   - Automatic resubscription after reconnect
 *
 * Usage:
 *   const ws = new MarketplaceWS()
 *   ws.subscribe('collection:hoodies')
 *   ws.subscribe('nft:ABC123')
 *   ws.on('marketplace_event', (data) => {
 *     if (data.type === 'sale') updateFloorPrice(data.price)
 *     if (data.type === 'listing') addNewListing(data)
 *   })
 *   ws.on('subscribed', (data) => console.log('Subscribed to:', data.channels))
 */

// eslint-disable-next-line no-unused-vars
class MarketplaceWS {
  /**
   * @param {Object} options
   * @param {string} [options.url] - WebSocket URL (defaults to wss://{current host}/ws)
   * @param {number} [options.maxReconnectDelay] - Max delay between reconnects in ms
   */
  constructor(options) {
    options = options || {}
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    this.url = options.url || protocol + '//' + window.location.host + '/ws'
    this.maxReconnectDelay = options.maxReconnectDelay || 30000
    this.reconnectDelay = 1000
    this.listeners = new Map()
    this.subscriptions = new Set()
    this.ws = null
    this.isConnected = false
    this.reconnectTimer = null

    this.connect()
  }

  /**
   * Establish WebSocket connection.
   */
  connect() {
    if (this.ws && (this.ws.readyState === WebSocket.CONNECTING || this.ws.readyState === WebSocket.OPEN)) {
      return
    }

    try {
      this.ws = new WebSocket(this.url)
    }
    catch (err) {
      console.error('[MarketplaceWS] Failed to create WebSocket:', err)
      this.scheduleReconnect()
      return
    }

    this.ws.onopen = () => {
      this.isConnected = true
      this.reconnectDelay = 1000

      // Resubscribe to all channels after reconnect
      if (this.subscriptions.size > 0) {
        this.ws.send(JSON.stringify({
          type: 'subscribe',
          channels: Array.from(this.subscriptions),
        }))
      }

      this.emit('connected', {})
    }

    this.ws.onmessage = (event) => {
      var msg
      try {
        msg = JSON.parse(event.data)
      }
      catch (e) {
        return
      }

      // Respond to server pings
      if (msg.type === 'ping') {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({ type: 'pong' }))
        }
        return
      }

      // Dispatch to listeners
      this.emit(msg.type, msg.data || {})
    }

    this.ws.onclose = () => {
      this.isConnected = false
      this.emit('disconnected', {})
      this.scheduleReconnect()
    }

    this.ws.onerror = () => {
      // onclose will fire after onerror
    }
  }

  /**
   * Schedule a reconnection attempt with exponential backoff.
   */
  scheduleReconnect() {
    if (this.reconnectTimer) return

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      this.connect()
    }, this.reconnectDelay)

    this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxReconnectDelay)
  }

  /**
   * Subscribe to a channel.
   * @param {string} channel - e.g., 'collection:hoodies', 'nft:ABC123', 'wallet:XYZ'
   */
  subscribe(channel) {
    this.subscriptions.add(channel)
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'subscribe',
        channels: [channel],
      }))
    }
  }

  /**
   * Unsubscribe from a channel.
   * @param {string} channel
   */
  unsubscribe(channel) {
    this.subscriptions.delete(channel)
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'unsubscribe',
        channels: [channel],
      }))
    }
  }

  /**
   * Register an event listener.
   * @param {string} eventType - e.g., 'marketplace_event', 'subscribed', 'connected'
   * @param {Function} handler - Callback receiving the event data
   * @returns {Function} Unsubscribe function
   */
  on(eventType, handler) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, [])
    }
    this.listeners.get(eventType).push(handler)

    // Return unsubscribe function
    return () => {
      var handlers = this.listeners.get(eventType)
      if (handlers) {
        var idx = handlers.indexOf(handler)
        if (idx !== -1) handlers.splice(idx, 1)
      }
    }
  }

  /**
   * Register a one-time event listener.
   * @param {string} eventType
   * @param {Function} handler
   */
  once(eventType, handler) {
    var unsubscribe = this.on(eventType, function onceHandler(data) {
      unsubscribe()
      handler(data)
    })
  }

  /**
   * Emit an event to all registered listeners.
   * @param {string} eventType
   * @param {Object} data
   */
  emit(eventType, data) {
    var handlers = this.listeners.get(eventType)
    if (!handlers) return
    // Copy array to handle removals during iteration
    var handlersSnapshot = handlers.slice()
    for (var i = 0; i < handlersSnapshot.length; i++) {
      try {
        handlersSnapshot[i](data)
      }
      catch (err) {
        console.error('[MarketplaceWS] Handler error:', err)
      }
    }
  }

  /**
   * Disconnect and stop reconnecting.
   */
  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    if (this.ws) {
      this.ws.onclose = null // Prevent reconnect
      this.ws.close()
      this.ws = null
    }
    this.isConnected = false
  }

  /**
   * Get current connection state.
   * @returns {{ connected: boolean, subscriptions: string[], reconnecting: boolean }}
   */
  getState() {
    return {
      connected: this.isConnected,
      subscriptions: Array.from(this.subscriptions),
      reconnecting: this.reconnectTimer !== null,
    }
  }
}

// Export for module environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MarketplaceWS
}
