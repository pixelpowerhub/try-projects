/* ======================================================
   WHATS-NEW-DATA.JS
   Single source of truth for the changelog. Add a new entry
   at the top of WHATS_NEW_ENTRIES whenever you ship a release,
   and bump WHATS_NEW_LATEST_VERSION so the popup shows again
   for everyone (even those who dismissed an earlier version).
====================================================== */

const WHATS_NEW_LATEST_VERSION = "v1.5";

const WHATS_NEW_ENTRIES = [
  {
    version: "v1.5",
    date: "July 2026",
    title: "Accuracy fixes, real accessibility, and Math Master profiles",
    items: [
      "Math Master: fixed answer-checking bugs so correct fraction, decimal, and BODMAS answers are no longer marked wrong.",
      "Math Master: difficulty now increases every level instead of feeling identical for long stretches between levels.",
      "Math Master: new Hint and Explain buttons give real, spoken, step-by-step help for the exact question on screen.",
      "Math Master: choose Guest Mode (asks your name each visit) or create a saved Profile (remembers your name on this device) — change it anytime with the \"Add Name\" button.",
      "Math Master: added a question-count picker (5, 10, 20, 25, 50, 100, or Unlimited Practice) plus live accuracy and average-time stats.",
      "Homepage clock: fixed a bug where the time froze after the page loaded — it now updates every second and pauses automatically in background tabs to save battery.",
      "Password Generator now uses your browser's secure random number generator instead of predictable randomness.",
      "Age Calculator: fixed a bug that showed \"365 days\" to your next birthday even on the day itself.",
      "Text Analyzer: added a real readability score (previously promised on the homepage but never calculated).",
      "Document Saver tool restored — it was completely broken and has been rebuilt from scratch.",
      "Site-wide accessibility: skip-to-content links, semantic navigation menus, visible keyboard focus, and a new Accessibility Statement page.",
      "Added a light/dark mode toggle that remembers your choice across the whole site.",
      "SEO improvements: sitemap, robots.txt, page descriptions, and social sharing previews on every page.",
      "Added security headers to help protect the site and your data."
    ]
  }
];
