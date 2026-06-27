import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Box, Button, Card, CardContent, Dialog, DialogActions, DialogContent, DialogTitle,
  MenuItem, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography,
} from '@mui/material'
import { listCompanies, walletStatement, walletTransaction, type User, type WalletRow } from '../lib/api'

// Doc §21 — Deduct Dealer: add (Chips IN) or deduct (Chips Out) and view history.
export function DeductDealer() {
  const qc = useQueryClient()
  const [userId, setUserId] = useState<number | ''>('')
  const [open, setOpen] = useState(false)

  const { data: companies = [] } = useQuery({ queryKey: ['companies'], queryFn: () => listCompanies().then((r) => r ?? []) })
  const { data: history = [] } = useQuery({
    queryKey: ['wallet-statement', userId],
    queryFn: () => (userId ? walletStatement(Number(userId)) : Promise.resolve([])).then((r) => r ?? []),
    enabled: !!userId,
  })

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Deduct Dealer</Typography>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center">
            <TextField select size="small" label="Select User" value={userId} sx={{ minWidth: 260 }}
              onChange={(e) => setUserId(Number(e.target.value))}>
              {companies.map((c: User) => <MenuItem key={c.id} value={c.id}>{c.mstruserid} ({c.mstrname})</MenuItem>)}
            </TextField>
            <Button variant="contained" disabled={!userId} onClick={() => setOpen(true)}>Chips IN / OUT</Button>
          </Stack>
        </CardContent>
      </Card>

      {!!userId && (
        <Card>
          <CardContent>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>History</Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Narration</TableCell>
                  <TableCell align="right">Credit</TableCell>
                  <TableCell align="right">Debit</TableCell>
                  <TableCell align="right">Balance</TableCell>
                  <TableCell>Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {history.map((r: WalletRow, i: number) => (
                  <TableRow key={r.id} hover>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell>{r.narration}</TableCell>
                    <TableCell align="right" sx={{ color: '#1a7f37' }}>{r.credit ? r.credit.toFixed(2) : ''}</TableCell>
                    <TableCell align="right" sx={{ color: '#cf222e' }}>{r.debit ? r.debit.toFixed(2) : ''}</TableCell>
                    <TableCell align="right">{r.balanceAfter.toFixed(2)}</TableCell>
                    <TableCell>{new Date(r.createdAt).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
                {history.length === 0 && <TableRow><TableCell colSpan={6} align="center">No history</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {open && !!userId && (
        <ChipsDialog userId={Number(userId)} onClose={() => setOpen(false)}
          onDone={() => { setOpen(false); qc.invalidateQueries({ queryKey: ['wallet-statement'] }); qc.invalidateQueries({ queryKey: ['companies'] }) }} />
      )}
    </Box>
  )
}

function ChipsDialog(props: { userId: number; onClose: () => void; onDone: () => void }) {
  const [amount, setAmount] = useState(0)
  const [remark, setRemark] = useState('')
  const inMut = useMutation({ mutationFn: () => walletTransaction({ userId: props.userId, amount, type: 'deposit', remark }), onSuccess: props.onDone })
  const outMut = useMutation({ mutationFn: () => walletTransaction({ userId: props.userId, amount, type: 'withdraw', remark }), onSuccess: props.onDone })

  return (
    <Dialog open onClose={props.onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Chips IN / OUT</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField label="Enter Amount" type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
          <TextField label="Remark" value={remark} onChange={(e) => setRemark(e.target.value)} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={props.onClose}>Cancel</Button>
        <Button color="success" variant="contained" disabled={amount <= 0 || inMut.isPending} onClick={() => inMut.mutate()}>Chips IN</Button>
        <Button color="error" variant="contained" disabled={amount <= 0 || outMut.isPending} onClick={() => outMut.mutate()}>Chips Out</Button>
      </DialogActions>
    </Dialog>
  )
}
