import { Action } from '@stacksjs/actions'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'
import { tensorAggregator } from '../../Services/TensorAggregatorService'

export default new Action({
  name: 'Floor Price Comparison',
  description: 'Get floor price comparison across Hoodies, Tensor, and other marketplaces',
  method: 'GET',

  async handle(request: RequestInstance) {
    const slug = request.getParam?.('slug') || ''

    if (!slug) {
      return response.json({ error: 'Collection slug is required' }, 400)
    }

    const comparison = await tensorAggregator.getFloorComparison(slug)

    return response.json({
      collection: slug,
      ...comparison,
      apiConfigured: tensorAggregator.hasApiKey(),
    })
  },
})
