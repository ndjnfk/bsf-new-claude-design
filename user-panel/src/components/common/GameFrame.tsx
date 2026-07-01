import { Loader } from './Loader'

// Full-bleed game iframe used by every casino/poker launcher. React's `src` does NOT
// execute scripts, so binding a URL is the safe equivalent of Angular's SafeUrl pipe —
// no DomSanitizer bypass is needed. An empty/undefined url shows the loader instead.
export function GameFrame({ url, title = 'Game' }: { url: string | undefined; title?: string }) {
  if (!url) return <Loader label="Launching game…" />
  return (
    <iframe
      title={title}
      src={url}
      className="border-0"
      style={{ width: '100%', height: '100vh', display: 'block' }}
      allow="autoplay; fullscreen"
      allowFullScreen
    />
  )
}
