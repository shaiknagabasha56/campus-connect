// clubs.js
// Behaviour for the clubs hub page: card fade-in, search filter,
// and the shared calendar dropdown.

document.addEventListener('DOMContentLoaded', function () {

  // ---- Fade-in for cards (respects reduced motion) ----
  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!prefersReducedMotion) {
    var items = document.querySelectorAll('.na-tagcard');
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

  // ---- Filter department cards by search input ----
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
