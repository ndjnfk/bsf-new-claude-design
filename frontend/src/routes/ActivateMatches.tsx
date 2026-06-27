import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Box, Button, Card, CardContent, IconButton, Stack, Tab, Tabs, Table, TableBody, TableCell,
  TableHead, TableRow, Tooltip, Typography, Chip, CircularProgress, Alert,
} from '@mui/material'
import CasinoIcon from '@mui/icons-material/Casino'
import {
  feedEvents, feedActivate, matchFeatureState, toggleMatchFeature, type FeedMatch,
} from '../lib/api'

// Doc §19 — Activate Matches (Super Duper Admin). Data comes from the third-party
// feed wrapper (failover across providers). Each event can be Activated (imported
// into our catalog); once activated it shows Publish + Fancy/Bookmaker/Toss.
export function ActivateMatches() {
  const qc = useQueryClient()
  // One feed fetch drives both the sport tabs and the match list (filtered client
  // side), so we don't hit the upstream feed once per tab.
  const { data: snap, isLoading, isError } = useQuery({
    queryKey: ['feed-events'],
    queryFn: () => feedEvents(),
    refetchInterval: 20000, // live-ish; appears/disappears as the feed changes
  })
  const sports = snap?.sports ?? []
  const [sportId, setSportId] = useState('')
  useEffect(() => { if (!sportId && sports.length) setSportId(sports[0].id) }, [sports, sportId])
  const matches = (snap?.matches ?? []).filter((m) => m.sportId === sportId)

  const activate = useMutation({
    mutationFn: (eid: string) => feedActivate(eid),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['feed-events'] }),
  })

  if (isError) {
    return (
      <Box>
        <Typography variant="h5" gutterBottom>Activate Matches</Typography>
        <Alert severity="error">All feed providers are currently unavailable. The wrapper tried each configured URL.</Alert>
      </Box>
    )
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Activate Matches</Typography>
      {snap?.source && <Typography variant="caption" color="text.secondary">Feed: {snap.source}</Typography>}
      <Tabs value={sportId || false} onChange={(_, v) => setSportId(v)} variant="scrollable" scrollButtons="auto" sx={{ mb: 2 }}>
        {sports.map((s) => <Tab key={s.id} label={s.name} value={s.id} />)}
      </Tabs>
      <Card>
        <CardContent>
          {isLoading ? (
            <Box sx={{ display: 'grid', placeItems: 'center', height: 120 }}><CircularProgress /></Box>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {matches.map((m: FeedMatch) => (
                  <TableRow key={m.id} hover>
                    <TableCell>
                      {m.name}
                      {m.inPlay && <Chip size="small" label="In-Play" color="error" sx={{ ml: 1 }} />}
                    </TableCell>
                    <TableCell>{m.startTime ? new Date(m.startTime).toLocaleString() : '—'}</TableCell>
                    <TableCell>
                      {!m.activated ? (
                        <Button size="small" variant="contained"
                          sx={{ bgcolor: '#1f2937', '&:hover': { bgcolor: '#374151' } }}
                          disabled={activate.isPending}
                          onClick={() => activate.mutate(m.id)}>Activate</Button>
                      ) : (
                        <MatchFeatures matchId={m.localId} matchName={m.name} sportId={m.sportId} />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {matches.length === 0 && <TableRow><TableCell colSpan={3} align="center">No matches in the feed for this sport</TableCell></TableRow>}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}

// Controls for an activated match: Publish Data + casino + Fancy/Bookmaker/Toss.
function MatchFeatures({ matchId, matchName, sportId }: { matchId: number; matchName: string; sportId: string }) {
  const qc = useQueryClient()
  const { data: state, isLoading } = useQuery({
    queryKey: ['match-feature', matchId], queryFn: () => matchFeatureState(matchId),
  })
  const toggle = useMutation({
    mutationFn: ({ feature, on }: { feature: 'publish' | 'fancy' | 'bookmaker' | 'toss'; on: boolean }) =>
      toggleMatchFeature(matchId, feature, on),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['match-feature', matchId] }),
  })

  if (isLoading || !state) return <CircularProgress size={18} />

  const letterBtn = (label: string, feature: 'fancy' | 'bookmaker' | 'toss', on: boolean, color: 'success' | 'error') => (
    <Tooltip title={`${on ? 'Deactivate' : 'Activate'} ${label === 'F' ? 'Fancy' : label === 'B' ? 'Bookmaker' : 'Toss'}`}>
      <Button size="small" variant={on ? 'contained' : 'outlined'} color={color} sx={{ minWidth: 34, px: 1, fontWeight: 'bold' }}
        onClick={() => toggle.mutate({ feature, on: !on })}>{label}</Button>
    </Tooltip>
  )

  return (
    <Stack direction="row" spacing={0.5} alignItems="center" flexWrap="wrap" useFlexGap>
      <Chip size="small" label="Activated" color="success" variant="outlined" />
      <Button size="small" variant="contained" sx={{ bgcolor: '#1f2937', '&:hover': { bgcolor: '#374151' } }}
        onClick={() => toggle.mutate({ feature: 'publish', on: !state.isPublished })}>
        {state.isPublished ? 'Unpublish Data' : 'Publish Data'}
      </Button>
      <Tooltip title="Markets">
        <IconButton size="small" color="error" component={Link}
          to={`/super-duper-admin/manage-bet-fair?matchId=${matchId}&sportId=${sportId}&matchName=${encodeURIComponent(matchName)}`}>
          <CasinoIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      {letterBtn('F', 'fancy', state.hasFancy, 'success')}
      {letterBtn('B', 'bookmaker', state.hasBookmaker, 'success')}
      {letterBtn('T', 'toss', state.hasToss, 'error')}
    </Stack>
  )
}
