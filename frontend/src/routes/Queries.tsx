import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Box, Button, Card, CardContent, Tab, Tabs, Table, TableBody, TableCell, TableHead,
  TableRow, Typography,
} from '@mui/material'
import DoneIcon from '@mui/icons-material/Done'
import { listQueries, resolveQuery, createQuery, type Query } from '../lib/api'

// Doc §28 — Queries: user complaints, PENDING / RESOLVED tabs.
export function Queries() {
  const qc = useQueryClient()
  const [status, setStatus] = useState<'PENDING' | 'RESOLVED'>('PENDING')
  const { data: rows = [] } = useQuery({
    queryKey: ['queries', status],
    queryFn: () => listQueries(status).then((r) => r ?? []),
  })

  const resolve = useMutation({
    mutationFn: (id: string) => resolveQuery(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['queries'] }),
  })
  const seed = useMutation({
    mutationFn: () => createQuery({ mobile: '9000000000', category: 'Deposit', query: 'Sample query — deposit not credited.' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['queries'] }),
  })

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <Typography variant="h5" sx={{ flexGrow: 1 }}>Queries</Typography>
        <Button size="small" onClick={() => seed.mutate()}>+ Add sample query</Button>
      </Box>
      <Tabs value={status} onChange={(_, v) => setStatus(v)} sx={{ mb: 2 }}>
        <Tab label="Pending" value="PENDING" />
        <Tab label="Resolved" value="RESOLVED" />
      </Tabs>
      <Card>
        <CardContent>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>Mobile</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Query</TableCell>
                <TableCell>Issue Date</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((q: Query, i: number) => (
                <TableRow key={q.id} hover>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell>{q.mobile}</TableCell>
                  <TableCell>{q.category}</TableCell>
                  <TableCell>{q.query.slice(0, 100)}</TableCell>
                  <TableCell>{new Date(q.issueDate).toLocaleString()}</TableCell>
                  <TableCell align="right">
                    {status === 'PENDING' && (
                      <Button size="small" startIcon={<DoneIcon />} onClick={() => resolve.mutate(q.id)}>Resolve</Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && <TableRow><TableCell colSpan={6} align="center">No queries</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Box>
  )
}
