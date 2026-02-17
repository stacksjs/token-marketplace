import { Action } from '@stacksjs/actions'
import { db } from '@stacksjs/database'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'

export default new Action({
  name: 'Check Presale Eligibility',
  description: 'Check if a wallet is eligible for a presale',
  method: 'POST',

  async handle(request: RequestInstance) {
    const body = await request.json()

    const { walletAddress, presaleId, collectionId } = body

    if (!walletAddress) {
      return response.json({
        error: 'walletAddress is required',
      }, 400)
    }

    if (!presaleId && !collectionId) {
      return response.json({
        error: 'presaleId or collectionId is required',
      }, 400)
    }

    // Get presale(s)
    let presales: any[] = []

    if (presaleId) {
      const presale = await db
        .selectFrom('presales')
        .selectAll()
        .where('id', '=', Number(presaleId))
        .executeTakeFirst()

      if (presale) {
        presales = [presale]
      }
    } else if (collectionId) {
      presales = await db
        .selectFrom('presales')
        .selectAll()
        .where('collection_id', '=', Number(collectionId))
        .where('is_active', '=', 1)
        .execute()
    }

    if (presales.length === 0) {
      return response.json({
        eligible: false,
        reason: 'No active presales found',
        presales: [],
      })
    }

    const eligibilityResults = []

    for (const presale of presales) {
      const now = new Date()
      const startsAt = presale.presale_starts_at ? new Date(presale.presale_starts_at) : null
      const expiresAt = presale.presale_expires_at ? new Date(presale.presale_expires_at) : null

      // Parse wallet addresses
      const walletAddresses = presale.wallet_addresses
        ? JSON.parse(presale.wallet_addresses)
        : []

      // Check if wallet is in allowlist
      const isInAllowlist = walletAddresses.includes(walletAddress)

      // Check timing
      let timingStatus = 'active'
      if (startsAt && now < startsAt) {
        timingStatus = 'not_started'
      } else if (expiresAt && now > expiresAt) {
        timingStatus = 'expired'
      }

      // Check mint count
      const mintCount = await db
        .selectFrom('mint_transactions')
        .where('presale_id', '=', presale.id)
        .where('wallet_address', '=', walletAddress)
        .where(['status', 'in', ['pending', 'processing', 'confirmed']])
        .count()
      const maxMints = presale.max_mints_per_wallet || 1
      const mintsRemaining = Math.max(0, maxMints - mintCount)

      // Determine eligibility
      let eligible = false
      let reason = ''

      if (!presale.is_active) {
        reason = 'Presale is not active'
      } else if (!isInAllowlist) {
        reason = 'Wallet is not in allowlist'
      } else if (timingStatus === 'not_started') {
        reason = 'Presale has not started yet'
      } else if (timingStatus === 'expired') {
        reason = 'Presale has expired'
      } else if (mintsRemaining <= 0) {
        reason = 'Maximum mints reached for this presale'
      } else {
        eligible = true
        reason = 'Wallet is eligible to mint'
      }

      // Get candy machine for price info
      const candyMachine = await db
        .selectFrom('candy_machines')
        .select(['mint_price', 'items_available', 'items_redeemed'])
        .where('collection_id', '=', presale.collection_id)
        .executeTakeFirst()

      const originalPrice = candyMachine?.mint_price || 0
      const discountedPrice = presale.discount
        ? Math.floor(originalPrice * (1 - (presale.discount / 10000)))
        : originalPrice

      eligibilityResults.push({
        presaleId: presale.id,
        presaleUuid: presale.uuid,
        eligible,
        reason,
        isInAllowlist,
        timingStatus,
        mintsUsed: mintCount,
        mintsRemaining,
        maxMintsPerWallet: maxMints,
        discount: presale.discount || 0,
        discountPercentage: presale.discount ? (presale.discount / 100) : 0,
        originalPrice,
        discountedPrice,
        presaleStartsAt: presale.presale_starts_at,
        presaleExpiresAt: presale.presale_expires_at,
      })
    }

    // Overall eligibility - true if eligible for at least one presale
    const overallEligible = eligibilityResults.some(r => r.eligible)

    return response.json({
      eligible: overallEligible,
      walletAddress,
      presales: eligibilityResults,
    })
  },
})
