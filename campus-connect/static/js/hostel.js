document.addEventListener("DOMContentLoaded", () => {
  const $ = (s, p = document) => p.querySelector(s);
  const $$ = (s, p = document) => [...p.querySelectorAll(s)];

  // Search
  const search = $("#na-search-input");
  if (search) {
    search.addEventListener("input", () => {
      const q = search.value.trim().toLowerCase();
      $$(".na-update-item").forEach(item => {
        item.classList.toggle("na-hide", !item.innerText.toLowerCase().includes(q));
      });
    });
  }

  // Update filter
  const toggle = $("[data-filter-toggle]");
  const menu = $(".na-filter-menu");
  if (toggle && menu) {
    toggle.addEventListener("click", e => {
      e.stopPropagation();
      menu.classList.toggle("hidden");
      toggle.classList.toggle("active");
    });

    document.addEventListener("click", e => {
      if (!menu.contains(e.target) && e.target !== toggle) {
        menu.classList.add("hidden");
        toggle.classList.remove("active");
      }
    });

    $$(".na-filter-option").forEach(btn => {
      btn.addEventListener("click", () => {
        $$(".na-filter-option").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        const value = btn.dataset.filter;
        $$(".na-update-item").forEach(item => {
          item.classList.toggle("na-hide", value !== "all" && item.dataset.status !== value);
        });
        menu.classList.add("hidden");
        toggle.classList.remove("active");
      });
    });
  }

  // Calendar
  const calBtn = $("#calendar-toggle");
  const cal = $("#calendar-panel");
  if (calBtn && cal) {
    const days = $("#calendar-days");
    const monthYear = $("#month-year");
    const events = $("#events");
    let date = new Date();

    function render(d) {
      const y = d.getFullYear(), m = d.getMonth();
      const names = ["January","February","March","April","May","June","July","August","September","October","November","December"];
      monthYear.textContent = `${names[m]} ${y}`;
      days.innerHTML = "";
      const first = new Date(y, m, 1).getDay();
      const last = new Date(y, m + 1, 0).getDate();
      for (let i = 0; i < first; i++) days.appendChild(document.createElement("div"));
      for (let n = 1; n <= last; n++) {
        const el = document.createElement("div");
        el.className = "day";
        el.textContent = n;
        const now = new Date();
        if (n === now.getDate() && m === now.getMonth() && y === now.getFullYear()) el.classList.add("today");
        el.onclick = () => events.textContent = `Events for ${n} ${names[m]} ${y}: None`;
        days.appendChild(el);
      }
    }

    calBtn.addEventListener("click", e => {
      e.stopPropagation();
      cal.classList.toggle("hidden");
    });
    document.addEventListener("click", e => {
      if (!cal.contains(e.target) && e.target !== calBtn) cal.classList.add("hidden");
    });
    $("#prev-month").onclick = () => { date.setMonth(date.getMonth() - 1); render(date); };
    $("#next-month").onclick = () => { date.setMonth(date.getMonth() + 1); render(date); };
    render(date);
    $("#add-event-btn").onclick = () => {
      const input = $("#event-input");
      if (input.value.trim()) {
        events.textContent = input.value.trim();
        input.value = "";
      }
    };
  }

  // ------------------------------------------------------------------
  // UPDATE DETAIL MODAL
  // Uses event delegation so every hardcoded update remains clickable.
  // ------------------------------------------------------------------
  const updateModal = $("#update-modal");
  const updateImg = $("#modal-update-image");
  const titleEl = $("#modal-update-title-secondary");
  const bodyEl = $("#modal-update-body");
  const categoryEl = $("#modal-update-category");
  const uploaderEl = $("#modal-update-uploader");
  const dateEl = $("#modal-update-date");
  const deadlineEl = $("#modal-update-deadline");
  const emailEl = $("#modal-update-email");
  const applyBtn = $("#modal-apply-btn");

  function setApplyState(item) {
    if (!applyBtn) return;
    const state = (item.dataset.apply || "").toLowerCase();
    const link = item.dataset.applyLink || "#";

    applyBtn.onclick = null;
    applyBtn.disabled = false;
    applyBtn.classList.remove("disabled");

    if (state === "true") {
      applyBtn.style.display = "block";
      applyBtn.textContent = "Apply Now";
      applyBtn.onclick = () => {
        if (link && link !== "#") window.open(link, "_blank", "noopener,noreferrer");
      };
    } else if (state === "false") {
      applyBtn.style.display = "block";
      applyBtn.disabled = true;
      applyBtn.classList.add("disabled");
      applyBtn.textContent = "Applications Closed";
    } else {
      applyBtn.style.display = "none";
    }
  }

  function openUpdate(item) {
    if (!updateModal || !item) return;

    if (titleEl) titleEl.textContent = item.dataset.title || "Update";
    if (categoryEl) {
      categoryEl.textContent = item.dataset.category || "Update";
      categoryEl.style.background = item.dataset.categoryColor || "var(--cat)";
    }
    if (uploaderEl) uploaderEl.textContent = item.dataset.uploadedBy || "Hostel In-charge";
    if (dateEl) dateEl.textContent = `${item.dataset.date || ""}${item.dataset.time ? " · " + item.dataset.time : ""}`;
    if (deadlineEl) deadlineEl.textContent = item.dataset.deadline || "No deadline";

    if (emailEl) {
      const email = item.dataset.email || "";
      emailEl.textContent = email || "Not provided";
      emailEl.href = email ? `mailto:${email}` : "#";
    }

    if (bodyEl) {
      bodyEl.textContent = item.dataset.full || item.dataset.body || "No additional details available.";
    }

    const image = item.dataset.image || "";
    if (updateImg) {
      if (image) {
        updateImg.src = image;
        updateImg.style.display = "block";
      } else {
        updateImg.removeAttribute("src");
        updateImg.style.display = "none";
      }
    }

    setApplyState(item);

    // Always start at the top when another update is opened.
    const body = $("#modal-update-detail-content");
    if (body) body.scrollTop = 0;

    updateModal.classList.remove("hidden");
    document.body.classList.add("modal-open");
  }

  // Delegation is intentional: it also works for future hardcoded/dynamically inserted updates.
  const updateFeed = $(".na-updates-feed");
  if (updateFeed) {
    updateFeed.addEventListener("click", e => {
      const item = e.target.closest(".na-update-item");
      if (item && updateFeed.contains(item)) openUpdate(item);
    });

    updateFeed.addEventListener("keydown", e => {
      const item = e.target.closest(".na-update-item");
      if (!item || !updateFeed.contains(item)) return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openUpdate(item);
      }
    });
  }

  // Modal close: X, outside click, and Escape.
  function closeModal(modal) {
    if (!modal) return;
    modal.classList.add("hidden");
    document.body.classList.remove("modal-open");
  }

  $$(".modal-close").forEach(btn => {
    btn.addEventListener("click", () => closeModal(btn.closest(".modal-backdrop")));
  });

  $$(".modal-backdrop").forEach(modal => {
    modal.addEventListener("click", e => {
      if (e.target === modal) closeModal(modal);
    });
  });

  document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
      $$(".modal-backdrop:not(.hidden)").forEach(closeModal);
    }
  });

  // Complaint
  const complaint = $("#complaint-modal");
  const complaintBtn = $("#complaint-btn");
  if (complaintBtn && complaint) {
    complaintBtn.onclick = () => {
      complaint.classList.remove("hidden");
      document.body.classList.add("modal-open");
    };
  }

  // Demo form success behaviour
  $$(".demo-form").forEach(form => {
    form.addEventListener("submit", e => {
      e.preventDefault();
      const error = $(".form-error", form);
      const success = $(".form-success", form);
      if (error) error.style.display = "none";
      if (success) {
        success.style.display = "block";
        success.textContent = "Submitted successfully. This demo form is ready to connect to your backend.";
      }
      setTimeout(() => {
        form.reset();
        closeModal(form.closest(".modal-backdrop"));
        if (success) success.style.display = "none";
      }, 1300);
    });
  });

  // HOD profile modal
  const hodBtn = $("#hod-profile-btn");
  const hodModal = $("#hod-modal");
  if (hodBtn && hodModal) {
    hodBtn.onclick = () => {
      hodModal.classList.remove("hidden");
      document.body.classList.add("modal-open");
    };
  }
});
