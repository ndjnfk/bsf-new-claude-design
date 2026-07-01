import { useCallback, useEffect, useState } from 'react'
import { Modal, Button, Form, Table } from 'react-bootstrap'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { Loader } from '../components/common/Loader'
import {
  createUserBank,
  deleteUserBank,
  getUserBanks,
  updateUserBank,
  type UserBank,
} from '../services/walletApi'

const schema = z.object({
  account_name: z.string().min(1, 'Account Name is required'),
  account_number: z.string().min(1, 'Account Number is required'),
  ifsc_code: z.string().min(1, 'IFSC Code is required'),
  bank_name: z.string().min(1, 'Bank Name is required'),
  is_default: z.boolean(),
})
type FormData = z.infer<typeof schema>

// Saved-bank management — add / edit / delete, with React-controlled add/edit and
// delete-confirmation modals (replacing the jQuery modal + window.confirm).
export default function BankDetails() {
  useDocumentTitle('Bank Details')
  const [banks, setBanks] = useState<UserBank[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [editId, setEditId] = useState<number | string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<UserBank | null>(null)

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const load = useCallback(() => {
    setLoading(true)
    setError(false)
    getUserBanks()
      .then((r) => setBanks(r.data ?? []))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => load(), [load])

  const openAdd = () => {
    setEditId(null)
    reset({ account_name: '', account_number: '', ifsc_code: '', bank_name: '', is_default: false })
    setShowForm(true)
  }
  const openEdit = (b: UserBank) => {
    setEditId(b.id)
    reset({
      account_name: b.account_name,
      account_number: b.account_number,
      ifsc_code: b.ifsc_code,
      bank_name: b.bank_name,
      is_default: !!b.is_default,
    })
    setShowForm(true)
  }

  const submit = handleSubmit(async (data) => {
    try {
      if (editId != null) await updateUserBank(editId, data)
      else await createUserBank(data)
      setShowForm(false)
      load()
    } catch {
      /* interceptor toast */
    }
  })

  const doDelete = async () => {
    if (!confirmDelete) return
    try {
      await deleteUserBank(confirmDelete.id)
      setConfirmDelete(null)
      load()
    } catch {
      /* interceptor toast */
    }
  }

  return (
    <div id="wrapper">
      <div className="container dashboard_content py-3">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="mb-0">Bank Details</h5>
          <Button size="sm" onClick={openAdd}>
            Add New
          </Button>
        </div>

        {loading ? (
          <Loader />
        ) : error ? (
          <p className="text-center text-danger py-4">Failed to load banks.</p>
        ) : (
          <div className="table-responsive">
            <Table striped bordered hover size="sm">
              <thead>
                <tr>
                  <th>Bank Name</th>
                  <th>Account Name</th>
                  <th>Account Number</th>
                  <th>IFSC Code</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {banks.map((b) => (
                  <tr key={b.id}>
                    <td>{b.bank_name}</td>
                    <td>{b.account_name}</td>
                    <td>{b.account_number}</td>
                    <td>{b.ifsc_code}</td>
                    <td>
                      <Button size="sm" variant="link" className="p-0 me-2" onClick={() => openEdit(b)}>
                        Edit
                      </Button>
                      <Button size="sm" variant="link" className="p-0 text-danger" onClick={() => setConfirmDelete(b)}>
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
                {banks.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center">
                      No Data Available
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </Table>
          </div>
        )}
      </div>

      {/* Add / Edit modal */}
      <Modal show={showForm} onHide={() => setShowForm(false)} centered>
        <Form onSubmit={submit}>
          <Modal.Header closeButton>
            <Modal.Title>{editId != null ? 'Edit Bank' : 'Add Bank'}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-2" controlId="account_name">
              <Form.Label>Account Name</Form.Label>
              <Form.Control isInvalid={!!errors.account_name} {...register('account_name')} />
              <Form.Control.Feedback type="invalid">{errors.account_name?.message}</Form.Control.Feedback>
            </Form.Group>
            <Form.Group className="mb-2" controlId="account_number">
              <Form.Label>Account Number</Form.Label>
              <Form.Control isInvalid={!!errors.account_number} {...register('account_number')} />
              <Form.Control.Feedback type="invalid">{errors.account_number?.message}</Form.Control.Feedback>
            </Form.Group>
            <Form.Group className="mb-2" controlId="ifsc_code">
              <Form.Label>IFSC Code</Form.Label>
              <Form.Control isInvalid={!!errors.ifsc_code} {...register('ifsc_code')} />
              <Form.Control.Feedback type="invalid">{errors.ifsc_code?.message}</Form.Control.Feedback>
            </Form.Group>
            <Form.Group className="mb-2" controlId="bank_name">
              <Form.Label>Bank Name</Form.Label>
              <Form.Control isInvalid={!!errors.bank_name} {...register('bank_name')} />
              <Form.Control.Feedback type="invalid">{errors.bank_name?.message}</Form.Control.Feedback>
            </Form.Group>
            <Form.Check type="checkbox" label="Set as default" {...register('is_default')} />
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowForm(false)}>
              Close
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              Save
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Delete confirmation modal */}
      <Modal show={!!confirmDelete} onHide={() => setConfirmDelete(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Delete bank?</Modal.Title>
        </Modal.Header>
        <Modal.Body>Are you sure you want to delete this bank account?</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setConfirmDelete(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={() => void doDelete()}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}
