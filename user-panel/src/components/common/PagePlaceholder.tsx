import type { ReactNode } from 'react'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'

// Temporary stand-in shown for routes whose real UI is migrated in a later step.
// Keeps the route reachable (and the title set) so navigation works end-to-end.
export function PagePlaceholder({ title, note }: { title: string; note?: ReactNode }) {
  useDocumentTitle(title)
  return (
    <div className="container py-4">
      <h1 className="h4 mb-2">{title}</h1>
      <p className="text-muted mb-0">{note ?? 'This page will be migrated in a later step.'}</p>
    </div>
  )
}
