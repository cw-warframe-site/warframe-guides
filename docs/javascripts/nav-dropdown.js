document.addEventListener('DOMContentLoaded', function () {
  // Flatten "More" in the drawer: pull its children up and remove the section
  document.querySelectorAll('.md-nav--primary .md-nav__item--nested').forEach(function (item) {
    var parentList = item.parentElement;
    var childItems = item.querySelectorAll(':scope > .md-nav .md-nav__item');
    childItems.forEach(function (child) {
      var clone = child.cloneNode(true);
      parentList.insertBefore(clone, item.nextSibling);
    });
    item.remove();
  });


  document.querySelectorAll('[data-md-dropdown]').forEach(function (dropdown) {
    var trigger = dropdown.querySelector('.md-header-nav__dropdown-trigger');
    var menu = dropdown.querySelector('.md-header-nav__dropdown-menu');
    var hideTimer = null;

    function show() {
      clearTimeout(hideTimer);
      menu.classList.add('is-open');
      dropdown.classList.add('is-open');
      trigger.setAttribute('aria-expanded', 'true');
    }

    function hide() {
      hideTimer = setTimeout(function () {
        menu.classList.remove('is-open');
        dropdown.classList.remove('is-open');
        trigger.setAttribute('aria-expanded', 'false');
      }, 300);
    }

    dropdown.addEventListener('mouseenter', show);
    dropdown.addEventListener('mouseleave', hide);

    trigger.addEventListener('focus', show);
    dropdown.addEventListener('focusout', function (e) {
      if (!dropdown.contains(e.relatedTarget)) {
        hide();
      }
    });

    // Click toggles the dropdown but does not navigate
    trigger.addEventListener('click', function (e) {
      e.preventDefault();
      if (menu.classList.contains('is-open')) {
        clearTimeout(hideTimer);
        menu.classList.remove('is-open');
        dropdown.classList.remove('is-open');
        trigger.setAttribute('aria-expanded', 'false');
      } else {
        show();
      }
    });
  });
});
