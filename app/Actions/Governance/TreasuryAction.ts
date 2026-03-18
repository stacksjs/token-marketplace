import { Action } from '@stacksjs/actions'
import { db } from '@stacksjs/database'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'

export default new Action({
  name: 'Treasury Overview',
  description: 'Get DAO treasury balance and transaction history',
  method: 'GET',

  async handle(_request: RequestInstance) {
    try {
      const daos = await db.selectFrom('daos' as any).selectAll().execute()

      const enriched = await Promise.all((daos as any[]).map(async (dao) => {
        let transactions: any[] = []
        try {
          transactions = await db
            .selectFrom('treasury_transactions' as any)
            .selectAll()
            .where('dao_id', '=', dao.id)
            .execute()
        }
        catch {}

        const deposits = transactions.filter((t: any) => t.type === 'deposit')
        const withdrawals = transactions.filter((t: any) => t.type === 'withdrawal')
        const totalDeposited = deposits.reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0)
        const totalWithdrawn = withdrawals.reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0)

        return {
          dao: { id: dao.id, name: dao.name, treasuryAddress: dao.treasury_address },
          balance: totalDeposited - totalWithdrawn,
          totalDeposited,
          totalWithdrawn,
          recentTransactions: transactions
            .sort((a: any, b: any) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
            .slice(0, 20),
        }
      }))

      return response.json({ treasuries: enriched })
    }
    catch {
      return response.json({ treasuries: [] })
    }
  },
})
