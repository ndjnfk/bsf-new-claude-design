import { useQuery } from '@tanstack/react-query'
import {
  Box, Card, CardContent, Table, TableBody, TableCell, TableHead, TableRow, Typography,
  CircularProgress, Chip,
} from '@mui/material'
import { listCompletedMatches, type Match } from '../lib/api'

// Doc §6 — Completed Matches: matches that have been settled.
export function CompletedMatches() {
  const { data: matches = [], isLoading } = useQuery({
    queryKey: ['completed-matches'],
    queryFn: () => listCompletedMatches().then((r) => r ?? []),
  })

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Completed Matches</Typography>
      <Card>
        <CardContent>
          {isLoading ? (
            <Box sx={{ display: 'grid', placeItems: 'center', height: 120 }}><CircularProgress /></Box>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Match Id</TableCell>
                  <TableCell>Match Title</TableCell>
                  <TableCell>Date/Time</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {matches.map((m: Match) => (
                  <TableRow key={m.id} hover>
                    <TableCell>{m.id}</TableCell>
                    <TableCell>{m.name}</TableCell>
                    <TableCell>{new Date(m.startTime).toLocaleString()}</TableCell>
                    <TableCell><Chip size="small" label={m.status} color="default" /></TableCell>
                  </TableRow>
                ))}
                {matches.length === 0 && (
                  <TableRow><TableCell colSpan={4} align="center">No completed matches yet</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}
