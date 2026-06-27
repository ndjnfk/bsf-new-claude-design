import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Box, Button, Card, CardContent, Dialog, DialogActions, DialogContent, DialogTitle,
  MenuItem, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography,
  Chip, Select,
} from '@mui/material'
import { listRequests, createRequest, updateRequestStatus, type BankRequest } from '../lib/api'

// Doc §20 — Agent Bank DP/WD. One component, mode from the route :type param.
export function AgentBank() {
  const { type } = useParams<{ type: string }>()
  const isWithdraw = type === 'withdraw'
  const reqType = isWithdraw ? 2 : 1
  const title = isWithdraw ? 'Withdraw' : 'Deposit'

  const qc = useQueryClient()
  const [status, setStatus] = useState('')
  const [target, setTarget] = useState<BankRequest | null>(null)

  const { data: rows = [] } = useQuery({
    queryKey: ['requests', reqType, status],
    queryFn: () => listRequests({ type: reqType, status: status || undefined }).then((r) => r ?? []),
  })

  const seed = useMutation({
    mutationFn: () => createRequest({ reqType, amount: 5000, method: 'Normal', accountName: 'Sample', accountNumber: 'XXXX1234', ifsc: 'HDFC0001' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['requests'] }),
  })

  const statuses = isWithdraw
    ? ['', 'PENDING', 'HOLD', 'COMPLETE', 'REJECT']
    : ['', 'PENDING', 'COMPLETE', 'REJECT']

  return (
    <Box>
      <Stack direction="row" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ flexGrow: 1 }}>{title} Requests</Typography>
        <Button size="small" onClick={() => seed.mutate()}>+ Raise sample {title.toLowerCase()}</Button>
      </Stack>
      <Card>
        <CardContent>
          <Stack direction="row" sx={{ mb: 2 }}>
            <TextField select size="small" label="Status" value={status} sx={{ minWidth: 160 }}
              onChange={(e) => setStatus(e.target.value)}>
              {statuses.map((s) => <MenuItem key={s} value={s}>{s === '' ? 'All' : s}</MenuItem>)}
            </TextField>
          </Stack>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Username</TableCell>
                <TableCell>Method</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell>Account</TableCell>
                <TableCell>UTR</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((r: BankRequest) => (
                <TableRow key={r.id} hover>
                  <TableCell>{r.username}</TableCell>
                  <TableCell>{r.method ?? '—'}</TableCell>
                  <TableCell align="right">{r.amount.toFixed(2)}</TableCell>
                  <TableCell>{r.accountNumber ?? '—'}</TableCell>
                  <TableCell>{r.utr ?? '—'}</TableCell>
                  <TableCell>{new Date(r.createdAt).toLocaleString()}</TableCell>
                  <TableCell><Chip size="small" label={r.status} color={statusColor(r.status)} /></TableCell>
                  <TableCell align="right">
                    {(r.status === 'PENDING' || r.status === 'HOLD') && (
                      <Button size="small" variant="outlined" onClick={() => setTarget(r)}>Edit</Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && <TableRow><TableCell colSpan={8} align="center">No requests</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {target && (
        <StatusDialog request={target} allowHold={isWithdraw} onClose={() => setTarget(null)}
          onDone={() => { setTarget(null); qc.invalidateQueries({ queryKey: ['requests'] }) }} />
      )}
    </Box>
  )
}

function StatusDialog(props: { request: BankRequest; allowHold: boolean; onClose: () => void; onDone: () => void }) {
  const [status, setStatus] = useState('COMPLETE')
  const [amount, setAmount] = useState(props.request.amount)
  const [utr, setUtr] = useState('')
  const [remark, setRemark] = useState('')

  const options = props.allowHold ? ['COMPLETE', 'REJECT', 'HOLD'] : ['COMPLETE', 'REJECT']
  const mutation = useMutation({
    mutationFn: () => updateRequestStatus(props.request.id, { status, amount, utr, remark }),
    onSuccess: props.onDone,
  })

  return (
    <Dialog open onClose={props.onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Change Status — {props.request.username}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Select size="small" value={status} onChange={(e) => setStatus(e.target.value)}>
            {options.map((o) => <MenuItem key={o} value={o}>{o}</MenuItem>)}
          </Select>
          {status === 'COMPLETE' && (
            <>
              <TextField label="Amount" type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
              <TextField label="Transaction Id (UTR)" value={utr} onChange={(e) => setUtr(e.target.value)} />
            </>
          )}
          <TextField label="Remark" value={remark} onChange={(e) => setRemark(e.target.value)} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={props.onClose}>Cancel</Button>
        <Button variant="contained" disabled={mutation.isPending} onClick={() => mutation.mutate()}>Submit</Button>
      </DialogActions>
    </Dialog>
  )
}

function statusColor(s: string): 'default' | 'success' | 'error' | 'warning' {
  if (s === 'COMPLETE') return 'success'
  if (s === 'REJECT') return 'error'
  if (s === 'HOLD') return 'warning'
  return 'default'
}
