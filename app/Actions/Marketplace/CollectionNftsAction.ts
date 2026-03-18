import { Action } from '@stacksjs/actions'
import { db } from '@stacksjs/database'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'
import { generateSlug } from '../helpers'

export default new Action({
  name: 'Collection NFTs',
  description: 'Fetch NFTs for a collection with cursor-based pagination, filtering, and sorting',
  method: 'GET',

  async handle(request: RequestInstance) {
    const slug = request.getParam('slug')

    // Find collection by slug
    let collection = await db
      .selectFrom('collections')
      .selectAll()
      .where('slug', '=', slug)
      .executeTakeFirst()

    if (!collection) {
      const allCollections = await db
        .selectFrom('collections')
        .selectAll()
        .execute()
      collection = allCollections.find((c: any) => generateSlug(c.name) === slug)
    }

    if (!collection) {
      return response.notFound({ error: 'Collection not found' })
    }

    // Parse query params
    const cursor = request.getParam('cursor') ? Number(request.getParam('cursor')) : null
    const limit = Math.min(100, Math.max(1, Number(request.getParam('limit')) || 50))
    const status = request.getParam('status') || 'all' // listed | unlisted | all
    const minPrice = request.getParam('minPrice') ? Number(request.getParam('minPrice')) : null
    const maxPrice = request.getParam('maxPrice') ? Number(request.getParam('maxPrice')) : null
    const rarity = request.getParam('rarity') || null // comma-separated: legendary,rare
    const sort = request.getParam('sort') || 'recent'
    const traitsParam = request.getParam('traits') // JSON string: {"Background":"Purple","Hat":"Crown"}

    // Fetch all NFTs for collection
    let nfts = await db
      .selectFrom('nfts')
      .selectAll()
      .where('collection_id', '=', collection.id)
      .execute()

    // Apply cursor (items after cursor ID)
    if (cursor) {
      const cursorIdx = nfts.findIndex((n: any) => n.id === cursor)
      if (cursorIdx >= 0) {
        nfts = nfts.slice(cursorIdx + 1)
      }
    }

    // Filter by listing status
    if (status === 'listed') {
      nfts = nfts.filter((n: any) => n.is_for_sale === 1 || n.is_for_sale === true || n.listing_price)
    }
    else if (status === 'unlisted') {
      nfts = nfts.filter((n: any) => !n.is_for_sale && !n.listing_price)
    }

    // Filter by price range (in SOL)
    if (minPrice !== null) {
      nfts = nfts.filter((n: any) => {
        const p = n.listing_price ? Number(n.listing_price) / 1e9 : Number(n.price || 0)
        return p >= minPrice
      })
    }
    if (maxPrice !== null) {
      nfts = nfts.filter((n: any) => {
        const p = n.listing_price ? Number(n.listing_price) / 1e9 : Number(n.price || 0)
        return p > 0 && p <= maxPrice
      })
    }

    // Filter by rarity levels
    if (rarity) {
      const levels = rarity.split(',').map((r: string) => r.trim().toLowerCase())
      nfts = nfts.filter((n: any) => levels.includes((n.rarity || 'common').toLowerCase()))
    }

    // Filter by traits
    if (traitsParam) {
      try {
        const traits = typeof traitsParam === 'string' ? JSON.parse(traitsParam) : traitsParam
        nfts = nfts.filter((n: any) => {
          let attrs = n.attributes
          if (typeof attrs === 'string') {
            try { attrs = JSON.parse(attrs) } catch { return true }
          }
          if (!Array.isArray(attrs)) return true
          for (const [traitType, traitValue] of Object.entries(traits)) {
            const match = attrs.find((a: any) =>
              (a.trait_type || a.traitType || a.key || '').toLowerCase() === traitType.toLowerCase()
              && (a.value || '').toLowerCase() === String(traitValue).toLowerCase(),
            )
            if (!match) return false
          }
          return true
        })
      }
      catch {
        // Invalid traits JSON, skip filtering
      }
    }

    // Sort helper
    function getNftPrice(n: any): number {
      if (n.listing_price) return Number(n.listing_price) / 1e9
      return Number(n.price || 0)
    }

    switch (sort) {
      case 'price_asc':
        nfts.sort((a: any, b: any) => getNftPrice(a) - getNftPrice(b))
        break
      case 'price_desc':
        nfts.sort((a: any, b: any) => getNftPrice(b) - getNftPrice(a))
        break
      case 'rarity': {
        const order: Record<string, number> = { legendary: 0, epic: 1, rare: 2, uncommon: 3, common: 4 }
        nfts.sort((a: any, b: any) =>
          (order[(a.rarity || 'common').toLowerCase()] ?? 5) - (order[(b.rarity || 'common').toLowerCase()] ?? 5),
        )
        break
      }
      case 'rarity_common': {
        const order: Record<string, number> = { common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 4 }
        nfts.sort((a: any, b: any) =>
          (order[(a.rarity || 'common').toLowerCase()] ?? 5) - (order[(b.rarity || 'common').toLowerCase()] ?? 5),
        )
        break
      }
      case 'name':
        nfts.sort((a: any, b: any) => (a.name || '').localeCompare(b.name || ''))
        break
      case 'name_desc':
        nfts.sort((a: any, b: any) => (b.name || '').localeCompare(a.name || ''))
        break
      case 'token_id':
        nfts.sort((a: any, b: any) => Number(a.token_id || 0) - Number(b.token_id || 0))
        break
      case 'token_id_desc':
        nfts.sort((a: any, b: any) => Number(b.token_id || 0) - Number(a.token_id || 0))
        break
      case 'recent':
      default:
        nfts.sort((a: any, b: any) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
        break
    }

    // Paginate with cursor
    const data = nfts.slice(0, limit)
    const nextCursor = data.length === limit ? data[data.length - 1]?.id : null

    return response.json({
      data,
      cursor: nextCursor,
      total: nfts.length,
      limit,
    })
  },
})
