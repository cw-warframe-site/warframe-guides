(function () {
  var CDN_BASE  = 'https://cdn.warframestat.us/img/';
  var WFCD_BASE = 'https://raw.githubusercontent.com/WFCD/warframe-items/master/data/json/';
  var CACHE_KEY = 'wf_items_v1';
  var CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

  // Weapons that share a prime access date but were NOT prime access drops
  var WEAPON_EXCLUSIONS = { 'Sagek Prime': true, 'Galariak Prime': true };

  // Per-frame hardcoded additions for items WFCD can't match by date
  var FRAME_EXTRA_WEAPONS = {
    'Trinity Prime': [{ name: 'Kavasa Prime Collar', wiki: 'https://wiki.warframe.com/w/Kavasa_Prime_Collar' }],
    'Xaku Prime':    [{ name: 'Quassus Prime',        wiki: 'https://wiki.warframe.com/w/Quassus_Prime' }]
  };

  // ── Wiki URL helpers ────────────────────────────────────────────────────────
  // "Voruna Prime"    → https://wiki.warframe.com/w/Voruna/Prime
  function frameWikiUrl(name) {
    var base = name.replace(/ Prime$/, '').replace(/\s+/g, '_');
    return 'https://wiki.warframe.com/w/' + base + '/Prime';
  }

  // "Perigale Prime"      → https://wiki.warframe.com/w/Perigale_Prime
  // "Cobra & Crane Prime" → https://wiki.warframe.com/w/Cobra_%26_Crane_Prime
  function weaponWikiUrl(name) {
    return 'https://wiki.warframe.com/w/' + name.split(' ').map(encodeURIComponent).join('_');
  }

  // ── WFCD field accessor ─────────────────────────────────────────────────────
  function introDate(item) {
    return (item.introduced && item.introduced.date) || '';
  }

  // ── Shared item cache (also used by resurgence.js) ──────────────────────────
  function loadItems(cb) {
    var cached = null;
    try { cached = JSON.parse(localStorage.getItem(CACHE_KEY)); } catch (e) {}
    if (cached && (Date.now() - cached.fetched) < CACHE_TTL) {
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
      try { localStorage.setItem(CACHE_KEY, JSON.stringify(payload)); } catch (e) {}
      cb(null, payload);
    }
  }

  // ── Weapon list for a frame ─────────────────────────────────────────────────
  // Weapons are matched by release date. WEAPON_EXCLUSIONS blocks items that
  // share a date but weren't prime access drops. FRAME_EXTRA_WEAPONS handles
  // items that WFCD can't match by date (null introduced, cosmetic category, etc).
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
    var el = document.getElementById('recent-primes');
    if (!el) return;

    loadItems(function (err, data) {
      if (err || !data) {
        el.textContent = 'Could not load prime data. Please try again later.';
        return;
      }

      var sorted = data.frames
        .slice()
        .sort(function (a, b) { return introDate(b).localeCompare(introDate(a)); })
        .slice(0, 7);

      var cards = sorted.map(function (frame) {
        return {
          name:    frame.name,
          image:   CDN_BASE + (frame.imageName || ''),
          wiki:    frameWikiUrl(frame.name),
          weapons: buildWeaponList(frame, data.weapons)
        };
      });

      render(el, cards);
    });
  }

  // ── Card renderer ───────────────────────────────────────────────────────────
  function render(el, primes) {
    var grid = document.createElement('div');
    grid.className = 'prime-grid';

    primes.forEach(function (p, i) {
      var wrap = document.createElement('div');
      wrap.className = 'prime-card-wrap';

      var card = document.createElement('div');
      card.className = 'prime-card';

      // ── Front ──────────────────────────────────────
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

      var badgeText  = i === 0 ? 'Newest' : (i === primes.length - 1 ? 'Vaulted Next' : null);
      var badgeClass = i === 0 ? 'prime-card__badge' : 'prime-card__badge prime-card__badge--cycle';
      if (badgeText) {
        var badge = document.createElement('span');
        badge.className = badgeClass;
        badge.textContent = badgeText;
        imgWrap.appendChild(badge);
      }

      var frontName = document.createElement('div');
      frontName.className = 'prime-card__name';
      frontName.textContent = p.name;

      front.appendChild(imgWrap);
      front.appendChild(frontName);

      // ── Back ───────────────────────────────────────
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

      // ── Assemble & flip handler ────────────────────
      card.appendChild(front);
      card.appendChild(back);

      card.addEventListener('click', function (e) {
        if (e.target.closest('a')) return;
        card.classList.toggle('is-flipped');
      });

      wrap.appendChild(card);
      grid.appendChild(wrap);
    });

    el.appendChild(grid);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
