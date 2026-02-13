import { Action } from '@stacksjs/actions'
import { db } from '@stacksjs/database'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'
import { getTokenService } from '../../Services/TokenService'
import { PlatformFeeService } from '../../Services/PlatformFeeService'
import tokensConfig from '../../../config/tokens'

type ConfirmAction =
  | 'buy'
  | 'list'
  | 'delist'
  | 'mint'
  | 'accept_offer'
  | 'cancel_auction'
  | 'create_escrow'
  | 'settle_escrow'
  | 'cancel_escrow'
  | 'quick_mint'
  | 'update_nft'

export default new Action({
  name: 'Confirm Transaction',
  description: 'Verify a signed transaction on-chain and update the database accordingly',
  method: 'POST',

  async handle(request: RequestInstance) {
    const body = await request.json()

    const { signature, nftId, action, metadata } = body as {
      signature: string
      nftId?: number
      action: ConfirmAction
      metadata?: Record<string, any>
    }

    if (!signature || !action) {
      return response.json({
        error: 'signature and action are required',
      }, 400)
    }

    const validActions: ConfirmAction[] = [
      'buy', 'list', 'delist', 'mint', 'accept_offer',
      'cancel_auction', 'create_escrow', 'settle_escrow', 'cancel_escrow',
      'quick_mint', 'update_nft',
    ]

    if (!validActions.includes(action)) {
      return response.json({
        error: `Invalid action. Must be one of: ${validActions.join(', ')}`,
      }, 400)
    }

    // Verify the transaction on-chain
    const tokenService = getTokenService()
    const verification = await tokenService.verifyTransaction(signature)

    if (!verification.confirmed) {
      return response.json({
        error: 'Transaction not confirmed on-chain',
        details: verification.err,
      }, 400)
    }

    try {
      switch (action) {
        case 'buy':
          return await handleBuy(nftId, signature, metadata)
        case 'list':
          return await handleList(nftId, signature, metadata)
        case 'delist':
          return await handleDelist(nftId, signature)
        case 'mint':
          return await handleMint(signature, metadata)
        case 'accept_offer':
          return await handleAcceptOffer(nftId, signature, metadata)
        case 'cancel_auction':
          return await handleCancelAuction(signature, metadata)
        case 'create_escrow':
          return await handleCreateEscrow(nftId, signature, metadata)
        case 'settle_escrow':
          return await handleSettleEscrow(nftId, signature, metadata)
        case 'cancel_escrow':
          return await handleCancelEscrow(nftId, signature, metadata)
        case 'quick_mint':
          return await handleQuickMint(signature, metadata)
        case 'update_nft':
          return await handleUpdateNFT(nftId, signature, metadata)
      }
    } catch (error) {
      return response.json({
        error: 'Failed to process confirmed transaction',
        details: error instanceof Error ? error.message : 'Unknown error',
      }, 500)
    }
  },
})

async function handleBuy(nftId: number | undefined, signature: string, metadata?: Record<string, any>) {
  if (!nftId) {
    return response.json({ error: 'nftId is required for buy action' }, 400)
  }

  const buyerWalletAddress = metadata?.buyerWalletAddress
  if (!buyerWalletAddress) {
    return response.json({ error: 'metadata.buyerWalletAddress is required for buy action' }, 400)
  }

  const nft = await db
    .selectFrom('nfts')
    .selectAll()
    .where('id', '=', Number(nftId))
    .executeTakeFirst()

  if (!nft) {
    return response.notFound({ error: 'NFT not found' })
  }

  const previousOwner = nft.owner_wallet_address

  await db
    .updateTable('nfts')
    .set({
      owner_wallet_address: buyerWalletAddress,
      is_for_sale: 0,
      listing_id: null,
      delegate_address: null,
      listed_at: null,
      listing_price: null,
      updated_at: new Date().toISOString(),
    })
    .where('id', '=', Number(nftId))
    .execute()

  await recordPlatformFee('buy', signature, nftId, nft.mint_address, metadata)

  return response.json({
    success: true,
    transaction: { signature, status: 'confirmed' },
    action: 'buy',
    nft: {
      id: nft.id,
      name: nft.name,
      previousOwner,
      newOwner: buyerWalletAddress,
    },
  })
}

