import { Routes, Route, Navigate } from 'react-router-dom'
import { AppShell, RequireAuth } from './components/AppShell'
import { Login } from './routes/Login'
import { Dashboard } from './routes/Dashboard'
import { ManageClients } from './routes/ManageClients'
import { LiveMatches } from './routes/LiveMatches'
import { LiveGameDetails } from './routes/LiveGameDetails'
import { MyMarkets } from './routes/MyMarkets'
import { CollectionReport } from './routes/CollectionReport'
import { LogDetail } from './routes/LogDetail'
import { ChipsSummary } from './routes/ChipsSummary'
import { BlockMarket } from './routes/BlockMarket'
import { BetListLive } from './routes/BetListLive'
import { Reports } from './routes/Reports'
import { WebsiteSetting } from './routes/WebsiteSetting'
import { ManagePassword } from './routes/ManagePassword'
import { Results } from './routes/Results'
import { CompletedMatches } from './routes/CompletedMatches'
import { News } from './routes/News'
import { Queries } from './routes/Queries'
import { MarketSetting } from './routes/MarketSetting'
import { BlockedClients } from './routes/BlockedClients'
import { Settlements } from './routes/Settlements'
import { AddWorker } from './routes/AddWorker'
import { SearchLogsUser } from './routes/SearchLogsUser'
import { ConcurrentUsers } from './routes/ConcurrentUsers'
import { CommissionLimits } from './routes/CommissionLimits'
import { ManageSeries } from './routes/ManageSeries'
import { ActivateMatches } from './routes/ActivateMatches'
import { IpSurveillance } from './routes/IpSurveillance'
import { SetFancyBetLimit } from './routes/SetFancyBetLimit'
import { BetSlips } from './routes/BetSlips'
import { SessionBetSlip } from './routes/SessionBetSlip'
import { ClientReport, CompanyReport, SessionEarningReport, MatchLedger } from './routes/MatchReports'
import { ManageBetfairMarket } from './routes/ManageBetfairMarket'
import { ManageSessionFancy } from './routes/ManageSessionFancy'
import { ManageIndianFancy } from './routes/ManageIndianFancy'
import { ManageMatches } from './routes/ManageMatches'
import { ClientDashboard } from './routes/ClientDashboard'
import { CollectionReportMatch } from './routes/CollectionReportMatch'
import { LogUserDetails } from './routes/LogUserDetails'
import { BetHistoryPage } from './routes/BetHistoryPage'
import { AgentBank } from './routes/AgentBank'
import { DeductDealer } from './routes/DeductDealer'
import { AuraGGR } from './routes/AuraGGR'
import { OldMatchResults } from './routes/OldMatchResults'
import { UserMatchLedger } from './routes/UserMatchLedger'
import { ClientLedger } from './routes/ClientLedger'
import { ReceivePayCash } from './routes/ReceivePayCash'
import { CoinHistory } from './routes/CoinHistory'
import { CreateClient } from './routes/CreateClient'

