import { Action } from '@stacksjs/actions'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'
import { getTokenService } from '../../Services/TokenService'

export default new Action({
  name: 'TransferTokens',
  description: 'Transfer tokens between wallets',
  method: 'POST',

  async handle(request: RequestInstance) {
    const body = await request.json()

    const { mintAddress, amount, fromWallet, toWallet } = body

    if (!mintAddress || !amount || !fromWallet || !toWallet) {
      return response.json({
        error: 'mintAddress, amount, fromWallet, and toWallet are required',
      }, 400)
    }

    if (typeof amount !== 'number' || amount <= 0) {
      return response.json({
        error: 'amount must be a positive number',
      }, 400)
    }

    if (fromWallet === toWallet) {
      return response.json({
        error: 'Cannot transfer to the same wallet',
      }, 400)
    }

    try {
      const tokenService = getTokenService()
      const result = await tokenService.transferTokens({
        mintAddress,
        amount,
        fromWallet,
        toWallet,
      })

      return response.json({
        success: true,
        signature: result.signature,
        amount: result.amount,
      })
    }
    catch (error) {
      return response.json({
        error: 'Failed to transfer tokens',
        details: error instanceof Error ? error.message : 'Unknown error',
      }, 500)
    }
  },
})
