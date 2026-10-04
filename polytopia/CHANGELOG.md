# Tribe Picker changelog

Newest first. Each entry's code (like `b910abe`) is the saved version in Git.
To go back, ask Claude: "revert the tribe picker to `<code>`", or "undo `<code>`"
to remove just that one change and keep everything after it.

Live site: https://toby7979.github.io/imposter/polytopia/

## 2026-10-04

- "Reset this list" link removed. To put a list back to the original order,
  delete it in the Firebase console (Data → tribePicker → order → that setup).
- `878ec9b` No more voting: tapping ▲ or ▼ moves a tribe one place, every tap, for
  everyone. The shared order is saved per map type and size under
  `tribePicker/order/` (new database rules). "Reset this list" puts it back.
- `ad1f7e9` Each vote moves a tribe exactly one place from where it sits, even when its
  neighbours were also voted (before, equal votes on neighbours cancelled out).
- `2b04088` Suggest button (Google Form) removed; the banner points to the vote arrows.
- `099c5f6` Back to one vote = one place (the 3-votes rule is dropped for now; can come
  back later). Sliding cards and the subtler vote arrow stay.
- `d371102` Calmer voting: a tribe moves one place per 3 net votes (was every vote),
  cards slide to their new place, and your own vote shows as a coloured
  arrow instead of a solid button.
- `b910abe` Vote control laid out sideways: down, total, up.
- `34491c9` Vote control restyled as a rounded pill with chevron arrows.
- `0c3492b` **Live player voting.** ▲/▼ on every tribe moves it one place for
  everyone, per map type and size. Votes are stored in Firebase under
  `tribePicker/` (the database rules are in `database.rules.json`).

## 2026-10-03

**Tiers and picks**
- `420c815` Polaris: note that it wins most Archipelago maps.
- `7f844ee` Elyrion is the #1 pick on Huge and Massive Drylands, Lakes, Pangea
  and Continents (not Water World or Archipelago). Note on Large maps.
- `72cbd2f` Elyrion top pick on Massive Continents.
- `0a08d2c` Might and Glory game modes. League tiers are for Might; Glory
  reorders tribes inside each tier.
- `eec6d3e` Starts on 1v1 by default.
- `81ad097` Elyrion leads Tier 2 on big Continents maps, with a note.
- `eb46af4` Season 38 league tier lists for Drylands, Pangea, Lakes,
  Continents and Archipelago, with size notes (Elyrion on Lakes and
  Continents, Cymanti above Yadakk on Lakes).
- `5a8d3de` Player picks: Oumaji then Yadakk on Tiny Drylands (with a Vengir
  warning); Polaris/Aquarion on Water World, swapping at Normal size.

**Look and feel**
- `fc84ced` Official heads for Oumaji, Cymanti and the pirate-hat Kickoo.
- `18f7851` Official heads from Midjiwan's public graphics pack.
- `c199359` Condensed layout; choices look like buttons.
- `b839cd9` Tribe icons cut from an in-game screenshot.
- `6f0ae6e` Hand-drawn cube heads on blue badges.
- `232cbc6` Restyled after the game's setup screens (sunset sky, bands, black cards).
- `619d849` Back to the Polytopia-style look, more compact.
- `2fa2a89` Retro text-game look (Caves of Qud style). Replaced by `619d849`.
- `73dbc07` Round tribe-coloured badges.
- `3857caa` Original low-poly tribe heads; title follows Polytopia's fan naming rules.
- `aa24ed1` Low-poly game-menu look with an island map.

**Other**
- `0e4756b` Suggestion button opens the Google Form.
- `1213d02` Work-in-progress banner.
- `b5f489d` Marked as an unofficial fan tool.
- `1bfc3e3` First version: opponents, map type and size; scored tier list.

## Not covered by reverting

- **Player votes** live in Firebase, not in Git. Going back to an older
  version of the page doesn't remove or restore votes.
- **Firebase rules** only change when they're pasted into the Firebase console.
