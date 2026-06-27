import { type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Box, Button, Card, CardContent, Grid, Stack, Typography, CircularProgress } from '@mui/material'
import { getDashboard } from '../lib/api'
import { useAuth } from '../store/auth'
import { childRoleName } from '../lib/roles'

// Doc §1 — Home dashboard: read-only summary of the logged-in user.
export function Dashboard() {
  const user = useAuth((s) => s.user)
  const { data, isLoading } = useQuery({ queryKey: ['dashboard'], queryFn: getDashboard })
  const childRole = user ? childRoleName(user.usetype) : null

  if (isLoading || !data) {
    return <Box sx={{ display: 'grid', placeItems: 'center', height: 200 }}><CircularProgress /></Box>
  }

  const cards: { label: string; value: string; color?: string }[] = [
    { label: 'My Username', value: `${data.name} (${data.username})` },
    { label: 'My Level', value: data.level },
    { label: 'Current Balance', value: fmt(data.balance) },
    { label: 'Profit / Loss', value: fmt(data.profitLoss), color: data.profitLoss < 0 ? '#cf222e' : '#1a7f37' },
  ]
  const shares: { label: string; value: string }[] = [
    { label: 'Max My Match Share', value: `${data.myMatchShare}%` },
    { label: 'Min Company Match Share', value: `${data.companyMatchShare}%` },
    { label: 'Max My Casino Share', value: `${data.myCasinoShare}%` },
    { label: 'Min Company Casino Share', value: `${data.companyCasinoShare}%` },
  ]
  const comm: { label: string; value: string }[] = [
    { label: 'Match Odds Commission', value: `${data.matchCommission}` },
    { label: 'Session Win Commission', value: `${data.sessionCommission}` },
  ]

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Home</Typography>

      {childRole && (
        <Card sx={{ mb: 3, bgcolor: '#f0f7ff' }}>
          <CardContent>
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography sx={{ flexGrow: 1 }}>
                As a <b>{data.level}</b>, you manage your downline of <b>{childRole}</b> accounts.
              </Typography>
              <Button variant="contained" component={Link} to="/super-duper-admin/users">
                Manage {childRole}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      )}

      <Section title="Details">
        {cards.map((c) => <StatCard key={c.label} {...c} />)}
      </Section>
      <Section title="My Share and Company Share">
        {shares.map((c) => <StatCard key={c.label} {...c} />)}
      </Section>
      <Section title="Commission">
        {comm.map((c) => <StatCard key={c.label} {...c} />)}
      </Section>
    </Box>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle1" sx={{ mb: 1 }}>{title}</Typography>
      <Grid container spacing={2}>{children}</Grid>
    </Box>
  )
}

function StatCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <Grid item xs={12} sm={6} md={3}>
      <Card>
        <CardContent>
          <Typography variant="caption" color="text.secondary">{label}</Typography>
          <Typography variant="h6" sx={{ color }}>{value}</Typography>
        </CardContent>
      </Card>
    </Grid>
  )
}

const fmt = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
