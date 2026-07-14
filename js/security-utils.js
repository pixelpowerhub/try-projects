// ============================================================
// Indic Monopoly - Security utilities
// ============================================================
// Room passwords are short (4-6 digit) convenience PINs meant to
// stop casual strangers from hijacking a room, NOT cryptographic
// secrets. Even so, we never store or transmit them in plaintext:
// we hash them client-side with SHA-256 (Web Crypto API, native
// to every modern browser, no library needed) before they touch
// the database. This means:
//   - Reading the database (or the Firebase console) never reveals
//     anyone's actual PIN.
//   - The PIN can't be reused by an attacker who reads the DB to
//     try against other services.
// This does NOT protect against brute-forcing a 4-digit PIN if an
// attacker can hit the database directly - see database.rules.json
// and README "Known limitations" for the full picture.
// ============================================================

async function sha256Hex(text) {
  var enc = new TextEncoder().encode(String(text));
  var digest = await crypto.subtle.digest('SHA-256', enc);
  var bytes = Array.from(new Uint8Array(digest));
  return bytes.map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
}

// Basic client-side input sanitation helpers used across the app.
function clampStr(s, max) {
  return String(s || '').trim().slice(0, max || 200);
}

function isValidRoomPass(pass) {
  return /^[0-9]{4,6}$/.test(String(pass || ''));
}
