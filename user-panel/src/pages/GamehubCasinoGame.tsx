import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { GameFrame } from '../components/common/GameFrame'
import { getGamehubGameUrl } from '../services/casinoApi'

// Route: gamehubCasino/game/:gameId — POST gamehub/gameUrl { gameId } → iframe(data).
// Note: gamehub returns the URL directly as `data` (not nested under `.url`).
export default function GamehubCasinoGame() {
  const { gameId = '' } = useParams()
  useDocumentTitle('Gamehub Casino Game')
  const [url, setUrl] = useState<string | undefined>()

  useEffect(() => {
    let active = true
    getGamehubGameUrl({ gameId })
      .then((res) => {
        if (active) setUrl(res.data)
      })
      .catch(() => {
        if (active) setUrl(undefined)
      })
    return () => {
      active = false
    }
  }, [gameId])

  return <GameFrame url={url} title="Gamehub Casino Game" />
}
