import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import api, { errorMessage } from '../api/axios'
import MovieCard from '../components/MovieCard'
import Poster from '../components/Poster'
import Loader from '../components/Loader'
import { fmtDuration } from '../utils/format'

function FeaturedHero({ movie }) {
  if (!movie) {
    return (
      <section className="hero">
        <div className="container hero-inner">
          <h1>Now showing</h1>
          <p className="hero-desc mb-0">Pick a film, choose a showtime, and pick your exact seats.</p>
        </div>
      </section>
    )
  }
  return (
    <section className="hero">
      {movie.posterUrl && <div className="hero-backdrop" style={{ backgroundImage: `url(${movie.posterUrl})` }} aria-hidden="true" />}
      <div className="container hero-inner">
        <div className="row align-items-center g-4">
          <div className="col-12 col-md-8 col-lg-7">
            <div className="kicker">Top rated this week</div>
            <h1>{movie.title}</h1>
            <div className="hero-meta">
              <span className="rating-star">★</span> {movie.rating.toFixed(1)}/10
              <span className="mx-2 opacity-50">|</span>
              <span className="cert me-2">{movie.certificate}</span>
              {movie.language} · {movie.genre.join(', ')} · {fmtDuration(movie.duration)}
            </div>
            {movie.description && <p className="hero-desc">{movie.description}</p>}
            <div className="d-flex gap-2 flex-wrap">
              <Link to={`/movies/${movie._id}`} className="btn btn-marquee btn-lg px-4">Book tickets</Link>
            </div>
          </div>
          <div className="col-md-4 col-lg-5 d-none d-md-block">
            <Poster movie={movie} className="hero-poster" />
          </div>
        </div>
      </div>
    </section>
  )
}

export default function Home() {
  const [movies, setMovies] = useState([])
  const [filters, setFilters] = useState({ genres: [], languages: [] })
  const [q, setQ] = useState('')
  const [genre, setGenre] = useState('')
  const [language, setLanguage] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [featured, setFeatured] = useState(null)

  useEffect(() => {
    api.get('/movies/filters').then((r) => setFilters(r.data)).catch(() => {})
  }, [])

  // Debounce typing so we don't hit the API on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => {
      setLoading(true)
      api
        .get('/movies', { params: { q: q || undefined, genre: genre || undefined, language: language || undefined } })
        .then((r) => {
          setMovies(r.data)
          setError('')
          // Pick the featured film once, from the unfiltered list, so the hero doesn't jump while filtering.
          if (!q && !genre && !language) {
            setFeatured((f) => f || [...r.data].sort((a, b) => b.rating - a.rating)[0] || null)
          }
        })
        .catch((e) => setError(errorMessage(e)))
        .finally(() => setLoading(false))
    }, 250)
    return () => clearTimeout(t)
  }, [q, genre, language])

  const filtered = q || genre || language
  const heading = useMemo(() => {
    if (!filtered) return 'Now showing'
    return [genre, language].filter(Boolean).join(' · ') || 'Search results'
  }, [filtered, genre, language])

  return (
    <>
      <FeaturedHero movie={featured} />

      <div className="container pb-4">
        <form className="filter-bar row g-2 mx-0" role="search" onSubmit={(e) => e.preventDefault()}>
          <div className="col-12 col-md-6">
            <label htmlFor="search" className="visually-hidden">Search movies</label>
            <input id="search" className="form-control form-control-lg" placeholder="Search movies by title" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="col-6 col-md-3">
            <label htmlFor="genre" className="visually-hidden">Genre</label>
            <select id="genre" className="form-select form-select-lg" value={genre} onChange={(e) => setGenre(e.target.value)}>
              <option value="">All genres</option>
              {filters.genres.map((g) => <option key={g}>{g}</option>)}
            </select>
          </div>
          <div className="col-6 col-md-3">
            <label htmlFor="language" className="visually-hidden">Language</label>
            <select id="language" className="form-select form-select-lg" value={language} onChange={(e) => setLanguage(e.target.value)}>
              <option value="">All languages</option>
              {filters.languages.map((l) => <option key={l}>{l}</option>)}
            </select>
          </div>
        </form>

        <div className="section-head">
          <h2>{heading}</h2>
          {!loading && movies.length > 0 && <span className="count">{movies.length} {movies.length === 1 ? 'movie' : 'movies'}</span>}
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        {loading && movies.length === 0 ? (
          <Loader label="Loading movies" />
        ) : movies.length === 0 && !error ? (
          <div className="empty-state">
            <h3>No movies match</h3>
            {filtered ? (
              <button className="btn btn-quiet mt-2" onClick={() => { setQ(''); setGenre(''); setLanguage('') }}>Clear filters</button>
            ) : (
              <p>An admin needs to add movies first.</p>
            )}
          </div>
        ) : (
          <div className="row row-cols-2 row-cols-sm-3 row-cols-lg-5 g-3 g-md-4" aria-busy={loading}>
            {movies.map((m) => (
              <div className="col" key={m._id}><MovieCard movie={m} /></div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
