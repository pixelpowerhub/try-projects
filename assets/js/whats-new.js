/* ======================================================
   WHATS-NEW.JS
   Shows a "What's New" popup once (per version) on first visit
   to the site. Once dismissed, it will not appear again unless
   WHATS_NEW_LATEST_VERSION in whats-new-data.js is bumped for a
   future release. The full changelog remains readable anytime
   at /whats-new/index.html.
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

        const dialog = document.createElement('div');
        dialog.className = 'whatsnew-dialog';
        dialog.setAttribute('role', 'dialog');
        dialog.setAttribute('aria-modal', 'true');
        dialog.setAttribute('aria-labelledby', 'whatsnew-title');
        dialog.setAttribute('aria-describedby', 'whatsnew-desc');

        const itemsHtml = latest.items.map(item => `<li>${item}</li>`).join('');

        dialog.innerHTML = `
      <h2 id="whatsnew-title">✨ What's New — ${latest.version}</h2>
      <p id="whatsnew-desc" class="whatsnew-subtitle">${latest.title} (${latest.date})</p>
      <ul class="whatsnew-list">${itemsHtml}</ul>
      <div class="whatsnew-actions">
        <a href="${whatsNewPagePath()}" class="btn-link">View full changelog</a>
        <button type="button" class="btn-main" id="whatsnew-dismiss-btn">Got it, thanks!</button>
      </div>
    `;

        overlay.appendChild(dialog);
        document.body.appendChild(overlay);

        const dismissBtn = document.getElementById('whatsnew-dismiss-btn');
        const previouslyFocused = document.activeElement;

        function close() {
            markDismissed();
            overlay.remove();
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

        dismissBtn.focus();
    }

    // Builds a relative path to the What's New page based on how deep the
    // current page sits in the site (e.g. /tools/MathMaster/ needs ../../).
    function whatsNewPagePath() {
        const depth = window.location.pathname.replace(/^\/|\/$/g, '').split('/').filter(Boolean).length;
        // depth 0 = homepage, otherwise count folders after domain minus the trailing index.html
        const path = window.location.pathname;
        const segments = path.split('/').filter(Boolean);
        // Drop the trailing filename (e.g. index.html) if present
        if (segments.length && segments[segments.length - 1].includes('.html')) segments.pop();
        const upCount = segments.length;
        const prefix = '../'.repeat(upCount);
        return `${prefix}whats-new/index.html`;
    }

    document.addEventListener('DOMContentLoaded', () => {
        if (typeof WHATS_NEW_ENTRIES === 'undefined' || WHATS_NEW_ENTRIES.length === 0) return;
        if (alreadyDismissed()) return;
        buildModal();
    });
})();
