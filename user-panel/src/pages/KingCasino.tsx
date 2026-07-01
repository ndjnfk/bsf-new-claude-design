import { useMemo } from 'react'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { GameFrame } from '../components/common/GameFrame'
import { getToken } from '../api/token'

// Route: kingCasino — builds the launch URL from the session token (escaping `auth:`
// and `|`) and embeds it. Preserved exactly from the Angular component.
export default function KingCasino() {
  useDocumentTitle('King Casino')
  const url = useMemo(() => {
    const token = getToken()
    if (!token) return undefined
    const escaped = token.replace('auth:', 'AUTHCOLON').replace(/\|/g, 'PIPE')
    return encodeURI(`https://casinolive8.io/${escaped}/${1237}`)
  }, [])
  return <GameFrame url={url} title="King Casino" />
}
