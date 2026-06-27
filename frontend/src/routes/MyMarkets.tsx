import { useEffect, useMemo, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Box, Breadcrumbs, Button, Card, CardContent, Grid, MenuItem, Stack, Table, TableBody,
  TableCell, TableHead, TableRow, TextField, Typography, Chip, Alert,
} from '@mui/material'
import { getBook, getMatchOdds, placeBet, listBets, type Bet, type BookLevel, type MarketBook } from '../lib/api'
import { useRoom } from '../hooks/useRoom'
import { useAuth } from '../store/auth'

// Doc §5 — Live Match Report (My Markets): live order book, manual bet entry,
// live bets and per-selection position for one market. Backed by the matching
// engine (book) and the betting module (bets + realtime fan-out).
export function MyMarkets() {
  const qc = useQueryClient()
  const [params] = useSearchParams()
  const matchId = params.get('matchId') ?? ''
  const marketId = params.get('marketId') ?? (matchId ? `MATCH_ODDS:${matchId}` : 'MATCH_ODDS')
  const matchName = params.get('matchName') ?? 'Live Match'
  const isSDA = useAuth((s) => s.user?.usetype === 0) // manual bet entry is SDA-only

  // No polling — the WebSocket below pushes a refresh whenever this market
  // actually changes (a bet placed/deleted), so the book/bets fetch once and
  // then update on real events instead of every few seconds.
  const { data: book } = useQuery({
    queryKey: ['book', marketId],
    queryFn: () => getBook(marketId),
  })
  const { data: bets = [] } = useQuery({
    queryKey: ['bets', marketId],
    queryFn: () => listBets({ marketId }).then((r) => r ?? []),
  })

  // Live: refresh book + bets when this market emits.
  useRoom(`MARKET_UPDATE_DATA:${marketId}`, () => {
    qc.invalidateQueries({ queryKey: ['book', marketId] })
    qc.invalidateQueries({ queryKey: ['bets', marketId] })
  })

  // Event-based live odds: ONE subscription to the match room delivers every
  // published market of this event (no load from the other events' markets).
  const matchIdNum = Number(matchId) || 0
  const [books, setBooks] = useState<Record<string, MarketBook>>({})
  const { data: matchOdds } = useQuery({
    queryKey: ['odds-match', matchIdNum], queryFn: () => getMatchOdds(matchIdNum).then((r) => r ?? []), enabled: matchIdNum > 0,
  })
  useEffect(() => {
    if (matchOdds) {
      const m: Record<string, MarketBook> = {}
      for (const b of matchOdds) m[b.marketId] = b
      setBooks(m)
    }
  }, [matchOdds])
  useRoom(matchIdNum ? `MATCH_ODDS:${matchIdNum}` : null, (msg) => {
    const b = msg as MarketBook
    if (b?.marketId) setBooks((prev) => ({ ...prev, [b.marketId]: b }))
  })
  const liveBook = books[marketId] ?? null // the primary market (for the suspend gate)

  // Per-selection position (net stake; lay shown negative as liability proxy).
  const positions = useMemo(() => {
    const map = new Map<string, number>()
    for (const b of bets) {
      const sign = b.side === 'lay' ? -1 : 1
      map.set(b.selection, (map.get(b.selection) ?? 0) + sign * b.stake)
    }
    return [...map.entries()]
  }, [bets])

  return (
    <Box>
      <Breadcrumbs sx={{ mb: 1 }}>
        <Link to="/super-duper-admin/live-matches">Matches</Link>
        <Typography color="text.primary">Live Report</Typography>
      </Breadcrumbs>
      <Typography variant="h5" gutterBottom>{matchName}</Typography>
      <Typography variant="caption" color="text.secondary">Market: {marketId}</Typography>

      {Object.values(books)
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((b) => <LiveOddsCard key={b.marketId} book={b} />)}

      <Grid container spacing={2} sx={{ mt: 0 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>Order Book (Match Odds)</Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}><Depth title="LAGAI (Back)" levels={book?.backs ?? null} color="#f0f7ff" /></Grid>
                <Grid item xs={6}><Depth title="KHAI (Lay)" levels={book?.lays ?? null} color="#fff1f0" /></Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          {isSDA && (
            <PlaceBetCard marketId={marketId} matchId={Number(matchId) || 0}
              suspended={liveBook?.status === 'SUSPENDED'}
              onPlaced={() => {
                qc.invalidateQueries({ queryKey: ['book', marketId] })
                qc.invalidateQueries({ queryKey: ['bets', marketId] })
              }} />
          )}
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>Current Position</Typography>
              <Table size="small">
                <TableHead><TableRow><TableCell>Selection</TableCell><TableCell align="right">Net</TableCell></TableRow></TableHead>
                <TableBody>
                  {positions.map(([sel, net]) => (
                    <TableRow key={sel}><TableCell>{sel}</TableCell>
                      <TableCell align="right" sx={{ color: net < 0 ? '#cf222e' : '#1a7f37' }}>{net.toFixed(2)}</TableCell></TableRow>
                  ))}
                  {positions.length === 0 && <TableRow><TableCell colSpan={2} align="center">No positions</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ mt: 2 }}>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>Live Bets</Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell><TableCell>Selection</TableCell><TableCell>Side</TableCell>
                <TableCell align="right">Odds</TableCell><TableCell align="right">Stake</TableCell>
                <TableCell align="right">Matched</TableCell><TableCell>Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {bets.map((b: Bet, i: number) => (
                <TableRow key={i} sx={{ bgcolor: b.side === 'lay' ? '#fff1f0' : '#f0f7ff' }}>
                  <TableCell>{b.userId}</TableCell><TableCell>{b.selection}</TableCell>
                  <TableCell><Chip size="small" label={b.side} color={b.side === 'lay' ? 'error' : 'primary'} /></TableCell>
                  <TableCell align="right">{b.price}</TableCell><TableCell align="right">{b.stake}</TableCell>
                  <TableCell align="right">{b.matchedSize}</TableCell>
                  <TableCell>{new Date(b.createdAt).toLocaleTimeString()}</TableCell>
                </TableRow>
              ))}
              {bets.length === 0 && <TableRow><TableCell colSpan={7} align="center">No bets yet</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Box>
  )
}

// Live Betfair-style odds grid (3 back + 3 lay per runner), streamed from the
// odds publisher. Best back is right-most blue, best lay left-most pink.
function LiveOddsCard({ book }: { book: MarketBook | null }) {
  if (!book) return null
  const cell = (ps: { price: number; size: number } | undefined, bg: string) => (
    <TableCell align="center" sx={{ bgcolor: bg, minWidth: 70 }}>
      {ps ? <><b>{ps.price}</b><br /><Typography variant="caption" color="text.secondary">{ps.size.toLocaleString()}</Typography></> : '—'}
    </TableCell>
  )
  const statusColor = book.status === 'OPEN' ? 'success' : book.status === 'SUSPENDED' ? 'warning' : 'default'
  return (
    <Card sx={{ mt: 2 }}>
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
          <Typography variant="subtitle1">{book.name || 'Live Market Odds'}</Typography>
          <Chip size="small" label={book.status} color={statusColor as 'success' | 'warning' | 'default'} />
          <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
            updated {new Date(book.ts).toLocaleTimeString()}
          </Typography>
        </Stack>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Runner</TableCell>
              <TableCell align="center" colSpan={3} sx={{ bgcolor: '#e6f0ff' }}>Back (Lagai)</TableCell>
              <TableCell align="center" colSpan={3} sx={{ bgcolor: '#ffe6e6' }}>Lay (Khai)</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {book.runners.map((r) => (
              <TableRow key={r.selectionId} hover>
                <TableCell>{r.name}</TableCell>
                {cell(r.back[2], '#f0f7ff')}{cell(r.back[1], '#dbeaff')}{cell(r.back[0], '#a9ccff')}
                {cell(r.lay[0], '#ffb3b3')}{cell(r.lay[1], '#ffd6d6')}{cell(r.lay[2], '#fff1f0')}
                <TableCell><Chip size="small" label={r.status} color={r.status === 'ACTIVE' ? 'success' : 'default'} /></TableCell>
              </TableRow>
            ))}
            {book.runners.length === 0 && <TableRow><TableCell colSpan={8} align="center">No runners</TableCell></TableRow>}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

function Depth({ title, levels, color }: { title: string; levels: BookLevel[] | null; color: string }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">{title}</Typography>
      <Table size="small">
        <TableBody>
          {(levels ?? []).map((l, i) => (
            <TableRow key={i} sx={{ bgcolor: color }}>
              <TableCell>{l.price}</TableCell><TableCell align="right">{l.size}</TableCell>
            </TableRow>
          ))}
          {(levels ?? []).length === 0 && <TableRow><TableCell align="center">—</TableCell></TableRow>}
        </TableBody>
      </Table>
    </Box>
  )
}

function PlaceBetCard({ marketId, matchId, onPlaced, suspended }: { marketId: string; matchId: number; onPlaced: () => void; suspended: boolean }) {
  const [selection, setSelection] = useState('Team A')
  const [side, setSide] = useState<'back' | 'lay'>('back')
  const [betType, setBetType] = useState('match')
  const [price, setPrice] = useState(2)
  const [stake, setStake] = useState(100)
  const [error, setError] = useState('')

  const mutation = useMutation({
    mutationFn: () => placeBet({ marketId, matchId, betType, selection, side, price, stake }),
    onSuccess: onPlaced,
    onError: (err: unknown) => setError(getMessage(err) ?? 'Bet failed'),
  })

  return (
    <Card>
      <CardContent>
        <Typography variant="subtitle1" gutterBottom>Place Bet (manual)</Typography>
        {suspended && <Alert severity="warning" sx={{ mb: 1 }}>Market is SUSPENDED — bets are not accepted.</Alert>}
        {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}
        <Stack spacing={1.5}>
          <TextField size="small" select label="Bet Type" value={betType} onChange={(e) => setBetType(e.target.value)}>
            <MenuItem value="match">Match Odds</MenuItem>
            <MenuItem value="bookmaker">Bookmaker</MenuItem>
            <MenuItem value="toss">Toss</MenuItem>
            <MenuItem value="fancy">Fancy / Session</MenuItem>
          </TextField>
          <TextField size="small" label="Selection" value={selection} onChange={(e) => setSelection(e.target.value)} />
          <TextField size="small" select label="Side" value={side} onChange={(e) => setSide(e.target.value as 'back' | 'lay')}>
            <MenuItem value="back">LAGAI (Back)</MenuItem>
            <MenuItem value="lay">KHAI (Lay)</MenuItem>
          </TextField>
          <TextField size="small" type="number" label="Odds" value={price} onChange={(e) => setPrice(Number(e.target.value))} />
          <TextField size="small" type="number" label="Stake" value={stake} onChange={(e) => setStake(Number(e.target.value))} />
          <Button variant="contained" disabled={mutation.isPending || price <= 1 || stake <= 0 || suspended}
            onClick={() => { setError(''); mutation.mutate() }}>
            {mutation.isPending ? 'Placing…' : suspended ? 'Suspended' : 'Place Bet'}
          </Button>
        </Stack>
      </CardContent>
    </Card>
  )
}

function getMessage(err: unknown): string | undefined {
  if (typeof err === 'object' && err && 'response' in err) {
    return (err as { response?: { data?: { error?: string } } }).response?.data?.error
  }
  return undefined
}
