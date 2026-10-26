import { useCallback, useEffect, useState } from 'react'
import api, { errorMessage } from '../api/axios'
import Ticket from '../components/Ticket'
import { fmtDate, fmtMoney, fmtTime, localInputToISO } from '../utils/format'

const TABS = ['Movies', 'Theatres', 'Shows', 'Bookings']

export default function Admin() {
  const [tab, setTab] = useState('Movies')
  return (
    <div className="container py-4">
      <h1 className="mb-3">Admin</h1>
      <ul className="nav nav-tabs mb-4" role="tablist">
        {TABS.map((t) => (
          <li className="nav-item" key={t}>
            <button className={`nav-link ${tab === t ? 'active' : ''}`} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}>
              {t}
            </button>
          </li>
        ))}
      </ul>
      {tab === 'Movies' && <MoviesAdmin />}
      {tab === 'Theatres' && <TheatresAdmin />}
      {tab === 'Shows' && <ShowsAdmin />}
      {tab === 'Bookings' && <BookingsAdmin />}
    </div>
  )
}

/* ---------------- helpers ---------------- */
function useList(url, params) {
  const [items, setItems] = useState([])
  const [error, setError] = useState('')
  const key = JSON.stringify(params || {})
  const reload = useCallback(() => {
    api.get(url, { params: JSON.parse(key) }).then((r) => setItems(r.data)).catch((e) => setError(errorMessage(e)))
  }, [url, key])
  useEffect(reload, [reload])
  return { items, error, setError, reload }
}

function Field({ label, children, className = 'col-12 col-md-6' }) {
  return (
    <div className={className}>
      <label className="form-label small fw-semibold">{label}</label>
      {children}
    </div>
  )
}

/* ---------------- Movies ---------------- */
const emptyMovie = { title: '', language: '', genre: '', duration: '', rating: '', certificate: 'UA', posterUrl: '', releaseDate: '', description: '' }

