// ============================================================
// ARTIX PAGE JAVASCRIPT
// Updates + Detail Card + Filter + Calendar + Search
// ============================================================

document.addEventListener("DOMContentLoaded", function () {

    // ============================================================
    // 1. FADE-IN ANIMATION
    // ============================================================

    const prefersReducedMotion =
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!prefersReducedMotion) {

        const items = document.querySelectorAll(
            ".na-update-item, .na-tagcard, .na-card"
        );

        items.forEach(function (el, i) {

            el.style.opacity = "0";
            el.style.transform = "translateY(6px)";
            el.style.transition =
                "opacity .35s ease, transform .35s ease";

            setTimeout(function () {
                el.style.opacity = "1";
                el.style.transform = "translateY(0)";
            }, 40 * i);
        });
    }


    // ============================================================
    // 2. SEARCH CATEGORIES
    // ============================================================

    const searchInput =
        document.getElementById("na-search-input");

    const catCards =
        document.querySelectorAll(
            ".na-cat-grid .na-tagcard"
        );

    if (searchInput && catCards.length) {

        searchInput.addEventListener("input", function () {

            const query =
                searchInput.value.trim().toLowerCase();

            catCards.forEach(function (card) {

                const text =
                    card.innerText.toLowerCase();

                card.style.display =
                    text.includes(query) ? "" : "none";
            });
        });
    }


    // ============================================================
    // 3. UPDATE FILTER
    // ALL / NEW / OLD
    // ============================================================

    const filterToggle =
        document.querySelector("[data-filter-toggle]");

    const filterMenu =
        document.querySelector(".na-filter-menu");

    if (filterToggle && filterMenu) {

        const filterOptions =
            filterMenu.querySelectorAll(
                ".na-filter-option"
            );

        const updateItems =
            document.querySelectorAll(
                ".na-updates .na-update-item"
            );


        // Open / close filter menu
        filterToggle.addEventListener(
            "click",
            function (e) {

                e.stopPropagation();

                filterMenu.classList.toggle("hidden");

                filterToggle.classList.toggle("active");
            }
        );


        // Close filter when clicking outside
        document.addEventListener(
            "click",
            function (e) {

                if (
                    !filterMenu.classList.contains("hidden") &&
                    !filterMenu.contains(e.target) &&
                    e.target !== filterToggle
                ) {

                    filterMenu.classList.add("hidden");

                    filterToggle.classList.remove("active");
                }
            }
        );


        // Filter options
        filterOptions.forEach(function (button) {

            button.addEventListener(
                "click",
                function () {

                    filterOptions.forEach(
                        function (btn) {
                            btn.classList.remove("active");
                        }
                    );

                    button.classList.add("active");

                    const filterValue =
                        button.getAttribute(
                            "data-filter"
                        );


                    updateItems.forEach(
                        function (item) {

                            const status =
                                item.getAttribute(
                                    "data-status"
                                );

                            const shouldShow =
                                filterValue === "all" ||
                                status === filterValue;

                            item.classList.toggle(
                                "na-hide",
                                !shouldShow
                            );
                        }
                    );


                    filterMenu.classList.add("hidden");

                    filterToggle.classList.remove("active");
                }
            );
        });
    }


    // ============================================================
    // 4. CALENDAR
    // ============================================================

    const calendarToggle =
        document.getElementById("calendar-toggle");

    const calendarPanel =
        document.getElementById("calendar-panel");

    if (calendarToggle && calendarPanel) {

        const calendarDays =
            document.getElementById("calendar-days");

        const monthYear =
            document.getElementById("month-year");

        const prevBtn =
            document.getElementById("prev-month");

        const nextBtn =
            document.getElementById("next-month");

        const eventsEl =
            document.getElementById("events");

        let currentDate = new Date();


        // Open / close calendar
        calendarToggle.addEventListener(
            "click",
            function (e) {

                e.stopPropagation();

                calendarPanel.classList.toggle("hidden");
            }
        );


        // Close calendar when clicking outside
        document.addEventListener(
            "click",
            function (e) {

                if (
                    !calendarPanel.classList.contains("hidden") &&
                    !calendarPanel.contains(e.target) &&
                    e.target !== calendarToggle
                ) {

                    calendarPanel.classList.add("hidden");
                }
            }
        );


        // Render calendar
        function renderCalendar(date) {

            const year =
                date.getFullYear();

            const month =
                date.getMonth();

            const monthNames = [
                "January",
                "February",
                "March",
                "April",
                "May",
                "June",
                "July",
                "August",
                "September",
                "October",
                "November",
                "December"
            ];


            monthYear.textContent =
                monthNames[month] + " " + year;

            calendarDays.innerHTML = "";


            const firstDay =
                new Date(
                    year,
                    month,
                    1
                ).getDay();

            const lastDate =
                new Date(
                    year,
                    month + 1,
                    0
                ).getDate();


            // Empty spaces before first day
            for (
                let i = 0;
                i < firstDay;
                i++
            ) {

                calendarDays.appendChild(
                    document.createElement("div")
                );
            }


            // Calendar dates
            for (
                let d = 1;
                d <= lastDate;
                d++
            ) {

                const day =
                    document.createElement("div");

                day.textContent = d;

                day.classList.add("day");


                const today =
                    new Date();


                if (
                    d === today.getDate() &&
                    month === today.getMonth() &&
                    year === today.getFullYear()
                ) {

                    day.classList.add("today");
                }


                day.addEventListener(
                    "click",
                    function () {

                        eventsEl.textContent =
                            "Events for " +
                            d +
                            " " +
                            monthNames[month] +
                            " " +
                            year +
                            ": None";
                    }
                );


                calendarDays.appendChild(day);
            }
        }


        // Previous month
        if (prevBtn) {

            prevBtn.addEventListener(
                "click",
                function () {

                    currentDate.setMonth(
                        currentDate.getMonth() - 1
                    );

                    renderCalendar(currentDate);
                }
            );
        }


        // Next month
        if (nextBtn) {

            nextBtn.addEventListener(
                "click",
                function () {

                    currentDate.setMonth(
                        currentDate.getMonth() + 1
                    );

                    renderCalendar(currentDate);
                }
            );
        }


        renderCalendar(currentDate);
    }


    // ============================================================
    // 5. UPDATE DETAIL CARD
    // ============================================================

    const updateItems =
        document.querySelectorAll(
            ".na-updates .na-update-item"
        );


    // ------------------------------------------------------------
    // Create the detail card dynamically
    // ------------------------------------------------------------

    function createUpdateDetailCard() {

        // The AWS Cloud Club HTML already contains the modal markup.
        // Reuse it and make sure its close handlers are attached.
        const existingOverlay =
            document.getElementById("updateModalOverlay");

        if (existingOverlay) {
            setupModalCloseEvents();
            return;
        }


        const overlay =
            document.createElement("div");

        overlay.className =
            "update-modal-overlay";

        overlay.id =
            "updateModalOverlay";


        overlay.innerHTML = `

            <div
                class="update-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="updateModalTitle"
            >

                <button
                    type="button"
                    class="update-modal-close"
                    id="updateModalClose"
                    aria-label="Close"
                >
                    &times;
                </button>


                <!-- IMAGE -->

                <div
                    class="update-modal-image-wrap"
                    id="updateModalImageWrap"
                >

                    <img
                        id="updateModalImage"
                        src=""
                        alt=""
                    >

                </div>


                <!-- BODY -->

                <div class="update-modal-body">


                    <!-- CATEGORY TAG -->

                    <span
                        class="update-modal-tag"
                        id="updateModalCategory"
                    ></span>


                    <!-- TITLE -->

                    <h2
                        id="updateModalTitle"
                    ></h2>


                    <!-- META INFORMATION -->

                    <div class="update-modal-meta">


                        <!-- UPLOADED PERSON -->

                        <div
                            class="update-modal-meta-row"
                        >

                            <i
                                class="fa-solid fa-user"
                            ></i>

                            <span
                                id="updateModalUploader"
                            ></span>

                        </div>


                        <!-- UPLOAD DATE -->

                        <div
                            class="update-modal-meta-row"
                        >

                            <i
                                class="fa-regular fa-calendar"
                            ></i>

                            <span
                                id="updateModalDate"
                            ></span>

                        </div>


                        <!-- DEADLINE -->

                        <div
                            class="update-modal-meta-row update-modal-deadline"
                            id="updateModalDeadlineRow"
                        >

                            <i
                                class="fa-solid fa-hourglass-half"
                            ></i>

                            <span
                                id="updateModalDeadline"
                            ></span>

                        </div>

                    </div>


                    <!-- DESCRIPTION -->

                    <p
                        class="update-modal-desc"
                        id="updateModalDesc"
                    ></p>


                    <!-- CONTACT -->

                    <div
                        class="update-modal-contact"
                        id="updateModalContactRow"
                    >

                        <span>
                            Have a query?
                        </span>

                        <a
                            id="updateModalEmail"
                            href="#"
                        >

                            <i
                                class="fa-solid fa-envelope"
                            ></i>

                            <span
                                id="updateModalEmailText"
                            ></span>

                        </a>

                    </div>


                    <!-- APPLY BUTTON -->

                    <button
                        type="button"
                        class="update-modal-apply"
                        id="updateModalApply"
                    ></button>

                </div>

            </div>
        `;


        document.body.appendChild(overlay);


        // Setup close events
        setupModalCloseEvents();
    }


    // Create modal
    createUpdateDetailCard();


    // ============================================================
    // 6. OPEN UPDATE DETAIL
    // ============================================================

    function openUpdateDetail(update) {

        const overlay =
            document.getElementById(
                "updateModalOverlay"
            );

        const imageWrap =
            document.getElementById(
                "updateModalImageWrap"
            );

        const imageEl =
            document.getElementById(
                "updateModalImage"
            );

        const categoryEl =
            document.getElementById(
                "updateModalCategory"
            );

        const titleEl =
            document.getElementById(
                "updateModalTitle"
            );

        const uploaderEl =
            document.getElementById(
                "updateModalUploader"
            );

        const dateEl =
            document.getElementById(
                "updateModalDate"
            );

        const deadlineRow =
            document.getElementById(
                "updateModalDeadlineRow"
            );

        const deadlineEl =
            document.getElementById(
                "updateModalDeadline"
            );

        const descEl =
            document.getElementById(
                "updateModalDesc"
            );

        const contactRow =
            document.getElementById(
                "updateModalContactRow"
            );

        const emailLink =
            document.getElementById(
                "updateModalEmail"
            );

        const emailText =
            document.getElementById(
                "updateModalEmailText"
            );

        const applyBtn =
            document.getElementById(
                "updateModalApply"
            );


        if (!overlay) {
            return;
        }


        // ========================================================
        // READ DATA FROM UPDATE
        // ========================================================

        const data = {

            title:
                update.dataset.title || "",

            image:
                update.dataset.image || "",

            uploadDate:
                update.dataset.uploadDate || "",

            uploadTime:
                update.dataset.uploadTime || "",

            uploadedBy:
                update.dataset.uploadedBy || "",

            deadline:
                update.dataset.deadline || "",

            category:
                update.dataset.category || "",

            categoryColor:
                update.dataset.categoryColor || "",

            description:
                update.dataset.description || "",

            email:
                update.dataset.email || "",

            apply:
                update.dataset.apply,

            applyLink:
                update.dataset.applyLink || ""
        };


        // ========================================================
        // TITLE
        // ========================================================

        titleEl.textContent =
            data.title ||
            "Untitled Update";


        // ========================================================
        // CATEGORY
        // ========================================================

        if (data.category) {

            categoryEl.textContent =
                data.category;

            categoryEl.style.background =
                data.categoryColor ||
                "var(--accent)";

            categoryEl.style.display =
                "inline-block";

        } else {

            categoryEl.style.display =
                "none";
        }


        // ========================================================
        // IMAGE
        // ========================================================

        if (data.image) {

            imageEl.src =
                data.image;

            imageEl.alt =
                data.title ||
                "Update image";

            imageWrap.style.display =
                "block";

            imageEl.onerror = function () {
                imageWrap.style.display = "none";
            };

        } else {

            imageEl.src = "";

            imageWrap.style.display =
                "none";
        }


        // ========================================================
        // UPLOADED PERSON
        // ========================================================

        uploaderEl.textContent =
            data.uploadedBy ||
            "—";


        // ========================================================
        // UPLOAD DATE + TIME
        // ========================================================

        const dateParts = [];

        if (data.uploadDate) {

            dateParts.push(
                data.uploadDate
            );
        }

        if (data.uploadTime) {

            dateParts.push(
                data.uploadTime
            );
        }


        dateEl.textContent =
            dateParts.length
                ? dateParts.join(" · ")
                : "—";


        // ========================================================
        // DEADLINE
        // ========================================================

        if (data.deadline) {

            deadlineEl.textContent =
                "Deadline: " +
                data.deadline;

            deadlineRow.classList.remove(
                "hidden"
            );

        } else {

            deadlineRow.classList.add(
                "hidden"
            );
        }


        // ========================================================
        // DESCRIPTION
        // ========================================================

        descEl.textContent =
            data.description ||
            "";


        // ========================================================
        // CONTACT EMAIL
        // ========================================================

        if (data.email) {

            emailLink.href =
                "mailto:" +
                data.email;

            emailText.textContent =
                data.email;

            contactRow.classList.remove(
                "hidden"
            );

        } else {

            contactRow.classList.add(
                "hidden"
            );
        }


        // ========================================================
        // APPLY BUTTON
        // ========================================================

        /*
            data-apply="true"
                -> Apply Now
                -> Enabled

            data-apply="false"
                -> Applications Closed
                -> Disabled

            No data-apply
                -> Hide button
        */


        if (data.apply === "true") {

            applyBtn.textContent =
                "Apply Now";

            applyBtn.className =
                "update-modal-apply enabled";

            applyBtn.disabled =
                false;


            applyBtn.onclick =
                function () {

                    if (data.applyLink) {

                        window.open(
                            data.applyLink,
                            "_blank",
                            "noopener"
                        );

                    } else {

                        console.warn(
                            "No application link provided."
                        );
                    }
                };


        } else if (data.apply === "false") {

            applyBtn.textContent =
                "Applications Closed";

            applyBtn.className =
                "update-modal-apply disabled";

            applyBtn.disabled =
                true;

            applyBtn.onclick =
                null;


        } else {

            applyBtn.textContent = "";

            applyBtn.className =
                "update-modal-apply hidden";

            applyBtn.disabled =
                true;

            applyBtn.onclick =
                null;
        }


        // ========================================================
        // SHOW MODAL
        // ========================================================

        overlay.classList.add("show");
        overlay.setAttribute("aria-hidden", "false");

        document.body.style.overflow =
            "hidden";
    }


    // ============================================================
    // 7. MAKE EVERY UPDATE CLICKABLE
    // ============================================================

    updateItems.forEach(function (update) {

        update.style.cursor =
            "pointer";


        update.addEventListener(
            "click",
            function () {

                openUpdateDetail(update);
            }
        );

    });


    // Dynamically created admin updates are not part of the initial updateItems NodeList.
    // Register them through a custom event so newly saved updates get the exact same preview card.
    document.addEventListener("cse:update-created", function (event) {
        const update = event.detail;
        if (!update || update.dataset.detailPreviewBound === "true") return;
        update.dataset.detailPreviewBound = "true";
        update.style.cursor = "pointer";
        update.addEventListener("click", function (event) {
            if (event.target.closest(".admin-update-pencil")) return;
            openUpdateDetail(update);
        });
    });

    // ============================================================
    // 8. CLOSE UPDATE DETAIL
    // ============================================================

    function closeUpdateDetail() {

        const overlay =
            document.getElementById(
                "updateModalOverlay"
            );

        if (!overlay) {
            return;
        }


        overlay.classList.remove("show");
        overlay.setAttribute("aria-hidden", "true");

        // Restore page scrolling
        document.body.style.overflow =
            "";
    }


    // ============================================================
    // 9. CLOSE BUTTON + OUTSIDE CLICK + ESC
    // ============================================================

    function setupModalCloseEvents() {

        const overlay =
            document.getElementById("updateModalOverlay");

        const closeButton =
            document.getElementById("updateModalClose");


        if (!overlay) {
            return;
        }


        // Prevent duplicate event handlers.
        if (overlay.dataset.closeHandlersReady === "true") {
            return;
        }

        overlay.dataset.closeHandlersReady = "true";


        // ========================================================
        // X BUTTON
        // ========================================================

        if (closeButton) {

            closeButton.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();
                    event.stopPropagation();

                    closeUpdateDetail();
                }
            );
        }


        // ========================================================
        // CLICK OUTSIDE THE WHITE CARD
        // ========================================================

        overlay.addEventListener(
            "click",
            function (event) {

                // The overlay itself is the dark area outside
                // the white detail card.
                if (event.target === overlay) {
                    closeUpdateDetail();
                }
            }
        );


        // ========================================================
        // ESCAPE KEY
        // ========================================================

        document.addEventListener(
            "keydown",
            function (event) {

                if (
                    event.key === "Escape" &&
                    overlay.classList.contains("show")
                ) {

                    event.preventDefault();
                    closeUpdateDetail();
                }
            }
        );
    }

});

