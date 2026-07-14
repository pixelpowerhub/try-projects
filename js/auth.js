// ============================================================
// Indic Monopoly - Authentication
// ============================================================
// Design decision: this is a pick-up-and-play local/party game,
// so we don't force email/password registration on every player -
// that would kill the "share a room code and play in 30 seconds"
// experience the game is built around.
//
// Instead:
//   - Every visitor is signed in anonymously (silently, no UI).
//     This gives every client a stable, unique Firebase Auth UID,
//     which lets our Security Rules require `auth != null` and
//     scope writes to "the player who owns this seat" instead of
//     leaving the database open to anyone on the internet.
//   - Signing in with Google is OPTIONAL. It upgrades an anonymous
//     session (auth.uid is preserved) and unlocks a persistent
//     display name/avatar and "my games" restore without needing
//     to type a room password on the same device.
//
// If you need full email/password accounts (registration, email
// verification, password reset, account deletion) they can be
// added the same way as the Google provider below using
// firebase.auth().createUserWithEmailAndPassword /
// sendPasswordResetEmail / sendEmailVerification / currentUser.delete().
// That's left out by default because it doesn't fit this game's
// flow, but the hooks (AUTH.ready, AUTH.uid, AUTH.user) are already
// structured so it's a drop-in addition later - see README.
// ============================================================

var AUTH = {
  uid: null,
  user: null,
  displayName: null,
  isAnonymous: true,
  _readyResolve: null,
  ready: null
};

AUTH.ready = new Promise(function (resolve) {
  AUTH._readyResolve = resolve;
});

function initAuth() {
  firebase.auth().onAuthStateChanged(function (user) {
    if (user) {
      AUTH.uid = user.uid;
      AUTH.user = user;
      AUTH.isAnonymous = user.isAnonymous;
      AUTH.displayName = user.displayName || null;
      if (AUTH._readyResolve) { AUTH._readyResolve(user); AUTH._readyResolve = null; }
      document.dispatchEvent(new CustomEvent('auth-changed', { detail: AUTH }));
    } else {
      // No session yet - sign in anonymously so Security Rules see auth != null
      firebase.auth().signInAnonymously().catch(function (err) {
        console.error('Anonymous sign-in failed:', err);
        toast('Sign-in Error', 'Could not start a secure session. Some features may not work. Check your Firebase Console has Anonymous Auth enabled.', null, 0);
      });
    }
  });
}

function signInWithGoogle() {
  var provider = new firebase.auth.GoogleAuthProvider();
  // Link the existing anonymous session so the same UID (and any
  // game already tied to it) carries over, instead of creating a
  // brand-new identity.
  var current = firebase.auth().currentUser;
  var op = (current && current.isAnonymous)
    ? current.linkWithPopup(provider)
    : firebase.auth().signInWithPopup(provider);
  return op.catch(function (err) {
    // If linking fails because the Google account is already used
    // elsewhere, fall back to a normal sign-in with that account.
    if (err && err.code === 'auth/credential-already-in-use' && err.credential) {
      return firebase.auth().signInWithCredential(err.credential);
    }
    throw err;
  });
}

function signOutToGuest() {
  return firebase.auth().signOut();
}
