import { Action } from '@stacksjs/actions'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'
import { getTokenService } from '../../Services/TokenService'

export default new Action({
  name: 'GetTokenInfo',
  description: 'Get information about a fungible token',
  method: 'GET',

  async handle(request: RequestInstance) {
    const mintAddress = request.getParam('mintAddress')

    if (!mintAddress || typeof mintAddress !== 'string' || mintAddress.length < 32 || mintAddress.length > 44) {
      return response.json({ error: 'Invalid mint address' }, 400)
    }

    try {
      const tokenService = getTokenService()
      const result = await tokenService.getTokenInfo(mintAddress)

      return response.json({
        success: true,
        token: result,
      })
    }
    catch (error) {
      return response.json({
        error: 'Failed to get token info',
        details: error instanceof Error ? error.message : 'Unknown error',
      }, 500)
    }
  },
})
