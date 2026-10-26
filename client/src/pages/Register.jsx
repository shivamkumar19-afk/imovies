import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { errorMessage } from '../api/axios'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const from = useLocation().state?.from || '/'
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (form.password.length < 6) return setError('Password must be at least 6 characters')
    setBusy(true)
    setError('')
    try {
      await register(form.name, form.email, form.password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const field = (key) => ({ value: form[key], onChange: (e) => setForm({ ...form, [key]: e.target.value }) })

  return (
    <div className="container">
      <form className="auth-card" onSubmit={submit} noValidate>
        <h1 className="h2 mb-4">Create account</h1>
        {error && <div className="alert alert-danger py-2">{error}</div>}
        <div className="mb-3">
          <label className="form-label" htmlFor="name">Name</label>
          <input id="name" className="form-control" autoComplete="name" required {...field('name')} />
        </div>
        <div className="mb-3">
          <label className="form-label" htmlFor="email">Email</label>
          <input id="email" type="email" className="form-control" autoComplete="email" required {...field('email')} />
        </div>
        <div className="mb-4">
          <label className="form-label" htmlFor="password">Password</label>
          <input id="password" type="password" className="form-control" autoComplete="new-password" minLength={6} required {...field('password')} />
          <div className="form-text">At least 6 characters.</div>
        </div>
        <button className="btn btn-marquee w-100" disabled={busy}>{busy ? 'Creating account…' : 'Create account'}</button>
        <p className="text-center mt-3 mb-0 small">
          Already have an account? <Link to="/login" state={{ from }}>Log in</Link>
        </p>
      </form>
    </div>
  )
}
