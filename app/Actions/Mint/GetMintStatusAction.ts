import { Action } from '@stacksjs/actions'
import { db } from '@stacksjs/database'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'
import { toCamelCase } from '../helpers'

export default new Action({
  name: 'Get Mint Status',
  description: 'Get the status of a mint transaction',
  method: 'GET',

  async handle(request: RequestInstance) {
    const transactionId = request.getParam('transactionId')

    if (!transactionId) {
      return response.json({
        error: 'transactionId parameter is required',
      }, 400)
    }

    // Find the mint transaction
    const mintTransaction = await db
      .selectFrom('mint_transactions')
      .selectAll()
      .where('uuid', '=', transactionId)
      .executeTakeFirst()

    if (!mintTransaction) {
      return response.notFound({ error: 'Mint transaction not found' })
    }

    // Get associated NFT if minted
    let nft = null
    if (mintTransaction.nft_id) {
      nft = await db
        .selectFrom('nfts')
        .selectAll()
        .where('id', '=', mintTransaction.nft_id)
        .executeTakeFirst()
    }

    // Get candy machine info
    let candyMachine = null
    if (mintTransaction.candy_machine_id) {
      candyMachine = await db
        .selectFrom('candy_machines')
        .select(['id', 'uuid', 'candy_machine_address', 'symbol', 'collection_id'])
        .where('id', '=', mintTransaction.candy_machine_id)
        .executeTakeFirst()
    }

    return response.json({
      transaction: toCamelCase(mintTransaction),
      nft: nft ? toCamelCase(nft) : null,
      candyMachine: candyMachine ? toCamelCase(candyMachine) : null,
    })
  },
})
