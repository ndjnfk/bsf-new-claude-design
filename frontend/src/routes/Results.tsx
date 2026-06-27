import { useState, useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Box, Breadcrumbs, Button, Card, CardContent, FormControlLabel, Grid, MenuItem, Stack, Switch,
  Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography, Chip, Alert,
} from '@mui/material'
import {
  listSports, listMatches, listMarkets, marketRunners, listResults, declareResult, revokeResult,
  listSettings, setSetting, type Result, type Match, type Sport, type Market,
} from '../lib/api'
import { useAuth } from '../store/auth'

const ABANDONED = 'Abandoned'

// Doc §22 — Declare Result. Cascading Sport → Match → Market → Selection
// dropdowns (mirrors the reference match-result page); declaring settles the
// market automatically via the settlement engine.
const AUTO_KEY = 'auto_declare_result'

export function Results() {
  const qc = useQueryClient()
  const isSDA = useAuth((s) => s.user?.usetype === 0)
  const { data: sports = [] } = useQuery({ queryKey: ['sports'], queryFn: () => listSports().then((r) => r ?? []) })
  const { data: allMatches = [] } = useQuery({ queryKey: ['matches', 'all'], queryFn: () => listMatches().then((r) => r ?? []) })
  const { data: results = [] } = useQuery({ queryKey: ['results'], queryFn: () => listResults().then((r) => r ?? []) })
  const { data: settings = [] } = useQuery({ queryKey: ['settings'], queryFn: () => listSettings().then((r) => r ?? []), enabled: isSDA })
  const autoDeclare = settings.find((s) => s.key === AUTO_KEY)?.value === '1'
  const toggleAuto = useMutation({
    mutationFn: (on: boolean) => setSetting(AUTO_KEY, on ? '1' : '0'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings'] }),
  })

  // --- Declare cascade ---
  const [sportId, setSportId] = useState<number | ''>('')
  const [matchId, setMatchId] = useState<number | ''>('')
  const [marketRowId, setMarketRowId] = useState<number | ''>('')
  const [selection, setSelection] = useState('')
  const [error, setError] = useState('')

  const { data: matches = [] } = useQuery({
    queryKey: ['matches', sportId], queryFn: () => listMatches(Number(sportId)).then((r) => r ?? []), enabled: !!sportId,
  })
  const { data: markets = [] } = useQuery({
    queryKey: ['markets', matchId], queryFn: () => listMarkets(Number(matchId)).then((r) => r ?? []), enabled: !!matchId,
  })
  const { data: runners = [] } = useQuery({
    queryKey: ['runners', marketRowId], queryFn: () => marketRunners(Number(marketRowId)).then((r) => r ?? []), enabled: !!marketRowId,
  })

  const declare = useMutation({
    mutationFn: () => {
      const market = markets.find((m) => m.id === marketRowId)
      return declareResult({
        matchId: Number(matchId), sportId: Number(sportId),
        marketId: market?.marketId ?? String(marketRowId), marketName: market?.name ?? '',
        selectionName: selection,
      })
    },
    onSuccess: () => {
      setSelection(''); setMarketRowId(''); setMatchId(''); setSportId('')
      qc.invalidateQueries({ queryKey: ['results'] }); qc.invalidateQueries({ queryKey: ['matches'] })
    },
    onError: (err: unknown) => setError(getMessage(err) ?? 'Failed to declare'),
  })
  const revoke = useMutation({
    mutationFn: (id: number) => revokeResult(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['results'] }); qc.invalidateQueries({ queryKey: ['matches'] }) },
  })

  // --- Match Result list filters ---
  const [fSport, setFSport] = useState<number | 'all'>('all')
  const [fMatch, setFMatch] = useState<string>('all')
  const [fDate, setFDate] = useState('')

  const matchName = (id: number) => allMatches.find((m) => m.id === id)?.name ?? `Match #${id}`
  const sportName = (id: number) => sports.find((s) => s.id === id)?.name ?? String(id)

  const filtered = useMemo(() => results.filter((r) => {
    if (fSport !== 'all' && r.sportId !== fSport) return false
    if (fMatch !== 'all' && matchName(r.matchId) !== fMatch) return false
    if (fDate && new Date(r.declaredAt).toISOString().slice(0, 10) !== fDate) return false
    return true
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [results, fSport, fMatch, fDate, allMatches])

  const matchNames = useMemo(() => [...new Set(results.map((r) => matchName(r.matchId)))],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [results, allMatches])

  return (
    <Box>
      <Breadcrumbs sx={{ mb: 1 }}>
        <Typography color="text.secondary">Dashboard</Typography>
        <Typography color="text.primary">Declare Result</Typography>
      </Breadcrumbs>
      <Typography variant="h5" gutterBottom>Declare Result</Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          {isSDA && (
            <Stack direction="row" justifyContent="flex-end" sx={{ mb: 1 }}>
              <FormControlLabel
                control={<Switch checked={autoDeclare} disabled={toggleAuto.isPending}
                  onChange={(_, on) => toggleAuto.mutate(on)} />}
                label="Auto Declare Result"
              />
            </Stack>
          )}
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={3}>
              <TextField select fullWidth required label="Select Sport" value={sportId}
                onChange={(e) => { setSportId(Number(e.target.value)); setMatchId(''); setMarketRowId(''); setSelection('') }}>
                {sports.map((s: Sport) => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField select fullWidth required label="Select Match" value={matchId} disabled={!sportId}
                onChange={(e) => { setMatchId(Number(e.target.value)); setMarketRowId(''); setSelection('') }}>
                {matches.map((m: Match) => <MenuItem key={m.id} value={m.id}>{m.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField select fullWidth required label="Select Market" value={marketRowId} disabled={!matchId}
                onChange={(e) => { setMarketRowId(Number(e.target.value)); setSelection('') }}>
                {markets.map((m: Market) => <MenuItem key={m.id} value={m.id}>{m.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField select fullWidth required label="Select Selection" value={selection} disabled={!marketRowId}
                onChange={(e) => setSelection(e.target.value)}>
                {runners.map((r) => <MenuItem key={r.id} value={r.name}>{r.name}</MenuItem>)}
                <MenuItem value={ABANDONED}>{ABANDONED}</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sx={{ textAlign: 'right' }}>
              <Button variant="contained" sx={{ bgcolor: '#1f2937', '&:hover': { bgcolor: '#374151' } }}
                disabled={!sportId || !matchId || !marketRowId || !selection || declare.isPending}
                onClick={() => { setError(''); declare.mutate() }}>Declare</Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Typography variant="h5" gutterBottom>Match Result</Typography>
      <Card>
        <CardContent>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={3}>
              <TextField select fullWidth label="Sport" value={fSport} onChange={(e) => setFSport(e.target.value === 'all' ? 'all' : Number(e.target.value))}>
                <MenuItem value="all">All</MenuItem>
                {sports.map((s) => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField select fullWidth label="Select Match" value={fMatch} onChange={(e) => setFMatch(e.target.value)}>
                <MenuItem value="all">All</MenuItem>
                {matchNames.map((n) => <MenuItem key={n} value={n}>{n}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField fullWidth type="date" label="Result Date" value={fDate} onChange={(e) => setFDate(e.target.value)} InputLabelProps={{ shrink: true }} />
            </Grid>
          </Grid>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>Match</TableCell>
                <TableCell>Market</TableCell>
                <TableCell>Sport</TableCell>
                <TableCell>Selection</TableCell>
                <TableCell>Declared By</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Date</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((r: Result, i: number) => (
                <TableRow key={r.id} hover>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell>{matchName(r.matchId)}</TableCell>
                  <TableCell>{r.marketName ?? r.marketId}</TableCell>
                  <TableCell>{sportName(r.sportId)}</TableCell>
                  <TableCell>{r.selectionName}</TableCell>
                  <TableCell>{r.declaredBy ?? 'Auto'}</TableCell>
                  <TableCell><Chip size="small" label={r.status} color={r.status === 'DECLARED' ? 'success' : 'default'} /></TableCell>
                  <TableCell>{new Date(r.declaredAt).toLocaleString()}</TableCell>
                  <TableCell align="right">
                    {r.status === 'DECLARED' && (
                      <Button size="small" variant="contained" color="error" onClick={() => revoke.mutate(r.id)}>Revoke</Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && <TableRow><TableCell colSpan={9} align="center">No results yet</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Box>
  )
}

function getMessage(err: unknown): string | undefined {
  if (typeof err === 'object' && err && 'response' in err) {
    return (err as { response?: { data?: { error?: string } } }).response?.data?.error
  }
  return undefined
}
