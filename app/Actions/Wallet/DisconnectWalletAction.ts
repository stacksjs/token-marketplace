import { Action } from '@stacksjs/actions'
import { response } from '@stacksjs/router'

export default new Action({
  name: 'DisconnectWallet',
  description: 'Disconnect the current wallet',
  method: 'POST',

  async handle() {
    return response.json({ success: true })
  },
})
