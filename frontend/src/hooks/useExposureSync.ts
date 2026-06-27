import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useRoom } from './useRoom'
import { getSummary, type AccountSummary } from '../lib/api'
import { useAuth } from '../store/auth'

// useExposureSync keeps the logged-in user's exposure live. The backend publishes
// an EXPOSURE:<userId> event (with a delta) every time a bet in this user's
// subtree adds liability or a settlement releases it. We apply the delta straight
// to the cached summary — instant, and no refetch under bet volume.
export function useExposureSync(): AccountSummary | undefined {
  const qc = useQueryClient()
  const userId = useAuth((s) => s.user?.id)

  const { data } = useQuery({ queryKey: ['summary'], queryFn: getSummary, enabled: !!userId })

  useRoom(userId ? `EXPOSURE:${userId}` : null, (msg) => {
    const m = msg as { type?: string; delta?: number }
    if (m?.type !== 'EXPOSURE' || typeof m.delta !== 'number') return
    qc.setQueryData<AccountSummary>(['summary'], (prev) =>
      prev ? { ...prev, exposure: prev.exposure + m.delta! } : prev)
  })

  return data
}