async function handleList(nftId: number | undefined, signature: string, metadata?: Record<string, any>) {
  if (!nftId) {
    return response.json({ error: 'nftId is required for list action' }, 400)
  }

  const price = metadata?.price
  const listingId = metadata?.listingId
  const delegateAddress = metadata?.delegateAddress

  if (price === undefined) {
    return response.json({ error: 'metadata.price is required for list action' }, 400)
  }

  const priceLamports = Math.floor(Number(price) * 1e9)

  await db
    .updateTable('nfts')
    .set({
      is_for_sale: 1,
      price: Number(price),
      listing_id: listingId || null,
      delegate_address: delegateAddress || null,
      listed_at: new Date().toISOString(),
      listing_price: priceLamports,
      updated_at: new Date().toISOString(),
    })
    .where('id', '=', Number(nftId))
    .execute()

  const updatedNft = await db
    .selectFrom('nfts')
    .selectAll()
    .where('id', '=', Number(nftId))
    .executeTakeFirst()

  return response.json({
    success: true,
    transaction: { signature, status: 'confirmed' },
    action: 'list',
    nft: {
      id: updatedNft?.id,
      name: updatedNft?.name,
      price: updatedNft?.price,
      isForSale: true,
    },
  })
}

async function handleDelist(nftId: number | undefined, signature: string) {
  if (!nftId) {
    return response.json({ error: 'nftId is required for delist action' }, 400)
  }

  await db
    .updateTable('nfts')
    .set({
      is_for_sale: 0,
      listing_id: null,
      delegate_address: null,
      listed_at: null,
      listing_price: null,
      updated_at: new Date().toISOString(),
    })
    .where('id', '=', Number(nftId))
    .execute()

  return response.json({
    success: true,
    transaction: { signature, status: 'confirmed' },
    action: 'delist',
    nft: { id: nftId, isForSale: false },
  })
}

async function handleMint(signature: string, metadata?: Record<string, any>) {
  const mintTransactionId = metadata?.mintTransactionId
  const mintAddress = metadata?.mintAddress

  if (!mintTransactionId) {
    return response.json({ error: 'metadata.mintTransactionId is required for mint action' }, 400)
  }

  // Update mint transaction to confirmed
  await db
    .updateTable('mint_transactions')
    .set({
      status: 'confirmed',
      mint_address: mintAddress || null,
      transaction_signature: signature,
      updated_at: new Date().toISOString(),
    })
    .where('uuid', '=', mintTransactionId)
    .execute()

  // Get the mint transaction to update candy machine
  const mintTx = await db
    .selectFrom('mint_transactions')
    .selectAll()
    .where('uuid', '=', mintTransactionId)
    .executeTakeFirst()

  if (mintTx?.candy_machine_id) {
    const candyMachine = await db
      .selectFrom('candy_machines')
      .selectAll()
      .where('id', '=', mintTx.candy_machine_id)
      .executeTakeFirst()

    if (candyMachine) {
      const newRedeemed = (candyMachine.items_redeemed || 0) + 1
      const itemsRemaining = (candyMachine.items_available || 0) - newRedeemed

      await db
        .updateTable('candy_machines')
        .set({
          items_redeemed: newRedeemed,
          updated_at: new Date().toISOString(),
        })
        .where('id', '=', candyMachine.id)
        .execute()

      // Check if sold out
      if (itemsRemaining <= 0) {
        await db
          .updateTable('candy_machines')
          .set({
            status: 'sold_out',
            message: 'All items have been minted',
            status_changed_at: new Date().toISOString(),
          })
          .where('id', '=', candyMachine.id)
          .execute()

        if (candyMachine.collection_id) {
          await db
            .updateTable('collections')
            .set({
              is_minting: 0,
              updated_at: new Date().toISOString(),
            })
            .where('id', '=', candyMachine.collection_id)
            .execute()
        }
      }
    }
  }

  return response.json({
    success: true,
    transaction: { signature, status: 'confirmed' },
    action: 'mint',
    mint: {
      transactionId: mintTransactionId,
      mintAddress,
    },
  })
}

