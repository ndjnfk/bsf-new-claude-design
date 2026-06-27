import { useState, type ChangeEvent } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import {
  Box, Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel,
  FormGroup, Grid, Switch, Tab, Tabs, TextField, Typography,
} from '@mui/material'
import {
  listSports, getBlockedSports, setBlockedSports, getSportLimits, setSportLimit,
  getPokerBlock, setPokerBlock, type User, type Sport, type SportLimit,
} from '../lib/api'

// Sport Block (SB) — block specific sports for a user.
export function SportBlockDialog(props: { user: User; onClose: () => void; onDone: () => void }) {
  const { data: sports = [] } = useQuery({ queryKey: ['sports'], queryFn: () => listSports().then((r) => r ?? []) })
  const { data: blocked = [] } = useQuery({
    queryKey: ['blocked-sports', props.user.id], queryFn: () => getBlockedSports(props.user.id).then((r) => r ?? []),
  })
  const [sel, setSel] = useState<number[] | null>(null)
  const current = sel ?? blocked
  const toggle = (id: number) =>
    setSel((s) => { const base = s ?? blocked; return base.includes(id) ? base.filter((x) => x !== id) : [...base, id] })

  const mutation = useMutation({ mutationFn: () => setBlockedSports(props.user.id, current), onSuccess: props.onDone })

  return (
    <Dialog open onClose={props.onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Sport Block — {props.user.mstruserid}</DialogTitle>
      <DialogContent>
        <FormGroup>
          {sports.map((s: Sport) => (
            <FormControlLabel key={s.id} label={s.name}
              control={<Checkbox checked={current.includes(s.id)} onChange={() => toggle(s.id)} />} />
          ))}
        </FormGroup>
      </DialogContent>
      <DialogActions>
        <Button onClick={props.onClose}>Cancel</Button>
        <Button variant="contained" disabled={mutation.isPending} onClick={() => mutation.mutate()}>Save</Button>
      </DialogActions>
    </Dialog>
  )
}

// Sport Limit (SL) — per-sport limits split by market type (TOSS / MARKET /
// FANCY / BOOKMAKER), matching the reference SL dialog.
const SECTIONS = ['TOSS', 'MARKET', 'FANCY', 'BOOKMAKER'] as const
const sectionMaxStake: Record<string, number> = { TOSS: 500000, MARKET: 5000000, FANCY: 1000000, BOOKMAKER: 1000000 }
const emptyLimit = (userId: number, sportId: number, type: string): SportLimit => ({
  userId, sportId, type, minStake: 1, maxStake: sectionMaxStake[type] ?? 100000, maxProfit: 100000000,
  betDelay: 0, marketVolume: 1, maxMarketExposure: 0, layDiff: 0,
})

export function SportLimitDialog(props: { user: User; onClose: () => void; onDone: () => void }) {
  const { data: sports = [] } = useQuery({ queryKey: ['sports'], queryFn: () => listSports().then((r) => r ?? []) })
  const { data: limits = [] } = useQuery({
    queryKey: ['sport-limits', props.user.id], queryFn: () => getSportLimits(props.user.id).then((r) => r ?? []),
  })
  const [sportId, setSportId] = useState(4)
  const [edits, setEdits] = useState<Record<string, SportLimit>>({})

  // Only Cricket has TOSS / FANCY / BOOKMAKER sections and the Lay Diff field;
  // every other sport shows just the MARKET section (reference: hide when != 4).
  const isCricket = (sports.find((s) => s.id === sportId)?.name ?? '').toLowerCase() === 'cricket'
  const visibleSections: readonly string[] = isCricket ? SECTIONS : ['MARKET']

  const key = (t: string) => `${sportId}:${t}`
  const value = (t: string): SportLimit =>
    edits[key(t)] ?? limits.find((l) => l.sportId === sportId && (l.type || 'MARKET') === t) ?? emptyLimit(props.user.id, sportId, t)
  const num = (t: string, k: keyof SportLimit) => (e: ChangeEvent<HTMLInputElement>) =>
    setEdits((s) => ({ ...s, [key(t)]: { ...value(t), [k]: Number(e.target.value) } }))

  const mutation = useMutation({
    mutationFn: () => Promise.all(visibleSections.map((t) =>
      setSportLimit({ ...value(t), userId: props.user.id, sportId, type: t }))),
    onSuccess: props.onDone,
  })

  const field = (t: string, k: keyof SportLimit, label: string) => (
    <Grid item xs={6} sm={3}>
      <TextField fullWidth type="number" label={label} value={value(t)[k] as number} onChange={num(t, k)} />
    </Grid>
  )
  const section = (t: string) => (
    <Box key={t} sx={{ mb: 2.5 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>{t}</Typography>
      <Grid container spacing={2}>
        {field(t, 'minStake', 'Min Stake')}
        {field(t, 'maxStake', 'Max Stake')}
        {field(t, 'maxProfit', 'Max Profit')}
        {field(t, 'betDelay', 'Bet Delay')}
        {field(t, 'marketVolume', 'Market Volume')}
        {field(t, 'maxMarketExposure', 'Max Market Exposure')}
        {isCricket && field(t, 'layDiff', 'Lay Diff')}
      </Grid>
    </Box>
  )

  return (
    <Dialog open onClose={props.onClose} maxWidth="lg" fullWidth>
      <DialogTitle>Sport Limit — {props.user.mstruserid}</DialogTitle>
      <DialogContent>
        <Tabs value={sportId} onChange={(_, v) => setSportId(v)} variant="scrollable" scrollButtons="auto" sx={{ mb: 2 }}>
          {sports.map((s: Sport) => <Tab key={s.id} label={s.name} value={s.id} />)}
        </Tabs>
        {visibleSections.map(section)}
      </DialogContent>
      <DialogActions>
        <Button onClick={props.onClose}>Cancel</Button>
        <Button variant="contained" disabled={mutation.isPending} onClick={() => mutation.mutate()}>Save</Button>
      </DialogActions>
    </Dialog>
  )
}

// Poker Block (PB) — block casino/poker for a user.
export function PokerBlockDialog(props: { user: User; onClose: () => void; onDone: () => void }) {
  const { data } = useQuery({ queryKey: ['poker-block', props.user.id], queryFn: () => getPokerBlock(props.user.id) })
  const [blocked, setBlocked] = useState<boolean | null>(null)
  const value = blocked ?? data?.blocked ?? false
  const mutation = useMutation({ mutationFn: () => setPokerBlock(props.user.id, value), onSuccess: props.onDone })
  return (
    <Dialog open onClose={props.onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Poker Block — {props.user.mstruserid}</DialogTitle>
      <DialogContent>
        <FormControlLabel sx={{ mt: 1 }}
          control={<Switch checked={value} onChange={(_, v) => setBlocked(v)} />}
          label={<Typography>Casino / Poker {value ? 'Blocked' : 'Allowed'}</Typography>} />
      </DialogContent>
      <DialogActions>
        <Button onClick={props.onClose}>Cancel</Button>
        <Button variant="contained" disabled={mutation.isPending} onClick={() => mutation.mutate()}>Save</Button>
      </DialogActions>
    </Dialog>
  )
}
