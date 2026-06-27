import { useSearchParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Box, Breadcrumbs, Button, Card, CardContent, Grid, Stack, Typography, CircularProgress,
} from '@mui/material'
import { getUser } from '../lib/api'

// Doc §"Client Dashboard (Agent Match Dashboard)": per-user hub reached by
// clicking a user in the clients list.
export function ClientDashboard() {
  const [params] = useSearchParams()
  const userId = Number(params.get('userId') ?? 0)

  const { data: user, isLoading } = useQuery({
    queryKey: ['user', userId], queryFn: () => getUser(userId), enabled: userId > 0,
  })

  if (isLoading || !user) {
    return <Box sx={{ display: 'grid', placeItems: 'center', height: 200 }}><CircularProgress /></Box>
  }

  // Ledger / Cash Ledger / Coin History open this client's running ledger
  // (account statement); Match ledger has its own per-fixture P&L page.
  const ledger = `/super-duper-admin/client-ledger?userId=${userId}&username=${encodeURIComponent(user.mstruserid)}`
  // Receive / Pay Cash open the dedicated cash page (settlement is done from the
  // Collection Report).
  const cash = (type: 'receiveCash' | 'payCash') =>
    `/super-duper-admin/recieve-pay-cash?userId=${userId}&componentType=${type}` +
    `&agentName=${encodeURIComponent(user.mstrname)}&agentId=${encodeURIComponent(user.mstruserid)}` +
    `&settlementAmount=${user.settlementAmount}`

  const cards = [
    { label: 'Coins (Balance)', value: user.balance, color: undefined },
    { label: 'Rs. Exposure', value: user.settlementAmount, color: '#cf222e' },
   
  ]

  return (
    <Box>
      <Breadcrumbs sx={{ mb: 1 }}>
        <Link to="/super-duper-admin/users">Clients</Link>
        <Typography color="text.primary">{user.mstrname}</Typography>
      </Breadcrumbs>
      <Typography variant="h5" gutterBottom>{user.mstrname} ({user.mstruserid})</Typography>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>Agent Match Dashboard</Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Button variant="contained" component={Link} to={cash('receiveCash')}>Recieve Cash</Button>
            <Button variant="contained" color="warning" component={Link} to={cash('payCash')}>Pay Cash</Button>
            <Button variant="outlined" component={Link} to={`${ledger}`}>Ledger</Button>
            <Button variant="outlined" component={Link} to={`${ledger}&cash=1`}>Cash Ledger</Button>
            <Button variant="outlined" component={Link} to={`/super-duper-admin/match-ledger-user?userId=${userId}&username=${encodeURIComponent(user.mstruserid)}`}>Match ledger</Button>
            {user.usetype !== 2 && user.usetype !== 3 && (
              <Button variant="outlined" component={Link} to={`/super-duper-admin/users?userId=${userId}&category=agent`}>Direct Agents</Button>
            )}
            {user.usetype !== 3 && (
              <Button variant="outlined" component={Link} to={`/super-duper-admin/users?userId=${userId}&category=client`}>Direct Client</Button>
            )}
            <Button variant="outlined" component={Link} to={`/super-duper-admin/coin-history?userId=${userId}&username=${encodeURIComponent(user.mstruserid)}`}>Coin History</Button>
          </Stack>
        </CardContent>
      </Card>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        {cards.map((c) => (
          <Grid item xs={6} sm={3} key={c.label}>
            <Card><CardContent>
              <Typography variant="caption" color="text.secondary">{c.label}</Typography>
              <Typography variant="h6" sx={{ color: c.color }}>
                {c.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Typography>
            </CardContent></Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}
