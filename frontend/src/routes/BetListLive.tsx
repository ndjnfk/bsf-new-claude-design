import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Box, Card, CardContent, Chip, IconButton, MenuItem, Stack, Table, TableBody, TableCell,
  TableHead, TableRow, Tab, Tabs, TextField, Typography,
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import {
  listBets, listDeletedBets, deleteBet, listSports, listSeries, listMatches,
  type Bet, type DeletedBet,
} from '../lib/api'
import { useAuth } from '../store/auth'

type View = 'open' | 'settled' | 'deleted'

// Bet List Live — pending bets by default, with Sport / Series / Match + date
// filters and a Deleted Bets view. Settled bets only appear under the Settled tab.
export function BetListLive() {
  const qc = useQueryClient()
  const isSDA = useAuth((s) => s.user?.usetype === 0)

  const [view, setView] = useState<View>('open')
  const [sportId, setSportId] = useState<number | ''>('')
  const [seriesId, setSeriesId] = useState<number | ''>('')
  const [matchId, setMatchId] = useState<number | ''>('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  // Cascading selectors. Series/Match dropdowns are scoped by the choice above.
  const { data: sports = [] } = useQuery({ queryKey: ['sports'], queryFn: () => listSports().then((r) => r ?? []) })
  const { data: series = [] } = useQuery({
    queryKey: ['series', sportId], enabled: sportId !== '',
    queryFn: () => listSeries(Number(sportId)).then((r) => r ?? []),
  })
  const { data: matches = [] } = useQuery({
    queryKey: ['matches', sportId, seriesId, 'picker'], enabled: sportId !== '',
    queryFn: () => listMatches(Number(sportId), seriesId === '' ? undefined : Number(seriesId)).then((r) => r ?? []),
  })

  // matchIds in scope (used to narrow client-side when a Sport/Series is chosen
  // but no single Match is — bets carry only matchId, not sport/series).
  const scopeMatchIds = useMemo(() => new Set(matches.map((m) => m.id)), [matches])

  const dateParams = { from: from || undefined, to: to || undefined }
  const liveParams = {
    settled: view as 'open' | 'settled',
    ...(matchId !== '' ? { matchId: Number(matchId) } : {}),
    ...dateParams,
  }

  const { data: liveBets = [] } = useQuery({
    queryKey: ['bets', view, matchId, from, to],
    enabled: view !== 'deleted',
    queryFn: () => listBets(liveParams).then((r) => r ?? []),
    refetchInterval: 5000,
  })
  const { data: deletedBets = [] } = useQuery({
    queryKey: ['deleted-bets', matchId, from, to],
    enabled: view === 'deleted',
    queryFn: () => listDeletedBets({ ...(matchId !== '' ? { matchId: Number(matchId) } : {}), ...dateParams }).then((r) => r ?? []),
  })

  const rows: (Bet | DeletedBet)[] = view === 'deleted' ? deletedBets : liveBets
  // When a Sport/Series is chosen but not a specific Match, narrow client-side.
  const visible = sportId !== '' && matchId === ''
    ? rows.filter((b) => scopeMatchIds.has((b as Bet).matchId))
    : rows

  const remove = useMutation({
    mutationFn: (id: string) => deleteBet(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bets'] }),
  })

  const showAction = isSDA && view !== 'deleted'
  const cols = (view === 'deleted' ? 10 : 9) + (showAction ? 1 : 0)

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Bet List Live</Typography>
      <Card>
        <CardContent>
          <Tabs value={view} onChange={(_, v) => setView(v)} sx={{ mb: 2 }}>
            <Tab label="Pending" value="open" />
            <Tab label="Settled" value="settled" />
            <Tab label="Deleted" value="deleted" />
          </Tabs>

          <Stack direction="row" flexWrap="wrap" gap={1.5} sx={{ mb: 2 }}>
            <TextField select size="small" label="Sport" value={sportId} sx={{ minWidth: 140 }}
              onChange={(e) => { setSportId(e.target.value === '' ? '' : Number(e.target.value)); setSeriesId(''); setMatchId('') }}>
              <MenuItem value="">All Sports</MenuItem>
              {sports.map((s) => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
            </TextField>
            <TextField select size="small" label="Series" value={seriesId} sx={{ minWidth: 180 }} disabled={sportId === ''}
              onChange={(e) => { setSeriesId(e.target.value === '' ? '' : Number(e.target.value)); setMatchId('') }}>
              <MenuItem value="">All Series</MenuItem>
              {series.map((s) => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
            </TextField>
            <TextField select size="small" label="Match" value={matchId} sx={{ minWidth: 200 }} disabled={sportId === ''}
              onChange={(e) => setMatchId(e.target.value === '' ? '' : Number(e.target.value))}>
              <MenuItem value="">All Matches</MenuItem>
              {matches.map((m) => <MenuItem key={m.id} value={m.id}>{m.name}</MenuItem>)}
            </TextField>
            <TextField type="date" size="small" label="From Date" value={from} InputLabelProps={{ shrink: true }}
              onChange={(e) => setFrom(e.target.value)} />
            <TextField type="date" size="small" label="To Date" value={to} InputLabelProps={{ shrink: true }}
              onChange={(e) => setTo(e.target.value)} />
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
                <TableCell>Date</TableCell>
                {view === 'deleted' && <TableCell>Deleted By</TableCell>}
                {showAction && <TableCell align="right">Action</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {visible.map((b, i) => (
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
                  <TableCell>{new Date(b.createdAt).toLocaleString()}</TableCell>
                  {view === 'deleted' && <TableCell>{(b as DeletedBet).deletedBy ?? '—'}</TableCell>}
                  {showAction && (
                    <TableCell align="right">
                      <IconButton size="small" color="error" onClick={() => remove.mutate(b.id)}><DeleteIcon fontSize="small" /></IconButton>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {visible.length === 0 && (
                <TableRow><TableCell colSpan={cols} align="center">No {view === 'open' ? 'pending' : view} bets</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Box>
  )
}
