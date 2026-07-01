import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { LoginForm } from '../components/auth/LoginForm'

// Route: login-m (default landing) — hosts the login form.
export default function LoginMain() {
  useDocumentTitle('Login')
  return <LoginForm />
}
