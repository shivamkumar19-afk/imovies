"""Generates original SVG posters for the seeded (fictional) movies.
Output: client/public/posters/<slug>.svg   Run: python tools/make_posters.py
"""
import math, random, os

W, H = 400, 600
OUT = os.path.join(os.path.dirname(__file__), '..', 'client', 'public', 'posters')
FONT = "Impact, 'Haettenschweiler', 'Arial Narrow Bold', 'Franklin Gothic Medium', sans-serif"
BODY = "'Segoe UI', Roboto, Arial, sans-serif"


def grad(id_, stops, x2='0', y2='1'):
    s = ''.join(f'<stop offset="{o}" stop-color="{c}"/>' for o, c in stops)
    return f'<linearGradient id="{id_}" x1="0" y1="0" x2="{x2}" y2="{y2}">{s}</linearGradient>'


def poster(slug, title_lines, tagline, meta, defs, art, title_color='#ffffff', accent='#ffffff'):
    # Size so the widest line fits 360px even in a wide fallback font (Arial ~0.7em/char).
    longest = max(len(l) for l in title_lines)
    size = min(76, int(360 / (longest * 0.7)))
    tag_size = min(14, round(370 / (len(tagline) * 0.72 + len(tagline) * 1.5 / 10), 1))
    n = len(title_lines)
    top = H - 70 - (n - 1) * size * 0.92
    title = ''.join(
        f'<text x="200" y="{top + i * size * 0.92:.0f}" text-anchor="middle" font-family="{FONT}" '
        f'font-size="{size}" fill="{title_color}" letter-spacing="1">{l}</text>'
        for i, l in enumerate(title_lines)
    )
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">
<defs>{defs}{grad("scrim", [("0", "rgba(0,0,0,0)"), ("1", "rgba(0,0,0,0.88)")])}</defs>
{art}
<rect x="0" y="{H - 260}" width="{W}" height="260" fill="url(#scrim)"/>
<text x="200" y="{top - size * 0.95:.0f}" text-anchor="middle" font-family="{BODY}" font-size="{tag_size}" fill="{accent}" letter-spacing="1.5" opacity="0.9">{tagline}</text>
{title}
<text x="200" y="{H - 30}" text-anchor="middle" font-family="{BODY}" font-size="12" fill="#ffffff" opacity="0.65" letter-spacing="1.5">{meta}</text>
</svg>'''
    with open(os.path.join(OUT, f'{slug}.svg'), 'w', encoding='utf-8') as f:
        f.write(svg)


def monsoon():
    r = random.Random(1)
    art = ['<rect width="400" height="600" fill="url(#sky)"/>']
    # lightning glow
    art.append('<circle cx="270" cy="120" r="160" fill="#cfe9ff" opacity="0.10"/>')
    art.append('<polyline points="285,0 255,95 282,100 240,215 300,85 270,80 300,0" fill="#fffbe0" opacity="0.95"/>')
    # skyline
    x = -10
    while x < 410:
        w = r.randint(28, 60)
        h = r.randint(140, 330)
        art.append(f'<rect x="{x}" y="{600 - h}" width="{w}" height="{h}" fill="#06131c"/>')
        for wy in range(600 - h + 12, 600, 16):
            for wx in range(x + 6, x + w - 6, 10):
                if r.random() < 0.18:
                    art.append(f'<rect x="{wx}" y="{wy}" width="4" height="6" fill="#ffd36b" opacity="{r.uniform(0.5, 1):.2f}"/>')
        x += w + r.randint(2, 8)
    art.append('<rect x="180" y="190" width="6" height="90" fill="#06131c"/><circle cx="183" cy="186" r="5" fill="#ff3b3b"/>')
    # rain
    for _ in range(260):
        x0, y0 = r.uniform(-50, 420), r.uniform(-20, 600)
        L = r.uniform(14, 34)
        art.append(f'<line x1="{x0:.0f}" y1="{y0:.0f}" x2="{x0 - L * 0.35:.0f}" y2="{y0 + L:.0f}" stroke="#a9d6ee" stroke-width="1.2" opacity="{r.uniform(0.15, 0.5):.2f}"/>')
    defs = grad('sky', [('0', '#1c4a63'), ('0.6', '#0d2635'), ('1', '#050d13')])
    poster('monsoon-protocol', ['MONSOON', 'PROTOCOL'], '48 HOURS. ONE CITY. NO POWER.', 'HINDI  |  UA  |  ACTION THRILLER', defs, ''.join(art), accent='#9fd4ff')


def chai():
    art = ['<rect width="400" height="600" fill="url(#dusk)"/>', '<circle cx="300" cy="170" r="70" fill="#ffd9a0" opacity="0.55"/>']
    # buildings behind
    art.append('<path d="M0 330 L0 250 L60 250 L60 210 L130 210 L130 270 L190 270 L190 230 L260 230 L260 290 L330 290 L330 240 L400 240 L400 330 Z" fill="#5a2a22" opacity="0.6"/>')
    # stall
    art.append('<rect x="60" y="300" width="280" height="200" fill="#3b1d17"/>')
    for i in range(7):
        c = '#e8d7b5' if i % 2 == 0 else '#c0392b'
        art.append(f'<path d="M{50 + i * 43} 270 h43 l-6 40 h-31 z" fill="{c}"/>')
    art.append('<rect x="80" y="430" width="240" height="14" fill="#7b4a33"/>')
    # lamp
    art.append('<rect x="352" y="160" width="6" height="400" fill="#2a1410"/><path d="M335 160 h40 l-8 -22 h-24 z" fill="#2a1410"/><circle cx="355" cy="168" r="9" fill="#fff1c1"/><circle cx="355" cy="168" r="45" fill="#fff1c1" opacity="0.18"/>')
    # chai glass
    art.append('<path d="M160 335 L240 335 L230 430 L170 430 Z" fill="#ffffff" opacity="0.25" stroke="#fff" stroke-width="2"/>')
    art.append('<path d="M164 365 L236 365 L230 430 L170 430 Z" fill="#b5651d"/><path d="M164 365 L236 365 L235 375 L165 375 Z" fill="#d9a066"/>')
    for i, dx in enumerate((-18, 0, 18)):
        art.append(f'<path d="M{200 + dx} 325 c -14 -20, 14 -35, 0 -55 c -14 -20, 14 -35, 0 -55" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity="{0.55 - i * 0.1:.2f}"/>')
    defs = grad('dusk', [('0', '#f6b26b'), ('0.55', '#c8643b'), ('1', '#4a1f17')])
    poster('the-last-chai-stall', ['THE LAST', 'CHAI STALL'], 'ONE CORNER. ONE STREET. NO SALE.', 'HINDI  |  U  |  DRAMA COMEDY', defs, ''.join(art), accent='#ffe2b8')


def orbit():
    r = random.Random(3)
    art = ['<rect width="400" height="600" fill="#04050d"/>']
    for _ in range(170):
        art.append(f'<circle cx="{r.uniform(0, 400):.0f}" cy="{r.uniform(0, 600):.0f}" r="{r.choice([0.6, 0.8, 1, 1.4]):.1f}" fill="#fff" opacity="{r.uniform(0.3, 1):.2f}"/>')
    art.append('<circle cx="40" cy="610" r="260" fill="url(#planet)"/>')
    art.append('<circle cx="40" cy="610" r="262" fill="none" stroke="#ffb36b" stroke-width="3" opacity="0.5"/>')
    # station
    art.append('<g transform="translate(250 210) rotate(-18)">'
               '<ellipse rx="110" ry="34" fill="none" stroke="#c9d3e8" stroke-width="10"/>'
               '<ellipse rx="110" ry="34" fill="none" stroke="#4a5672" stroke-width="2"/>'
               '<rect x="-6" y="-34" width="12" height="68" fill="#9aa6bf"/><rect x="-104" y="-4" width="208" height="8" fill="#9aa6bf"/>'
               '<circle r="20" fill="#dfe6f5"/><circle r="8" fill="#ff6a3d"/></g>')
    art.append('<text x="250" y="216" text-anchor="middle" font-family="Arial" font-weight="bold" font-size="11" fill="#1d2433">9</text>')
    defs = '<radialGradient id="planet" cx="0.7" cy="0.2" r="0.9"><stop offset="0" stop-color="#ff9d4d"/><stop offset="0.5" stop-color="#a8431f"/><stop offset="1" stop-color="#2a0d07"/></radialGradient>'
    poster('orbit-9', ['ORBIT 9'], 'THE RELIEF SHIP WAS NEVER SENT.', 'ENGLISH  |  UA  |  SCI-FI ADVENTURE', defs, ''.join(art), accent='#ffbf8a')


def kaal():
    art = ['<rect width="400" height="600" fill="url(#k)"/>']
    cx, cy, R = 200, 250, 150
    # spiral
    pts = []
    for i in range(700):
        t = i / 40
        rr = 6 + t * 8.5
        pts.append(f'{cx + rr * math.cos(t):.1f},{cy + rr * math.sin(t):.1f}')
    art.append(f'<polyline points="{" ".join(pts)}" fill="none" stroke="#ff5a4e" stroke-width="1.2" opacity="0.35"/>')
    art.append(f'<circle cx="{cx}" cy="{cy}" r="{R}" fill="none" stroke="#f3d2a2" stroke-width="5"/>')
    art.append(f'<circle cx="{cx}" cy="{cy}" r="{R - 14}" fill="none" stroke="#f3d2a2" stroke-width="1" opacity="0.6"/>')
    for i in range(60):
        a = i * math.pi / 30
        l = 16 if i % 5 == 0 else 7
        art.append(f'<line x1="{cx + (R - 4) * math.cos(a):.1f}" y1="{cy + (R - 4) * math.sin(a):.1f}" x2="{cx + (R - 4 - l) * math.cos(a):.1f}" y2="{cy + (R - 4 - l) * math.sin(a):.1f}" stroke="#f3d2a2" stroke-width="{3 if i % 5 == 0 else 1.2}"/>')
    # hands at 3:17 (counter-clockwise feel: we just set the time)
    hA = math.radians((3 + 17 / 60) * 30 - 90)
    mA = math.radians(17 * 6 - 90)
    art.append(f'<line x1="{cx}" y1="{cy}" x2="{cx + 70 * math.cos(hA):.1f}" y2="{cy + 70 * math.sin(hA):.1f}" stroke="#fff" stroke-width="8" stroke-linecap="round"/>')
    art.append(f'<line x1="{cx}" y1="{cy}" x2="{cx + 115 * math.cos(mA):.1f}" y2="{cy + 115 * math.sin(mA):.1f}" stroke="#ff5a4e" stroke-width="4" stroke-linecap="round"/>')
    art.append(f'<circle cx="{cx}" cy="{cy}" r="9" fill="#fff"/>')
    # crack
    art.append('<polyline points="110,130 150,175 140,200 185,236 176,262" fill="none" stroke="#fff" stroke-width="2" opacity="0.8"/>')
    art.append('<polyline points="150,175 120,190" fill="none" stroke="#fff" stroke-width="1.5" opacity="0.7"/>')
    defs = grad('k', [('0', '#3a0b10'), ('1', '#0b0204')])
    poster('kaalchakra', ['KAALCHAKRA'], 'EVERY NIGHT. 3:17 AM. ONE DAY EARLIER.', 'HINDI  |  A  |  MYSTERY THRILLER', defs, ''.join(art), accent='#ff8a80')


def kites():
    art = ['<rect width="400" height="600" fill="url(#sky2)"/>', '<circle cx="80" cy="90" r="40" fill="#fff6d6" opacity="0.8"/>']
    clouds = [(300, 110), (120, 220), (330, 300)]
    for x, y in clouds:
        art.append(f'<g fill="#ffffff" opacity="0.7"><ellipse cx="{x}" cy="{y}" rx="46" ry="14"/><ellipse cx="{x - 20}" cy="{y - 8}" rx="22" ry="14"/><ellipse cx="{x + 14}" cy="{y - 10}" rx="18" ry="12"/></g>')
    kites_ = [(130, 150, '#e74c3c', '#f1c40f', -12), (275, 210, '#8e44ad', '#1abc9c', 10), (200, 300, '#2980b9', '#e67e22', -4)]
    for x, y, c1, c2, rot in kites_:
        art.append(f'<g transform="translate({x} {y}) rotate({rot})">'
                   f'<path d="M0 -42 L32 0 L0 52 L-32 0 Z" fill="{c1}"/><path d="M0 -42 L32 0 L0 0 Z" fill="{c2}"/><path d="M0 0 L0 52 L-32 0 Z" fill="{c2}" opacity="0.6"/>'
                   f'<line x1="0" y1="-42" x2="0" y2="52" stroke="#fff" stroke-width="1.2" opacity="0.7"/><line x1="-32" y1="0" x2="32" y2="0" stroke="#fff" stroke-width="1.2" opacity="0.7"/>'
                   f'<path d="M0 52 q 8 18 -4 30 q -10 14 4 28" fill="none" stroke="{c1}" stroke-width="2"/></g>')
        art.append(f'<path d="M{x} {y + 20} Q {x + 30} {y + 180} 200 600" fill="none" stroke="#ffffff" stroke-width="1" opacity="0.55"/>')
    art.append('<path d="M0 600 L0 470 L50 470 L50 440 L110 440 L110 480 L160 480 L160 455 L240 455 L240 490 L300 490 L300 450 L360 450 L360 475 L400 475 L400 600 Z" fill="#3d2b52"/>')
    defs = grad('sky2', [('0', '#6fc3ff'), ('0.7', '#ffd3b4'), ('1', '#ff9f80')])
    poster('paper-kites', ['PAPER', 'KITES'], 'RIVALS ON THE ROOF. ONE WEEK TO FESTIVAL.', 'ENGLISH  |  U  |  ROMANCE DRAMA', defs, ''.join(art), accent='#ffe3d1')


def vettai():
    r = random.Random(6)
    art = ['<rect width="400" height="600" fill="url(#f)"/>', '<circle cx="200" cy="160" r="70" fill="#d9f2c9" opacity="0.25"/>']
    for layer, (col, op) in enumerate((('#0f2a1a', 0.7), ('#081a10', 0.9), ('#030b06', 1))):
        x = -20 + layer * 15
        while x < 420:
            w = r.randint(10, 26) + layer * 6
            art.append(f'<rect x="{x}" y="0" width="{w}" height="600" fill="{col}" opacity="{op}"/>')
            x += w + r.randint(30, 70)
    # eyes
    for ex in (165, 235):
        art.append(f'<ellipse cx="{ex}" cy="300" rx="22" ry="11" fill="#ffb300"/><ellipse cx="{ex}" cy="300" rx="4" ry="10" fill="#1a0d00"/>')
        art.append(f'<ellipse cx="{ex}" cy="300" rx="44" ry="24" fill="#ffb300" opacity="0.12"/>')
    # claw marks
    for i in range(3):
        art.append(f'<path d="M{250 + i * 24} 340 Q {230 + i * 24} 400 {205 + i * 24} 460" fill="none" stroke="#c0392b" stroke-width="{7 - i}" stroke-linecap="round" opacity="0.85"/>')
    defs = grad('f', [('0', '#1d4a2c'), ('1', '#020604')])
    poster('vettai-raja', ['VETTAI', 'RAJA'], 'THE FOREST HAS ONE LAW.', 'TAMIL  |  UA  |  ACTION', defs, ''.join(art), title_color='#ffcc4d', accent='#ffcc4d')


def hostel():
    art = ['<rect width="400" height="600" fill="#24263b"/>']
    # corridor perspective
    art.append('<path d="M0 0 L130 160 L270 160 L400 0 Z" fill="#2f3250"/><path d="M0 600 L130 420 L270 420 L400 600 Z" fill="#1a1b2b"/>')
    art.append('<path d="M0 0 L130 160 L130 420 L0 600 Z" fill="#33365a"/><path d="M400 0 L270 160 L270 420 L400 600 Z" fill="#2b2e4c"/>')
    for t in (0.25, 0.5, 0.75):
        y = 160 + (420 - 160) * 0 if False else None
    for i in range(1, 5):
        yy = 600 - i * 45
        art.append(f'<line x1="{i * 32}" y1="{600 - i * 45}" x2="{400 - i * 32}" y2="{600 - i * 45}" stroke="#2a2c45" stroke-width="2"/>')
    art.append('<rect x="150" y="190" width="100" height="230" fill="#7a4b2a"/><rect x="158" y="198" width="84" height="214" fill="none" stroke="#5a361d" stroke-width="3"/>')
    art.append('<rect x="172" y="225" width="56" height="26" rx="3" fill="#d9c27a"/><text x="200" y="245" text-anchor="middle" font-family="Arial" font-weight="bold" font-size="20" fill="#3a2a10">404</text>')
    art.append('<circle cx="234" cy="310" r="5" fill="#d9c27a"/>')
    art.append('<rect x="150" y="416" width="100" height="6" fill="#ffe9a8"/><path d="M150 422 L250 422 L300 470 L100 470 Z" fill="#ffe9a8" opacity="0.18"/>')
    notes = [(168, 270, '#ffeb3b', -6), (205, 280, '#ff80ab', 5), (180, 330, '#80d8ff', 3)]
    for x, y, c, rot in notes:
        art.append(f'<rect x="{x}" y="{y}" width="26" height="26" fill="{c}" transform="rotate({rot} {x + 13} {y + 13})"/>')
    art.append('<rect x="185" y="130" width="30" height="10" fill="#f5f5dc"/><rect x="185" y="140" width="30" height="40" fill="#f5f5dc" opacity="0.08"/>')
    poster('hostel-room-404', ['HOSTEL', 'ROOM 404'], 'ONE EXAM LEAK. ONE WARDEN. ZERO SLEEP.', 'HINDI  |  UA  |  COMEDY', '', ''.join(art), title_color='#ffe066', accent='#ffe066')


def deep():
    r = random.Random(8)
    art = ['<rect width="400" height="600" fill="url(#sea)"/>']
    # light rays from top
    for x in (60, 150, 260, 340):
        art.append(f'<path d="M{x} 0 L{x + 30} 0 L{x - 40} 600 L{x - 90} 600 Z" fill="#bff7ff" opacity="0.06"/>')
    # cave walls
    art.append('<path d="M0 0 L0 600 L70 600 Q 40 500 90 420 Q 130 340 70 260 Q 30 180 100 110 Q 120 60 80 0 Z" fill="#021a1f"/>')
    art.append('<path d="M400 0 L400 600 L320 600 Q 360 520 300 440 Q 260 380 330 300 Q 370 220 300 150 Q 270 90 320 0 Z" fill="#021a1f"/>')
    # diver light cone
    art.append('<path d="M205 330 L120 560 L300 560 Z" fill="url(#beam)"/>')
    # diver
    art.append('<g transform="translate(200 300) rotate(15)"><ellipse rx="34" ry="11" fill="#0b0f12"/><circle cx="-38" cy="-2" r="10" fill="#0b0f12"/><rect x="-10" y="-20" width="30" height="9" rx="4" fill="#ffb74d"/>'
               '<path d="M30 0 L62 -12 L64 12 Z" fill="#0b0f12"/><circle cx="-44" cy="-2" r="4" fill="#fff59d"/></g>')
    for _ in range(26):
        x, y, rr = r.uniform(150, 230), r.uniform(60, 280), r.uniform(2, 7)
        art.append(f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{rr:.1f}" fill="none" stroke="#e0ffff" stroke-width="1.3" opacity="0.7"/>')
    defs = grad('sea', [('0', '#1fa6b3'), ('0.5', '#0b4f5c'), ('1', '#01141a')]) + grad('beam', [('0', 'rgba(255,250,200,0.55)'), ('1', 'rgba(255,250,200,0)')])
    poster('deep-current', ['DEEP', 'CURRENT'], 'THE TIDE CAME IN EARLY.', 'ENGLISH  |  UA  |  THRILLER ADVENTURE', defs, ''.join(art), accent='#b2f5ff')


def aranya():
    art = ['<rect width="400" height="600" fill="url(#sun)"/>', '<circle cx="200" cy="250" r="80" fill="#fff0c2" opacity="0.85"/>']
    art.append('<path d="M0 330 L70 240 L130 300 L200 210 L280 300 L340 250 L400 310 L400 600 L0 600 Z" fill="#b25a6a" opacity="0.8"/>')
    art.append('<path d="M0 380 L90 310 L170 370 L250 300 L330 360 L400 330 L400 600 L0 600 Z" fill="#7a3550"/>')
    art.append('<path d="M0 600 L0 370 Q 200 345 400 380 L400 600 Z" fill="#3e8e5b"/>')
    art.append('<path d="M190 365 Q 260 400 215 440 Q 160 490 260 600 L360 600 Q 250 490 290 445 Q 330 405 240 362 Z" fill="#6ec6e8"/>')
    # elephant (baby), facing right
    e = ('<g transform="translate(105 360) scale(1.15)" fill="#4a3346">'
         '<ellipse cx="0" cy="0" rx="46" ry="30"/><circle cx="44" cy="-14" r="22"/><ellipse cx="34" cy="-14" rx="14" ry="18" fill="#5d4058"/>'
         '<path d="M62 -8 Q 76 10 68 30 Q 64 36 60 30 Q 66 12 54 0 Z"/>'
         '<rect x="-34" y="18" width="14" height="28" rx="5"/><rect x="-6" y="18" width="14" height="28" rx="5"/><rect x="20" y="16" width="14" height="28" rx="5"/>'
         '<path d="M-46 -4 q -10 6 -6 16" fill="none" stroke="#4a3346" stroke-width="3"/><circle cx="52" cy="-20" r="2.5" fill="#fff"/></g>')
    art.append(e)
    for bx, by in ((280, 150), (300, 165), (262, 168)):
        art.append(f'<path d="M{bx - 8} {by} q 8 -7 8 0 q 0 -7 8 0" fill="none" stroke="#5a2d44" stroke-width="2"/>')
    defs = grad('sun', [('0', '#ffb88a'), ('0.5', '#f78ca0'), ('1', '#7a3550')])
    poster('aranya', ['ARANYA'], 'A LITTLE ELEPHANT. A RIVER TO FIND.', 'TELUGU  |  U  |  ANIMATION FAMILY', defs, ''.join(art), accent='#fff0c2')


def signal():
    r = random.Random(10)
    art = ['<rect width="400" height="600" fill="url(#night)"/>']
    for _ in range(900):
        art.append(f'<rect x="{r.uniform(0, 400):.0f}" y="{r.uniform(0, 600):.0f}" width="2" height="1.5" fill="#fff" opacity="{r.uniform(0.03, 0.18):.2f}"/>')
    for i in range(1, 7):
        art.append(f'<path d="M{200 - i * 38} {150 - i * 4} A {i * 38} {i * 38} 0 0 1 {200 + i * 38} {150 - i * 4}" fill="none" stroke="#b388ff" stroke-width="2" opacity="{0.75 - i * 0.1:.2f}"/>')
    # tower lattice
    art.append('<path d="M200 140 L150 520 M200 140 L250 520" stroke="#d1c4e9" stroke-width="3"/>')
    y = 170
    while y < 520:
        t = (y - 140) / 380
        lx, rx = 200 - 50 * t, 200 + 50 * t
        t2 = (y + 40 - 140) / 380
        art.append(f'<line x1="{lx:.1f}" y1="{y}" x2="{200 + 50 * t2:.1f}" y2="{y + 40}" stroke="#d1c4e9" stroke-width="1.4" opacity="0.8"/>')
        art.append(f'<line x1="{rx:.1f}" y1="{y}" x2="{200 - 50 * t2:.1f}" y2="{y + 40}" stroke="#d1c4e9" stroke-width="1.4" opacity="0.8"/>')
        art.append(f'<line x1="{lx:.1f}" y1="{y}" x2="{rx:.1f}" y2="{y}" stroke="#d1c4e9" stroke-width="1.4" opacity="0.8"/>')
        y += 40
    art.append('<circle cx="200" cy="140" r="7" fill="#ff5252"/><circle cx="200" cy="140" r="20" fill="#ff5252" opacity="0.25"/>')
    # ghost silhouette at base
    art.append('<path d="M110 600 L110 470 Q 110 430 140 430 Q 170 430 170 470 L170 600 Z" fill="#e8e0ff" opacity="0.10"/>')
    defs = grad('night', [('0', '#1a0f33'), ('1', '#05030b')])
    poster('signal-lost', ['SIGNAL', 'LOST'], 'THE CALLERS DIED YEARS AGO.', 'ENGLISH  |  A  |  HORROR MYSTERY', defs, ''.join(art), accent='#d1b3ff')


if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    for fn in (monsoon, chai, orbit, kaal, kites, vettai, hostel, deep, aranya, signal):
        fn()
    print('posters written to', os.path.abspath(OUT))
