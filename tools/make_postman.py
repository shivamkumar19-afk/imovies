"""Generates postman/IMovies.postman_collection.json and the local environment.
Run: python tools/make_postman.py   (then import both files into Postman)
"""
import json, os

ROOT = os.path.join(os.path.dirname(__file__), '..', 'postman')


def req(name, method, path, body=None, auth=None, tests=None, desc='', query=None):
    url_raw = '{{baseUrl}}' + path
    url = {'raw': url_raw, 'host': ['{{baseUrl}}'], 'path': [p for p in path.split('?')[0].strip('/').split('/') if p]}
    if query:
        url['query'] = [{'key': k, 'value': v} for k, v in query]
        url['raw'] += '?' + '&'.join(f'{k}={v}' for k, v in query)
    r = {'method': method, 'header': [], 'url': url, 'description': desc}
    if body is not None:
        r['header'].append({'key': 'Content-Type', 'value': 'application/json'})
        r['body'] = {'mode': 'raw', 'raw': json.dumps(body, indent=2), 'options': {'raw': {'language': 'json'}}}
    if auth:
        r['auth'] = {'type': 'bearer', 'bearer': [{'key': 'token', 'value': '{{' + auth + '}}', 'type': 'string'}]}
    else:
        r['auth'] = {'type': 'noauth'}
    item = {'name': name, 'request': r}
    if tests:
        item['event'] = [{'listen': 'test', 'script': {'type': 'text/javascript', 'exec': tests.strip().split('\n')}}]
    return item


status = lambda code: f"pm.test('status {code}', () => pm.response.to.have.status({code}));"

auth = [
    req('Register new user', 'POST', '/auth/register',
        {'name': 'Postman User', 'email': 'postman{{$timestamp}}@example.com', 'password': 'secret123'},
        tests=status(201) + "\npm.test('role is user', () => pm.expect(pm.response.json().user.role).to.eql('user'));",
        desc='Creates an account. role is always "user" even if you send role: "admin".'),
    req('Login as user', 'POST', '/auth/login', {'email': 'user@imovies.com', 'password': 'user123'},
        tests=status(200) + "\npm.collectionVariables.set('token', pm.response.json().token);",
        desc='Saves the JWT into {{token}} for the requests below.'),
    req('Login as user 2', 'POST', '/auth/login', {'email': 'user2@imovies.com', 'password': 'user123'},
        tests=status(200) + "\npm.collectionVariables.set('token2', pm.response.json().token);"),
    req('Login as admin', 'POST', '/auth/login', {'email': 'admin@imovies.com', 'password': 'admin123'},
        tests=status(200) + "\npm.collectionVariables.set('adminToken', pm.response.json().token);"),
    req('Wrong password (expect 401)', 'POST', '/auth/login', {'email': 'user@imovies.com', 'password': 'wrong'},
        tests=status(401)),
    req('Who am I', 'GET', '/auth/me', auth='token', tests=status(200)),
]

movies = [
    req('List movies', 'GET', '/movies', tests=status(200) + "\nconst m = pm.response.json();\npm.test('has movies', () => pm.expect(m.length).to.be.above(0));\npm.collectionVariables.set('movieId', m[0]._id);"),
    req('Search + filter', 'GET', '/movies', query=[('q', 'orbit'), ('language', 'English')], tests=status(200)),
    req('Filter options', 'GET', '/movies/filters', tests=status(200)),
    req('Get one movie', 'GET', '/movies/{{movieId}}', tests=status(200)),
    req('Create movie (admin)', 'POST', '/movies',
        {'title': 'Postman Test Film', 'language': 'Hindi', 'genre': ['Drama'], 'duration': 120, 'rating': 7.5, 'certificate': 'UA', 'description': 'Created from Postman'},
        auth='adminToken', tests=status(201) + "\npm.collectionVariables.set('newMovieId', pm.response.json()._id);"),
    req('Create movie as user (expect 403)', 'POST', '/movies', {'title': 'x', 'language': 'x', 'duration': 1}, auth='token', tests=status(403)),
    req('Update movie (admin)', 'PUT', '/movies/{{newMovieId}}', {'rating': 8.2}, auth='adminToken', tests=status(200)),
    req('Delete movie (admin)', 'DELETE', '/movies/{{newMovieId}}', auth='adminToken', tests=status(200)),
]

