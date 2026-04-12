(function () {
  var CACHE_KEY_RESURGENCE = 'wf_resurgence';
  var CACHE_KEY_ITEMS      = 'wf_items_v1';
  var ITEMS_TTL            = 24 * 60 * 60 * 1000; // 24 hours
  var GRACE_MS             = 7 * 24 * 60 * 60 * 1000;
  var CDN_BASE             = 'https://cdn.warframestat.us/img/';
  var WFCD_BASE            = 'https://raw.githubusercontent.com/WFCD/warframe-items/master/data/json/';

  var WEAPON_EXCLUSIONS = { 'Sagek Prime': true, 'Galariak Prime': true };

  var FRAME_EXTRA_WEAPONS = {
    'Trinity Prime': [{ name: 'Kavasa Prime Collar', wiki: 'https://wiki.warframe.com/w/Kavasa_Prime_Collar' }],
    'Xaku Prime':    [{ name: 'Quassus Prime',        wiki: 'https://wiki.warframe.com/w/Quassus_Prime' }]
  };

  // ── Wiki URL helpers ────────────────────────────────────────────────────────
  function frameWikiUrl(name) {
    var base = name.replace(/ Prime$/, '').replace(/\s+/g, '_');
    return 'https://wiki.warframe.com/w/' + base + '/Prime';
  }

  function weaponWikiUrl(name) {
    return 'https://wiki.warframe.com/w/' + name.split(' ').map(encodeURIComponent).join('_');
  }

  // ── WFCD field accessor ─────────────────────────────────────────────────────
  function introDate(item) {
    return (item.introduced && item.introduced.date) || '';
  }

  // ── Shared item cache (also used by prime-list.js) ──────────────────────────
  function loadItems(cb) {
    var cached = null;
    try { cached = JSON.parse(localStorage.getItem(CACHE_KEY_ITEMS)); } catch (e) {}
    if (cached && (Date.now() - cached.fetched) < ITEMS_TTL) {
      return cb(null, cached);
    }

    var cats    = ['Warframes', 'Primary', 'Secondary', 'Melee', 'Archwing', 'Sentinels'];
    var results = new Array(cats.length);
    var left    = cats.length;
    var errored = false;

    cats.forEach(function (cat, i) {
      fetch(WFCD_BASE + cat + '.json')
        .then(function (r) { return r.json(); })
        .then(function (data) {
          results[i] = data;
          if (--left === 0) finish();
        })
        .catch(function (e) {
          if (!errored) { errored = true; cb(e, null); }
        });
    });

    function finish() {
      var frames  = results[0].filter(function (f) { return f.isPrime; });
      var weapons = [];
      results.slice(1).forEach(function (arr) {
        arr.forEach(function (w) {
          if (w.name && w.name.endsWith(' Prime')) weapons.push(w);
        });
      });
      var payload = { frames: frames, weapons: weapons, fetched: Date.now() };
      try { localStorage.setItem(CACHE_KEY_ITEMS, JSON.stringify(payload)); } catch (e) {}
      cb(null, payload);
    }
  }

  // ── Weapon list for a frame ─────────────────────────────────────────────────
  function buildWeaponList(frame, weapons) {
    var date = introDate(frame);
    var list = [];
    if (date) {
      weapons.forEach(function (w) {
        if (introDate(w) === date && !WEAPON_EXCLUSIONS[w.name]) {
          list.push({ name: w.name, wiki: weaponWikiUrl(w.name) });
        }
      });
    }
    var extras = FRAME_EXTRA_WEAPONS[frame.name] || [];
    extras.forEach(function (e) { list.push(e); });
    return list;
  }

  // ── Entry point ─────────────────────────────────────────────────────────────
  function init() {
    var el = document.getElementById('resurgence-frames');
    if (!el) return;

    // ── Check resurgence localStorage cache ─────────
    var cached = null;
    try { cached = JSON.parse(localStorage.getItem(CACHE_KEY_RESURGENCE)); } catch (e) {}

    if (cached && new Date() < new Date(cached.expires)) {
      loadItemsAndRender(el, cached.data);
      return;
    }

    // ── Fetch fresh resurgence data ──────────────────
    fetch('https://gist.githubusercontent.com/cw-warframe-site/af2366dd0b29a878fb03a7f62f0411c9/raw/resurgence.json')
      .then(function (r) { return r.json(); })
      .then(function (data) {
        var now      = new Date();
        var expiry   = new Date(data.expires);
        var graceEnd = new Date(expiry.getTime() + GRACE_MS);

        if (now > graceEnd) {
          renderUpdating(el);
          return;
        }

        try {
          localStorage.setItem(CACHE_KEY_RESURGENCE, JSON.stringify({ data: data, expires: data.expires }));
        } catch (e) {}

        loadItemsAndRender(el, data);
      });
  }

  // ── Cross-reference resurgence frame names against WFCD data ────────────────
  function loadItemsAndRender(el, resurgence) {
    loadItems(function (err, data) {
      if (err || !data) {
        el.textContent = 'Could not load prime data. Please try again later.';
        return;
      }

      var lookup = {};
      data.frames.forEach(function (f) { lookup[f.name] = f; });

      var matched = resurgence.frames
        .map(function (name) {
          var frame = lookup[name];
          if (!frame) return null;
          return {
            name:    frame.name,
            image:   CDN_BASE + (frame.imageName || ''),
            wiki:    frameWikiUrl(frame.name),
            weapons: buildWeaponList(frame, data.weapons)
          };
        })
        .filter(Boolean);

      render(el, matched, resurgence.expires);
    });
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────
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

  // ── Card renderer ───────────────────────────────────────────────────────────
  function render(el, primes, expires) {
    var wrap = document.createElement('div');
    wrap.className = 'resurgence-wrap';

    // ── Expiry line ─────────────────────────────────
    var days   = daysRemaining(expires);
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
      img.src = p.image;
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

      var nameWrap = document.createElement('div');
      nameWrap.className = 'prime-card__back-name-wrap';

      var backName = document.createElement('a');
      backName.href = p.wiki;
      backName.target = '_blank';
      backName.rel = 'noopener';
      backName.className = 'prime-card__back-name';
      backName.textContent = p.name;
      backName.addEventListener('click', function (e) { e.stopPropagation(); });
      nameWrap.appendChild(backName);
      back.appendChild(nameWrap);

      var sep = document.createElement('div');
      sep.className = 'prime-card__back-sep';
      back.appendChild(sep);

      var weaponList = document.createElement('ul');
      weaponList.className = 'prime-card__weapon-list';
      p.weapons.forEach(function (w) {
        var li = document.createElement('li');
        var a  = document.createElement('a');
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
