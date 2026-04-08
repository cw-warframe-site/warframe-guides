document.addEventListener('DOMContentLoaded', function () {
  var scale = 1;
  var STEP = 0.15;
  var MIN = 1;
  var MAX = 4;

  document.addEventListener('wheel', function (e) {
    var slide = document.querySelector('.gslide-media img');
    if (!slide) return;

    e.preventDefault();
    scale = Math.min(MAX, Math.max(MIN, scale + (e.deltaY < 0 ? STEP : -STEP)));
    slide.style.transform = 'scale(' + scale + ')';
    slide.style.transition = 'transform 0.1s ease';
    slide.style.cursor = scale > 1 ? 'grab' : 'default';
  }, { passive: false });

  // Reset zoom when lightbox closes
  document.addEventListener('click', function (e) {
    if (e.target.classList.contains('gclose') || e.target.closest('.gclose') ||
        e.target.classList.contains('goverlay')) {
      scale = 1;
    }
  });
});
