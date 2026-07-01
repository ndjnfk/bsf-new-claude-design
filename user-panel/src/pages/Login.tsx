import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { LoginForm } from '../components/auth/LoginForm'

// Route: login — same login form as /login-m.
export default function Login() {
  useDocumentTitle('Login')
  return <LoginForm />
}
