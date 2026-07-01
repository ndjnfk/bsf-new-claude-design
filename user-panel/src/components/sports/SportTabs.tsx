import { Link } from 'react-router-dom'
import type { SportMenuItem } from '../../types'

// Sport pill-tabs (Angular nav-pills). Each tab links to its route with the
// ?sport_id= query param; the active sport is highlighted.
export function SportTabs({ items, activeId }: { items: SportMenuItem[]; activeId: string }) {
  return (
    <div className="dash-ul">
      <ul id="nav-tabs" role="tablist" className="nav nav-pills text-nowrap justify-content-lg-center overflowX-auto border-0">
        {items.map((s) => (
          <li className="nav-item position-relative item_main" key={s.id}>
            <Link
              className={`nav-item nav-link ${String(activeId) === String(s.id) ? 'sportActive' : ''}`}
              to={`${s.url}?sport_id=${s.qr?.sport_id ?? s.id}`}
            >
              <img className="dash-icon" src={s.image} alt={s.name} />
              <span> {s.name}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
