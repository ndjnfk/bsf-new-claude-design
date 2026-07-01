import { useEffect, useState } from 'react'
import { UAParser } from 'ua-parser-js'
import { Header } from '../components/layout/Header'
import { Loader } from '../components/common/Loader'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { getPokerUrl, getUserCasinoLimit } from '../services/casinoApi'
import './PokerPage.scss'

// Poker page — a full-screen game launcher gated by the user's casino limit.
// Renders the shared Header only (no Sidebar/Footer). The launch URL and limit are
// read from the existing authenticated API client; the enable/disable rule is the
// exact logic ported from the Angular PokersController flow.
export default function PokerPage() {
  useDocumentTitle('Poker')

  // Stay in loading until BOTH calls resolve, so the limit-over card never flashes
  // before the real limit is known.
  const [loading, setLoading] = useState(true)
  const [isGameEnable, setIsGameEnable] = useState(false)
  const [pokerUrl, setPokerUrl] = useState<string | undefined>(undefined)

  useEffect(() => {
    // Device detection via ua-parser-js → mobile vs desktop launch URL.
    const parser = new UAParser()
    const isMobile = parser.getDevice().type === 'mobile'

    setLoading(true)
    Promise.all([
      getPokerUrl()
        .then((res) => {
          // URLs live at the response root; encode both, pick by device.
          const rawUrl = isMobile ? res.mobileUrl : res.desktopUrl
          setPokerUrl(rawUrl ? encodeURI(rawUrl) : undefined)
        })
        .catch(() => setPokerUrl(undefined)),

      getUserCasinoLimit()
        .then((response) => {
          const data = response.data
          const casinoLimit = Number(data?.casino_limit)
          const netChips = Number(data?.data?.[0]?.NetChips)

          // Game enable/disable logic — preserved exactly.
          let isGameEnable: boolean
          if (casinoLimit === 0) {
            isGameEnable = false
          } else if (Number.isNaN(casinoLimit) || Number.isNaN(netChips)) {
            isGameEnable = true
          } else {
            isGameEnable = netChips > -casinoLimit
          }
          setIsGameEnable(isGameEnable)
        })
        .catch(() => setIsGameEnable(false)),
    ]).finally(() => setLoading(false))
  }, [])

  return (
    <div className="poker-page">
      <Header />

      {loading ? (
        <Loader />
      ) : isGameEnable ? (
        <iframe
          src={pokerUrl}
          title="Poker Game"
          className="poker-iframe"
          width="100%"
          frameBorder="0"
          allowFullScreen
        />
      ) : (
        <div className="poker-limit-wrap">
          <div className="poker-limit-card">
            <p className="poker-limit-title">Entertainment Limit</p>
            <p className="poker-limit-sub">Is over</p>
            <p className="poker-limit-contact">Contact upline !</p>
          </div>
        </div>
      )}
    </div>
  )
}
