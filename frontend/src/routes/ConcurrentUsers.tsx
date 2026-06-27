import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import {
  Box, Button, Card, CardContent, Grid, Stack, Table, TableBody, TableCell, TableHead,
  TableRow, TextField, Typography,
} from '@mui/material'
import { countPerUser, type CountPerUser } from '../lib/api'

// Doc §31 — Concurrent Users: per-user bet counts on a market.
export function ConcurrentUsers() {
  const [marketId, setMarketId] = useState('')
  const [data, setData] = useState<CountPerUser | null>(null)

  const search = useMutation({
    mutationFn: () => countPerUser(marketId),
    onSuccess: (d) => setData(d),
  })

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Concurrent Users</Typography>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center">
            <TextField size="small" label="Market ID" value={marketId} onChange={(e) => setMarketId(e.target.value)} />
            <Button variant="contained" disabled={!marketId || search.isPending} onClick={() => search.mutate()}>
              Get Users
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {data && (
        <>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6} sm={3}>
              <Card><CardContent>
                <Typography variant="caption" color="text.secondary">Total Users</Typography>
                <Typography variant="h5">{data.totalUsers}</Typography>
              </CardContent></Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card><CardContent>
                <Typography variant="caption" color="text.secondary">Total Bets</Typography>
                <Typography variant="h5">{data.totalBets}</Typography>
              </CardContent></Card>
            </Grid>
          </Grid>
          <Card>
            <CardContent>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>S.No</TableCell>
                    <TableCell>User ID</TableCell>
                    <TableCell align="right">Total Bets</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.users.map((u, i) => (
                    <TableRow key={u.userId} hover>
                      <TableCell>{i + 1}</TableCell>
                      <TableCell>{u.userId}</TableCell>
                      <TableCell align="right">{u.bets}</TableCell>
                    </TableRow>
                  ))}
                  {data.users.length === 0 && <TableRow><TableCell colSpan={3} align="center">No bets on this market</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </Box>
  )
}
