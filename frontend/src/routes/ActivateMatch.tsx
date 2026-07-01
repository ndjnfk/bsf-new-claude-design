import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Box, Card, CardContent, Chip, Tab, Tabs, Table, TableBody, TableCell, TableHead,
  TableRow, Typography, CircularProgress, Alert, TextField, InputAdornment,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import { feedMatchList, type CatalogRow } from '../lib/api'

const SPORTS = [
  { id: '4', name: 'Cricket' },
  { id: '2', name: 'Tennis' },
  { id: '1', name: 'Soccer' },
]

// Activate Match — merged feed + our catalog (so manual matches show too).
// Toggling on imports the MATCH ONLY (no markets — fetched on demand later) or
// re-enables it; off deactivates it. Separate from Direct Activate (untouched).
export function ActivateMatch() {
  const [sportId, setSportId] = useState('4')
  const [search, setSearch] = useState('')

  const { data: rows = [], isLoading, isError } = useQuery({
    queryKey: ['match-list', sportId],
    queryFn: () => feedMatchList(sportId).then((r) => r ?? []),
    refetchInterval: 20000,
  })

  const filtered = rows.filter((m) => m.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Activate Match</Typography>
      <Tabs value={sportId} onChange={(_, v) => setSportId(v)} sx={{ mb: 2 }}>
        {SPORTS.map((s) => <Tab key={s.id} label={s.name} value={s.id} />)}
      </Tabs>
      {isError && <Alert severity="error" sx={{ mb: 2 }}>The feed is unavailable — showing your catalog only.</Alert>}
      <Card>
        <CardContent>
          <TextField size="small" placeholder="Search matches…" value={search} onChange={(e) => setSearch(e.target.value)}
            sx={{ mb: 2 }} InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }} />
          {isLoading ? (
            <Box sx={{ display: 'grid', placeItems: 'center', height: 120 }}><CircularProgress /></Box>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Series</TableCell>
                  <TableCell>Match</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Source</TableCell>
                  <TableCell align="center">Status</TableCell>
                  {/* <TableCell align="right">Activate</TableCell> */}
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((m: CatalogRow, i: number) => (
                  <TableRow key={m.feedId || `local-${m.localId}`} hover>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell>{m.seriesName ?? '—'}</TableCell>
                    <TableCell>
                      {m.name}
                      {m.inPlay && <Chip size="small" label="In-Play" color="error" sx={{ ml: 1 }} />}
                    </TableCell>
                    <TableCell>{m.startTime ? new Date(m.startTime).toLocaleString() : '—'}</TableCell>
                    <TableCell>{m.feedId ? 'Feed' : 'Manual'}</TableCell>
                    <TableCell align="center">
                      <Chip size="small" label={m.active ? 'Activated' : 'Off'} color={m.active ? 'success' : 'default'} />
                    </TableCell>
                    {/* <TableCell align="right">
                      <Switch checked={m.active} disabled={toggle.isPending}
                        onChange={(_, on) => toggle.mutate({ feedId: m.feedId, localId: m.localId, on })} />
                    </TableCell> */}
                  </TableRow>
                ))}
                {filtered.length === 0 && <TableRow><TableCell colSpan={7} align="center">No matches for this sport</TableCell></TableRow>}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}
