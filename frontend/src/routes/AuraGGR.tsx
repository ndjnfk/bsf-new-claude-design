import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Box, Card, CardContent, Stack, Table, TableBody, TableCell, TableHead, TableRow,
  TextField, Typography, Button,
} from '@mui/material'
import { casinoGGR } from '../lib/api'

// Doc §7 — Aura GGR: Royal Casino GGR / profit-loss by date.
export function AuraGGR() {
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [range, setRange] = useState<{ from: string; to: string }>({ from: '', to: '' })

  const { data } = useQuery({
    queryKey: ['ggr', range.from, range.to],
    queryFn: () => casinoGGR(range.from || undefined, range.to || undefined),
  })

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Royal Casino Report</Typography>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center">
            <TextField size="small" type="date" label="From" InputLabelProps={{ shrink: true }} value={from} onChange={(e) => setFrom(e.target.value)} />
            <TextField size="small" type="date" label="To" InputLabelProps={{ shrink: true }} value={to} onChange={(e) => setTo(e.target.value)} />
            <Button variant="contained" onClick={() => setRange({ from, to })}>Search</Button>
          </Stack>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1">Summary</Typography>
          <Typography variant="h5" sx={{ color: (data?.total ?? 0) < 0 ? '#cf222e' : '#1a7f37' }}>
            Total: {(data?.total ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Typography>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Declared</TableCell>
                <TableCell align="right">Profit / Loss</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(data?.rows ?? []).map((r, i) => (
                <TableRow key={i} hover>
                  <TableCell>{r.label}</TableCell>
                  <TableCell>{new Date(r.summaryDate).toLocaleDateString()}</TableCell>
                  <TableCell>Yes</TableCell>
                  <TableCell align="right" sx={{ color: r.netChips < 0 ? '#cf222e' : '#1a7f37' }}>{r.netChips.toFixed(2)}</TableCell>
                </TableRow>
              ))}
              {(data?.rows ?? []).length === 0 && <TableRow><TableCell colSpan={4} align="center">No data</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Box>
  )
}
