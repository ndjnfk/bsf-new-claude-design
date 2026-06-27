import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Box, Card, CardContent, Chip, IconButton, Stack, Table, TableBody, TableCell, TableHead,
  TableRow, TextField, Typography,
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import { listBets, deleteBet, type Bet } from '../lib/api'
import { useRoom } from '../hooks/useRoom'
import { useAuth } from '../store/auth'

// Doc §17 — Bet List Live: current bets, auto-refreshing on socket updates.
export function BetListLive() {
  const qc = useQueryClient()
  const [marketId, setMarketId] = useState('')
  const isSDA = useAuth((s) => s.user?.usetype === 0)

  const { data: bets = [] } = useQuery({
    queryKey: ['bets', marketId],
    queryFn: () => listBets(marketId ? { marketId } : undefined).then((r) => r ?? []),
    refetchInterval: 5000,
  })

  const remove = useMutation({
    mutationFn: (id: string) => deleteBet(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bets', marketId] }),
  })

  // When watching a specific market, join its room for instant updates.
  useRoom(marketId ? `MARKET_UPDATE_DATA:${marketId}` : null, () =>
    qc.invalidateQueries({ queryKey: ['bets', marketId] }),
  )

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Current Bets</Typography>
      <Card>
        <CardContent>
          <Stack direction="row" sx={{ mb: 2 }}>
            <TextField
              size="small" label="Filter by Market ID (live)" value={marketId}
              onChange={(e) => setMarketId(e.target.value)}
            />
          </Stack>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Market</TableCell>
                <TableCell>Selection</TableCell>
                <TableCell>Side</TableCell>
                <TableCell align="right">Odds</TableCell>
                <TableCell align="right">Stake</TableCell>
                <TableCell align="right">Matched</TableCell>
                <TableCell align="right">P/L</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Date</TableCell>
                {isSDA && <TableCell align="right">Action</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {bets.map((b: Bet, i: number) => (
                <TableRow key={b.id || i} hover sx={{ bgcolor: b.side === 'lay' ? '#fff1f0' : '#f0f7ff' }}>
                  <TableCell>{b.userId}</TableCell>
                  <TableCell>{b.marketId}</TableCell>
                  <TableCell>{b.selection}</TableCell>
                  <TableCell><Chip size="small" label={b.side} color={b.side === 'lay' ? 'error' : 'primary'} /></TableCell>
                  <TableCell align="right">{b.price}</TableCell>
                  <TableCell align="right">{b.stake}</TableCell>
                  <TableCell align="right">{b.matchedSize}</TableCell>
                  <TableCell align="right" sx={{ color: (b.pl ?? 0) < 0 ? '#cf222e' : '#1a7f37' }}>
                    {b.settled ? (b.pl ?? 0).toFixed(2) : '—'}
                  </TableCell>
                  <TableCell>
                    <Chip size="small" label={b.settled ? 'Settled' : 'Open'} color={b.settled ? 'success' : 'default'} />
                  </TableCell>
                  <TableCell>{new Date(b.createdAt).toLocaleString()}</TableCell>
                  {isSDA && (
                    <TableCell align="right">
                      <IconButton size="small" color="error" onClick={() => remove.mutate(b.id)}><DeleteIcon fontSize="small" /></IconButton>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {bets.length === 0 && (
                <TableRow><TableCell colSpan={isSDA ? 11 : 10} align="center">No live bets</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Box>
  )
}
