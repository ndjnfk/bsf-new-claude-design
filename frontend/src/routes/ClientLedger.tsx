import { useSearchParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Box, Breadcrumbs, Card, CardContent, Table, TableBody, TableCell, TableHead, TableRow,
  Typography, CircularProgress,
} from '@mui/material'
import { walletStatement, type WalletRow } from '../lib/api'

// account_type codes recorded by the wallet/settlement layers.
const TYPE_CASH = 1 // deposit / withdraw (Receive/Pay Cash, coin transfers)

// Doc §"Client Ledger" (chip-history-user) — the Ledger / Cash Ledger / Coin
// History buttons on the Agent Match Dashboard all open this running ledger of a
// single client's account statement. The `cash` flag narrows it to cash-only
// movements (Cash Ledger / Coin History); without it, every entry shows.
export function ClientLedger() {
  const [params] = useSearchParams()
  const userId = Number(params.get('userId') ?? 0)
  const username = params.get('username') ?? ''
  const cashOnly = params.get('cash') === '1'
  const coin = params.get('coin') === '1'
  const title = coin ? 'Coin History' : cashOnly ? 'Cash Ledger' : 'Client Ledger'

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['client-ledger', userId],
    queryFn: () => walletStatement(userId).then((r) => r ?? []),
    enabled: userId > 0,
  })

  const filtered = cashOnly || coin ? rows.filter((r: WalletRow) => r.accountType === TYPE_CASH) : rows

  return (
    <Box>
      <Breadcrumbs sx={{ mb: 1 }}>
        <Link to={`/super-duper-admin/user-dashboard?userId=${userId}`}>{username || 'Client'}</Link>
        <Typography color="text.primary">{title}</Typography>
      </Breadcrumbs>
      <Typography variant="h5" gutterBottom>{title} {username && `— ${username}`}</Typography>
      <Card>
        <CardContent>
          {isLoading ? (
            <Box sx={{ display: 'grid', placeItems: 'center', height: 120 }}><CircularProgress /></Box>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Narration</TableCell>
                  <TableCell align="right">Credit</TableCell>
                  <TableCell align="right">Debit</TableCell>
                  <TableCell align="right">Balance</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((r: WalletRow) => (
                  <TableRow key={r.id} hover>
                    <TableCell>{new Date(r.createdAt).toLocaleString()}</TableCell>
                    <TableCell>{r.narration}</TableCell>
                    <TableCell align="right" sx={{ color: '#1a7f37' }}>{r.credit ? r.credit.toFixed(2) : ''}</TableCell>
                    <TableCell align="right" sx={{ color: '#cf222e' }}>{r.debit ? r.debit.toFixed(2) : ''}</TableCell>
                    <TableCell align="right">{r.balanceAfter.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={5} align="center">There is no data available.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}
