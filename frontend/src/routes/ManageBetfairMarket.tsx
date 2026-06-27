import { useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Box, Breadcrumbs, Button, Card, CardContent, Dialog, DialogActions, DialogContent, DialogTitle,
  IconButton, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import { listMarkets, createMarket, activateMarket, publishMarket, type Market } from '../lib/api'

// Doc §"Manage Betfair Market": activate markets, publish/unpublish, add manual market.
export function ManageBetfairMarket() {
  const qc = useQueryClient()
  const [params] = useSearchParams()
  const matchId = Number(params.get('matchId') ?? 0)
  const sportId = params.get('sportId') ?? ''
  const matchName = params.get('matchName') ?? `Match ${matchId}`
  const q = `?matchId=${matchId}&sportId=${sportId}&matchName=${encodeURIComponent(matchName)}`
  const [open, setOpen] = useState(false)

  const { data: markets = [] } = useQuery({
    queryKey: ['markets', matchId],
    queryFn: () => listMarkets(matchId).then((r) => r ?? []),
    enabled: matchId > 0,
  })

  const act = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) => activateMarket(id, active),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['markets', matchId] }),
  })
  const pub = useMutation({
    mutationFn: ({ id, published }: { id: number; published: boolean }) => publishMarket(id, published),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['markets', matchId] }),
  })

  return (
    <Box>
      <Breadcrumbs sx={{ mb: 1 }}>
        <Link to="/super-duper-admin/live-matches">Matches</Link>
        <Typography color="text.primary">{matchName}</Typography>
      </Breadcrumbs>
      <Stack direction="row" alignItems="center" sx={{ mb: 1 }}>
        <Typography variant="h5" sx={{ flexGrow: 1 }}>Betfair Markets</Typography>
        {sportId === '4' && (
          <>
            <Button component={Link} to={`/super-duper-admin/manage-indian-fancy${q}`} size="small">Indian Fancy</Button>
            <Button component={Link} to={`/super-duper-admin/manage-session-fancy${q}`} size="small">Line Fancy</Button>
          </>
        )}
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)} sx={{ ml: 1 }}>Add Market</Button>
      </Stack>
      <Card>
        <CardContent>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Category</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {markets.map((mk: Market, i: number) => (
                <TableRow key={mk.id} hover>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell>{mk.name}{mk.isManual && ' (Manual)'}</TableCell>
                  <TableCell>{mk.category}</TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                      {!mk.active ? (
                        <Button size="small" variant="contained" onClick={() => act.mutate({ id: mk.id, active: true })}>Activate</Button>
                      ) : mk.isManual ? (
                        <Button size="small" disabled>Activated</Button>
                      ) : !mk.isPublished ? (
                        <Button size="small" variant="outlined" onClick={() => pub.mutate({ id: mk.id, published: true })}>Publish Data</Button>
                      ) : (
                        <Button size="small" variant="outlined" color="error" onClick={() => pub.mutate({ id: mk.id, published: false })}>Unpublish Data</Button>
                      )}
                      <Button size="small" variant="contained" color="success" component={Link}
                        to={`/super-duper-admin/my-markets?marketId=${encodeURIComponent(mk.marketId)}&matchId=${matchId}&matchName=${encodeURIComponent(matchName)}`}>
                        Live
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
              {markets.length === 0 && <TableRow><TableCell colSpan={4} align="center">No markets</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {open && <AddMarketDialog matchId={matchId} onClose={() => setOpen(false)}
        onDone={() => { setOpen(false); qc.invalidateQueries({ queryKey: ['markets', matchId] }) }} />}
    </Box>
  )
}

function AddMarketDialog(props: { matchId: number; onClose: () => void; onDone: () => void }) {
  const [name, setName] = useState('')
  const [runners, setRunners] = useState<{ selectionId: string; name: string }[]>([{ selectionId: '', name: '' }])

  const setRunner = (i: number, key: 'selectionId' | 'name', v: string) =>
    setRunners((rs) => rs.map((r, idx) => (idx === i ? { ...r, [key]: v } : r)))

  const mutation = useMutation({
    mutationFn: () => createMarket({ matchId: props.matchId, name, runners: runners.filter((r) => r.name) }),
    onSuccess: props.onDone,
  })

  return (
    <Dialog open onClose={props.onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add Market</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField label="Market Name" value={name} onChange={(e) => setName(e.target.value)} />
          <Typography variant="subtitle2">Runners</Typography>
          {runners.map((r, i) => (
            <Stack key={i} direction="row" spacing={1} alignItems="center">
              <TextField size="small" label="Runner Name" value={r.name} onChange={(e) => setRunner(i, 'name', e.target.value)} />
              <TextField size="small" label="Selection ID (optional)" value={r.selectionId} onChange={(e) => setRunner(i, 'selectionId', e.target.value)} />
              <IconButton size="small" color="error" onClick={() => setRunners((rs) => rs.filter((_, idx) => idx !== i))}><DeleteIcon fontSize="small" /></IconButton>
            </Stack>
          ))}
          <Button size="small" startIcon={<AddIcon />} onClick={() => setRunners((rs) => [...rs, { selectionId: '', name: '' }])}>Add Runner</Button>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={props.onClose}>Cancel</Button>
        <Button variant="contained" disabled={mutation.isPending || !name} onClick={() => mutation.mutate()}>Save</Button>
      </DialogActions>
    </Dialog>
  )
}
