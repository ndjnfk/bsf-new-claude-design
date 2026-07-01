import { Modal, Button, Form } from 'react-bootstrap'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { sendPasswordOtp } from '../../services/registrationApi'

// Forgot-password modal — controlled react-bootstrap modal replacing the jQuery
// `$('#forgetPassword').modal()`. On a successful OTP send it hands the phone to the
// update-password step (Angular opened #updatePassword next).
const schema = z.object({ phone: z.string().min(1, 'Phone is required') })
type Data = z.infer<typeof schema>

export function ForgotPasswordModal({
  show,
  onHide,
  onSent,
}: {
  show: boolean
  onHide: () => void
  onSent: (phone: string) => void
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Data>({ resolver: zodResolver(schema) })

  const submit = handleSubmit(async (data) => {
    try {
      const res = await sendPasswordOtp(data.phone)
      if (res?.status) {
        reset()
        onSent(data.phone)
      }
    } catch {
      /* error toast handled by the interceptor */
    }
  })

  return (
    <Modal show={show} onHide={onHide} centered>
      <Form onSubmit={submit}>
        <Modal.Header closeButton>
          <Modal.Title>Forget Password</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Phone</Form.Label>
            <Form.Control placeholder="Enter phone" isInvalid={!!errors.phone} {...register('phone')} />
            <Form.Control.Feedback type="invalid">{errors.phone?.message}</Form.Control.Feedback>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            Close
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            Send OTP
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}
