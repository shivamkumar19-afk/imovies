import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import ThemeToggle from './ThemeToggle'

const Logo = () => (
  <svg viewBox="0 0 32 32" aria-hidden="true">
    <path d="M5 9h22v5a2.5 2.5 0 0 0 0 5v4H5v-4a2.5 2.5 0 0 0 0-5z" fill="currentColor" />
    <path d="M19 9v14" stroke="#221936" strokeWidth="1.6" strokeDasharray="2 2" />
  </svg>
)

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const close = () => setOpen(false)

  return (
    <nav className="navbar navbar-expand-md navbar-dark site-nav">
      <div className="container">
        <Link className="navbar-brand" to="/" onClick={close}><Logo />IMovies</Link>

        {/* Theme toggle stays visible on mobile, next to the menu button */}
        <div className="d-flex align-items-center gap-2 order-md-last ms-auto ms-md-3">
          <ThemeToggle />
          <button
            className="navbar-toggler"
            type="button"
            aria-controls="main-nav"
            aria-expanded={open}
            aria-label="Toggle navigation"
            onClick={() => setOpen((o) => !o)}
          >
            <span className="navbar-toggler-icon" />
          </button>
        </div>

        <div id="main-nav" className={`collapse navbar-collapse ${open ? 'show' : ''}`}>
          <ul className="navbar-nav me-auto gap-md-1 mt-2 mt-md-0">
            <li className="nav-item"><NavLink className="nav-link" to="/" end onClick={close}>Movies</NavLink></li>
            {user && <li className="nav-item"><NavLink className="nav-link" to="/my-bookings" onClick={close}>My bookings</NavLink></li>}
            {isAdmin && <li className="nav-item"><NavLink className="nav-link" to="/admin" onClick={close}>Admin</NavLink></li>}
          </ul>
          <div className="d-flex align-items-md-center gap-2 flex-column flex-md-row py-2 py-md-0">
            {user ? (
              <>
                <span className="nav-user d-inline-flex align-items-center">
                  <span className="avatar" aria-hidden="true">{user.name?.[0]?.toUpperCase()}</span>
                  {user.name}
                </span>
                <button className="btn btn-sm btn-ghost-light" onClick={() => { logout(); close(); navigate('/') }}>
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link className="btn btn-sm btn-ghost-light" to="/login" onClick={close}>Log in</Link>
                <Link className="btn btn-sm btn-marquee" to="/register" onClick={close}>Create account</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
