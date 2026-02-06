import { Action } from '@stacksjs/actions'
import { db } from '@stacksjs/database'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'

const VALID_STATUSES = ['not_started', 'ready', 'minting', 'paused', 'sold_out'] as const
type CandyMachineStatus = typeof VALID_STATUSES[number]

// Valid status transitions
const STATUS_TRANSITIONS: Record<string, CandyMachineStatus[]> = {
  not_started: ['ready'],
  deploying: ['ready', 'failed'],
  ready: ['minting', 'paused'],
  minting: ['paused', 'sold_out'],
  paused: ['minting', 'ready'],
  sold_out: [], // Terminal state
  failed: ['not_started'], // Can retry
}

export default new Action({
  name: 'Update Candy Machine Status',
  description: 'Update the status of a candy machine (start/pause/resume)',
  method: 'PATCH',

  async handle(request: RequestInstance) {
    const candyMachineId = request.getParam('id')
    const body = await request.json()

    const { status, message } = body

    if (!status) {
      return response.json({ error: 'status is required' }, 400)
    }

    if (!VALID_STATUSES.includes(status)) {
      return response.json({
        error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
      }, 400)
    }

    // Get current candy machine
    const candyMachine = await db
      .selectFrom('candy_machines')
      .selectAll()
      .where('id', '=', Number(candyMachineId))
      .executeTakeFirst()

    if (!candyMachine) {
      return response.notFound({ error: 'Candy machine not found' })
    }

    // Check valid status transition
    const allowedTransitions = STATUS_TRANSITIONS[candyMachine.status || 'not_started'] || []
    if (!allowedTransitions.includes(status)) {
      return response.json({
        error: `Cannot transition from '${candyMachine.status}' to '${status}'. Allowed transitions: ${allowedTransitions.join(', ') || 'none'}`,
      }, 400)
    }

    // Check if sold out when trying to start minting
    if (status === 'minting') {
      const itemsRemaining = (candyMachine.items_available || 0) - (candyMachine.items_redeemed || 0)
      if (itemsRemaining <= 0) {
        return response.json({
          error: 'Cannot start minting - no items remaining',
        }, 400)
      }
    }

    // Update status
    await db
      .updateTable('candy_machines')
      .set({
        status,
        message: message || getStatusMessage(status),
        status_changed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .where('id', '=', Number(candyMachineId))
      .execute()

    // If starting minting, also update collection
    if (status === 'minting' && candyMachine.collection_id) {
      await db
        .updateTable('collections')
        .set({
          is_minting: 1,
          updated_at: new Date().toISOString(),
        })
        .where('id', '=', candyMachine.collection_id)
        .execute()
    }

    // If pausing or sold out, update collection
    if ((status === 'paused' || status === 'sold_out') && candyMachine.collection_id) {
      await db
        .updateTable('collections')
        .set({
          is_minting: 0,
          updated_at: new Date().toISOString(),
        })
        .where('id', '=', candyMachine.collection_id)
        .execute()
    }

    // Fetch updated candy machine
    const updated = await db
      .selectFrom('candy_machines')
      .selectAll()
      .where('id', '=', Number(candyMachineId))
      .executeTakeFirst()

    return response.json({
      candyMachine: {
        id: updated?.id,
        uuid: updated?.uuid,
        status: updated?.status,
        message: updated?.message,
        statusChangedAt: updated?.status_changed_at,
      },
    })
  },
})

function getStatusMessage(status: CandyMachineStatus): string {
  const messages: Record<CandyMachineStatus, string> = {
    not_started: 'Candy machine created but not started',
    ready: 'Candy machine is ready for minting',
    minting: 'Minting is now live',
    paused: 'Minting has been paused',
    sold_out: 'All items have been minted',
  }
  return messages[status]
}
