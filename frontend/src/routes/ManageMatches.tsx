import { useState, Fragment } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Box, Breadcrumbs, Button, Card, CardContent, Collapse, Dialog, DialogActions, DialogContent,
  DialogTitle, Stack, Switch, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import { listMatches, activateMatch, createMatch, type Match } from '../lib/api'

// Doc §"Manage Matches": matches within a series — activate, add manual, and a
// "Manage" detail linking to Betfair / Indian Fancy / Line Fancy.
export function ManageMatches() {
  const qc = useQueryClient()
  const [params] = useSearchParams()
  const sportId = Number(params.get('sportId') ?? 4)
  const seriesId = Number(params.get('seriesId') ?? 0)
  const seriesName = params.get('seriesName') ?? `Series ${seriesId}`
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState<number | null>(null)

  const { data: matches = [] } = useQuery({
    queryKey: ['series-matches', sportId, seriesId],
    queryFn: () => listMatches(sportId, seriesId).then((r) => r ?? []),
    enabled: seriesId > 0,
  })

  const act = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) => activateMatch(id, active),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['series-matches', sportId, seriesId] }),
  })

  const q = (m: Match) => `?matchId=${m.id}&sportId=${sportId}&seriesId=${seriesId}&matchName=${encodeURIComponent(m.name)}`

  return (
    <Box>
      <Breadcrumbs sx={{ mb: 1 }}>
        <Link to="/super-duper-admin/manage-series">Manage Series</Link>
        <Typography color="text.primary">{seriesName}</Typography>
      </Breadcrumbs>
      <Stack direction="row" alignItems="center" sx={{ mb: 1 }}>
        <Typography variant="h5" sx={{ flexGrow: 1 }}>Manage Matches</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}>Add Match</Button>
      </Stack>
      <Card>
        <CardContent>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Match Date</TableCell>
                <TableCell>Active</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {matches.map((m: Match) => (
                <Fragment key={m.id}>
                  <TableRow hover>
                    <TableCell>{m.name}</TableCell>
                    <TableCell>{new Date(m.startTime).toLocaleString()}</TableCell>
                    <TableCell><Switch checked={m.active} onChange={(_, active) => act.mutate({ id: m.id, active })} /></TableCell>
                    <TableCell align="right">
                      <Button size="small" disabled={!m.active} onClick={() => setExpanded(expanded === m.id ? null : m.id)}>Manage</Button>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={4} sx={{ py: 0, border: 0 }}>
                      <Collapse in={expanded === m.id} unmountOnExit>
                        <Stack direction="row" spacing={1} sx={{ py: 1 }}>
                          <Button size="small" variant="outlined" component={Link} to={`/super-duper-admin/manage-bet-fair${q(m)}`}>Betfair Market</Button>
                          {sportId === 4 && (
                            <>
                              <Button size="small" variant="outlined" component={Link} to={`/super-duper-admin/manage-indian-fancy${q(m)}`}>Indian Fancy</Button>
                              <Button size="small" variant="outlined" component={Link} to={`/super-duper-admin/manage-session-fancy${q(m)}`}>Line Fancy</Button>
                            </>
                          )}
                        </Stack>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </Fragment>
              ))}
              {matches.length === 0 && <TableRow><TableCell colSpan={4} align="center">No matches in this series</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {open && <AddMatchDialog sportId={sportId} seriesId={seriesId} onClose={() => setOpen(false)}
        onDone={() => { setOpen(false); qc.invalidateQueries({ queryKey: ['series-matches', sportId, seriesId] }) }} />}
    </Box>
  )
}

function AddMatchDialog(props: { sportId: number; seriesId: number; onClose: () => void; onDone: () => void }) {
  const [name, setName] = useState('')
  const [matchDate, setMatchDate] = useState('') // datetime-local "YYYY-MM-DDTHH:mm"
  const mutation = useMutation({
    // datetime-local → MySQL DATETIME ("YYYY-MM-DD HH:mm:ss").
    mutationFn: () => createMatch({
      sportId: props.sportId, name, seriesId: props.seriesId,
      startTime: matchDate ? matchDate.replace('T', ' ') + ':00' : undefined,
    }),
    onSuccess: props.onDone,
  })
  return (
    <Dialog open onClose={props.onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Add Match</DialogTitle>
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
