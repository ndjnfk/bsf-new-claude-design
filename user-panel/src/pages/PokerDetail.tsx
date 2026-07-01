import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { GameFrame } from '../components/common/GameFrame'
import { getPokerGameUrl } from '../services/casinoApi'
import { isMobile } from '../utils/device'

// Route: poker/detail/:id — launches a specific poker game in an iframe.
export default function PokerDetail() {
  const { id = '' } = useParams()
  useDocumentTitle('Poker Game')
  const [url, setUrl] = useState<string | undefined>()

  useEffect(() => {
    let active = true
    getPokerGameUrl(id)
      .then((res) => {
        if (active) setUrl(encodeURI(isMobile() ? res.mobileUrl : res.desktopUrl))
      })
      .catch(() => {
        if (active) setUrl(undefined)
      })
    return () => {
      active = false
    }
  }, [id])

  return <GameFrame url={url} title="Poker Game" />
}
