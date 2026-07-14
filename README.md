# Indic Monopoly

A free, real-time multiplayer Monopoly-style board game set across Indian
states (Rajasthan, Gujarat, Kerala, Punjab, Tamil Nadu, and more) - built as
a single accessible web app with no server, no build step, and no install.
Just open it and share a room code.

## What changed in this pass

This version was audited and hardened. See **[AUDIT.md](AUDIT.md)** for the
full list of what was found and fixed. Highlights:

- **Critical:** room passwords were stored and transmitted in plaintext, and
  a host's password was accidentally displayed on *every* player's screen,
  not just the host's. Both fixed — see AUDIT.md.
- **Critical:** the database had no Security Rules, so anyone with the
  project's public config (visible in any browser's dev tools) could read
  or overwrite any game, for any room, at any time. Real rules are now in
  `database.rules.json`.
- **High:** player names were interpolated unescaped into chat/system
  messages rendered via `innerHTML`, allowing a malicious player name to
  inject HTML/script into every other player's screen. Fixed.
- **Medium:** a sound file (`Airport.mp3`) was capitalized differently than
  the code referenced it (`airport.mp3`), which works on Windows/macOS but
  silently 404s on case-sensitive Linux hosting (GitHub Pages, Firebase
  Hosting, Netlify, etc.). Fixed.
- Added optional Firebase Authentication (Google Sign-In, on top of a
  silent anonymous session for everyone) so Security Rules have something
  to check against, without forcing every player through a signup form.
- Split the single 1,500-line HTML file into `css/`, `js/` modules for
  maintainability, while keeping the exact same UI/UX and all features.

## Project structure

```
index.html              Page shell / screens / modals (markup only)
css/styles.css           All styling
js/
  security-utils.js      SHA-256 password hashing, input clamping
  firebase-config.js      Firebase app + Realtime Database init
  auth.js                 Anonymous + optional Google authentication
  sound-manager.js        Sound effect playback
  boards-data.js          Board/state data (cities, events, colors)
  app.js                  Game logic, UI, Firebase read/write, event wiring
sounds/                   Sound effects (mp3)
database.rules.json      Firebase Realtime Database Security Rules
firebase.json             Firebase Hosting + rules deploy config
.env.example              Documents expected Firebase config values
robots.txt
LICENSE
AUDIT.md                  Full audit findings and what was fixed
```

## Quick start (local)

Browsers block Firebase's SDK on `file://` pages, so you need a local
server. Any of these work:

```bash
# Python (no install needed on most systems)
python3 -m http.server 8080

# Node
npx serve .

# PHP
php -S localhost:8080
```

Then open `http://localhost:8080`.

## Firebase setup

1. Create a project at [console.firebase.google.com](https://console.firebase.google.com).
2. **Build > Realtime Database** → Create database → start in *locked* mode
   (we provide real rules, so you don't need test mode).
3. **Build > Authentication** → Sign-in method → enable:
   - **Anonymous** (required — every visitor uses this silently so the
     Security Rules have an `auth.uid` to check).
   - **Google** (optional — powers the "Sign in with Google" button).
4. **Project settings > General > Your apps** → add a Web app → copy the
   config object into `js/firebase-config.js` (replace the fallback object
   at the top of the file), or wire it through `.env` / your own build step
   using `.env.example` as a guide.
5. Deploy the security rules so your database isn't left wide open:
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase init   # select this project, point rules to database.rules.json
   firebase deploy --only database
   ```
   You can also just paste the contents of `database.rules.json` into
   **Realtime Database > Rules** in the console and click *Publish*.

## Deploying the site

Any static host works (Firebase Hosting, GitHub Pages, Netlify, Vercel).
For Firebase Hosting:

```bash
firebase deploy --only hosting
```

## Authentication model (and why it's designed this way)

This is a pick-up-and-play party game — the whole point is "share a room
code and start in 30 seconds." Forcing email/password registration on
every player would work against that. So:

- **Every visitor** is signed in **anonymously**, automatically, with no
  UI. This gives Security Rules a real `auth.uid` to scope permissions to,
  instead of leaving the database open to literally anyone.
- **Signing in with Google is optional.** It upgrades the same anonymous
  session (your `auth.uid` — and any game tied to it — carries over), and
  unlocks a remembered display name and restoring a hosted game without
  needing to type the room password on the same device.
- Full email/password accounts (registration, email verification, password
  reset, account deletion) were deliberately **not** added, since they
  don't fit this game's flow. The code is structured so they're a
  straightforward addition later if you want them — `AUTH.ready`,
  `AUTH.uid`, and `AUTH.user` in `js/auth.js` are the hooks; add
  `createUserWithEmailAndPassword`, `sendPasswordResetEmail`,
  `sendEmailVerification`, and `currentUser.delete()` calls the same way
  `signInWithGoogle()` is written.

## Known limitations (please read before relying on this for real money/stakes)

This is a **client-authoritative** game: each player's browser writes its
own moves (dice rolls, rent payments, property purchases) directly to the
database, and other players' browsers just render whatever they see. There
is no server refereeing the rules. This is normal and fine for a browser
game played honestly among friends, but it means:

- A technically sophisticated player *could* open dev tools and write
  fraudulent values (e.g., inflate their own money) directly to the
  database. The Security Rules in this project add real guardrails
  (schema validation, ownership checks, no plaintext secrets) but cannot
  fully prevent this without a trusted server (e.g., Cloud Functions)
  validating every move — that's a larger project than a static site.
- Room passwords are short 4-6 digit PINs meant to deter casual
  strangers, not resist a determined brute-force attempt against the
  database directly. They're hashed (SHA-256) before storage so they're
  never visible in plaintext, but hashing alone doesn't add entropy to a
  6-digit PIN.

If you want a fully cheat-proof version, the natural next step is moving
all game-state mutations into Cloud Functions (or another backend) that
validate turns server-side — happy to scope that as a follow-up.

## Accessibility

The game ships with skip links, ARIA live regions for turn/chat/dice
announcements, visible focus rings, semantic roles on the board/lobby/chat,
and keyboard-operable everything (Enter/Space on game cards, Escape to
close non-blocking modals). If you find a gap, please file an issue with
the screen reader + browser combo you were using.

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| Blank page / "Please use local server!" message | You opened `index.html` directly (`file://`) instead of through a local server — see Quick start above. |
| "Could not connect to Firebase" toast | Realtime Database isn't enabled, or the config in `js/firebase-config.js` doesn't match your project. |
| "Could not start a secure session" toast | Anonymous Authentication isn't enabled in Firebase Console → Authentication → Sign-in method. |
| Games never appear in the lobby | Check Security Rules are deployed (`firebase deploy --only database`) and that Anonymous Auth succeeded (check the browser console for "Secure session ready."). |
| No sound effects | Some browsers block autoplay until the user interacts with the page once — this is expected browser behavior, not a bug. |

## License

MIT — see [LICENSE](LICENSE).
