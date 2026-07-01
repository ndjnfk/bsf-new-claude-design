import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { GameFrame } from '../components/common/GameFrame'
import { getDreamGameUrl } from '../services/casinoApi'
import { isDesktopDevice } from '../utils/device'

// Route: dreamCasino/game/:game_code — POST dream/gameUrl { desktop, lobby_url,
// game_code } → iframe(data.url).
export default function DreamCasinoGame() {
  const { game_code = '' } = useParams()
  useDocumentTitle('Dream Casino Game')
  const [url, setUrl] = useState<string | undefined>()

  useEffect(() => {
    let active = true
    getDreamGameUrl({ desktop: isDesktopDevice(), lobby_url: location.href, game_code })
      .then((res) => {
        if (active) setUrl(res.data?.url)
      })
      .catch(() => {
        if (active) setUrl(undefined)
      })
    return () => {
      active = false
    }
  }, [game_code])

  return (
    <div style={{ height: 'calc(100vh - 40px)' }}>
      <GameFrame url={url} title="Dream Casino Game" />
    </div>
  )
}