/* ============================================================
   FINAL ADDITION — Join Club + Complaint forms
   ============================================================ */
(function(){
  function setupActionForm(triggerId, overlayId, formId, successId, successText){
    const trigger=document.getElementById(triggerId);
    const overlay=document.getElementById(overlayId);
    const form=document.getElementById(formId);
    const success=document.getElementById(successId);
    if(!trigger || !overlay || !form) return;

    const close=()=>{
      overlay.classList.remove('show');
      overlay.setAttribute('aria-hidden','true');
      document.body.style.overflow='';
    };

    const open=()=>{
      overlay.classList.add('show');
      overlay.setAttribute('aria-hidden','false');
      document.body.style.overflow='hidden';
      const first=overlay.querySelector('input,select,textarea');
      if(first) setTimeout(()=>first.focus(),80);
    };

    trigger.addEventListener('click', open);

    overlay.addEventListener('click', function(e){
      if(e.target===overlay || e.target.closest('[data-close-form="'+overlayId+'"]')) close();
    });

    form.addEventListener('submit', function(e){
      e.preventDefault();
      if(!form.checkValidity()){
        form.reportValidity();
        return;
      }
      success.textContent=successText;
      form.reset();
      setTimeout(()=>{ close(); success.textContent=''; },1800);
    });

    document.addEventListener('keydown', function(e){
      if(e.key==='Escape' && overlay.classList.contains('show')) close();
    });
  }

  setupActionForm(
    'openJoinForm',
    'joinFormOverlay',
    'joinClubForm',
    'joinFormSuccess',
    'Application submitted successfully. Your club coordinator can review it.'
  );

  setupActionForm(
    'openComplaintForm',
    'complaintFormOverlay',
    'complaintForm',
    'complaintFormSuccess',
    'Complaint submitted successfully. It has been recorded for review.'
  );
})();

