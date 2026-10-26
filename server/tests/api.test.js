// End-to-end API tests. Needs a MongoDB (or compatible) server.
//   TEST_MONGO_URI=mongodb://127.0.0.1:27017/imovies_test npm test
// WARNING: wipes the database it points at.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');

process.env.JWT_SECRET = 'test-secret';
const app = require('../app');
const seed = require('../seed/seedData');
const Show = require('../models/Show');
const Movie = require('../models/Movie');

const URI = process.env.TEST_MONGO_URI || 'mongodb://127.0.0.1:27017/imovies_test';
let server, base;

async function api(method, path, { token, body } = {}) {
  const res = await fetch(base + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

const login = async (email, password) => (await api('POST', '/api/auth/login', { body: { email, password } })).data.token;

let adminToken, userToken, otherToken, showId;

before(async () => {
  await mongoose.connect(URI);
  await seed({ log: () => {} });
  server = app.listen(0);
  base = `http://127.0.0.1:${server.address().port}`;
  adminToken = await login('admin@imovies.com', 'admin123');
  userToken = await login('user@imovies.com', 'user123');
  const reg = await api('POST', '/api/auth/register', { body: { name: 'Other', email: 'other@x.com', password: 'secret1' } });
  otherToken = reg.data.token;
  const shows = await api('GET', '/api/shows');
  showId = shows.data[shows.data.length - 1]._id; // a show days away
});

after(async () => {
  server?.close();
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

test('auth: register ignores role=admin in body', async () => {
  const r = await api('POST', '/api/auth/register', {
    body: { name: 'Hacker', email: 'h@x.com', password: 'secret1', role: 'admin' },
  });
  assert.equal(r.status, 201);
  assert.equal(r.data.user.role, 'user');
});

test('auth: duplicate email, wrong password, /me', async () => {
  assert.equal((await api('POST', '/api/auth/register', { body: { name: 'a', email: 'USER@imovies.com', password: 'xxxxxx' } })).status, 409);
  assert.equal((await api('POST', '/api/auth/login', { body: { email: 'user@imovies.com', password: 'nope' } })).status, 401);
  const me = await api('GET', '/api/auth/me', { token: userToken });
  assert.equal(me.data.user.email, 'user@imovies.com');
  assert.equal((await api('GET', '/api/auth/me')).status, 401);
  assert.equal((await api('GET', '/api/auth/me', { token: 'garbage' })).status, 401);
});

test('movies: list, search, filter, filters endpoint, bad id', async () => {
  const all = await api('GET', '/api/movies');
  assert.equal(all.data.length, 10);
  const q = await api('GET', '/api/movies?q=orbit');
  assert.equal(q.data.length, 1);
  assert.equal(q.data[0].title, 'Orbit 9');
  const hindi = await api('GET', '/api/movies?language=hindi');
  assert.ok(hindi.data.every((m) => m.language === 'Hindi'));
  const f = await api('GET', '/api/movies/filters');
  assert.ok(f.data.genres.includes('Comedy'));
  assert.equal((await api('GET', '/api/movies/not-an-id')).status, 400);
  assert.equal((await api('GET', '/api/movies?q=(((')).status, 200); // regex chars escaped
});

test('movies: admin-only writes', async () => {
  const body = { title: 'Test Film', language: 'Hindi', duration: 100, genre: 'Drama, Comedy' };
  assert.equal((await api('POST', '/api/movies', { body })).status, 401);
  assert.equal((await api('POST', '/api/movies', { token: userToken, body })).status, 403);
  const created = await api('POST', '/api/movies', { token: adminToken, body });
  assert.equal(created.status, 201);
  assert.deepEqual(created.data.genre, ['Drama', 'Comedy']);
  const upd = await api('PUT', `/api/movies/${created.data._id}`, { token: adminToken, body: { rating: 9 } });
  assert.equal(upd.data.rating, 9);
  assert.equal((await api('DELETE', `/api/movies/${created.data._id}`, { token: adminToken })).status, 200);
  // movie with shows can't be deleted
  const withShows = (await api('GET', '/api/movies')).data[0];
  assert.equal((await api('DELETE', `/api/movies/${withShows._id}`, { token: adminToken })).status, 409);
});

test('shows: list by movie + date, detail has seat data', async () => {
  const show = (await api('GET', `/api/shows/${showId}`)).data;
  const date = new Date(new Date(show.startTime).getTime() + 5.5 * 3600e3).toISOString().slice(0, 10);
  const list = await api('GET', `/api/shows?movieId=${show.movie._id}&date=${date}`);
  assert.ok(list.data.length >= 1);
  assert.ok(list.data.every((s) => s.movie._id === show.movie._id));
  assert.ok(list.data[0].availableSeats > 0);
  assert.equal(list.data[0].bookedSeats, undefined); // list hides seat array
  assert.ok(Array.isArray(show.bookedSeats));
  assert.equal((await api('GET', '/api/shows?date=24-10-2026')).status, 400);
});

test('shows: admin create copies screen layout and rejects overlaps', async () => {
  const theatres = (await api('GET', '/api/theatres')).data;
  const t = theatres.find((x) => x.name === 'Regal Talkies');
  const movie = (await api('GET', '/api/movies')).data[0];
  const start = new Date(Date.now() + 10 * 86400e3); // beyond seeded range
  start.setUTCHours(4, 0, 0, 0);
  const body = { movie: movie._id, theatre: t._id, screenName: 'Hall B', startTime: start.toISOString(), price: 200 };
  const c = await api('POST', '/api/shows', { token: adminToken, body });
  assert.equal(c.status, 201, JSON.stringify(c.data));
  assert.equal(c.data.rows, 7);
  assert.equal(c.data.seatsPerRow, 10);
  const overlap = { ...body, startTime: new Date(start.getTime() + 30 * 60e3).toISOString() };
  assert.equal((await api('POST', '/api/shows', { token: adminToken, body: overlap })).status, 409);
  assert.equal((await api('POST', '/api/shows', { token: adminToken, body: { ...body, screenName: 'Nope' } })).status, 400);
  assert.equal((await api('POST', '/api/shows', { token: adminToken, body: { ...body, startTime: '2020-01-01T00:00:00Z' } })).status, 400);
  assert.equal((await api('DELETE', `/api/shows/${c.data._id}`, { token: adminToken })).status, 200);
});

test('booking: validation', async () => {
  const b = (seats) => api('POST', '/api/bookings', { token: userToken, body: { showId, seats } });
  assert.equal((await api('POST', '/api/bookings', { body: { showId, seats: ['A1'] } })).status, 401);
  assert.equal((await b([])).status, 400);
  assert.equal((await b(['A1', 'A1'])).status, 400);
  assert.equal((await b(['Z99'])).status, 400);
  assert.equal((await b(['A0'])).status, 400);
  assert.equal((await b(['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7'])).status, 400);
});

test('booking: price computed server-side, seats appear in show', async () => {
  const show = (await api('GET', `/api/shows/${showId}`)).data;
  const r = await api('POST', '/api/bookings', {
    token: userToken,
    body: { showId, seats: ['b1', 'B2'], totalAmount: 1 },
  });
  assert.equal(r.status, 201, JSON.stringify(r.data));
  assert.equal(r.data.totalAmount, show.price * 2);
  assert.deepEqual(r.data.seats, ['B1', 'B2']);
  const after = (await api('GET', `/api/shows/${showId}`)).data;
  assert.ok(after.bookedSeats.includes('B1') && after.bookedSeats.includes('B2'));
  // partial overlap is rejected entirely
  const clash = await api('POST', '/api/bookings', { token: otherToken, body: { showId, seats: ['B2', 'B3'] } });
  assert.equal(clash.status, 409);
  assert.match(clash.data.message, /B2/);
  const again = (await api('GET', `/api/shows/${showId}`)).data;
  assert.ok(!again.bookedSeats.includes('B3'), 'B3 must not be booked after a failed request');
});

test('booking: 20 concurrent requests for the same seats -> exactly one wins', async (t) => {
  // FerretDB (a Mongo-compatible engine) does not make findOneAndUpdate atomic,
  // so this guarantee only holds on real MongoDB. Skip rather than lie.
  const info = await mongoose.connection.db.admin().command({ buildInfo: 1 });
  if (info.ferretdb || /ferret/i.test(JSON.stringify(info))) {
    return t.skip('not a real MongoDB server - run against MongoDB to verify atomicity');
  }
  const tokens = [userToken, otherToken];
  const results = await Promise.all(
    Array.from({ length: 20 }, (_, i) =>
      api('POST', '/api/bookings', { token: tokens[i % 2], body: { showId, seats: ['E5', 'E6'] } })
    )
  );
  const statuses = results.map((r) => r.status);
  assert.equal(statuses.filter((s) => s === 201).length, 1, `statuses: ${statuses}`);
  assert.equal(statuses.filter((s) => s === 409).length, 19);
  const show = await Show.findById(showId);
  assert.equal(show.bookedSeats.filter((s) => s === 'E5').length, 1);
});

test('booking: my bookings, ownership, cancel frees seats, no double cancel', async () => {
  const mine = await api('GET', '/api/bookings/my', { token: userToken });
  assert.ok(mine.data.length >= 1);
  assert.ok(mine.data[0].show.movie.title);
  const target = mine.data.find((b) => b.seats.includes('B1'));

  assert.equal((await api('GET', `/api/bookings/${target._id}`, { token: otherToken })).status, 404);
  assert.equal((await api('PUT', `/api/bookings/${target._id}/cancel`, { token: otherToken })).status, 404);

  const [c1, c2] = await Promise.all([
    api('PUT', `/api/bookings/${target._id}/cancel`, { token: userToken }),
    api('PUT', `/api/bookings/${target._id}/cancel`, { token: userToken }),
  ]);
  assert.deepEqual([c1.status, c2.status].sort(), [200, 400]);

  const show = (await api('GET', `/api/shows/${showId}`)).data;
  assert.ok(!show.bookedSeats.includes('B1'));
  const rebook = await api('POST', '/api/bookings', { token: otherToken, body: { showId, seats: ['B1'] } });
  assert.equal(rebook.status, 201);
});

test('booking: admin list, show with bookings cannot be deleted', async () => {
  assert.equal((await api('GET', '/api/bookings', { token: userToken })).status, 403);
  const all = await api('GET', '/api/bookings', { token: adminToken });
  assert.ok(all.data.length >= 2);
  assert.ok(all.data[0].user.email);
  assert.equal((await api('DELETE', `/api/shows/${showId}`, { token: adminToken })).status, 409);
});

test('booking: started shows cannot be booked', async () => {
  const s = await Show.findById(showId);
  const past = await Show.create({
    movie: s.movie, theatre: s.theatre, screenName: s.screenName, rows: 5, seatsPerRow: 5,
    startTime: new Date(Date.now() - 60e3), price: 100,
  });
  const r = await api('POST', '/api/bookings', { token: userToken, body: { showId: past._id, seats: ['A1'] } });
  assert.equal(r.status, 400);
  const pub = (await api('GET', '/api/shows')).data;
  assert.ok(!pub.some((x) => x._id === String(past._id)), 'past shows hidden from public list');
  await Show.deleteOne({ _id: past._id });
  assert.ok(await Movie.exists({ _id: s.movie }));
});

test('cross-user: seats booked by user A show as booked for user B, and B cannot take them', async () => {
  const tokenA = await login('user@imovies.com', 'user123');
  const tokenB = await login('user2@imovies.com', 'user123');
  const shows = (await api('GET', '/api/shows')).data;
  const target = shows[Math.floor(shows.length / 2)]._id;

  const a = await api('POST', '/api/bookings', { token: tokenA, body: { showId: target, seats: ['C3', 'C4'] } });
  assert.equal(a.status, 201);

  // B opens the same show (logged in as a different account)
  const seenByB = (await api('GET', `/api/shows/${target}`, { token: tokenB })).data;
  assert.ok(seenByB.bookedSeats.includes('C3') && seenByB.bookedSeats.includes('C4'));

  // B tries to book one of them
  const b = await api('POST', '/api/bookings', { token: tokenB, body: { showId: target, seats: ['C4', 'C5'] } });
  assert.equal(b.status, 409);

  // B's list doesn't contain A's booking
  const bList = (await api('GET', '/api/bookings/my', { token: tokenB })).data;
  assert.ok(!bList.some((x) => x._id === a.data._id));
});

test('topUpShows keeps bookings and does not duplicate shows', async () => {
  const { topUpShows } = require('../seed/seedData');
  const before = await Show.countDocuments();
  const bookedBefore = await Show.find({ bookedSeats: { $ne: [] } }, 'bookedSeats').lean();
  const added = await topUpShows({ log: () => {} });
  assert.equal(added, 0, 'all upcoming slots already exist');
  assert.equal(await Show.countDocuments(), before);
  for (const s of bookedBefore) {
    const now = await Show.findById(s._id, 'bookedSeats').lean();
    assert.deepEqual(now.bookedSeats, s.bookedSeats);
  }
});
