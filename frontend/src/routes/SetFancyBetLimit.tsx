import { useEffect, useState, type ChangeEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Box, Button, Card, CardContent, MenuItem, Select, Stack, Table, TableBody, TableCell,
  TableHead, TableRow, TextField, Typography,
} from '@mui/material'
import {
  listMatches, listFancy, updateFancyStake, updateFancyStatus, declareFancy,
  type Fancy, type Match,
} from '../lib/api'

const STATUSES = ['ACTIVE', 'INACTIVE', 'SUSPEND', 'HIDE']
type Draft = { minStake: number; maxStake: number; maxSessionLiability: number; maxSessionBetLiability: number; message: string; result: string }

// Doc §27 — Set Fancy BetLimit: manage fancy market limits, status and results.
export function SetFancyBetLimit() {
  const qc = useQueryClient()
  const { data: matches = [] } = useQuery({ queryKey: ['matches', 'all'], queryFn: () => listMatches().then((r) => r ?? []) })
  const [matchId, setMatchId] = useState<number | ''>('')
  const { data: fancies = [] } = useQuery({
    queryKey: ['fancy', matchId],
    queryFn: () => (matchId ? listFancy(Number(matchId)) : listFancy()).then((r) => r ?? []),
  })

  const [drafts, setDrafts] = useState<Record<number, Draft>>({})
  useEffect(() => {
    const init: Record<number, Draft> = {}
    for (const f of fancies) {
      init[f.id] = {
        minStake: f.minStake, maxStake: f.maxStake, maxSessionLiability: f.maxSessionLiability,
        maxSessionBetLiability: f.maxSessionBetLiability, message: f.message ?? '', result: f.result ?? '',
      }
    }
    setDrafts(init)
  }, [fancies])

  const saveStake = useMutation({
    mutationFn: ({ id, d }: { id: number; d: Draft }) => updateFancyStake(id, d),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fancy'] }),
  })
  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => updateFancyStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fancy'] }),
  })
  const declare = useMutation({
    mutationFn: ({ id, result }: { id: number; result: string }) => declareFancy(id, result),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fancy'] }),
  })

  const edit = (id: number, key: keyof Draft) => (e: ChangeEvent<HTMLInputElement>) =>
    setDrafts((d) => ({ ...d, [id]: { ...d[id], [key]: key === 'message' || key === 'result' ? e.target.value : Number(e.target.value) } }))

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Manage Fancy Markets</Typography>
      <Stack direction="row" sx={{ mb: 2 }}>
        <TextField select size="small" label="Select Match" value={matchId} sx={{ minWidth: 260 }}
          onChange={(e) => setMatchId(Number(e.target.value))}>
          {matches.map((m: Match) => <MenuItem key={m.id} value={m.id}>{m.name}</MenuItem>)}
        </TextField>
      </Stack>
      <Card>
        <CardContent>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Fancy</TableCell>
                <TableCell>Min</TableCell>
                <TableCell>Max</TableCell>
                <TableCell>Max Exp.</TableCell>
                <TableCell>Bet Exp.</TableCell>
                <TableCell>Message</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Result</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {fancies.map((f: Fancy) => {
                const d = drafts[f.id]
                if (!d) return null
                return (
                  <TableRow key={f.id} hover>
                    <TableCell>{f.headName}</TableCell>
                    <TableCell><Num value={d.minStake} onChange={edit(f.id, 'minStake')} /></TableCell>
                    <TableCell><Num value={d.maxStake} onChange={edit(f.id, 'maxStake')} /></TableCell>
                    <TableCell><Num value={d.maxSessionLiability} onChange={edit(f.id, 'maxSessionLiability')} /></TableCell>
                    <TableCell><Num value={d.maxSessionBetLiability} onChange={edit(f.id, 'maxSessionBetLiability')} /></TableCell>
                    <TableCell><TextField size="small" value={d.message} onChange={edit(f.id, 'message')} sx={{ width: 120 }} /></TableCell>
                    <TableCell>
                      <Select size="small" value={f.status} onChange={(e) => setStatus.mutate({ id: f.id, status: e.target.value })}>
                        {STATUSES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                      </Select>
                    </TableCell>
                    <TableCell><TextField size="small" value={d.result} onChange={edit(f.id, 'result')} sx={{ width: 90 }} /></TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                        <Button size="small" variant="outlined" onClick={() => saveStake.mutate({ id: f.id, d })}>Save</Button>
                        <Button size="small" color="success" disabled={!d.result} onClick={() => declare.mutate({ id: f.id, result: d.result })}>Declare</Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                )
              })}
              {fancies.length === 0 && <TableRow><TableCell colSpan={9} align="center">No fancy markets</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Box>
  )
}

function Num({ value, onChange }: { value: number; onChange: (e: ChangeEvent<HTMLInputElement>) => void }) {
  return <TextField size="small" type="number" value={value} onChange={onChange} sx={{ width: 90 }} />
}
