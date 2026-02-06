import { Action } from '@stacksjs/actions'
import { db } from '@stacksjs/database'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'
import { getTokenService } from '../../Services/TokenService'

export default new Action({
  name: 'Create Presale',
  description: 'Create a new presale/allowlist for a collection',
  method: 'POST',

  async handle(request: RequestInstance) {
    const body = await request.json()

    const {
      collectionId,
      walletAddresses,
      discount,
      maxMintsPerWallet,
      presaleStartsAt,
      presaleExpiresAt,
      isActive,
    } = body

    if (!collectionId) {
      return response.json({
        error: 'collectionId is required',
      }, 400)
    }

    // Check collection exists
    const collection = await db
      .selectFrom('collections')
      .selectAll()
      .where('id', '=', Number(collectionId))
      .executeTakeFirst()

    if (!collection) {
      return response.notFound({ error: 'Collection not found' })
    }

    // Validate wallet addresses if provided
    let validAddresses: string[] = []
    if (walletAddresses) {
      if (!Array.isArray(walletAddresses)) {
        return response.json({
          error: 'walletAddresses must be an array',
        }, 400)
      }
      // Filter out empty strings and duplicates
      validAddresses = [...new Set(walletAddresses.filter((addr: string) => addr && addr.trim()))]
    }

    // Validate discount
    if (discount !== undefined && (discount < 0 || discount > 10000)) {
      return response.json({
        error: 'discount must be between 0 and 10000 (basis points)',
      }, 400)
    }

    // Validate dates
    if (presaleStartsAt && presaleExpiresAt) {
      const startDate = new Date(presaleStartsAt)
      const endDate = new Date(presaleExpiresAt)
      if (startDate >= endDate) {
        return response.json({
          error: 'presaleStartsAt must be before presaleExpiresAt',
        }, 400)
      }
    }

    // Generate merkle root if wallet addresses provided
    let merkleRoot = null
    if (validAddresses.length > 0) {
      const tokenService = getTokenService()
      const rootBytes = tokenService.generateMerkleRoot(validAddresses)
      merkleRoot = Buffer.from(rootBytes).toString('hex')
    }

    // Generate UUID
    const uuid = crypto.randomUUID()

    // Create presale
    const insertResult = await db
      .insertInto('presales')
      .values({
        uuid,
        collection_id: Number(collectionId),
        wallet_addresses: validAddresses.length > 0 ? JSON.stringify(validAddresses) : null,
        merkle_root: merkleRoot,
        discount: discount || 0,
        max_mints_per_wallet: maxMintsPerWallet || 1,
        presale_starts_at: presaleStartsAt || null,
        presale_expires_at: presaleExpiresAt || null,
        is_active: isActive ? 1 : 0,
        created_at: new Date().toISOString(),
      })
      .execute()

    const presaleId = insertResult[0].insertId

    // Update collection presale status if active
    if (isActive) {
      await db
        .updateTable('collections')
        .set({
          is_presale_happening: 1,
          updated_at: new Date().toISOString(),
        })
        .where('id', '=', Number(collectionId))
        .execute()
    }

    // Fetch created presale
    const presale = await db
      .selectFrom('presales')
      .selectAll()
      .where('id', '=', Number(presaleId))
      .executeTakeFirst()

    return response.json({
      presale: {
        id: presale?.id,
        uuid: presale?.uuid,
        collectionId: presale?.collection_id,
        walletCount: validAddresses.length,
        merkleRoot,
        discount: presale?.discount,
        maxMintsPerWallet: presale?.max_mints_per_wallet,
        presaleStartsAt: presale?.presale_starts_at,
        presaleExpiresAt: presale?.presale_expires_at,
        isActive: presale?.is_active === 1,
      },
    }, 201)
  },
})
