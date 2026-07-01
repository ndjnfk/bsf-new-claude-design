import { useEffect, useState } from 'react'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { Loader } from '../components/common/Loader'
import { GameFrame } from '../components/common/GameFrame'
import { casinoLimitEnabled, getPokerUrl, getUserCasinoLimit } from '../services/casinoApi'
import { isMobile } from '../utils/device'

// Poker lobby — gated by the casino limit, then the mobile/desktop URL in an iframe.
export default function Poker() {
  useDocumentTitle('Poker')
  const [loading, setLoading] = useState(true)
  const [enabled, setEnabled] = useState(false)
  const [url, setUrl] = useState<string | undefined>()

  useEffect(() => {
    setLoading(true)
    Promise.all([
      getUserCasinoLimit()
        .then((rs) => setEnabled(casinoLimitEnabled(rs.data?.casino_limit, rs.data?.data?.[0]?.NetChips)))
        .catch(() => setEnabled(false)),
      getPokerUrl()
        .then((rs) => setUrl(encodeURI(isMobile() ? rs.mobileUrl : rs.desktopUrl)))
        .catch(() => setUrl(undefined)),
    ]).finally(() => setLoading(false))
  }, [])

  if (loading) return <Loader />
  if (!enabled) return <p className="text-center py-5">Entertainment Limit Is over</p>
  return <GameFrame url={url} title="Poker" />
}
