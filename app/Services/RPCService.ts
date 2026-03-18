/**
 * RPC service with failover, batching, and connection management.
 */

interface RPCConfig {
  primary: string
  fallback: string[]
  timeout: number
}

class RPCService {
  private config: RPCConfig
  private currentEndpoint: string
  private failoverIndex: number = -1

  constructor() {
    const env = typeof Bun !== 'undefined' ? Bun.env : process.env
    this.config = {
      primary: env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
      fallback: (env.SOLANA_RPC_FALLBACK || '').split(',').filter(Boolean),
      timeout: Number(env.SOLANA_RPC_TIMEOUT || 30000),
    }
    this.currentEndpoint = this.config.primary
  }

  get endpoint(): string {
    return this.currentEndpoint
  }

  async call(method: string, params: any[] = []): Promise<any> {
    const endpoints = [this.config.primary, ...this.config.fallback]

    for (let i = 0; i < endpoints.length; i++) {
      const endpoint = endpoints[i]
      try {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), this.config.timeout)

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: Date.now(),
            method,
            params,
          }),
          signal: controller.signal,
        })

        clearTimeout(timeout)

        if (!res.ok) throw new Error(`RPC error: ${res.status}`)

        const data = await res.json()
        if (data.error) throw new Error(data.error.message || 'RPC error')

        // Update current endpoint on success
        this.currentEndpoint = endpoint
        return data.result
      }
      catch (err) {
        console.error(`RPC call failed on ${endpoint}:`, err)
        // Try next endpoint
        continue
      }
    }

    throw new Error('All RPC endpoints failed')
  }

  // Batch multiple RPC calls into a single request
  async batchCall(calls: { method: string, params: any[] }[]): Promise<any[]> {
    const body = calls.map((call, i) => ({
      jsonrpc: '2.0',
      id: i,
      method: call.method,
      params: call.params,
    }))

    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), this.config.timeout)

      const res = await fetch(this.currentEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      })

      clearTimeout(timeout)

      const data = await res.json()
      return Array.isArray(data)
        ? data.sort((a: any, b: any) => a.id - b.id).map((d: any) => d.result)
        : [data.result]
    }
    catch (err) {
      // Fallback to individual calls
      return Promise.all(calls.map(call => this.call(call.method, call.params)))
    }
  }

  // Batch get multiple accounts
  async batchGetAccounts(addresses: string[]): Promise<any[]> {
    const calls = addresses.map(addr => ({
      method: 'getAccountInfo',
      params: [addr, { encoding: 'jsonParsed' }],
    }))
    return this.batchCall(calls)
  }
}

export const rpcService = new RPCService()
export default RPCService
