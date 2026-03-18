import { Action } from '@stacksjs/actions'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'

export default new Action({
  name: 'Swap Quote',
  description: 'Get a Jupiter swap quote for token conversion',
  method: 'GET',

  async handle(request: RequestInstance) {
    const inputMint = request.getParam('inputMint') || 'USDC'
    const outputMint = request.getParam('outputMint') || 'SOL'
    const amount = Number(request.getParam('amount') || 0)

    if (!amount || amount <= 0) {
      return response.json({ error: 'Valid amount required' }, 422)
    }

    // Well-known token mints
    const MINTS: Record<string, string> = {
      SOL: 'So11111111111111111111111111111111111111112',
      USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
    }

    const inputAddress = MINTS[inputMint] || inputMint
    const outputAddress = MINTS[outputMint] || outputMint

    // In production, this would call Jupiter API
    // For now, provide estimated rates
    const mockRates: Record<string, number> = {
      'USDC_SOL': 0.0066, // ~$150/SOL
      'SOL_USDC': 150,
      'USDT_SOL': 0.0066,
      'SOL_USDT': 150,
    }

    const rateKey = `${inputMint}_${outputMint}`
    const rate = mockRates[rateKey] || 1
    const outputAmount = amount * rate
    const priceImpact = amount > 10000 ? 0.3 : amount > 1000 ? 0.1 : 0.01

    return response.json({
      inputMint: inputAddress,
      outputMint: outputAddress,
      inputAmount: amount,
      outputAmount: Number(outputAmount.toFixed(6)),
      rate,
      priceImpact,
      fee: Number((amount * 0.003).toFixed(6)), // 0.3% swap fee
      route: `${inputMint} → ${outputMint}`,
    })
  },
})
