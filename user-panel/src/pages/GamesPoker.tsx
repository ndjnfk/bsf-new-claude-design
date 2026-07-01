import { Link } from 'react-router-dom'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

// Route: gamesPoker — static grid linking into the poker lobby (no API).
export default function GamesPoker() {
  useDocumentTitle('Games Poker')
  return (
    <div id="wrapper">
      <div className="container py-3">
        <div className="row g-2">
          <div className="col-6 col-lg-3">
            <Link to="/poker" className="game-box d-block">
              <img className="game-img w-100 rounded-3" src="/assets/image/royal-casino.webp" alt="Poker" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
