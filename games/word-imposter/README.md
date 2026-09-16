# Word Imposter

A pass-and-play guessing game. One player is secretly given a different
word or number to everyone else, and has to bluff their way through a
clue round without getting caught.

## What's here
- `index.html`, `styles.css`, `app.js`, `wordpacks.js` — the whole app,
  no build step, no dependencies
- `manifest.json`, `service-worker.js`, `icons/` — makes it installable
  on a phone home screen and usable offline
- Four themes: everyday words, 11+ vocabulary, animals, numbers 0-50

## Try it locally
Open a terminal in this folder and run:

    python3 -m http.server 8000

Then visit `http://localhost:8000` in a browser.

## Deploy it
This game lives inside the Party Pack monorepo (see the root [README](../../README.md)).
It deploys automatically as part of that site, at `/games/word-imposter/` —
there's nothing to deploy separately.

## Install on iPhone
Once deployed, open the URL in Safari, tap the Share icon, then
"Add to Home Screen." It'll behave like a normal app icon.

## Adding more themes
Edit `wordpacks.js` — add a new object to the `WORD_PACKS` array with
a `pairs` array of `[secretWord, imposterWord]` entries, or copy the
`numbers` pack shape for a range-based theme.

## Support link
The splash screen has a "Support this app" button pointing at
`SUPPORT_URL` in `app.js` — currently a placeholder. Swap it for a
real Buy Me a Coffee, Ko-fi, or Stripe Payment Link if you want a
low-friction way for people to chip in. All six themes stay free —
no locked content, no paywall.
