import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Box, Card, CardContent, Chip, Table, TableBody, TableCell, TableHead, TableRow, Typography,
} from '@mui/material'
import { listBets, type Bet } from '../lib/api'

// Doc §"Bet History (Show Bet)": bets for a user / match / market, reached from
// the P&L "Show Bet" action and the completed-matches drill-down.
export function BetHistoryPage() {
  const [params] = useSearchParams()
  const userId = Number(params.get('userId') ?? 0) || undefined
  const matchId = Number(params.get('matchId') ?? 0) || undefined
  const marketId = params.get('marketId') ?? undefined

  const { data: bets = [] } = useQuery({
    queryKey: ['bet-history-page', userId, matchId, marketId],
    queryFn: () => listBets({ userId, matchId, marketId }).then((r) => r ?? []),
  })

  const totalPL = bets.reduce((s, b) => s + (b.matchedSize - b.exposure), 0)

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Bet History</Typography>
      <Card>
        <CardContent>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>User</TableCell>
                <TableCell>Market</TableCell>
                <TableCell>Selection</TableCell>
                <TableCell>Type</TableCell>
                <TableCell align="right">Odds</TableCell>
                <TableCell align="right">Stake</TableCell>
                <TableCell align="right">P/L</TableCell>
                <TableCell>Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {bets.map((b: Bet, i: number) => {
                const pl = b.matchedSize - b.exposure
                return (
                  <TableRow key={b.id || i} hover sx={{ bgcolor: b.side === 'lay' ? '#fff1f0' : '#f0f7ff' }}>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell>{b.userId}</TableCell>
                    <TableCell>{b.marketId}</TableCell>
                    <TableCell>{b.selection}</TableCell>
                    <TableCell><Chip size="small" label={b.side} color={b.side === 'lay' ? 'error' : 'primary'} /></TableCell>
                    <TableCell align="right">{b.price}</TableCell>
                    <TableCell align="right">{b.stake}</TableCell>
                    <TableCell align="right" sx={{ color: pl < 0 ? '#cf222e' : '#1a7f37' }}>{pl.toFixed(2)}</TableCell>
                    <TableCell>{new Date(b.createdAt).toLocaleString()}</TableCell>
                  </TableRow>
                )
              })}
              {bets.length === 0 && <TableRow><TableCell colSpan={9} align="center">There is no data available.</TableCell></TableRow>}
              {bets.length > 0 && (
                <TableRow>
                  <TableCell colSpan={7}><b>Total P/L</b></TableCell>
                  <TableCell align="right" sx={{ color: totalPL < 0 ? '#cf222e' : '#1a7f37' }}><b>{totalPL.toFixed(2)}</b></TableCell>
                  <TableCell />
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Box>
  )
}
