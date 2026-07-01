/* ================================
   GREETING + DATE + TIME (INDIA)
   ================================
   Bug fix: the clock previously called updateHeaderInfo() once on load
   and then on a naive 60-second interval, so the displayed time looked
   "frozen" for up to a minute and never showed seconds. It now ticks
   every second, self-corrects for setInterval drift by re-aligning to
   the real second boundary, and pauses entirely when the tab is hidden
   (Page Visibility API) to avoid wasting CPU/battery in background tabs
   — resuming immediately and resyncing the instant the tab is visible
   again, so the time is always accurate even after a long pause.

   Accessibility: the greeting (Good Morning / Afternoon / Evening) is
   the only piece announced via aria-live, and only when the period
   actually changes — not every second — so screen reader users aren't
   interrupted by a ticking clock they didn't ask for.
*/

let lastGreetingPeriod = null;
let clockTimeoutId = null;

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
    second: '2-digit',
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

// Schedules the next tick to land as close as possible to the next real
// second boundary, instead of drifting via repeated setInterval(1000)
// calls (each of which can run a few ms late).
function scheduleNextTick() {
  clearTimeout(clockTimeoutId);
  if (document.hidden) return; // paused while tab is in the background

  updateHeaderInfo();
  const msIntoSecond = Date.now() % 1000;
  const delay = 1000 - msIntoSecond;
  clockTimeoutId = setTimeout(scheduleNextTick, delay);
}

function startClock() {
  clearTimeout(clockTimeoutId);
  scheduleNextTick();
}

function stopClock() {
  clearTimeout(clockTimeoutId);
  clockTimeoutId = null;
}

// Pause the clock in background tabs (saves battery/CPU); resume and
// resync the instant the tab becomes visible again, so the time shown
// is never stale.
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    stopClock();
  } else {
    startClock();
  }
});

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
    startClock();
  }
  loadFeaturedTools();
});
