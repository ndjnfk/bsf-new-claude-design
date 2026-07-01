import { useEffect } from 'react'

// Sets the document title and restores it on unmount.
export function useDocumentTitle(title: string): void {
  useEffect(() => {
    const prev = document.title
    document.title = title ? `${title} · BSF2020` : 'BSF2020'
    return () => {
      document.title = prev
    }
  }, [title])
}
