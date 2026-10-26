import { useEffect, useRef } from 'react'

// Renders a rows x seatsPerRow seat map with an aisle down the middle.
// Seat ids are "A1", "A2", ... matching the backend.
export const MAX_SEATS = 6

export default function SeatGrid({ rows, seatsPerRow, bookedSeats = [], selected = [], onToggle, max = MAX_SEATS }) {
  const booked = new Set(bookedSeats)
  const picked = new Set(selected)
  const aisleAfter = Math.floor(seatsPerRow / 2)
  const atMax = selected.length >= max
  const scrollRef = useRef(null)

  // On narrow screens the map overflows; start scrolled to the centre aisle.
  useEffect(() => {
    const el = scrollRef.current
    if (el && el.scrollWidth > el.clientWidth) el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2
  }, [rows, seatsPerRow])

  return (
    <>
    <div className="seat-hint">Swipe sideways to see every seat</div>
    <div className="seat-scroll" ref={scrollRef}>
      <div className="seat-grid" role="group" aria-label="Seat map">
        {Array.from({ length: rows }, (_, r) => {
          const rowLetter = String.fromCharCode(65 + r)
          return (
            <div className="seat-row" key={rowLetter}>
              <span className="row-label" aria-hidden="true">{rowLetter}</span>
              {Array.from({ length: seatsPerRow }, (_, s) => {
                const id = `${rowLetter}${s + 1}`
                const isBooked = booked.has(id)
                const isPicked = picked.has(id)
                const disabled = isBooked || (atMax && !isPicked)
                return [
                  s === aisleAfter ? <span className="aisle" key={`aisle-${id}`} /> : null,
                  <button
                    key={id}
                    type="button"
                    className={`seat ${isBooked ? 'booked' : ''} ${isPicked ? 'selected' : ''}`}
                    disabled={disabled}
                    aria-pressed={isPicked}
                    aria-label={`Seat ${id}${isBooked ? ', booked' : isPicked ? ', selected' : ''}`}
                    title={isBooked ? `${id} is booked` : atMax && !isPicked ? `Max ${max} seats` : id}
                    onClick={() => onToggle(id)}
                  >
                    {s + 1}
                  </button>,
                ]
              })}
              <span className="row-label" aria-hidden="true">{rowLetter}</span>
            </div>
          )
        })}
      </div>
    </div>
    </>
  )
}
