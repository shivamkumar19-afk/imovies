import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api, { errorMessage } from '../api/axios'
import Ticket from '../components/Ticket'
import Loader from '../components/Loader'

export default function MyBookings() {
  const [bookings, setBookings] = useState(null)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)

  useEffect(() => {
    api.get('/bookings/my').then((r) => setBookings(r.data)).catch((e) => setError(errorMessage(e)))
  }, [])

  const cancel = async (b) => {
    if (!window.confirm(`Cancel ${b.seats.length} seat(s) for ${b.show?.movie?.title}?`)) return
    setBusyId(b._id)
    setError('')
    try {
      const { data } = await api.put(`/bookings/${b._id}/cancel`)
      setBookings((list) => list.map((x) => (x._id === b._id ? data : x)))
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusyId(null)
    }
  }

  if (!bookings && !error) return <Loader label="Loading your bookings" />

  const now = new Date()
  const upcoming = (bookings || []).filter((b) => b.status === 'confirmed' && b.show && new Date(b.show.startTime) > now)
  const rest = (bookings || []).filter((b) => !upcoming.includes(b))

  return (
    <div className="container py-4" style={{ maxWidth: 820 }}>
      <h1 className="mb-4">My bookings</h1>
      {error && <div className="alert alert-danger">{error}</div>}

      {bookings?.length === 0 && (
        <div className="empty-state">
          <h3>No bookings yet</h3>
          <Link to="/" className="btn btn-marquee mt-2">Find a movie</Link>
        </div>
      )}

      {upcoming.length > 0 && (
        <section className="mb-5">
          <h2 className="h3 mb-3">Upcoming</h2>
          <div className="d-grid gap-3">
            {upcoming.map((b) => (
              <Ticket
                key={b._id}
                booking={b}
                actions={
                  <button className="btn btn-sm btn-outline-danger" disabled={busyId === b._id} onClick={() => cancel(b)}>
                    {busyId === b._id ? 'Cancelling…' : 'Cancel booking'}
                  </button>
                }
              />
            ))}
          </div>
        </section>
      )}

      {rest.length > 0 && (
        <section>
          <h2 className="h3 mb-3">Past and cancelled</h2>
          <div className="d-grid gap-3">
            {rest.map((b) => <Ticket key={b._id} booking={b} />)}
          </div>
        </section>
      )}
    </div>
  )
}