function MoviesAdmin() {
  const { items, error, setError, reload } = useList('/movies')
  const [form, setForm] = useState(emptyMovie)
  const [editingId, setEditingId] = useState(null)
  const [msg, setMsg] = useState('')
  const f = (k) => ({ value: form[k], onChange: (e) => setForm({ ...form, [k]: e.target.value }) })

  const edit = (m) => {
    setEditingId(m._id)
    setForm({ ...emptyMovie, ...m, genre: m.genre.join(', '), releaseDate: m.releaseDate?.slice(0, 10) || '', rating: m.rating ?? '' })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const save = async (e) => {
    e.preventDefault()
    setError(''); setMsg('')
    const body = { ...form, duration: Number(form.duration), rating: form.rating === '' ? 0 : Number(form.rating), releaseDate: form.releaseDate || undefined }
    delete body._id; delete body.__v; delete body.createdAt; delete body.updatedAt
    try {
      if (editingId) await api.put(`/movies/${editingId}`, body)
      else await api.post('/movies', body)
      setMsg(editingId ? 'Movie updated' : 'Movie added')
      setForm(emptyMovie); setEditingId(null); reload()
    } catch (err) { setError(errorMessage(err)) }
  }

  const remove = async (m) => {
    if (!window.confirm(`Delete "${m.title}"?`)) return
    try { await api.delete(`/movies/${m._id}`); reload() } catch (err) { setError(errorMessage(err)) }
  }

  return (
    <div className="row g-4">
      <div className="col-lg-5">
        <form className="admin-panel row g-3" onSubmit={save}>
          <h2 className="h4 col-12 mb-0">{editingId ? 'Edit movie' : 'Add movie'}</h2>
          {msg && <div className="col-12"><div className="alert alert-success py-2 mb-0">{msg}</div></div>}
          <Field label="Title" className="col-12"><input className="form-control" required {...f('title')} /></Field>
          <Field label="Language"><input className="form-control" required {...f('language')} /></Field>
          <Field label="Genres (comma separated)"><input className="form-control" {...f('genre')} placeholder="Action, Drama" /></Field>
          <Field label="Duration (minutes)" className="col-6 col-md-4"><input type="number" min="1" className="form-control" required {...f('duration')} /></Field>
          <Field label="Rating (0–10)" className="col-6 col-md-4"><input type="number" min="0" max="10" step="0.1" className="form-control" {...f('rating')} /></Field>
          <Field label="Certificate" className="col-6 col-md-4">
            <select className="form-select" {...f('certificate')}>{['U', 'UA', 'A', 'S'].map((c) => <option key={c}>{c}</option>)}</select>
          </Field>
          <Field label="Release date" className="col-6 col-md-12"><input type="date" className="form-control" {...f('releaseDate')} /></Field>
          <Field label="Poster URL (optional)" className="col-12"><input type="url" className="form-control" {...f('posterUrl')} /></Field>
          <Field label="Description" className="col-12"><textarea rows="3" className="form-control" {...f('description')} /></Field>
          <div className="col-12 d-flex gap-2">
            <button className="btn btn-marquee">{editingId ? 'Save changes' : 'Add movie'}</button>
            {editingId && <button type="button" className="btn btn-quiet" onClick={() => { setEditingId(null); setForm(emptyMovie) }}>Cancel edit</button>}
          </div>
        </form>
      </div>
      <div className="col-lg-7">
        {error && <div className="alert alert-danger">{error}</div>}
        <div className="admin-panel table-responsive">
          <table className="table align-middle">
            <thead><tr><th>Title</th><th>Language</th><th>Length</th><th /></tr></thead>
            <tbody>
              {items.map((m) => (
                <tr key={m._id}>
                  <td className="fw-semibold">{m.title}</td>
                  <td>{m.language}</td>
                  <td>{m.duration} min</td>
                  <td className="text-end text-nowrap">
                    <button className="btn btn-sm btn-quiet me-1" onClick={() => edit(m)}>Edit</button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => remove(m)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

/* ---------------- Theatres ---------------- */
const emptyTheatre = { name: '', city: '', address: '', screens: [{ name: 'Screen 1', rows: 8, seatsPerRow: 12 }] }

function TheatresAdmin() {
  const { items, error, setError, reload } = useList('/theatres')
  const [form, setForm] = useState(emptyTheatre)
  const [editingId, setEditingId] = useState(null)

  const setScreen = (i, k, v) => setForm({ ...form, screens: form.screens.map((s, j) => (j === i ? { ...s, [k]: v } : s)) })

  const save = async (e) => {
    e.preventDefault()
    setError('')
    const body = {
      name: form.name, city: form.city, address: form.address,
      screens: form.screens.map((s) => ({ name: s.name, rows: Number(s.rows), seatsPerRow: Number(s.seatsPerRow) })),
    }
    try {
      if (editingId) await api.put(`/theatres/${editingId}`, body)
      else await api.post('/theatres', body)
      setForm(emptyTheatre); setEditingId(null); reload()
    } catch (err) { setError(errorMessage(err)) }
  }

  const remove = async (t) => {
    if (!window.confirm(`Delete ${t.name}?`)) return
    try { await api.delete(`/theatres/${t._id}`); reload() } catch (err) { setError(errorMessage(err)) }
  }

  return (
    <div className="row g-4">
      <div className="col-lg-5">
        <form className="admin-panel row g-3" onSubmit={save}>
          <h2 className="h4 col-12 mb-0">{editingId ? 'Edit theatre' : 'Add theatre'}</h2>
          <Field label="Name"><input className="form-control" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="City"><input className="form-control" required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></Field>
          <Field label="Address" className="col-12"><input className="form-control" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></Field>
          <div className="col-12">
            <div className="form-label small fw-semibold">Screens (rows max 26, seats per row max 40)</div>
            {form.screens.map((s, i) => (
              <div className="row g-2 mb-2" key={i}>
                <div className="col-5"><input className="form-control form-control-sm" aria-label="Screen name" required value={s.name} onChange={(e) => setScreen(i, 'name', e.target.value)} /></div>
                <div className="col-3"><input type="number" min="1" max="26" className="form-control form-control-sm" aria-label="Rows" required value={s.rows} onChange={(e) => setScreen(i, 'rows', e.target.value)} /></div>
                <div className="col-3"><input type="number" min="1" max="40" className="form-control form-control-sm" aria-label="Seats per row" required value={s.seatsPerRow} onChange={(e) => setScreen(i, 'seatsPerRow', e.target.value)} /></div>
                <div className="col-1">
                  {form.screens.length > 1 && (
                    <button type="button" className="btn btn-sm btn-link text-danger p-0" aria-label="Remove screen"
                      onClick={() => setForm({ ...form, screens: form.screens.filter((_, j) => j !== i) })}>✕</button>
                  )}
                </div>
              </div>
            ))}
            <button type="button" className="btn btn-sm btn-quiet"
              onClick={() => setForm({ ...form, screens: [...form.screens, { name: `Screen ${form.screens.length + 1}`, rows: 8, seatsPerRow: 12 }] })}>
              Add screen
            </button>
            {editingId && <div className="form-text">Layout changes apply to new shows only. Existing shows keep their seat map.</div>}
          </div>
          <div className="col-12 d-flex gap-2">
            <button className="btn btn-marquee">{editingId ? 'Save changes' : 'Add theatre'}</button>
            {editingId && <button type="button" className="btn btn-quiet" onClick={() => { setEditingId(null); setForm(emptyTheatre) }}>Cancel edit</button>}
          </div>
        </form>
      </div>
      <div className="col-lg-7">
        {error && <div className="alert alert-danger">{error}</div>}
        <div className="admin-panel table-responsive">
          <table className="table align-middle">
            <thead><tr><th>Theatre</th><th>City</th><th>Screens</th><th /></tr></thead>
            <tbody>
              {items.map((t) => (
                <tr key={t._id}>
                  <td className="fw-semibold">{t.name}</td>
                  <td>{t.city}</td>
                  <td className="small">{t.screens.map((s) => `${s.name} (${s.rows}×${s.seatsPerRow})`).join(', ')}</td>
                  <td className="text-end text-nowrap">
                    <button className="btn btn-sm btn-quiet me-1" onClick={() => { setEditingId(t._id); setForm({ name: t.name, city: t.city, address: t.address, screens: t.screens }) }}>Edit</button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => remove(t)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

/* ---------------- Shows ---------------- */
function ShowsAdmin() {
  const movies = useList('/movies').items
  const theatres = useList('/theatres').items
  const { items, error, setError, reload } = useList('/shows')
  const [form, setForm] = useState({ movie: '', theatre: '', screenName: '', startTime: '', price: 200 })
  const [msg, setMsg] = useState('')

  const theatre = theatres.find((t) => t._id === form.theatre)

  const save = async (e) => {
    e.preventDefault()
    setError(''); setMsg('')
    try {
      await api.post('/shows', { ...form, price: Number(form.price), startTime: localInputToISO(form.startTime) })
      setMsg('Show added')
      setForm({ ...form, startTime: '' })
      reload()
    } catch (err) { setError(errorMessage(err)) }
  }

  const remove = async (s) => {
    if (!window.confirm('Delete this show?')) return
    try { await api.delete(`/shows/${s._id}`); reload() } catch (err) { setError(errorMessage(err)) }
  }

  const changePrice = async (s) => {
    const v = window.prompt('New ticket price (applies to new bookings only)', s.price)
    if (v === null) return
    try { await api.put(`/shows/${s._id}`, { price: Number(v) }); reload() } catch (err) { setError(errorMessage(err)) }
  }

  return (
    <div className="row g-4">
      <div className="col-lg-4">
        <form className="admin-panel row g-3" onSubmit={save}>
          <h2 className="h4 col-12 mb-0">Add show</h2>
          {msg && <div className="col-12"><div className="alert alert-success py-2 mb-0">{msg}</div></div>}
          <Field label="Movie" className="col-12">
            <select className="form-select" required value={form.movie} onChange={(e) => setForm({ ...form, movie: e.target.value })}>
              <option value="">Choose a movie</option>
              {movies.map((m) => <option key={m._id} value={m._id}>{m.title}</option>)}
            </select>
          </Field>
          <Field label="Theatre" className="col-12">
            <select className="form-select" required value={form.theatre} onChange={(e) => setForm({ ...form, theatre: e.target.value, screenName: '' })}>
              <option value="">Choose a theatre</option>
              {theatres.map((t) => <option key={t._id} value={t._id}>{t.name}, {t.city}</option>)}
            </select>
          </Field>
          <Field label="Screen" className="col-12">
            <select className="form-select" required disabled={!theatre} value={form.screenName} onChange={(e) => setForm({ ...form, screenName: e.target.value })}>
              <option value="">Choose a screen</option>
              {theatre?.screens.map((s) => <option key={s.name} value={s.name}>{s.name} ({s.rows * s.seatsPerRow} seats)</option>)}
            </select>
          </Field>
          <Field label="Start time (IST)" className="col-12">
            <input type="datetime-local" className="form-control" required value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
          </Field>
          <Field label="Ticket price (₹)" className="col-12">
            <input type="number" min="0" className="form-control" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          </Field>
          <div className="col-12"><button className="btn btn-marquee">Add show</button></div>
        </form>
      </div>
      <div className="col-lg-8">
        {error && <div className="alert alert-danger">{error}</div>}
        <div className="admin-panel table-responsive">
          <table className="table align-middle small">
            <thead><tr><th>When</th><th>Movie</th><th>Where</th><th>Seats left</th><th>Price</th><th /></tr></thead>
            <tbody>
              {items.map((s) => (
                <tr key={s._id}>
                  <td className="text-nowrap">{fmtDate(s.startTime)}<br />{fmtTime(s.startTime)}</td>
                  <td className="fw-semibold">{s.movie?.title}</td>
                  <td>{s.theatre?.name}<br /><span className="text-muted-ink">{s.screenName}</span></td>
                  <td>{s.availableSeats}/{s.totalSeats}</td>
                  <td>{fmtMoney(s.price)}</td>
                  <td className="text-end text-nowrap">
                    <button className="btn btn-sm btn-quiet me-1" onClick={() => changePrice(s)}>Price</button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => remove(s)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {items.length === 0 && <p className="text-muted-ink mb-0">No upcoming shows.</p>}
        </div>
      </div>
    </div>
  )
}

/* ---------------- Bookings ---------------- */
function BookingsAdmin() {
  const { items, error } = useList('/bookings')
  const confirmed = items.filter((b) => b.status === 'confirmed')
  const revenue = confirmed.reduce((sum, b) => sum + b.totalAmount, 0)
  return (
    <>
      {error && <div className="alert alert-danger">{error}</div>}
      <p className="mb-3">
        <strong>{confirmed.length}</strong> confirmed bookings, <strong>{fmtMoney(revenue)}</strong> in ticket sales
        <span className="text-muted-ink"> (latest 200)</span>
      </p>
      <div className="d-grid gap-3" style={{ maxWidth: 820 }}>
        {items.map((b) => <Ticket key={b._id} booking={b} showUser />)}
        {items.length === 0 && <p className="text-muted-ink">No bookings yet.</p>}
      </div>
    </>
  )
}
