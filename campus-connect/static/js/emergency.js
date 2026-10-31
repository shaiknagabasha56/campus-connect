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
   Database-backed emergency ticker and submission form
   ============================================================ */
(function () {
  const content = document.getElementById("emergency-ticker-content");
  const form = document.getElementById("emergencyForm");

  function renderTicker(emergencies) {
    if (!content) return;
    content.replaceChildren();
    const items = emergencies.length ? emergencies : [{ title: "No active emergency reports", message: "" }];
    const fragment = document.createDocumentFragment();
    items.forEach(function (emergency) {
      const item = document.createElement("span");
      item.className = "emergency-ticker-item";
      const icon = document.createElement("i");
      icon.className = "fa-solid fa-circle-exclamation";
      icon.style.marginRight = "8px";
      icon.style.color = "#dc2626";
      item.appendChild(icon);
      item.appendChild(document.createTextNode(
        [emergency.title, emergency.message].filter(Boolean).join(": ")
      ));
      const separator = document.createElement("span");
      separator.className = "emergency-ticker-sep";
      separator.textContent = " • ";
      item.appendChild(separator);
      fragment.appendChild(item);
    });
    content.appendChild(fragment);
    Array.from(content.children).forEach(function (item) {
      content.appendChild(item.cloneNode(true));
    });
  }

  function renderActiveList(emergencies) {
    const list = document.getElementById("active-emergency-list");
    if (!list) return;
    list.querySelectorAll(".database-emergency-item").forEach((item) => item.remove());
    emergencies.slice().reverse().forEach(function (emergency) {
      const li = document.createElement("li");
      li.className = "database-emergency-item";
      li.dataset.severity = emergency.priority;
      const marker = document.createElement("span");
      marker.className = "na-ann-marker";
      marker.style.background = emergency.priority === "critical" ? "#dc2626" : emergency.priority === "warning" ? "#ea580c" : "#65a30d";
      const body = document.createElement("div");
      body.className = "na-ann-body";
      const meta = document.createElement("span");
      meta.className = "na-ann-date";
      const date = emergency.created_at ? new Date(emergency.created_at) : new Date();
      meta.textContent = date.toLocaleDateString("en-GB");
      const time = document.createElement("span");
      time.className = "na-ann-time";
      time.textContent = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const category = document.createElement("span");
      category.className = "na-ann-cat";
      category.textContent = emergency.category;
      meta.append(time, category);
      const text = document.createElement("p");
      text.className = "na-ann-text";
      const title = document.createElement("strong");
      title.textContent = emergency.title;
      text.append(title, document.createTextNode(" — " + emergency.message));
      body.append(meta, text);
      li.append(marker, body);
      list.prepend(li);
    });
  }

  async function loadEmergencies() {
    try {
      const response = await fetch("/emergency/api/active", { headers: { "Accept": "application/json" } });
      const result = await response.json();
      if (response.ok && result.success) {
        renderTicker(result.emergencies || []);
        renderActiveList(result.emergencies || []);
      }
    } catch (error) {
      console.error("Could not load emergency data:", error);
    }
  }

  if (form) {
    form.addEventListener("submit", async function (event) {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const submitButton = form.querySelector('[type="submit"]');
      const originalText = submitButton.textContent;
      submitButton.disabled = true;
      submitButton.textContent = "Publishing...";
      const payload = {
        title: form.querySelector('[name="title"]').value.trim(),
        message: form.querySelector('[name="message"]').value.trim(),
        category: form.querySelector('[name="category"]').value,
        priority: form.querySelector('[name="priority"]').value,
        is_important: form.querySelector('[name="is_important"]').checked
      };
      try {
        const response = await fetch("/emergency/api", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Accept": "application/json" },
          body: JSON.stringify(payload)
        });
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.message || "Emergency could not be published.");
        alert(result.message);
        form.reset();
        if (typeof closeEmergencyForm === "function") closeEmergencyForm();
        await loadEmergencies();
        window.location.reload();
      } catch (error) {
        alert(error.message || "Something went wrong while publishing the emergency.");
      } finally {
        submitButton.disabled = false;
        submitButton.textContent = originalText;
      }
    });
  }

  loadEmergencies();
  if (content || document.getElementById("active-emergency-list")) {
    window.setInterval(loadEmergencies, 10000);
  }
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
      document.querySelectorAll('#active-emergency-list li').forEach(function (item) {
        var severity = item.getAttribute('data-severity');
        var show = (value === 'all') || (severity === value);
        item.classList.toggle('na-hide', !show);
      });

      menu.classList.add('hidden');
      toggle.classList.remove('active');
    });
  });
})();