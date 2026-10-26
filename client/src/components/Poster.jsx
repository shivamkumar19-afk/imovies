import { useState } from 'react'

// Deterministic two-colour gradient from the title, so every movie has a
// recognisable poster even without a posterUrl.
function palette(title = '') {
  let h = 0
  for (const ch of title) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  const hue = h % 360
  const hue2 = (hue + 40 + (h % 60)) % 360
  return `linear-gradient(160deg, hsl(${hue} 55% 42%) 0%, hsl(${hue2} 60% 22%) 100%)`
}

export default function Poster({ movie, className = '' }) {
  const [broken, setBroken] = useState(false)
  const showImg = movie?.posterUrl && !broken

  return (
    <div className={`poster ${className}`} style={showImg ? undefined : { background: palette(movie?.title) }}>
      {showImg ? (
        <img src={movie.posterUrl} alt={`${movie.title} poster`} loading="lazy" onError={() => setBroken(true)} />
      ) : (
        <div className="poster-fallback" aria-hidden="true">
          <div className="poster-title">{movie?.title}</div>
          <div className="poster-lang">{movie?.language}</div>
        </div>
      )}
    </div>
  )
}
