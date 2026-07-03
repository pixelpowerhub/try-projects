/* ======================================================
   WHATS-NEW-DATA.JS
   Single source of truth for the changelog.

   - "highlights": 2-3 short points shown in the first-visit popup.
     Keep this SHORT — it's meant to be read in a few seconds, not
     a full release log.
   - "items": the longer, complete list shown on the dedicated
     /whats-new/ page for anyone who wants the full detail.

   Add a new entry at the top of WHATS_NEW_ENTRIES whenever you ship
   a release, and bump WHATS_NEW_LATEST_VERSION so the popup shows
   again for everyone (even those who dismissed an earlier version).
====================================================== */

const WHATS_NEW_LATEST_VERSION = "v1.6";

const WHATS_NEW_ENTRIES = [
  {
    version: "v1.6",
    date: "July 2026",
    title: "Friendlier content, a smarter Text Analyzer, and multi-file support",
    highlights: [
      "Rewrote our About, Privacy Policy, and FAQ pages to be clearer and easier to read.",
      "Text Analyzer now supports Hindi, Punjabi, and other languages, and shows estimated reading time.",
      "File Locker now lets you pick and manage multiple files at once on mobile."
    ],
    items: [
      "Rewrote About Us, Privacy Policy, Terms & Conditions, and FAQ content in plainer, friendlier language, with grammar fixes throughout — the facts didn't change, just how clearly we say them.",
      "FAQ page redesigned with expandable questions grouped by topic, so it's easier to scan and jump straight to what you need.",
      "Text Analyzer redesigned: the tool now opens with just the essentials, instead of a wall of instructions before you've typed anything. Full details moved to its User Guide.",
      "Text Analyzer: fixed a bug where word count and \"most repeated word\" gave wrong or empty results for Hindi, Punjabi, and other non-English scripts. It now works correctly across languages.",
      "Text Analyzer: added an estimated reading time based on your text's length.",
      "File Locker: you can now select multiple files at once from your device's file picker (previously mobile only allowed one at a time).",
      "File Locker: selecting more than one file now shows a collapsed summary with a count; expand it to see each file with a small preview and a remove button, plus a \"Remove All\" option.",
      "Reviewed and updated every tool's User Guide to match these changes.",
      "Fixed a bug where the \"What's New\" popup wasn't announced by screen readers on first open — it's now properly announced as a dialog.",
      "Removed \"FAQs\" from the main navigation menu — it's still one tap away in the footer on every page, alongside Privacy Policy."
    ]
  },
  {
    version: "v1.5",
    date: "July 2026",
    title: "Accuracy fixes, real accessibility, and Math Master profiles",
    highlights: [
      "Math Master: fixed answer-accuracy bugs and added Guest / saved-profile modes.",
      "Fixed a bug where the homepage clock froze after loading.",
      "Site-wide accessibility upgrades: skip links, keyboard focus, dark mode, and a new Accessibility Statement."
    ],
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
