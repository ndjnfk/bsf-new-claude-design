import { Pagination as BsPagination } from 'react-bootstrap'

// Reusable prev / page-indicator / next pager (the React equivalent of the Angular
// ngx-pagination controls). `total` is total items, `perPage` the page size.
export function Pagination({
  page,
  total,
  perPage,
  onChange,
}: {
  page: number
  total: number
  perPage: number
  onChange: (page: number) => void
}) {
  const totalPages = Math.max(1, Math.ceil(total / Math.max(1, perPage)))
  if (totalPages <= 1) return null
  return (
    <div className="text-center">
      <BsPagination className="justify-content-center mb-0">
        <BsPagination.Prev disabled={page <= 1} onClick={() => onChange(page - 1)} />
        <BsPagination.Item active>{`Page ${page} of ${totalPages}`}</BsPagination.Item>
        <BsPagination.Next disabled={page >= totalPages} onClick={() => onChange(page + 1)} />
      </BsPagination>
    </div>
  )
}
