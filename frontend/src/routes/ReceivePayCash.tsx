import { useState } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import {
  Box, Breadcrumbs, Button, Card, CardContent, Divider, Grid, TextField, Typography,
} from '@mui/material'
import { walletTransaction } from '../lib/api'

// Doc §"Receive / Pay Cash" (recieve-pay-cash) — reached from the Agent Match
// Dashboard. By default it is informational (settlement is done from the
// Collection Report). When opened with direct=1 it exposes an editable amount +
// note and posts the cash movement directly.
export function ReceivePayCash() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const userId = Number(params.get('userId') ?? 0)
  const componentType = params.get('componentType') ?? 'receiveCash'
  const agentName = params.get('agentName') ?? ''
  const agentId = params.get('agentId') ?? ''
  const settlementAmount = Number(params.get('settlementAmount') ?? 0)
  const direct = params.get('direct') === '1'
  const isReceive = componentType === 'receiveCash'

  const [amount, setAmount] = useState(0)
  const [note, setNote] = useState('')
  const save = useMutation({
    mutationFn: () => walletTransaction({
      userId, amount, type: isReceive ? 'deposit' : 'withdraw', remark: note,
    }),
    onSuccess: () => navigate(`/super-duper-admin/user-dashboard?userId=${userId}`),
  })

  return (
    <Box>
      <Breadcrumbs sx={{ mb: 1 }}>
        <Link to="/super-duper-admin/users">Dashboard</Link>
        <Typography color="text.secondary">SC</Typography>
        <Typography color="text.secondary">{agentName}</Typography>
        <Typography color="text.primary">{isReceive ? 'Receive Cash' : 'Pay Cash'}</Typography>
      </Breadcrumbs>

      <Card>
        <CardContent>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
            {isReceive ? 'Receive Cash From User' : 'Pay Cash To User'}
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Grid container spacing={2} alignItems="center" sx={{ maxWidth: 720 }}>
            <Grid item xs={4} sm={3} sx={{ textAlign: 'right', fontWeight: 'bold' }}>Agent Name:</Grid>
            <Grid item xs={8} sm={9}><Typography color="text.secondary">{agentId} ({agentName})</Typography></Grid>

            <Grid item xs={4} sm={3} sx={{ textAlign: 'right', fontWeight: 'bold' }}>Rs. Exposure:</Grid>
            <Grid item xs={8} sm={9}>
              <Typography sx={{ color: settlementAmount < 0 ? '#cf222e' : '#1a7f37' }}>
                {settlementAmount}
              </Typography>
            </Grid>

            {direct && (
              <>
                <Grid item xs={4} sm={3} sx={{ textAlign: 'right', fontWeight: 'bold' }}>Update Ledger</Grid>
                <Grid item xs={8} sm={9}>
                  <TextField
                    size="small" type="number" fullWidth value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                  />
                </Grid>
              </>
            )}

            <Grid item xs={4} sm={3} sx={{ textAlign: 'right', fontWeight: 'bold', alignSelf: 'flex-start', pt: 1 }}>Note</Grid>
            <Grid item xs={8} sm={9}>
              {direct ? (
                <TextField size="small" multiline rows={3} fullWidth value={note}
                  onChange={(e) => setNote(e.target.value)} />
              ) : (
                <TextField size="small" multiline rows={3} fullWidth value="Go to collection report for settlement"
                  InputProps={{ readOnly: true }} />
              )}
            </Grid>

            {direct && (
              <Grid item xs={12} sx={{ textAlign: 'right' }}>
                <Button variant="contained" disabled={save.isPending || amount <= 0} onClick={() => save.mutate()}>
                  Save Changes
                </Button>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>
    </Box>
  )
}
