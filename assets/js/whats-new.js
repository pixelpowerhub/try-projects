/* ======================================================
   WHATS-NEW.JS
   Shows a short "What's New" popup once (per version) on first
   visit to the site. Once dismissed, it will not appear again
   unless WHATS_NEW_LATEST_VERSION in whats-new-data.js is bumped
   for a future release.

   ACCESSIBILITY FIX: earlier versions moved keyboard focus straight
   to the "Got it" button when the dialog opened. That meant screen
   readers announced "Got it, thanks — button" but never announced
   that a dialog had opened at all. Focus now lands on the dialog
   container itself (role="alertdialog", tabindex="-1", labelled by
   its heading), which makes assistive technology announce the
   dialog's role and title first — the way opening any dialog should
   be announced. A visually-hidden aria-live="assertive" region backs
   this up with an explicit spoken announcement, since some mobile
   screen readers (e.g. TalkBack in "explore by touch" mode) don't
   reliably announce a dialog from a programmatic focus() call alone.
====================================================== */
(function () {
    const STORAGE_KEY = 'pph-whatsnew-dismissed-version';

    function alreadyDismissed() {
        try {
            return localStorage.getItem(STORAGE_KEY) === WHATS_NEW_LATEST_VERSION;
        } catch (e) {
            return true; // storage unavailable — don't force the popup every load
        }
    }

    function markDismissed() {
        try {
            localStorage.setItem(STORAGE_KEY, WHATS_NEW_LATEST_VERSION);
        } catch (e) { /* storage unavailable — popup will just show again next load */ }
    }

    function buildModal() {
        const latest = WHATS_NEW_ENTRIES[0];
        if (!latest) return;

        const overlay = document.createElement('div');
        overlay.className = 'whatsnew-overlay';
        overlay.id = 'whatsnew-overlay';

        // Redundant, explicit announcement for assistive technology that
        // doesn't reliably announce a dialog just from focus() alone.
        const announcer = document.createElement('div');
        announcer.className = 'visually-hidden';
        announcer.setAttribute('aria-live', 'assertive');
        announcer.setAttribute('role', 'status');

        const dialog = document.createElement('div');
        dialog.className = 'whatsnew-dialog';
        dialog.setAttribute('role', 'alertdialog');
        dialog.setAttribute('aria-modal', 'true');
        dialog.setAttribute('aria-labelledby', 'whatsnew-title');
        dialog.setAttribute('aria-describedby', 'whatsnew-desc');
        dialog.setAttribute('tabindex', '-1');

        // Short, curated highlights shown by default — 2 to 3 points.
        const highlights = (latest.highlights && latest.highlights.length ? latest.highlights : latest.items).slice(0, 3);
        const highlightsHtml = highlights.map(item => `<li>${item}</li>`).join('');

        // Full list available on demand via a native <details> toggle, so
        // it stays keyboard/screen-reader accessible for free and the
        // popup never has to navigate away to show more.
        const fullList = latest.items || [];
        const fullListHtml = fullList.map(item => `<li>${item}</li>`).join('');

        dialog.innerHTML = `
      <h2 id="whatsnew-title">✨ What's New</h2>
      <p id="whatsnew-desc" class="whatsnew-subtitle">${latest.version} — ${latest.date}</p>
      <ul class="whatsnew-list">${highlightsHtml}</ul>
      ${fullList.length > highlights.length ? `
      <details class="whatsnew-more">
        <summary class="whatsnew-more-toggle">Show more updates</summary>
        <ul class="whatsnew-list">${fullListHtml}</ul>
      </details>` : ''}
      <div class="whatsnew-actions">
        <button type="button" class="btn-main" id="whatsnew-dismiss-btn">Got it, thanks!</button>
      </div>
    `;

        overlay.appendChild(dialog);
        document.body.appendChild(overlay);
        document.body.appendChild(announcer);

        const dismissBtn = document.getElementById('whatsnew-dismiss-btn');
        const previouslyFocused = document.activeElement;

        function close() {
            markDismissed();
            overlay.remove();
            announcer.remove();
            if (previouslyFocused && previouslyFocused.focus) previouslyFocused.focus();
        }

        dismissBtn.addEventListener('click', close);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) close();
        });
        document.addEventListener('keydown', function escHandler(e) {
            if (e.key === 'Escape') {
                close();
                document.removeEventListener('keydown', escHandler);
            }
        });

        // Focus the DIALOG (not the button) so screen readers announce
        // "alert dialog, What's New" — the actual fix for the reported bug.
        dialog.focus();

        // Fire the backup spoken announcement just after the dialog is in
        // the DOM and focused, so it isn't dropped by AT that ignores
        // live-region changes that happen before it starts listening.
        setTimeout(() => {
            announcer.textContent = `New update available: What's New, version ${latest.version}.`;
        }, 150);
    }

    document.addEventListener('DOMContentLoaded', () => {
        if (typeof WHATS_NEW_ENTRIES === 'undefined' || WHATS_NEW_ENTRIES.length === 0) return;
        if (alreadyDismissed()) return;
        buildModal();
    });
})();
