import { Link, useSearchParams } from 'react-router-dom'
import { Box, Button, Card, CardContent, Stack, Typography, Breadcrumbs } from '@mui/material'

// Doc §4 — Agent Match Dashboard: a navigation hub for one match. No data here,
// just links that forward the match's query params to the report/action pages.
export function LiveGameDetails() {
  const [params] = useSearchParams()
  const matchId = params.get('matchId') ?? ''
  const marketId = params.get('marketId') ?? (matchId ? `MATCH_ODDS:${matchId}` : '')
  const sportId = params.get('sportId') ?? ''
  const matchName = params.get('matchName') ?? 'Match'

  const q = `?matchId=${matchId}&marketId=${encodeURIComponent(marketId)}&sportId=${sportId}&matchName=${encodeURIComponent(matchName)}`

  const links = [
    { label: 'Live Report', to: `/super-duper-admin/my-markets${q}` },
    { label: 'Bet Slips', to: `/super-duper-admin/betslips-tables${q}` },
    { label: 'Session Bet Slip', to: `/super-duper-admin/sessionbetslips${q}` },
    { label: 'Client Report', to: `/super-duper-admin/client-report${q}` },
    { label: 'Company Report', to: `/super-duper-admin/company-report${q}` },
    { label: 'Session Earning', to: `/super-duper-admin/session-earning-report${q}` },
    { label: 'Ledger', to: `/super-duper-admin/ledger${q}` },
    { label: 'Collection Report', to: `/super-duper-admin/collection-report${q}` },
  ]

  return (
    <Box>
      <Breadcrumbs sx={{ mb: 1 }}>
        <Link to="/super-duper-admin/live-matches">Matches</Link>
        <Typography color="text.primary">{matchName}</Typography>
      </Breadcrumbs>
      <Card>
        <CardContent>
          <Typography variant="h5" align="center" gutterBottom>Agent Match Dashboard</Typography>
          <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 3 }}>{matchName}</Typography>
          <Stack direction="row" spacing={2} justifyContent="center" flexWrap="wrap" useFlexGap>
            {links.map((l) => (
              <Button key={l.label} component={Link} to={l.to} variant="contained" size="large">{l.label}</Button>
            ))}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  )
}
