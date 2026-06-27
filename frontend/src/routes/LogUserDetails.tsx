import { useSearchParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Box, Breadcrumbs, Button, Card, CardContent, Table, TableBody, TableCell, TableHead,
  TableRow, Typography, CircularProgress,
} from '@mui/material'
import DownloadIcon from '@mui/icons-material/Download'
import { reportStatement } from '../lib/api'

// Doc §"Log User Details (User Logs Statement)": a selected user's logs/ledger
// statement, with a download. (Our ledger covers balance before/after via the
// account_statement; the original also tracked liability before/after.)
export function LogUserDetails() {
  const [params] = useSearchParams()
  const userId = Number(params.get('userId') ?? 0)
  const username = params.get('username') ?? `User ${userId}`

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['user-logs', userId],
    queryFn: () => reportStatement(userId).then((r) => r ?? []),
    enabled: userId > 0,
  })

  const download = () => {
    const cols = ['date', 'narration', 'credit', 'debit', 'balanceAfter']
    const header = cols.join(',')
    const lines = rows.map((r) => cols.map((c) => JSON.stringify(r[c] ?? '')).join(','))
    const blob = new Blob([[header, ...lines].join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `user_log_statement_${userId}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Box>
      <Breadcrumbs sx={{ mb: 1 }}>
        <Link to="/super-duper-admin/search-logs-user">Search User</Link>
        <Typography color="text.primary">{username}</Typography>
      </Breadcrumbs>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <Typography variant="h5" sx={{ flexGrow: 1 }}>User Logs Statement</Typography>
        <Button startIcon={<DownloadIcon />} onClick={download} disabled={rows.length === 0}>Download</Button>
      </Box>
      <Card>
        <CardContent>
          {isLoading ? (
            <Box sx={{ display: 'grid', placeItems: 'center', height: 120 }}><CircularProgress /></Box>
          ) : (
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
                    <TableCell align="right">{fmt(r['credit'])}</TableCell>
                    <TableCell align="right">{fmt(r['debit'])}</TableCell>
                    <TableCell align="right">{fmt(r['balanceAfter'])}</TableCell>
                    <TableCell>{r['date'] ? new Date(String(r['date'])).toLocaleString() : '—'}</TableCell>
                  </TableRow>
                ))}
                {rows.length === 0 && <TableRow><TableCell colSpan={6} align="center">There is no data available.</TableCell></TableRow>}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}

function fmt(v: unknown): string {
  const n = Number(v)
  return Number.isFinite(n) && n !== 0 ? n.toFixed(2) : ''
}
