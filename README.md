# IMovies – Movie Ticket Booking System

A full-stack MERN web app for booking movie tickets. Users browse movies, pick a date and showtime, choose exact seats on a live seat map and manage their bookings. Admins manage movies, theatres, shows and see all bookings.

![IMovies home page](docs/screenshots/home-light.png)

---

## Table of contents

1. [Features](#features)
2. [Tech stack](#tech-stack)
3. [Screenshots](#screenshots)
4. [Prerequisites](#prerequisites)
5. [Getting started](#getting-started)
6. [Environment variables](#environment-variables)
7. [Demo accounts](#demo-accounts)
8. [Project structure](#project-structure)
9. [Database design](#database-design)
10. [API reference](#api-reference)
11. [How double booking is prevented](#how-double-booking-is-prevented)
12. [Testing](#testing)
13. [Deployment](#deployment)
14. [Design decisions](#design-decisions)
15. [Known limitations and future work](#known-limitations-and-future-work)
16. [Project documentation](#project-documentation)

---

## Features

**For users**
- Sign up and log in (JWT authentication, passwords hashed with bcrypt)
- Browse movies with search by title and filters for genre and language
- Movie details page with poster, rating, certificate, duration and description
- Pick a date (next 5 days), then a theatre and showtime, with seats left and price shown
- Interactive seat map: available / selected / booked seats, centre aisle, max 6 seats per booking
- Seat availability is shared across users: seats booked from one account show as booked for every other account (the map refreshes every 8 seconds)
- Booking confirmation as a ticket with a booking ID
- **My bookings**: upcoming, past and cancelled bookings; cancel an upcoming booking to free the seats
- Light and dark mode with a toggle in the navbar (remembers the choice)
- Responsive on mobile, tablet and desktop

**For admins**
- Add, edit and delete movies (with optional poster URL)
- Add theatres with multiple screens and seat layouts (rows × seats per row)
- Schedule shows; the server refuses overlapping shows on the same screen
- Change ticket prices
- View all bookings with total ticket sales

**Backend safeguards**
- Atomic seat booking: two people can never book the same seat
- Ticket price is always calculated on the server
- Seat IDs are validated against the screen layout; shows that have started can't be booked or cancelled
- Role can't be set at sign-up, so nobody can register as admin
- Upcoming showtimes are topped up automatically so a long-running deployment never runs out of shows

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 19, React Router 7, Bootstrap 5, Axios, Vite 8 |
| Backend | Node.js, Express 5 |
| Database | MongoDB (Atlas or local) with Mongoose 9 |
| Auth | JSON Web Tokens, bcryptjs |
| API testing | Postman collection + Node test runner |
| Deployment | MongoDB Atlas, Render (API), Vercel (frontend) |

```
React (Vite + Bootstrap)  ── HTTP/JSON (Axios + JWT) ──>  Express API  ──>  MongoDB
      client/                                              server/          (Mongoose)
```

## Screenshots

| Movie details and showtimes | Seat selection |
|---|---|
| ![Movie details](docs/screenshots/movie-details.png) | ![Seat selection](docs/screenshots/seat-selection.png) |

| My bookings | Admin panel |
|---|---|
| ![My bookings](docs/screenshots/my-bookings.png) | ![Admin](docs/screenshots/admin.png) |

| Dark mode | Mobile |
|---|---|
| ![Dark mode](docs/screenshots/home-dark.png) | <img src="docs/screenshots/mobile-seats.png" width="260" alt="Mobile seat map"> |

## Prerequisites

| Tool | Version | Notes |
|---|---|---|
| Operating system | Windows 10/11, macOS or Linux | All commands are cross-platform |
| [Node.js](https://nodejs.org/) | **20.19 or newer** | Vite 8, Mongoose 9 and the MongoDB driver need Node 20.19+ |
| npm | 10 or newer | Comes with Node.js |
| MongoDB | Atlas (free M0) or [Community Server](https://www.mongodb.com/try/download/community) | Optional for local development, see `npm run dev:local` |
| Browser | Latest Chrome or Firefox | |
| [Postman](https://www.postman.com/downloads/) | Any recent | For the API collection in `postman/` |
| [VS Code](https://code.visualstudio.com/) | Any recent | Recommended editor |

## Getting started

```bash
git clone https://github.com/shivamkumar19-afk/imovies.git
cd imovies
```

### 1. Backend

```bash
cd server
npm install
cp .env.example .env        # Windows: copy .env.example .env
# edit .env: set MONGO_URI and JWT_SECRET (see below)
npm run seed                # optional: wipes the database and adds demo data
npm run dev                 # API on http://localhost:5000
```

Other ways to run the backend:

| Command | What it does |
|---|---|
| `npm run dev` | Runs the API with auto-reload (nodemon) using `MONGO_URI` |
| `npm start` | Runs the API without auto-reload (used in production) |
| `npm run dev:atlas` | Uses `MONGO_URI`; adds demo data on the first run and keeps it afterwards |
| `npm run dev:local` | No MongoDB install needed: starts a local MongoDB that saves to `server/.data` (first run downloads ~100 MB) |
| `npm run dev:memory` | Same as `dev:local` but data is wiped when it stops |
| `npm run seed` | Wipes the database and inserts demo movies, theatres, shows and users |
| `npm test` | Runs the API test suite (needs `TEST_MONGO_URI`, see [Testing](#testing)) |

### 2. Frontend

```bash
cd client
npm install
npm run dev                 # http://localhost:5173
```

In development, Vite forwards `/api` requests to `http://localhost:5000`, so no extra configuration is needed. The dev server also listens on your Wi-Fi address (shown in the terminal as `Network:`), so you can open the app on a phone connected to the same network.

### Windows shortcut

Double-click **`start-dev.bat`** in the project root. It installs packages if needed and opens two windows (API and website). If `server/.env` contains an Atlas URI it uses Atlas, otherwise the local database. Output is saved to `logs/`.

## Environment variables

**`server/.env`**

| Variable | Example | Description |
|---|---|---|
| `PORT` | `5000` | API port |
| `MONGO_URI` | `mongodb+srv://user:pass@cluster.mongodb.net/imovies?retryWrites=true&w=majority` | MongoDB connection string |
| `JWT_SECRET` | 64 random characters | Secret used to sign login tokens. Keep it private |
| `JWT_EXPIRES_IN` | `7d` | How long a login lasts |
| `CLIENT_URL` | `http://localhost:5173` | Allowed frontend origin(s) for CORS, comma-separated |
| `AUTO_TOP_UP_SHOWS` | `true` | Set to `false` to stop the server adding upcoming demo shows |
| `APP_TZ_OFFSET` | `+05:30` | Cinema timezone used for date filters (default IST) |

Generate a strong secret with:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**`client/.env`** (only needed in production)

| Variable | Example | Description |
|---|---|---|
| `VITE_API_URL` | `https://imovies-api.onrender.com/api` | Base URL of the deployed API. Leave empty in development |

## Demo accounts

Created by `npm run seed` (or the first run of `dev:atlas` / `dev:local`):

| Role | Email | Password |
|---|---|---|
| Admin | admin@imovies.com | admin123 |
| User | user@imovies.com | user123 |
| User 2 | user2@imovies.com | user123 |

To see shared seat availability, log in as **User** in one browser and **User 2** in another (or a private window), open the same show and book from one. The other sees those seats as booked within about 8 seconds.

## Project structure

```
imovies/
├── client/                      React frontend (Vite)
│   ├── public/posters/          Poster artwork for the demo movies (SVG)
│   └── src/
│       ├── api/axios.js         Axios instance: adds JWT header, handles 401
│       ├── context/             AuthContext (login state), ThemeContext (light/dark)
│       ├── components/          Navbar, ThemeToggle, MovieCard, Poster, SeatGrid,
│       │                        Ticket, ProtectedRoute, Loader
│       ├── pages/               Home, MovieDetails, SeatSelection, BookingConfirmation,
│       │                        MyBookings, Login, Register, Admin
│       ├── utils/format.js      Date/time (IST) and ₹ formatting
│       ├── App.jsx              Routes
│       └── index.css            Design tokens for light and dark themes
├── server/                      Express API
│   ├── app.js                   Express app: middleware + routes
│   ├── server.js                Entry point: connect DB, top up shows, listen
│   ├── config/db.js             Mongoose connection
│   ├── models/                  User, Movie, Theatre, Show, Booking
│   ├── controllers/             auth, movie, theatre, show, booking
│   ├── routes/                  One router per resource
│   ├── middleware/              auth (JWT), admin (role check), errorHandler
│   ├── utils/                   ApiError, seat ID helpers
│   ├── seed/                    Demo data + show top-up
│   ├── scripts/                 dev:local, dev:memory, dev:atlas runners
│   └── tests/api.test.js        End-to-end API tests
├── postman/                     Postman collection + local environment
├── docs/screenshots/            Images used in this README
├── tools/                       Scripts that generate the posters and Postman files
├── render.yaml                  Render deployment blueprint for the API
└── start-dev.bat                One-click start on Windows
```

## Database design

| Collection | Fields | Notes |
|---|---|---|
| **users** | `name`, `email` (unique), `password` (bcrypt hash, hidden by default), `role` (`user` / `admin`) | |
| **movies** | `title`, `description`, `genre[]`, `language`, `duration` (min), `rating` (0–10), `certificate` (U/UA/A/S), `posterUrl`, `releaseDate` | |
| **theatres** | `name`, `city`, `address`, `screens[]: { name, rows, seatsPerRow }` | Rows A–Z, up to 40 seats per row |
| **shows** | `movie` → movies, `theatre` → theatres, `screenName`, `rows`, `seatsPerRow`, `startTime` (Date), `price`, `bookedSeats[]` (e.g. `["A1","A2"]`) | Seat layout is copied from the screen when the show is created. Unique index on theatre + screen + start time |
| **bookings** | `user` → users, `show` → shows, `seats[]`, `totalAmount`, `status` (`confirmed` / `cancelled`), timestamps | |

`shows.bookedSeats` is the single source of truth for seat availability: the seat map is drawn from it, and booking or cancelling updates it atomically.

## API reference

Base URL: `http://localhost:5000/api`. Protected routes need the header `Authorization: Bearer <token>`.

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/auth/register` | Public | Create account → `{ token, user }` |
| POST | `/auth/login` | Public | Log in → `{ token, user }` |
| GET | `/auth/me` | User | Current user |
| GET | `/movies?q=&genre=&language=` | Public | List / search / filter movies |
| GET | `/movies/filters` | Public | Distinct genres and languages |
| GET | `/movies/:id` | Public | One movie |
| POST / PUT / DELETE | `/movies` · `/movies/:id` | Admin | Create / update / delete (delete blocked while the movie has shows) |
| GET | `/theatres?city=` | Public | List theatres |
| GET | `/theatres/:id` | Public | One theatre |
| POST / PUT / DELETE | `/theatres` · `/theatres/:id` | Admin | Manage theatres |
| GET | `/shows?movieId=&date=YYYY-MM-DD&city=&theatreId=` | Public | Upcoming shows with seats left |
| GET | `/shows/:id` | Public | One show including `bookedSeats` |
| POST / PUT / DELETE | `/shows` · `/shows/:id` | Admin | Schedule / change price or time / delete |
| POST | `/bookings` | User | Body `{ showId, seats: ["A1","A2"] }` |
| GET | `/bookings/my` | User | My bookings |
| GET | `/bookings/:id` | Owner / Admin | One booking |
| PUT | `/bookings/:id/cancel` | Owner | Cancel and free the seats |
| GET | `/bookings` | Admin | All bookings (latest 200) |
| GET | `/health` | Public | Health check |

Errors are returned as `{ "message": "..." }` with a matching status code (400 validation, 401 not logged in, 403 not allowed, 404 not found, 409 conflict).

## How double booking is prevented

```js
const updated = await Show.findOneAndUpdate(
  { _id: showId, bookedSeats: { $nin: seats } },   // none of these seats are taken yet
  { $push: { bookedSeats: { $each: seats } } },    // take them in the same operation
  { returnDocument: 'after' }
);
if (!updated) return res.status(409).json({ message: 'Seat(s) just got booked by someone else' });
```

MongoDB applies an update to a single document atomically, so if two people try to book seat E5 at the same moment only one update can match. If creating the booking record fails afterwards, the seats are released again. Cancelling uses a conditional update so a double-click can't cancel twice.

## Testing

### Postman

1. Open Postman → **Import** → select both files in `postman/`.
2. Choose the **IMovies Local** environment (top right).
3. Run the **1. Auth** folder first; the login requests save tokens automatically.
4. Run the other folders in order, or use **Run collection** for all 29 requests (35 checks).

To test a deployed API, change `baseUrl` in the environment to `https://<your-api>.onrender.com/api`.

### Automated tests

```bash
cd server
TEST_MONGO_URI=mongodb://127.0.0.1:27017/imovies_test npm test
# Windows PowerShell:  $env:TEST_MONGO_URI="mongodb://127.0.0.1:27017/imovies_test"; npm test
```

The suite covers sign-up and login, admin-only routes, search and filters, show overlap checks, seat validation, server-side pricing, cancelling and rebooking, seats visible across accounts, and 20 simultaneous requests for the same seats where exactly one must succeed. It **wipes** the database it points at, so never use your real database.

## Deployment

### 1. Database – MongoDB Atlas
1. Create a free **M0** cluster.
2. **Database Access**: add a user with `readWrite` on the `imovies` database.
3. **Network Access**: allow `0.0.0.0/0` (needed for Render, whose IPs change).
4. **Connect → Drivers** gives the connection string. Add the database name: `...mongodb.net/imovies?retryWrites=true&w=majority`.

### 2. Backend – Render
1. **New → Blueprint** and pick this repository. `render.yaml` sets up the web service (root `server`, build `npm install`, start `npm start`, health check `/api/health`).
2. Fill in the secret environment variables: `MONGO_URI`, `JWT_SECRET`, and `CLIENT_URL` (your Vercel URL, added after step 3).
3. To load demo data the first time, run `npm run seed` locally with the same `MONGO_URI`, or use `npm run dev:atlas` once.

The free plan sleeps after 15 minutes without traffic; the first request after that takes about a minute.

### 3. Frontend – Vercel
1. **Add New → Project**, import this repository and set **Root Directory** to `client`.
2. Framework preset **Vite** (build `npm run build`, output `dist`).
3. Environment variable `VITE_API_URL` = `https://<your-api>.onrender.com/api`.
4. Deploy, then put the Vercel URL into `CLIENT_URL` on Render.

`client/vercel.json` rewrites every route to `index.html`, so refreshing a page like `/movies/123` works. (`client/public/_redirects` does the same on Netlify.)

## Design decisions

- **One `startTime` Date per show** instead of separate date and time strings, so shows can be sorted, range-queried and compared with "now" reliably. Date filters are interpreted in IST.
- **Seat layout copied into each show**, so editing a theatre later doesn't break existing bookings.
- **Server-side price and seat validation**: the client never decides what a booking costs or which seats exist.
- **No role at sign-up**: admins are created by the seed script or directly in the database.
- **Overlap check for shows**: movie duration plus a 15-minute gap per screen.
- **Delete protection**: a movie or theatre with shows, or a show with confirmed bookings, can't be deleted.
- **Polling instead of WebSockets** for seat updates, which is simpler to deploy on free hosting.

## Known limitations and future work

- No payment gateway and no temporary seat hold; seats are confirmed immediately.
- Seat updates use polling every 8 seconds rather than real-time sockets (Socket.io is a natural next step).
- The JWT is stored in `localStorage`; an httpOnly cookie would be safer against XSS.
- No rate limiting on login yet.
- The admin bookings list shows the latest 200 (no pagination).

## Project documentation

Phase-wise project documents are in [`docs/project-documentation/`](docs/project-documentation):

| Phase | Documents |
|---|---|
| 1. Ideation | [Problem Statements](docs/project-documentation/1-ideation-phase/The_IMovies_Problem_Statements.docx) · [Empathy Map](docs/project-documentation/1-ideation-phase/The_IMovies_Empathy_Map.docx) · [Brainstorm & Idea Prioritization](docs/project-documentation/1-ideation-phase/The_IMovies_Brainstorm_and_Idea_Prioritization.docx) |
| 2. Project planning | [Project Planning (backlog, sprints, burndown)](docs/project-documentation/2-project-planning-phase/The_IMovies_Project_Planning.docx) |
| 3. Requirement analysis | [Solution Requirements](docs/project-documentation/3-requirement-analysis/The_IMovies_Solution_Requirements.docx) · [Data Flow Diagram & User Stories](docs/project-documentation/3-requirement-analysis/The_IMovies_Data_Flow_Diagram.docx) · [Technology Stack](docs/project-documentation/3-requirement-analysis/The_IMovies_Technology_Stack.docx) |
| 4. Project design | [Problem–Solution Fit](docs/project-documentation/4-project-design-phase/The_IMovies_Problem_Solution_Fit.docx) · [Proposed Solution](docs/project-documentation/4-project-design-phase/The_IMovies_Proposed_Solution.docx) · [Solution Architecture](docs/project-documentation/4-project-design-phase/The_IMovies_Solution_Architecture.docx) |
| 5. Performance testing | [User Acceptance Testing plan](docs/project-documentation/5-performance-testing/The_IMovies_UAT_Plan.docx) |

---

Maintained by **Shivam Kumar** ([@shivamkumar19-afk](https://github.com/shivamkumar19-afk)).
