function initPrimeRotation() {
  var grid = document.getElementById('prime-grid');
  if (!grid) return;

  var dataUrl = new URL('data/primes.json', document.baseURI).href;
  fetch(dataUrl)
    .then(function (r) { return r.json(); })
    .then(function (data) {
      var sorted = data.slice().sort(function (a, b) {
        return new Date(b.added) - new Date(a.added);
      });
      var current = sorted.slice(0, 7);

      current.forEach(function (frame, i) {
        var isNewest = i === 0;
        var isOldest = i === current.length - 1;

        var card = document.createElement('div');
        card.className = 'prime-card';

        var badge = '';
        if (isNewest) {
          badge = '<span class="prime-badge prime-badge--new">Newest</span>';
        } else if (isOldest) {
          badge = '<span class="prime-badge prime-badge--cycle">Next to Cycle</span>';
        }

        card.innerHTML =
          badge +
          '<div class="prime-card__img-wrap">' +
            '<img src="/images/primes/' + frame.image + '" alt="' + frame.name + '" loading="lazy">' +
          '</div>' +
          '<div class="prime-card__name">' + frame.name + '</div>';

        grid.appendChild(card);
      });
    })
    .catch(function (err) {
      console.warn('Prime rotation: could not load primes.json', err);
    });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPrimeRotation);
} else {
  initPrimeRotation();
}
