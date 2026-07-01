import { useCallback, useEffect, useState } from 'react'
import { Carousel } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { Loader } from '../components/common/Loader'
import { Pagination } from '../components/common/Pagination'
import { getGamehubGameList, type GameThumb } from '../services/casinoApi'
import { isMobile } from '../utils/device'

const BANNERS = ['/assets/image/royal-casino.webp', '/assets/image/aviator.webp', '/assets/image/indian-casino.webp']

// Route: gamehubCasino — paginated game list with a category filter + banner carousel.
export default function GamehubCasino() {
  useDocumentTitle('Gamehub Casino')
  const [games, setGames] = useState<GameThumb[]>([])
  const [categories, setCategories] = useState<Array<{ type: string }>>([])
  const [type, setType] = useState('')
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState({ total: 0, perPage: 12 })
  const [loading, setLoading] = useState(false)

  const init = useCallback((p: number, t: string) => {
    setLoading(true)
    setPage(p)
    setType(t)
    getGamehubGameList({ page: p, type: t, mobile: isMobile() ? 1 : 0 })
      .then((value) => {
        setGames(value.data?.data ?? [])
        setCategories(value.categories ?? [])
        setMeta({ total: value.data?.meta?.total ?? 0, perPage: value.data?.meta?.per_page ?? 12 })
      })
      .catch(() => setGames([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => init(1, ''), [init])

  return (
    <div id="wrapper">
      <div className="container py-2">
        <Carousel controls={false} indicators={false} interval={3000} className="mb-3">
          {BANNERS.map((b, i) => (
            <Carousel.Item key={i}>
              <img src={b} alt={`Banner ${i + 1}`} className="d-block w-100 rounded-3" style={{ maxHeight: 180, objectFit: 'cover' }} />
            </Carousel.Item>
          ))}
        </Carousel>

        <div className="d-flex flex-wrap gap-2 mb-3 overflowX-auto">
          <button className={`btn btn-sm ${type === '' ? 'btn-success' : 'btn-outline-secondary'}`} onClick={() => init(1, '')}>
            All
          </button>
          {categories.map((c) => (
            <button
              key={c.type}
              className={`btn btn-sm ${type === c.type ? 'btn-success' : 'btn-outline-secondary'}`}
              onClick={() => init(1, c.type)}
            >
              {c.type}
            </button>
          ))}
        </div>

        {loading ? (
          <Loader />
        ) : (
          <>
            <div className="row g-2">
              {games.map((g) => (
                <div className="col-6 col-md-3 col-lg-2" key={g.id}>
                  <Link to={`/gamehubCasino/game/${g.id}`} className="d-block rounded-3">
                    <img src={g.image} className="w-100 rounded-3" alt={g.name} />
                  </Link>
                </div>
              ))}
              {games.length === 0 ? <p className="text-center py-4">No games available</p> : null}
            </div>
            <div className="mt-3">
              <Pagination page={page} total={meta.total} perPage={meta.perPage} onChange={(p) => init(p, type)} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
