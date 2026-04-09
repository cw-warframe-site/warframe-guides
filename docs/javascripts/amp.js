(function () {
  var ROW_LABEL_W = 52;

  function updatePadding(wrap) {
    if (window.innerWidth > 630) return;
    var sl = wrap.scrollLeft;
    var wrapLeft = wrap.getBoundingClientRect().left;

    wrap.querySelectorAll('.faction-header').forEach(function (th) {
      var label = th.querySelector('.faction-label');
      var textW = label ? label.offsetWidth : 70;
      var cellLeft = th.getBoundingClientRect().left - wrapLeft + sl;
      var cellW    = th.offsetWidth;
      var overlap = Math.max(0, ROW_LABEL_W - (cellLeft - sl));
      var visibleWidth = cellW - overlap;
      var centeredLeft = overlap + (visibleWidth - textW) / 2;
      var maxPad = cellW - textW - 4;
      var paddingLeft = Math.min(Math.max(0, Math.round(centeredLeft)), maxPad);
      th.style.textAlign = 'left';
      th.style.paddingLeft = paddingLeft + 'px';
    });
  }

  function resetPadding() {
    document.querySelectorAll('.faction-header').forEach(function (th) {
      th.style.paddingLeft = '';
      th.style.textAlign   = '';
    });
  }

  function init() {
    var wrap = document.querySelector('.amp-scroll-wrap');
    if (!wrap) return;

    wrap.addEventListener('scroll', function () {
      updatePadding(wrap);
    }, { passive: true });

    window.addEventListener('resize', function () {
      if (window.innerWidth <= 630) updatePadding(wrap);
      else resetPadding();
    });

    updatePadding(wrap);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
