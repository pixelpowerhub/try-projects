/* ======================================================
   THEME.JS – Manual light/dark mode toggle
   Persists the user's choice in localStorage so it applies
   consistently across every page of the site.
====================================================== */
(function () {
  const STORAGE_KEY = 'pph-theme';

  function applyTheme(theme) {
    if (theme === 'dark' || theme === 'light') {
      document.documentElement.setAttribute('data-theme', theme);
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }

  function getSavedTheme() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      return null;
    }
  }

  function saveTheme(theme) {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (e) { /* localStorage unavailable — toggle still works for this page view */ }
  }

  // Apply saved preference immediately (before paint where possible)
  applyTheme(getSavedTheme());

  document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('theme-toggle-btn');
    if (!btn) return;

    function currentIsDark() {
      const saved = getSavedTheme();
      if (saved) return saved === 'dark';
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    function updateButtonLabel() {
      const isDark = currentIsDark();
      btn.setAttribute('aria-pressed', String(isDark));
      btn.innerHTML = isDark ? '☀️ Light mode' : '🌙 Dark mode';
    }

    btn.addEventListener('click', () => {
      const next = currentIsDark() ? 'light' : 'dark';
      applyTheme(next);
      saveTheme(next);
      updateButtonLabel();
    });

    updateButtonLabel();
  });
})();
