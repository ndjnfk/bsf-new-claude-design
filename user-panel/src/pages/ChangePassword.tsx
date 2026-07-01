import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useLogout } from '../hooks/useLogout'
import { changePasswordReq } from '../services/reportsApi'

// Change password — React Hook Form + Zod, field names + messages preserved from the
// Angular reactive form. New/confirm must match. On "Password has been changed."
// the user is logged out.
const schema = z
  .object({
    old_password: z.string().min(1, 'Current Password is required'),
    newpassword: z.string().min(1, 'New Password is required'),
    Renewpassword: z.string().min(1, 'Confirm Password is required'),
  })
  .refine((d) => d.newpassword === d.Renewpassword, {
    message: 'New and Confirm Password do not match',
    path: ['Renewpassword'],
  })
type FormData = z.infer<typeof schema>

export default function ChangePassword() {
  useDocumentTitle('Change Password')
  const logout = useLogout()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const submit = handleSubmit(async (data) => {
    try {
      const res = await changePasswordReq(data)
      reset()
      if (res?.message === 'Password has been changed.') await logout()
    } catch {
      /* error toast handled by the interceptor */
    }
  })

  return (
    <div id="wrapper">
      <div className="container dashboard_content py-4">
        <div className="change-pass-card mx-auto">
          <div className="change-pass-head">Change Password</div>
          <div className="change-pass-body">
            <form onSubmit={submit} noValidate>
              <div className="mb-4">
                <input
                  type="password"
                  className="form-control change-pass-input"
                  placeholder="OLD PASSWORD"
                  autoComplete="current-password"
                  {...register('old_password')}
                />
                {errors.old_password ? (
                  <div className="text-danger small mt-1">{errors.old_password.message}</div>
                ) : null}
              </div>
              <div className="mb-4">
                <input
                  type="password"
                  className="form-control change-pass-input"
                  placeholder="NEW PASSWORD"
                  autoComplete="new-password"
                  {...register('newpassword')}
                />
                {errors.newpassword ? (
                  <div className="text-danger small mt-1">{errors.newpassword.message}</div>
                ) : null}
              </div>
              <div className="mb-4">
                <input
                  type="password"
                  className="form-control change-pass-input"
                  placeholder="CONFIRM PASSWORD"
                  autoComplete="new-password"
                  {...register('Renewpassword')}
                />
                {errors.Renewpassword ? (
                  <div className="text-danger small mt-1">{errors.Renewpassword.message}</div>
                ) : null}
              </div>
              <button type="submit" className="change-pass-done w-100" disabled={isSubmitting}>
                Done
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
