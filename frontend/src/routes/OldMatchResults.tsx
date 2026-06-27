import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Box, Card, CardContent, Stack, Table, TableBody, TableCell, TableHead, TableRow,
  TextField, Typography,
} from '@mui/material'
import { listCompletedMatches, type Match } from '../lib/api'

// Doc §25 — Old Match Results: settled matches with a name filter.
export function OldMatchResults() {
  const [search, setSearch] = useState('')
  const { data: matches = [] } = useQuery({
    queryKey: ['settled-matches'],
    queryFn: () => listCompletedMatches().then((r) => r ?? []),
  })
  const filtered = matches.filter((m) => m.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Settled Matches</Typography>
      <Card>
        <CardContent>
          <Stack direction="row" sx={{ mb: 2 }}>
            <TextField size="small" label="Match Name" value={search} onChange={(e) => setSearch(e.target.value)} />
          </Stack>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>Match</TableCell>
                <TableCell>Open Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((m: Match, i: number) => (
                <TableRow key={m.id} hover>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell>{m.name}</TableCell>
                  <TableCell>{new Date(m.startTime).toLocaleString()}</TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && <TableRow><TableCell colSpan={3} align="center">There is no data available.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Box>
  )
}
