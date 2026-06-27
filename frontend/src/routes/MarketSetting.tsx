import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Box, Button, Card, CardContent, Table, TableBody, TableCell, TableHead, TableRow,
  TextField, Typography, CircularProgress,
} from '@mui/material'
import { listSettings, setSetting, type Setting } from '../lib/api'

// Doc §32 — Market Setting: edit global key/value settings (stakes, limits, toggles).
export function MarketSetting() {
  const qc = useQueryClient()
  const { data: settings = [], isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => listSettings().then((r) => r ?? []),
  })
  const [draft, setDraft] = useState<Record<string, string>>({})
  useEffect(() => {
    setDraft(Object.fromEntries(settings.map((s) => [s.key, s.value])))
  }, [settings])

  const save = useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) => setSetting(key, value),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings'] }),
  })

  if (isLoading) return <Box sx={{ display: 'grid', placeItems: 'center', height: 160 }}><CircularProgress /></Box>

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Settings</Typography>
      <Card>
        <CardContent>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>Set Default Values</Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Value</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {settings.map((s: Setting) => (
                <TableRow key={s.key} hover>
                  <TableCell>{s.key}</TableCell>
                  <TableCell>
                    <TextField size="small" fullWidth value={draft[s.key] ?? ''}
                      onChange={(e) => setDraft({ ...draft, [s.key]: e.target.value })} />
                  </TableCell>
                  <TableCell align="right">
                    <Button size="small" variant="outlined"
                      disabled={save.isPending || draft[s.key] === s.value}
                      onClick={() => save.mutate({ key: s.key, value: draft[s.key] ?? '' })}>
                      Update
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Box>
  )
}
