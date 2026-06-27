import { useSearchParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Box, Breadcrumbs, Card, CardContent, Chip, Table, TableBody, TableCell, TableHead,
  TableRow, Typography,
} from '@mui/material'
import { listBets, type Bet } from '../lib/api'

// Doc §"Session Bet Slip" — fancy/session bets for a single match.
export function SessionBetSlip() {
  const [params] = useSearchParams()
  const matchId = Number(params.get('matchId') ?? 0)
  const matchName = params.get('matchName') ?? `Match ${matchId}`

  const { data: bets = [] } = useQuery({
    queryKey: ['session-slips', matchId],
    queryFn: () => listBets({ matchId, betType: 'fancy' }).then((r) => r ?? []),
    enabled: matchId > 0,
  })

  return (
    <Box>
      <Breadcrumbs sx={{ mb: 1 }}>
        <Link to="/super-duper-admin/live-matches">Matches</Link>
        <Typography color="text.primary">{matchName}</Typography>
      </Breadcrumbs>
      <Typography variant="h5" gutterBottom>Session Bet Slip</Typography>
      <Card>
        <CardContent>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Session</TableCell>
                <TableCell>Side</TableCell>
                <TableCell align="right">Run</TableCell>
                <TableCell align="right">Stake</TableCell>
                <TableCell>Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {bets.map((b: Bet, i: number) => (
                <TableRow key={b.id || i} hover sx={{ bgcolor: b.side === 'lay' ? '#fff1f0' : '#f0f7ff' }}>
                  <TableCell>{b.userId}</TableCell>
                  <TableCell>{b.selection}</TableCell>
                  <TableCell><Chip size="small" label={b.side === 'lay' ? 'No' : 'Yes'} color={b.side === 'lay' ? 'error' : 'primary'} /></TableCell>
                  <TableCell align="right">{b.price}</TableCell>
                  <TableCell align="right">{b.stake}</TableCell>
                  <TableCell>{new Date(b.createdAt).toLocaleString()}</TableCell>
                </TableRow>
              ))}
              {bets.length === 0 && <TableRow><TableCell colSpan={6} align="center">No session bets</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Box>
  )
}
