# MatchMate — landing / flow prototype

Static HTML + CSS + JS (no build step). **Desktop web**, fluid: reflows as the window is resized (breakpoints 1200 / 1024 / 900 / 768 / 600), no fixed width. EN/VI, light/dark toggle, mock data only.

## Run locally
```bash
python -m http.server 5173 --directory matchmate
```
Open http://localhost:5173. Opening `index.html` directly from disk also works, but tiles and fonts need internet.

## Deploy to Vercel (CI/CD)
GitHub Actions runs `npm run check` on every push and PR. PRs get a Vercel preview URL commented on them, and pushes to `main` deploy to production. Setup (repo, Vercel project, 3 secrets) is in [DEPLOY.md](DEPLOY.md).

## Pages
| Page | What it shows | Useful URL params |
|---|---|---|
| `index.html` | Home: hero search, why MatchMate, how it works, explore cards, live games | — |
| `feed.html` | Find games: For-you suggestions, list + map side by side | `?sport=badminton\|football`, `?when=today\|week`, `?focus=<id>`, `?route=<id>` |
| `create.html` | Host a game: 4-step form with live preview | — |
| `join.html` | Join flow: player view + host view | `?id=<matchId>` (default `m1`) |
| `about.html` | Personas (Khoa.Smash, Ha.Runner) + skill scales | — |

Published games are kept in `localStorage` (`mm-created`), and join status in `sessionStorage` (`mm-join`), so the flows connect across pages.

## Files
| File | What it holds |
|---|---|
| `css/styles.css` | Tokens (light/dark, `data-theme` override), components, fluid layout, motion styles, page transitions |
| `js/i18n.js` | All EN/VI strings |
| `js/layout.js` | Shared icon sprite, header, nav and footer (loaded first in `<body>`, so nothing shifts) |
| `js/data.js` | Personas, skill scales, formats, mock matches |
| `js/core.js` | Helpers, match card, MATCH-A scoring, cross-page store, theme/lang, motion system |
| `js/pages/*.js` | One script per page |

## Motion
- Page changes: cross-document View Transitions (header stays put), with a JS fade fallback in other browsers.
- Theme toggle: a circular reveal starting from the button.
- Headlines reveal word by word. Sections fade up on scroll (ScrollTrigger decides when, CSS does the motion).
- Home: 3D tilt on the hero, pins drop in, toasts float, the How-it-works line fills as you scroll, cursor spotlight on the explore cards.
- Feed: cards stagger in on filter change, map pins drop in, hovering a card highlights its pin, the route line draws itself.
- Create: steps slide forward/back, the preview pulses on edit, confetti on publish.
- Join: the request card flies to the host inbox, contact details unblur when unlocked, confetti on acceptance.
- All of it turns off with `prefers-reduced-motion`.

## MATCH-A (demo scoring)
Hard filters: preferred sport, open slots, future start, not the host.
Score = 0.4 · level fit + 0.3 · distance (radius × 2 cut-off) + 0.2 · free-time match + 0.1 · urgency (few slots left).

## Join states shown
`idle → pending → approved | rejected` (Host approves), or `idle → approved` (Instant join).
Host contact (full name and phone) is blurred until `approved`.

Map: Leaflet 1.9.4 with OpenStreetMap tiles. The route is a dashed preview line. Swap in OSRM, Goong or VietMap for real routing.
