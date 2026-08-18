// non-academic.js
// Shared behaviour for the non-academic hub + all category pages.

document.addEventListener('DOMContentLoaded', function () {

  // ---- Simple fade-in for update items / cards (nice-to-have, respects reduced motion) ----
  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!prefersReducedMotion) {
    var items = document.querySelectorAll('.na-update-item, .na-tagcard, .na-card');
    items.forEach(function (el, i) {
      el.style.opacity = '0';
      el.style.transform = 'translateY(6px)';
      el.style.transition = 'opacity .35s ease, transform .35s ease';
      setTimeout(function () {
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
      }, 40 * i);
    });
  }

  // ---- Hub page: filter category cards by search input ----
  var searchInput = document.getElementById('na-search-input');
  var catCards = document.querySelectorAll('.na-cat-grid .na-tagcard');
  if (searchInput && catCards.length) {
    searchInput.addEventListener('input', function () {
      var q = searchInput.value.trim().toLowerCase();
      catCards.forEach(function (card) {
        var text = card.innerText.toLowerCase();
        card.style.display = text.includes(q) ? '' : 'none';
      });
    });
  }

  // ---- Category page: filter updates by All / New / Old ----
  var filterToggle = document.querySelector('[data-filter-toggle]');
  var filterMenu = document.querySelector('.na-filter-menu');
  if (filterToggle && filterMenu) {
    var filterOptions = filterMenu.querySelectorAll('.na-filter-option');
    var updateItems = document.querySelectorAll('.na-updates .na-update-item');

    filterToggle.addEventListener('click', function (e) {
      e.stopPropagation();
      filterMenu.classList.toggle('hidden');
      filterToggle.classList.toggle('active');
    });

    // close when clicking outside the menu
    document.addEventListener('click', function (e) {
      if (!filterMenu.classList.contains('hidden') &&
          !filterMenu.contains(e.target) &&
          e.target !== filterToggle) {
        filterMenu.classList.add('hidden');
        filterToggle.classList.remove('active');
      }
    });

    filterOptions.forEach(function (btn) {
      btn.addEventListener('click', function () {
        filterOptions.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');

        var value = btn.getAttribute('data-filter');
        updateItems.forEach(function (item) {
          var status = item.getAttribute('data-status');
          var show = (value === 'all') || (status === value);
          item.classList.toggle('na-hide', !show);
        });

        filterMenu.classList.add('hidden');
        filterToggle.classList.remove('active');
      });
    });
  }

  // ---- Calendar dropdown ----
  var calendarToggle = document.getElementById('calendar-toggle');
  var calendarPanel = document.getElementById('calendar-panel');
  if (calendarToggle && calendarPanel) {

    var calendarDays = document.getElementById('calendar-days');
    var monthYear = document.getElementById('month-year');
    var prevBtn = document.getElementById('prev-month');
    var nextBtn = document.getElementById('next-month');
    var eventsEl = document.getElementById('events');
    var currentDate = new Date();

    calendarToggle.addEventListener('click', function (e) {
      e.stopPropagation();
      calendarPanel.classList.toggle('hidden');
    });

    // close when clicking outside the panel
    document.addEventListener('click', function (e) {
      if (!calendarPanel.classList.contains('hidden') &&
          !calendarPanel.contains(e.target) &&
          e.target !== calendarToggle) {
        calendarPanel.classList.add('hidden');
      }
    });

    function renderCalendar(date) {
      var year = date.getFullYear();
      var month = date.getMonth();
      var monthNames = ["January","February","March","April","May","June",
        "July","August","September","October","November","December"];
      monthYear.textContent = monthNames[month] + " " + year;

      calendarDays.innerHTML = "";

      var firstDay = new Date(year, month, 1).getDay();
      var lastDate = new Date(year, month + 1, 0).getDate();

      for (var i = 0; i < firstDay; i++) {
        calendarDays.appendChild(document.createElement('div'));
      }

      for (var d = 1; d <= lastDate; d++) {
        var day = document.createElement('div');
        day.textContent = d;
        day.classList.add('day');

        if (d === new Date().getDate() &&
            month === new Date().getMonth() &&
            year === new Date().getFullYear()) {
          day.classList.add('today');
        }

        (function (dNum) {
          day.addEventListener('click', function () {
            eventsEl.textContent = "Events for " + dNum + " " + monthNames[month] + " " + year + ": None";
          });
        })(d);

        calendarDays.appendChild(day);
      }
    }

    prevBtn.addEventListener('click', function () {
      currentDate.setMonth(currentDate.getMonth() - 1);
      renderCalendar(currentDate);
    });
    nextBtn.addEventListener('click', function () {
      currentDate.setMonth(currentDate.getMonth() + 1);
      renderCalendar(currentDate);
    });

    renderCalendar(currentDate);
  }

});

/* ============================================================
   Emergency ticker — news-style right-to-left scroll
   ============================================================ */
(function(){
  const headlines = [
    "Fire drill scheduled tomorrow at 10:00 AM — all hostellers must evacuate within 5 minutes",
    "Ambulance bay near Block A temporarily relocated to the main gate for repairs",
    "Heavy rain alert: avoid low-lying pathways near the lake road after 6 PM",
    "Campus security helpline now active 24/7 — save the number on your phone",
    "Mock emergency evacuation for all hostels this Saturday, 7:00 AM"
    // Edit this list to update what scrolls in the ticker.
  ];

  const content = document.getElementById("emergency-ticker-content");
  if (!content) return;

  function renderItems(list) {
    return list
      .map(
        (text) =>
          `<span class="emergency-ticker-item"><i class="fa-solid fa-circle-exclamation" style="margin-right:8px;color:#dc2626;"></i>${text}<span class="emergency-ticker-sep">•</span></span>`
      )
      .join("");
  }

  // Render twice back-to-back so the CSS animation (0% -> -50%) loops seamlessly.
  content.innerHTML = renderItems(headlines) + renderItems(headlines);
})();

/* ============================================================
   Active Emergencies card — severity filter (All / Critical /
   Warning / Info). Kept separate from the generic filter block
   above so it doesn't collide with it.
   ============================================================ */
(function(){
  var toggle = document.querySelector('[data-emergency-filter-toggle]');
  var menu = document.getElementById('emergency-filter-menu');
  if (!toggle || !menu) return;

  var options = menu.querySelectorAll('.na-filter-option');
  var items = document.querySelectorAll('#active-emergency-list li');

  toggle.addEventListener('click', function (e) {
    e.stopPropagation();
    menu.classList.toggle('hidden');
    toggle.classList.toggle('active');
  });

  document.addEventListener('click', function (e) {
    if (!menu.classList.contains('hidden') &&
        !menu.contains(e.target) &&
        e.target !== toggle) {
      menu.classList.add('hidden');
      toggle.classList.remove('active');
    }
  });

  options.forEach(function (btn) {
    btn.addEventListener('click', function () {
      options.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');

      var value = btn.getAttribute('data-emergency-filter');
      items.forEach(function (item) {
        var severity = item.getAttribute('data-severity');
        var show = (value === 'all') || (severity === value);
        item.classList.toggle('na-hide', !show);
      });

      menu.classList.add('hidden');
      toggle.classList.remove('active');
    });
  });
})();
