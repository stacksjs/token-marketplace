import { Action } from '@stacksjs/actions'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'
import { launchpadService } from '../../Services/LaunchpadService'

export default new Action({
  name: 'Create Launch',
  description: 'Create a new collection launch via the creator launchpad wizard',
  method: 'POST',

  async handle(request: RequestInstance) {
    const body = request.all?.() || {}
    const { name, symbol, description, externalUrl, supply, useCompressed, sellerFeeBasisPoints, phases, creators } = body

    if (!name || !symbol || !supply || !creators) {
      return response.json({ error: 'name, symbol, supply, and creators are required' }, 400)
    }

    const config = {
      name,
      symbol,
      description: description || '',
      externalUrl,
      supply: Number(supply),
      useCompressed: Boolean(useCompressed),
      sellerFeeBasisPoints: Number(sellerFeeBasisPoints || 500),
      phases: phases || [{ name: 'Public', price: 0, startDate: new Date().toISOString(), maxPerWallet: 10 }],
      creators,
    }

    // Validate
    const validation = launchpadService.validateConfig(config)
    if (!validation.valid) {
      return response.json({ error: 'Validation failed', errors: validation.errors }, 400)
    }

    const result = await launchpadService.createLaunch(config)

    if (!result.success) {
      return response.json({ error: result.error }, 409)
    }

    return response.json({
      success: true,
      collectionId: result.collectionId,
      slug: result.collectionSlug,
      launchpadUrl: `/collections/${result.collectionSlug}`,
    })
  },
})
