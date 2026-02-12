import { Action } from '@stacksjs/actions'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'

export default new Action({
  name: 'ConnectWallet',
  description: 'Connect a wallet and return the address',
  method: 'POST',

  async handle(request: RequestInstance) {
    const walletAddress = request.get('walletAddress')

    if (!walletAddress) {
      return response.json({ error: 'Wallet address is required' }, 400)
    }

    // Basic Solana address validation (base58, 32-44 chars)
    if (typeof walletAddress !== 'string' || walletAddress.length < 32 || walletAddress.length > 44) {
      return response.json({ error: 'Invalid wallet address' }, 400)
    }

    // Store in session or return for client-side state
    return response.json({
      success: true,
      address: walletAddress,
    })
  },
})
