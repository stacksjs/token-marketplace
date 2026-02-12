import { Action } from '@stacksjs/actions'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'
import { getTokenService } from '../../Services/TokenService'

export default new Action({
  name: 'MintTokens',
  description: 'Mint tokens to a wallet',
  method: 'POST',

  async handle(request: RequestInstance) {
    const body = await request.json()

    const { mintAddress, amount, destinationWallet } = body

    if (!mintAddress || !amount || !destinationWallet) {
      return response.json({
        error: 'mintAddress, amount, and destinationWallet are required',
      }, 400)
    }

    if (typeof amount !== 'number' || amount <= 0) {
      return response.json({
        error: 'amount must be a positive number',
      }, 400)
    }

    try {
      const tokenService = getTokenService()
      const result = await tokenService.mintTokens({
        mintAddress,
        amount,
        destinationWallet,
      })

      return response.json({
        success: true,
        signature: result.signature,
        amount: result.amount,
        destination: result.destination,
      })
    }
    catch (error) {
      return response.json({
        error: 'Failed to mint tokens',
        details: error instanceof Error ? error.message : 'Unknown error',
      }, 500)
    }
  },
})
