# Party Pack

A growing collection of free pass-and-play games with an educational
lean — genuinely useful (vocabulary, geography, whatever the next game
covers) without feeling like homework. No installs, no accounts — open
a link and play. (Working title — rename freely, it's just "the suite"
for now.)

## Structure
- `index.html`, `hub.css` — the landing page, a directory of games
- `games/<game-name>/` — each game is a fully standalone static PWA:
  its own `index.html`, assets, `manifest.json`, and `service-worker.js`.
  Installing one to a home screen doesn't pull in the others.

Each game currently keeps its own copy of the shared visual language
(fonts, color tokens, button styles) rather than importing a shared
stylesheet. That's deliberate for now — with only one game shipped,
it's too early to know what should actually be shared. Once a second
game exists, pull the common pieces into a `shared/` folder based on
what's actually duplicated, not what's guessed now.

## Adding a new game
1. Create `games/<new-game-name>/` as its own static app (own
   `manifest.json`, `service-worker.js`, icons — see `games/word-imposter/`
   as a reference)
2. Add a card for it to the grid in the root `index.html`
3. Push — the site redeploys automatically (Netlify, connected to `main`)

## Deploy
Static site, no build step. Connected to Netlify via GitHub — every
push to `main` redeploys automatically.
