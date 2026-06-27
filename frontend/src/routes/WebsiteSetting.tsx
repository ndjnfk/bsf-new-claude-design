import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Box, Button, Card, CardContent, Dialog, DialogActions, DialogContent, DialogTitle,
  Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography, Chip, Alert,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import { listDomains, createDomain, type Domain } from '../lib/api'

// Doc §23 — Website Setting: manage website domains.
export function WebsiteSetting() {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const { data: domains = [] } = useQuery({ queryKey: ['domains'], queryFn: () => listDomains().then((r) => r ?? []) })

  return (
    <Box>
      <Stack direction="row" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ flexGrow: 1 }}>Domains</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}>Add Domain</Button>
      </Stack>
      <Card>
        <CardContent>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Url</TableCell>
                <TableCell>Alternate Url</TableCell>
                <TableCell>Register</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {domains.map((d: Domain) => (
                <TableRow key={d.id} hover>
                  <TableCell>{d.name}</TableCell>
                  <TableCell>{d.url}</TableCell>
                  <TableCell>{d.alternateUrl ?? '—'}</TableCell>
                  <TableCell><Chip size="small" label={d.showRegister ? 'Yes' : 'No'} /></TableCell>
                </TableRow>
              ))}
              {domains.length === 0 && (
                <TableRow><TableCell colSpan={4} align="center">No domains yet</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <CreateDomainDialog open={open} onClose={() => setOpen(false)}
        onCreated={() => { setOpen(false); qc.invalidateQueries({ queryKey: ['domains'] }) }} />
    </Box>
  )
}

function CreateDomainDialog(props: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [alternateUrl, setAlt] = useState('')
  const [error, setError] = useState('')

  const mutation = useMutation({
    mutationFn: () => createDomain({ name, url, alternateUrl }),
    onSuccess: () => { setName(''); setUrl(''); setAlt(''); props.onCreated() },
    onError: (err: unknown) => setError(getMessage(err) ?? 'Failed to create domain'),
  })

  return (
    <Dialog open={props.open} onClose={props.onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create Domain</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <TextField label="Url" value={url} onChange={(e) => setUrl(e.target.value)} />
          <TextField label="Alternate Url" value={alternateUrl} onChange={(e) => setAlt(e.target.value)} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={props.onClose}>Cancel</Button>
        <Button variant="contained" disabled={mutation.isPending || !name || !url}
          onClick={() => { setError(''); mutation.mutate() }}>
          {mutation.isPending ? 'Saving…' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

function getMessage(err: unknown): string | undefined {
  if (typeof err === 'object' && err && 'response' in err) {
    return (err as { response?: { data?: { error?: string } } }).response?.data?.error
  }
  return undefined
}
