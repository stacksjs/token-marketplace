import { Action } from '@stacksjs/actions'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'
import { imageCDNService } from '../../Services/ImageCDNService'

export default new Action({
  name: 'Image CDN Status',
  description: 'Get the current status and statistics of the Image CDN service',
  method: 'GET',

  async handle(_request: RequestInstance) {
    const stats = imageCDNService.getStats()
    const sharpAvailable = await imageCDNService.isSharpAvailable()

    return response.json({
      status: 'running',
      sharpAvailable,
      cache: {
        memoryEntries: stats.memoryCacheEntries,
        memorySizeMB: Math.round(stats.memoryCacheSize / 1024 / 1024 * 100) / 100,
        diskEnabled: stats.diskCacheEnabled,
      },
      traffic: {
        totalServed: stats.totalServed,
        totalFetched: stats.totalFetched,
        totalErrors: stats.totalErrors,
        cacheHitRate: stats.totalServed > 0
          ? Math.round((1 - stats.totalFetched / stats.totalServed) * 100)
          : 0,
      },
      allowedHosts: stats.allowedHosts,
      presets: imageCDNService.getPresets(),
    })
  },
})