// Routing. Authenticated pages live under the app shell; more of the 32
// documented pages mount here as each phase lands.
export function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<RequireAuth><AppShell /></RequireAuth>}>
        <Route path="/super-duper-admin/home-dashboard" element={<Dashboard />} />
        <Route path="/super-duper-admin/users" element={<ManageClients />} />
        <Route path="/super-duper-admin/create-company" element={<CreateClient />} />
        <Route path="/super-duper-admin/commission-limit" element={<CommissionLimits />} />
        <Route path="/super-duper-admin/manage-series" element={<ManageSeries />} />
        <Route path="/super-duper-admin/direct-activate" element={<ActivateMatches />} />
        <Route path="/super-duper-admin/live-matches" element={<LiveMatches />} />
        <Route path="/super-duper-admin/live-game-details" element={<LiveGameDetails />} />
        <Route path="/super-duper-admin/my-markets" element={<MyMarkets />} />
        <Route path="/super-duper-admin/betslips-tables" element={<BetSlips />} />
        <Route path="/super-duper-admin/sessionbetslips" element={<SessionBetSlip />} />
        <Route path="/super-duper-admin/client-report" element={<ClientReport />} />
        <Route path="/super-duper-admin/company-report" element={<CompanyReport />} />
        <Route path="/super-duper-admin/session-earning-report" element={<SessionEarningReport />} />
        <Route path="/super-duper-admin/ledger" element={<MatchLedger />} />
        <Route path="/super-duper-admin/manage-bet-fair" element={<ManageBetfairMarket />} />
        <Route path="/super-duper-admin/manage-session-fancy" element={<ManageSessionFancy />} />
        <Route path="/super-duper-admin/manage-indian-fancy" element={<ManageIndianFancy />} />
        <Route path="/super-duper-admin/manage-matches" element={<ManageMatches />} />
        <Route path="/super-duper-admin/user-dashboard" element={<ClientDashboard />} />
        <Route path="/super-duper-admin/logs-user-details" element={<LogUserDetails />} />
        <Route path="/super-duper-admin/match-ledger-user" element={<UserMatchLedger />} />
        <Route path="/super-duper-admin/client-ledger" element={<ClientLedger />} />
        <Route path="/super-duper-admin/recieve-pay-cash" element={<ReceivePayCash />} />
        <Route path="/super-duper-admin/coin-history" element={<CoinHistory />} />
        <Route path="/super-duper-admin/bet-history" element={<BetHistoryPage />} />
        <Route path="/super-duper-admin/collection-report" element={<CollectionReportMatch />} />
        <Route path="/super-duper-admin/collection-report-all" element={<CollectionReport />} />
        <Route path="/super-duper-admin/chip-summary" element={<ChipsSummary />} />
        <Route path="/super-duper-admin/log-detail" element={<LogDetail />} />
        <Route path="/super-duper-admin/completed-matches" element={<CompletedMatches />} />
        <Route path="/super-duper-admin/block-market" element={<BlockMarket />} />
        <Route path="/super-duper-admin/bet-list" element={<BetListLive />} />
        <Route path="/super-duper-admin/match-result" element={<Results />} />
        <Route path="/super-duper-admin/settled-matches" element={<OldMatchResults />} />
        <Route path="/super-duper-admin/manage-fancy" element={<SetFancyBetLimit />} />
        <Route path="/super-duper-admin/royal-casino" element={<AuraGGR />} />
        <Route path="/super-duper-admin/bank-account/:type" element={<AgentBank />} />
        <Route path="/super-duper-admin/deduct-dealer" element={<DeductDealer />} />
        <Route path="/super-duper-admin/reports" element={<Reports />} />
        <Route path="/super-duper-admin/news" element={<News />} />
        <Route path="/super-duper-admin/queries" element={<Queries />} />
        <Route path="/super-duper-admin/blocked-user" element={<BlockedClients />} />
        <Route path="/super-duper-admin/settlement-entry" element={<Settlements />} />
        <Route path="/super-duper-admin/search-logs-user" element={<SearchLogsUser />} />
        <Route path="/super-duper-admin/ip-surveillance" element={<IpSurveillance />} />
        <Route path="/super-duper-admin/concurrent-users" element={<ConcurrentUsers />} />
        <Route path="/super-duper-admin/manage-helper" element={<AddWorker />} />
        <Route path="/super-duper-admin/website-setting" element={<WebsiteSetting />} />
        <Route path="/super-duper-admin/settings" element={<MarketSetting />} />
        <Route path="/super-duper-admin/change-password" element={<ManagePassword />} />

        {/* Aliases for the documented (original Angular) route paths. */}
        <Route path="/super-duper-admin/dashboard" element={<LiveMatches />} />
        <Route path="/super-duper-admin/current-bets" element={<BetListLive />} />
        <Route path="/super-duper-admin/completed" element={<CompletedMatches />} />
        <Route path="/super-duper-admin/sports" element={<BlockMarket />} />
        <Route path="/super-duper-admin/domains" element={<WebsiteSetting />} />
        <Route path="/super-duper-admin/report" element={<Reports />} />
        <Route path="/super-duper-admin/ledger-match-wise" element={<MatchLedger />} />
        <Route path="/super-duper-admin/live-game-detials" element={<LiveGameDetails />} />
        <Route path="/super-duper-admin/edit-blocked-user" element={<BlockedClients />} />
        <Route path="/super-duper-admin/create-blog" element={<News />} />
        <Route path="/super-duper-admin/update-blog" element={<News />} />
      </Route>

      <Route path="*" element={<Navigate to="/super-duper-admin/home-dashboard" replace />} />
    </Routes>
  )
}
