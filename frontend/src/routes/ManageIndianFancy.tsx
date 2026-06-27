import { useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Box, Breadcrumbs, Button, Card, CardContent, Dialog, DialogActions, DialogContent, DialogTitle,
  Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography, Chip,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import { listFancy, updateFancyStatus, createFancy, type Fancy } from '../lib/api'

// Doc §"Manage Indian Fancy": activate session fancy runners + add manual fancy.
export function ManageIndianFancy() {
  const qc = useQueryClient()
  const [params] = useSearchParams()
  const matchId = Number(params.get('matchId') ?? 0)
  const matchName = params.get('matchName') ?? `Match ${matchId}`
  const [open, setOpen] = useState(false)

  const { data: fancies = [] } = useQuery({
    queryKey: ['indian-fancy', matchId],
    queryFn: () => listFancy(matchId).then((r) => r ?? []),
    enabled: matchId > 0,
    refetchInterval: 4000, // doc: list auto-refreshes
  })

  const activate = useMutation({
    mutationFn: (id: number) => updateFancyStatus(id, 'ACTIVE'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['indian-fancy', matchId] }),
  })

  return (
    <Box>
      <Breadcrumbs sx={{ mb: 1 }}>
        <Link to="/super-duper-admin/live-matches">Matches</Link>
        <Typography color="text.primary">{matchName}</Typography>
      </Breadcrumbs>
      <Stack direction="row" alignItems="center" sx={{ mb: 1 }}>
        <Typography variant="h5" sx={{ flexGrow: 1 }}>Manage Indian Fancy</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}>Add Fancy</Button>
      </Stack>
      <Card>
        <CardContent>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>Runner Name</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Activate</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {fancies.filter((f) => !f.result).map((f: Fancy, i: number) => (
                <TableRow key={f.id} hover>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell>{f.headName}</TableCell>
                  <TableCell><Chip size="small" label={f.status} color={f.status === 'ACTIVE' ? 'success' : 'default'} /></TableCell>
                  <TableCell align="right">
                    {f.status === 'ACTIVE'
                      ? <Button size="small" disabled>Activated</Button>
                      : <Button size="small" variant="contained" onClick={() => activate.mutate(f.id)}>Activate</Button>}
                  </TableCell>
                </TableRow>
              ))}
              {fancies.length === 0 && <TableRow><TableCell colSpan={4} align="center">No fancy markets</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {open && <AddFancyDialog matchId={matchId} onClose={() => setOpen(false)}
        onDone={() => { setOpen(false); qc.invalidateQueries({ queryKey: ['indian-fancy', matchId] }) }} />}
    </Box>
  )
}

function AddFancyDialog(props: { matchId: number; onClose: () => void; onDone: () => void }) {
  const [headName, setHeadName] = useState('')
  const [selectionId, setSelectionId] = useState('')
  const mutation = useMutation({
    mutationFn: () => createFancy({ matchId: props.matchId, headName, selectionId }),
    onSuccess: props.onDone,
  })
  return (
    <Dialog open onClose={props.onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Add Fancy</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField label="Runner Name" value={headName} onChange={(e) => setHeadName(e.target.value)} />
          <TextField label="Selection ID (optional)" value={selectionId} onChange={(e) => setSelectionId(e.target.value)} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={props.onClose}>Cancel</Button>
        <Button variant="contained" disabled={mutation.isPending || !headName} onClick={() => mutation.mutate()}>Save</Button>
      </DialogActions>
    </Dialog>
  )
}
