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
  }

  static async getTotalFees(): Promise<{ totalFees: number; totalTransactions: number }> {
    const result = await db
      .selectFrom('platform_fees' as any)
      .select([
        db.fn.sum('fee_amount').as('total_fees'),
        db.fn.count('id').as('total_transactions'),
      ])
      .executeTakeFirst()

    return {
      totalFees: Number((result as any)?.total_fees || 0),
      totalTransactions: Number((result as any)?.total_transactions || 0),
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
