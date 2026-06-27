import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useRooms } from './useRoom'
import { getParents } from '../lib/api'
import { useAuth } from '../store/auth'

// Catalog query keys a block change can affect.
const CATALOG_KEYS = ['sports', 'series', 'matches', 'series-matches', 'markets', 'line-markets', 'my-blocks']

function isCatalogMsg(msg: unknown): boolean {
  return typeof msg === 'object' && msg !== null && (msg as { type?: string }).type === 'CATALOG_BLOCKS'
}

// useCatalogSync gives real-time, SUBTREE-SCOPED catalog refresh. The client
// subscribes to a room for every account in its hierarchy chain (self + all
// ancestors). When a panel blocks/unblocks an item it publishes to ITS OWN room,
// so only that panel's downline — who have it as an ancestor — refresh. A
// Company's block reaches just that company's tree; the SDA's reaches everyone.
export function useCatalogSync() {
  const qc = useQueryClient()
  const username = useAuth((s) => s.user?.mstruserid)

  // The ancestor chain (self first, then parents up to root).
  const { data: chain = [] } = useQuery({
    queryKey: ['parents', username],
    queryFn: () => getParents(username!).then((r) => r ?? []),
    enabled: !!username,
    staleTime: 5 * 60 * 1000,
  })
  const rooms = chain.map((p) => `CATALOG_BLOCKS:${p.userId}`)

  useRooms(rooms, (msg) => {
    if (!isCatalogMsg(msg)) return
    for (const key of CATALOG_KEYS) qc.invalidateQueries({ queryKey: [key] })
  })
}
