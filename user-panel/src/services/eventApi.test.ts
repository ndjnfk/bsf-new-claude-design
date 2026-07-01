import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock the shared axios verb helper so we can assert the exact URL / params / signal.
vi.mock('../api/http', () => ({
  get: vi.fn().mockResolvedValue({ status: true, data: [] }),
  post: vi.fn(),
}))

import { get } from '../api/http'
import { getEventMarkets } from './bettingApi'

const getMock = vi.mocked(get)

describe('getEventMarkets', () => {
  beforeEach(() => vi.clearAllMocks())

  it('builds the dynamic URL from the ids (nothing hardcoded)', async () => {
    await getEventMarkets('35754708', '1.259435885', '4')
    expect(getMock).toHaveBeenCalledWith(
      'matches/35754708/markets',
      expect.objectContaining({ params: { marketId: '1.259435885', sportId: '4' } }),
    )
  })

  it('preserves the exact query-param spelling: marketId / sportId', async () => {
    await getEventMarkets('1', '2', '3')
    const config = getMock.mock.calls[0][1]
    expect(Object.keys(config?.params ?? {})).toEqual(['marketId', 'sportId'])
  })

  it('forwards an AbortSignal for request cancellation', async () => {
    const ctrl = new AbortController()
    await getEventMarkets('1', '2', '3', ctrl.signal)
    expect(getMock).toHaveBeenCalledWith('matches/1/markets', expect.objectContaining({ signal: ctrl.signal }))
  })
})
