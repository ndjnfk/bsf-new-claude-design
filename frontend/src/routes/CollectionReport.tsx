import { useQuery } from '@tanstack/react-query'
import {
  Box, Card, CardContent, Table, TableBody, TableCell, TableHead, TableRow, Typography,
} from '@mui/material'
import { collectionReport, type CollectionUser } from '../lib/api'

// Doc §13 — Collection Report: balances grouped Minus (take) / Plus (give) / Zero.
export function CollectionReport() {
  const { data } = useQuery({ queryKey: ['collection-report'], queryFn: collectionReport })

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Collection Report</Typography>
      <Section title="Minus Users (LENA HAI / Take)" rows={data?.minusUsers ?? []} />
      <Section title="Plus Users (DENA HAI / Give)" rows={data?.plusUsers ?? []} />
      <Section title="Zero Users (CLEAR HAI)" rows={data?.zeroUsers ?? []} />
    </Box>
  )
}

function Section({ title, rows }: { title: string; rows: CollectionUser[] }) {
  const total = rows.reduce((s, r) => s + r.balance, 0)
  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>{title}</Typography>
        <Table size="small">
          <TableHead><TableRow><TableCell>Name</TableCell><TableCell align="right">Amount</TableCell></TableRow></TableHead>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id} hover>
                <TableCell>{r.username} ({r.name})</TableCell>
                <TableCell align="right">{r.balance.toFixed(2)}</TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && <TableRow><TableCell colSpan={2} align="center">No data</TableCell></TableRow>}
            {rows.length > 0 && (
              <TableRow><TableCell><b>Total</b></TableCell><TableCell align="right"><b>{total.toFixed(2)}</b></TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
