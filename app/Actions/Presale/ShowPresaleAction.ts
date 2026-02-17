import { Action } from '@stacksjs/actions'
import { db } from '@stacksjs/database'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'
import { toCamelCase as _toCamelCase } from '../helpers'

const JSON_FIELDS = ['wallet_addresses']
function toCamelCase(obj: Record<string, any>): Record<string, any> {
  return _toCamelCase(obj, JSON_FIELDS)
}

export default new Action({
  name: 'Show Presale',
  description: 'Get presale details by UUID',
  method: 'GET',

  async handle(request: RequestInstance) {
    const uuid = request.getParam('uuid')

    if (!uuid) {
      return response.json({
        error: 'uuid parameter is required',
      }, 400)
    }

    // Get presale
    const presale = await db
      .selectFrom('presales')
      .selectAll()
      .where('uuid', '=', uuid)
      .executeTakeFirst()

    if (!presale) {
      return response.notFound({ error: 'Presale not found' })
    }

    // Get collection
    const collection = await db
      .selectFrom('collections')
      .select(['id', 'uuid', 'name', 'slug', 'image_url'])
      .where('id', '=', presale.collection_id)
      .executeTakeFirst()

    // Get candy machine for mint price
    let candyMachine = null
    if (collection) {
      candyMachine = await db
        .selectFrom('candy_machines')
        .select(['id', 'mint_price', 'items_available', 'items_redeemed', 'status'])
        .where('collection_id', '=', collection.id)
        .executeTakeFirst()
    }

    // Calculate presale status
    const now = new Date()
    const startsAt = presale.presale_starts_at ? new Date(presale.presale_starts_at) : null
    const expiresAt = presale.presale_expires_at ? new Date(presale.presale_expires_at) : null

    let status = 'inactive'
    if (presale.is_active) {
      if (startsAt && now < startsAt) {
        status = 'upcoming'
      } else if (expiresAt && now > expiresAt) {
        status = 'expired'
      } else {
        status = 'active'
      }
    }

    // Calculate discounted price
    let originalPrice = candyMachine?.mint_price || 0
    let discountedPrice = originalPrice
    if (presale.discount) {
      discountedPrice = Math.floor(originalPrice * (1 - (presale.discount / 10000)))
    }

    // Count mints used
    const totalMints = await db
      .selectFrom('mint_transactions')
      .where('presale_id', '=', presale.id)
      .where(['status', 'in', ['pending', 'processing', 'confirmed']])
      .count()

    const presaleData = toCamelCase(presale)

    // Don't expose full wallet list in public response
    const walletCount = presaleData.walletAddresses?.length || 0
    delete presaleData.walletAddresses

    return response.json({
      presale: {
        ...presaleData,
        walletCount,
        status,
        originalPrice,
        discountedPrice,
        discountPercentage: presale.discount ? (presale.discount / 100) : 0,
      },
      collection: collection ? toCamelCase(collection) : null,
      stats: {
        totalMints,
        itemsAvailable: candyMachine?.items_available || 0,
        itemsRemaining: candyMachine
          ? (candyMachine.items_available || 0) - (candyMachine.items_redeemed || 0)
          : 0,
      },
    })
  },
})
