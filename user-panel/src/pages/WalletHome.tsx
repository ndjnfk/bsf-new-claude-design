import { Link } from 'react-router-dom'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useAuth } from '../store/auth'
import { formatAmount } from '../utils/format'

// Wallet hub — balance + deposit/withdraw shortcuts.
export default function WalletHome() {
  useDocumentTitle('Wallet')
  const balance = useAuth((s) => s.user?.balance)
  return (
    <div id="wrapper">
      <div className="content-page m-0">
        <div className="content">
          <div className="container py-3">
            <div className="text-center mb-4">
              <div className="text-muted">Wallet Balance</div>
              <h3 className="mb-0">{formatAmount(balance)}</h3>
            </div>
            <div className="row g-3 justify-content-center">
              <div className="col-6 col-md-3">
                <Link className="card card-color p-3 text-center text-decoration-none" to="/deposit">
                  Deposit
                </Link>
              </div>
              <div className="col-6 col-md-3">
                <Link className="card card-color p-3 text-center text-decoration-none" to="/withdraw">
                  Withdraw
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
