/* Campus Connect – mobile navigation
 * On phones the CSS hides the top-bar links (.na-nav-simple a / nav.main-nav /
 * .nav-right > a) and there was no other way to reach them. This script builds
 * a hamburger button + dropdown from those SAME links, so nothing has to be
 * maintained twice and every page gets a working menu.
 */
(function () {
  'use strict';

  function init() {
    // Landing page already ships its own menu.
    if (document.getElementById('navLinks') || document.querySelector('.mobile-menu-btn')) return;

    var host = null;      // element the dropdown is attached to (must be positioned)
    var links = [];       // the <a> elements to copy into the menu
    var btnParent = null; // where the hamburger button goes

    // 1) Homepage + inner pages: <header class="topbar|na-topbar"> ... <nav>
    var header = document.querySelector('header.na-topbar, header.topbar');
    if (header) {
      var nav = header.querySelector('nav.na-nav-simple, nav.main-nav');
      if (nav) {
        host = header;
        links = nav.querySelectorAll('a');
        btnParent = header.querySelector('.na-right-group') ||
                    header.querySelector('.top-actions') ||
                    header.querySelector('.container') || header;
      }
    }

    // 2) Complaint portal: <nav class="navbar"> ... <div class="nav-right"><a>..</a>
    if (!host) {
      var bar = document.querySelector('nav.navbar');
      var right = bar && bar.querySelector('.nav-right');
      if (right) {
        host = bar;
        links = right.querySelectorAll(':scope > a');
        btnParent = right;
      }
    }

    if (!host || !links.length || !btnParent) return;

    // dropdown is positioned against the bar
    if (window.getComputedStyle(host).position === 'static') host.style.position = 'relative';

    // build the button
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'mobile-menu-btn';
    btn.setAttribute('aria-label', 'Open menu');
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-controls', 'mobile-menu-panel');
    btn.innerHTML = '<span></span><span></span><span></span>';

    // build the panel from copies of the existing links
    var panel = document.createElement('div');
    panel.id = 'mobile-menu-panel';
    panel.className = 'mobile-menu-panel';
    Array.prototype.forEach.call(links, function (a) {
      var copy = a.cloneNode(true);
      copy.removeAttribute('id');
      panel.appendChild(copy);
    });

    // Admins: the homepage "Admin" pill is hidden on phones (no room), so offer it in the menu instead
    var adminLink = host.querySelector('a.admin-panel-btn');
    if (adminLink) {
      var adminCopy = document.createElement('a');
      adminCopy.href = adminLink.getAttribute('href');
      adminCopy.textContent = 'Admin dashboard';
      panel.appendChild(adminCopy);
    }

    btnParent.appendChild(btn);
    host.appendChild(panel);

    function setOpen(open) {
      panel.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    }

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      setOpen(!panel.classList.contains('open'));
    });
    panel.addEventListener('click', function (e) {
      if (e.target.closest('a')) setOpen(false);
    });
    document.addEventListener('click', function (e) {
      if (!panel.contains(e.target) && e.target !== btn) setOpen(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setOpen(false);
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 900) setOpen(false);
    });
  }

  // On phones the search box collapses to an icon (see mobile.css);
  // tapping the icon must focus the input so the keyboard opens.
  function initSearchTap() {
    var boxes = document.querySelectorAll('.search-wrap, .na-search-wrap');
    Array.prototype.forEach.call(boxes, function (box) {
      box.addEventListener('click', function () {
        var input = box.querySelector('input');
        if (input && window.innerWidth <= 600) input.focus();
      });
    });
  }

  function boot() { init(); initSearchTap(); }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
