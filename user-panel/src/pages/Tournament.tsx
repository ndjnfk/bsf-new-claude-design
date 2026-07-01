import { useDocumentTitle } from '../hooks/useDocumentTitle'

// Tournament — the Angular component renders only the header with no content yet.
export default function Tournament() {
  useDocumentTitle('Tournament')
  return (
    <div id="wrapper">
      <div className="content-page m-0">
        <div className="content">
          <div className="container py-4">
            <h4 className="mb-2">Tournament</h4>
            <p className="text-muted mb-0">No tournaments available right now.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
