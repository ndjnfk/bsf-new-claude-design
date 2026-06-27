import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Box, Button, Card, CardContent, Dialog, DialogActions, DialogContent, DialogTitle,
  Stack, Switch, Tab, Tabs, Table, TableBody, TableCell, TableHead, TableRow, TextField,
  Typography, Chip,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import { listSports, listSeries, createSeries, toggleSeries, createMatch, type Series } from '../lib/api'

// Doc §18 — Manage Series/Matches: per-sport series with activate + add manual series/match.
export function ManageSeries() {
  const qc = useQueryClient()
  const [sportId, setSportId] = useState(4)
  const [seriesOpen, setSeriesOpen] = useState(false)
  const [matchSeries, setMatchSeries] = useState<Series | null>(null)

  const { data: sports = [] } = useQuery({ queryKey: ['sports'], queryFn: () => listSports().then((r) => r ?? []) })
  const { data: series = [] } = useQuery({ queryKey: ['series', sportId], queryFn: () => listSeries(sportId).then((r) => r ?? []) })

  const toggle = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) => toggleSeries(id, active),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['series', sportId] }),
  })

  return (
    <Box>
      <Stack direction="row" alignItems="center" sx={{ mb: 1 }}>
        <Typography variant="h5" sx={{ flexGrow: 1 }}>Manage Series</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setSeriesOpen(true)}>Add Series</Button>
      </Stack>
      <Tabs value={sportId} onChange={(_, v) => setSportId(v)} sx={{ mb: 2 }}>
        {sports.filter((s) => s.isBetfair).map((s) => <Tab key={s.id} label={s.name} value={s.id} />)}
      </Tabs>
      <Card>
        <CardContent>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>ID</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Active</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {series.map((s: Series, i: number) => (
                <TableRow key={s.id} hover>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell>{s.id}</TableCell>
                  <TableCell>{s.name}{s.isManual && <Chip size="small" label="Manual" sx={{ ml: 1 }} />}</TableCell>
                  <TableCell><Switch checked={s.active} onChange={(_, active) => toggle.mutate({ id: s.id, active })} /></TableCell>
                  <TableCell align="right">
                    <Button size="small" disabled={!s.active} onClick={() => setMatchSeries(s)}>Add Match</Button>
                    <Button size="small" disabled={!s.active} component={Link}
                      to={`/super-duper-admin/manage-matches?sportId=${s.sportId}&seriesId=${s.id}&seriesName=${encodeURIComponent(s.name)}`}>
                      Manage Matches
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {series.length === 0 && <TableRow><TableCell colSpan={5} align="center">No series</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {seriesOpen && (
        <AddSeriesDialog sportId={sportId} onClose={() => setSeriesOpen(false)}
          onDone={() => { setSeriesOpen(false); qc.invalidateQueries({ queryKey: ['series', sportId] }) }} />
      )}
      {matchSeries && (
        <AddMatchDialog series={matchSeries} onClose={() => setMatchSeries(null)}
          onDone={() => { setMatchSeries(null); qc.invalidateQueries({ queryKey: ['matches'] }) }} />
      )}
    </Box>
  )
}

function AddSeriesDialog(props: { sportId: number; onClose: () => void; onDone: () => void }) {
  const [name, setName] = useState('')
  const mutation = useMutation({ mutationFn: () => createSeries({ sportId: props.sportId, name }), onSuccess: props.onDone })
  return (
    <Dialog open onClose={props.onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Add Series</DialogTitle>
      <DialogContent><TextField fullWidth label="Series Name" value={name} onChange={(e) => setName(e.target.value)} sx={{ mt: 1 }} /></DialogContent>
      <DialogActions>
        <Button onClick={props.onClose}>Cancel</Button>
        <Button variant="contained" disabled={!name || mutation.isPending} onClick={() => mutation.mutate()}>Save</Button>
      </DialogActions>
    </Dialog>
  )
}

function AddMatchDialog(props: { series: Series; onClose: () => void; onDone: () => void }) {
  const [name, setName] = useState('')
  const [matchDate, setMatchDate] = useState('') // datetime-local "YYYY-MM-DDTHH:mm"
  const mutation = useMutation({
    mutationFn: () => createMatch({
      sportId: props.series.sportId, name, seriesId: props.series.id,
      startTime: matchDate ? matchDate.replace('T', ' ') + ':00' : undefined,
    }),
    onSuccess: props.onDone,
  })
  return (
    <Dialog open onClose={props.onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Add Match — {props.series.name}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField fullWidth label="Match Name" value={name} onChange={(e) => setName(e.target.value)} />
          <TextField fullWidth required type="datetime-local" label="Match Date" value={matchDate}
            onChange={(e) => setMatchDate(e.target.value)} InputLabelProps={{ shrink: true }} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={props.onClose}>Cancel</Button>
        <Button variant="contained" disabled={!name || !matchDate || mutation.isPending} onClick={() => mutation.mutate()}>Save</Button>
      </DialogActions>
    </Dialog>
  )
}
