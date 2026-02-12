import { Action } from '@stacksjs/actions'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'

export default new Action({
  name: 'GetWalletBalance',
  description: 'Get SOL balance for a wallet address',
  method: 'GET',

  async handle(request: RequestInstance) {
    const walletAddress = request.getParam('walletAddress')

    if (!walletAddress || typeof walletAddress !== 'string' || walletAddress.length < 32 || walletAddress.length > 44) {
      return response.json({ error: 'Invalid wallet address' }, 400)
    }

    try {
      const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com'
      const res = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getBalance',
          params: [walletAddress],
        }),
      })
      const data = await res.json()

      if (data.result && data.result.value !== undefined) {
        const lamports = data.result.value
        const sol = lamports / 1_000_000_000
        return response.json({ balance: sol })
      }

      return response.json({ balance: 0 })
    } catch (_) {
      return response.json({ balance: 0 })
    }
  },
})
