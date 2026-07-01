import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { fetchCasinoLimit } from '../services/dashboardApi'

// Games list — gated by the user's casino limit (Angular getUserCasinoLimit):
//  casino_limit == 0      → disabled
//  limit/netChips NaN     → enabled
//  else                   → enabled when netChips > -casino_limit
export default function GamesList() {
  useDocumentTitle('Games List')
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    fetchCasinoLimit()
      .then((rs) => {
        const casinoLimit = Number(rs.data?.casino_limit)
        const netChips = Number(rs.data?.data?.[0]?.NetChips)
        if (casinoLimit === 0) setEnabled(false)
        else if (Number.isNaN(casinoLimit) || Number.isNaN(netChips)) setEnabled(true)
        else setEnabled(netChips > -casinoLimit)
      })
      .catch(() => setEnabled(false))
  }, [])

  if (!enabled) return null

  return (
    <div id="wrapper">
      <div className="content-page m-0">
        <div className="content">
          <div className="container">
            <div className="row g-2 pt-2">
              <div className="game-box col-6 col-lg-3">
                <Link to="/pokerUrl">
                  <img className="game-img w-100" src="/assets/image/indian-casino.webp" alt="Indian Casino" />
                </Link>
              </div>
              <div className="game-box col-6 col-lg-3">
                <Link to="/dreamCasino">
                  <img className="game-img w-100" src="/assets/image/international-casion.webp" alt="International Casino" />
                </Link>
              </div>
              <div className="game-box col-6 col-lg-3">
                <Link to="/poker">
                  <img className="game-img w-100" src="/assets/image/royal-casino.webp" alt="Royal Casino" />
                </Link>
              </div>
              <div className="game-box col-6 col-lg-3">
                <Link to="">
                  <img className="game-img w-100" src="/assets/image/aviator.webp" alt="Aviator" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
