import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Box, Card, CardContent, Tab, Tabs, Table, TableBody, TableCell, TableHead, TableRow,
  Typography, CircularProgress,
} from '@mui/material'
import {
  reportBetHistory, reportStatement, reportProfitLoss,
  reportLoginHistory, reportDeletedBets, reportPasswordHistory,
} from '../lib/api'

type ReportKind =
  | 'bet-history' | 'profit-loss' | 'statement'
  | 'login-history' | 'deleted-bets' | 'password-history'

const FETCHERS: Record<ReportKind, () => Promise<Record<string, unknown>[] | null>> = {
  'bet-history': () => reportBetHistory(),
  'profit-loss': () => reportProfitLoss(),
  statement: () => reportStatement(),
  'login-history': () => reportLoginHistory(),
  'deleted-bets': () => reportDeletedBets(),
  'password-history': () => reportPasswordHistory(),
}

// Doc §15 — All Reports. Report ids: 1=Bet History, 2=Profit & Loss,
// 3=Account Statement, 4=Login History, 5=Deleted Bet History, 6=Password History.
export function Reports() {
  const [kind, setKind] = useState<ReportKind>('bet-history')
  const { data = [], isLoading } = useQuery({
    queryKey: ['report', kind],
    queryFn: () => FETCHERS[kind]().then((r) => r ?? []),
  })

  const columns = data.length ? Object.keys(data[0]) : []

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Reports</Typography>
      <Tabs value={kind} onChange={(_, v) => setKind(v)} variant="scrollable" scrollButtons="auto" sx={{ mb: 2 }}>
        <Tab label="Bet History" value="bet-history" />
        <Tab label="Profit & Loss" value="profit-loss" />
        <Tab label="Account Statement" value="statement" />
        <Tab label="Login History" value="login-history" />
        <Tab label="Deleted Bets" value="deleted-bets" />
        <Tab label="Password History" value="password-history" />
      </Tabs>
      <Card>
        <CardContent>
          {isLoading ? (
            <Box sx={{ display: 'grid', placeItems: 'center', height: 120 }}><CircularProgress /></Box>
          ) : data.length === 0 ? (
            <Typography align="center" color="text.secondary" sx={{ py: 3 }}>
              There is no data available.
            </Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>{columns.map((c) => <TableCell key={c}>{c}</TableCell>)}</TableRow>
              </TableHead>
              <TableBody>
                {data.map((row, i) => (
                  <TableRow key={i} hover>
                    {columns.map((c) => <TableCell key={c}>{render(row[c])}</TableCell>)}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}

function render(v: unknown): string {
  if (v === null || v === undefined) return '—'
  if (typeof v === 'object') return JSON.stringify(v)
  return String(v)
}
