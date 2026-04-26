(function () {
  // ── Config ──────────────────────────────────────────────────────────────────
  // To switch to a Gist, replace this URL with the raw Gist URL.
  var DATA_URL  = 'https://gist.githubusercontent.com/cw-warframe-guides/ff3820fa284854fad3406b13903cb455/raw/rivendata.min.json';
  var CACHE_KEY = 'wf_rivendata_v1';
  var CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

  // ── Cache helpers ────────────────────────────────────────────────────────────
  function cacheGet() {
    try {
      var raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      var entry = JSON.parse(raw);
      if (Date.now() - entry.ts > CACHE_TTL) { localStorage.removeItem(CACHE_KEY); return null; }
      return entry.data;
    } catch (e) { return null; }
  }

  function cacheSet(data) {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data: data })); }
    catch (e) { /* storage full — silently skip */ }
  }

  // ── Data loading ─────────────────────────────────────────────────────────────
  function loadData(cb) {
    var cached = cacheGet();
    if (cached) { cb(null, cached); return; }

    fetch(DATA_URL)
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (data) {
        cacheSet(data);
        cb(null, data);
      })
      .catch(function (err) { cb(err); });
  }

  // ── Search index ─────────────────────────────────────────────────────────────
  // Returns array of weapon objects sorted by name for O(n) prefix scan.
  function buildIndex(weapons) {
    return weapons.slice().sort(function (a, b) {
      return a.name.localeCompare(b.name);
    });
  }

  function search(index, query) {
    var q = query.trim().toLowerCase();
    if (!q) return [];
    var results = [];
    for (var i = 0; i < index.length; i++) {
      if (index[i].name.toLowerCase().indexOf(q) !== -1) {
        results.push(index[i]);
        if (results.length >= 8) break;
      }
    }
    return results;
  }

  // ── Stat name resolver ───────────────────────────────────────────────────────
  function statName(code, abbrev) {
    return abbrev[code] || code;
  }

  // ── Card rendering ───────────────────────────────────────────────────────────
  function renderComboCard(template, abbrev, index, total) {
    var card = document.createElement('div');
    card.className = 'riven-combo-card';

    // Header
    var header = document.createElement('div');
    header.className = 'riven-combo-card__header';
    var title = document.createElement('span');
    title.className = 'riven-combo-card__title';
    title.textContent = total > 1 ? 'Option ' + (index + 1) : 'Recommended Option';
    header.appendChild(title);
    card.appendChild(header);

    // Positives
    var posSection = document.createElement('div');
    posSection.className = 'riven-combo-card__section';

    var posLabel = document.createElement('div');
    posLabel.className = 'riven-combo-card__label';
    posLabel.textContent = 'Positives';
    posSection.appendChild(posLabel);

    template.positives.forEach(function (slot) {
      var row = document.createElement('div');
      row.className = 'riven-combo-card__stat-row';

      if (slot.length === 1) {
        var pill = document.createElement('span');
        pill.className = 'riven-stat-pill riven-stat-pill--choice';
        pill.textContent = statName(slot[0], abbrev);
        row.appendChild(pill);
      } else {
        // Choice slot — all options are good, pick one
        var choiceWrap = document.createElement('span');
        choiceWrap.className = 'riven-stat-choice';
        slot.forEach(function (code, i) {
          var pill = document.createElement('span');
          pill.className = 'riven-stat-pill riven-stat-pill--choice';
          pill.textContent = statName(code, abbrev);
          choiceWrap.appendChild(pill);
          if (i < slot.length - 1) {
            var sep = document.createElement('span');
            sep.className = 'riven-stat-sep';
            sep.textContent = '/';
            choiceWrap.appendChild(sep);
          }
        });
        row.appendChild(choiceWrap);
      }

      posSection.appendChild(row);
    });
    card.appendChild(posSection);

    // Negatives
    if (template.negatives && template.negatives.length) {
      var negSection = document.createElement('div');
      negSection.className = 'riven-combo-card__section';

      var negLabel = document.createElement('div');
      negLabel.className = 'riven-combo-card__label';
      negLabel.textContent = 'Acceptable Negatives';
      negSection.appendChild(negLabel);

      var negRow = document.createElement('div');
      negRow.className = 'riven-combo-card__stat-row';

      template.negatives.forEach(function (code) {
        var pill = document.createElement('span');
        pill.className = 'riven-stat-pill riven-stat-pill--negative';
        pill.textContent = statName(code, abbrev);
        negRow.appendChild(pill);
      });

      negSection.appendChild(negRow);
      card.appendChild(negSection);
    }

    // Notes
    if (template.notes) {
      var noteSection = document.createElement('div');
      noteSection.className = 'riven-combo-card__note';

      var noteIcon = document.createElement('span');
      noteIcon.className = 'riven-combo-card__note-icon';
      noteIcon.setAttribute('aria-hidden', 'true');
      noteIcon.textContent = 'ℹ';
      noteSection.appendChild(noteIcon);

      var noteText = document.createElement('span');
      noteText.textContent = template.notes;
      noteSection.appendChild(noteText);

      card.appendChild(noteSection);
    }

    return card;
  }

  // Build id→template map once after load
  function buildTemplateMap(templates) {
    var map = {};
    templates.forEach(function (t) { map[t.id] = t; });
    return map;
  }

  function renderWeapon(weapon, data, templateMap, resultsEl) {
    resultsEl.innerHTML = '';

    var heading = document.createElement('div');
    heading.className = 'riven-results__heading';

    var name = document.createElement('span');
    name.className = 'riven-results__weapon-name';
    name.textContent = weapon.name;
    heading.appendChild(name);

    var type = document.createElement('span');
    type.className = 'riven-results__weapon-type';
    type.textContent = weapon.type;
    heading.appendChild(type);

    var count = document.createElement('span');
    count.className = 'riven-results__option-count';
    count.textContent = weapon.combos.length + ' option' + (weapon.combos.length !== 1 ? 's' : '');
    heading.appendChild(count);

    resultsEl.appendChild(heading);

    var grid = document.createElement('div');
    grid.className = 'riven-combo-grid';

    weapon.combos.forEach(function (templateId, i) {
      var template = templateMap[templateId];
      if (!template) return;
      grid.appendChild(renderComboCard(template, data.meta.abbrev, i, weapon.combos.length));
    });

    resultsEl.appendChild(grid);
  }

  // ── Dropdown ──────────────────────────────────────────────────────────────────
  function renderDropdown(matches, dropdown, onSelect) {
    dropdown.innerHTML = '';
    if (!matches.length) { dropdown.hidden = true; return; }

    matches.forEach(function (weapon) {
      var li = document.createElement('li');
      li.className = 'riven-dropdown__item';
      li.textContent = weapon.name;
      li.addEventListener('mousedown', function (e) {
        e.preventDefault(); // prevent input blur before click fires
        onSelect(weapon);
      });
      dropdown.appendChild(li);
    });

    dropdown.hidden = false;
  }

  // ── Init ──────────────────────────────────────────────────────────────────────
  function init() {
    var tool = document.getElementById('riven-stats-tool');
    if (!tool) return;

    var input    = document.getElementById('riven-search');
    var dropdown = document.getElementById('riven-dropdown');
    var results  = document.getElementById('riven-results');

    // Show loading state
    input.disabled = true;
    input.placeholder = 'Loading data…';

    loadData(function (err, data) {
      if (err || !data || !data.weapons) {
        input.placeholder = 'Failed to load data — please refresh.';
        return;
      }

      var index = buildIndex(data.weapons);
      var templateMap = buildTemplateMap(data.templates);
      input.disabled = false;
      input.placeholder = 'Search for a weapon…';

      function selectWeapon(weapon) {
        input.value = weapon.name;
        dropdown.hidden = true;
        renderWeapon(weapon, data, templateMap, results);
        tool.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }

      input.addEventListener('input', function () {
        var matches = search(index, input.value);
        renderDropdown(matches, dropdown, selectWeapon);
      });

      input.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') { dropdown.hidden = true; return; }
        if (e.key === 'Enter') {
          var first = dropdown.querySelector('.riven-dropdown__item');
          if (first) first.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
          return;
        }
        if (e.key === 'ArrowDown') {
          var items = dropdown.querySelectorAll('.riven-dropdown__item');
          if (items.length) { e.preventDefault(); items[0].focus(); }
        }
      });

      // Keyboard navigation within dropdown
      dropdown.addEventListener('keydown', function (e) {
        var items = Array.prototype.slice.call(dropdown.querySelectorAll('.riven-dropdown__item'));
        var idx   = items.indexOf(document.activeElement);
        if (e.key === 'ArrowDown') { e.preventDefault(); if (idx < items.length - 1) items[idx + 1].focus(); }
        if (e.key === 'ArrowUp')   { e.preventDefault(); if (idx > 0) items[idx - 1].focus(); else input.focus(); }
        if (e.key === 'Enter' && idx !== -1) { items[idx].dispatchEvent(new MouseEvent('mousedown', { bubbles: true })); }
        if (e.key === 'Escape') { dropdown.hidden = true; input.focus(); }
      });

      // Make dropdown items focusable for keyboard nav
      dropdown.addEventListener('DOMNodeInserted', function () {
        dropdown.querySelectorAll('.riven-dropdown__item').forEach(function (el) {
          el.setAttribute('tabindex', '0');
        });
      });

      // Close dropdown when clicking outside
      document.addEventListener('click', function (e) {
        if (!tool.contains(e.target)) dropdown.hidden = true;
      });

      input.addEventListener('focus', function () {
        if (input.value.trim()) {
          var matches = search(index, input.value);
          renderDropdown(matches, dropdown, selectWeapon);
        }
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
