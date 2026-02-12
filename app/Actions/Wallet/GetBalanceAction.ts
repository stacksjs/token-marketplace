import { Action } from '@stacksjs/actions'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'
import { getTokenService } from '../../Services/TokenService'

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
      const tokenService = getTokenService()
      const result = await tokenService.getBalance(walletAddress)

      return response.json({
        balance: result.sol,
        lamports: result.lamports,
      })
    }
    catch (_) {
      return response.json({ balance: 0, lamports: 0 })
    }
  },
})
