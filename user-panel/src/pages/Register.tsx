import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useAuth } from '../store/auth'
import { checkUsername, registerUser } from '../services/registrationApi'
import { apiDate } from '../utils/format'

// Route: register — mirrors the Angular RegisterComponent. Same payload
// (userRegister: username, password, email, FromDate=today, otp, name, cPassword,
// ip_address:'1', session:'1', rememberMe:false) with the same validation messages
// and the async username-availability check.
const schema = z
  .object({
    username: z.string().min(1, 'Username is required'),
    name: z.string().min(1, 'Name is required'),
    email: z.string().min(1, 'Email is required').email('Invalid email'),
    otp: z.string().min(1, 'OTP is required'),
    password: z.string().min(1, 'Password is required'),
    cPassword: z.string().min(1, 'Confirm Password is required'),
  })
  .refine((d) => d.password === d.cPassword, { path: ['cPassword'], message: 'Passwords must match' })
type RegisterData = z.infer<typeof schema>

export default function Register() {
  useDocumentTitle('Register')
  const navigate = useNavigate()
  const domain = useAuth((s) => s.domain)
  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<RegisterData>({ resolver: zodResolver(schema) })

  // Async username availability (Angular: !res.status → usernameExists).
  const usernameReg = register('username')
  const onUsernameBlur = async (value: string) => {
    if (!value) return
    try {
      const res = await checkUsername(value)
      if (!res?.status) setError('username', { message: 'Username Already Exits.' })
      else clearErrors('username')
    } catch {
      /* ignore — availability is best-effort */
    }
  }

  const onSubmit = handleSubmit(async (data) => {
    const payload = {
      ...data,
      FromDate: apiDate(new Date()),
      ip_address: '1',
      session: '1',
      rememberMe: false,
    }
    try {
      const res = await registerUser(payload)
      if (res?.status) navigate('/login')
    } catch {
      /* error toast handled by the interceptor */
    }
  })

  const showRegister = !!domain?.show_register

  return (
    <div className="author-log" style={{ placeItems: 'center', minHeight: '100vh', width: '100%' }}>
      <div className="log-height">
        <div className="row justify-content-left">
          <div className="col-lg-10 p-0">
            <form onSubmit={onSubmit} autoComplete="off" className="log-form" noValidate>
              {domain?.logo ? (
                <div className="title">
                  <img alt="logo" className="logo-size" src={String(domain?.logo)} />
                </div>
              ) : null}
              <div className="row">
                <div className="col-lg-6">
                  <div className="form-group">
                    <label className="user-email-text">Username</label>
                    <input
                      className="form-control"
                      placeholder="Enter Username"
                      type="text"
                      {...usernameReg}
                      onBlur={(e) => {
                        void usernameReg.onBlur(e)
                        void onUsernameBlur(e.target.value)
                      }}
                    />
                    {errors.username ? <div className="invalid-feedback-white d-block text-danger">{errors.username.message}</div> : null}
                  </div>
                  <div className="form-group">
                    <label className="user-email-text">Name</label>
                    <input className="form-control" placeholder="Enter Name" type="text" {...register('name')} />
                    {errors.name ? <div className="invalid-feedback-white d-block text-danger">{errors.name.message}</div> : null}
                  </div>
                  <div className="form-group">
                    <label className="user-email-text">Email</label>
                    <input className="form-control" placeholder="Enter Email" type="email" {...register('email')} />
                    {errors.email ? <div className="invalid-feedback-white d-block text-danger">{errors.email.message}</div> : null}
                  </div>
                </div>
                <div className="col-lg-6">
                  <div className="form-group">
                    <label className="user-email-text">OTP</label>
                    <input className="form-control" placeholder="Enter otp" type="text" {...register('otp')} />
                    {errors.otp ? <div className="invalid-feedback-white d-block text-danger">{errors.otp.message}</div> : null}
                  </div>
                  <div className="form-group">
                    <label className="user-email-text">Password</label>
                    <input className="form-control" placeholder="Enter Password" type="password" {...register('password')} />
                    {errors.password ? <div className="invalid-feedback-white d-block text-danger">{errors.password.message}</div> : null}
                  </div>
                  <div className="form-group">
                    <label className="user-email-text">Confirm Password</label>
                    <input className="form-control" placeholder="Enter Password" type="password" {...register('cPassword')} />
                    {errors.cPassword ? <div className="invalid-feedback-white d-block text-danger">{errors.cPassword.message}</div> : null}
                  </div>
                </div>
              </div>

              <div className="d-flex justify-content-center mb-1 text">
                {showRegister ? (
                  <button type="submit" className="btn btn-login1 btn-block border-0 py-3 text-white" disabled={isSubmitting}>
                    Register
                  </button>
                ) : null}
              </div>
              <div className="form-group mb-1">
                <Link className="btn btn-warning btn-block" to="/login">
                  Login
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
