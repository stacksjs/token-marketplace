import { Action } from '@stacksjs/actions'
import { db } from '@stacksjs/database'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'
import { getTokenService } from '../../Services/TokenService'

export default new Action({
  name: 'Mint NFT to Collection',
  description: 'Mint a new NFT into an existing collection on-chain and register it in the marketplace',
  method: 'POST',

  async handle(request: RequestInstance) {
    const body = request.all()
    const collectionMint: string = body?.collectionMint || ''
    const name: string = body?.name || ''
    const symbol: string = body?.symbol || ''
    const description: string = body?.description || ''
    const imageUrl: string = body?.imageUrl || ''
    const sellerFeeBasisPoints: number = Number(body?.sellerFeeBasisPoints) || 500

    if (!collectionMint || collectionMint.length < 32) {
      return response.json({ error: 'Valid collectionMint address is required' }, 400)
    }

    if (!name || name.length < 1) {
      return response.json({ error: 'NFT name is required' }, 400)
    }

    // Verify the collection exists in our DB
    const collection = await db
      .selectFrom('collections')
      .selectAll()
      .where('mint_address', '=', collectionMint)
      .executeTakeFirst()

    if (!collection) {
      return response.json({ error: 'Collection not found in marketplace. Sync or create it first.' }, 404)
    }

    try {
      const tokenService = getTokenService()

      // Build off-chain metadata JSON and write locally (Arweave needs separate wallet)
      const nftSymbol = symbol || collection.name?.slice(0, 4).toUpperCase() || 'NFT'
      const metadataJson = {
        name,
        symbol: nftSymbol,
        description,
        image: imageUrl || '',
        seller_fee_basis_points: sellerFeeBasisPoints,
        properties: {
          category: 'image',
          creators: [],
        },
        collection: {
          name: collection.name,
          family: collection.name,
        },
      }

      const fs = await import('node:fs')
      const path = await import('node:path')
      const uploadsDir = path.resolve('storage/uploads/metadata')
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true })
      }
      const metadataFile = `nft_${Date.now()}.json`
      fs.writeFileSync(path.join(uploadsDir, metadataFile), JSON.stringify(metadataJson, null, 2))

      const apiUrl = process.env.API_URL || 'http://localhost:3008'
      const metadataUri = `${apiUrl}/uploads/metadata/${metadataFile}`

      // Create NFT on-chain, associated with the collection
      const result = await tokenService.createNFT({
        name,
        symbol: nftSymbol,
        uri: metadataUri,
        collection: collectionMint,
        sellerFeeBasisPoints,
        isMutable: true,
      })

      // Insert NFT into local database
      await db
        .insertInto('nfts')
        .values({
          collection_id: collection.id as number,
          name,
          mint_address: result.mint,
          owner_wallet_address: '', // owned by the keypair that created it
          description,
          image_url: imageUrl,
          metadata_url: result.uri || '',
          is_for_sale: 0,
          is_minting: 0,
          created_at: new Date().toISOString(),
        })
        .execute()

      // Update collection NFT count
      const collectionNfts = await db
        .selectFrom('nfts')
        .selectAll()
        .where('collection_id', '=', collection.id as number)
        .execute()

      const nftCount = collectionNfts.length

      await db
        .updateTable('collections')
        .set({
          total_amount_of_nfts: nftCount,
          updated_at: new Date().toISOString(),
        })
        .where('id', '=', collection.id as number)
        .execute()

      return response.json({
        success: true,
        nft: {
          name,
          mintAddress: result.mint,
          metadataAddress: result.metadata,
          masterEdition: result.masterEdition,
          metadataUrl: result.uri,
          transactionSignature: result.signature,
          collectionMint,
          collectionName: collection.name,
        },
        collectionNftCount: nftCount,
      })
    }
    catch (error) {
      console.error('[MintNftToCollection] Failed:', error)

      const errMsg = error instanceof Error ? error.message : 'Unknown error'

      return response.json({
        error: 'Failed to mint NFT on-chain',
        details: errMsg,
        hint: errMsg.includes('insufficient')
          ? 'Wallet needs more SOL. Run: solana airdrop 2'
          : undefined,
      }, 500)
    }
  },
})