async function handleAcceptOffer(nftId: number | undefined, signature: string, metadata?: Record<string, any>) {
  const offerId = metadata?.offerId
  if (!offerId) {
    return response.json({ error: 'metadata.offerId is required for accept_offer action' }, 400)
  }

  const offer = await db
    .selectFrom('offers')
    .selectAll()
    .where('uuid', '=', offerId)
    .executeTakeFirst()

  if (!offer) {
    return response.notFound({ error: 'Offer not found' })
  }

  // Update offer status
  await db
    .updateTable('offers')
    .set({
      status: 'accepted',
      transaction_signature: signature,
      updated_at: new Date().toISOString(),
    })
    .where('id', '=', offer.id)
    .execute()

  // Transfer NFT ownership
  const targetNftId = nftId || offer.nft_id
  if (targetNftId) {
    await db
      .updateTable('nfts')
      .set({
        owner_wallet_address: offer.buyer_wallet_address,
        is_for_sale: 0,
        listing_id: null,
        delegate_address: null,
        listed_at: null,
        listing_price: null,
        updated_at: new Date().toISOString(),
      })
      .where('id', '=', Number(targetNftId))
      .execute()
  }

  await recordPlatformFee('accept_offer', signature, Number(targetNftId), offer.mint_address, { ...metadata, saleAmount: offer.amount })

  return response.json({
    success: true,
    transaction: { signature, status: 'confirmed' },
    action: 'accept_offer',
    offer: {
      id: offerId,
      status: 'accepted',
      buyerWalletAddress: offer.buyer_wallet_address,
    },
  })
}

async function handleCancelAuction(signature: string, metadata?: Record<string, any>) {
  const auctionId = metadata?.auctionId
  if (!auctionId) {
    return response.json({ error: 'metadata.auctionId is required for cancel_auction action' }, 400)
  }

  await db
    .updateTable('auctions')
    .set({
      status: 'cancelled',
      transaction_signature: signature,
      updated_at: new Date().toISOString(),
    })
    .where('uuid', '=', auctionId)
    .execute()

  return response.json({
    success: true,
    transaction: { signature, status: 'confirmed' },
    action: 'cancel_auction',
    auction: { id: auctionId, status: 'cancelled' },
  })
}

async function handleCreateEscrow(nftId: number | undefined, signature: string, metadata?: Record<string, any>) {
  if (!nftId) {
    return response.json({ error: 'nftId is required for create_escrow action' }, 400)
  }

  const escrowId = metadata?.escrowId
  const price = metadata?.price

  await db
    .updateTable('nfts')
    .set({
      escrow_status: 'in_escrow',
      escrow_id: escrowId || null,
      escrow_price: price ? Number(price) : null,
      updated_at: new Date().toISOString(),
    })
    .where('id', '=', Number(nftId))
    .execute()

  return response.json({
    success: true,
    transaction: { signature, status: 'confirmed' },
    action: 'create_escrow',
    nft: { id: nftId, escrowStatus: 'in_escrow' },
  })
}

async function handleSettleEscrow(nftId: number | undefined, signature: string, metadata?: Record<string, any>) {
  if (!nftId) {
    return response.json({ error: 'nftId is required for settle_escrow action' }, 400)
  }

  const buyerWalletAddress = metadata?.buyerWalletAddress
  if (!buyerWalletAddress) {
    return response.json({ error: 'metadata.buyerWalletAddress is required for settle_escrow action' }, 400)
  }

  await db
    .updateTable('nfts')
    .set({
      owner_wallet_address: buyerWalletAddress,
      escrow_status: 'settled',
      escrow_id: null,
      escrow_price: null,
      is_for_sale: 0,
      listing_id: null,
      delegate_address: null,
      listed_at: null,
      listing_price: null,
      updated_at: new Date().toISOString(),
    })
    .where('id', '=', Number(nftId))
    .execute()

  await recordPlatformFee('settle_escrow', signature, nftId, undefined, metadata)

  return response.json({
    success: true,
    transaction: { signature, status: 'confirmed' },
    action: 'settle_escrow',
    nft: { id: nftId, newOwner: buyerWalletAddress, escrowStatus: 'settled' },
  })
}

