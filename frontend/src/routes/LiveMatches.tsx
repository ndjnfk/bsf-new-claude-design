import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Box, Card, CardContent, Switch, Tab, Tabs, Table, TableBody, TableCell, TableHead,
  TableRow, Typography, CircularProgress, Chip,
} from '@mui/material'
import { listSports, listMatches, blockMatch, type Match } from '../lib/api'
import { useRoom } from '../hooks/useRoom'

// Doc §3 — Live Matches: sport-wise match list with per-match block + live refresh.
export function LiveMatches() {
  const qc = useQueryClient()
  const [sportId, setSportId] = useState<number>(4) // default Cricket

  const { data: sports = [] } = useQuery({ queryKey: ['sports'], queryFn: () => listSports().then((r) => r ?? []) })
  const { data: matches = [], isLoading } = useQuery({
    queryKey: ['matches', sportId],
    queryFn: () => listMatches(sportId).then((r) => r ?? []),
  })

  // Live: refresh the list when the admin dashboard room emits an update.
  useRoom('DASHBOARD_UPDATE_ADMIN', () => qc.invalidateQueries({ queryKey: ['matches'] }))

  const mutation = useMutation({
    mutationFn: ({ id, blocked }: { id: number; blocked: boolean }) => blockMatch(id, blocked),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['matches', sportId] }),
  })

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Matches</Typography>
      <Tabs value={sportId} onChange={(_, v) => setSportId(v)} sx={{ mb: 2 }}>
        {sports.filter((s) => s.isBetfair).map((s) => <Tab key={s.id} label={s.name} value={s.id} />)}
      </Tabs>
      <Card>
        <CardContent>
          {isLoading ? (
            <Box sx={{ display: 'grid', placeItems: 'center', height: 120 }}><CircularProgress /></Box>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Block</TableCell>
                  <TableCell>ID</TableCell>
                  <TableCell>Title</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {matches.map((m: Match) => (
                  <TableRow key={m.id} hover>
                    <TableCell>
                      <Switch
                        checked={!m.blocked}
                        onChange={(_, on) => mutation.mutate({ id: m.id, blocked: !on })}
                      />
                    </TableCell>
                    <TableCell>{m.id}</TableCell>
                    <TableCell>
                      <Link to={`/super-duper-admin/live-game-details?matchId=${m.id}&sportId=${m.sportId}&marketId=${encodeURIComponent(`MATCH_ODDS:${m.id}`)}&matchName=${encodeURIComponent(m.name)}`}>
                        {m.name}
                      </Link>
                    </TableCell>
                    <TableCell>{new Date(m.startTime).toLocaleString()}</TableCell>
                    <TableCell>
                      <Chip size="small" label={m.blocked ? 'Blocked' : m.status} color={m.blocked ? 'error' : 'success'} />
                    </TableCell>
                  </TableRow>
                ))}
                {matches.length === 0 && (
                  <TableRow><TableCell colSpan={5} align="center">No Data Available</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}
