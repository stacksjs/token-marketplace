import { Action } from '@stacksjs/actions'
import { db } from '@stacksjs/database'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'
import { compressedNFTService } from '../../Services/CompressedNFTService'
import { indexerService } from '../../Services/IndexerService'

export default new Action({
  name: 'Mint Compressed NFT',
  description: 'Mint one or more compressed NFTs to a merkle tree using Bubblegum',
  method: 'POST',

  async handle(request: RequestInstance) {
    const body = request.all?.() || {}
    const { collectionSlug, wallet, quantity = 1, metadata } = body

    if (!collectionSlug || !wallet) {
      return response.json({ error: 'collectionSlug and wallet are required' }, 400)
    }

    if (quantity < 1 || quantity > 100) {
      return response.json({ error: 'quantity must be between 1 and 100' }, 400)
    }

    // Look up collection
    let collection: any
    try {
      collection = await db
        .selectFrom('collections')
        .selectAll()
        .where('slug', '=', collectionSlug)
        .executeTakeFirst()
    }
    catch {
      return response.json({ error: 'Failed to look up collection' }, 500)
    }

    if (!collection) {
      return response.json({ error: 'Collection not found' }, 404)
    }

    // Find an available tree with capacity
    const tree = await compressedNFTService.findAvailableTree(String(collection.id))

    if (!tree || tree.remainingCapacity < quantity) {
      return response.json({
        error: 'No merkle tree with sufficient capacity',
        hint: 'Create a new merkle tree via POST /api/cnft/tree',
        availableCapacity: tree?.remainingCapacity || 0,
        requested: quantity,
      }, 409)
    }

    // In production, this would call tokenService.mintCompressedNFT()
    // For now, record the mint in the database
    const minted: Array<{ assetId: string, leafIndex: number }> = []

    for (let i = 0; i < quantity; i++) {
      const leafIndex = tree.usedLeaves + i
      const assetId = `${tree.address}:${leafIndex}`

      try {
        // Index the cNFT
        await indexerService.indexOnMint(db, {
          mintAddress: assetId,
          name: metadata?.name || `${collection.name} #${leafIndex}`,
          imageUrl: metadata?.image || '',
          metadataUri: metadata?.uri || '',
          collectionId: String(collection.id),
          ownerWallet: wallet,
          compressed: true,
          treeAddress: tree.address,
          leafIndex,
        })

        minted.push({ assetId, leafIndex })
      }
      catch {
        // Continue with remaining mints
      }
    }

    // Update tree usage
    if (minted.length > 0) {
      await compressedNFTService.incrementTreeUsage(tree.address, minted.length)
    }

    return response.json({
      success: true,
      minted: minted.length,
      items: minted,
      tree: {
        address: tree.address,
        remainingCapacity: tree.remainingCapacity - minted.length,
      },
    })
  },
})
