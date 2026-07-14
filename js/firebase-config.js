// ============================================================
// Indic Monopoly - Firebase initialization
// ============================================================
// IMPORTANT: These are Firebase *client* config values. They are
// not secret (they identify the project, not authenticate you) -
// see https://firebase.google.com/docs/projects/api-keys - but the
// project must have real Security Rules (see database.rules.json)
// or anyone can read/write your entire database regardless of
// these values being public.
//
// For local dev you can copy .env.example -> .env and this file
// will read values injected by your build tool. If you're just
// opening this as static files (no build step), the fallback
// object below is used directly - replace it with your own
// project's values before deploying.
// ============================================================

var FB = (window.__FIREBASE_CONFIG__) || {
  apiKey: 'AIzaSyDx95S0-Ao8fMKhWM6nfoq-tv856rif3l4',
  authDomain: 'indic-monopoly.firebaseapp.com',
  databaseURL: 'https://indic-monopoly-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId: 'indic-monopoly',
  storageBucket: 'indic-monopoly.firebasestorage.app',
  messagingSenderId: '479342520821',
  appId: '1:479342520821:web:4efa6b2f7aa98c93e758bc'
};

var db = null;

function initFirebase() {
  if (!firebase.apps.length) firebase.initializeApp(FB);
  db = firebase.database();
  return db;
}

// Firebase Realtime Database helpers (kept as free functions so the
// rest of the app doesn't need to know about the firebase namespace)
function R(p) { return db.ref(p); }
function fSet(p, v) { return R(p).set(v); }
function fGet(p) { return R(p).once('value'); }
function fUpd(p, v) { return R(p).update(v); }
function fDel(p) { return R(p).remove(); }
function fOn(p, cb) { R(p).on('value', cb); }
function fOff(p) { try { R(p).off(); } catch (e) {} }
