import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Box, Button, Card, CardContent, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle,
  FormControlLabel, FormGroup, IconButton, Stack, Table, TableBody, TableCell, TableHead,
  TableRow, TextField, Typography, Chip, Alert,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import KeyIcon from '@mui/icons-material/Key'
import {
  listHelpers, createHelper, deleteHelper, updateHelper, resetHelperPassword, type Helper,
} from '../lib/api'

const PERMISSIONS = [
  'Fancy Activation', 'Fancy Result Declare', 'Match On and Off',
  'User Password Change', 'Match Result Declare', 'Active Matches and Manage Series',
]

// Doc §24 — Add Worker: helper accounts with a permission set.
export function AddWorker() {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Helper | null>(null)
  const [pwdTarget, setPwdTarget] = useState<Helper | null>(null)
  const { data: helpers = [] } = useQuery({ queryKey: ['helpers'], queryFn: () => listHelpers().then((r) => r ?? []) })

  const remove = useMutation({
    mutationFn: (id: number) => deleteHelper(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['helpers'] }),
  })

  return (
    <Box>
      <Stack direction="row" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ flexGrow: 1 }}>Helper</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}>Add New</Button>
      </Stack>
      <Card>
        <CardContent>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>User Name</TableCell>
                <TableCell>Permissions</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {helpers.map((h: Helper) => (
                <TableRow key={h.id} hover>
                  <TableCell>{h.mstrname}</TableCell>
                  <TableCell>{h.mstruserid}</TableCell>
                  <TableCell>
                    {h.permissions.length === 0 ? '—' : h.permissions.map((p) => <Chip key={p} size="small" label={p} sx={{ mr: 0.5, mb: 0.5 }} />)}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => setEditTarget(h)}><EditIcon fontSize="small" /></IconButton>
                    <IconButton size="small" onClick={() => setPwdTarget(h)}><KeyIcon fontSize="small" /></IconButton>
                    <IconButton size="small" color="error" onClick={() => remove.mutate(h.id)}><DeleteIcon fontSize="small" /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {helpers.length === 0 && <TableRow><TableCell colSpan={4} align="center">No helpers</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {open && <HelperDialog onClose={() => setOpen(false)}
        onDone={() => { setOpen(false); qc.invalidateQueries({ queryKey: ['helpers'] }) }} />}
      {editTarget && <EditHelperDialog helper={editTarget} onClose={() => setEditTarget(null)}
        onDone={() => { setEditTarget(null); qc.invalidateQueries({ queryKey: ['helpers'] }) }} />}
      {pwdTarget && <PasswordDialog helper={pwdTarget} onClose={() => setPwdTarget(null)}
        onDone={() => setPwdTarget(null)} />}
    </Box>
  )
}

function EditHelperDialog(props: { helper: Helper; onClose: () => void; onDone: () => void }) {
  const [name, setName] = useState(props.helper.mstrname)
  const [perms, setPerms] = useState<string[]>(props.helper.permissions)
  const toggle = (p: string) => setPerms((cur) => (cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p]))
  const mutation = useMutation({
    mutationFn: () => updateHelper(props.helper.id, { name, permissions: perms }),
    onSuccess: props.onDone,
  })
  return (
    <Dialog open onClose={props.onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit {props.helper.mstruserid}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <Typography variant="subtitle2">Permissions</Typography>
          <FormGroup>
            {PERMISSIONS.map((p) => (
              <FormControlLabel key={p} control={<Checkbox checked={perms.includes(p)} onChange={() => toggle(p)} />} label={p} />
            ))}
          </FormGroup>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={props.onClose}>Cancel</Button>
        <Button variant="contained" disabled={mutation.isPending} onClick={() => mutation.mutate()}>Save</Button>
      </DialogActions>
    </Dialog>
  )
}

function PasswordDialog(props: { helper: Helper; onClose: () => void; onDone: () => void }) {
  const [password, setPassword] = useState('')
  const mutation = useMutation({
    mutationFn: () => resetHelperPassword(props.helper.id, password),
    onSuccess: props.onDone,
  })
  return (
    <Dialog open onClose={props.onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Change Password — {props.helper.mstruserid}</DialogTitle>
      <DialogContent>
        <TextField fullWidth type="password" label="New Password" value={password}
          onChange={(e) => setPassword(e.target.value)} sx={{ mt: 1 }} />
      </DialogContent>
      <DialogActions>
        <Button onClick={props.onClose}>Cancel</Button>
        <Button variant="contained" disabled={mutation.isPending || password.length < 4} onClick={() => mutation.mutate()}>Save</Button>
      </DialogActions>
    </Dialog>
  )
}

function HelperDialog(props: { onClose: () => void; onDone: () => void }) {
  const [name, setName] = useState('')
  const [userId, setUserId] = useState('')
  const [password, setPassword] = useState('')
  const [perms, setPerms] = useState<string[]>([])
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [error, setError] = useState('')

  const toggle = (p: string) =>
    setPerms((cur) => (cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p]))

  const mutation = useMutation({
    mutationFn: () => createHelper({ name, userId, password, permissions: perms, question, answer }),
    onSuccess: props.onDone,
    onError: (err: unknown) => setError(getMessage(err) ?? 'Failed to create helper'),
  })

  return (
    <Dialog open onClose={props.onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create Helper</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <TextField label="User ID" value={userId} onChange={(e) => setUserId(e.target.value)} />
          <TextField label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <Typography variant="subtitle2">Select Permissions</Typography>
          <FormGroup>
            {PERMISSIONS.map((p) => (
              <FormControlLabel key={p} control={<Checkbox checked={perms.includes(p)} onChange={() => toggle(p)} />} label={p} />
            ))}
          </FormGroup>
          <TextField label="Security Question" value={question} onChange={(e) => setQuestion(e.target.value)} />
          <TextField label="Answer" value={answer} onChange={(e) => setAnswer(e.target.value)} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={props.onClose}>Cancel</Button>
        <Button variant="contained" disabled={mutation.isPending || !userId || !password}
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
