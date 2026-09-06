document.addEventListener("DOMContentLoaded", function () {

    /* =========================
       ADMIN PROFILE PANEL
    ========================= */

    const adminTrigger = document.getElementById("adminTrigger");
    const adminPanel = document.getElementById("adminPanel");
    const profileOverlay = document.getElementById("profileOverlay");
    const closeProfile = document.getElementById("closeProfile");

    function openProfile() {
        adminPanel.classList.add("open");
        profileOverlay.classList.add("show");
        document.body.style.overflow = "hidden";
    }

    function closeProfilePanel() {
        adminPanel.classList.remove("open");
        profileOverlay.classList.remove("show");
        document.body.style.overflow = "";
    }

    if (adminTrigger) {
        adminTrigger.addEventListener("click", openProfile);
    }

    if (closeProfile) {
        closeProfile.addEventListener("click", closeProfilePanel);
    }

    if (profileOverlay) {
        profileOverlay.addEventListener("click", closeProfilePanel);
    }


    /* =========================
       APPROVED EMERGENCIES MODAL
    ========================= */

    const approvedButton = document.getElementById("approvedButton");
    const approvedOverlay = document.getElementById("approvedOverlay");
    const closeApproved = document.getElementById("closeApproved");

    function openApprovedModal() {
        approvedOverlay.classList.add("show");
        document.body.style.overflow = "hidden";
    }

    function closeApprovedModal() {
        approvedOverlay.classList.remove("show");
        document.body.style.overflow = "";
    }

    if (approvedButton) {
        approvedButton.addEventListener("click", openApprovedModal);
    }

    if (closeApproved) {
        closeApproved.addEventListener("click", closeApprovedModal);
    }

    if (approvedOverlay) {
        approvedOverlay.addEventListener("click", function (event) {

            if (event.target === approvedOverlay) {
                closeApprovedModal();
            }

        });
    }


    /* =========================
       CATEGORY FILTER
    ========================= */

    const categoryFilter = document.getElementById("categoryFilter");
    const reportTableBody = document.getElementById("reportTableBody");

    if (categoryFilter && reportTableBody) {

        categoryFilter.addEventListener("change", function () {

            const selectedCategory = this.value;
            const rows = reportTableBody.querySelectorAll("tr");

            rows.forEach(function (row) {

                const rowCategory = row.getAttribute("data-category");

                /*
                 * Keep empty-state row visible.
                 */
                if (!rowCategory) {
                    return;
                }

                if (
                    selectedCategory === "all" ||
                    rowCategory === selectedCategory
                ) {

                    row.style.display = "";

                } else {

                    row.style.display = "none";

                }

            });

        });

    }


    /* =========================
       SEARCH
    ========================= */

    const searchInput = document.getElementById("searchInput");

    if (searchInput && reportTableBody) {

        searchInput.addEventListener("input", function () {

            const searchText = this.value.toLowerCase().trim();

            const rows = reportTableBody.querySelectorAll("tr");

            rows.forEach(function (row) {

                const rowText = row.textContent.toLowerCase();

                if (!row.getAttribute("data-category")) {
                    return;
                }

                if (rowText.includes(searchText)) {

                    row.style.display = "";

                } else {

                    row.style.display = "none";

                }

            });

        });

    }


    /* =========================
       ESCAPE KEY
    ========================= */

    document.addEventListener("keydown", function (event) {

        if (event.key === "Escape") {

            closeProfilePanel();
            closeApprovedModal();

        }

    });


    /* =========================
       DELETE CONFIRMATION
    ========================= */

    const deleteForms = document.querySelectorAll(
        ".approved-table form"
    );

    deleteForms.forEach(function (form) {

        form.addEventListener("submit", function (event) {

            const confirmed = confirm(
                "Are you sure you want to delete this approved emergency?"
            );

            if (!confirmed) {
                event.preventDefault();
            }

        });

    });


    /* =========================
       CONTACT SUPPORT
    ========================= */

    const contactSupport =
        document.querySelector(".contact-support");

    if (contactSupport) {

        contactSupport.addEventListener("click", function () {

            window.location.href =
                "mailto:emergency@rgukt.ac.in";

        });

    }


    /* =========================
       PROFILE OPTION BUTTONS
    ========================= */

    const profileOptions =
        document.querySelectorAll(".profile-options button");

    profileOptions.forEach(function (button) {

        button.addEventListener("click", function () {

            alert(
                button.innerText.trim() +
                " feature is coming soon."
            );

        });

    });


    /* =========================
       LOGOUT
    ========================= */

    const logoutButton =
        document.querySelector(".logout-button");

    if (logoutButton) {

        logoutButton.addEventListener("click", function () {

            const confirmed = confirm(
                "Are you sure you want to logout?"
            );

            if (confirmed) {

                /*
                 * Change this URL if your Flask
                 * logout route has a different name.
                 */

                window.location.href = "/logout";

            }

        });

    }

});