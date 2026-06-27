import { useSearchParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Box, Breadcrumbs, Card, CardContent, Table, TableBody, TableCell, TableHead, TableRow,
  Typography, CircularProgress,
} from '@mui/material'
import { walletStatement, type WalletRow } from '../lib/api'

// account_type code the settlement engine stamps on match P&L ledger rows.
const TYPE_MATCH = 3

// Doc §"Ledger Match Wise" (ledger-match-summary) — reached from the Agent Match
// Dashboard. It is a ledger view: the client's match-settlement entries from the
// account statement, shown as Date · Match Name (narration) · Credit · Debit.
export function UserMatchLedger() {
  const [params] = useSearchParams()
  const userId = Number(params.get('userId') ?? 0)
  const username = params.get('username') ?? ''

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['user-match-ledger', userId],
    queryFn: () => walletStatement(userId).then((r) => r ?? []),
    enabled: userId > 0,
  })

  const matchRows = rows.filter((r: WalletRow) => r.accountType === TYPE_MATCH)

  return (
    <Box>
      <Breadcrumbs sx={{ mb: 1 }}>
        <Link to={`/super-duper-admin/user-dashboard?userId=${userId}`}>{username || 'Client'}</Link>
        <Typography color="text.primary">Match Ledger</Typography>
      </Breadcrumbs>
      <Typography variant="h5" gutterBottom>Match Ledger {username && `— ${username}`}</Typography>
      <Card>
        <CardContent>
          {isLoading ? (
            <Box sx={{ display: 'grid', placeItems: 'center', height: 120 }}><CircularProgress /></Box>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Match Name</TableCell>
                  <TableCell align="right">Credit</TableCell>
                  <TableCell align="right">Debit</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {matchRows.map((r: WalletRow) => (
                  <TableRow key={r.id} hover>
                    <TableCell>{new Date(r.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>{r.narration}</TableCell>
                    <TableCell align="right" sx={{ color: '#1a7f37' }}>{r.credit ? r.credit.toFixed(2) : ''}</TableCell>
                    <TableCell align="right" sx={{ color: '#cf222e' }}>{r.debit ? r.debit.toFixed(2) : ''}</TableCell>
                  </TableRow>
                ))}
                {matchRows.length === 0 && (
                  <TableRow><TableCell colSpan={4} align="center">There is no data available.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}
