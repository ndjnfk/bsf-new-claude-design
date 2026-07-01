import { ReactNode, useState } from 'react'
import { Navigate, Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  AppBar, Box, Chip, Drawer, IconButton, List, ListItemButton, ListItemIcon, ListItemText,
  Toolbar, Typography, Divider, Tooltip, useMediaQuery, useTheme,
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import DashboardIcon from '@mui/icons-material/Dashboard'
import BusinessIcon from '@mui/icons-material/Business'
import LogoutIcon from '@mui/icons-material/Logout'
import LockIcon from '@mui/icons-material/Lock'
import SportsCricketIcon from '@mui/icons-material/SportsCricket'
import BlockIcon from '@mui/icons-material/Block'
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'
import AssessmentIcon from '@mui/icons-material/Assessment'
import LanguageIcon from '@mui/icons-material/Language'
import KeyIcon from '@mui/icons-material/Key'
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'
import DoneAllIcon from '@mui/icons-material/DoneAll'
import TuneIcon from '@mui/icons-material/Tune'
import GroupRemoveIcon from '@mui/icons-material/GroupRemove'
import HandshakeIcon from '@mui/icons-material/Handshake'
import EngineeringIcon from '@mui/icons-material/Engineering'
import ManageSearchIcon from '@mui/icons-material/ManageSearch'
import GroupsIcon from '@mui/icons-material/Groups'
import PercentIcon from '@mui/icons-material/Percent'
import AccountTreeIcon from '@mui/icons-material/AccountTree'
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck'
import VisibilityIcon from '@mui/icons-material/Visibility'
import CasinoIcon from '@mui/icons-material/Casino'
import PaidIcon from '@mui/icons-material/Paid'
import SummarizeIcon from '@mui/icons-material/Summarize'
import DescriptionIcon from '@mui/icons-material/Description'
import SavingsIcon from '@mui/icons-material/Savings'
import { useAuth } from '../store/auth'
import { roleName, USETYPE } from '../lib/roles'
import { useCatalogSync } from '../hooks/useCatalogSync'
import { useExposureSync } from '../hooks/useExposureSync'

const DRAWER_WIDTH = 240

// Sidebar items. Items flagged `sda` are platform-global and only shown to the
// Super Duper Admin (the backend enforces the same restriction). Everything else
// is downline-scoped and available to every management tier.
// `sda` = platform-global (real SDA only). `perm` = the helper permission that
// also grants access when an SDA delegates the action to a worker account.
// `player` = also visible to an end-user (Player) who manages no downline.
type NavItem = { label: string; icon: ReactNode; to: string; sda?: boolean; perm?: string; player?: boolean }
const NAV: NavItem[] = [
  { label: 'Dashboard', icon: <DashboardIcon />, to: '/super-duper-admin/home-dashboard', player: true },
  { label: 'Live Matches', icon: <SportsCricketIcon />, to: '/super-duper-admin/live-matches' },
  { label: 'Completed Matches', icon: <DoneAllIcon />, to: '/super-duper-admin/completed-matches' },
  
   { label: 'Block Sport', icon: <BlockIcon />, to: '/super-duper-admin/block-market', sda: true, perm: 'Match On and Off' },
  { label: 'Manage Series', icon: <AccountTreeIcon />, to: '/super-duper-admin/manage-series', sda: true, perm: 'Active Matches and Manage Series' },
  { label: 'Activate Matches', icon: <PlaylistAddCheckIcon />, to: '/super-duper-admin/direct-activate', sda: true, perm: 'Active Matches and Manage Series' },
  { label: 'Series Activate', icon: <PlaylistAddCheckIcon />, to: '/super-duper-admin/series-activate', sda: true, perm: 'Active Matches and Manage Series' },
  { label: 'Activate Match', icon: <PlaylistAddCheckIcon />, to: '/super-duper-admin/activate-match', sda: true, perm: 'Active Matches and Manage Series' },
  { label: 'Manage Clients', icon: <BusinessIcon />, to: '/super-duper-admin/users' },
  { label: 'Commission & Limits', icon: <PercentIcon />, to: '/super-duper-admin/commission-limit' },
 
  { label: 'Bet List Live', icon: <ReceiptLongIcon />, to: '/super-duper-admin/bet-list' },
  { label: 'Results', icon: <EmojiEventsIcon />, to: '/super-duper-admin/match-result', sda: true, perm: 'Match Result Declare' },
  
  { label: 'Set Fancy BetLimit', icon: <CasinoIcon />, to: '/super-duper-admin/manage-fancy', sda: true, perm: 'Fancy Activation' },
  { label: 'Aura GGR', icon: <PaidIcon />, to: '/super-duper-admin/royal-casino', sda: true },
 
  { label: 'All Reports', icon: <AssessmentIcon />, to: '/super-duper-admin/reports', player: true },
  { label: 'Collection Report', icon: <SummarizeIcon />, to: '/super-duper-admin/collection-report-all' },
  { label: 'Chips Summary', icon: <SavingsIcon />, to: '/super-duper-admin/chip-summary' },
  { label: 'Log Detail', icon: <DescriptionIcon />, to: '/super-duper-admin/log-detail' },
 
  { label: 'Blocked Clients', icon: <GroupRemoveIcon />, to: '/super-duper-admin/blocked-user' },
  { label: 'Settlements', icon: <HandshakeIcon />, to: '/super-duper-admin/settlement-entry' },
  { label: 'Search Logs User', icon: <ManageSearchIcon />, to: '/super-duper-admin/search-logs-user' },
  { label: 'Ip Surveillance', icon: <VisibilityIcon />, to: '/super-duper-admin/ip-surveillance', sda: true },
  { label: 'Concurrent Users', icon: <GroupsIcon />, to: '/super-duper-admin/concurrent-users' },
  { label: 'Add Worker', icon: <EngineeringIcon />, to: '/super-duper-admin/manage-helper' },
  { label: 'Website Setting', icon: <LanguageIcon />, to: '/super-duper-admin/website-setting', sda: true },
  { label: 'Market Setting', icon: <TuneIcon />, to: '/super-duper-admin/settings', sda: true },
  { label: 'Manage Password', icon: <KeyIcon />, to: '/super-duper-admin/change-password', player: true },
]
// Reached contextually (click a match in Live Matches → Live Game Details → Live Report).
const SOON: string[] = []

export function RequireAuth({ children }: { children: ReactNode }) {
  const token = useAuth((s) => s.token)
  if (!token) return <Navigate to="/login" replace />
  return <>{children}</>
}

export function AppShell() {
  const navigate = useNavigate()
  const location = useLocation()
  const theme = useTheme()
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'))
  useCatalogSync() // real-time catalog visibility (block cascade) — app-wide
  const summary = useExposureSync() // live exposure (EXPOSURE:<id> push) — app-wide
  const { user, logout, isHelper, permissions } = useAuth()
  const isSDA = user?.usetype === 0
  const isPlayer = user?.usetype === USETYPE.PLAYER

  // Panel branding adapts to the logged-in tier (Company Panel, Admin Panel, …).
  const panelName = !user ? '' : isHelper ? 'Helper Panel' : isSDA ? 'Super Duper Admin' : `${roleName(user.usetype)} Panel`

  // Drawer open state: a collapsible persistent drawer on desktop (default open),
  // a temporary overlay drawer on mobile (default closed). The hamburger toggles
  // whichever is active for the current breakpoint.
  const [mobileOpen, setMobileOpen] = useState(false)
  const [desktopOpen, setDesktopOpen] = useState(true)
  const toggleDrawer = () => (isDesktop ? setDesktopOpen((o) => !o) : setMobileOpen((o) => !o))

  // Which sidebar items this principal may see. A Player manages no downline, so
  // they only see player-flagged items (own dashboard / reports / password).
  // Otherwise downline-scoped items are always shown; platform-global (`sda`)
  // items show for a real SDA, or for an SDA's helper only if they hold the
  // item's permission (mirrors the API guards).
  const canSee = (item: NavItem): boolean => {
    if (isPlayer) return !!item.player
    if (!item.sda) return true
    if (isHelper) return isSDA && !!item.perm && permissions.includes(item.perm)
    return isSDA
  }

  const go = (to: string) => {
    navigate(to)
    if (!isDesktop) setMobileOpen(false) // close overlay after navigating on mobile
  }

  const doLogout = () => {
    logout()
    navigate('/login')
  }

  const drawerContent = (
    <>
      <Toolbar variant="dense" />
      <Box sx={{ overflow: 'auto' }}>
        <List>
          {NAV.filter(canSee).map((item) => (
            <ListItemButton
              key={item.to}
              selected={location.pathname === item.to}
              onClick={() => go(item.to)}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          ))}
        </List>
        {SOON.length > 0 && (
          <>
            <Divider />
            <Typography variant="caption" sx={{ pl: 2, color: 'text.secondary' }}>
              Roadmap (upcoming phases)
            </Typography>
            <List dense>
              {SOON.map((label) => (
                <ListItemButton key={label} disabled>
                  <ListItemIcon><LockIcon fontSize="small" /></ListItemIcon>
                  <ListItemText primary={label} />
                </ListItemButton>
              ))}
            </List>
          </>
        )}
      </Box>
    </>
  )

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" sx={{ zIndex: (t) => t.zIndex.drawer + 1 }}>
        <Toolbar variant="dense">
          <IconButton color="inherit" edge="start" aria-label="toggle menu" onClick={toggleDrawer} sx={{ mr: 1 }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
            BSF2020 — {panelName}
          </Typography>
          {summary && (
            <Tooltip title="Live exposure across your downline">
              <Chip
                label={`Exposure: ${summary.exposure.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                size="small" color={summary.exposure > 0 ? 'error' : 'default'}
                sx={{ mr: 2, fontWeight: 600, bgcolor: 'rgba(255,255,255,0.15)', color: '#fff' }}
              />
            </Tooltip>
          )}
          <Typography variant="body2" sx={{ mr: 2, display: { xs: 'none', sm: 'block' } }}>
            {user?.mstrname} ({user?.mstruserid}) · {isHelper ? 'Helper' : (user ? roleName(user.usetype) : '')}
            {isHelper && user ? ` of ${roleName(user.usetype)}` : ''}
          </Typography>
          <Tooltip title="Logout">
            <IconButton color="inherit" onClick={doLogout}>
              <LogoutIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      {/* Mobile: temporary overlay drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          [`& .MuiDrawer-paper`]: { width: DRAWER_WIDTH, boxSizing: 'border-box' },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop: collapsible persistent drawer */}
      <Drawer
        variant="persistent"
        anchor="left"
        open={desktopOpen}
        sx={{
          display: { xs: 'none', md: 'block' },
          [`& .MuiDrawer-paper`]: { width: DRAWER_WIDTH, boxSizing: 'border-box' },
        }}
      >
        {drawerContent}
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          minWidth: 0,
          transition: theme.transitions.create('margin', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          ml: { xs: 0, md: desktopOpen ? `${DRAWER_WIDTH}px` : 0 },
        }}
      >
        <Toolbar variant="dense" />
        <Outlet />
      </Box>
    </Box>
  )
}
