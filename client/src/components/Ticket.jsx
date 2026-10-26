import { Link } from 'react-router-dom'
import { fmtDate, fmtMoney, fmtTime } from '../utils/format'

export default function Ticket({ booking, actions, showUser = false }) {
  const show = booking.show
  const started = show && new Date(show.startTime) <= new Date()
  const status = booking.status === 'cancelled' ? 'cancelled' : started ? 'past' : 'confirmed'
  const statusText = { cancelled: 'Cancelled', past: 'Show over', confirmed: 'Confirmed' }[status]

  return (
    <article className={`ticket ${booking.status === 'cancelled' ? 'cancelled' : ''}`}>
      <div className="ticket-main">
        <div className="d-flex justify-content-between align-items-start gap-2 mb-1">
          <div className="movie-name">
            {show?.movie ? <Link to={`/movies/${show.movie._id}`} className="text-reset text-decoration-none">{show.movie.title}</Link> : 'Show removed'}
          </div>
          <span className={`status-badge ${status}`}>{statusText}</span>
        </div>
        {show && (
          <>
            <div className="fw-semibold">{fmtDate(show.startTime)}, {fmtTime(show.startTime)}</div>
            <div className="text-muted-ink">
              {show.theatre?.name}, {show.theatre?.city} — {show.screenName}
            </div>
          </>
        )}
        <div className="text-muted-ink small mt-2">
          Booking ID {booking._id.slice(-8).toUpperCase()} · booked {fmtDate(booking.createdAt)}
          {showUser && booking.user?.email && <> · {booking.user.name} ({booking.user.email})</>}
        </div>
        {actions && <div className="mt-3">{actions}</div>}
      </div>
      <div className="ticket-stub">
        <div className="small text-muted-ink">{booking.seats.length === 1 ? 'Seat' : 'Seats'}</div>
        <div className="seat-list">{booking.seats.join(' ')}</div>
        <div className="fw-bold mt-2">{fmtMoney(booking.totalAmount)}</div>
      </div>
    </article>
  )
}
