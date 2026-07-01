import { Modal, Button, Form } from 'react-bootstrap'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { post } from '../../api/http'

// Change-password modal (react-bootstrap + react-hook-form/zod) — replaces the
// Angular jQuery `$('#changePasswordModal').modal()` + reactive form.
const schema = z.object({
  current_password: z.string().min(1, 'Required'),
  password: z.string().min(1, 'Required'),
  password_confirmation: z.string().min(1, 'Required'),
})
type FormData = z.infer<typeof schema>

export function ChangePasswordModal({ show, onHide }: { show: boolean; onHide: () => void }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const submit = handleSubmit(async (data) => {
    try {
      await post('changePassword', data)
      reset()
      onHide()
    } catch {
      /* error toast handled by the interceptor */
    }
  })

  return (
    <Modal show={show} onHide={onHide} centered>
      <Form onSubmit={submit}>
        <Modal.Header closeButton>
          <Modal.Title>Change Password</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-2">
            <Form.Label>Current Password</Form.Label>
            <Form.Control type="password" isInvalid={!!errors.current_password} {...register('current_password')} />
          </Form.Group>
          <Form.Group className="mb-2">
            <Form.Label>New Password</Form.Label>
            <Form.Control type="password" isInvalid={!!errors.password} {...register('password')} />
          </Form.Group>
          <Form.Group className="mb-2">
            <Form.Label>Confirm Password</Form.Label>
            <Form.Control type="password" isInvalid={!!errors.password_confirmation} {...register('password_confirmation')} />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            Close
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            Save changes
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}
