// All times are shown in the cinema's timezone, not the browser's.
export const TIME_ZONE = 'Asia/Kolkata'

export const fmtTime = (d) =>
  new Date(d).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', timeZone: TIME_ZONE })

export const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', timeZone: TIME_ZONE })

export const fmtDateLong = (d) =>
  new Date(d).toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: TIME_ZONE,
  })

export const fmtMoney = (n) => `₹${Number(n).toLocaleString('en-IN')}`

export const fmtDuration = (min) => `${Math.floor(min / 60)}h ${min % 60}m`

// YYYY-MM-DD for a Date, in the cinema timezone
export const isoDay = (d) => new Date(d).toLocaleDateString('en-CA', { timeZone: TIME_ZONE })

// Next n days starting today, for the date strip
export function nextDays(n = 5) {
  const out = []
  for (let i = 0; i < n; i++) {
    const d = new Date(Date.now() + i * 86400000)
    out.push({
      iso: isoDay(d),
      dow: i === 0 ? 'Today' : d.toLocaleDateString('en-IN', { weekday: 'short', timeZone: TIME_ZONE }),
      day: d.toLocaleDateString('en-IN', { day: 'numeric', timeZone: TIME_ZONE }),
      mon: d.toLocaleDateString('en-IN', { month: 'short', timeZone: TIME_ZONE }),
    })
  }
  return out
}

// Convert a <input type="datetime-local"> value (cinema-local) to an ISO string.
// Assumes the cinema is at +05:30.
export const localInputToISO = (value) => new Date(`${value}:00+05:30`).toISOString()
