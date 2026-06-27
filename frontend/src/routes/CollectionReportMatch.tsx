import { useSearchParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Box, Breadcrumbs, Card, CardContent, Grid, Table, TableBody, TableCell, TableHead,
  TableRow, Typography,
} from '@mui/material'
import { reportClientReport } from '../lib/api'

type Row = { _id?: unknown; matchedSize?: number; exposure?: number }
type Client = { user: string; amount: number }

// Doc §"Collection Report" (match hub): a single match's chip summary in two
// columns — receive from (Lena Hai) / pay to (Dena Hai). Derived from the
// per-client match aggregation (net = matched - exposure).
export function CollectionReportMatch() {
  const [params] = useSearchParams()
  const matchId = Number(params.get('matchId') ?? 0)
  const matchName = params.get('matchName') ?? `Match ${matchId}`

  const { data: rows = [] } = useQuery({
    queryKey: ['match-collection', matchId],
    queryFn: () => reportClientReport(matchId).then((r) => (r ?? []) as Row[]),
    enabled: matchId > 0,
  })

  const receive: Client[] = []
  const pay: Client[] = []
  for (const r of rows) {
    const net = (r.matchedSize ?? 0) - (r.exposure ?? 0)
    const c = { user: String(r._id ?? '—'), amount: Math.abs(net) }
    if (net < 0) receive.push(c)
    else if (net > 0) pay.push(c)
  }

  return (
    <Box>
      <Breadcrumbs sx={{ mb: 1 }}>
        <Link to="/super-duper-admin/live-matches">Matches</Link>
        <Typography color="text.primary">{matchName}</Typography>
      </Breadcrumbs>
      <Typography variant="h5" gutterBottom>Collection Report</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Column title="Payment Receiving From (Lena Hai)" clients={receive} />
        </Grid>
        <Grid item xs={12} md={6}>
          <Column title="Payment Paid To (Dena Hai)" clients={pay} />
        </Grid>
      </Grid>
    </Box>
  )
}

function Column({ title, clients }: { title: string; clients: Client[] }) {
  const total = clients.reduce((a, c) => a + c.amount, 0)
  return (
    <Card>
      <CardContent>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>{title}</Typography>
        <Table size="small">
          <TableHead><TableRow><TableCell>Client</TableCell><TableCell align="right">Balance</TableCell></TableRow></TableHead>
          <TableBody>
            {clients.map((c, i) => (
              <TableRow key={i} hover><TableCell>{c.user}</TableCell><TableCell align="right">{c.amount.toFixed(2)}</TableCell></TableRow>
            ))}
            {clients.length === 0 && <TableRow><TableCell colSpan={2} align="center">No data</TableCell></TableRow>}
            {clients.length > 0 && (
              <TableRow><TableCell><b>Total</b></TableCell><TableCell align="right"><b>{total.toFixed(2)}</b></TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
