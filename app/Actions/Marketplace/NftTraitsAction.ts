import { Action } from '@stacksjs/actions'
import { db } from '@stacksjs/database'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'

export default new Action({
  name: 'NFT Traits',
  description: 'Fetch trait data for a single NFT with rarity percentages and floor prices per trait',
  method: 'GET',

  async handle(request: RequestInstance) {
    const id = Number(request.getParam('id'))

    const nft = await db
      .selectFrom('nfts')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst()

    if (!nft) {
      return response.notFound({ error: 'NFT not found' })
    }

    // Parse this NFT's attributes
    let attrs = (nft as any).attributes
    if (typeof attrs === 'string') {
      try { attrs = JSON.parse(attrs) } catch { attrs = [] }
    }
    if (!Array.isArray(attrs)) attrs = []

    // If no collection, return raw attributes
    if (!nft.collection_id) {
      return response.json({
        nftId: id,
        traits: attrs.map((a: any) => ({
          type: a.trait_type || a.traitType || a.key || 'Unknown',
          value: a.value,
          rarityPct: null,
          floorPrice: null,
          count: null,
        })),
      })
    }

    // Fetch all NFTs in collection to compute rarity
    const collectionNfts = await db
      .selectFrom('nfts')
      .selectAll()
      .where('collection_id', '=', nft.collection_id)
      .execute()

    const totalInCollection = collectionNfts.length

    // Build trait counts and floor prices
    const traitData: Record<string, Record<string, { count: number, floor: number | null }>> = {}

    for (const cn of collectionNfts) {
      let cnAttrs = (cn as any).attributes
      if (typeof cnAttrs === 'string') {
        try { cnAttrs = JSON.parse(cnAttrs) } catch { continue }
      }
      if (!Array.isArray(cnAttrs)) continue

      const nftPrice = (cn as any).listing_price
        ? Number((cn as any).listing_price) / 1e9
        : ((cn as any).is_for_sale ? Number((cn as any).price || 0) : 0)

      for (const attr of cnAttrs) {
        const traitType = attr.trait_type || attr.traitType || attr.key || ''
        const traitValue = String(attr.value ?? '')
        if (!traitType) continue

        if (!traitData[traitType]) traitData[traitType] = {}
        if (!traitData[traitType][traitValue]) {
          traitData[traitType][traitValue] = { count: 0, floor: null }
        }

        traitData[traitType][traitValue].count++

        if (nftPrice > 0) {
          const current = traitData[traitType][traitValue].floor
          if (current === null || nftPrice < current) {
            traitData[traitType][traitValue].floor = nftPrice
          }
        }
      }
    }

    // Map this NFT's attributes to enriched trait objects
    const traits = attrs.map((a: any) => {
      const traitType = a.trait_type || a.traitType || a.key || 'Unknown'
      const traitValue = String(a.value ?? '')
      const info = traitData[traitType]?.[traitValue]
      const count = info?.count || 0
      const rarityPct = totalInCollection > 0 ? Number(((count / totalInCollection) * 100).toFixed(1)) : null

      return {
        type: traitType,
        value: traitValue,
        rarityPct,
        floorPrice: info?.floor || null,
        count,
      }
    })

    return response.json({ nftId: id, totalInCollection, traits })
  },
})
