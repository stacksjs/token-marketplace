import { Action } from '@stacksjs/actions'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'
import { compressedNFTService } from '../../Services/CompressedNFTService'

export default new Action({
  name: 'Merkle Tree Status',
  description: 'Get the status of merkle trees for a collection, including capacity and usage',
  method: 'GET',

  async handle(request: RequestInstance) {
    const collectionId = request.getParam?.('collectionId') || ''

    if (!collectionId) {
      // Return overall stats
      const stats = await compressedNFTService.getStats()
      const nearCapacity = await compressedNFTService.getTreesNearCapacity()

      return response.json({
        stats,
        treesNearCapacity: nearCapacity,
        presets: compressedNFTService.getPresets(),
      })
    }

    // Return collection-specific trees
    const trees = await compressedNFTService.getCollectionTrees(collectionId)
    const nearCapacity = await compressedNFTService.getTreesNearCapacity(collectionId)

    return response.json({
      collectionId,
      trees,
      treesNearCapacity: nearCapacity,
      totalCapacity: trees.reduce((sum, t) => sum + t.capacity, 0),
      totalUsed: trees.reduce((sum, t) => sum + t.usedLeaves, 0),
      totalRemaining: trees.reduce((sum, t) => sum + t.remainingCapacity, 0),
    })
  },
})
