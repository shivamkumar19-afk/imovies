import { Link } from 'react-router-dom'
import Poster from './Poster'
import { fmtDuration } from '../utils/format'

export const Star = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.8l2.8 5.7 6.3.9-4.6 4.4 1.1 6.2L12 17l-5.6 3 1.1-6.2L2.9 9.4l6.3-.9z" /></svg>
)

export default function MovieCard({ movie }) {
  return (
    <Link to={`/movies/${movie._id}`} className="movie-card">
      <div className="position-relative">
        <Poster movie={movie} />
        {movie.rating > 0 && (
          <span className="rating-badge" aria-label={`Rated ${movie.rating.toFixed(1)} out of 10`}>
            <Star />{movie.rating.toFixed(1)}
          </span>
        )}
      </div>
      <div className="title">{movie.title}</div>
      <div className="meta">
        <span className="cert me-2">{movie.certificate}</span>
        {movie.language} · {fmtDuration(movie.duration)}
      </div>
      <div className="meta">{movie.genre?.slice(0, 2).join(', ')}</div>
    </Link>
  )
}
