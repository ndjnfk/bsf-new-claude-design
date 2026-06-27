import { useSearchParams, Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Box, Breadcrumbs, Button, Card, CardContent, Table, TableBody, TableCell, TableHead,
  TableRow, Typography,
} from '@mui/material'
import { listMarkets, activateMarket, publishMarket, type Market } from '../lib/api'

// Doc §"Manage Session Fancy (Line Fancy)": LINE markets — activate + publish.
export function ManageSessionFancy() {
  const qc = useQueryClient()
  const [params] = useSearchParams()
  const matchId = Number(params.get('matchId') ?? 0)
  const matchName = params.get('matchName') ?? `Match ${matchId}`

  const { data: markets = [] } = useQuery({
    queryKey: ['line-markets', matchId],
    queryFn: () => listMarkets(matchId, 'line').then((r) => r ?? []),
    enabled: matchId > 0,
  })

  const act = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) => activateMarket(id, active),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['line-markets', matchId] }),
  })
  const pub = useMutation({
    mutationFn: ({ id, published }: { id: number; published: boolean }) => publishMarket(id, published),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['line-markets', matchId] }),
  })

  return (
    <Box>
      <Breadcrumbs sx={{ mb: 1 }}>
        <Link to="/super-duper-admin/live-matches">Matches</Link>
        <Typography color="text.primary">{matchName}</Typography>
      </Breadcrumbs>
      <Typography variant="h5" gutterBottom>Line Markets</Typography>
      <Card>
        <CardContent>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>Market Name</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {markets.map((mk: Market, i: number) => (
                <TableRow key={mk.id} hover>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell>{mk.name}</TableCell>
                  <TableCell align="right">
                    {!mk.active ? (
                      <Button size="small" variant="contained" onClick={() => act.mutate({ id: mk.id, active: true })}>Activate</Button>
                    ) : !mk.isPublished ? (
                      <Button size="small" variant="outlined" onClick={() => pub.mutate({ id: mk.id, published: true })}>Publish Data</Button>
                    ) : (
                      <Button size="small" variant="outlined" color="error" onClick={() => pub.mutate({ id: mk.id, published: false })}>Unpublish Data</Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {markets.length === 0 && <TableRow><TableCell colSpan={3} align="center">No line markets</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Box>
  )
}
