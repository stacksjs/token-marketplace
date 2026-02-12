import { Action } from '@stacksjs/actions'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'
import { getTokenService } from '../../Services/TokenService'

export default new Action({
  name: 'CreateToken',
  description: 'Create a new fungible token',
  method: 'POST',

  async handle(request: RequestInstance) {
    const body = await request.json()

    const { name, symbol, decimals, initialSupply, uri, creators, sellerFeeBasisPoints } = body

    if (!name || !symbol || decimals === undefined) {
      return response.json({
        error: 'name, symbol, and decimals are required',
      }, 400)
    }

    if (typeof decimals !== 'number' || decimals < 0 || decimals > 18) {
      return response.json({
        error: 'decimals must be a number between 0 and 18',
      }, 400)
    }

    try {
      const tokenService = getTokenService()
      const result = await tokenService.createToken({
        name,
        symbol,
        decimals,
        initialSupply,
        uri,
        creators,
        sellerFeeBasisPoints,
      })

      return response.json({
        success: true,
        token: {
          mint: result.mint,
          metadata: result.metadata,
          signature: result.signature,
        },
      })
    }
    catch (error) {
      return response.json({
        error: 'Failed to create token',
        details: error instanceof Error ? error.message : 'Unknown error',
      }, 500)
    }
  },
})
