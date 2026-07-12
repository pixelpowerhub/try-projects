/* ======================================================
   WHATS-NEW-DATA.JS
   Single source of truth for the changelog.

   - "highlights": 2-3 short points shown by default in the first-visit
     popup. Keep this SHORT — it's meant to be read in a few seconds.
   - "items": the longer, categorized bullet list. Shown when the user
     taps "Show more" inside the popup itself, and on the dedicated
     /whats-new/ page for anyone who wants to read it in full later.

   We're keeping this all under v1.5 for now — it was never actually
   finished/published as a standalone release, so new work keeps
   landing in the same entry instead of bumping the version number.
   Bump WHATS_NEW_LATEST_VERSION only once v1.5 is genuinely done and
   you want the popup to resurface for everyone who dismissed it.
====================================================== */

const WHATS_NEW_LATEST_VERSION = "v1.5";

const WHATS_NEW_ENTRIES = [
  {
    version: "v1.5",
    date: "July 2026 (in progress)",
    title: "Math Master rebuild, real accessibility fixes, and safer File Locker",
    highlights: [
      "Math Master: fixed answer-accuracy bugs, added Guest/saved-profile modes, Hints, and step-by-step Explain.",
      "File Locker: now supports selecting and managing multiple files at once, and no longer fails on large files.",
      "Site-wide: clearer content, a redesigned FAQ page, dark mode, and simpler navigation."
    ],
    items: [
      "Math Master: fixed answer-checking bugs so correct fraction, decimal, and BODMAS answers are no longer marked wrong.",
      "Math Master: difficulty now increases every level instead of feeling identical for long stretches between levels.",
      "Math Master: added Hint and Explain buttons with real, spoken, step-by-step help for the exact question on screen.",
      "Math Master: choose Guest Mode or a saved Profile, change your name anytime with the \"Add Name\" button, and pick from 5 to 100 questions (or Unlimited Practice).",
      "File Locker: you can now select multiple files at once from your device's file picker, with a collapsible list, previews, and remove/remove-all controls.",
      "File Locker: fixed a bug where locking several gigabytes of files together could silently fail — files are now packaged more efficiently and no longer hit that limit.",
      "File Locker: your password is no longer stored anywhere inside the locked file, even in disguised form — a real security improvement.",
      "File Locker: shortened the on-page instructions to a few bullet points, with full steps moved to the User Guide.",
      "Text Analyzer: fixed a bug where word count and \"most repeated word\" gave wrong or empty results for Hindi, Punjabi, and other non-English scripts.",
      "Text Analyzer: added an estimated reading time, and trimmed the on-page instructions — full detail moved to the User Guide.",
      "Homepage clock: fixed a bug where the time froze after the page loaded.",
      "Password Generator now uses your browser's secure random number generator instead of predictable randomness.",
      "Age Calculator: fixed a bug that showed \"365 days\" to your next birthday even on the day itself.",
      "Document Saver tool restored — it was completely broken and has been rebuilt from scratch.",
      "Rewrote About Us, Privacy Policy, Terms & Conditions, and FAQ content in plainer, friendlier language — the facts didn't change, just how clearly we say them.",
      "FAQ page redesigned as an expandable, grouped list that's easier to scan.",
      "Reviewed and updated every tool's User Guide to match all of the above.",
      "Added a light/dark mode toggle, skip-to-content links, and a new Accessibility Statement page.",
      "Simplified navigation: the main menu now goes Home, Tools, Blogs, Courses, About Us — with Privacy Policy, Contact Us, What's New, and Accessibility Statement in the footer.",
      "Fixed a bug where the \"What's New\" popup wasn't announced by screen readers on first open."
    ]
  }
];
