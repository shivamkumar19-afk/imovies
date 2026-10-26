import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import api, { errorMessage } from '../api/axios'
import Poster from '../components/Poster'
import Loader from '../components/Loader'
import { fmtDateLong, fmtDuration, fmtMoney, fmtTime, nextDays } from '../utils/format'

export default function MovieDetails() {
  const { id } = useParams()
  const [params, setParams] = useSearchParams()
  const days = useMemo(() => nextDays(5), [])
  const date = params.get('date') || days[0].iso

  const [movie, setMovie] = useState(null)
  const [shows, setShows] = useState([])
  const [loadingShows, setLoadingShows] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get(`/movies/${id}`).then((r) => setMovie(r.data)).catch((e) => setError(errorMessage(e)))
  }, [id])

  useEffect(() => {
    setLoadingShows(true)
    api
      .get('/shows', { params: { movieId: id, date } })
      .then((r) => setShows(r.data))
      .catch((e) => setError(errorMessage(e)))
      .finally(() => setLoadingShows(false))
  }, [id, date])

  // Group shows by theatre for the listing.
  const byTheatre = useMemo(() => {
    const map = new Map()
    for (const s of shows) {
      const key = s.theatre._id
      if (!map.has(key)) map.set(key, { theatre: s.theatre, shows: [] })
      map.get(key).shows.push(s)
    }
    return [...map.values()]
  }, [shows])

  if (error && !movie) return <div className="container py-5"><div className="alert alert-danger">{error}</div></div>
  if (!movie) return <Loader />

  return (
    <>
      <section className="details-head">
        {movie.posterUrl && <div className="hero-backdrop" style={{ backgroundImage: `url(${movie.posterUrl})` }} aria-hidden="true" />}
        <div className="container">
          <div className="row g-4 align-items-end">
            <div className="col-5 col-sm-4 col-md-3"><Poster movie={movie} /></div>
            <div className="col-12 col-sm-8 col-md-9">
              <div className="mb-2">
                {movie.genre.map((g) => <span className="chip" key={g}>{g}</span>)}
              </div>
              <h1 className="mb-2">{movie.title}</h1>
              <div className="facts mb-3">
                {movie.rating > 0 && <><span className="rating-star">★</span> {movie.rating.toFixed(1)}/10<span className="mx-2 opacity-50">|</span></>}
                <span className="cert me-2">{movie.certificate}</span>
                {movie.language} · {fmtDuration(movie.duration)}
              </div>
              {movie.description && <p className="lead-text mb-0">{movie.description}</p>}
            </div>
          </div>
        </div>
      </section>

      <div className="container py-4">
        <h2 className="h3 mb-3">Showtimes</h2>
        <div className="date-strip mb-4" role="group" aria-label="Pick a date">
          {days.map((d) => (
            <button
              key={d.iso}
              type="button"
              className="date-chip"
              aria-pressed={d.iso === date}
              onClick={() => setParams({ date: d.iso }, { replace: true })}
            >
              <div className="dow">{d.dow}</div>
              <div className="day">{d.day}</div>
              <div className="mon">{d.mon}</div>
            </button>
          ))}
        </div>

        {loadingShows ? (
          <Loader label="Finding shows" />
        ) : byTheatre.length === 0 ? (
          <div className="empty-state">
            <h3>No shows on {fmtDateLong(`${date}T12:00:00+05:30`)}</h3>
            <p>Try another date above.</p>
          </div>
        ) : (
          <div className="showtimes-panel">
            {byTheatre.map(({ theatre, shows }) => (
              <div className="theatre-row row g-2 align-items-center" key={theatre._id}>
                <div className="col-12 col-md-4">
                  <div className="fw-bold">{theatre.name}</div>
                  <div className="small text-muted-ink">{theatre.address}, {theatre.city}</div>
                </div>
                <div className="col-12 col-md-8 d-flex flex-wrap gap-2">
                  {shows.map((s) => {
                    const filling = s.availableSeats / s.totalSeats < 0.3
                    return (
                      <Link
                        key={s._id}
                        to={`/shows/${s._id}/seats`}
                        className={`time-pill ${filling ? 'filling' : ''}`}
                        aria-label={`${fmtTime(s.startTime)}, ${s.screenName}, ${fmtMoney(s.price)}, ${s.availableSeats} seats left`}
                      >
                        {fmtTime(s.startTime)}
                        <small>{fmtMoney(s.price)} · {s.availableSeats} left</small>
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
