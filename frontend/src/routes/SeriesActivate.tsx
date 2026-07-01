import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Box, Card, CardContent, Chip, Switch, Tab, Tabs, Table, TableBody, TableCell, TableHead,
  TableRow, Typography, CircularProgress, Alert, TextField, InputAdornment,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import { feedSeriesList, feedToggleSeries, type CatalogRow } from '../lib/api'

// Sports the feed covers. Cricket / Tennis / Soccer.
const SPORTS = [
  { id: '4', name: 'Cricket' },
  { id: '2', name: 'Tennis' },
  { id: '1', name: 'Soccer' },
]

// Series Activate — a merged view of the feed AND our own catalog (so manually
// added series show too). Toggle each on/off; "on" imports/re-enables it, "off"
// deactivates it. Separate from Direct Activate (untouched).
export function SeriesActivate() {
  const qc = useQueryClient()
  const [sportId, setSportId] = useState('4')
  const [search, setSearch] = useState('')

  const { data: rows = [], isLoading, isError } = useQuery({
    queryKey: ['series-list', sportId],
    queryFn: () => feedSeriesList(sportId).then((r) => r ?? []),
    refetchInterval: 30000,
  })

  const toggle = useMutation({
    mutationFn: (r: { feedId: string; localId: number; on: boolean }) => feedToggleSeries(r),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['series-list', sportId] }),
  })

  const filtered = rows.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Series Activate</Typography>
      <Tabs value={sportId} onChange={(_, v) => setSportId(v)} sx={{ mb: 2 }}>
        {SPORTS.map((s) => <Tab key={s.id} label={s.name} value={s.id} />)}
      </Tabs>
      {isError && <Alert severity="error" sx={{ mb: 2 }}>The feed is unavailable — showing your catalog only.</Alert>}
      <Card>
        <CardContent>
          <TextField size="small" placeholder="Search series…" value={search} onChange={(e) => setSearch(e.target.value)}
            sx={{ mb: 2 }} InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }} />
          {isLoading ? (
            <Box sx={{ display: 'grid', placeItems: 'center', height: 120 }}><CircularProgress /></Box>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Series</TableCell>
                  <TableCell>Source</TableCell>
                  <TableCell align="center">Status</TableCell>
                  <TableCell align="right">Activate</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((s: CatalogRow, i: number) => (
                  <TableRow key={s.feedId || `local-${s.localId}`} hover>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell>{s.name}</TableCell>
                    <TableCell>{s.feedId ? 'Feed' : 'Manual'}</TableCell>
                    <TableCell align="center">
                      <Chip size="small" label={s.active ? 'Activated' : 'Off'} color={s.active ? 'success' : 'default'} />
                    </TableCell>
                    <TableCell align="right">
                      <Switch checked={s.active} disabled={toggle.isPending}
                        onChange={(_, on) => toggle.mutate({ feedId: s.feedId, localId: s.localId, on })} />
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && <TableRow><TableCell colSpan={5} align="center">No series for this sport</TableCell></TableRow>}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}
