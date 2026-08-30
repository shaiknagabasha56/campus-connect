/* =========================================================
   ADMIN PROFILE PANEL
========================================================= */

const adminTrigger = document.getElementById("adminTrigger");

const adminPanel = document.getElementById("adminPanel");

const closeProfile = document.getElementById("closeProfile");

const profileOverlay = document.getElementById("profileOverlay");


/* Open Admin Profile */

adminTrigger.addEventListener("click", function () {

    adminPanel.classList.add("open");

    profileOverlay.classList.add("show");

});


/* Close Admin Profile */

closeProfile.addEventListener("click", function () {

    adminPanel.classList.remove("open");

    profileOverlay.classList.remove("show");

});


/* Close by clicking outside */

profileOverlay.addEventListener("click", function () {

    adminPanel.classList.remove("open");

    profileOverlay.classList.remove("show");

});


/* =========================================================
   MANAGE APPROVED EMERGENCIES
========================================================= */

const approvedButton =
    document.getElementById("approvedButton");

const approvedOverlay =
    document.getElementById("approvedOverlay");

const closeApproved =
    document.getElementById("closeApproved");


/* Open approved emergency page/modal */

approvedButton.addEventListener("click", function () {

    approvedOverlay.classList.add("show");

});


/* Close modal */

closeApproved.addEventListener("click", function () {

    approvedOverlay.classList.remove("show");

});


/* Click outside modal */

approvedOverlay.addEventListener("click", function (event) {

    if (event.target === approvedOverlay) {

        approvedOverlay.classList.remove("show");

    }

});


/* =========================================================
   DELETE APPROVED EMERGENCY
========================================================= */

const deleteButtons =
    document.querySelectorAll(".delete-button");


deleteButtons.forEach(function (button) {

    button.addEventListener("click", function () {

        const row = button.closest("tr");

        const emergencyName =
            row.querySelector("strong").textContent;

        const confirmDelete =
            confirm(
                `Are you sure you want to delete "${emergencyName}"?`
            );


        if (confirmDelete) {

            row.style.opacity = "0";

            row.style.transform = "translateX(20px)";

            row.style.transition = "0.25s";


            setTimeout(function () {

                row.remove();

            }, 250);

        }

    });

});


/* =========================================================
   SEARCH
========================================================= */

const searchInput =
    document.getElementById("searchInput");

const reportRows =
    document.querySelectorAll("#reportTableBody tr");


searchInput.addEventListener("input", function () {

    const searchValue =
        searchInput.value.toLowerCase().trim();


    reportRows.forEach(function (row) {

        const rowText =
            row.textContent.toLowerCase();


        if (rowText.includes(searchValue)) {

            row.style.display = "";

        } else {

            row.style.display = "none";

        }

    });

});


/* =========================================================
   TABS
========================================================= */

const tabs =
    document.querySelectorAll(".tab");


tabs.forEach(function (tab) {

    tab.addEventListener("click", function () {

        tabs.forEach(function (item) {

            item.classList.remove("active");

        });

        tab.classList.add("active");

    });

});


/* =========================================================
   ESC KEY
========================================================= */

document.addEventListener("keydown", function (event) {

    if (event.key === "Escape") {

        adminPanel.classList.remove("open");

        profileOverlay.classList.remove("show");

        approvedOverlay.classList.remove("show");

    }

});