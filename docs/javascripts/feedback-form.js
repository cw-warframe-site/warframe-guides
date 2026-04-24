const WORKER_URL  = 'https://wf-guide-submission.charith4bak.workers.dev';
const FORMSPREE   = 'https://formspree.io/f/xeevneea';
const GH_REPO     = 'cw-warframe-guides/cw-warframe-guides.github.io';
const GH_API      = `https://api.github.com/repos/${GH_REPO}/issues?state=open&per_page=50`;
const CACHE_KEY   = 'wf_guide_tickets_v1';
const CACHE_TTL   = 60 * 60 * 1000; // 1 hour

const LABEL_COLOURS = {
  'feedback':      { bg: '#2a2210', border: '#b59d47', text: '#b59d47' },
  'guide request': { bg: '#0d1f2b', border: '#0075ca', text: '#4da6ff' },
  'bug':           { bg: '#2b0d0d', border: '#d73a4a', text: '#f47f8a' },
  'accepted':      { bg: '#0d2b1a', border: '#2ea44f', text: '#3fb950' },
};

/* ── Form submission ───────────────────────────── */
document.addEventListener('DOMContentLoaded', function () {
  var form    = document.getElementById('feedback-form');
  var success = document.getElementById('feedback-success');
  var error   = document.getElementById('feedback-error');

  if (form) {
    form.addEventListener('submit', async function (e) {
      e.preventDefault();

      var name    = form.querySelector('#fb-name').value.trim();
      var email   = form.querySelector('#fb-email').value.trim();
      var subject = form.querySelector('#fb-subject').value.trim();
      var type    = form.querySelector('#fb-type').value;
      var message = form.querySelector('#fb-message').value.trim();

      if (!name || !subject || !type || !message) return;

      var submit = form.querySelector('.feedback-form__submit');
      submit.disabled    = true;
      submit.textContent = 'Sending...';
      error.hidden   = true;
      success.hidden = true;

      var payload = { name, email, subject, type, message };
      var ok = false;

      // Try Cloudflare Worker → GitHub Issues
      try {
        var res = await fetch(WORKER_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        ok = res.ok;
      } catch (_) { /* fall through */ }

      // Fallback: Formspree directly
      if (!ok) {
        try {
          var fp = await fetch(FORMSPREE, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({
              name,
              email: email || '(not provided)',
              subject,
              type,
              message,
              _subject: `[WF Guide Backup] ${subject}`,
            }),
          });
          ok = fp.ok;
        } catch (_) { /* both failed */ }
      }

      if (ok) {
        form.hidden    = true;
        success.hidden = false;
      } else {
        submit.disabled    = false;
        submit.textContent = 'Submit';
        error.hidden       = false;
      }
    });
  }

  /* ── Open tickets ──────────────────────────────── */
  loadTickets();
});

async function loadTickets() {
  var loading = document.getElementById('tickets-loading');
  var errEl   = document.getElementById('tickets-error');
  var emptyEl = document.getElementById('tickets-empty');
  var listEl  = document.getElementById('tickets-list');
  var metaEl  = document.getElementById('tickets-meta');
  var updEl   = document.getElementById('tickets-updated');

  if (!listEl) return;

  // ── Cache hit ──────────────────────────────────────
  var cached = null;
  try { cached = JSON.parse(localStorage.getItem(CACHE_KEY)); } catch (e) {}
  if (cached && (Date.now() - cached.fetched) < CACHE_TTL) {
    renderTickets(cached.issues, cached.fetched, { loading, errEl, emptyEl, listEl, metaEl, updEl });
    return;
  }

  // ── Fetch from GitHub ──────────────────────────────
  try {
    var res = await fetch(GH_API, {
      headers: { 'Accept': 'application/vnd.github.v3+json' },
    });

    if (!res.ok) throw new Error('API error');

    var issues = await res.json();
    var fetched = Date.now();

    try { localStorage.setItem(CACHE_KEY, JSON.stringify({ issues, fetched })); } catch (e) {}

    renderTickets(issues, fetched, { loading, errEl, emptyEl, listEl, metaEl, updEl });

  } catch (_) {
    loading.hidden = true;
    errEl.hidden   = false;
  }
}

function renderTickets(issues, fetched, els) {
  var { loading, emptyEl, listEl, metaEl, updEl } = els;

  var d = new Date(fetched);
  updEl.textContent = d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
    + ' at ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  metaEl.hidden  = false;
  loading.hidden = true;

  if (issues.length === 0) {
    emptyEl.hidden = false;
    return;
  }

  issues.forEach(function (issue) {
    listEl.appendChild(buildCard(issue));
  });

  listEl.hidden = false;
}

function buildCard(issue) {
  var card = document.createElement('a');
  card.className = 'ticket-card';
  card.href      = issue.html_url;
  card.target    = '_blank';
  card.rel       = 'noopener';

  var title = document.createElement('div');
  title.className   = 'ticket-card__title';
  title.textContent = issue.title;

  var labels = document.createElement('div');
  labels.className = 'ticket-card__labels';

  (issue.labels || []).forEach(function (label) {
    var colours = LABEL_COLOURS[label.name.toLowerCase()] || {
      bg: '#1c1c1c', border: '#555', text: '#aaa',
    };
    var badge = document.createElement('span');
    badge.className   = 'ticket-label';
    badge.textContent = label.name;
    badge.style.background   = colours.bg;
    badge.style.borderColor  = colours.border;
    badge.style.color        = colours.text;
    labels.appendChild(badge);
  });

  card.appendChild(title);
  card.appendChild(labels);
  return card;
}
