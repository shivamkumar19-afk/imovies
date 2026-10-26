import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import api, { errorMessage } from '../api/axios'
import Ticket from '../components/Ticket'
import Loader from '../components/Loader'

export default function BookingConfirmation() {
  const { id } = useParams()
  const { state } = useLocation()
  const [booking, setBooking] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get(`/bookings/${id}`).then((r) => setBooking(r.data)).catch((e) => setError(errorMessage(e)))
  }, [id])

  if (error) return <div className="container py-5"><div className="alert alert-danger">{error}</div></div>
  if (!booking) return <Loader />

  return (
    <div className="container py-5" style={{ maxWidth: 720 }}>
      <h1 className="mb-1">{state?.justBooked ? 'You’re booked' : 'Your booking'}</h1>
      <p className="text-muted-ink mb-4">
        {state?.justBooked ? 'Show this booking ID at the counter.' : 'Booking details.'}
      </p>
      <Ticket booking={booking} />
      <div className="d-flex gap-2 mt-4">
        <Link to="/my-bookings" className="btn btn-quiet">See all my bookings</Link>
        <Link to="/" className="btn btn-marquee">Browse more movies</Link>
      </div>
    </div>
  )
}
