import { useState, useEffect, type ChangeEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Box, Breadcrumbs, Button, Card, CardContent, Divider, Grid, MenuItem, Stack, TextField, Typography, Alert,
} from '@mui/material'
import {
  getMe, createChild, listDomains, usernameAvailable, type CreateCompanyInput,
} from '../lib/api'
import { useAuth } from '../store/auth'
import { roleName, ROLE_LABEL, creatableRoles } from '../lib/roles'

const emptyInput: CreateCompanyInput = {
  username: '', masterName: '', password: '', deposit: 0,
  allowDepositWithdraw: false, isPartnership: true,
  sportsValue: 0, casinoValue: 0, commission: 0, sessionCommission: 0,
  rollingCommission: 0, fancyRollingCommission: 0,
  reference: '', createNoOfChild: 1000000, allowBetDelete: false,
  allowResultDeclare: false, allowResultRevoke: false, casinoLimit: 0, remarks: '', phone: '',
}

// Full-page Create-Company/Create-Child form (doc "Create Company"): fix-limit
// deposit loaned from the parent, partnership shares with live "My Share"
// computation, parent-bounded commissions, and SDA-only "Other Details".
export function CreateClient() {
  const qc = useQueryClient()
  const navigate = useNavigate()
  // Live profile — the auth store snapshot can be stale (e.g. after a top-up).
  const stored = useAuth((s) => s.user)
  const { data: me } = useQuery({ queryKey: ['me'], queryFn: getMe })
  const c = me ?? stored
  const isSDA = c?.usetype === 0
  const reserve = 0 // no casino reserve — casino splits 100/0 like match
  const roles = c ? creatableRoles(c.usetype) : []

  const [form, setForm] = useState<CreateCompanyInput>(emptyInput)
  const [error, setError] = useState('')
  // The tier to create — defaults to the first creatable role once it loads.
  const [typeId, setTypeId] = useState(0)
  useEffect(() => { if (!typeId && roles.length) setTypeId(roles[0]) }, [roles, typeId])
  const role = typeId ? (ROLE_LABEL[typeId] ?? roleName(typeId)) : ''

  const { data: domains = [] } = useQuery({
    queryKey: ['domains'], queryFn: () => listDomains().then((r) => r ?? []), enabled: !!isSDA,
  })

  // Live username availability (debounced).
  const [debounced, setDebounced] = useState('')
  useEffect(() => {
    const t = setTimeout(() => setDebounced(form.username.trim()), 400)
    return () => clearTimeout(t)
  }, [form.username])
  const { data: avail, isFetching: checkingName } = useQuery({
    queryKey: ['uname', debounced], queryFn: () => usernameAvailable(debounced), enabled: debounced.length >= 3,
  })
  const nameChecked = debounced.length >= 3 && debounced === form.username.trim()
  const nameTaken = nameChecked && avail?.available === false

  const mutation = useMutation({
    mutationFn: () => createChild({ ...form, typeId }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['children'] }); navigate('/super-duper-admin/users') },
    onError: (err: unknown) => setError(getMessage(err) ?? 'Failed to create user'),
  })

  const num = (k: keyof CreateCompanyInput) => (e: ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: Number(e.target.value) })
  const str = (k: keyof CreateCompanyInput) => (e: ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: e.target.value })
  const bool = (k: keyof CreateCompanyInput) => (e: ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: e.target.value === 'yes' })

  const baseCricket = isSDA ? 100 : (c?.partnerCricket ?? 0)
  const baseCasino = isSDA ? 100 : (c?.partnerCasino ?? 0)
  const myMatch = baseCricket - form.sportsValue
  const myCasino = baseCasino - form.casinoValue - reserve
  const invalid =
    !form.username || !form.password || nameTaken || checkingName ||
    form.deposit < 0 || form.deposit > (c?.balance ?? 0) ||
    (form.isPartnership && (form.sportsValue < 0 || form.sportsValue > baseCricket ||
      form.casinoValue < 0 || form.casinoValue > baseCasino - reserve)) ||
    form.rollingCommission > (c?.rollingCommission ?? 0) ||
    form.fancyRollingCommission > (c?.fancyRollingCommission ?? 0) ||
    form.commission > (c?.commission ?? 0) || form.sessionCommission > (c?.sessionComm ?? 0)

  const yesNo = (label: string, k: keyof CreateCompanyInput) => (
    <Grid item xs={12} sm={6} md={4}>
      <TextField select fullWidth label={label} value={(form[k] as boolean) ? 'yes' : 'no'} onChange={bool(k)}>
        <MenuItem value="yes">Yes</MenuItem>
        <MenuItem value="no">No</MenuItem>
      </TextField>
    </Grid>
  )

  if (!roles.length) {
    return (
      <Box>
        <Typography variant="h5" gutterBottom>Create</Typography>
        <Alert severity="info">This account ({c ? roleName(c.usetype) : ''}) does not create downline users.</Alert>
      </Box>
    )
  }

  return (
    <Box>
      <Breadcrumbs sx={{ mb: 1 }}>
        <Link to="/super-duper-admin/users">Manage Clients</Link>
        <Typography color="text.primary">Create {role}</Typography>
      </Breadcrumbs>
      <Typography variant="h5" gutterBottom>Create {role}</Typography>

      <Card>
        <CardContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Grid container spacing={2}>
            {roles.length > 1 && (
              <Grid item xs={12} sm={6} md={4}>
                <TextField select fullWidth label="Type (level to create)" value={typeId || ''}
                  onChange={(e) => setTypeId(Number(e.target.value))}>
                  {roles.map((r) => <MenuItem key={r} value={r}>{ROLE_LABEL[r] ?? roleName(r)}</MenuItem>)}
                </TextField>
              </Grid>
            )}
            <Grid item xs={12} sm={6} md={4}>
              <TextField fullWidth required label="User Name" value={form.username} onChange={str('username')}
                error={nameTaken}
                helperText={checkingName ? 'Checking…' : nameTaken ? 'Username already exists.' : (nameChecked && avail?.available) ? 'Username available.' : ''} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}><TextField fullWidth required label="Name" value={form.masterName} onChange={str('masterName')} /></Grid>
            <Grid item xs={12} sm={6} md={4}><TextField fullWidth required type="password" label="Password" value={form.password} onChange={str('password')} /></Grid>

            <Grid item xs={12} sm={6} md={4}>
              <TextField fullWidth required type="number" label="Fix Limit (deposit)" value={form.deposit} onChange={num('deposit')}
                error={form.deposit < 0 || form.deposit > (c?.balance ?? 0)}
                helperText={
                  form.deposit > (c?.balance ?? 0)
                    ? `Cannot exceed your balance (${(c?.balance ?? 0).toFixed(2)})`
                    : `0 to ${(c?.balance ?? 0).toFixed(2)} (loaned from your balance)`
                }
                inputProps={{ min: 0, max: c?.balance ?? 0, step: 100 }} />
            </Grid>
            {yesNo('Deposit Withdraw', 'allowDepositWithdraw')}
            {yesNo('With Partnership?', 'isPartnership')}

            {form.isPartnership && <>
              <Grid item xs={12}><Divider><Typography variant="caption">Partnership Shares</Typography></Divider></Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField fullWidth required type="number" label="My Match Share" value={myMatch}
                  onChange={(e) => setForm({ ...form, sportsValue: baseCricket - Number(e.target.value) })}
                  helperText={`0 to ${baseCricket}`} />
              </Grid>
              <Grid item xs={12} sm={6} md={3}><TextField fullWidth disabled label="Company Match Share" value={form.sportsValue} /></Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField fullWidth required type="number" label="My Casino Share" value={myCasino}
                  onChange={(e) => setForm({ ...form, casinoValue: baseCasino - reserve - Number(e.target.value) })}
                  helperText={`0 to ${baseCasino - reserve}`} />
              </Grid>
              <Grid item xs={12} sm={6} md={3}><TextField fullWidth disabled label="Company Casino Share" value={form.casinoValue} /></Grid>
            </>}

            <Grid item xs={12}><Divider><Typography variant="caption">Commission</Typography></Divider></Grid>
            {(c?.commission ?? 0) > 0 && (
              <Grid item xs={12} sm={6} md={4}><TextField fullWidth type="number" label="Odds Commission" value={form.commission} onChange={num('commission')} helperText={`max ${c?.commission}`} /></Grid>
            )}
            {(c?.sessionComm ?? 0) > 0 && (
              <Grid item xs={12} sm={6} md={4}><TextField fullWidth type="number" label="Session Commission" value={form.sessionCommission} onChange={num('sessionCommission')} helperText={`max ${c?.sessionComm}`} /></Grid>
            )}
            <Grid item xs={12} sm={6} md={4}><TextField fullWidth type="number" label="Company Match Commission" value={form.rollingCommission} onChange={num('rollingCommission')} helperText={`0 to ${c?.rollingCommission ?? 0}`} /></Grid>
            <Grid item xs={12} sm={6} md={4}><TextField fullWidth type="number" label="Company Session Commission" value={form.fancyRollingCommission} onChange={num('fancyRollingCommission')} helperText={`0 to ${c?.fancyRollingCommission ?? 0}`} /></Grid>

            {isSDA && <>
              <Grid item xs={12}><Divider><Typography variant="caption">Other Details</Typography></Divider></Grid>
              <Grid item xs={12} sm={6} md={4}><TextField fullWidth label="Reference" value={form.reference} onChange={str('reference')} /></Grid>
              <Grid item xs={12} sm={6} md={4}><TextField fullWidth type="number" label="No. of Users" value={form.createNoOfChild} onChange={num('createNoOfChild')} inputProps={{ min: 1 }} /></Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField select fullWidth required label="Select Web Site" value={form.domainId ?? ''}
                  onChange={(e) => setForm({ ...form, domainId: Number(e.target.value) })}>
                  {domains.map((d) => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
                </TextField>
              </Grid>
              {yesNo('Allow Bet Delete', 'allowBetDelete')}
              {yesNo('Allow Result Declare', 'allowResultDeclare')}
              {yesNo('Allow Result Rollback', 'allowResultRevoke')}
              <Grid item xs={12} sm={6} md={4}><TextField fullWidth type="number" label="Casino Limit" value={form.casinoLimit} onChange={num('casinoLimit')} inputProps={{ min: 1 }} /></Grid>
              <Grid item xs={12}><TextField fullWidth multiline minRows={2} label="Remark" value={form.remarks} onChange={str('remarks')} /></Grid>
            </>}
          </Grid>

          <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 3 }}>
            <Button onClick={() => navigate('/super-duper-admin/users')}>Cancel</Button>
            <Button variant="contained" disabled={mutation.isPending || invalid}
              onClick={() => { setError(''); mutation.mutate() }}>
              {mutation.isPending ? 'Saving…' : `Create ${role}`}
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  )
}

function getMessage(err: unknown): string | undefined {
  if (typeof err === 'object' && err && 'response' in err) {
    return (err as { response?: { data?: { error?: string } } }).response?.data?.error
  }
  return undefined
}
