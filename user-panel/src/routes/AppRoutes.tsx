import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from '../components/layout/AppLayout'
import { ProtectedRoute } from '../components/routing/ProtectedRoute'
import { GuestRoute } from '../components/routing/GuestRoute'
import { ScrollToTop } from '../components/routing/ScrollToTop'
import { Loader } from '../components/common/Loader'

// All pages are lazy-loaded (per-route code splitting), mirroring Angular's
// `loadComponent` dynamic imports. Real UIs replace these placeholders later.

// Public
const LoginMain = lazy(() => import('../pages/LoginMain'))
const Login = lazy(() => import('../pages/Login'))
const Register = lazy(() => import('../pages/Register'))

// Protected
const Home = lazy(() => import('../pages/Home'))
const InPlay = lazy(() => import('../pages/InPlay'))
const ProfitLoss = lazy(() => import('../pages/ProfitLoss'))
const Event = lazy(() => import('../pages/Event'))
const ChangePassword = lazy(() => import('../pages/ChangePassword'))
const AccountStatement = lazy(() => import('../pages/AccountStatement'))
const LedgerMatch = lazy(() => import('../pages/LedgerMatch'))
const BetHistory = lazy(() => import('../pages/BetHistory'))
const StakeValue = lazy(() => import('../pages/StakeValue'))
const Deposit = lazy(() => import('../pages/Deposit'))
const Withdraw = lazy(() => import('../pages/Withdraw'))
const WalletHome = lazy(() => import('../pages/WalletHome'))
const Request = lazy(() => import('../pages/Request'))
const BankDetails = lazy(() => import('../pages/BankDetails'))
const PokerPage = lazy(() => import('../pages/PokerPage'))
const PokerDetail = lazy(() => import('../pages/PokerDetail'))
const PokerUrl = lazy(() => import('../pages/PokerUrl'))
const GamesPoker = lazy(() => import('../pages/GamesPoker'))
const KingCasino = lazy(() => import('../pages/KingCasino'))
const GamesCasino = lazy(() => import('../pages/GamesCasino'))
const DreamCasino = lazy(() => import('../pages/DreamCasino'))
const DreamCasinoGame = lazy(() => import('../pages/DreamCasinoGame'))
const GamehubCasino = lazy(() => import('../pages/GamehubCasino'))
const GamehubCasinoGame = lazy(() => import('../pages/GamehubCasinoGame'))
const PasswordHistory = lazy(() => import('../pages/PasswordHistory'))
const LoginHistoryPage = lazy(() => import('../pages/LoginHistoryPage'))
const Rules = lazy(() => import('../pages/Rules'))
const Userhome = lazy(() => import('../pages/Userhome'))
const Setting = lazy(() => import('../pages/Setting'))
const Results = lazy(() => import('../pages/Results'))
const Tournament = lazy(() => import('../pages/Tournament'))
const GamesList = lazy(() => import('../pages/GamesList'))
const Logs = lazy(() => import('../pages/Logs'))

const NotFound = lazy(() => import('../pages/NotFound'))

export function AppRoutes() {
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<Loader />}>
        <Routes>
          {/* Default route → /login-m (Angular: '' redirectTo '/login-m'). */}
          <Route path="/" element={<Navigate to="/login-m" replace />} />

          {/* Public auth pages — signed-in users are bounced to /home. */}
          <Route element={<GuestRoute />}>
            <Route path="login-m" element={<LoginMain />} />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
          </Route>

          {/* Authenticated app — AuthGuard equivalent + shared layout. */}
          <Route element={<ProtectedRoute />}>
            {/* Poker is a full-screen game launcher: it renders the Header itself
                and deliberately has NO Sidebar/Footer, so it sits outside AppLayout. */}
            <Route path="poker" element={<PokerPage />} />
            {/* Login/Password History render their own Header (no Sidebar/Footer). */}
            <Route path="login-history" element={<LoginHistoryPage />} />
            <Route path="password-history" element={<PasswordHistory />} />
            <Route element={<AppLayout />}>
              <Route path="home" element={<Home />} />
              <Route path="in-play" element={<InPlay />} />
              <Route path="profit-loss" element={<ProfitLoss />} />
              <Route path="event/:event_id/:market_id/:sport_id" element={<Event />} />
              <Route path="change-password" element={<ChangePassword />} />
              <Route path="account-statement" element={<AccountStatement />} />
              {/* 'ledger' is an Angular alias of 'account-statement' (same component). */}
              <Route path="ledger" element={<AccountStatement />} />
              <Route path="ledger/:matchid" element={<LedgerMatch />} />
              <Route path="bet-history" element={<BetHistory />} />
              <Route path="stake-value" element={<StakeValue />} />
              <Route path="deposit" element={<Deposit />} />
              <Route path="withdraw" element={<Withdraw />} />
              <Route path="wallet-home" element={<WalletHome />} />
              <Route path="request" element={<Request />} />
              <Route path="banks" element={<BankDetails />} />
              <Route path="poker/detail/:id" element={<PokerDetail />} />
              <Route path="pokerUrl" element={<PokerUrl />} />
              <Route path="gamesPoker" element={<GamesPoker />} />
              <Route path="kingCasino" element={<KingCasino />} />
              <Route path="gamesCasino" element={<GamesCasino />} />
              <Route path="dreamCasino" element={<DreamCasino />} />
              <Route path="dreamCasino/game/:game_code" element={<DreamCasinoGame />} />
              <Route path="gamehubCasino" element={<GamehubCasino />} />
              <Route path="gamehubCasino/game/:gameId" element={<GamehubCasinoGame />} />
              <Route path="rules" element={<Rules />} />
              <Route path="userhome" element={<Userhome />} />
              <Route path="setting" element={<Setting />} />
              <Route path="results" element={<Results />} />
              <Route path="tournament" element={<Tournament />} />
              <Route path="gamesList" element={<GamesList />} />
              <Route path="logs" element={<Logs />} />
            </Route>
          </Route>

          {/* Unknown URLs. */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  )
}
