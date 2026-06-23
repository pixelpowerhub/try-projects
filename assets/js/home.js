/* ================================
   GREETING + DATE + TIME (INDIA)
   ================================
   Accessibility fix: the greeting is the only piece announced via
   aria-live, and it is only re-announced when morning/afternoon/evening
   actually changes — not every 60 seconds. The date and time are
   plain (non-live) text so screen reader users aren't interrupted by
   a tick they didn't ask for, but can still read them on demand.
*/

let lastGreetingPeriod = null;

function updateHeaderInfo() {
  const now = new Date();

  const hour = Number(
    now.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: 'numeric',
      hour12: false
    })
  );

  let period = 'evening';
  let greetingText = 'Good Evening!';
  if (hour < 12) {
    period = 'morning';
    greetingText = 'Good Morning!';
  } else if (hour < 17) {
    period = 'afternoon';
    greetingText = 'Good Afternoon!';
  }

  const dateText = now.toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const timeText = now.toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  const greetingEl = document.getElementById('greeting');
  const dateEl = document.getElementById('current-date');
  const timeEl = document.getElementById('current-time');

  // Only touch the aria-live greeting element when the period actually
  // changes, so assistive technology isn't interrupted on every tick.
  if (greetingEl && period !== lastGreetingPeriod) {
    greetingEl.textContent = greetingText;
    lastGreetingPeriod = period;
  }

  if (dateEl) dateEl.textContent = dateText;
  if (timeEl) timeEl.textContent = timeText;
}

/* ============================================================
   DYNAMIC FEATURED TOOLS (FETCHED FROM DATA)
   ============================================================ */

function loadFeaturedTools() {
  const container = document.getElementById('featured-tools-list');
  if (!container) return;

  if (typeof SITE_TOOLS === 'undefined' || !Array.isArray(SITE_TOOLS) || SITE_TOOLS.length === 0) {
    container.innerHTML = '<li><p>Tools are loading. Please visit the <a href="./tools/index.html">Tools page</a> to see everything on offer.</p></li>';
    console.error("Data source 'SITE_TOOLS' not found or empty. Make sure tools-data.js is linked.");
    return;
  }

  // Fisher–Yates shuffle on a copy of the data, then take 3
  const shuffled = [...SITE_TOOLS];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const selected = shuffled.slice(0, 3);

  container.innerHTML = '';
  selected.forEach(tool => {
    const li = document.createElement('li');
    li.className = 'tool-card';

    const heading = document.createElement('h3');
    heading.textContent = tool.name;

    const desc = document.createElement('p');
    desc.textContent = tool.desc;

    const link = document.createElement('a');
    link.href = tool.link;
    link.className = 'tool-link';
    link.setAttribute('aria-label', `Open ${tool.name} tool`);
    link.textContent = 'Open Tool →';

    li.append(heading, desc, link);
    container.appendChild(li);
  });
}

/* ================================
   INIT CALLS
   ================================ */

document.addEventListener('DOMContentLoaded', () => {
  if (typeof updateHeaderInfo === 'function') {
    updateHeaderInfo();
    setInterval(updateHeaderInfo, 60000);
  }
  loadFeaturedTools();
});
