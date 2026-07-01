import { useEffect, useMemo, useState } from 'react'
import { Carousel, Modal, Button } from 'react-bootstrap'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { Loader } from '../components/common/Loader'
import { getDreamGameList, type DreamGame } from '../services/casinoApi'

const BANNERS = ['/assets/image/royal-casino.webp', '/assets/image/indian-casino.webp', '/assets/image/international-casion.webp']

function groupByCategory(games: DreamGame[]): Array<{ label: string; data: DreamGame[] }> {
  const grouped: Record<string, DreamGame[]> = {}
  for (const g of games) {
    const c = g.category
    if (!grouped[c]) grouped[c] = []
    grouped[c].push(g)
  }
  return Object.entries(grouped).map(([label, data]) => ({ label, data }))
}

// Route: dreamCasino — game list grouped by category with a category filter, a banner
// carousel, and a React-controlled entry warning modal (no jQuery backdrop hacks).
export default function DreamCasino() {
  useDocumentTitle('Dream Casino')
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [groups, setGroups] = useState<Array<{ label: string; data: DreamGame[] }>>([])
  const [active, setActive] = useState(params.get('product') ?? '')
  const [loading, setLoading] = useState(true)
  const [showWarning, setShowWarning] = useState(true)

  useEffect(() => {
    setLoading(true)
    getDreamGameList()
      .then((res) => {
        const d = (res.data ?? []).map((el) => (el.product ? el : { ...el, product: el.sub_provider_name }))
        setGroups(groupByCategory(d))
      })
      .catch(() => setGroups([]))
      .finally(() => setLoading(false))
  }, [])

  const visible = useMemo(() => (active ? groups.filter((g) => g.label === active) : groups), [groups, active])

  if (loading) return <Loader />

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
          <button className={`btn btn-sm ${active === '' ? 'btn-success' : 'btn-outline-secondary'}`} onClick={() => setActive('')}>
            All
          </button>
          {groups.map((g) => (
            <button
              key={g.label}
              className={`btn btn-sm ${active === g.label ? 'btn-success' : 'btn-outline-secondary'}`}
              onClick={() => setActive(g.label)}
            >
              {g.label}
            </button>
          ))}
        </div>

        {visible.map((g) => (
          <div key={g.label} className="mb-3">
            <h6 className="mb-2">{g.label}</h6>
            <div className="row g-2">
              {g.data.map((game) => (
                <div className="col-6 col-md-3 col-lg-2" key={game.game_code}>
                  <Link to={`/dreamCasino/game/${game.game_code}`} className="d-block rounded-3">
                    <img src={game.url_thumb} className="w-100 rounded-3" alt={game.name} />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        ))}
        {visible.length === 0 ? <p className="text-center py-4">No games available</p> : null}
      </div>

      <Modal show={showWarning} onHide={() => setShowWarning(false)} size="sm" centered>
        <Modal.Body className="text-center">
          <p className="mb-3">100 Points = 1 Casino Point</p>
          <Button variant="primary" className="me-2" onClick={() => setShowWarning(false)}>
            Okay
          </Button>
          <Button variant="danger" onClick={() => navigate('/home')}>
            Cancel
          </Button>
        </Modal.Body>
      </Modal>
    </div>
  )
}
