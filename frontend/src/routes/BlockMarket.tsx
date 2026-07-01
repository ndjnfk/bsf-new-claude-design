import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Alert, Box, Card, CardContent, Chip, Switch, Table, TableBody, TableCell, TableHead, TableRow,
  Typography, CircularProgress,
} from '@mui/material'
import { listSports, getMyBlocks, setCatalogBlock, type Sport } from '../lib/api'

// Doc §8 — Block Market. Per-tier block: switching a sport OFF here hides that
// sport (and all its series / matches / markets) from your ENTIRE downline, in
// real time. You still see it so you can switch it back. Sports already blocked
// by a panel above you don't appear at all.
export function BlockMarket() {
  const qc = useQueryClient()
  const { data: sports = [], isLoading } = useQuery({
    queryKey: ['sports'], queryFn: () => listSports().then((r) => r ?? []),
  })
  const { data: blocks = [] } = useQuery({
    queryKey: ['my-blocks', 'sport'], queryFn: () => getMyBlocks('sport').then((r) => r ?? []),
  })
  const blockedSet = useMemo(() => new Set(blocks), [blocks])

  const mutation = useMutation({
    mutationFn: ({ id, blocked }: { id: number; blocked: boolean }) => setCatalogBlock('sport', String(id), blocked),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-blocks', 'sport'] })
      qc.invalidateQueries({ queryKey: ['sports'] })
    },
  })

  if (isLoading) return <Box sx={{ display: 'grid', placeItems: 'center', height: 160 }}><CircularProgress /></Box>

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Block Sport</Typography>
      <Alert severity="info" sx={{ mb: 2 }}>
        Turning a sport <b>off</b> deactivates it — and all its series, matches and markets — removing them from Live Matches, and hides it from your whole downline.
      </Alert>
      <Card>
        <CardContent>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>So.</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Status (for downline)</TableCell>
                <TableCell align="right">Visible</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sports.map((s: Sport, i: number) => {
                const blocked = blockedSet.has(String(s.id))
                return (
                  <TableRow key={s.id} hover>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell>{s.name}</TableCell>
                    <TableCell>
                      <Chip size="small" label={blocked ? 'Blocked' : 'Visible'} color={blocked ? 'error' : 'success'} />
                    </TableCell>
                    <TableCell align="right">
                      <Switch
                        checked={!blocked}
                        disabled={mutation.isPending}
                        onChange={(_, visible) => mutation.mutate({ id: s.id, blocked: !visible })}
                      />
                    </TableCell>
                  </TableRow>
                )
              })}
              {sports.length === 0 && <TableRow><TableCell colSpan={4} align="center">No sports available</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Box>
  )
}