async function handleCancelEscrow(nftId: number | undefined, signature: string, metadata?: Record<string, any>) {
  if (!nftId) {
    return response.json({ error: 'nftId is required for cancel_escrow action' }, 400)
  }

  await db
    .updateTable('nfts')
    .set({
      escrow_status: null,
      escrow_id: null,
      escrow_price: null,
      updated_at: new Date().toISOString(),
    })
    .where('id', '=', Number(nftId))
    .execute()

  return response.json({
    success: true,
    transaction: { signature, status: 'confirmed' },
    action: 'cancel_escrow',
    nft: { id: nftId, escrowStatus: null },
  })
}

async function handleQuickMint(signature: string, metadata?: Record<string, any>) {
  const mintAddress = metadata?.mintAddress
  const name = metadata?.name || 'Quick Minted NFT'
  const ownerWallet = metadata?.ownerWalletAddress
  const collectionId = metadata?.collectionId

  await db
    .insertInto('nfts')
    .values({
      name,
      mint_address: mintAddress || null,
      owner_wallet_address: ownerWallet || null,
      collection_id: collectionId ? Number(collectionId) : null,
      metadata_url: metadata?.uri || null,
      is_for_sale: 0,
      is_minting: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as any)
    .execute()

  // Record platform fee if applicable
  await recordPlatformFee('quick_mint', signature, undefined, mintAddress, metadata)

  return response.json({
    success: true,
    transaction: { signature, status: 'confirmed' },
    action: 'quick_mint',
    nft: { name, mintAddress, owner: ownerWallet },
  })
}

async function handleUpdateNFT(nftId: number | undefined, signature: string, metadata?: Record<string, any>) {
  if (!nftId) {
    return response.json({ error: 'nftId is required for update_nft action' }, 400)
  }

  const updates: Record<string, any> = { updated_at: new Date().toISOString() }
  if (metadata?.name) updates.name = metadata.name
  if (metadata?.imageUrl) updates.image_url = metadata.imageUrl
  if (metadata?.metadataUrl) updates.metadata_url = metadata.metadataUrl

  await db
    .updateTable('nfts')
    .set(updates)
    .where('id', '=', Number(nftId))
    .execute()

  return response.json({
    success: true,
    transaction: { signature, status: 'confirmed' },
    action: 'update_nft',
    nft: { id: nftId, ...metadata },
  })
}

async function recordPlatformFee(
  transactionType: string,
  signature: string,
  nftId?: number,
  mintAddress?: string,
  metadata?: Record<string, any>,
) {
  try {
    const config = tokensConfig as any
    const feeConfig = config.marketplace?.platformFee
    if (!feeConfig?.enabled || !feeConfig?.walletAddress) return

    const saleAmount = Number(metadata?.saleAmount || metadata?.price || 0)
    if (saleAmount <= 0) return

    const bps = feeConfig.basisPoints || 100
    const feeAmount = Math.floor((saleAmount * bps) / 10000)

    await PlatformFeeService.recordFee({
      transactionType,
      transactionSignature: signature,
      nftId,
      mintAddress,
      saleAmount,
      feeAmount,
      feeBasisPoints: bps,
      platformWallet: feeConfig.walletAddress,
      sellerWallet: metadata?.sellerWalletAddress,
      buyerWallet: metadata?.buyerWalletAddress,
    })
  } catch (error) {
    console.error('[PlatformFee] Failed to record fee:', error)
  }
}
