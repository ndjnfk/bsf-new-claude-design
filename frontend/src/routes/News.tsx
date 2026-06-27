import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Box, Button, Card, CardContent, Dialog, DialogActions, DialogContent, DialogTitle,
  IconButton, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import { listNews, createNews, updateNews, deleteNews, type NewsPost } from '../lib/api'

// Doc §29 — News: manage news/blog posts.
export function News() {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<NewsPost | null>(null)
  const { data: posts = [] } = useQuery({ queryKey: ['news'], queryFn: () => listNews().then((r) => r ?? []) })

  const remove = useMutation({
    mutationFn: (id: string) => deleteNews(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['news'] }),
  })

  return (
    <Box>
      <Stack direction="row" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ flexGrow: 1 }}>News</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}>Create Blog</Button>
      </Stack>
      <Card>
        <CardContent>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>Slug</TableCell>
                <TableCell>Content</TableCell>
                <TableCell>Created On</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {posts.map((p: NewsPost, i: number) => (
                <TableRow key={p.id} hover>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell>{p.slug}</TableCell>
                  <TableCell>{p.content.slice(0, 100)}</TableCell>
                  <TableCell>{new Date(p.createdOn).toLocaleString()}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => setEditTarget(p)}><EditIcon fontSize="small" /></IconButton>
                    <IconButton size="small" color="error" onClick={() => remove.mutate(p.id)}><DeleteIcon fontSize="small" /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {posts.length === 0 && <TableRow><TableCell colSpan={5} align="center">No news yet</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <CreateNewsDialog open={open} onClose={() => setOpen(false)}
        onCreated={() => { setOpen(false); qc.invalidateQueries({ queryKey: ['news'] }) }} />
      {editTarget && <EditNewsDialog post={editTarget} onClose={() => setEditTarget(null)}
        onDone={() => { setEditTarget(null); qc.invalidateQueries({ queryKey: ['news'] }) }} />}
    </Box>
  )
}

function CreateNewsDialog(props: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [slug, setSlug] = useState('')
  const [content, setContent] = useState('')
  const mutation = useMutation({
    mutationFn: () => createNews({ slug, content }),
    onSuccess: () => { setSlug(''); setContent(''); props.onCreated() },
  })
  return (
    <Dialog open={props.open} onClose={props.onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create Blog</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField label="Slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
          <TextField label="Content" multiline minRows={4} value={content} onChange={(e) => setContent(e.target.value)} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={props.onClose}>Cancel</Button>
        <Button variant="contained" disabled={mutation.isPending || !slug || !content} onClick={() => mutation.mutate()}>
          {mutation.isPending ? 'Saving…' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

function EditNewsDialog(props: { post: NewsPost; onClose: () => void; onDone: () => void }) {
  const [slug, setSlug] = useState(props.post.slug)
  const [content, setContent] = useState(props.post.content)
  const mutation = useMutation({
    mutationFn: () => updateNews(props.post.id, { slug, content }),
    onSuccess: props.onDone,
  })
  return (
    <Dialog open onClose={props.onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Update Blog</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField label="Slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
          <TextField label="Content" multiline minRows={4} value={content} onChange={(e) => setContent(e.target.value)} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={props.onClose}>Cancel</Button>
        <Button variant="contained" disabled={mutation.isPending || !slug || !content} onClick={() => mutation.mutate()}>
          {mutation.isPending ? 'Saving…' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
