import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { errorMessage } from '../api/axios'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const from = useLocation().state?.from || '/'
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await login(form.email, form.password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="container">
      <form className="auth-card" onSubmit={submit} noValidate>
        <h1 className="h2 mb-4">Log in</h1>
        {error && <div className="alert alert-danger py-2">{error}</div>}
        <div className="mb-3">
          <label className="form-label" htmlFor="email">Email</label>
          <input id="email" type="email" className="form-control" autoComplete="email" required
            value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div className="mb-4">
          <label className="form-label" htmlFor="password">Password</label>
          <input id="password" type="password" className="form-control" autoComplete="current-password" required
            value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </div>
        <button className="btn btn-marquee w-100" disabled={busy}>{busy ? 'Logging in…' : 'Log in'}</button>
        <p className="text-center mt-3 mb-0 small">
          New here? <Link to="/register" state={{ from }}>Create an account</Link>
        </p>
        {import.meta.env.DEV && (
          <p className="text-center text-muted-ink small mt-3 mb-0">
            Demo: user@imovies.com / user123, admin@imovies.com / admin123
          </p>
        )}
      </form>
    </div>
  )
}
