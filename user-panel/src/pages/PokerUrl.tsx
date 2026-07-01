import { useEffect, useState } from 'react'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { Loader } from '../components/common/Loader'
import { getPokerGameList, getPokerGameUrl, type GameThumb } from '../services/casinoApi'
import { isMobile } from '../utils/device'

// Route: pokerUrl — game grid; clicking a tile fetches the URL and opens it in a new
// window (matching the Angular behaviour, no iframe here).
export default function PokerUrl() {
  useDocumentTitle('Poker')
  const [games, setGames] = useState<GameThumb[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getPokerGameList()
      .then((r) => setGames(r.data ?? []))
      .catch(() => setGames([]))
      .finally(() => setLoading(false))
  }, [])

  const open = (gameCode: string) => {
    getPokerGameUrl(gameCode)
      .then((res) => {
        const url = encodeURI(isMobile() ? res.mobileUrl : res.desktopUrl)
        if (url) window.open(url, '_blank')
      })
      .catch(() => undefined)
  }

  if (loading) return <Loader />

  return (
    <div id="wrapper">
      <div className="container py-3">
        <div className="row g-2">
          {games.map((s) => (
            <div className="col-6 col-md-3 col-lg-2" key={s.id}>
              <a role="button" className="rounded-3 d-block" onClick={() => open(s.id)}>
                <img src={s.image} className="w-100 rounded-3" alt={s.name} />
              </a>
            </div>
          ))}
          {games.length === 0 ? <p className="text-center py-4">No games available</p> : null}
        </div>
      </div>
    </div>
  )
}
