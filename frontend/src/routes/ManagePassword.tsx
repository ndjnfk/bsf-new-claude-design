import { useState, type FormEvent } from 'react'
import { Box, Button, Card, CardContent, Stack, TextField, Typography, Alert } from '@mui/material'
import { changePassword } from '../lib/api'

// Doc §11 — Manage Password: change the logged-in user's own password.
export function ManagePassword() {
  const [oldPass, setOld] = useState('')
  const [newPass, setNew] = useState('')
  const [confirm, setConfirm] = useState('')
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (newPass !== confirm) {
      setMsg({ type: 'error', text: 'New and confirm password do not match' })
      return
    }
    setBusy(true)
    setMsg(null)
    try {
      await changePassword(oldPass, newPass)
      setMsg({ type: 'success', text: 'Password changed successfully' })
      setOld(''); setNew(''); setConfirm('')
    } catch (err: unknown) {
      setMsg({ type: 'error', text: getMessage(err) ?? 'Failed to change password' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Change Password</Typography>
      <Card sx={{ maxWidth: 460 }}>
        <CardContent>
          <form onSubmit={submit}>
            <Stack spacing={2}>
              {msg && <Alert severity={msg.type}>{msg.text}</Alert>}
              <TextField label="Old Password" type="password" value={oldPass} onChange={(e) => setOld(e.target.value)} />
              <TextField label="New Password" type="password" value={newPass} onChange={(e) => setNew(e.target.value)} />
              <TextField label="Confirm Password" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
              <Button type="submit" variant="contained" disabled={busy || !oldPass || !newPass || !confirm}>
                {busy ? 'Saving…' : 'Save Changes'}
              </Button>
            </Stack>
          </form>
        </CardContent>
      </Card>
    </Box>
  )
}

function getMessage(err: unknown): string | undefined {
  if (typeof err === 'object' && err && 'response' in err) {
    return (err as { response?: { data?: { error?: string } } }).response?.data?.error
  }
  return undefined
}
