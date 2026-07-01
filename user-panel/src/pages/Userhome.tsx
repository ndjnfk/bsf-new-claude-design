import { Carousel } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useAuth } from '../store/auth'

// User home — quick-link cards + a promotional banner carousel (the Angular owl
// carousel is replaced by react-bootstrap's Carousel). Banners + showDeposit come
// from the session already loaded at app init (no duplicate fetch).
type CardLink = { to: string; img: string; label: string }

export default function Userhome() {
  useDocumentTitle('User Home')
  const banners = useAuth((s) => s.banners)
  const showDeposit = useAuth((s) => s.showDeposit)

  const cards: CardLink[] = [
    { to: '/home', img: '/assets/image/inplay.png', label: 'IN PLAY' },
    { to: '/rules', img: '/assets/image/rules.png', label: 'RULES' },
    { to: '/ledger', img: '/assets/image/ledger.png', label: 'LEDGER' },
    { to: '/change-password', img: '/assets/image/password.png', label: 'PASSWORD' },
    { to: '/poker', img: '/assets/image/games.png', label: 'GAMES' },
    { to: '/account-statement', img: '/assets/image/ledger.png', label: 'STATEMENT' },
  ]
  if (showDeposit) {
    cards.push(
      { to: '/withdraw', img: '/assets/image/exchange.png', label: 'Withdraw' },
      { to: '/deposit', img: '/assets/image/university.png', label: 'Deposit' },
    )
  }

  return (
    <div id="wrapper">
      <div className="content-page m-0">
        <div className="content">
          <div className="container dashboard_content p-0">
            <div className="vertical_mid pb-5">
              <div className="col-lg-8 m-auto">
                <div className="row">
                  {cards.map((c) => (
                    <div className="col-sm-6 mt-25px" key={c.label}>
                      <Link className="card card-color" to={c.to}>
                        <img src={c.img} className="svg_img float-start" alt={c.label} />
                        {c.label}
                      </Link>
                    </div>
                  ))}
                </div>
              </div>

              {banners.length > 0 ? (
                <div className="col-lg-7 col-md-8 mx-auto px-3 mt-1 px-md-4">
                  <Carousel controls={false} indicators={false} interval={3000}>
                    {banners.map((b, i) => (
                      <Carousel.Item key={b.id ?? i}>
                        <Link to={`/pokerUrl/game/${b.id}`} title={b.name} className="p-1 d-block">
                          <img src={b.image} alt={b.name} title={b.name} className="d-block w-100 h-130" />
                        </Link>
                      </Carousel.Item>
                    ))}
                  </Carousel>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
