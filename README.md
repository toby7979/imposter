# Brainbox: Word Imposter

A pass-and-play vocabulary-building bluffing game. One player is secretly
given a different word or number to everyone else, and has to bluff
their way through a clue round without getting caught. 11+ vocabulary
is the default theme (closest to genuinely educational), but it's built
to be family fun first — the other themes (animals, food, countries,
movies, numbers) stay just as prominent for players who want pure play
over the vocabulary angle.

## What's here
- `index.html`, `styles.css`, `app.js`, `wordpacks.js` — the whole app,
  no build step, no dependencies
- `manifest.json`, `service-worker.js`, `icons/` — makes it installable
  on a phone home screen and usable offline
- Seven themes: 11+ vocabulary, numbers 0-50, everyday items, animals,
  food and drink, countries, movies
- Named players, each with their own running score across rounds
  (shown next to their name, resettable from the setup screen). Since
  who's the imposter changes every round, scoring is per-player, not a
  team pool: the imposter that round gets +3 for escaping detection;
  everyone else gets +1 each if the imposter is caught. Modeled on
  Spyfall's convention of paying the harder, riskier role more for
  succeeding (2-4 pts for the spy vs. 1 for the group).

## Online mode
Everyone plays on their own phone. The host creates a room (4-letter
code, or an invite link with `?room=CODE`), friends join, and each
player privately sees their own word. Everyone types a clue, all clues
are revealed together, everyone votes, and the same per-player scoring
applies (+3 for an imposter who escapes, +1 to everyone else if caught;
a tied vote lets the imposter escape).

How it works:
- `online.js` — rooms, phases (lobby, clue, vote, result) and the host's
  game logic. Firebase is loaded lazily, so pass-and-play works offline.
- `firebase-config.js` — public web config for the Firebase project.
- `database.rules.json` — Realtime Database security rules. Publish
  changes from the Firebase console (Realtime Database, Rules). They
  stop players reading each other's words and stop non-hosts editing
  game state; sign-in is anonymous, one identity per browser tab.
- The host's phone runs the game (deals words, advances phases, tallies
  votes), so it needs to stay open. If the host leaves, the room closes.
  Refreshing a page rejoins the same room.

Known limits: a technical player could read the imposter from the host's
phone (fixing that needs a server function), and abandoned rooms are not
cleaned up automatically yet.

## Try it locally
Open a terminal in this folder and run:

    python3 -m http.server 8000

Then visit `http://localhost:8000` in a browser.

## Deploy it
Static site, no build step. Connected to Netlify via GitHub — every
push to `main` redeploys automatically.

## Install on iPhone
Once deployed, open the URL in Safari, tap the Share icon, then
"Add to Home Screen." It'll behave like a normal app icon.

## Adding more themes
Edit `wordpacks.js` — add a new object to the `WORD_PACKS` array with
a `pairs` array of `[secretWord, imposterWord]` entries, or copy the
`numbers` pack shape for a range-based theme.

## Support link
There's no tip jar wired up right now. To add one back: put a Buy Me a
Coffee / Ko-fi / Stripe Payment Link URL in a `SUPPORT_URL` constant in
`app.js`, and add a "Support this app" button next to "How to play" on
the splash screen (see git history for the previous version). All
themes stay free either way — no locked content, no paywall.
