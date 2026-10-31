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

        // The Artix HTML already contains the modal markup.
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
