import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Box, Button, Card, CardContent, Dialog, DialogActions, DialogContent, DialogTitle,
  IconButton, MenuItem, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField,
  Typography, Alert,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import {
  listSettlements, createSettlement, deleteSettlement, listCompanies,
  type Settlement, type User,
} from '../lib/api'

// Doc §26 — Settlements: parent↔child settlement entries.
export function Settlements() {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const { data: rows = [] } = useQuery({ queryKey: ['settlements'], queryFn: () => listSettlements().then((r) => r ?? []) })

  const remove = useMutation({
    mutationFn: (id: number) => deleteSettlement(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settlements'] }),
  })

  return (
    <Box>
      <Stack direction="row" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ flexGrow: 1 }}>Settlement Entries</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}>New Entry</Button>
      </Stack>
      <Card>
        <CardContent>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>Parent</TableCell>
                <TableCell>Child</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell>Remark</TableCell>
                <TableCell>Date</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((s: Settlement, i: number) => (
                <TableRow key={s.id} hover>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell>{s.parentUser}</TableCell>
                  <TableCell>{s.childUser}</TableCell>
                  <TableCell align="right">{s.amount.toFixed(2)}</TableCell>
                  <TableCell>{s.remark ?? '—'}</TableCell>
                  <TableCell>{new Date(s.onDate).toLocaleString()}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" color="error" onClick={() => remove.mutate(s.id)}><DeleteIcon fontSize="small" /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && <TableRow><TableCell colSpan={7} align="center">No entries</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {open && <SettlementDialog onClose={() => setOpen(false)}
        onDone={() => { setOpen(false); qc.invalidateQueries({ queryKey: ['settlements'] }) }} />}
    </Box>
  )
}

function SettlementDialog(props: { onClose: () => void; onDone: () => void }) {
  const { data: companies = [] } = useQuery({ queryKey: ['companies'], queryFn: () => listCompanies().then((r) => r ?? []) })
  const [childId, setChildId] = useState<number | ''>('')
  const [amount, setAmount] = useState(0)
  const [remark, setRemark] = useState('')
  const [error, setError] = useState('')

  const mutation = useMutation({
    mutationFn: () => createSettlement({ childId: Number(childId), amount, remark }),
    onSuccess: props.onDone,
    onError: (err: unknown) => setError(getMessage(err) ?? 'Failed to create'),
  })

  return (
    <Dialog open onClose={props.onClose} maxWidth="xs" fullWidth>
      <DialogTitle>New Settlement Entry</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField select label="Child (Company)" value={childId} onChange={(e) => setChildId(Number(e.target.value))}>
            {companies.map((c: User) => <MenuItem key={c.id} value={c.id}>{c.mstruserid} ({c.mstrname})</MenuItem>)}
          </TextField>
          <TextField label="Amount" type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
          <TextField label="Remark" value={remark} onChange={(e) => setRemark(e.target.value)} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={props.onClose}>Cancel</Button>
        <Button variant="contained" disabled={mutation.isPending || !childId || amount === 0}
          onClick={() => { setError(''); mutation.mutate() }}>
          {mutation.isPending ? 'Saving…' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

function getMessage(err: unknown): string | undefined {
  if (typeof err === 'object' && err && 'response' in err) {
    return (err as { response?: { data?: { error?: string } } }).response?.data?.error
  }
  return undefined
}
