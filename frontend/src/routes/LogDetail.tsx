import { useQuery } from '@tanstack/react-query'
import {
  Box, Card, CardContent, Table, TableBody, TableCell, TableHead, TableRow, Typography,
} from '@mui/material'
import { reportStatement } from '../lib/api'

// Doc §14 — Log Detail: the ledger/balance log for the current user.
export function LogDetail() {
  const { data: rows = [] } = useQuery({
    queryKey: ['logs'],
    queryFn: () => reportStatement().then((r) => r ?? []),
  })

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Logs Details</Typography>
      <Card>
        <CardContent>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>Narration</TableCell>
                <TableCell align="right">Credit</TableCell>
                <TableCell align="right">Debit</TableCell>
                <TableCell align="right">Balance After</TableCell>
                <TableCell>Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((r, i) => (
                <TableRow key={i} hover>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell>{String(r['narration'] ?? '')}</TableCell>
                  <TableCell align="right">{num(r['credit'])}</TableCell>
                  <TableCell align="right">{num(r['debit'])}</TableCell>
                  <TableCell align="right">{num(r['balanceAfter'])}</TableCell>
                  <TableCell>{r['date'] ? new Date(String(r['date'])).toLocaleString() : '—'}</TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && <TableRow><TableCell colSpan={6} align="center">There is no data available.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Box>
  )
}

function num(v: unknown): string {
  const n = Number(v)
  return Number.isFinite(n) && n !== 0 ? n.toFixed(2) : ''
}
