import { useDocumentTitle } from '../hooks/useDocumentTitle'

// Settings landing — three icon tiles (Language / Other / Other Setting), a
// faithful port of the Angular setting page. Uses the ported .set-box / .set-name
// styles (components.scss §setting) and the world / settings / speed-meter assets.
const TILES: Array<{ img: string; label: string; center?: boolean }> = [
  { img: '/assets/image/world.png', label: 'Language' },
  { img: '/assets/image/settings.png', label: 'Other', center: true },
  { img: '/assets/image/speed-meter.png', label: 'Other Setting' },
]

export default function Setting() {
  useDocumentTitle('Setting')
  return (
    <div id="wrapper">
      <div className="content-page m-0">
        <div className="content">
          <div className="container">
            <div
              className="setting-inner d-flex justify-content-center align-items-center flex-wrap"
              
            >
              {TILES.map((t) => (
                <div className={`set-box${t.center ? ' set-box-center' : ''}`} key={t.label}>
                  <img src={t.img} alt={t.label} />
                  <p className="set-name">{t.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
