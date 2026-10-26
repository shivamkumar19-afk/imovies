import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import api, { errorMessage } from '../api/axios'
import { useAuth } from '../context/AuthContext'
import SeatGrid, { MAX_SEATS } from '../components/SeatGrid'
import Loader from '../components/Loader'
import { fmtDate, fmtMoney, fmtTime } from '../utils/format'

const POLL_MS = 8000 // refresh seat map so people see seats others just booked

export default function SeatSelection() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [show, setShow] = useState(null)
  const [selected, setSelected] = useState([])
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [booking, setBooking] = useState(false)

  const load = useCallback(async () => {
    try {
      const { data } = await api.get(`/shows/${id}`)
      setShow(data)
      // If someone else grabbed a seat we had selected, drop it and say so.
      setSelected((prev) => {
        const lost = prev.filter((s) => data.bookedSeats.includes(s))
        if (lost.length) setNotice(`${lost.join(', ')} just got booked by someone else.`)
        return prev.filter((s) => !data.bookedSeats.includes(s))
      })
    } catch (e) {
      setError(errorMessage(e))
    }
  }, [id])

  useEffect(() => {
    load()
    const t = setInterval(load, POLL_MS)
    return () => clearInterval(t)
  }, [load])

  const toggle = (seat) => {
    setNotice('')
    setSelected((prev) => (prev.includes(seat) ? prev.filter((s) => s !== seat) : [...prev, seat]))
  }

  const book = async () => {
    if (!user) {
      navigate('/login', { state: { from: `/shows/${id}/seats` } })
      return
    }
    setBooking(true)
    setError('')
    try {
      const { data } = await api.post('/bookings', { showId: id, seats: selected })
      navigate(`/bookings/${data._id}`, { state: { justBooked: true } })
    } catch (e) {
      setError(errorMessage(e))
      if (e.response?.status === 409) load() // refresh map to show what got taken
    } finally {
      setBooking(false)
    }
  }

  if (error && !show) return <div className="container py-5"><div className="alert alert-danger">{error}</div></div>
  if (!show) return <Loader label="Loading seat map" />

  const started = new Date(show.startTime) <= new Date()
  const sortedSeats = [...selected].sort((a, b) => a[0].localeCompare(b[0]) || parseInt(a.slice(1)) - parseInt(b.slice(1)))
  const total = selected.length * show.price

  return (
    <div className="container py-4">
      <Link to={`/movies/${show.movie._id}`} className="small">Back to showtimes</Link>
      <h1 className="h2 mt-2 mb-1">{show.movie.title}</h1>
      <p className="text-muted-ink mb-4">
        {show.theatre.name}, {show.theatre.city} — {show.screenName}<br />
        {fmtDate(show.startTime)}, {fmtTime(show.startTime)} · {fmtMoney(show.price)} per seat
      </p>

      {started && <div className="alert alert-warning">This show has already started. Booking is closed.</div>}
      {notice && <div className="alert alert-warning" role="status">{notice}</div>}
      {error && <div className="alert alert-danger" role="alert">{error}</div>}

      <div className="seat-stage">
        <div className="screen-arc">Screen this way</div>
        <SeatGrid
          rows={show.rows}
          seatsPerRow={show.seatsPerRow}
          bookedSeats={show.bookedSeats}
          selected={selected}
          onToggle={started ? () => {} : toggle}
        />
        <div className="seat-legend mt-4">
          <span><span className="seat d-inline-block" />Available</span>
          <span><span className="seat selected d-inline-block" />Your pick</span>
          <span><span className="seat booked d-inline-block" />Booked</span>
          <span>Up to {MAX_SEATS} seats per booking</span>
        </div>
      </div>

      <div className="checkout-bar d-flex align-items-center justify-content-between gap-3 flex-wrap">
        <div>
          <div className="seats-picked">
            {selected.length ? `${selected.length} seat${selected.length > 1 ? 's' : ''}: ${sortedSeats.join(', ')}` : 'Tap seats on the map to pick them'}
          </div>
          <div className="total">{fmtMoney(total)}</div>
        </div>
        <button className="btn btn-marquee btn-lg" disabled={!selected.length || booking || started} onClick={book}>
          {booking ? 'Booking…' : !user ? 'Log in to book' : `Book ${selected.length || ''} seat${selected.length === 1 ? '' : 's'}`}
        </button>
      </div>
    </div>
  )
}