theatres = [
    req('List theatres', 'GET', '/theatres', tests=status(200) + "\npm.collectionVariables.set('theatreId', pm.response.json()[0]._id);"),
    req('Theatres in a city', 'GET', '/theatres', query=[('city', 'Mumbai')], tests=status(200)),
    req('Create theatre (admin)', 'POST', '/theatres',
        {'name': 'Postman Cinema', 'city': 'Bhopal', 'address': 'MP Nagar', 'screens': [{'name': 'Screen 1', 'rows': 8, 'seatsPerRow': 12}]},
        auth='adminToken', tests=status(201) + "\npm.collectionVariables.set('newTheatreId', pm.response.json()._id);"),
    req('Delete theatre (admin)', 'DELETE', '/theatres/{{newTheatreId}}', auth='adminToken', tests=status(200)),
]

shows = [
    req('Upcoming shows for a movie', 'GET', '/shows', query=[('movieId', '{{movieId}}')],
        tests=status(200) + "\nconst s = pm.response.json();\npm.test('has shows', () => pm.expect(s.length).to.be.above(0));\npm.collectionVariables.set('showId', s[s.length - 1]._id);",
        desc='Add &date=YYYY-MM-DD (IST) to filter one day.'),
    req('Show detail + booked seats', 'GET', '/shows/{{showId}}', tests=status(200) + "\npm.test('has seat map', () => pm.expect(pm.response.json().bookedSeats).to.be.an('array'));"),
]

seat_a, seat_b = 'J1', 'J2'
bookings = [
    req('Book seats (user)', 'POST', '/bookings', {'showId': '{{showId}}', 'seats': [seat_a, seat_b]}, auth='token',
        tests=status(201) + "\nconst b = pm.response.json();\npm.collectionVariables.set('bookingId', b._id);\npm.test('price computed by server', () => pm.expect(b.totalAmount).to.be.above(0));",
        desc='Change the seats if they are already taken.'),
    req('Same seats from user 2 (expect 409)', 'POST', '/bookings', {'showId': '{{showId}}', 'seats': [seat_b]}, auth='token2',
        tests=status(409), desc='Double booking is rejected.'),
    req('User 2 sees them as booked', 'GET', '/shows/{{showId}}', auth='token2',
        tests=status(200) + f"\npm.test('{seat_a} and {seat_b} booked', () => pm.expect(pm.response.json().bookedSeats).to.include.members(['{seat_a}', '{seat_b}']));"),
    req('Invalid seat (expect 400)', 'POST', '/bookings', {'showId': '{{showId}}', 'seats': ['Z99']}, auth='token', tests=status(400)),
    req('My bookings', 'GET', '/bookings/my', auth='token', tests=status(200)),
    req('Get one booking', 'GET', '/bookings/{{bookingId}}', auth='token', tests=status(200)),
    req('Cancel booking', 'PUT', '/bookings/{{bookingId}}/cancel', auth='token',
        tests=status(200) + "\npm.test('cancelled', () => pm.expect(pm.response.json().status).to.eql('cancelled'));"),
    req('All bookings (admin)', 'GET', '/bookings', auth='adminToken', tests=status(200)),
]

collection = {
    'info': {
        'name': 'IMovies API',
        'description': 'Movie ticket booking API. Run "Auth" first (it saves tokens), then the other folders in order. '
                       'Set baseUrl in the environment: http://localhost:5000/api locally, or your deployed URL + /api.',
        'schema': 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
    },
    'item': [
        {'name': '1. Auth', 'item': auth},
        {'name': '2. Movies', 'item': movies},
        {'name': '3. Theatres', 'item': theatres},
        {'name': '4. Shows', 'item': shows},
        {'name': '5. Bookings', 'item': bookings},
        {'name': 'Health check', 'request': {'method': 'GET', 'header': [], 'url': {'raw': '{{baseUrl}}/health', 'host': ['{{baseUrl}}'], 'path': ['health']}}},
    ],
    'variable': [{'key': k, 'value': ''} for k in ['token', 'token2', 'adminToken', 'movieId', 'newMovieId', 'theatreId', 'newTheatreId', 'showId', 'bookingId']],
}

env = {
    'name': 'IMovies Local',
    'values': [{'key': 'baseUrl', 'value': 'http://localhost:5000/api', 'enabled': True}],
    '_postman_variable_scope': 'environment',
}

os.makedirs(ROOT, exist_ok=True)
json.dump(collection, open(os.path.join(ROOT, 'IMovies.postman_collection.json'), 'w'), indent=2)
json.dump(env, open(os.path.join(ROOT, 'IMovies-Local.postman_environment.json'), 'w'), indent=2)
print('wrote', os.path.abspath(ROOT))
