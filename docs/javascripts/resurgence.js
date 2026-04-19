(function () {
  var VAULT_TRADER_URL = 'https://api.warframestat.us/pc/vaultTrader/';
  var CDN_BASE         = 'https://cdn.warframestat.us/img/';

  var CACHE_KEY = 'wf_resurgence_v1';

  var WEAPON_EXCLUSIONS = { 'Sagek Prime': true, 'Galariak Prime': true, 'Akbronco Prime': true };

  var FRAME_EXTRA_WEAPONS = {
    'Frost Prime':   [{ name: 'Latron Prime',        wiki: 'https://wiki.warframe.com/w/Latron_Prime' },
                      { name: 'Reaper Prime',         wiki: 'https://wiki.warframe.com/w/Reaper_Prime' }],
    'Loki Prime':    [{ name: 'Wyrm Prime',           wiki: 'https://wiki.warframe.com/w/Wyrm_Prime' }],
    'Garuda Prime':  [{ name: 'Corvas Prime',         wiki: 'https://wiki.warframe.com/w/Corvas_Prime' }],
    'Hildryn Prime': [{ name: 'Larkspur Prime',       wiki: 'https://wiki.warframe.com/w/Larkspur_Prime' }],
    'Trinity Prime': [{ name: 'Kavasa Prime Collar',  wiki: 'https://wiki.warframe.com/w/Kavasa_Prime_Collar' }],
    'Xaku Prime':    [{ name: 'Quassus Prime',        wiki: 'https://wiki.warframe.com/w/Quassus_Prime' }]
  };

  function frameWikiUrl(name) {
    var base = name.replace(/ Prime$/, '').replace(/\s+/g, '_');
    return 'https://wiki.warframe.com/w/' + base + '/Prime';
  }

  function weaponWikiUrl(name) {
    return 'https://wiki.warframe.com/w/' + name.split(' ').map(encodeURIComponent).join('_');
  }

  function introDate(item) {
    return (item.introduced && item.introduced.date) || '';
  }

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

  function showEndedNotice(el) {
    el.innerHTML = '';
    var notice = document.createElement('div');
    notice.className = 'resurgence-ended';
    notice.textContent = 'The current Prime Resurgence has ended! Please wait a minute and refresh the page.';
    el.appendChild(notice);
  }

  function readCache() {
    try {
      var c = JSON.parse(localStorage.getItem(CACHE_KEY));
      if (c && c.expiry && c.frameNames) return c;
    } catch (e) {}
    return null;
  }

  function writeCache(expiry, frameNames) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ expiry: expiry, frameNames: frameNames }));
    } catch (e) {}
  }

  function clearCache() {
    try { localStorage.removeItem(CACHE_KEY); } catch (e) {}
  }

  function scheduleEndedNotice(el, expiry) {
    var msLeft = new Date(expiry) - Date.now();
    if (msLeft <= 0 || msLeft > 2147483647) return; // 2^31-1 ms is setTimeout's max safe delay (~24.8 days)
    setTimeout(function () { showEndedNotice(el); }, msLeft);
  }

  function render(el, primes, expiry) {
    var wrap = document.createElement('div');
    wrap.className = 'resurgence-wrap';

    // Expiry line
    var expiryEl = document.createElement('p');
    expiryEl.className = 'resurgence-expiry';

    var dateSpan = document.createElement('span');
    dateSpan.className = 'resurgence-expiry__date';
    dateSpan.textContent = formatDate(expiry);

    var timeSpan = document.createElement('span');
    timeSpan.className = 'resurgence-expiry__time';
    timeSpan.textContent = formatTime(expiry);

    var countdownSpan = document.createElement('span');
    countdownSpan.className = 'resurgence-expiry__days';

    function updateCountdown() {
      var msLeft = new Date(expiry) - Date.now();
      if (msLeft <= 0) { clearInterval(ticker); return; }
      var days  = Math.floor(msLeft / (1000 * 60 * 60 * 24));
      var hours = Math.floor((msLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      countdownSpan.textContent =
        days + ' day' + (days === 1 ? '' : 's') + ' ' +
        hours + ' hour' + (hours === 1 ? '' : 's') + ' remaining';
    }

    updateCountdown();
    var ticker = setInterval(updateCountdown, 60000);

    expiryEl.appendChild(document.createTextNode('Available until '));
    expiryEl.appendChild(dateSpan);
    expiryEl.appendChild(document.createTextNode(' at '));
    expiryEl.appendChild(timeSpan);
    expiryEl.appendChild(document.createTextNode(' \u2013 '));
    expiryEl.appendChild(countdownSpan);
    wrap.appendChild(expiryEl);

    // Card grid
    var grid = document.createElement('div');
    grid.className = 'prime-grid';

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

    // Center 2 cards in the 4-column grid with invisible spacers
    if (primes.length === 2) {
      var spacerBefore = document.createElement('div');
      spacerBefore.className = 'resurgence-spacer';
      grid.insertBefore(spacerBefore, grid.firstChild);
      var spacerAfter = document.createElement('div');
      spacerAfter.className = 'resurgence-spacer';
      grid.appendChild(spacerAfter);
    }

    wrap.appendChild(grid);
    el.appendChild(wrap);
  }

  function proceed(el, frameNames, expiry) {
    if (new Date() >= new Date(expiry)) {
      showEndedNotice(el);
      return;
    }

    window.WFItems.load(function (err, wfData) {
      if (err || !wfData) {
        el.textContent = 'Could not load prime data.';
        return;
      }

      // Guard: rotation may have expired while WFItems was loading
      if (new Date() >= new Date(expiry)) {
        showEndedNotice(el);
        return;
      }

      scheduleEndedNotice(el, expiry);

      var frameLookup = {};
      wfData.frames.forEach(function (f) { frameLookup[f.name] = f; });

      var primes = frameNames.map(function (name) {
        var frame = frameLookup[name];
        if (!frame) return null;
        return {
          name:    frame.name,
          image:   CDN_BASE + (frame.imageName || ''),
          wiki:    frameWikiUrl(frame.name),
          weapons: buildWeaponList(frame, wfData.weapons)
        };
      }).filter(Boolean);

      el.innerHTML = '';
      render(el, primes, expiry);
    });
  }

  function init() {
    var el = document.getElementById('resurgence-frames');
    if (!el) return;

    el.textContent = 'Loading...';

    // Warm: valid cache exists and rotation has not expired
    var cached = readCache();
    if (cached && new Date() < new Date(cached.expiry)) {
      proceed(el, cached.frameNames, cached.expiry);
      return;
    }

    // Cold or stale: clear any old entry and fetch fresh
    clearCache();

    fetch(VAULT_TRADER_URL)
      .then(function (r) { return r.json(); })
      .then(function (data) {
        var frameNames = (data.inventory || [])
          .filter(function (item) {
            return item.uniqueName.indexOf('/Powersuits/') !== -1 &&
                   item.uniqueName.indexOf('/Packages/')   === -1;
          })
          .map(function (item) { return item.item; });

        if (!frameNames.length) {
          el.textContent = 'No frames found in current resurgence.';
          return;
        }

        if (new Date() >= new Date(data.expiry)) {
          showEndedNotice(el);
          return;
        }

        writeCache(data.expiry, frameNames);
        proceed(el, frameNames, data.expiry);
      })
      .catch(function () {
        el.textContent = 'Could not load resurgence data.';
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
