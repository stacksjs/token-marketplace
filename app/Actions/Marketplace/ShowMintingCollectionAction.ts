import { Action } from '@stacksjs/actions'
import { db } from '@stacksjs/database'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'
import { generateSlug, toCamelCase as _toCamelCase } from '../helpers'

const JSON_FIELDS = ['traits', 'config_line_settings', 'guards_config']
function toCamelCase(obj: Record<string, any>): Record<string, any> {
  return _toCamelCase(obj, JSON_FIELDS)
}

export default new Action({
  name: 'Show Minting Collection',
  description: 'Get collection data for minting page including candy machine and presale info',
  method: 'GET',

  async handle(request: RequestInstance) {
    const slug = request.getParam('slug')

    if (!slug) {
      return response.json({
        error: 'slug parameter is required',
      }, 400)
    }

    // First try to find by slug column
    let collection = await db
      .selectFrom('collections')
      .selectAll()
      .where('slug', '=', slug)
      .executeTakeFirst()

    // If not found, try to find by generated slug from name
    if (!collection) {
      const allCollections = await db
        .selectFrom('collections')
        .selectAll()
        .execute()

      collection = allCollections.find(c => generateSlug(c.name) === slug)
    }

    if (!collection) {
      return response.notFound({ error: 'Collection not found' })
    }

    // Get candy machine
    let candyMachine = null
    if (collection.candy_machine_id) {
      candyMachine = await db
        .selectFrom('candy_machines')
        .selectAll()
        .where('id', '=', collection.candy_machine_id)
        .executeTakeFirst()
    } else {
      // Try to find by collection_id
      candyMachine = await db
        .selectFrom('candy_machines')
        .selectAll()
        .where('collection_id', '=', collection.id)
        .executeTakeFirst()
    }

    // Get active presales
    const presales = await db
      .selectFrom('presales')
      .selectAll()
      .where('collection_id', '=', collection.id)
      .where('is_active', '=', 1)
      .execute()

    // Determine current presale status
    const now = new Date()
    const activePresales = presales.filter(p => {
      const startsAt = p.presale_starts_at ? new Date(p.presale_starts_at) : null
      const expiresAt = p.presale_expires_at ? new Date(p.presale_expires_at) : null

      if (startsAt && now < startsAt) return false
      if (expiresAt && now > expiresAt) return false
      return true
    })

    // Calculate minting stats
    const itemsAvailable = candyMachine?.items_available || collection.total_amount_of_nfts || 0
    const itemsRedeemed = candyMachine?.items_redeemed || 0
    const itemsRemaining = itemsAvailable - itemsRedeemed
    const percentMinted = itemsAvailable > 0 ? Math.round((itemsRedeemed / itemsAvailable) * 100) : 0

    // Get sample minted NFTs
    const mintedNfts = await db
      .selectFrom('nfts')
      .selectAll()
      .where('collection_id', '=', collection.id)
      .where('mint_address', 'is not', null)
      .orderBy('created_at', 'desc')
      .limit(8)
      .execute()

    // Determine minting status
    let mintStatus = 'not_available'
    if (candyMachine) {
      switch (candyMachine.status) {
        case 'minting':
          mintStatus = activePresales.length > 0 ? 'presale_live' : 'public_live'
          break
        case 'ready':
          mintStatus = 'ready'
          break
        case 'sold_out':
          mintStatus = 'sold_out'
          break
        case 'paused':
          mintStatus = 'paused'
          break
        default:
          mintStatus = 'not_available'
      }
    }

    // Ensure collection has a slug
    const collectionWithSlug = {
      ...collection,
      slug: collection.slug || generateSlug(collection.name),
    }

    return response.json({
      collection: toCamelCase(collectionWithSlug),
      candyMachine: candyMachine ? toCamelCase(candyMachine) : null,
      presales: presales.map(p => {
        const data = toCamelCase(p)
        // Don't expose wallet addresses in public response
        delete data.walletAddresses
        return {
          ...data,
          walletCount: p.wallet_addresses ? JSON.parse(p.wallet_addresses).length : 0,
        }
      }),
      activePresales: activePresales.map(p => ({
        id: p.id,
        uuid: p.uuid,
        discount: p.discount,
        maxMintsPerWallet: p.max_mints_per_wallet,
        presaleExpiresAt: p.presale_expires_at,
      })),
      mintedNfts: mintedNfts.map(toCamelCase),
      stats: {
        itemsAvailable,
        itemsRedeemed,
        itemsRemaining,
        percentMinted,
        mintPrice: candyMachine?.mint_price || 0,
        mintPriceSol: candyMachine?.mint_price ? (candyMachine.mint_price / 1_000_000_000) : 0,
      },
      mintStatus,
      canMint: mintStatus === 'presale_live' || mintStatus === 'public_live',
    })
  },
})
