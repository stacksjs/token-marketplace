import { Action } from '@stacksjs/actions'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'
import { compressedNFTService } from '../../Services/CompressedNFTService'

export default new Action({
  name: 'Create Merkle Tree',
  description: 'Provision a new merkle tree for compressed NFT minting',
  method: 'POST',

  async handle(request: RequestInstance) {
    const body = request.all?.() || {}
    const { collectionId, preset, maxDepth, maxBufferSize, canopyDepth } = body

    if (!collectionId) {
      return response.json({ error: 'collectionId is required' }, 400)
    }

    // Use preset or custom config
    let config = preset ? compressedNFTService.getPreset(preset) : undefined

    if (!config) {
      config = {
        maxDepth: maxDepth || 14,
        maxBufferSize: maxBufferSize || 64,
        canopyDepth: canopyDepth || 11,
      }
    }

    // Validate depth range
    if (config.maxDepth < 3 || config.maxDepth > 30) {
      return response.json({ error: 'maxDepth must be between 3 and 30' }, 400)
    }

    const capacity = compressedNFTService.calculateCapacity(config.maxDepth)
    const estimatedCost = compressedNFTService.estimateTreeCost(config)

    // In production, this would call tokenService.createMerkleTree()
    // Generate a placeholder address for now
    const treeAddress = `tree_${collectionId}_${Date.now()}`

    await compressedNFTService.registerTree(treeAddress, collectionId, config)

    return response.json({
      success: true,
      tree: {
        address: treeAddress,
        collectionId,
        maxDepth: config.maxDepth,
        maxBufferSize: config.maxBufferSize,
        canopyDepth: config.canopyDepth,
        capacity,
        estimatedCostSol: estimatedCost,
      },
    })
  },
})
