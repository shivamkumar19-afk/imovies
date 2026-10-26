// Seat ids look like "A1", "C12". Row letter A..Z, seat number 1..seatsPerRow.
const MAX_SEATS_PER_BOOKING = 6;

function allSeatIds(rows, seatsPerRow) {
  const ids = [];
  for (let r = 0; r < rows; r++) {
    for (let s = 1; s <= seatsPerRow; s++) ids.push(String.fromCharCode(65 + r) + s);
  }
  return ids;
}

function isValidSeat(id, rows, seatsPerRow) {
  const m = /^([A-Z])([1-9]\d?)$/.exec(id);
  if (!m) return false;
  const rowIdx = m[1].charCodeAt(0) - 65;
  const num = Number(m[2]);
  return rowIdx < rows && num >= 1 && num <= seatsPerRow;
}

module.exports = { allSeatIds, isValidSeat, MAX_SEATS_PER_BOOKING };
