import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import {
  Box, Button, Card, CardContent, Stack, Table, TableBody, TableCell, TableHead, TableRow,
  TextField, Typography, Alert,
} from '@mui/material'
import { getParents, type ParentInfo } from '../lib/api'

// Doc §12 — Search Logs User: look up a user's parent hierarchy.
export function SearchLogsUser() {
  const [username, setUsername] = useState('')
  const [chain, setChain] = useState<ParentInfo[]>([])
  const [error, setError] = useState('')

  const search = useMutation({
    mutationFn: () => getParents(username),
    onSuccess: (data) => { setChain(data ?? []); setError('') },
    onError: () => { setChain([]); setError("User doesn't exist") },
  })

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Search User</Typography>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center">
            <TextField size="small" label="Enter User Id" value={username} onChange={(e) => setUsername(e.target.value)} />
            <Button variant="contained" disabled={!username || search.isPending} onClick={() => search.mutate()}>
              Submit
            </Button>
          </Stack>
          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        </CardContent>
      </Card>

      {chain.length > 0 && (
        <Card>
          <CardContent>
            <Stack direction="row" alignItems="center" sx={{ mb: 1 }}>
              <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>Search User Details (hierarchy)</Typography>
              <Button variant="outlined" size="small" component={Link}
                to={`/super-duper-admin/logs-user-details?userId=${chain[0].userId}&username=${encodeURIComponent(chain[0].username)}`}>
                User Logs Statement
              </Button>
            </Stack>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Role</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell align="right">Share %</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {chain.map((p, i) => (
                  <TableRow key={i} hover>
                    <TableCell>{p.role}</TableCell>
                    <TableCell>{p.username}</TableCell>
                    <TableCell>{p.name}</TableCell>
                    <TableCell align="right">{p.share}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </Box>
  )
}
