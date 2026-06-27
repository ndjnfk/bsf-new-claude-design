import { useQuery } from '@tanstack/react-query'
import {
  Box, Card, CardContent, Table, TableBody, TableCell, TableHead, TableRow, Typography, Chip,
} from '@mui/material'
import { loginHistoryToday, type IpGroup } from '../lib/api'

// Doc §30 — Ip Surveillance: today's logins grouped by IP (spot shared IPs).
export function IpSurveillance() {
  const { data: groups = [] } = useQuery({
    queryKey: ['ip-today'],
    queryFn: () => loginHistoryToday().then((r) => r ?? []),
    refetchInterval: 15000,
  })

  return (
    <Box>
      <Typography variant="h5" gutterBottom>IP Surveillance</Typography>
      <Card>
        <CardContent>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>S.No</TableCell>
                <TableCell>IP</TableCell>
                <TableCell>User(s)</TableCell>
                <TableCell align="right">Logins</TableCell>
                <TableCell>Last Login</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {groups.map((g: IpGroup, i: number) => (
                <TableRow key={g.ip} hover sx={{ bgcolor: g.users.length > 1 ? '#fff7e6' : undefined }}>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell>{g.ip}</TableCell>
                  <TableCell>{g.users.map((u) => <Chip key={u} size="small" label={u} sx={{ mr: 0.5, mb: 0.5 }} />)}</TableCell>
                  <TableCell align="right">{g.count}</TableCell>
                  <TableCell>{new Date(g.last).toLocaleString()}</TableCell>
                </TableRow>
              ))}
              {groups.length === 0 && <TableRow><TableCell colSpan={5} align="center">There is no data available.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Box>
  )
}
