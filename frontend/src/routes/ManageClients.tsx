import { useState, useEffect, useMemo, type ChangeEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Box, Button, Card, CardContent, Dialog, DialogActions, DialogContent, DialogTitle,
  Divider, Grid, MenuItem, Stack, Tab, Table, TableBody, TableCell, TableHead,
  TableRow, Tabs, TextField, Typography, Alert,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import LockIcon from '@mui/icons-material/Lock'
import LockOpenIcon from '@mui/icons-material/LockOpen'
import KeyIcon from '@mui/icons-material/VpnKey'
import {
  listChildren, listChildrenOf, getUser, getMe, walletTransaction, setLocks, resetUserPassword,
  updateCommission, updateAccount, updateProfileFields, addCasinoLimit, usernameAvailable,
  createSuperAdmin, type CreateSuperAdminInput, type User,
} from '../lib/api'
import { useAuth } from '../store/auth'
import { childRoleName, roleName, creatableRoles } from '../lib/roles'
import { SportBlockDialog, SportLimitDialog, PokerBlockDialog } from '../components/RestrictionDialogs'

// Reference role labels (getRole in users.component.ts) â€” used for the section
// headers and the Agent Type column so the page reads like the original.
const REF_LABEL: Record<number, string> = {
  11: 'Company', 10: 'Admin', 9: 'Sub Admin', 8: 'Super Stockist', 1: 'Stockist', 2: 'Dealer', 3: 'User',
}
// Hierarchy topâ†’bottom; a context user's downline roles are everything below it.
const ORDER = [11, 10, 9, 8, 1, 2, 3]

// Action callbacks handed to each RoleSection row (own-view only).
type RowActions = {
  onTxn: (u: User, type: 'deposit' | 'withdraw') => void
  onEdit: (u: User) => void
  onPwd: (u: User) => void
  onShare: (u: User, kind: 'my' | 'agent') => void
  onSB: (u: User) => void
  onSL: (u: User) => void
  onPB: (u: User) => void
  onUserLock: (u: User) => void
  onBetLock: (u: User) => void
}

// Doc Â§2 generalized â€” Manage Clients for ANY tier. Opened plainly it lists the
// logged-in user's direct downline (with management actions). Opened from a
// Client Dashboard "Direct Agents/Client" button (userId + category) it shows
// that user's downline grouped into role sections, matching the reference.
export function ManageClients() {
  const qc = useQueryClient()
  const user = useAuth((s) => s.user)
  const [params] = useSearchParams()
  const viewUserId = Number(params.get('userId') ?? 0) || null
  const category = (params.get('category') ?? '').toLowerCase() // 'agent' | 'client' | ''

  const { data: viewUser } = useQuery({
    queryKey: ['user', viewUserId], queryFn: () => getUser(viewUserId!), enabled: !!viewUserId,
  })
  const ctxUsetype = viewUserId ? viewUser?.usetype : user?.usetype
  const childRole = ctxUsetype !== undefined ? childRoleName(ctxUsetype) : null
  const myRole = ctxUsetype !== undefined ? roleName(ctxUsetype) : ''

  const [openSA, setOpenSA] = useState(false)
  const [txnTarget, setTxnTarget] = useState<{ user: User; type: 'deposit' | 'withdraw' } | null>(null)
  const [pwdTarget, setPwdTarget] = useState<User | null>(null)
  const [editTarget, setEditTarget] = useState<User | null>(null)
  const [sbTarget, setSbTarget] = useState<User | null>(null)
  const [slTarget, setSlTarget] = useState<User | null>(null)
  const [pbTarget, setPbTarget] = useState<User | null>(null)
  const [shareTarget, setShareTarget] = useState<{ user: User; kind: 'my' | 'agent' } | null>(null)
  const [betLockConfirm, setBetLockConfirm] = useState<User | null>(null)
  const [userLockConfirm, setUserLockConfirm] = useState<User | null>(null)

  // One fetch of the downline; each section filters it locally by search/status.
  const { data: children = [] } = useQuery({
    queryKey: ['children', viewUserId],
    queryFn: () => (viewUserId ? listChildrenOf(viewUserId) : listChildren()).then((r) => r ?? []),
  })

  const lockMutation = useMutation({
    mutationFn: ({ id, ...locks }: { id: number; userLock?: boolean; betLock?: boolean }) => setLocks(id, locks),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['children'] }),
  })

  // Which role sections to render. The own view shows just the single role this
  // user creates; the category view shows every descendant role (agent excludes
  // clients, client shows only clients) â€” exactly like the reference.
  const sectionRoles = useMemo(() => {
    if (ctxUsetype === undefined) return []
    // Own view: a section per tier this user may create (Company → Admin … User).
    if (!viewUserId) {
      return creatableRoles(ctxUsetype)
    }
    // Category view: every descendant role, filtered by Direct Agents/Client.
    const below = ORDER.slice(ORDER.indexOf(ctxUsetype) + 1)
    if (category === 'agent') return below.filter((r) => r !== 3)
    if (category === 'client') return below.filter((r) => r === 3)
    return below
  }, [ctxUsetype, viewUserId, category])

  const byRole = useMemo(() => {
    const m: Record<number, User[]> = {}
    for (const c of children) (m[c.usetype] ??= []).push(c)
    return m
  }, [children])

  const actions: RowActions = {
    onTxn: (u, type) => setTxnTarget({ user: u, type }),
    onEdit: (u) => setEditTarget(u),
    onPwd: (u) => setPwdTarget(u),
    onShare: (u, kind) => setShareTarget({ user: u, kind }),
    onSB: (u) => setSbTarget(u),
    onSL: (u) => setSlTarget(u),
    onPB: (u) => setPbTarget(u),
    onUserLock: (u) => setUserLockConfirm(u), // confirm before locking/unlocking the user
    onBetLock: (u) => setBetLockConfirm(u), // confirm before locking/unlocking bets
  }

  if (!childRole) {
    return (
      <Box>
        <Typography variant="h5" gutterBottom>Manage Clients</Typography>
        <Alert severity="info">This account ({myRole}) does not create downline users.</Alert>
      </Box>
    )
  }

  return (
    <Box>
      <Stack direction="row" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ flexGrow: 1 }}>
          {viewUserId ? `${viewUser?.mstruserid ?? ''} â€” Manage Clients` : 'Manage Clients'}
        </Typography>
        {!viewUserId && user?.usetype === 0 && (
          <Button variant="outlined" startIcon={<AddIcon />} sx={{ mr: 1 }} onClick={() => setOpenSA(true)}>Create Super Admin</Button>
        )}
        {!viewUserId && (
          <Button variant="contained" startIcon={<AddIcon />} component={Link} to="/super-duper-admin/create-company">Create</Button>
        )}
      </Stack>

      {sectionRoles.map((role) => (
        <RoleSection
          key={role}
          title={category === 'client' ? 'All Users' : (REF_LABEL[role] ?? roleName(role))}
          rows={byRole[role] ?? []}
          showActions={!viewUserId}
          actions={actions}
        />
      ))}

      {openSA && (
        <CreateSuperAdminDialog onClose={() => setOpenSA(false)}
          onCreated={() => { setOpenSA(false); qc.invalidateQueries({ queryKey: ['children'] }) }} />
      )}
      {txnTarget && (
        <TransactionDialog target={txnTarget} onClose={() => setTxnTarget(null)}
          onDone={() => { setTxnTarget(null); qc.invalidateQueries({ queryKey: ['children'] }) }} />
      )}
      {pwdTarget && <PasswordDialog user={pwdTarget} onClose={() => setPwdTarget(null)} onDone={() => setPwdTarget(null)} />}
      {editTarget && (
        <AccountDialog user={editTarget} onClose={() => setEditTarget(null)}
          onDone={() => { qc.invalidateQueries({ queryKey: ['children'] }); qc.invalidateQueries({ queryKey: ['user', editTarget.id] }) }} />
      )}
      {shareTarget && <ShareDialog user={shareTarget.user} kind={shareTarget.kind} onClose={() => setShareTarget(null)} />}
      {userLockConfirm && (
        <Dialog open onClose={() => setUserLockConfirm(null)} maxWidth="xs" fullWidth>
          <DialogTitle>{userLockConfirm.userLock ? 'Unlock User' : 'Lock User'}</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to {userLockConfirm.userLock ? 'unlock' : 'lock'} user{' '}
              <b>{userLockConfirm.mstruserid}</b>?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setUserLockConfirm(null)}>Cancel</Button>
            <Button variant="contained" color="error" disabled={lockMutation.isPending}
              onClick={() => { lockMutation.mutate({ id: userLockConfirm.id, userLock: !userLockConfirm.userLock }); setUserLockConfirm(null) }}>
              {userLockConfirm.userLock ? 'Unlock' : 'Lock'}
            </Button>
          </DialogActions>
        </Dialog>
      )}
      {betLockConfirm && (
        <Dialog open onClose={() => setBetLockConfirm(null)} maxWidth="xs" fullWidth>
          <DialogTitle>{betLockConfirm.betLock ? 'Unlock Bet' : 'Lock Bet'}</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to {betLockConfirm.betLock ? 'unlock' : 'lock'} bet for{' '}
              <b>{betLockConfirm.mstruserid}</b>?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setBetLockConfirm(null)}>Cancel</Button>
            <Button variant="contained" color="error" disabled={lockMutation.isPending}
              onClick={() => { lockMutation.mutate({ id: betLockConfirm.id, betLock: !betLockConfirm.betLock }); setBetLockConfirm(null) }}>
              {betLockConfirm.betLock ? 'Unlock' : 'Lock'}
            </Button>
          </DialogActions>
        </Dialog>
      )}
      {sbTarget && <SportBlockDialog user={sbTarget} onClose={() => setSbTarget(null)} onDone={() => setSbTarget(null)} />}
      {slTarget && <SportLimitDialog user={slTarget} onClose={() => setSlTarget(null)} onDone={() => setSlTarget(null)} />}
      {pbTarget && <PokerBlockDialog user={pbTarget} onClose={() => setPbTarget(null)} onDone={() => setPbTarget(null)} />}
    </Box>
  )
}

