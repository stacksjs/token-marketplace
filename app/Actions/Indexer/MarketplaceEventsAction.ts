import { Action } from '@stacksjs/actions'
import { db } from '@stacksjs/database'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'
import { indexerService } from '../../Services/IndexerService'

export default new Action({
  name: 'Marketplace Events',
  description: 'Get marketplace activity events with optional filtering by type, collection, or wallet',
  method: 'GET',

  async handle(request: RequestInstance) {
    const type = request.getParam('type') || undefined
    const collectionId = request.getParam('collectionId')
      ? Number(request.getParam('collectionId'))
      : undefined
    const wallet = request.getParam('wallet') || undefined
    const limit = Math.min(100, Math.max(1, Number(request.getParam('limit')) || 50))
    const cursor = request.getParam('cursor')
      ? Number(request.getParam('cursor'))
      : undefined

    const events = await indexerService.getEvents(db, {
      type,
      collectionId,
      wallet,
      limit,
      cursor,
    })

    const nextCursor = events.length === limit
      ? events[events.length - 1]?.id
      : null

    return response.json({
      data: events,
      cursor: nextCursor,
      limit,
    })
  },
})
