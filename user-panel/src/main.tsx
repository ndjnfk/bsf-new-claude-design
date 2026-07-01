import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import './styles/main.scss'
import './styles/components.scss'
import { App } from './App'
import { ErrorBoundary } from './components/common/ErrorBoundary'

// NOTE: StrictMode intentionally omitted. Its dev-only double-invoke of effects
// caused every data hook (sports, dashboard, markets, captcha…) to fire its API
// request twice and to double-join socket rooms.
ReactDOM.createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <BrowserRouter>
      <App />
      <ToastContainer position="top-right" autoClose={2500} newestOnTop />
    </BrowserRouter>
  </ErrorBoundary>,
)