document.addEventListener("DOMContentLoaded", function () {
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));
  const modal = $("#adminModal");
  const body = $("#adminModalBody");
  const title = $("#adminModalTitle");
  const kicker = $("#adminKicker");
  let confirmAction = null;

  function openModal(k, t) {
    kicker.textContent = k;
    title.textContent = t;
    modal.classList.remove("hidden");
  }

  function closeModal() {
    modal.classList.add("hidden");
    body.innerHTML = "";
  }

  function bindClose() {
    $$("[data-admin-close]").forEach((b) => b.onclick = closeModal);
  }

  function toast(message) {
    const t = $("#adminToast");
    t.textContent = message;
    t.classList.add("show");
    setTimeout(() => t.classList.remove("show"), 2200);
  }

  function ask(titleText, text, okText, danger, action) {
    $("#confirmTitle").textContent = titleText;
    $("#confirmText").textContent = text;
    const ok = $("#confirmOk");
    ok.textContent = okText || "Yes, Save";
    ok.className = danger ? "admin-danger" : "admin-primary";
    confirmAction = action;
    $("#adminConfirm").classList.remove("hidden");
  }

  $("#confirmCancel").onclick = () => {
    $("#adminConfirm").classList.add("hidden");
    confirmAction = null;
  };

  $("#confirmOk").onclick = () => {
    const action = confirmAction;
    $("#adminConfirm").classList.add("hidden");
    confirmAction = null;
    if (action) action();
  };

  bindClose();

  function field(label, id, type = "text", value = "", opts = {}) {
    if (type === "textarea") {
      return `<div class="admin-field ${opts.full ? "full" : ""}">
        <label>${label}${opts.required ? " <span>*</span>" : ""}</label>
        <textarea id="${id}" rows="5" maxlength="${opts.max || 1000}">${value || ""}</textarea>
        <div class="admin-count"><span id="${id}Count">${(value || "").length}</span>/${opts.max || 1000}</div>
      </div>`;
    }
    if (type === "select") {
      return `<div class="admin-field ${opts.full ? "full" : ""}">
        <label>${label}</label>
        <select id="${id}">${opts.options.map(o => `<option ${o === value ? "selected" : ""}>${o}</option>`).join("")}</select>
      </div>`;
    }
    return `<div class="admin-field ${opts.full ? "full" : ""}">
      <label>${label}${opts.required ? " <span>*</span>" : ""}</label>
      <input id="${id}" type="${type}" value="${value || ""}" ${opts.max ? `maxlength="${opts.max}"` : ""}>
    </div>`;
  }

  function imageField(id, label) {
    return `<div class="admin-field full admin-upload">
      <label>${label}</label>
      <div id="${id}Preview" class="admin-upload-preview">No image selected</div>
      <input id="${id}" type="file" accept=".jpg,.jpeg,.png,.webp">
      <small class="admin-help">JPG, PNG or WEBP · maximum 5 MB</small>
      <div class="admin-error"></div>
    </div>`;
  }

  function bindCount(id) {
    const el = $("#" + id), count = $("#" + id + "Count");
    if (el && count) el.oninput = () => count.textContent = el.value.length;
  }

  function bindImage(id, existing = "") {
    const input = $("#" + id);
    const preview = $("#" + id + "Preview");
    if (existing) {
      preview.style.backgroundImage = `url('${existing}')`;
      preview.textContent = "";
      preview.dataset.image = existing;
    }
    input.onchange = () => {
      const file = input.files[0];
      const error = input.parentElement.querySelector(".admin-error");
      if (!file) return;
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        error.textContent = "Use JPG, PNG or WEBP only.";
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        error.textContent = "Image must be 5 MB or smaller.";
        return;
      }
      error.textContent = "";
      const reader = new FileReader();
      reader.onload = () => {
        preview.style.backgroundImage = `url('${reader.result}')`;
        preview.textContent = "";
        preview.dataset.image = reader.result;
      };
      reader.readAsDataURL(file);
    };
  }

  function actions(label = "Save Changes", extra = "") {
    return `<div class="admin-actions">
      ${extra}
      <button class="admin-secondary" type="button" data-admin-close>Cancel</button>
      <button class="admin-primary" type="button" id="adminSave">${label}</button>
    </div>`;
  }

  function identityEditor() {
    openModal("CLUB IDENTITY", "Edit AWS Cloud Club Club");
    const name = $(".na-cat-header h1").textContent.trim();
    const desc = $(".na-cat-header p").textContent.trim();
    body.innerHTML = `<div class="admin-form-grid">
      ${imageField("clubLogo", "Club logo / image")}
      ${field("Club Name", "clubName", "text", name, {full:true,max:60,required:true})}
      ${field("Description", "clubDesc", "textarea", desc, {full:true,max:250,required:true})}
    </div>${actions()}`;
    bindCount("clubDesc");
    bindImage("clubLogo");
    bindClose();
    $("#adminSave").onclick = () => {
      if (!$("#clubName").value.trim() || !$("#clubDesc").value.trim()) return toast("Club name and description are required.");
      ask("Save club identity?", "Update the club name, description and logo?", "Yes, Save", false, () => {
        $(".na-cat-header h1").textContent = $("#clubName").value.trim();
        $(".na-cat-header p").textContent = $("#clubDesc").value.trim();
        const image = $("#clubLogoPreview").dataset.image;
        if (image) {
          const icon = $(".na-cat-icon");
          icon.style.background = `center/cover no-repeat url('${image}')`;
          icon.innerHTML = "";
        }
        closeModal(); toast("Club identity updated.");
      });
    };
  }

  function quickEditor() {
    openModal("QUICK INFO", "Edit Quick Info");
    const rows = $$(".na-info-row");
    const vals = rows.map(r => r.querySelector("div").textContent.trim());
    body.innerHTML = `<div class="admin-form-grid">
      ${field("Convener","qConvener","text",vals[0],{required:true})}
      ${field("Contact Number","qPhone","tel",vals[1],{required:true})}
      ${field("Location","qLocation","text",vals[2],{required:true})}
      ${field("Meet Days / Time","qMeet","text",vals[3],{required:true})}
    </div>${actions()}`;
    bindClose();
    $("#adminSave").onclick = () => ask("Save quick info?", "Replace the current quick information?", "Yes, Save", false, () => {
      const values = [$("#qConvener").value, $("#qPhone").value, $("#qLocation").value, $("#qMeet").value];
      rows.forEach((row, i) => {
        const d = row.querySelector("div");
        const label = d.querySelector("span, small");
        if (label) {
          const textNode = Array.from(d.childNodes).find(n => n.nodeType === 3);
          if (textNode) textNode.nodeValue = values[i];
          else d.lastChild.textContent = values[i];
        } else d.lastChild.textContent = values[i];
      });
      closeModal(); toast("Quick info updated.");
    });
  }

  function getUpdate(el) {
    return {
      title: el.dataset.title || el.querySelector(".na-update-title")?.textContent || "",
      category: el.dataset.category || "Announcement",
      postDate: el.dataset.uploadDate || "",
      postTime: el.dataset.uploadTime || "",
      eventDate: el.dataset.eventDate || "",
      deadline: el.dataset.deadline || "",
      description: el.dataset.description || el.querySelector(".na-update-body")?.textContent || "",
      email: el.dataset.email || "",
      apply: el.dataset.apply === "true",
      applyLink: el.dataset.applyLink || "",
      image: el.dataset.image || ""
    };
  }

  function updateEditor(el = null) {
    const d = el ? getUpdate(el) : {};
    openModal(el ? "EDIT UPDATE" : "CREATE UPDATE", el ? "Edit Update" : "Create New Update");
    body.innerHTML = `<div class="admin-form-grid">
      ${imageField("updateImage","Cover Image")}
      ${field("Category Tag","uCategory","select",d.category || "Announcement",{options:["Event","Activity","Hackathon","Project","Meeting","Competition","Announcement","Workshop","Other"]})}
      ${field("Title","uTitle","text",d.title || "",{full:true,max:100,required:true})}
      ${field("Post Date","uPostDate","date",d.postDate || "",{required:true})}
      ${field("Post Time","uPostTime","time",d.postTime || "")}
      ${field("Event / Activity Date","uEventDate","date",d.eventDate || "")}
      ${field("Deadline","uDeadline","date",d.deadline || "")}
      ${field("Contact Email","uEmail","email",d.email || "")}
      ${field("Description","uDescription","textarea",d.description || "",{full:true,max:1000,required:true})}
      <div class="admin-field full"><label><input id="uApply" type="checkbox" ${d.apply ? "checked" : ""}> Enable Apply / Register Button</label></div>
      ${field("Application Form URL","uApplyLink","url",d.applyLink || "",{full:true,max:500})}
    </div>${actions(el ? "Save Changes" : "Create Update", el ? '<button class="admin-danger" id="deleteUpdate" type="button">Delete Update</button>' : "")}`;
    bindCount("uDescription");
    bindImage("updateImage", d.image);
    bindClose();

    $("#adminSave").onclick = () => {
      if (!$("#uTitle").value.trim() || !$("#uDescription").value.trim() || !$("#uPostDate").value) return toast("Title, description and post date are required.");
      ask(el ? "Save update changes?" : "Create this update?", "The student-style preview on this page will be updated.", "Yes, Save", false, () => saveUpdate(el));
    };

    const del = $("#deleteUpdate");
    if (del) del.onclick = () => ask("Delete this update?", "This update will be removed from the current page preview.", "Yes, Delete", true, () => {
      el.remove(); closeModal(); toast("Update deleted.");
    });
  }

  function saveUpdate(el) {
    const data = {
      title: $("#uTitle").value.trim(),
      category: $("#uCategory").value,
      postDate: $("#uPostDate").value,
      postTime: $("#uPostTime").value || "",
      eventDate: $("#uEventDate").value,
      deadline: $("#uDeadline").value,
      description: $("#uDescription").value.trim(),
      email: $("#uEmail").value.trim(),
      apply: $("#uApply").checked,
      applyLink: $("#uApplyLink").value.trim(),
      image: $("#updateImagePreview").dataset.image || ""
    };

    let target = el;
    if (!target) {
      target = document.createElement("button");
      target.type = "button";
      target.className = "na-update-item na-update-clickable";
      target.innerHTML = `<span class="na-update-marker"></span><span class="na-update-content">
        <span class="na-update-date"></span><span class="na-update-title"></span>
        <span class="na-update-body"></span>
        <span class="na-update-click-hint"><i class="fa-solid fa-arrow-up-right-from-square"></i> Click to view details</span>
        <span class="admin-update-pencil" role="button" tabindex="0"><i class="fa-solid fa-pen"></i></span>
      </span>`;
      $(".na-updates-list").prepend(target);
    }

    target.dataset.title = data.title;
    target.dataset.category = data.category;
    target.dataset.uploadDate = data.postDate;
    target.dataset.uploadTime = data.postTime;
    target.dataset.eventDate = data.eventDate;
    target.dataset.deadline = data.deadline;
    target.dataset.description = data.description;
    target.dataset.email = data.email;
    target.dataset.apply = data.apply;
    target.dataset.applyLink = data.applyLink;
    target.dataset.image = data.image;
    target.querySelector(".na-update-date").textContent = data.postDate + (data.postTime ? " " + data.postTime : "");
    target.querySelector(".na-update-title").textContent = data.title;
    target.querySelector(".na-update-body").textContent = data.description.slice(0, 180) + (data.description.length > 180 ? "…" : "");
    bindUpdate(target);
    // Tell the student-style detail system about a newly created update.
    // This gives dynamic updates the same clickable preview as hardcoded ones.
    if (!el) {
      document.dispatchEvent(new CustomEvent("cse:update-created", { detail: target }));
    }
    closeModal(); toast("Update saved successfully.");
  }

  function bindUpdate(el) {
    const pencil = el.querySelector(".admin-update-pencil");
    if (pencil) pencil.onclick = (e) => {
      e.preventDefault(); e.stopPropagation(); updateEditor(el);
    };
  }

  function updatesManager() {
    openModal("UPDATES", "Manage Club Updates");
    const items = $$(".na-update-item");
    body.innerHTML = `<div class="admin-toolbar"><h3>${items.length} existing updates</h3><button class="admin-add" id="addUpdate">＋ Add Update</button></div>
      <div class="admin-list">${items.map((el,i) => `<div class="admin-list-item"><div><strong>${getUpdate(el).title}</strong><small>${getUpdate(el).category}</small></div><div class="admin-list-actions"><button class="admin-mini-btn" data-edit="${i}">Edit</button><button class="admin-mini-btn delete" data-delete="${i}">Delete</button></div></div>`).join("")}</div>`;
    bindClose();
    $("#addUpdate").onclick = () => updateEditor();
    $$("[data-edit]").forEach(b => b.onclick = () => updateEditor(items[Number(b.dataset.edit)]));
    $$("[data-delete]").forEach(b => b.onclick = () => {
      const el = items[Number(b.dataset.delete)];
      ask("Delete this update?", "This update will be removed.", "Yes, Delete", true, () => { el.remove(); updatesManager(); toast("Update deleted."); });
    });
  }

  function getHead(card) {
    return {
      name: card.querySelector("h3")?.textContent || "",
      designation: card.querySelector("p")?.textContent || "",
      image: card.querySelector("img")?.src || "",
      email: card.dataset.email || "",
      phone: card.dataset.phone || "",
      details: card.dataset.details || ""
    };
  }

  function headEditor(card) {
    const d = getHead(card);
    openModal("CLUB HEAD", "Edit Club Head");
    body.innerHTML = `<div class="admin-form-grid">
      ${imageField("headImage","Profile Image")}
      ${field("Name","hName","text",d.name,{full:true,max:80,required:true})}
      ${field("Designation","hDesignation","text",d.designation,{required:true})}
      ${field("Email","hEmail","email",d.email)}
      ${field("Phone","hPhone","tel",d.phone)}
      ${field("Details / Bio","hDetails","textarea",d.details,{full:true,max:500})}
    </div>${actions("Save Head",'<button class="admin-danger" id="deleteHead" type="button">Delete Head</button>')}`;
    bindCount("hDetails");
    bindImage("headImage", d.image);
    bindClose();
    $("#adminSave").onclick = () => ask("Save club head changes?", "Update this leadership profile?", "Yes, Save", false, () => {
      card.querySelector("h3").textContent = $("#hName").value.trim();
      card.querySelector("p").textContent = $("#hDesignation").value.trim();
      const img = $("#headImagePreview").dataset.image;
      if (img && card.querySelector("img")) card.querySelector("img").src = img;
      card.dataset.email = $("#hEmail").value.trim();
      card.dataset.phone = $("#hPhone").value.trim();
      card.dataset.details = $("#hDetails").value.trim();
      closeModal(); toast("Club head updated.");
    });
    $("#deleteHead").onclick = () => ask("Delete this club head?", "This leadership profile will be removed.", "Yes, Delete", true, () => {
      card.remove(); closeModal(); toast("Club head removed.");
    });
  }

  function headsManager() {
    openModal("LEADERSHIP", "Manage Club Heads");
    const cards = $$(".aws-head-card");
    body.innerHTML = `<div class="admin-toolbar"><h3>${cards.length} club heads</h3></div><div class="admin-list">${cards.map((c,i)=>`<div class="admin-list-item"><div><strong>${getHead(c).name}</strong><small>${getHead(c).designation}</small></div><div class="admin-list-actions"><button class="admin-mini-btn" data-head="${i}">Edit</button></div></div>`).join("")}</div>`;
    bindClose();
    $$("[data-head]").forEach(b => b.onclick = () => headEditor(cards[Number(b.dataset.head)]));
  }

  function joinEditor() {
    openModal("JOIN SECTION", "Edit Join Section");
    body.innerHTML = `<div class="admin-form-grid">
      ${field("Heading","jTitle","text",$("#join-club-title").textContent.trim(),{full:true,max:100,required:true})}
      ${field("Description","jDesc","textarea",$("#join-club p").textContent.trim(),{full:true,max:300,required:true})}
      ${field("Button Text","jButton","text",$("#openJoinForm").innerText.trim(),{max:30,required:true})}
      ${field("Join / Form URL","jLink","url",$("#openJoinForm").dataset.formUrl || "",{full:true,max:500})}
    </div>${actions()}`;
    bindCount("jDesc"); bindClose();
    $("#adminSave").onclick = () => ask("Save join section?", "Update the heading, description and button?", "Yes, Save", false, () => {
      $("#join-club-title").textContent = $("#jTitle").value.trim();
      $("#join-club p").textContent = $("#jDesc").value.trim();
      $("#openJoinForm").innerHTML = `<i class="fa-solid fa-user-plus"></i> ${$("#jButton").value.trim()}`;
      $("#openJoinForm").dataset.formUrl = $("#jLink").value.trim();
      closeModal(); toast("Join section updated.");
    });
  }

  function contactEditor() {
    const items = $$(".aws-contact-item");
    openModal("CONTACT", "Edit Contact Details");
    body.innerHTML = `<div class="admin-form-grid">
      ${field("Email","cEmail","email",items[0]?.querySelector("strong")?.textContent || "",{required:true})}
      ${field("Phone","cPhone","tel",items[1]?.querySelector("strong")?.textContent || "",{required:true})}
      ${field("Location","cLocation","text",items[2]?.querySelector("strong")?.textContent || "",{required:true})}
      ${field("Instagram URL","cInstagram","url",$("#contact .fa-instagram")?.closest("a")?.href || "",{full:true})}
      ${field("LinkedIn URL","cLinkedin","url",$("#contact .fa-linkedin-in")?.closest("a")?.href || "",{full:true})}
      ${field("YouTube URL","cYoutube","url",$("#contact .fa-youtube")?.closest("a")?.href || "",{full:true})}
    </div>${actions()}`;
    bindClose();
    $("#adminSave").onclick = () => ask("Save contact details?", "Update the contact information and social links?", "Yes, Save", false, () => {
      items[0].querySelector("strong").textContent = $("#cEmail").value.trim();
      items[1].querySelector("strong").textContent = $("#cPhone").value.trim();
      items[2].querySelector("strong").textContent = $("#cLocation").value.trim();
      const ig = $("#contact .fa-instagram")?.closest("a");
      const li = $("#contact .fa-linkedin-in")?.closest("a");
      const yt = $("#contact .fa-youtube")?.closest("a");
      if (ig) ig.href = $("#cInstagram").value.trim() || "#";
      if (li) li.href = $("#cLinkedin").value.trim() || "#";
      if (yt) yt.href = $("#cYoutube").value.trim() || "#";
      closeModal(); toast("Contact details updated.");
    });
  }

  const editors = {
    identity: identityEditor,
    updates: updatesManager,
    "quick-info": quickEditor,
    heads: headsManager,
    join: joinEditor,
    contact: contactEditor
  };

  $$("[data-edit-section]").forEach(button => {
    button.onclick = () => {
      const editor = editors[button.dataset.editSection];
      if (editor) editor();
    };
  });

  $$(".na-update-item").forEach(bindUpdate);
  $$(".aws-head-card").forEach(card => {
    const pencil = card.querySelector(".admin-head-pencil");
    if (pencil) pencil.onclick = (e) => { e.stopPropagation(); headEditor(card); };
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const data = {
    complaints: [
      {name:"Ravi Kumar", email:"ravi22@rgukt.ac.in", branch:"CSE", year:"3rd Year", phone:"+91 98765 10001", subject:"Workshop registration issue", category:"Club Activity", message:"I registered for the Cloud Practitioner workshop but did not receive the confirmation email.", submitted:"Today, 10:42 AM", status:"Pending"},
      {name:"Anjali Devi", email:"anjali23@rgukt.ac.in", branch:"ECE", year:"2nd Year", phone:"+91 98765 10002", subject:"Suggestion for AWS session", category:"Suggestion", message:"Please conduct more hands-on sessions on AWS IAM, VPC and cloud security.", submitted:"Yesterday, 6:15 PM", status:"Pending"},
      {name:"Kiran Reddy", email:"kiran21@rgukt.ac.in", branch:"ME", year:"3rd Year", phone:"+91 98765 10003", subject:"Event timing conflict", category:"Event", message:"The event timing clashes with our lab session. Could future events also have an evening slot?", submitted:"18 Aug, 4:20 PM", status:"Pending"}
    ],
    applications: [
      {name:"Sai Teja", email:"saiteja@rgukt.ac.in", branch:"CSE", year:"3rd Year", phone:"+91 98765 20001", event:"AWS Cloud Practitioner Workshop", registrationId:"AWS-2026-1042", skills:"Python, Linux, AWS basics", motivation:"I want to prepare for the AWS Cloud Practitioner certification.", submitted:"Today, 9:10 AM", status:"Pending"},
      {name:"Meghana", email:"meghana@rgukt.ac.in", branch:"ECE", year:"2nd Year", phone:"+91 98765 20002", event:"Cloud Hackathon 2026", registrationId:"AWS-2026-1043", skills:"Java, Web Development", motivation:"I want to build a cloud-based campus solution.", submitted:"Today, 8:55 AM", status:"Pending"},
      {name:"Harsha", email:"harsha@rgukt.ac.in", branch:"CSE", year:"1st Year", phone:"+91 98765 20003", event:"AWS Cloud Practitioner Workshop", registrationId:"AWS-2026-1044", skills:"C, Python", motivation:"Interested in starting my cloud journey.", submitted:"Yesterday, 7:40 PM", status:"Pending"},
      {name:"Divya", email:"divya@rgukt.ac.in", branch:"EEE", year:"2nd Year", phone:"+91 98765 20004", event:"Cloud Hackathon 2026", registrationId:"AWS-2026-1045", skills:"UI/UX, Figma", motivation:"I would like to contribute as a designer and learn cloud deployment.", submitted:"Yesterday, 4:30 PM", status:"Pending"}
    ],
    members: [
      {name:"Akash", email:"akash@rgukt.ac.in", branch:"CSE", year:"2nd Year", phone:"+91 98765 30001", rollNumber:"R20240101", interests:"Cloud computing, DevOps", experience:"Completed AWS Cloud Quest.", motivation:"I want to actively participate in AWS workshops and events.", submitted:"Today, 11:00 AM", status:"Pending"},
      {name:"Sowmya", email:"sowmya@rgukt.ac.in", branch:"ECE", year:"3rd Year", phone:"+91 98765 30002", rollNumber:"R20230211", interests:"Cloud security, Networking", experience:"Basic Linux and networking knowledge.", motivation:"Interested in learning cloud security.", submitted:"Today, 10:15 AM", status:"Pending"},
      {name:"Naveen", email:"naveen@rgukt.ac.in", branch:"ME", year:"1st Year", phone:"+91 98765 30003", rollNumber:"R20250121", interests:"AWS, Serverless", experience:"Beginner", motivation:"I want to learn through hands-on projects.", submitted:"Yesterday, 5:25 PM", status:"Pending"},
      {name:"Priya", email:"priya@rgukt.ac.in", branch:"CSE", year:"2nd Year", phone:"+91 98765 30004", rollNumber:"R20240205", interests:"DevOps, Docker", experience:"Built small Docker projects.", motivation:"I want to join the technical activities of the club.", submitted:"Yesterday, 3:00 PM", status:"Pending"},
      {name:"Vishal", email:"vishal@rgukt.ac.in", branch:"EEE", year:"3rd Year", phone:"+91 98765 30005", rollNumber:"R20230318", interests:"Cloud architecture", experience:"AWS Educate learner.", motivation:"Looking for a community to learn and collaborate.", submitted:"17 Aug, 7:40 PM", status:"Pending"}
    ]
  };

  const meta = {
    complaints:{title:"Complaints", desc:"Review club-related complaints and requests submitted by students.", eyebrow:"COMPLAINT MANAGEMENT"},
    applications:{title:"Applications", desc:"Review event, workshop and hackathon registrations.", eyebrow:"APPLICATION MANAGEMENT"},
    members:{title:"New Club Member Registrations", desc:"Review students who submitted the AWS Cloud Club join form.", eyebrow:"MEMBER MANAGEMENT"}
  };

  const page = document.getElementById("adminDataPage");
  const list = document.getElementById("adminDataList");
  const detail = document.getElementById("adminDataDetail");

  document.querySelectorAll("[data-admin-view]").forEach(btn => btn.addEventListener("click", () => {
    const type = btn.dataset.adminView, info = meta[type];
    document.getElementById("dataPageTitle").textContent = info.title;
    document.getElementById("dataPageDesc").textContent = info.desc;
    document.getElementById("dataPageEyebrow").textContent = info.eyebrow;

    const statusOptions = type === "complaints"
      ? ["All", "Pending", "In Progress", "Resolved", "Rejected"]
      : type === "applications"
      ? ["All", "Pending", "Accepted", "Rejected"]
      : ["All", "Pending", "Accepted", "Rejected"];

    list.innerHTML = `
      <div class="admin-filter-card">
        <div class="admin-filter-title">
          <div><i class="fa-solid fa-filter"></i> Filter by Status</div>
          <span>${data[type].length} Total</span>
        </div>
        <div class="admin-filter-options">
          ${statusOptions.map((status, i) => `<button class="admin-filter-btn ${i===0 ? "active" : ""}" data-filter-status="${status}">${status}</button>`).join("")}
        </div>
      </div>
      <div id="adminSubmissionCards"></div>`;

    renderSubmissionCards(type, "All");
    detail.innerHTML = `<div class="admin-empty-detail"><i class="fa-regular fa-folder-open"></i><h3>Select a submission</h3><p>Click a card on the left to view all submitted information.</p></div>`;
    page.dataset.currentType = type;
    page.classList.add("show"); page.setAttribute("aria-hidden","false"); document.body.style.overflow="hidden";
  }));

  function renderSubmissionCards(type, filterStatus) {
    const cards = data[type]
      .map((item, i) => ({item, i}))
      .filter(({item}) => filterStatus === "All" || item.status === filterStatus);

    const holder = document.getElementById("adminSubmissionCards");
    if (!holder) return;

    if (!cards.length) {
      holder.innerHTML = `<div class="admin-no-results"><i class="fa-solid fa-inbox"></i><p>No ${filterStatus.toLowerCase()} submissions found.</p></div>`;
      return;
    }

    holder.innerHTML = cards.map(({item,i})=>`
      <article class="admin-submission-card" data-type="${type}" data-index="${i}">
        <div class="admin-card-row">
          <div>
            <h4>${item.name}</h4>
            <p>${item.email}</p>
          </div>
          <span class="admin-list-status status-${item.status.toLowerCase().replace(/\s+/g,'-')}">${item.status}</span>
        </div>
        <p><strong>${item.branch}</strong> · ${item.year}</p>
        <span class="mini">${item.submitted}</span>
      </article>`).join("");
  }

  list.addEventListener("click", e => {
    const filterBtn = e.target.closest(".admin-filter-btn");
    if (filterBtn) {
      list.querySelectorAll(".admin-filter-btn").forEach(b => b.classList.remove("active"));
      filterBtn.classList.add("active");
      renderSubmissionCards(page.dataset.currentType, filterBtn.dataset.filterStatus);
      detail.innerHTML = `<div class="admin-empty-detail"><i class="fa-regular fa-folder-open"></i><h3>Select a submission</h3><p>Click a card on the left to view all submitted information.</p></div>`;
      return;
    }

    const card = e.target.closest(".admin-submission-card"); if(!card) return;
    list.querySelectorAll(".admin-submission-card").forEach(c=>c.classList.remove("active")); card.classList.add("active");
    const type = card.dataset.type;
    const item = data[type][card.dataset.index];

    const statusOptions = type === "complaints"
      ? ["Pending", "In Progress", "Resolved", "Rejected"]
      : ["Pending", "Accepted", "Rejected"];

    const entries = Object.entries(item).filter(([k])=>!["name","email","branch","year","phone","status"].includes(k));

    detail.innerHTML = `
      <div class="detail-top">
        <div>
          <span class="cse-admin-eyebrow">${type === "complaints" ? "COMPLAINT DETAILS" : type === "applications" ? "APPLICATION DETAILS" : "MEMBER REGISTRATION"}</span>
          <h3>${item.name}</h3>
          <p>${item.email} · ${item.branch} · ${item.year}</p>
        </div>
        <span class="detail-status status-${item.status.toLowerCase().replace(/\s+/g,'-')}" id="detailCurrentStatus">${item.status}</span>
      </div>

      <div class="admin-status-control-card">
        <div>
          <span class="admin-status-label">Update Status</span>
          <p>${type === "complaints" ? "Keep the student informed about complaint progress." : type === "applications" ? "Accept or reject this registration/application." : "Accept or reject this club member registration."}</p>
        </div>
        <div class="admin-status-action">
          <select id="submissionStatusSelect">
            ${statusOptions.map(status => `<option value="${status}" ${item.status === status ? "selected" : ""}>${status}</option>`).join("")}
          </select>
          <button id="saveSubmissionStatus" data-type="${type}" data-index="${card.dataset.index}">
            <i class="fa-solid fa-check"></i> Update
          </button>
        </div>
      </div>

      <div class="detail-grid">
        <div class="detail-field"><label>Email</label><div>${item.email}</div></div>
        <div class="detail-field"><label>Phone</label><div>${item.phone || "Not provided"}</div></div>
        <div class="detail-field"><label>Branch</label><div>${item.branch}</div></div>
        <div class="detail-field"><label>Year</label><div>${item.year}</div></div>
        ${entries.map(([k,v])=>`<div class="detail-field ${String(v).length>45?"full":""}"><label>${k.replace(/([A-Z])/g," $1")}</label><div>${v}</div></div>`).join("")}
      </div>`;

    document.getElementById("saveSubmissionStatus").addEventListener("click", e => {
      const btn = e.currentTarget;
      const submission = data[btn.dataset.type][Number(btn.dataset.index)];
      const oldStatus = submission.status;
      const newStatus = document.getElementById("submissionStatusSelect").value;
      submission.status = newStatus;

      document.getElementById("detailCurrentStatus").textContent = newStatus;
      document.getElementById("detailCurrentStatus").className = `detail-status status-${newStatus.toLowerCase().replace(/\s+/g,'-')}`;

      const activeFilter = list.querySelector(".admin-filter-btn.active")?.dataset.filterStatus || "All";
      renderSubmissionCards(btn.dataset.type, activeFilter);

      showToast(`Status updated from ${oldStatus} to ${newStatus}. Student dashboard and notifications can use this status after backend connection.`);
    });
  });

  document.getElementById("closeDataPage").addEventListener("click",()=>{page.classList.remove("show");page.setAttribute("aria-hidden","true");document.body.style.overflow=""});

  const sidebar = document.getElementById("adminSidebar"), backdrop = document.getElementById("adminSidebarBackdrop");
  const openSide = ()=>{sidebar.classList.add("show");backdrop.classList.add("show")};
  const closeSide = ()=>{sidebar.classList.remove("show");backdrop.classList.remove("show")};
  document.getElementById("cseAdminProfileBtn").addEventListener("click",openSide);
  document.getElementById("closeAdminSidebar").addEventListener("click",closeSide); backdrop.addEventListener("click",closeSide);

  const dialogBackdrop = document.getElementById("adminDialogBackdrop");
  const profileDialog = document.getElementById("adminProfileDialog"), passwordDialog = document.getElementById("adminPasswordDialog"), hodProfileDialog = document.getElementById("cseHodProfileDialog");
  const openDialog = el=>{dialogBackdrop.classList.add("show");el.classList.add("show")};
  const closeDialogs = ()=>{dialogBackdrop.classList.remove("show");profileDialog.classList.remove("show");passwordDialog.classList.remove("show"); if(hodProfileDialog) hodProfileDialog.classList.remove("show")};
  const hodViewBtn = document.getElementById("cseHodViewProfile");
  if(hodViewBtn && hodProfileDialog){
    hodViewBtn.addEventListener("click",()=>{
      const details=document.querySelectorAll('.cse-hod-detail b');
      document.getElementById('hodProfileName').textContent=document.querySelector('.cse-hod-name h2').textContent;
      document.getElementById('hodProfileContact').textContent=details[0]?.textContent||'';
      document.getElementById('hodProfileEmail').textContent=details[1]?.textContent||'';
      document.getElementById('hodProfileCabin').textContent=details[2]?.textContent||'';
      openDialog(hodProfileDialog);
    });
  }
  document.querySelectorAll("[data-close-dialog]").forEach(b=>b.addEventListener("click",closeDialogs)); dialogBackdrop.addEventListener("click",closeDialogs);

  document.querySelectorAll("[data-profile-action]").forEach(b=>b.addEventListener("click",()=>{
    const action=b.dataset.profileAction; closeSide();
    if(action==="profile") openDialog(profileDialog);
    else if(action==="password") openDialog(passwordDialog);
    else showToast("Account settings will be connected to backend next.");
  }));
  document.getElementById("adminProfileForm").addEventListener("submit",e=>{e.preventDefault();closeDialogs();showToast("Profile changes saved for preview.");});
  document.getElementById("sendResetLink").addEventListener("click",()=>{
    const msg=document.getElementById("resetMessage");msg.textContent="Reset link sent. Please check your email.";
    msg.classList.add("show");
  });

  function showToast(message){const t=document.getElementById("cseAdminToast");t.textContent=message;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2800)}
});


