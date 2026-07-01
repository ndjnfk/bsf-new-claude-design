import { Link } from 'react-router-dom'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

// Route: gamesCasino — static provider grid (links into the lobby; no API).
const TILES = [
  '/assets/image/royal-casino.webp',
  '/assets/image/indian-casino.webp',
  '/assets/image/international-casion.webp',
  '/assets/image/aviator.webp',
]

export default function GamesCasino() {
  useDocumentTitle('Games Casino')
  return (
    <div id="wrapper">
      <div className="container py-3">
        <div className="row g-2">
          {TILES.map((src, i) => (
            <div className="col-6 col-lg-3" key={i}>
              <Link to="/poker" className="game-box d-block">
                <img className="game-img w-100 rounded-3" src={src} alt={`Casino ${i + 1}`} />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
