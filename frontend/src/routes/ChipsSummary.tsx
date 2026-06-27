import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Box, Button, Card, CardContent, Dialog, DialogActions, DialogContent, DialogTitle, Grid,
  Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography,
} from '@mui/material'
import { collectionReport, createSettlement, type CollectionUser } from '../lib/api'

// Doc §16 — Chips Summary: Give (plus) / Take (minus) with part-settlement (P/S).
export function ChipsSummary() {
  const qc = useQueryClient()
  const { data } = useQuery({ queryKey: ['collection-report'], queryFn: collectionReport })
  const [target, setTarget] = useState<CollectionUser | null>(null)

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Chips Summary</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Side title="( + ) Give" rows={data?.plusUsers ?? []} onSettle={setTarget} />
        </Grid>
        <Grid item xs={12} md={6}>
          <Side title="( - ) Take" rows={data?.minusUsers ?? []} onSettle={setTarget} />
        </Grid>
      </Grid>

      {target && (
        <SettleDialog user={target} onClose={() => setTarget(null)}
          onDone={() => { setTarget(null); qc.invalidateQueries({ queryKey: ['collection-report'] }) }} />
      )}
    </Box>
  )
}

function Side({ title, rows, onSettle }: { title: string; rows: CollectionUser[]; onSettle: (u: CollectionUser) => void }) {
  const total = rows.reduce((s, r) => s + r.balance, 0)
  return (
    <Card>
      <CardContent>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>{title}</Typography>
        <Table size="small">
          <TableHead><TableRow><TableCell>Name</TableCell><TableCell align="right">Balance</TableCell><TableCell align="right">Action</TableCell></TableRow></TableHead>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id} hover>
                <TableCell>{r.username}</TableCell>
                <TableCell align="right">{r.balance.toFixed(2)}</TableCell>
                <TableCell align="right"><Button size="small" onClick={() => onSettle(r)}>P/S</Button></TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && <TableRow><TableCell colSpan={3} align="center">No data</TableCell></TableRow>}
            {rows.length > 0 && (
              <TableRow><TableCell><b>Total</b></TableCell><TableCell align="right"><b>{total.toFixed(2)}</b></TableCell><TableCell /></TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

function SettleDialog(props: { user: CollectionUser; onClose: () => void; onDone: () => void }) {
  const [amount, setAmount] = useState(Math.abs(props.user.balance))
  const [remark, setRemark] = useState('')
  const mutation = useMutation({
    mutationFn: () => createSettlement({ childId: props.user.id, amount, remark }),
    onSuccess: props.onDone,
  })
  return (
    <Dialog open onClose={props.onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Part Settlement — {props.user.username}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField label="Current Balance" value={props.user.balance.toFixed(2)} disabled />
          <TextField label="Amount" type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
          <TextField label="Remark" value={remark} onChange={(e) => setRemark(e.target.value)} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={props.onClose}>Cancel</Button>
        <Button variant="contained" disabled={mutation.isPending || amount === 0} onClick={() => mutation.mutate()}>Save</Button>
      </DialogActions>
    </Dialog>
  )
}
