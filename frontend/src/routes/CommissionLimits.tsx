import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Box, Breadcrumbs, Button, Card, CardContent, Dialog, DialogActions, DialogContent, DialogTitle,
  Grid, MenuItem, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography, CircularProgress,
} from '@mui/material'
import {
  listChildren, downlineBalanceOf, getSummary, updateProfileFields, type User,
} from '../lib/api'
import { TransactionDialog } from './ManageClients'
import { SportBlockDialog, SportLimitDialog, PokerBlockDialog } from '../components/RestrictionDialogs'

const money = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

// Doc §10 — Commission & Limits. Mirrors the reference commission-limit page:
// So · User Name · BM. Comm (rolling_commission) · SES. Comm (fancy_rolling_commission)
// · Balance · Down Bal · Action, plus a My/Down-line/Exposure summary.
export function CommissionLimits() {
  const qc = useQueryClient()
  const { data: rows = [] } = useQuery({ queryKey: ['children'], queryFn: () => listChildren().then((r) => r ?? []) })
  const { data: summary } = useQuery({ queryKey: ['summary'], queryFn: getSummary })

  const [status, setStatus] = useState<'all' | 'active' | 'inactive'>('all')
  const [search, setSearch] = useState('')
  const [txnTarget, setTxnTarget] = useState<{ user: User; type: 'deposit' | 'withdraw' } | null>(null)
  const [editTarget, setEditTarget] = useState<User | null>(null)
  const [sbTarget, setSbTarget] = useState<User | null>(null)
  const [slTarget, setSlTarget] = useState<User | null>(null)
  const [pbTarget, setPbTarget] = useState<User | null>(null)
  const [downBal, setDownBal] = useState<User | null>(null)

  const darkBtn = { bgcolor: '#1f2937', color: '#fff', minWidth: 40, '&:hover': { bgcolor: '#374151' } }

  const filtered = rows.filter((r) => {
    if (status === 'active' && (!r.status || r.userLock)) return false
    if (status === 'inactive' && r.status && !r.userLock) return false
    if (search) {
      const q = search.toLowerCase()
      if (!r.mstruserid.toLowerCase().includes(q) && !r.mstrname.toLowerCase().includes(q)) return false
    }
    return true
  })

  return (
    <Box>
      <Breadcrumbs sx={{ mb: 1 }}>
        <Link to="/super-duper-admin/home-dashboard">Dashboard</Link>
        <Typography color="text.primary">Commission &amp; Limits</Typography>
      </Breadcrumbs>
      <Typography variant="h5" gutterBottom>Commission &amp; Limits</Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
            <TextField select size="small" value={status} onChange={(e) => setStatus(e.target.value as typeof status)} sx={{ minWidth: 140 }}>
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">In Active</MenuItem>
            </TextField>
            <TextField size="small" placeholder="Search" value={search} onChange={(e) => setSearch(e.target.value)} />
          </Stack>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>So.</TableCell>
                <TableCell>User Name</TableCell>
                <TableCell align="right">BM. Comm</TableCell>
                <TableCell align="right">SES. Comm</TableCell>
                <TableCell align="right">Balance</TableCell>
                <TableCell align="center">Down Bal</TableCell>
                <TableCell>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((c, i) => (
                <TableRow key={c.id} hover sx={{ bgcolor: c.userLock ? '#fff5f5' : undefined }}>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell>
                    <Link to={`/super-duper-admin/user-dashboard?userId=${c.id}`}>{c.mstruserid} ( {c.mstrname} )</Link>
                  </TableCell>
                  <TableCell align="right">{money(c.rollingCommission)}</TableCell>
                  <TableCell align="right">{money(c.fancyRollingCommission)}</TableCell>
                  <TableCell align="right">{money(c.balance)}</TableCell>
                  <TableCell align="center">
                    <Button size="small" variant="contained" onClick={() => setDownBal(c)}>Down Bal</Button>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                      <Button size="small" variant="contained" color="success" onClick={() => setTxnTarget({ user: c, type: 'deposit' })}>D</Button>
                      <Button size="small" variant="contained" color="error" onClick={() => setTxnTarget({ user: c, type: 'withdraw' })}>W</Button>
                      <Button size="small" variant="contained" color="info" onClick={() => setEditTarget(c)}>Edit</Button>
                      <Button size="small" variant="contained" sx={darkBtn} onClick={() => setSbTarget(c)}>SB</Button>
                      <Button size="small" variant="contained" sx={darkBtn} onClick={() => setSlTarget(c)}>SL</Button>
                      <Button size="small" variant="contained" sx={darkBtn} onClick={() => setPbTarget(c)}>PB</Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && <TableRow><TableCell colSpan={7} align="center">No Data Available</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>Summary</Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>My Balance</TableCell>
                <TableCell>Down Line Balance</TableCell>
                <TableCell>Rs. Exposure</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell>{money(summary?.balance ?? 0)}</TableCell>
                <TableCell>{money(summary?.downlineBalance ?? 0)}</TableCell>
                <TableCell>{money(summary?.exposure ?? 0)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {downBal && <DownBalDialog user={downBal} onClose={() => setDownBal(null)} />}
      {txnTarget && (
        <TransactionDialog target={txnTarget} onClose={() => setTxnTarget(null)}
          onDone={() => { setTxnTarget(null); qc.invalidateQueries({ queryKey: ['children'] }); qc.invalidateQueries({ queryKey: ['summary'] }) }} />
      )}
      {editTarget && (
        <EditProfileDialog user={editTarget} onClose={() => setEditTarget(null)}
          onDone={() => { setEditTarget(null); qc.invalidateQueries({ queryKey: ['children'] }) }} />
      )}
      {sbTarget && <SportBlockDialog user={sbTarget} onClose={() => setSbTarget(null)} onDone={() => setSbTarget(null)} />}
      {slTarget && <SportLimitDialog user={slTarget} onClose={() => setSlTarget(null)} onDone={() => setSlTarget(null)} />}
      {pbTarget && <PokerBlockDialog user={pbTarget} onClose={() => setPbTarget(null)} onDone={() => setPbTarget(null)} />}
    </Box>
  )
}

// Down Bal popup — sums the selected user's direct downline balances (reference
// "Down Balance Of - <name> (<id>)").
// Edit button → profile-only popup: Name, User ID (unique, read-only),
// No. of User and Remark.
function EditProfileDialog(props: { user: User; onClose: () => void; onDone: () => void }) {
  const u = props.user
  const [name, setName] = useState(u.mstrname)
  const [noOfChild, setNoOfChild] = useState(u.createNoOfChild)
  const [remark, setRemark] = useState(u.remarks ?? '')
  const mutation = useMutation({
    mutationFn: () => updateProfileFields(u.id, { name, noOfChild, remark }),
    onSuccess: props.onDone,
  })
  return (
    <Dialog open onClose={props.onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Profile — {u.mstruserid}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 0 }}>
          <Grid item xs={12} sm={6}><TextField fullWidth required label="Name" value={name} onChange={(e) => setName(e.target.value)} /></Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth label="User ID" value={u.mstruserid} disabled /></Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth type="number" label="No. of User" value={noOfChild} onChange={(e) => setNoOfChild(Number(e.target.value))} inputProps={{ min: 0 }} /></Grid>
          <Grid item xs={12}><TextField fullWidth multiline minRows={2} label="Remark" value={remark} onChange={(e) => setRemark(e.target.value)} /></Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={props.onClose}>Cancel</Button>
        <Button variant="contained" disabled={mutation.isPending || !name} onClick={() => mutation.mutate()}>Update</Button>
      </DialogActions>
    </Dialog>
  )
}

function DownBalDialog(props: { user: User; onClose: () => void }) {
  // Full-subtree downline balance (all descendants, any depth) — server-computed.
  const { data, isLoading } = useQuery({
    queryKey: ['downline-balance', props.user.id], queryFn: () => downlineBalanceOf(props.user.id),
  })
  const total = data?.downlineBalance ?? 0
  return (
    <Dialog open onClose={props.onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Down Balance Of — {props.user.mstrname} ( {props.user.mstruserid} )</DialogTitle>
      <DialogContent sx={{ textAlign: 'center', py: 3 }}>
        {isLoading
          ? <CircularProgress />
          : <Typography variant="h4" sx={{ color: total < 0 ? '#cf222e' : '#1a7f37' }}>{money(total)}</Typography>}
      </DialogContent>
      <DialogActions>
        <Button onClick={props.onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  )
}