const money = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const plColor = (n: number) => (n < 0 ? '#cf222e' : n > 0 ? '#1a7f37' : undefined)

// One role group: header, status dropdown + search, and the reference column set
// (User Name Â· PL Â· New PL Â· Exposure Â· Balance Â· Agent Type Â· My Share Â· Agent share).
function RoleSection(props: { title: string; rows: User[]; showActions: boolean; actions: RowActions }) {
  const [status, setStatus] = useState<'active' | 'inactive' | 'all'>('active')
  const [search, setSearch] = useState('')

  const rows = props.rows.filter((r) => {
    if (status === 'active' && (!r.status || r.userLock)) return false
    if (status === 'inactive' && r.status && !r.userLock) return false
    if (search) {
      const q = search.toLowerCase()
      if (!r.mstruserid.toLowerCase().includes(q) && !r.mstrname.toLowerCase().includes(q)) return false
    }
    return true
  })
  const colSpan = props.showActions ? 8 : 7
  const darkBtn = { bgcolor: '#1f2937', color: '#fff', minWidth: 40, '&:hover': { bgcolor: '#374151' } }
  const tealBtn = { bgcolor: '#0d9488', color: '#fff', '&:hover': { bgcolor: '#0f766e' } }

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>{props.title}</Typography>
        <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
          <TextField select size="small" value={status} onChange={(e) => setStatus(e.target.value as typeof status)} sx={{ minWidth: 140 }}>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
            <MenuItem value="all">All</MenuItem>
          </TextField>
          <TextField size="small" placeholder="Search" value={search} onChange={(e) => setSearch(e.target.value)} />
        </Stack>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>User Name</TableCell>
              <TableCell align="right">PL</TableCell>
              <TableCell align="right">New PL</TableCell>
              <TableCell align="right">Exposure</TableCell>
              <TableCell align="right">Balance</TableCell>
              <TableCell>Agent Type</TableCell>
              <TableCell align="center">My/Agent share</TableCell>
              {props.showActions && <TableCell>Action</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((c) => (
              <TableRow key={c.id} hover sx={{ bgcolor: c.userLock ? '#fff5f5' : undefined }}>
                <TableCell>
                  <Link to={`/super-duper-admin/user-dashboard?userId=${c.id}`}>{c.mstruserid} ( {c.mstrname} )</Link>
                </TableCell>
                <TableCell align="right" sx={{ color: plColor(c.p_l) }}>{money(c.p_l)}</TableCell>
                <TableCell align="right" sx={{ color: plColor(c.pl) }}>{money(c.pl)}</TableCell>
                <TableCell align="right" sx={{ color: plColor(c.exposure) }}>{money(c.exposure)}</TableCell>
                <TableCell align="right">{money(c.balance)}</TableCell>
                <TableCell>{REF_LABEL[c.usetype] ?? roleName(c.usetype)}</TableCell>
                <TableCell align="center">
                  <Stack spacing={0.5} sx={{ minWidth: 120 }}>
                    <Button size="small" variant="contained" sx={tealBtn} onClick={() => props.actions.onShare(c, 'my')}>My Share</Button>
                    <Button size="small" variant="contained" color="info" onClick={() => props.actions.onShare(c, 'agent')}>Agent share</Button>
                  </Stack>
                </TableCell>
                {props.showActions && (
                  <TableCell>
                    <Stack spacing={0.5} sx={{ minWidth: 250 }}>
                      <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                        <Button size="small" variant="contained" color="success" onClick={() => props.actions.onTxn(c, 'deposit')}>D</Button>
                        <Button size="small" variant="contained" color="error" onClick={() => props.actions.onTxn(c, 'withdraw')}>W</Button>
                        <Button size="small" variant="contained" color="info" onClick={() => props.actions.onEdit(c)}>Edit</Button>
                        <Button size="small" variant="contained" sx={darkBtn} onClick={() => props.actions.onSB(c)}>SB</Button>
                        <Button size="small" variant="contained" sx={darkBtn} onClick={() => props.actions.onSL(c)}>SL</Button>
                        <Button size="small" variant="contained" sx={darkBtn} onClick={() => props.actions.onPB(c)}>PB</Button>
                      </Stack>
                      <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                        <Button size="small" variant="contained" sx={tealBtn} startIcon={c.userLock ? <LockOpenIcon /> : <LockIcon />}
                          onClick={() => props.actions.onUserLock(c)}>{c.userLock ? 'User Unlock' : 'User Lock'}</Button>
                        <Button size="small" variant="contained" color="error" startIcon={c.betLock ? <LockOpenIcon /> : <LockIcon />}
                          onClick={() => props.actions.onBetLock(c)}>{c.betLock ? 'Bet Unlock' : 'Bet Lock'}</Button>
                        <Button size="small" variant="contained" color="info" startIcon={<KeyIcon />}
                          onClick={() => props.actions.onPwd(c)}>PWD</Button>
                      </Stack>
                    </Stack>
                  </TableCell>
                )}
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow><TableCell colSpan={colSpan} align="center">No Data Available</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

export function PasswordDialog(props: { user: User; onClose: () => void; onDone: () => void }) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const mismatch = confirm.length > 0 && confirm !== password
  const mutation = useMutation({ mutationFn: () => resetUserPassword(props.user.id, password), onSuccess: props.onDone })
  return (
    <Dialog open onClose={props.onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Change Password â€” {props.user.mstruserid}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField fullWidth type="password" label="New Password" value={password}
            onChange={(e) => setPassword(e.target.value)} />
          <TextField fullWidth type="password" label="Confirm Password" value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            error={mismatch} helperText={mismatch ? 'Passwords do not match' : ''} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={props.onClose}>Cancel</Button>
        <Button variant="contained" disabled={mutation.isPending || password.length < 4 || password !== confirm}
          onClick={() => mutation.mutate()}>Save</Button>
      </DialogActions>
    </Dialog>
  )
}

// Account dialog (doc clients-list "viewAccount"): Profile + Additional Info +
// Partnership/Commission edit (maps to reference updateAccount + updateComm).
export function EditCommissionDialog(props: { user: User; onClose: () => void; onDone: () => void }) {
  const u = props.user
  const [name, setName] = useState(u.mstrname)
  const [phone, setPhone] = useState(u.phone ?? '')
  const [form, setForm] = useState({
    partnerCricket: u.partnerCricket, partnerCasino: u.partnerCasino, commission: u.commission,
    rollingCommission: u.rollingCommission, sessionComm: u.sessionComm, creditLimit: u.creditLimit,
  })
  const num = (k: keyof typeof form) => (e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: Number(e.target.value) })
  const mutation = useMutation({
    mutationFn: async () => { await updateAccount(u.id, { name, phone }); await updateCommission(u.id, form) },
    onSuccess: props.onDone,
  })
  const info: [string, string][] = [
    ['Balance', u.balance.toFixed(2)],
    ['Exposure', u.settlementAmount.toFixed(2)],
    ['Profit / Loss', u.p_l.toFixed(2)],
    ['Agent Type', u.usetype === 0 ? 'Super Duper Admin' : String(u.usetype)],
  ]
  return (
    <Dialog open onClose={props.onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Account of {u.mstruserid}</DialogTitle>
      <DialogContent>
        <Divider sx={{ mb: 1 }}><Typography variant="caption">Profile</Typography></Divider>
        <Grid container spacing={2}>
          <Grid item xs={6}><TextField fullWidth label="Name" value={name} onChange={(e) => setName(e.target.value)} /></Grid>
          <Grid item xs={6}><TextField fullWidth label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} /></Grid>
        </Grid>
        <Divider sx={{ my: 1.5 }}><Typography variant="caption">Additional Information</Typography></Divider>
        <Grid container spacing={1}>
          {info.map(([k, v]) => (
            <Grid item xs={6} sm={3} key={k}>
              <Typography variant="caption" color="text.secondary">{k}</Typography>
              <Typography variant="body2">{v}</Typography>
            </Grid>
          ))}
        </Grid>
        <Divider sx={{ my: 1.5 }}><Typography variant="caption">Partnership &amp; Commission</Typography></Divider>
        <Grid container spacing={2}>
          <Grid item xs={6}><TextField fullWidth type="number" label="Match Share %" value={form.partnerCricket} onChange={num('partnerCricket')} /></Grid>
          <Grid item xs={6}><TextField fullWidth type="number" label="Casino Share %" value={form.partnerCasino} onChange={num('partnerCasino')} /></Grid>
          <Grid item xs={6}><TextField fullWidth type="number" label="Match Commission" value={form.commission} onChange={num('commission')} /></Grid>
          <Grid item xs={6}><TextField fullWidth type="number" label="Session Commission" value={form.sessionComm} onChange={num('sessionComm')} /></Grid>
          <Grid item xs={6}><TextField fullWidth type="number" label="Credit Limit" value={form.creditLimit} onChange={num('creditLimit')} /></Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={props.onClose}>Cancel</Button>
        <Button variant="contained" disabled={mutation.isPending || !name} onClick={() => mutation.mutate()}>Save Changes</Button>
      </DialogActions>
    </Dialog>
  )
}

export function TransactionDialog(props: {
  target: { user: User; type: 'deposit' | 'withdraw' }; onClose: () => void; onDone: () => void
}) {
  const { user, type } = props.target
  const [amount, setAmount] = useState(0)
  const [remark, setRemark] = useState('')
  const [error, setError] = useState('')
  // Live balances â€” table rows can be stale. Parent Chips = the logged-in user
  // (the one moving chips); User Chips/Balance = the target user.
  const { data: me } = useQuery({ queryKey: ['me'], queryFn: getMe })
  const { data: fresh } = useQuery({ queryKey: ['user', user.id], queryFn: () => getUser(user.id) })
  const parentChips = me?.balance ?? 0
  const userChips = fresh?.balance ?? user.balance
  const mutation = useMutation({
    mutationFn: () => walletTransaction({ userId: user.id, amount, type, remark }),
    onSuccess: props.onDone,
    onError: (err: unknown) => setError(getMessage(err) ?? 'Transaction failed'),
  })
  return (
    <Dialog open onClose={props.onClose} maxWidth="xs" fullWidth>
      <DialogTitle>A/C Chips In/Out â€” {user.mstruserid}</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField label="Parent Chips" value={parentChips.toFixed(2)} disabled />
          <TextField label="User Chips/Balance" value={userChips.toFixed(2)} disabled />
          <TextField label={`Amount (Chips) â€” ${type === 'deposit' ? 'Deposit' : 'Withdraw'}`} type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
          <TextField label="Remark" value={remark} onChange={(e) => setRemark(e.target.value)} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={props.onClose}>Cancel</Button>
        <Button variant="contained" disabled={mutation.isPending || amount <= 0}
          onClick={() => { setError(''); mutation.mutate() }}>
          {mutation.isPending ? 'Savingâ€¦' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

const emptySA: CreateSuperAdminInput = {
  username: '', masterName: '', password: '', balance: 0, creditLimit: 0,
  sportsValue: 100, casinoValue: 100, commission: 0, sessionCommission: 0,
  rollingCommission: 0, fancyRollingCommission: 0, casinoLimit: 0, createNoOfChild: 1000000,
  phone: '', reference: '', remarks: '',
  allowDepositWithdraw: true, allowBetDelete: true, allowResultDeclare: true, allowResultRevoke: true,
}

// SDA-only: create another independent Super Duper Admin with a full profile â€”
// balance is granted directly (a new root tree), shares default to 100.
function CreateSuperAdminDialog(props: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState<CreateSuperAdminInput>(emptySA)
  const [error, setError] = useState('')

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
    mutationFn: () => createSuperAdmin(form),
    onSuccess: () => { setForm(emptySA); props.onCreated() },
    onError: (err: unknown) => setError(getMessage(err) ?? 'Failed to create super admin'),
  })

  const num = (k: keyof CreateSuperAdminInput) => (e: ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: Number(e.target.value) })
  const str = (k: keyof CreateSuperAdminInput) => (e: ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: e.target.value })
  const bool = (k: keyof CreateSuperAdminInput) => (e: ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: e.target.value === 'yes' })

  const invalid = !form.username || !form.password || nameTaken || checkingName ||
    form.balance < 0 || form.creditLimit < 0 ||
    form.sportsValue < 0 || form.sportsValue > 100 || form.casinoValue < 0 || form.casinoValue > 100

  const yesNo = (label: string, k: keyof CreateSuperAdminInput) => (
    <Grid item xs={6}>
      <TextField select fullWidth label={label} value={(form[k] as boolean) ? 'yes' : 'no'} onChange={bool(k)}>
        <MenuItem value="yes">Yes</MenuItem>
        <MenuItem value="no">No</MenuItem>
      </TextField>
    </Grid>
  )

  return (
    <Dialog open onClose={props.onClose} maxWidth="md" fullWidth>
      <DialogTitle>Create Super Duper Admin</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Grid container spacing={2} sx={{ mt: 0 }}>
          <Grid item xs={6}>
            <TextField fullWidth required label="User Name" value={form.username} onChange={str('username')}
              error={nameTaken}
              helperText={checkingName ? 'Checkingâ€¦' : nameTaken ? 'Username already exists.' : (nameChecked && avail?.available) ? 'Username available.' : ''} />
          </Grid>
          <Grid item xs={6}><TextField fullWidth required label="Name" value={form.masterName} onChange={str('masterName')} /></Grid>
          <Grid item xs={6}><TextField fullWidth required type="password" label="Password" value={form.password} onChange={str('password')} /></Grid>
          <Grid item xs={6}><TextField fullWidth type="tel" label="Phone" value={form.phone} onChange={str('phone')} /></Grid>

          <Grid item xs={12}><Divider><Typography variant="caption">Balance &amp; Limits</Typography></Divider></Grid>
          <Grid item xs={6}><TextField fullWidth required type="number" label="Balance (Coins)" value={form.balance} onChange={num('balance')} helperText="Granted to the new root admin" /></Grid>
          <Grid item xs={6}><TextField fullWidth type="number" label="Credit Limit" value={form.creditLimit} onChange={num('creditLimit')} /></Grid>
          <Grid item xs={6}><TextField fullWidth type="number" label="Casino Limit" value={form.casinoLimit} onChange={num('casinoLimit')} /></Grid>
          <Grid item xs={6}><TextField fullWidth type="number" label="No. of Users" value={form.createNoOfChild} onChange={num('createNoOfChild')} inputProps={{ min: 1 }} /></Grid>

          <Grid item xs={12}><Divider><Typography variant="caption">Partnership &amp; Commission</Typography></Divider></Grid>
          <Grid item xs={6}><TextField fullWidth type="number" label="My Match Share" value={form.sportsValue} onChange={num('sportsValue')} helperText="0 to 100" /></Grid>
          <Grid item xs={6}><TextField fullWidth type="number" label="My Casino Share" value={form.casinoValue} onChange={num('casinoValue')} helperText="0 to 100" /></Grid>
          <Grid item xs={6}><TextField fullWidth type="number" label="Odds Commission" value={form.commission} onChange={num('commission')} /></Grid>
          <Grid item xs={6}><TextField fullWidth type="number" label="Session Commission" value={form.sessionCommission} onChange={num('sessionCommission')} /></Grid>
          <Grid item xs={6}><TextField fullWidth type="number" label="Match Commission" value={form.rollingCommission} onChange={num('rollingCommission')} /></Grid>
          <Grid item xs={6}><TextField fullWidth type="number" label="Session (Fancy) Commission" value={form.fancyRollingCommission} onChange={num('fancyRollingCommission')} /></Grid>

          <Grid item xs={12}><Divider><Typography variant="caption">Permissions</Typography></Divider></Grid>
          {yesNo('Deposit Withdraw', 'allowDepositWithdraw')}
          {yesNo('Allow Bet Delete', 'allowBetDelete')}
          {yesNo('Allow Result Declare', 'allowResultDeclare')}
          {yesNo('Allow Result Rollback', 'allowResultRevoke')}
          <Grid item xs={6}><TextField fullWidth label="Reference" value={form.reference} onChange={str('reference')} /></Grid>
          <Grid item xs={12}><TextField fullWidth multiline minRows={2} label="Remark" value={form.remarks} onChange={str('remarks')} /></Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={props.onClose}>Cancel</Button>
        <Button variant="contained" disabled={mutation.isPending || invalid}
          onClick={() => { setError(''); mutation.mutate() }}>
          {mutation.isPending ? 'Savingâ€¦' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// "Account Of <user>" dialog â€” two tabs matching the reference: Casino Limit
// (current + add) and Edit Profile (name, user id, no. of users, remark).
function AccountDialog(props: { user: User; onClose: () => void; onDone: () => void }) {
  const u = props.user
  const [tab, setTab] = useState(0)
  const { data: fresh } = useQuery({ queryKey: ['user', u.id], queryFn: () => getUser(u.id) })
  const cur = fresh ?? u

  // Casino Limit tab
  const [addLimit, setAddLimit] = useState(0)
  const casinoMut = useMutation({
    mutationFn: () => addCasinoLimit(u.id, addLimit),
    onSuccess: () => { setAddLimit(0); props.onDone() },
  })

  // Edit Profile tab
  const [name, setName] = useState(u.mstrname)
  const [noOfChild, setNoOfChild] = useState(u.createNoOfChild)
  const [remark, setRemark] = useState(u.remarks ?? '')
  const profileMut = useMutation({
    mutationFn: () => updateProfileFields(u.id, { name, noOfChild, remark }),
    onSuccess: props.onDone,
  })

  return (
    <Dialog open onClose={props.onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Account Of {u.mstruserid}</DialogTitle>
      <DialogContent>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
          <Tab label="Casino Limit" />
          <Tab label="Edit Profile" />
        </Tabs>

        {tab === 0 && (
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Current Casino Limit" value={(cur.casinoLimit ?? 0).toFixed(2)} disabled />
            <TextField required type="number" label="Add Casino Limit" value={addLimit}
              onChange={(e) => setAddLimit(Number(e.target.value))} />
            <Box>
              <Button variant="contained" sx={{ bgcolor: '#1f2937', '&:hover': { bgcolor: '#374151' } }}
                disabled={casinoMut.isPending || addLimit === 0} onClick={() => casinoMut.mutate()}>Save</Button>
            </Box>
          </Stack>
        )}

        {tab === 1 && (
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={6}><TextField fullWidth required label="Name" value={name} onChange={(e) => setName(e.target.value)} /></Grid>
              <Grid item xs={6}><TextField fullWidth label="User ID" value={u.mstruserid} disabled /></Grid>
              <Grid item xs={6}><TextField fullWidth type="number" label="No. of User" value={noOfChild} onChange={(e) => setNoOfChild(Number(e.target.value))} inputProps={{ min: 0 }} /></Grid>
            </Grid>
            <TextField multiline minRows={2} label="Remark" value={remark} onChange={(e) => setRemark(e.target.value)} />
            <Box>
              <Button variant="contained" sx={{ bgcolor: '#1f2937', '&:hover': { bgcolor: '#374151' } }}
                disabled={profileMut.isPending || !name} onClick={() => profileMut.mutate()}>Update</Button>
            </Box>
          </Stack>
        )}
      </DialogContent>
      <DialogActions><Button onClick={props.onClose}>Close</Button></DialogActions>
    </Dialog>
  )
}

// Share-details popup for the My Share / Agent share buttons. Agent share shows
// the user's own partner values; My Share is the parent's retained portion
// (100 âˆ’ value, with the 5% casino reserve removed) â€” matching the reference.
function ShareDialog(props: { user: User; kind: 'my' | 'agent'; onClose: () => void }) {
  // Agent share = the child's own share; My Share = what the parent keeps from
  // THIS agent (100 − the agent's share). Casino has no reserve now.
  const u = props.user
  const isAgent = props.kind === 'agent'
  const title = isAgent ? 'Agent Share' : 'My Share'
  const match = isAgent ? u.partnerCricket : 100 - u.partnerCricket
  const casino = isAgent ? u.partnerCasino : 100 - u.partnerCasino
  const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(2))
  return (
    <Dialog open onClose={props.onClose} maxWidth="xs">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Table size="small">
          <TableHead>
            <TableRow><TableCell>Sports</TableCell><TableCell align="center">{title}</TableCell></TableRow>
          </TableHead>
          <TableBody>
            <TableRow><TableCell sx={{ fontWeight: 600 }}>Casino Share</TableCell><TableCell align="center"><b>{fmt(casino)}</b></TableCell></TableRow>
            <TableRow><TableCell sx={{ fontWeight: 600 }}>Match Share</TableCell><TableCell align="center"><b>{fmt(match)}</b></TableCell></TableRow>
          </TableBody>
        </Table>
      </DialogContent>
      <DialogActions><Button onClick={props.onClose}>Close</Button></DialogActions>
    </Dialog>
  )
}

function getMessage(err: unknown): string | undefined {
  if (typeof err === 'object' && err && 'response' in err) {
    return (err as { response?: { data?: { error?: string } } }).response?.data?.error
  }
  return undefined
}
