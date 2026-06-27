import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Box, Button, Card, CardContent, Dialog, DialogActions, DialogContent, DialogTitle,
  FormControlLabel, Stack, Switch, Table, TableBody, TableCell, TableHead, TableRow,
  Typography, Chip,
} from '@mui/material'
import { listBlocked, setLocks, type User } from '../lib/api'

// Doc §9 — Manage Clients → Blocked Clients: locked users with unlock/edit.
export function BlockedClients() {
  const qc = useQueryClient()
  const [editTarget, setEditTarget] = useState<User | null>(null)
  const { data: users = [] } = useQuery({ queryKey: ['blocked'], queryFn: () => listBlocked().then((r) => r ?? []) })

  const unlock = useMutation({
    mutationFn: (id: number) => setLocks(id, { userLock: false, betLock: false }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['blocked'] }),
  })

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Blocked Users</Typography>
      <Card>
        <CardContent>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>User Name</TableCell>
                <TableCell>Match Comm.</TableCell>
                <TableCell>Ssn Comm.</TableCell>
                <TableCell>Lock</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((u: User) => (
                <TableRow key={u.id} hover>
                  <TableCell>{u.mstruserid}</TableCell>
                  <TableCell>{u.mstrname}</TableCell>
                  <TableCell>{u.commission}</TableCell>
                  <TableCell>{u.sessionComm}</TableCell>
                  <TableCell>
                    {u.userLock && <Chip size="small" color="error" label="Account" sx={{ mr: 0.5 }} />}
                    {u.betLock && <Chip size="small" color="warning" label="Bets" />}
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                      <Button size="small" variant="outlined" onClick={() => setEditTarget(u)}>Edit</Button>
                      <Button size="small" variant="outlined" color="success" onClick={() => unlock.mutate(u.id)}>Unlock</Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
              {users.length === 0 && <TableRow><TableCell colSpan={6} align="center">No blocked users</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {editTarget && (
        <EditBlockedDialog user={editTarget} onClose={() => setEditTarget(null)}
          onDone={() => { setEditTarget(null); qc.invalidateQueries({ queryKey: ['blocked'] }) }} />
      )}
    </Box>
  )
}

// Doc §"Edit Blocked Client" — toggle Agent Blocked (account) / Bets Blocked.
function EditBlockedDialog(props: { user: User; onClose: () => void; onDone: () => void }) {
  const [userLock, setUserLock] = useState(props.user.userLock)
  const [betLock, setBetLock] = useState(props.user.betLock)
  const mutation = useMutation({
    mutationFn: () => setLocks(props.user.id, { userLock, betLock }),
    onSuccess: props.onDone,
  })
  return (
    <Dialog open onClose={props.onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Edit — {props.user.mstruserid}</DialogTitle>
      <DialogContent>
        <Stack sx={{ mt: 1 }}>
          <FormControlLabel
            control={<Switch checked={userLock} onChange={(_, v) => setUserLock(v)} />}
            label="Agent Blocked (account lock)"
          />
          <FormControlLabel
            control={<Switch checked={betLock} onChange={(_, v) => setBetLock(v)} />}
            label="Bets Blocked (betting lock)"
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={props.onClose}>Cancel</Button>
        <Button variant="contained" disabled={mutation.isPending} onClick={() => mutation.mutate()}>Save Changes</Button>
      </DialogActions>
    </Dialog>
  )
}
