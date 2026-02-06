import { Action } from '@stacksjs/actions'
import { db } from '@stacksjs/database'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'
import { getTokenService } from '../../Services/TokenService'

export default new Action({
  name: 'Update Presale',
  description: 'Update presale configuration',
  method: 'PATCH',

  async handle(request: RequestInstance) {
    const presaleId = request.getParam('id')
    const body = await request.json()

    const {
      walletAddresses,
      discount,
      maxMintsPerWallet,
      presaleStartsAt,
      presaleExpiresAt,
      isActive,
    } = body

    // Get existing presale
    const presale = await db
      .selectFrom('presales')
      .selectAll()
      .where('id', '=', Number(presaleId))
      .executeTakeFirst()

    if (!presale) {
      return response.notFound({ error: 'Presale not found' })
    }

    // Build update object
    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    }

    // Update wallet addresses if provided
    if (walletAddresses !== undefined) {
      if (!Array.isArray(walletAddresses)) {
        return response.json({
          error: 'walletAddresses must be an array',
        }, 400)
      }

      const validAddresses = [...new Set(walletAddresses.filter((addr: string) => addr && addr.trim()))]
      updates.wallet_addresses = validAddresses.length > 0 ? JSON.stringify(validAddresses) : null

      // Regenerate merkle root
      if (validAddresses.length > 0) {
        const tokenService = getTokenService()
        const rootBytes = tokenService.generateMerkleRoot(validAddresses)
        updates.merkle_root = Buffer.from(rootBytes).toString('hex')
      } else {
        updates.merkle_root = null
      }
    }

    // Update discount
    if (discount !== undefined) {
      if (discount < 0 || discount > 10000) {
        return response.json({
          error: 'discount must be between 0 and 10000 (basis points)',
        }, 400)
      }
      updates.discount = discount
    }

    // Update max mints per wallet
    if (maxMintsPerWallet !== undefined) {
      if (maxMintsPerWallet < 1) {
        return response.json({
          error: 'maxMintsPerWallet must be at least 1',
        }, 400)
      }
      updates.max_mints_per_wallet = maxMintsPerWallet
    }

    // Update dates
    if (presaleStartsAt !== undefined) {
      updates.presale_starts_at = presaleStartsAt
    }
    if (presaleExpiresAt !== undefined) {
      updates.presale_expires_at = presaleExpiresAt
    }

    // Validate dates if both are present
    const startDate = presaleStartsAt !== undefined
      ? (presaleStartsAt ? new Date(presaleStartsAt) : null)
      : (presale.presale_starts_at ? new Date(presale.presale_starts_at) : null)

    const endDate = presaleExpiresAt !== undefined
      ? (presaleExpiresAt ? new Date(presaleExpiresAt) : null)
      : (presale.presale_expires_at ? new Date(presale.presale_expires_at) : null)

    if (startDate && endDate && startDate >= endDate) {
      return response.json({
        error: 'presaleStartsAt must be before presaleExpiresAt',
      }, 400)
    }

    // Update active status
    if (isActive !== undefined) {
      updates.is_active = isActive ? 1 : 0

      // Update collection presale status
      if (isActive) {
        await db
          .updateTable('collections')
          .set({
            is_presale_happening: 1,
            updated_at: new Date().toISOString(),
          })
          .where('id', '=', presale.collection_id)
          .execute()
      } else {
        // Check if there are other active presales for this collection
        const otherActivePresales = await db
          .selectFrom('presales')
          .select([db.fn.count('id').as('count')])
          .where('collection_id', '=', presale.collection_id)
          .where('id', '!=', presale.id)
          .where('is_active', '=', 1)
          .executeTakeFirst()

        if (Number(otherActivePresales?.count || 0) === 0) {
          await db
            .updateTable('collections')
            .set({
              is_presale_happening: 0,
              updated_at: new Date().toISOString(),
            })
            .where('id', '=', presale.collection_id)
            .execute()
        }
      }
    }

    // Apply updates
    await db
      .updateTable('presales')
      .set(updates)
      .where('id', '=', Number(presaleId))
      .execute()

    // Fetch updated presale
    const updated = await db
      .selectFrom('presales')
      .selectAll()
      .where('id', '=', Number(presaleId))
      .executeTakeFirst()

    const walletCount = updated?.wallet_addresses
      ? JSON.parse(updated.wallet_addresses).length
      : 0

    return response.json({
      presale: {
        id: updated?.id,
        uuid: updated?.uuid,
        collectionId: updated?.collection_id,
        walletCount,
        merkleRoot: updated?.merkle_root,
        discount: updated?.discount,
        maxMintsPerWallet: updated?.max_mints_per_wallet,
        presaleStartsAt: updated?.presale_starts_at,
        presaleExpiresAt: updated?.presale_expires_at,
        isActive: updated?.is_active === 1,
        updatedAt: updated?.updated_at,
      },
    })
  },
})
