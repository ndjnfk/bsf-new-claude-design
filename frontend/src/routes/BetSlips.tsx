import { useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Box, Breadcrumbs, Card, CardContent, Chip, Tab, Tabs, Table, TableBody, TableCell,
  TableHead, TableRow, Typography,
} from '@mui/material'
import { listBets, type Bet } from '../lib/api'

// Doc §"Bet Slips" — match/bookmaker/toss bets for a single match.
export function BetSlips() {
  const [params] = useSearchParams()
  const matchId = Number(params.get('matchId') ?? 0)
  const matchName = params.get('matchName') ?? `Match ${matchId}`
  const [betType, setBetType] = useState<'match' | 'bookmaker' | 'toss'>('match')

  const { data: bets = [] } = useQuery({
    queryKey: ['bet-slips', matchId, betType],
    queryFn: () => listBets({ matchId, betType }).then((r) => r ?? []),
    enabled: matchId > 0,
  })

  return (
    <Box>
      <Breadcrumbs sx={{ mb: 1 }}>
        <Link to="/super-duper-admin/live-matches">Matches</Link>
        <Typography color="text.primary">{matchName}</Typography>
      </Breadcrumbs>
      <Typography variant="h5" gutterBottom>Bet Slips</Typography>
      <Tabs value={betType} onChange={(_, v) => setBetType(v)} sx={{ mb: 2 }}>
        <Tab label="Match Odds" value="match" />
        <Tab label="Bookmaker" value="bookmaker" />
        <Tab label="Toss" value="toss" />
      </Tabs>
      <Card>
        <CardContent>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Selection</TableCell>
                <TableCell>Side</TableCell>
                <TableCell align="right">Odds</TableCell>
                <TableCell align="right">Stake</TableCell>
                <TableCell align="right">Matched</TableCell>
                <TableCell>Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {bets.map((b: Bet, i: number) => (
                <TableRow key={b.id || i} hover sx={{ bgcolor: b.side === 'lay' ? '#fff1f0' : '#f0f7ff' }}>
                  <TableCell>{b.userId}</TableCell>
                  <TableCell>{b.selection}</TableCell>
                  <TableCell><Chip size="small" label={b.side} color={b.side === 'lay' ? 'error' : 'primary'} /></TableCell>
                  <TableCell align="right">{b.price}</TableCell>
                  <TableCell align="right">{b.stake}</TableCell>
                  <TableCell align="right">{b.matchedSize}</TableCell>
                  <TableCell>{new Date(b.createdAt).toLocaleString()}</TableCell>
                </TableRow>
              ))}
              {bets.length === 0 && <TableRow><TableCell colSpan={7} align="center">No bets</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Box>
  )
}
