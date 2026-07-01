import { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../store/auth'
import { useSports } from '../../store/sports'
import { fetchCaptcha, type Captcha } from '../../services/captchaApi'
import { getDeviceInfo } from '../../utils/device'
import { SOCKET_URL } from '../../api/env'
import { ForgotPasswordModal } from './ForgotPasswordModal'
import { UpdatePasswordModal } from './UpdatePasswordModal'

// Login form (shared by /login-m and /login). Mirrors the Angular LoginComponent:
// same payload, captcha (4-digit challenge refreshed every 240s and on invalid
// captcha), and the success redirect (change_password → /change-password, else
// /rules with the welcome flag).
const schema = z.object({
  username: z.string().min(1, 'This field is required'),
  password: z.string().min(1, 'Password is required'),
  captcha: z.string().optional(),
})
type LoginData = z.infer<typeof schema>

// A 4-digit client-side captcha, used as a fallback when the backend doesn't
// serve one so the challenge is always shown (and validated) on the login form.
function generateCaptcha(): Captcha {
  const digits = Array.from({ length: 4 }, () => Math.floor(Math.random() * 10))
  return { captcha: digits, unix: Math.floor(Date.now() / 1000) }
}

const CAPTCHA_SKEW = ['g11', 'g22', 'g33', 'g44']

export function LoginForm() {
  const navigate = useNavigate()
  const signIn = useAuth((s) => s.signIn)
  const domain = useAuth((s) => s.domain)
  const loadSports = useSports((s) => s.loadSports)

  const [captcha, setCaptcha] = useState<Captcha>({ captcha: [], unix: 0 })
  const [captchaError, setCaptchaError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [modal, setModal] = useState<null | 'forgot' | 'update'>(null)
  const [resetPhone, setResetPhone] = useState('')

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginData>({ resolver: zodResolver(schema) })

  const refreshCaptcha = useCallback(() => {
    setCaptchaError('')
    fetchCaptcha()
      .then((c) => {
        setCaptcha(c.captcha?.length ? c : generateCaptcha())
        setValue('captcha', '')
      })
      // No backend captcha endpoint → fall back to a client-side challenge so the
      // captcha is always shown and validated.
      .catch(() => {
        setCaptcha(generateCaptcha())
        setValue('captcha', '')
      })
  }, [setValue])

  useEffect(() => {
    refreshCaptcha()
    const id = setInterval(refreshCaptcha, 240000)
    return () => clearInterval(id)
  }, [refreshCaptcha])

  const onSubmit = handleSubmit(async (data) => {
    // Client-side captcha check: the typed value must match the shown digits.
    if ((data.captcha ?? '').trim() !== captcha.captcha.join('')) {
      setCaptchaError('Invalid captcha, please try again.')
      refreshCaptcha()
      return
    }
    setCaptchaError('')
    setIsLoading(true)
    const device = getDeviceInfo()
    const payload = {
      username: data.username,
      password: data.password,
      captcha: data.captcha ?? '',
      device_info: device.device_info,
      captcha_time: captcha.unix,
      captcha_numbers: captcha.captcha.join(''),
      browser_info: device.browser_info,
      dom: SOCKET_URL,
    }
    try {
      const res = await signIn(payload)
      void loadSports()
      if (res.change_password) {
        navigate('/change-password', { replace: true })
      } else {
        // Land on the user-home hub (static — renders without other backend
        // endpoints, which are added incrementally under /api/user/*).
        navigate('/userhome', { replace: true })
      }
    } catch (e) {
      const message = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
      if (message === 'Invalid captcha, please refresh.') {
        refreshCaptcha()
        setValue('captcha', '')
      }
    } finally {
      setIsLoading(false)
    }
  })

  const showRegister = !!domain?.show_register
  const brandName = domain?.name ?? 'BSF2020'

  return (
    <div id="wrapper" className="bg-white min-vh-100 pt-80">
      <div className="container-fluid p-0 mt-lg-4 bg-white pb-3">
        <div className="col-lg-4 col-md-4 col-sm-6 col-xs-10 m-auto login_stripe login-box-color">
          <h1 className="login_heading text-uppercase">{brandName}</h1>
          <form className="login-detail" onSubmit={onSubmit}>
            <div className="form-group">
              <div className="input-formGroup">
                <input type="text" placeholder="Enter Username" className="form-control" {...register('username')} />
              </div>
              {errors.username ? (
                <div className="fs-12 text-danger">
                  <div>{errors.username.message}</div>
                </div>
              ) : null}
            </div>

            <div className="form-group position-relative">
              <div className="input-formGroup">
                <input type="password" placeholder="Enter Password" className="form-control" {...register('password')} />
              </div>
              {errors.password ? (
                <div className="fs-12 text-danger">
                  <div>{errors.password.message}</div>
                </div>
              ) : null}
            </div>

            {captcha.captcha.length > 0 ? (
              <>
                <div className="simple_captcha d-flex align-items-center justify-content-center gap-2">
                  <p className="captcls mb-0">
                    {captcha.captcha.map((d, i) => (
                      <span key={i} className={`G1 ${CAPTCHA_SKEW[i] ?? ''}`}>
                        {d}
                      </span>
                    ))}
                  </p>
                  <button
                    type="button"
                    className="captcha-refresh"
                    onClick={refreshCaptcha}
                    aria-label="Refresh captcha"
                    title="Refresh captcha"
                  >
                    ↻
                  </button>
                </div>

                <div className="form-group position-relative">
                  <div className="input-formGroup">
                    <input
                      placeholder="Enter captcha"
                      inputMode="numeric"
                      autoComplete="off"
                      className="form-control"
                      {...register('captcha')}
                    />
                  </div>
                  {captchaError ? <div className="fs-12 text-danger px-4 mt-1">{captchaError}</div> : null}
                </div>
              </>
            ) : null}

            <div className="d-flex justify-content-center text">
              <button type="submit" className="btn loginButton" disabled={isLoading}>
                <span className="animate-btn">
                  LOG IN
                  {isLoading ? (
                    <img src="/assets/image/circle.png" width="18" className="loader-spin white_fff" alt="" />
                  ) : null}
                </span>
              </button>
            </div>

            {showRegister ? (
              <div className="text-center text-mumber pt-2 pb-4">
                <button type="button" className="btn loginButton" onClick={() => setModal('forgot')}>
                  <span className="animate-btn">Forget Password ?</span>
                </button>
              </div>
            ) : null}
          </form>
        </div>
      </div>

      <ForgotPasswordModal
        show={modal === 'forgot'}
        onHide={() => setModal(null)}
        onSent={(phone) => {
          setResetPhone(phone)
          setModal('update')
        }}
      />
      <UpdatePasswordModal show={modal === 'update'} phone={resetPhone} onHide={() => setModal(null)} />
    </div>
  )
}
