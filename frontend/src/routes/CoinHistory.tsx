import { useSearchParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Box, Breadcrumbs, Card, CardContent, Table, TableBody, TableCell, TableHead, TableRow,
  Typography, CircularProgress,
} from '@mui/material'
import { walletStatement, type WalletRow } from '../lib/api'

// account_type stamped on coin/cash transfers (Receive/Pay Cash) by the wallet.
const TYPE_COIN = 1

// Doc §"Coin History" (coin-history) — reached from the Agent Match Dashboard.
// A changelog of the client's coin movements with an opening-balance header and
// a credit/debit total, matching the reference column set.
export function CoinHistory() {
  const [params] = useSearchParams()
  const userId = Number(params.get('userId') ?? 0)
  const username = params.get('username') ?? ''

  const { data: all = [], isLoading } = useQuery({
    queryKey: ['coin-history', userId],
    queryFn: () => walletStatement(userId).then((r) => r ?? []),
    enabled: userId > 0,
  })

  // walletStatement is newest-first; coin transfers only, oldest-first for display.
  const rows = all.filter((r: WalletRow) => r.accountType === TYPE_COIN).slice().reverse()
  const totalCredit = rows.reduce((s, r) => s + r.credit, 0)
  const totalDebit = rows.reduce((s, r) => s + r.debit, 0)
  // Balance just before the first row = balanceAfter rolled back by its own movement.
  const first = rows[0]
  const openingBalance = first ? first.balanceAfter - first.credit + first.debit : 0

  const narrationColor = (n: string) => {
    const t = n.toLowerCase()
    if (t.includes('deposit') || t.includes('receive')) return '#1a7f37'
    if (t.includes('withdraw') || t.includes('pay')) return '#cf222e'
    return undefined
  }

  return (
    <Box>
      <Breadcrumbs sx={{ mb: 1 }}>
        <Link to="/super-duper-admin/users">Dashboard</Link>
        <Typography color="text.secondary">CLIENTS</Typography>
        <Link to={`/super-duper-admin/user-dashboard?userId=${userId}`}>{username || 'Client'}</Link>
        <Typography color="text.primary">Coin History</Typography>
      </Breadcrumbs>
      <Typography variant="h5" gutterBottom>Coin History</Typography>
      <Card>
        <CardContent>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
            {username} Current User Changelog Details
          </Typography>
          {isLoading ? (
            <Box sx={{ display: 'grid', placeItems: 'center', height: 120 }}><CircularProgress /></Box>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>Narration</TableCell>
                  <TableCell align="right">Credit</TableCell>
                  <TableCell align="right">Debit</TableCell>
                  <TableCell align="right">Balance</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow sx={{ '& td': { fontWeight: 'bold' } }}>
                  <TableCell colSpan={6}>Opening Balance</TableCell>
                  <TableCell align="right">{openingBalance.toFixed(2)}</TableCell>
                </TableRow>
                {rows.map((r: WalletRow, i: number) => (
                  <TableRow key={r.id} hover>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell>{new Date(r.createdAt).toLocaleString()}</TableCell>
                    <TableCell>{username}</TableCell>
                    <TableCell sx={{ color: narrationColor(r.narration) }}>{r.narration}</TableCell>
                    <TableCell align="right" sx={{ color: '#1a7f37' }}>{r.credit ? r.credit.toFixed(2) : ''}</TableCell>
                    <TableCell align="right" sx={{ color: '#cf222e' }}>{r.debit ? r.debit.toFixed(2) : ''}</TableCell>
                    <TableCell align="right">{r.balanceAfter.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
                <TableRow sx={{ '& td': { fontWeight: 'bold' } }}>
                  <TableCell colSpan={4}>Total</TableCell>
                  <TableCell align="right" sx={{ color: '#1a7f37' }}>{totalCredit.toFixed(2)}</TableCell>
                  <TableCell align="right" sx={{ color: '#cf222e' }}>{totalDebit.toFixed(2)}</TableCell>
                  <TableCell />
                </TableRow>
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}
