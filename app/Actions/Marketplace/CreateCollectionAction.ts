import { Action } from '@stacksjs/actions'
import { db } from '@stacksjs/database'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'
import { getTokenService } from '../../Services/TokenService'
import { generateSlug } from '../helpers'

export default new Action({
  name: 'Create Collection',
  description: 'Create a new NFT collection on-chain and register it in the marketplace',
  method: 'POST',

  async handle(request: RequestInstance) {
    const body = request.all()
    const name: string = body?.name || ''
    const symbol: string = body?.symbol || ''
    const description: string = body?.description || ''
    const imageUrl: string = body?.imageUrl || ''
    const sellerFeeBasisPoints: number = Number(body?.sellerFeeBasisPoints) || 500
    const isMutable: boolean = body?.isMutable !== false

    if (!name || name.length < 2) {
      return response.json({ error: 'Collection name is required (min 2 characters)' }, 400)
    }

    if (!symbol || symbol.length < 1 || symbol.length > 10) {
      return response.json({ error: 'Symbol is required (1-10 characters)' }, 400)
    }

    try {
      const tokenService = getTokenService()

      // Build off-chain metadata JSON and write it locally so we have a URI
      // (Arweave upload requires an Arweave wallet; for devnet we serve locally)
      const metadataJson = {
        name,
        symbol,
        description,
        image: imageUrl || '',
        external_url: body?.externalUrl || '',
        seller_fee_basis_points: sellerFeeBasisPoints,
        properties: {
          category: 'image',
          creators: [],
        },
      }

      const fs = await import('node:fs')
      const path = await import('node:path')
      const uploadsDir = path.resolve('storage/uploads/metadata')
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true })
      }
      const metadataFile = `collection_${Date.now()}.json`
      fs.writeFileSync(path.join(uploadsDir, metadataFile), JSON.stringify(metadataJson, null, 2))

      // Use local URL as metadata URI for devnet; in production use Arweave/IPFS
      const apiUrl = process.env.API_URL || 'http://localhost:3008'
      const metadataUri = `${apiUrl}/uploads/metadata/${metadataFile}`

      // Create collection on-chain via ts-tokens
      const result = await tokenService.createCollection({
        name,
        symbol,
        uri: metadataUri,
        sellerFeeBasisPoints,
        isMutable,
      })

      const slug = generateSlug(name)

      // Insert into local database
      await db
        .insertInto('collections')
        .values({
          name,
          slug,
          description,
          image_url: imageUrl,
          mint_address: result.mint,
          metadata_url: result.uri || '',
          is_live: 1,
          is_featured: 0,
          is_minting: 0,
          total_amount_of_nfts: 0,
          created_at: new Date().toISOString(),
        })
        .execute()

      const collection = await db
        .selectFrom('collections')
        .selectAll()
        .where('mint_address', '=', result.mint)
        .executeTakeFirst()

      return response.json({
        success: true,
        collection: {
          id: collection?.id,
          name,
          slug,
          symbol,
          mintAddress: result.mint,
          metadataAddress: result.metadata,
          masterEdition: result.masterEdition,
          metadataUrl: result.uri,
          transactionSignature: result.signature,
        },
      })
    }
    catch (error) {
      console.error('[CreateCollection] Failed:', error)

      const errMsg = error instanceof Error ? error.message : 'Unknown error'

      return response.json({
        error: 'Failed to create collection on-chain',
        details: errMsg,
        hint: errMsg.includes('keypair')
          ? 'Make sure SOLANA_KEYPAIR_PATH points to a funded devnet wallet. Run: solana airdrop 2'
          : errMsg.includes('insufficient')
            ? 'Wallet needs SOL for transaction fees. Run: solana airdrop 2'
            : undefined,
      }, 500)
    }
  },
})
