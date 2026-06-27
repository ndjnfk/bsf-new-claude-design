import { useSearchParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Box, Breadcrumbs, Card, CardContent, Table, TableBody, TableCell, TableHead, TableRow,
  Typography, CircularProgress,
} from '@mui/material'
import {
  reportClientReport, reportCompanyReport, reportSessionEarning, reportMatchLedger,
} from '../lib/api'

type Row = { _id?: unknown; bets?: number; stake?: number; matchedSize?: number; exposure?: number }

// Shared per-match aggregation table (doc: Client/Company/Session-Earning/Ledger).
function MatchAgg(props: {
  title: string
  idLabel: string
  fetcher: (matchId: number) => Promise<Record<string, unknown>[] | null>
  queryKey: string
}) {
  const [params] = useSearchParams()
  const matchId = Number(params.get('matchId') ?? 0)
  const matchName = params.get('matchName') ?? `Match ${matchId}`

  const { data: rows = [], isLoading } = useQuery({
    queryKey: [props.queryKey, matchId],
    queryFn: () => props.fetcher(matchId).then((r) => (r ?? []) as Row[]),
    enabled: matchId > 0,
  })

  const total = rows.reduce<{ bets: number; stake: number; matched: number; exposure: number }>(
    (a, r) => ({
      bets: a.bets + (r.bets ?? 0),
      stake: a.stake + (r.stake ?? 0),
      matched: a.matched + (r.matchedSize ?? 0),
      exposure: a.exposure + (r.exposure ?? 0),
    }),
    { bets: 0, stake: 0, matched: 0, exposure: 0 },
  )

  return (
    <Box>
      <Breadcrumbs sx={{ mb: 1 }}>
        <Link to="/super-duper-admin/live-matches">Matches</Link>
        <Typography color="text.primary">{matchName}</Typography>
      </Breadcrumbs>
      <Typography variant="h5" gutterBottom>{props.title}</Typography>
      <Card>
        <CardContent>
          {isLoading ? (
            <Box sx={{ display: 'grid', placeItems: 'center', height: 120 }}><CircularProgress /></Box>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{props.idLabel}</TableCell>
                  <TableCell align="right">Bets</TableCell>
                  <TableCell align="right">Stake</TableCell>
                  <TableCell align="right">Matched</TableCell>
                  <TableCell align="right">Exposure</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((r, i) => (
                  <TableRow key={i} hover>
                    <TableCell>{String(r._id ?? '—')}</TableCell>
                    <TableCell align="right">{r.bets ?? 0}</TableCell>
                    <TableCell align="right">{(r.stake ?? 0).toFixed(2)}</TableCell>
                    <TableCell align="right">{(r.matchedSize ?? 0).toFixed(2)}</TableCell>
                    <TableCell align="right">{(r.exposure ?? 0).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
                {rows.length === 0 && <TableRow><TableCell colSpan={5} align="center">There is no data available.</TableCell></TableRow>}
                {rows.length > 0 && (
                  <TableRow>
                    <TableCell><b>Total</b></TableCell>
                    <TableCell align="right"><b>{total.bets}</b></TableCell>
                    <TableCell align="right"><b>{total.stake.toFixed(2)}</b></TableCell>
                    <TableCell align="right"><b>{total.matched.toFixed(2)}</b></TableCell>
                    <TableCell align="right"><b>{total.exposure.toFixed(2)}</b></TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}

export const ClientReport = () => (
  <MatchAgg title="Client Report" idLabel="User Id" fetcher={reportClientReport} queryKey="client-report" />
)
export const CompanyReport = () => (
  <MatchAgg title="Company Report" idLabel="Market" fetcher={reportCompanyReport} queryKey="company-report" />
)
export const SessionEarningReport = () => (
  <MatchAgg title="Session Earning Report" idLabel="User Id" fetcher={reportSessionEarning} queryKey="session-earning" />
)
export const MatchLedger = () => (
  <MatchAgg title="Ledger (Match-wise)" idLabel="Market" fetcher={reportMatchLedger} queryKey="match-ledger" />
)
