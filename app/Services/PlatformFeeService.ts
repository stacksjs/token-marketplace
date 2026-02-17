import { db } from '@stacksjs/database'
import tokensConfig from '../../config/tokens'

export class PlatformFeeService {
  static calculateFee(salePriceLamports: bigint): { feeAmount: bigint; netAmount: bigint } {
    const config = tokensConfig as any
    const feeConfig = config.marketplace?.platformFee
    if (!feeConfig?.enabled || !feeConfig?.walletAddress) {
      return { feeAmount: BigInt(0), netAmount: salePriceLamports }
    }
    const bps = BigInt(feeConfig.basisPoints || 100)
    const feeAmount = (salePriceLamports * bps) / BigInt(10000)
    const netAmount = salePriceLamports - feeAmount
    return { feeAmount, netAmount }
  }

  static async recordFee(params: {
    transactionType: string
    transactionSignature?: string
    nftId?: number
    mintAddress?: string
    saleAmount: number
    feeAmount: number
    feeBasisPoints?: number
    platformWallet: string
    sellerWallet?: string
    buyerWallet?: string
  }): Promise<void> {
    try {
      await db
        .insertInto('platform_fees')
        .values({
          transaction_type: params.transactionType,
          transaction_signature: params.transactionSignature || null,
          nft_id: params.nftId || null,
          mint_address: params.mintAddress || null,
          sale_amount: params.saleAmount,
          fee_amount: params.feeAmount,
          fee_basis_points: params.feeBasisPoints || 100,
          platform_wallet: params.platformWallet,
          seller_wallet: params.sellerWallet || null,
          buyer_wallet: params.buyerWallet || null,
          created_at: new Date().toISOString(),
        } as any)
        .execute()
    } catch (error) {
      console.error('[PlatformFeeService] Failed to record fee:', error instanceof Error ? error.message : error)
      // Re-throw so callers know the fee recording failed
      throw error
    }
  }

  static async getTotalFees(): Promise<{ totalFees: number; totalTransactions: number }> {
    const totalFees = await db.selectFrom('platform_fees' as any).sum('fee_amount') || 0
    const totalTransactions = await db.selectFrom('platform_fees' as any).count() || 0

    return {
      totalFees: Number(totalFees),
      totalTransactions: Number(totalTransactions),
    }
  }

  static async getRecentFees(limit: number = 20): Promise<any[]> {
    const fees = await db
      .selectFrom('platform_fees' as any)
      .selectAll()
      .orderBy('created_at', 'desc')
      .limit(limit)
      .execute()

    return fees
  }
}

export default PlatformFeeService
