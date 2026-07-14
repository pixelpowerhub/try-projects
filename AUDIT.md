# Audit Findings — Indic Monopoly

Full review of the uploaded project (single `index.html`, ~1,515 lines,
Firebase Realtime Database, no build step). This documents what was found
and what was actually changed, so nothing is silently different from what
you remember building.

## Critical

1. **No Firebase Security Rules.** The project used Realtime Database with
   no `database.rules.json` and no evidence rules had been published
   (client code fetches the entire `games` node, including every field, in
   the lobby list). Without published rules, a fresh Realtime Database
   defaults to **fully locked** (good) — but if this project's console was
   ever switched to "test mode" for development (extremely common, and the
   most likely explanation for the game working at all pre-audit), the
   database is **wide open**: anyone with the public Firebase config
   (visible in any browser's dev tools on your live site) can read or
   overwrite any game, for any room, at any time — money, positions,
   passwords, everything.
   **Fix:** `database.rules.json` now requires authentication for every
   read/write, validates the shape and type of every field, and scopes
   player writes to the player's own Firebase Auth UID or the room's host.
   You must publish it (`firebase deploy --only database`) — see README.

2. **Room passwords stored and compared in plaintext.** `hostPass` was
   written to the database as the literal password the host typed, and
   the "restore my game" flow downloaded **every game's plaintext
   password** to the client to compare locally.
   **Fix:** passwords are now SHA-256 hashed client-side before ever
   touching the database (`hostPassHash`), and restore compares hashes.
   Restoring by signed-in identity (if you used Google Sign-In) needs no
   password at all. See README "Known limitations" for the honest ceiling
   on what a hashed short PIN can protect against without a backend.

3. **Host password shown to every player, not just the host.** In
   `enterGame()`, the sidebar subtitle was hardcoded to
   `'Host Password: ' + gdata.hostPass` for **all** players in the room,
   not just the host who set it. Any player could read the host's
   password directly off their own screen.
   **Fix:** the plaintext password now lives only in memory on the host's
   own device (`myRoomPass`, set once when they type or verify it), is
   never stored in the database, and the sidebar/waiting-room password
   display is now gated to `isHost` only.

## High

4. **Stored XSS via player names.** Names are user-supplied (max 20 chars
   client-side, but that's not enforced by anything server-side) and were
   interpolated unescaped into system chat messages
   (`sysMsg(player.name + ' collected salary...')`), which are later
   rendered with `element.innerHTML = m.text`. A player named e.g.
   `<img src=x onerror=...>` would have that payload executed in every
   other connected player's browser the next time they collected salary,
   bought property, paid rent, went bankrupt, etc.
   **Fix:** every interpolation of `player.name` / `myName` / property
   names into a `sysMsg()` call now goes through the existing `esc()`
   helper (the codebase already had this helper and used it correctly in
   most other places — this closes the gaps). Also applied to the avatar
   initial (`p.name[0]`) rendering, for defense in depth.

## Medium

5. **Case-sensitive filename bug breaks audio on Linux hosting.**
   `sound-manager.js` (formerly inline) references `airport.mp3`
   (lowercase), but the shipped file was `Airport.mp3`. This works locally
   on Windows/macOS (case-insensitive filesystems) but silently 404s on
   GitHub Pages, Firebase Hosting, Netlify, or any Linux-based static
   host — the airport-landing sound would just never play, with no error
   shown to the user.
   **Fix:** renamed the asset to `airport.mp3` to match the code.

6. **No Security Rules-level input validation** meant a malformed or
   malicious client could write arbitrary `money`/`position`/`status`
   values with wrong types, potentially breaking other players' UI
   (`NaN` money, out-of-range board positions, unrecognized status
   strings). **Fix:** `database.rules.json` validates type and, where
   meaningful, range/enum for every field.

## Low / hygiene

7. **Unused sound assets.** `coin.mp3`, `dice-2.mp3`, `police-.mp3`, and
   `start_game.mp3` exist in `sounds/` but aren't referenced anywhere in
   `SND.map`. Left in place (harmless, maybe intended for a future
   feature) but flagging in case they were meant to be wired up.

8. **Stray file in the sounds folder.** `sounds/file_create.html` (an
   unrelated ~4KB HTML file) was in the original zip and isn't part of the
   game. Not included in this build's `sounds/` folder.

## What was intentionally left unchanged

- **Core game rules and turn logic** (dice rolling, rent calculation,
  bankruptcy, property buy/sell flow) — no bugs found in the logic itself
  during this pass; only the security/escaping issues above.
- **Visual design and UX** — preserved exactly as designed, per the brief.
- **Existing accessibility work** (skip link, ARIA live regions, focus
  management, semantic roles) was already present and reasonably solid;
  no regressions introduced, a few small additions noted in README.

## Recommended next steps (not done in this pass — flagging for a follow-up)

- Move turn/move validation into Cloud Functions so the client can't
  write fraudulent game state directly (see README "Known limitations").
- Add automated tests around the win/bankruptcy/rent logic before making
  further changes, since none currently exist.
- Consider Firebase App Check to cut down on non-browser/bot traffic
  hitting your Realtime Database directly.
