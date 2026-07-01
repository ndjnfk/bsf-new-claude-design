import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { ProtectedRoute } from './ProtectedRoute'
import { GuestRoute } from './GuestRoute'
import { useAuth } from '../../store/auth'
import type { AuthUser } from '../../types'

const asUser = { mstrid: 1, usetype: 3 } as AuthUser

function setup(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/secret" element={<div>SECRET</div>} />
        </Route>
        <Route element={<GuestRoute />}>
          <Route path="/login-m" element={<div>LOGIN PAGE</div>} />
        </Route>
        <Route path="/userhome" element={<div>USERHOME</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => useAuth.setState({ status: 'ready', user: null }))

describe('ProtectedRoute', () => {
  it('redirects unauthenticated users to /login-m', () => {
    setup('/secret')
    expect(screen.getByText('LOGIN PAGE')).toBeInTheDocument()
  })

  it('renders protected content when authenticated', () => {
    useAuth.setState({ user: asUser })
    setup('/secret')
    expect(screen.getByText('SECRET')).toBeInTheDocument()
  })
})

describe('GuestRoute', () => {
  it('lets unauthenticated users see the login page', () => {
    setup('/login-m')
    expect(screen.getByText('LOGIN PAGE')).toBeInTheDocument()
  })

  it('redirects authenticated users to /userhome', () => {
    useAuth.setState({ user: asUser })
    setup('/login-m')
    expect(screen.getByText('USERHOME')).toBeInTheDocument()
  })
})
