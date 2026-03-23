import { Action } from '@stacksjs/actions'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'
import { imageCDNService, ImageCDNError } from '../../Services/ImageCDNService'

export default new Action({
  name: 'Image Proxy',
  description: 'Proxy and optionally resize NFT images from external sources with caching and SSRF protection',
  method: 'GET',

  async handle(request: RequestInstance) {
    const url = new URL(request.getUrl?.() || request.url || '', 'http://localhost')
    const imageUrl = url.searchParams.get('url')
    const widthParam = url.searchParams.get('w')
    const heightParam = url.searchParams.get('h')
    const quality = url.searchParams.get('q')
    const format = url.searchParams.get('f')
    const preset = url.searchParams.get('preset')

    if (!imageUrl) {
      return response.json({ error: 'Missing url parameter' }, 400)
    }

    // Use preset if specified, otherwise build options from params
    let options = preset ? imageCDNService.getPreset(preset) : undefined

    if (!options) {
      options = {}
      if (widthParam) options.width = Math.min(2000, Math.max(1, Number.parseInt(widthParam, 10)))
      if (heightParam) options.height = Math.min(2000, Math.max(1, Number.parseInt(heightParam, 10)))
      if (quality) options.quality = Math.min(100, Math.max(1, Number.parseInt(quality, 10)))
      if (format && ['webp', 'jpeg', 'png', 'avif'].includes(format)) {
        options.format = format as 'webp' | 'jpeg' | 'png' | 'avif'
      }
    }

    try {
      const cached = await imageCDNService.getImage(imageUrl, options)
      const headers = imageCDNService.getResponseHeaders(cached)

      return new Response(cached.buffer, { headers })
    }
    catch (err) {
      if (err instanceof ImageCDNError) {
        const statusMap: Record<string, number> = {
          FORBIDDEN_HOST: 403,
          FETCH_FAILED: 502,
          SOURCE_ERROR: 502,
          INVALID_CONTENT_TYPE: 415,
          TOO_LARGE: 413,
        }
        const status = statusMap[err.code] || 500
        return response.json({ error: err.message, code: err.code }, status)
      }

      return response.json({ error: 'Internal server error' }, 500)
    }
  },
})
