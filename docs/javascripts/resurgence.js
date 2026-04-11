(function () {
  var CACHE_KEY = 'wf_resurgence';
  var GRACE_MS = 7 * 24 * 60 * 60 * 1000;

  function init() {
    var el = document.getElementById('resurgence-frames');
    if (!el) return;

    var siteRoot = new URL(window.__mkdocsBase || '/', window.location.href).href.replace(/\/?$/, '/');

    // ── Check localStorage cache ─────────────────────
    var cached = null;
    try { cached = JSON.parse(localStorage.getItem(CACHE_KEY)); } catch (e) {}

    if (cached && new Date() < new Date(cached.expires)) {
      loadPrimesAndRender(el, cached.data, siteRoot);
      return;
    }

    // ── Fetch fresh resurgence data ──────────────────
    fetch('https://gist.githubusercontent.com/cw-warframe-site/af2366dd0b29a878fb03a7f62f0411c9/raw/resurgence.json')
      .then(function (r) { return r.json(); })
      .then(function (data) {
        var now = new Date();
        var expiry = new Date(data.expires);
        var graceEnd = new Date(expiry.getTime() + GRACE_MS);

        if (now > graceEnd) {
          renderUpdating(el);
          return;
        }

        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify({ data: data, expires: data.expires }));
        } catch (e) {}

        loadPrimesAndRender(el, data, siteRoot);
      });
  }

  function loadPrimesAndRender(el, resurgence, siteRoot) {
    fetch(siteRoot + 'data/primes.json')
      .then(function (r) { return r.json(); })
      .then(function (primes) {
        var lookup = {};
        primes.forEach(function (p) { lookup[p.name] = p; });

        var matched = resurgence.frames
          .map(function (name) { return lookup[name] || null; })
          .filter(Boolean);

        render(el, matched, resurgence.expires, siteRoot);
      });
  }

  function renderUpdating(el) {
    var notice = document.createElement('div');
    notice.className = 'resurgence-updating';
    notice.textContent = 'Resurgence data is currently being updated, check back soon.';
    el.appendChild(notice);
  }

  function daysRemaining(expiresStr) {
    var diff = new Date(expiresStr) - new Date();
    if (diff <= 0) return 0;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  function formatDate(expiresStr) {
    return new Date(expiresStr).toLocaleDateString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric'
    });
  }

  function formatTime(expiresStr) {
    return new Date(expiresStr).toLocaleTimeString('en-US', {
      hour: 'numeric', minute: '2-digit', timeZoneName: 'short'
    });
  }

  function render(el, primes, expires, siteRoot) {
    var wrap = document.createElement('div');
    wrap.className = 'resurgence-wrap';

    // ── Expiry line ─────────────────────────────────
    var days = daysRemaining(expires);
    var expiry = document.createElement('p');
    expiry.className = 'resurgence-expiry';

    if (days > 0) {
      expiry.innerHTML =
        'Available until <span class="resurgence-expiry__date">' + formatDate(expires) + '</span>' +
        ' at <span class="resurgence-expiry__time">' + formatTime(expires) + '</span>' +
        ' - <span class="resurgence-expiry__days">' + days + ' day' + (days === 1 ? '' : 's') + ' remaining</span>';
    } else {
      expiry.innerHTML = '<span class="resurgence-expiry__days">This Resurgence has ended.</span>';
    }
    wrap.appendChild(expiry);

    // ── Card grid ───────────────────────────────────
    var grid = document.createElement('div');
    grid.className = 'resurgence-grid';

    primes.forEach(function (p) {
      var cardWrap = document.createElement('div');
      cardWrap.className = 'prime-card-wrap';

      var card = document.createElement('div');
      card.className = 'prime-card';

      // Front
      var front = document.createElement('div');
      front.className = 'prime-card__front';

      var dogEar = document.createElement('span');
      dogEar.className = 'prime-card__dog-ear';
      dogEar.setAttribute('aria-hidden', 'true');
      front.appendChild(dogEar);

      var imgWrap = document.createElement('div');
      imgWrap.className = 'prime-card__img-wrap';

      var img = document.createElement('img');
      img.className = 'prime-card__img';
      img.src = siteRoot + 'images/primes/' + p.image;
      img.alt = p.name;
      imgWrap.appendChild(img);

      var badge = document.createElement('span');
      badge.className = 'prime-card__badge prime-card__badge--resurgence';
      badge.textContent = 'Resurgence';
      imgWrap.appendChild(badge);

      var frontName = document.createElement('div');
      frontName.className = 'prime-card__name';
      frontName.textContent = p.name;

      front.appendChild(imgWrap);
      front.appendChild(frontName);

      // Back
      var back = document.createElement('div');
      back.className = 'prime-card__back';

      var backName = document.createElement('a');
      backName.href = p.wiki;
      backName.target = '_blank';
      backName.rel = 'noopener';
      backName.className = 'prime-card__back-name';
      backName.textContent = p.name;
      backName.addEventListener('click', function (e) { e.stopPropagation(); });
      back.appendChild(backName);

      var sep = document.createElement('div');
      sep.className = 'prime-card__back-sep';
      back.appendChild(sep);

      var weaponList = document.createElement('ul');
      weaponList.className = 'prime-card__weapon-list';
      p.weapons.forEach(function (w) {
        var li = document.createElement('li');
        var a = document.createElement('a');
        a.href = w.wiki;
        a.target = '_blank';
        a.rel = 'noopener';
        a.className = 'prime-card__weapon-link';
        a.textContent = w.name;
        a.addEventListener('click', function (e) { e.stopPropagation(); });
        li.appendChild(a);
        weaponList.appendChild(li);
      });
      back.appendChild(weaponList);

      // Assemble
      card.appendChild(front);
      card.appendChild(back);

      card.addEventListener('click', function (e) {
        if (e.target.closest('a')) return;
        card.classList.toggle('is-flipped');
      });

      cardWrap.appendChild(card);
      grid.appendChild(cardWrap);
    });

    wrap.appendChild(grid);
    el.appendChild(wrap);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
