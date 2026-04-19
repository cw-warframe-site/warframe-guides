(function () {
  var CDN_BASE = 'https://cdn.warframestat.us/img/';

  // Hardcoded from WFCD warframe-items/data/json/Sentinels.json
  // CDN: https://cdn.warframestat.us/img/${imageName}
  var SENTINEL_IMAGES = {
    'Carrier':  'carrier-f4e5806f6e.png',
    'Dethcube': 'dethcube-c0fb93fb8c.png',
    'Diriga':   'diriga-b51a3dc56d.png',
    'Djinn':    'djinn-95bb8b0ef8.png',
    'Helios':   'helios-8cacabc9a2.png',
    'Nautilus': 'nautilus-b1bfae3524.png',
    'Oxylus':   'oxylus-9cb847b2e4.png',
    'Shade':    'shade-fae1390837.png',
    'Taxon':    'taxon-99ef68d98a.png',
    'Wyrm':     'wyrm-7593567ef4.png'
  };

  function init() {
    document.querySelectorAll('figure[data-sentinel]').forEach(function (fig) {
      var name = fig.getAttribute('data-sentinel');
      var imageName = SENTINEL_IMAGES[name];
      if (!imageName) return;

      var img = document.createElement('img');
      img.src = CDN_BASE + imageName;
      img.alt = name;
      fig.appendChild(img);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