// CSE HOD gear support, keeping the same AWS admin dialog behavior.
document.addEventListener("DOMContentLoaded", () => {
  const hodGear = document.querySelector('[data-edit-section="hod"]');
  if (!hodGear) return;
  hodGear.addEventListener('click', () => {
    let modal = document.getElementById('cseHodDialog');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'cseHodDialog';
      modal.className = 'cse-admin-dialog';
      modal.innerHTML = `
        <button class="cse-dialog-close" type="button">×</button>
        <span class="cse-admin-eyebrow">HOD</span><h2>Manage HOD Details</h2>
        <form id="cseHodForm">
          <label>Name<input id="cseHodName" value="[HOD Name]"></label>
          <label>Contact<input id="cseHodContact" value="[Contact Number]"></label>
          <label>Email<input id="cseHodEmail" value="cse@rgukt.ac.in"></label>
          <label>Cabin No.<input id="cseHodCabin" value="[Cabin Number]"></label>
          <button class="cse-dialog-save" type="submit">Save Changes</button>
        </form>`;
      document.body.appendChild(modal);
      modal.querySelector('.cse-dialog-close').onclick = () => modal.classList.remove('show');
      modal.querySelector('form').onsubmit = e => {
        e.preventDefault();
        document.querySelector('.cse-hod-name h2').textContent = document.getElementById('cseHodName').value;
        const details = document.querySelectorAll('.cse-hod-detail b');
        details[0].textContent = document.getElementById('cseHodContact').value;
        details[1].textContent = document.getElementById('cseHodEmail').value;
        details[2].textContent = document.getElementById('cseHodCabin').value;
        const pn=document.getElementById('hodProfileName'), pc=document.getElementById('hodProfileContact'), pe=document.getElementById('hodProfileEmail'), pb=document.getElementById('hodProfileCabin');
        if(pn) pn.textContent=document.getElementById('cseHodName').value;
        if(pc) pc.textContent=document.getElementById('cseHodContact').value;
        if(pe) pe.textContent=document.getElementById('cseHodEmail').value;
        if(pb) pb.textContent=document.getElementById('cseHodCabin').value;
        modal.classList.remove('show');
        const toast = document.getElementById('cseAdminToast');
        toast.textContent = 'HOD details updated.'; toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2200);
      };
    }
    modal.classList.add('show');
  });
});
