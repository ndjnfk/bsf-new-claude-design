import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Button, Card, CardContent, Stack, TextField, Typography, Alert } from '@mui/material'
import { login } from '../lib/api'
import { useAuth } from '../store/auth'

export function Login() {
  const navigate = useNavigate()
  const setSession = useAuth((s) => s.setSession)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const res = await login(username, password)
      setSession(res.token, res.user, res.isHelper, res.permissions)
      navigate('/super-duper-admin/home-dashboard')
    } catch (err: unknown) {
      setError(getMessage(err) ?? 'Login failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: { xs: 2, sm: 3 },
        p: 2,
      }}
    >
      <Typography
        component="h1"
        sx={{
          fontWeight: 800,
          color: 'primary.main',
          letterSpacing: { xs: 2, md: 6 },
          lineHeight: 1,
          fontSize: { xs: '4rem', sm: '6rem', md: '8rem' },
          userSelect: 'none',
        }}
      >
        BSF
      </Typography>
      <Card sx={{ width: '100%', maxWidth: 400 }} elevation={4}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Sign In</Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Management Panel
          </Typography>
          <form onSubmit={submit}>
            <Stack spacing={2} sx={{ mt: 2 }}>
              {error && <Alert severity="error">{error}</Alert>}
              <TextField
                label="Username" value={username} autoFocus
                onChange={(e) => setUsername(e.target.value)}
              />
              <TextField
                label="Password" type="password" value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Button type="submit" variant="contained" disabled={busy || !username || !password}>
                {busy ? 'Signing in…' : 'Sign In'}
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
    const r = (err as { response?: { data?: { error?: string } } }).response
    return r?.data?.error
  }
  return undefined
}
