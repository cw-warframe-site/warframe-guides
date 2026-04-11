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
      var card = document.createElement('a');
      card.href = p.wiki;
      card.className = 'prime-card';
      card.target = '_blank';
      card.rel = 'noopener';

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
        badge.textContent = 'Next to Cycle';
        imgWrap.appendChild(badge);
      }

      var name = document.createElement('div');
      name.className = 'prime-card__name';
      name.textContent = p.name;

      card.appendChild(imgWrap);
      card.appendChild(name);
      grid.appendChild(card);
    });

    el.appendChild(grid);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
