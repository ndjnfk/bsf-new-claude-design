import { Modal, Button, Form } from 'react-bootstrap'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { updatePassword } from '../../services/registrationApi'

// Reset-password (OTP) modal — controlled react-bootstrap modal replacing the
// jQuery `$('#updatePassword').modal()`. Payload preserved: the form values plus the
// phone from the forgot step ({ password, confirmPassword, otp, phone }).
const schema = z
  .object({
    password: z.string().min(1, 'Password is required'),
    confirmPassword: z.string().min(1, 'Confirm Password is required'),
    otp: z.string().min(4, 'OTP must be 4 digits').max(4, 'OTP must be 4 digits'),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords must match',
  })
type Data = z.infer<typeof schema>

export function UpdatePasswordModal({
  show,
  phone,
  onHide,
}: {
  show: boolean
  phone: string
  onHide: () => void
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Data>({ resolver: zodResolver(schema) })

  const submit = handleSubmit(async (data) => {
    try {
      const res = await updatePassword({ ...data, phone })
      if (res?.status) {
        reset()
        onHide()
      }
    } catch {
      /* error toast handled by the interceptor */
    }
  })

  return (
    <Modal show={show} onHide={onHide} centered>
      <Form onSubmit={submit}>
        <Modal.Header closeButton>
          <Modal.Title>Update Password</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-2">
            <Form.Label>New Password</Form.Label>
            <Form.Control type="password" isInvalid={!!errors.password} {...register('password')} />
            <Form.Control.Feedback type="invalid">{errors.password?.message}</Form.Control.Feedback>
          </Form.Group>
          <Form.Group className="mb-2">
            <Form.Label>Confirm Password</Form.Label>
            <Form.Control type="password" isInvalid={!!errors.confirmPassword} {...register('confirmPassword')} />
            <Form.Control.Feedback type="invalid">{errors.confirmPassword?.message}</Form.Control.Feedback>
          </Form.Group>
          <Form.Group className="mb-2">
            <Form.Label>OTP</Form.Label>
            <Form.Control placeholder="Enter OTP" isInvalid={!!errors.otp} {...register('otp')} />
            <Form.Control.Feedback type="invalid">{errors.otp?.message}</Form.Control.Feedback>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            Close
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            Update
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}
