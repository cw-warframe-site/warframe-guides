(function () {
  function init() {
    var el = document.getElementById('recent-primes');
    if (!el) return;

    var siteRoot = new URL(window.__mkdocsBase || '/', window.location.href).href.replace(/\/?$/, '/');
    var dataUrl = siteRoot + 'data/primes.json';

    fetch(dataUrl)
      .then(function (r) { return r.json(); })
      .then(function (data) {
        var sorted = data
          .slice()
          .sort(function (a, b) { return b.added.localeCompare(a.added); })
          .slice(0, 7);
        render(el, sorted, siteRoot);
      });
  }

  function render(el, primes, siteRoot) {
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
      img.src = siteRoot + 'images/primes/' + p.image;
      img.alt = p.name;
      imgWrap.appendChild(img);

      if (i === 0) {
        var badge = document.createElement('span');
        badge.className = 'prime-card__badge';
        badge.textContent = 'Newest';
        imgWrap.appendChild(badge);
      } else if (i === primes.length - 1) {
        var badge = document.createElement('span');
        badge.className = 'prime-card__badge prime-card__badge--cycle';
        badge.textContent = 'Vaulted Next';
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
