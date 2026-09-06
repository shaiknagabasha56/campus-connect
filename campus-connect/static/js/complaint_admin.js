 /* =========================================================
   CAMPUS CONNECT
   COMPLAINT ADMIN / STUDENT COMPLAINT JAVASCRIPT
   ========================================================= */


/* =========================================================
   1. GLOBAL COMPLAINT DATA
   ========================================================= */

// Complaints will now come from MySQL through /complaints/api
let complaints = [];

let currentFilter = "all";


/* =========================================================
   2. MAIN DOM ELEMENTS
   ========================================================= */

const list = document.getElementById("complaints-list");
const backdrop = document.getElementById("preview-backdrop");


/* =========================================================
   3. STATUS HELPER
   ========================================================= */

function prettyStatus(status) {

    if (!status) {
        return "Unknown";
    }

    return String(status)
        .split("-")
        .map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        )
        .join(" ");
}


/* =========================================================
   4. HTML ESCAPE FUNCTION
   ========================================================= */

function escapeHTML(value = "") {

    return String(value).replace(
        /[&<>"']/g,
        character => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        }[character])
    );
}


/* =========================================================
   5. RENDER COMPLAINTS
   ========================================================= */

function renderComplaints() {

    if (!list) {
        console.error("complaints-list element not found.");
        return;
    }

    const filtered = complaints.filter(
        complaint =>
            currentFilter === "all" ||
            complaint.status === currentFilter
    );


    if (filtered.length === 0) {

        list.innerHTML = `
            <div style="
                padding:45px;
                text-align:center;
                color:#8290a1;
                font-size:14px;
            ">
                No complaints found for this status.
            </div>
        `;

        return;
    }


    list.innerHTML = filtered.map(complaint => {

        return `
            <button
                type="button"
                class="complaint-row"
                data-id="${escapeHTML(complaint.id)}"
            >

                <span class="row-marker"></span>

                <span>

                    <h3>
                        ${escapeHTML(complaint.title)}
                    </h3>

                    <p>
                        ${escapeHTML(complaint.description)}
                    </p>

                    <span class="row-bottom">

                        <i class="fa-solid fa-tag"></i>
                        ${escapeHTML(complaint.category)}

                        &nbsp;

                        <i class="fa-solid fa-flag"></i>
                        ${escapeHTML(complaint.priority)}

                        &nbsp;

                        <i class="fa-regular fa-clock"></i>
                        ${escapeHTML(complaint.date)}

                    </span>

                </span>


                <span
                    class="status-badge ${escapeHTML(complaint.status)}"
                >
                    ${escapeHTML(prettyStatus(complaint.status))}
                </span>

            </button>
        `;

    }).join("");
}


/* =========================================================
   6. OPEN COMPLAINT PREVIEW
   ========================================================= */

function openPreview(id) {

    const complaint = complaints.find(
        item => String(item.id) === String(id)
    );


    if (!complaint) {
        console.error("Complaint not found:", id);
        return;
    }


    const title = document.getElementById("preview-title");
    const type = document.getElementById("preview-type");
    const status = document.getElementById("preview-status");
    const date = document.getElementById("preview-date");
    const description = document.getElementById("preview-description");
    const reference = document.getElementById("preview-reference");
    const meta = document.getElementById("preview-meta");


    if (title) {
        title.textContent = complaint.title;
    }


    if (type) {
        type.textContent =
            complaint.anonymous
                ? "ANONYMOUS COMPLAINT"
                : "COMPLAINT";
    }


    if (status) {

        status.className =
            `status-badge ${complaint.status}`;

        status.textContent =
            prettyStatus(complaint.status);
    }


    if (date) {
        date.textContent = complaint.date;
    }


    if (description) {
        description.textContent =
            complaint.description;
    }


    if (reference) {
        reference.textContent =
            complaint.id;
    }


    if (meta) {

        const metadata = [

            ["Category", complaint.category],

            ["Priority", complaint.priority],

            [
                "Submitted As",
                complaint.anonymous
                    ? "Anonymous"
                    : (complaint.name || "Student")
            ],

            [
                "Roll / ID",
                complaint.anonymous
                    ? "Not shared"
                    : (complaint.roll || "Not provided")
            ],

            [
                "Phone",
                complaint.anonymous
                    ? "Not shared"
                    : (complaint.phone || "Not provided")
            ]

        ];


        meta.innerHTML = metadata.map(
            ([key, value]) => `
                <div class="meta-box">

                    <span>
                        ${escapeHTML(key)}
                    </span>

                    <strong>
                        ${escapeHTML(value)}
                    </strong>

                </div>
            `
        ).join("");
    }


    renderAttachments(
        complaint.attachments || []
    );


    if (backdrop) {

        backdrop.classList.remove("hidden");

        document.body.style.overflow =
            "hidden";
    }
}


/* =========================================================
   7. CLOSE COMPLAINT PREVIEW
   ========================================================= */

function closePreview() {

    if (backdrop) {

        backdrop.classList.add("hidden");

        document.body.style.overflow = "";
    }
}


/* =========================================================
   8. ATTACHMENTS
   ========================================================= */

function renderAttachments(files) {

    const holder =
        document.getElementById("attachment-preview");


    if (!holder) {
        return;
    }


    if (!files || files.length === 0) {

        holder.innerHTML = `
            <p style="
                margin:0;
                color:#8b98a8;
                font-size:13px;
            ">
                No attachments were provided.
            </p>
        `;

        return;
    }


    const wrap =
        document.createElement("div");

    wrap.className =
        "attachment-grid";


    files.forEach(file => {

        const url =
            file.url || "";

        const type =
            file.type || "";

        const name =
            file.name || "Attachment";


        if (type.startsWith("image/")) {

            const image =
                document.createElement("img");

            image.src = url;
            image.alt = name;
            image.className =
                "attachment-image";

            wrap.appendChild(image);

        }


        else if (type.startsWith("video/")) {

            const video =
                document.createElement("video");

            video.src = url;
            video.controls = true;

            video.className =
                "attachment-video";

            wrap.appendChild(video);

        }


        else if (type.startsWith("audio/")) {

            const audio =
                document.createElement("audio");

            audio.src = url;
            audio.controls = true;

            audio.className =
                "attachment-audio";

            wrap.appendChild(audio);

        }


        else if (type === "application/pdf") {

            const link =
                document.createElement("a");

            link.href = url;
            link.target = "_blank";

            link.className =
                "file-link";

            link.innerHTML = `
                <i class="fa-solid fa-file-pdf"></i>
                <span>
                    ${escapeHTML(name)}
                </span>
            `;

            wrap.appendChild(link);

        }


        else {

            const link =
                document.createElement("a");

            link.href = url;
            link.download = name;

            link.className =
                "file-link";

            link.innerHTML = `
                <i class="fa-solid fa-paperclip"></i>
                <span>
                    ${escapeHTML(name)}
                </span>
            `;

            wrap.appendChild(link);
        }

    });


    holder.innerHTML = "";

    holder.appendChild(wrap);
}


/* =========================================================
   9. COMPLAINT TABS
   ========================================================= */

document
    .querySelectorAll(".complaint-tab")
    .forEach(tab => {

        tab.addEventListener(
            "click",
            () => {

                document
                    .querySelectorAll(".complaint-tab")
                    .forEach(t =>
                        t.classList.remove("active")
                    );


                document
                    .querySelectorAll(".form-panel")
                    .forEach(panel =>
                        panel.classList.remove("active")
                    );


                tab.classList.add("active");


                const panel =
                    document.getElementById(
                        tab.dataset.tab + "-panel"
                    );


                if (panel) {
                    panel.classList.add("active");
                }

            }
        );

    });


/* =========================================================
   10. STATUS FILTERS
   ========================================================= */

document
    .querySelectorAll(".status-filter")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                document
                    .querySelectorAll(".status-filter")
                    .forEach(btn =>
                        btn.classList.remove("active")
                    );


                button.classList.add("active");


                currentFilter =
                    button.dataset.status;


                renderComplaints();

            }
        );

    });


/* =========================================================
   11. COMPLAINT CLICK
   ========================================================= */

if (list) {

    list.addEventListener(
        "click",
        event => {

            const row =
                event.target.closest(
                    ".complaint-row"
                );


            if (row) {

                openPreview(
                    row.dataset.id
                );

            }

        }
    );
}


/* =========================================================
   12. LOAD COMPLAINTS FROM MYSQL
   ========================================================= */

async function loadComplaintsFromDatabase() {

    try {

        console.log(
            "Loading complaints from MySQL..."
        );


        const response =
            await fetch("/complaints/api");


        if (!response.ok) {

            throw new Error(
                "Failed to load complaints from server."
            );
        }


        const data =
            await response.json();


        console.log(
            "Complaint API response:",
            data
        );


        if (!data.success) {

            throw new Error(
                data.message ||
                "Could not load complaints."
            );
        }


        /*
         * Convert MySQL data into the format
         * required by the admin UI.
         */

        complaints =
            (data.complaints || []).map(
                complaint => ({

                    id:
                        complaint.reference_id,

                    title:
                        complaint.title || "Untitled Complaint",

                    category:
                        complaint.category || "General",

                    priority:
                        complaint.priority || "Medium",

                    status:
                        complaint.status || "new",

                    description:
                        complaint.description || "",

                    date:
                        complaint.created_at
                            ? new Date(
                                complaint.created_at
                              ).toLocaleString()
                            : "Unknown",

                    anonymous:
                        Boolean(
                            complaint.anonymous
                        ),

                    name:
                        complaint.name || "",

                    roll:
                        complaint.roll || "",

                    phone:
                        complaint.phone || "",

                    attachments:
                        complaint.attachments || []

                })
            );


        console.log(
            "Complaints loaded:",
            complaints
        );


        renderComplaints();

        updateAdminCounts();

        renderManagement();

    }


    catch (error) {

        console.error(
            "Error loading complaints:",
            error
        );


        if (list) {

            list.innerHTML = `
                <div style="
                    padding:40px;
                    text-align:center;
                    color:#d32f2f;
                ">
                    Unable to load complaints.
                    Please try again.
                </div>
            `;
        }

    }

}


/* =========================================================
   13. STUDENT COMPLAINT SUBMISSION
   ========================================================= */

document
    .querySelectorAll(
        "#normal-form, #anonymous-form"
    )
    .forEach(form => {

        form.addEventListener(
            "submit",
            async event => {

                event.preventDefault();


                /*
                 * IMPORTANT:
                 *
                 * Flask uses request.form.get()
                 * so we send FormData instead of JSON.
                 */

                const formData =
                    new FormData(form);


                const anonymous =
                    form.id === "anonymous-form";


                formData.set(
                    "anonymous",
                    anonymous
                        ? "true"
                        : "false"
                );


                const message =
                    document.getElementById(
                        "form-message"
                    );


                try {

                    const response =
                        await fetch(
                            "/complaints/submit",
                            {
                                method: "POST",
                                body: formData
                            }
                        );


                    const data =
                        await response.json();


                    if (
                        !response.ok ||
                        !data.success
                    ) {

                        throw new Error(
                            data.message ||
                            "Failed to submit complaint."
                        );
                    }


                    /*
                     * Show success message.
                     */

                    if (message) {

                        message.textContent =
                            `Your complaint has been submitted successfully. Reference ID: ${data.reference_id}`;

                        message.className =
                            "form-message show success";
                    }


                    /*
                     * Clear form.
                     */

                    form.reset();


                    /*
                     * Reload complaints from MySQL.
                     *
                     * This makes the newly submitted
                     * complaint available to the
                     * admin complaint list.
                     */

                    await loadComplaintsFromDatabase();


                    /*
                     * Show all complaints.
                     */

                    currentFilter = "all";


                    document
                        .querySelectorAll(
                            ".status-filter"
                        )
                        .forEach(button => {

                            button.classList.toggle(
                                "active",
                                button.dataset.status === "all"
                            );

                        });


                    renderComplaints();


                    /*
                     * Hide success message.
                     */

                    setTimeout(
                        () => {

                            if (message) {

                                message.className =
                                    "form-message";
                            }

                        },
                        5000
                    );

                }


                catch (error) {

                    console.error(
                        "Complaint submission error:",
                        error
                    );


                    if (message) {

                        message.textContent =
                            error.message ||
                            "Could not submit complaint. Please try again.";

                        message.className =
                            "form-message show error";
                    }

                }

            }
        );

    });


/* =========================================================
   14. PREVIEW CLOSE EVENTS
   ========================================================= */

const previewClose =
    document.getElementById(
        "preview-close"
    );


if (previewClose) {

    previewClose.addEventListener(
        "click",
        closePreview
    );
}


if (backdrop) {

    backdrop.addEventListener(
        "click",
        event => {

            if (
                event.target === backdrop
            ) {

                closePreview();

            }

        }
    );
}


document.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Escape" &&
            backdrop &&
            !backdrop.classList.contains(
                "hidden"
            )
        ) {

            closePreview();

        }

    }
);


/* =========================================================
   15. ADMIN MANAGEMENT
   ========================================================= */

/*
 * Applications remain separate from complaints.
 * Complaints are loaded from MySQL.
 */

const applicationSeed = [

    {
        id: "APP-2026-101",
        title: "Scholarship support application",
        category: "Financial Aid",
        status: "Under Review",
        date: "Today, 9:20 AM",
        student: "Ravi Kumar",
        roll: "N200123",
        description:
            "Application submitted for scholarship assistance with supporting documents.",
        attachments: []
    },

    {
        id: "APP-2026-102",
        title: "Hostel room change request",
        category: "Hostel",
        status: "In Progress",
        date: "Yesterday, 3:45 PM",
        student: "Anjali Devi",
        roll: "N200456",
        description:
            "Student requested a room change due to accommodation concerns.",
        attachments: []
    },

    {
        id: "APP-2026-103",
        title: "Academic event registration",
        category: "Academic",
        status: "New",
        date: "20 Aug, 4:30 PM",
        student: "Kiran Reddy",
        roll: "N200789",
        description:
            "Registration submitted for the upcoming academic event.",
        attachments: []
    },

    {
        id: "APP-2026-104",
        title: "Bonafide certificate request",
        category: "Academic",
        status: "Resolved",
        date: "18 Aug, 11:20 AM",
        student: "Meera",
        roll: "N200908",
        description:
            "Bonafide certificate request reviewed and completed.",
        attachments: []
    }

];


let managementType = "complaints";

let managementStatus = "All";

let selectedManagementId = null;


const managementBackdrop =
    document.getElementById(
        "management-backdrop"
    );


const managementList =
    document.getElementById(
        "managementList"
    );


const managementPreview =
    document.getElementById(
        "managementPreview"
    );


const managementFilters =
    document.getElementById(
        "managementFilters"
    );


const managementTitle =
    document.getElementById(
        "managementTitle"
    );


const managementEyebrow =
    document.getElementById(
        "managementEyebrow"
    );


const managementDescription =
    document.getElementById(
        "managementDescription"
    );


function adminStatusClass(status) {

    return String(status || "")
        .toLowerCase()
        .replace(/ /g, "-");

}


function currentManagementItems() {

    return managementType === "complaints"
        ? complaints
        : applicationSeed;

}


function openManagement(type) {

    managementType =
        type;

    managementStatus =
        "All";

    selectedManagementId =
        null;


    if (managementTitle) {

        managementTitle.textContent =
            type === "complaints"
                ? "Complaints"
                : "Applications";
    }


    if (managementEyebrow) {

        managementEyebrow.textContent =
            type === "complaints"
                ? "COMPLAINT MANAGEMENT"
                : "APPLICATION MANAGEMENT";
    }


    if (managementDescription) {

        managementDescription.textContent =
            type === "complaints"
                ? "Click a complaint to view complete submitted details and attachments."
                : "Click an application to view complete submitted details and documents.";
    }


    if (managementBackdrop) {

        managementBackdrop.classList.remove(
            "hidden"
        );

        document.body.style.overflow =
            "hidden";
    }


    renderManagement();

}


function closeManagement() {

    if (managementBackdrop) {

        managementBackdrop.classList.add(
            "hidden"
        );

        document.body.style.overflow =
            "";
    }

}


function getManagementStatus(item) {

    return managementType === "complaints"
        ? prettyStatus(item.status)
        : item.status;

}


/* =========================================================
   16. RENDER MANAGEMENT
   ========================================================= */

function renderManagement() {

    if (
        !managementList ||
        !managementFilters
    ) {

        return;
    }


    const items =
        currentManagementItems();


    const statuses = [
        "All",
        "New",
        "Under Review",
        "In Progress",
        "Resolved"
    ];


    managementFilters.innerHTML =
        statuses.map(
            status => `

                <button
                    type="button"
                    class="management-filter ${
                        status === managementStatus
                            ? "active"
                            : ""
                    }"
                    data-ms="${escapeHTML(status)}"
                >
                    ${escapeHTML(status)}
                </button>

            `
        ).join("");


    const filtered =
        items.filter(
            item =>
                managementStatus === "All" ||
                getManagementStatus(item) ===
                    managementStatus
        );


    if (filtered.length === 0) {

        managementList.innerHTML = `
            <div class="empty-management">
                <p>No items found.</p>
            </div>
        `;

    }


    else {

        managementList.innerHTML =
            filtered.map(
                item => `

                    <button
                        type="button"
                        class="management-item ${
                            selectedManagementId ===
                            item.id
                                ? "active"
                                : ""
                        }"
                        data-mid="${escapeHTML(item.id)}"
                    >

                        <strong>
                            ${escapeHTML(item.title)}
                        </strong>

                        <p>
                            ${
                                managementType ===
                                "complaints"

                                    ? (
                                        item.anonymous
                                            ? "Anonymous submission"
                                            : (
                                                item.name ||
                                                "Student"
                                            )
                                      )

                                    : item.student
                            }
                        </p>

                        <div class="mi-bottom">

                            <span>
                                ${escapeHTML(item.category)}
                                ·
                                ${escapeHTML(item.date)}
                            </span>

                            <span
                                class="status-badge ${
                                    adminStatusClass(
                                        getManagementStatus(
                                            item
                                        )
                                    )
                                }"
                            >
                                ${escapeHTML(
                                    getManagementStatus(
                                        item
                                    )
                                )}
                            </span>

                        </div>

                    </button>

                `
            ).join("");

    }


    /*
     * Management filters.
     */

    managementFilters
        .querySelectorAll("button")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    managementStatus =
                        button.dataset.ms;

                    renderManagement();

                }
            );

        });


    /*
     * Management items.
     */

    managementList
        .querySelectorAll(
            ".management-item"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    selectedManagementId =
                        button.dataset.mid;

                    renderManagement();

                    renderManagementPreview(
                        selectedManagementId
                    );

                }
            );

        });

}


/* =========================================================
   17. MANAGEMENT PREVIEW
   ========================================================= */

function renderManagementPreview(id) {

    if (!managementPreview) {
        return;
    }


    const item =
        currentManagementItems().find(
            complaint =>
                String(complaint.id) ===
                String(id)
        );


    if (!item) {
        return;
    }


    const isComplaint =
        managementType === "complaints";


    let data;


    if (isComplaint) {

        data = [

            ["Reference ID", item.id],

            [
                "Submission",
                item.anonymous
                    ? "Anonymous"
                    : "Normal"
            ],

            ["Category", item.category],

            ["Priority", item.priority],

            [
                "Status",
                prettyStatus(item.status)
            ],

            ["Date", item.date],

            [
                "Name",
                item.anonymous
                    ? "Not shared"
                    : (
                        item.name ||
                        "Student"
                    )
            ],

            [
                "Roll / ID",
                item.anonymous
                    ? "Not shared"
                    : (
                        item.roll ||
                        "Not provided"
                    )
            ],

            [
                "Contact",
                item.anonymous
                    ? "Not shared"
                    : (
                        item.phone ||
                        "Not provided"
                    )
            ]

        ];

    }


    else {

        data = [

            ["Application ID", item.id],

            ["Category", item.category],

            ["Status", item.status],

            ["Date", item.date],

            ["Student", item.student],

            ["Roll / ID", item.roll]

        ];

    }


    managementPreview.innerHTML = `

        <div class="admin-preview-head">

            <p class="eyebrow">

                ${
                    isComplaint
                        ? (
                            item.anonymous
                                ? "ANONYMOUS COMPLAINT"
                                : "COMPLAINT DETAILS"
                          )
                        : "APPLICATION DETAILS"
                }

            </p>

            <h3>
                ${escapeHTML(item.title)}
            </h3>

            <p>
                Complete submitted information
                and supporting attachments.
            </p>

        </div>


        <div class="admin-meta-grid">

            ${data.map(
                ([key, value]) => `

                    <div class="admin-data-box">

                        <span>
                            ${escapeHTML(key)}
                        </span>

                        <strong>
                            ${escapeHTML(value)}
                        </strong>

                    </div>

                `
            ).join("")}

        </div>


        <div class="admin-description">

            <h4>
                ${
                    isComplaint
                        ? "COMPLAINT DETAILS"
                        : "APPLICATION DETAILS"
                }
            </h4>

            <p>
                ${escapeHTML(item.description)}
            </p>

        </div>


        <div class="admin-attachments">

            <h4>
                ATTACHMENTS
            </h4>

            ${renderAdminAttachments(
                item.attachments || []
            )}

        </div>

    `;

}


/* =========================================================
   18. ADMIN ATTACHMENTS
   ========================================================= */

function renderAdminAttachments(files) {

    if (
        !files ||
        files.length === 0
    ) {

        return `
            <p style="
                color:#8b98a8;
                font-size:13px;
                margin:0;
            ">
                No attachments were provided.
            </p>
        `;
    }


    return files.map(
        (file, index) => `

            <button
                type="button"
                class="admin-attachment"
                data-att-index="${index}"
            >

                <i class="fa-solid ${
                    file.type &&
                    file.type.startsWith("image/")
                        ? "fa-image"

                        : file.type &&
                          file.type.startsWith("video/")
                            ? "fa-file-video"

                            : file.type &&
                              file.type.startsWith("audio/")
                                ? "fa-file-audio"

                                : file.type ===
                                  "application/pdf"
                                    ? "fa-file-pdf"
                                    : "fa-file-lines"
                }"></i>

                <span>
                    ${escapeHTML(
                        file.name ||
                        "Attachment"
                    )}
                </span>

                <small style="
                    margin-left:auto;
                    color:#8b98a8;
                ">
                    Preview
                </small>

            </button>

        `
    ).join("");

}


if (managementPreview) {

    managementPreview.addEventListener(
        "click",
        event => {

            const button =
                event.target.closest(
                    ".admin-attachment"
                );


            if (!button) {
                return;
            }


            const item =
                currentManagementItems().find(
                    complaint =>
                        String(complaint.id) ===
                        String(
                            selectedManagementId
                        )
                );


            if (
                !item ||
                !item.attachments
            ) {
                return;
            }


            const file =
                item.attachments[
                    Number(
                        button.dataset.attIndex
                    )
                ];


            if (file) {

                openAttachmentViewer(
                    file
                );

            }

        }
    );

}


/* =========================================================
   19. ATTACHMENT VIEWER
   ========================================================= */

function openAttachmentViewer(file) {

    const box =
        document.createElement("div");


    box.className =
        "attachment-viewer-backdrop";


    let content = "";


    if (
        file.type &&
        file.type.startsWith("image/")
    ) {

        content = `
            <img
                src="${file.url}"
                alt="${escapeHTML(file.name)}"
            >
        `;

    }


    else if (
        file.type &&
        file.type.startsWith("video/")
    ) {

        content = `
            <video
                src="${file.url}"
                controls
                autoplay
            ></video>
        `;

    }


    else if (
        file.type &&
        file.type.startsWith("audio/")
    ) {

        content = `
            <audio
                src="${file.url}"
                controls
                autoplay
            ></audio>
        `;

    }


    else if (
        file.type ===
        "application/pdf"
    ) {

        content = `
            <iframe
                src="${file.url}"
                style="
                    width:100%;
                    height:65vh;
                    border:0;
                    border-radius:10px;
                "
            ></iframe>
        `;

    }


    else {

        content = `

            <div class="doc-preview">

                <div>

                    <i class="
                        fa-solid
                        fa-file-lines
                    "></i>

                    <h3>
                        ${escapeHTML(
                            file.name ||
                            "Document"
                        )}
                    </h3>

                    <p>
                        Document preview/download available.
                    </p>

                    ${
                        file.url
                            ? `
                                <a
                                    class="file-link"
                                    href="${file.url}"
                                    target="_blank"
                                    download
                                >
                                    Open / Download
                                </a>
                              `
                            : ""
                    }

                </div>

            </div>

        `;

    }


    box.innerHTML = `

        <div class="attachment-viewer">

            <button
                type="button"
                class="preview-close"
            >
                ×
            </button>

            <h2 style="
                font-size:19px;
                margin:0 45px 14px 0;
                color:#334155;
            ">
                ${escapeHTML(
                    file.name ||
                    "Attachment"
                )}
            </h2>

            ${content}

        </div>

    `;


    document.body.appendChild(box);


    const closeButton =
        box.querySelector(
            ".preview-close"
        );


    if (closeButton) {

        closeButton.onclick =
            () => box.remove();

    }


    box.onclick =
        event => {

            if (
                event.target === box
            ) {

                box.remove();

            }

        };

}


/* =========================================================
   20. ADMIN MANAGEMENT BUTTONS
   ========================================================= */

document
    .querySelectorAll(
        ".admin-manage-card"
    )
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                openManagement(
                    button.dataset.management
                );

            }
        );

    });


const closeManagementButton =
    document.getElementById(
        "closeManagement"
    );


if (closeManagementButton) {

    closeManagementButton.addEventListener(
        "click",
        closeManagement
    );

}


if (managementBackdrop) {

    managementBackdrop.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                managementBackdrop
            ) {

                closeManagement();

            }

        }
    );

}


/* =========================================================
   21. ADMIN EDIT FUNCTIONS
   ========================================================= */

function openEdit(kind) {

    const editBackdrop =
        document.getElementById(
            "edit-backdrop"
        );

    const editContent =
        document.getElementById(
            "editContent"
        );


    if (
        !editBackdrop ||
        !editContent
    ) {

        return;
    }


    let title = "";

    let description = "";

    let fields = "";


    if (kind === "heading") {

        title =
            "Edit Complaint Page";

        description =
            "Update the logo letter, page title and description.";


        const heading =
            document.querySelector(
                ".page-heading h1"
            );


        const paragraph =
            document.querySelector(
                ".page-heading p:not(.eyebrow)"
            );


        fields = `

            <label>
                Logo Letter

                <input
                    id="editLogo"
                    value="R"
                >

            </label>


            <label>
                Title

                <input
                    id="editTitle"
                    value="${
                        heading
                            ? escapeHTML(
                                heading.textContent
                              )
                            : ""
                    }"
                >

            </label>


            <label>
                Description

                <textarea
                    id="editDesc"
                >${
                    paragraph
                        ? escapeHTML(
                            paragraph.textContent
                          )
                        : ""
                }</textarea>

            </label>

        `;

    }


    else if (
        kind === "management"
    ) {

        title =
            "Manage Admin Buttons";

        description =
            "Edit the two management button labels and descriptions.";


        fields = `

            <label>
                Complaints Label

                <input
                    id="editComplaintsLabel"
                    value="Complaints"
                >

            </label>


            <label>
                Complaints Description

                <input
                    id="editComplaintsDesc"
                    value="Review submitted complaints and attached proof."
                >

            </label>


            <label>
                Applications Label

                <input
                    id="editApplicationsLabel"
                    value="Applications"
                >

            </label>


            <label>
                Applications Description

                <input
                    id="editApplicationsDesc"
                    value="Review student applications and submitted documents."
                >

            </label>

        `;

    }


    else {

        title =
            "Edit Student Support Desk";

        description =
            "Update the support name, designation, email and location.";


        const supportEmail =
            document.getElementById(
                "supportEmail"
            );

        const supportLocation =
            document.getElementById(
                "supportLocation"
            );


        fields = `

            <label>
                Support Name

                <input
                    id="editSupportName"
                    value="Student Support Desk"
                >

            </label>


            <label>
                Designation

                <input
                    id="editSupportDesignation"
                    value="Complaint Resolution & Student Welfare"
                >

            </label>


            <label>Email<input id="editSupportEmail" value="${document.getElementById('supportEmail').textContent.trim()}"></label>


            <label>
                Location

                <input
                    id="editSupportLocation"
                    value="${
                        supportLocation
                            ? escapeHTML(
                                supportLocation.textContent
                              )
                            : ""
                    }"
                >

            </label>

        `;

    }


    editContent.innerHTML = `

        <h2>
            ${escapeHTML(title)}
        </h2>

        <p>
            ${escapeHTML(description)}
        </p>

        <div class="edit-form">

            ${fields}

            <button
                type="button"
                class="edit-save"
                id="editSave"
            >
                Save Changes
            </button>

        </div>

    `;


    editBackdrop.classList.remove(
        "hidden"
    );


    document.body.style.overflow =
        "hidden";


    const saveButton =
        document.getElementById(
            "editSave"
        );


    if (!saveButton) {
        return;
    }


    saveButton.onclick =
        () => {

            if (
                kind === "heading"
            ) {

                const logo =
                    document.getElementById(
                        "editLogo"
                    );

                const pageTitle =
                    document.getElementById(
                        "editTitle"
                    );

                const pageDescription =
                    document.getElementById(
                        "editDesc"
                    );


                const brandMark =
                    document.querySelector(
                        ".brand-mark"
                    );

                const heading =
                    document.querySelector(
                        ".page-heading h1"
                    );

                const paragraph =
                    document.querySelector(
                        ".page-heading p:not(.eyebrow)"
                    );


                if (
                    brandMark &&
                    logo
                ) {

                    brandMark.textContent =
                        logo.value || "R";
                }


                if (
                    heading &&
                    pageTitle
                ) {

                    heading.textContent =
                        pageTitle.value;
                }


                if (
                    paragraph &&
                    pageDescription
                ) {

                    paragraph.textContent =
                        pageDescription.value;
                }

            }


            else if (
                kind === "management"
            ) {

                const cards =
                    document.querySelectorAll(
                        ".admin-manage-card"
                    );


                if (cards.length >= 2) {

                    const complaintsLabel =
                        document.getElementById(
                            "editComplaintsLabel"
                        );

                    const complaintsDescription =
                        document.getElementById(
                            "editComplaintsDesc"
                        );

                    const applicationsLabel =
                        document.getElementById(
                            "editApplicationsLabel"
                        );

                    const applicationsDescription =
                        document.getElementById(
                            "editApplicationsDesc"
                        );


                    const firstStrong =
                        cards[0].querySelector(
                            "strong"
                        );

                    const firstSmall =
                        cards[0].querySelector(
                            "small"
                        );

                    const secondStrong =
                        cards[1].querySelector(
                            "strong"
                        );

                    const secondSmall =
                        cards[1].querySelector(
                            "small"
                        );


                    if (
                        firstStrong &&
                        complaintsLabel
                    ) {

                        firstStrong.textContent =
                            complaintsLabel.value;
                    }


                    if (
                        firstSmall &&
                        complaintsDescription
                    ) {

                        firstSmall.textContent =
                            complaintsDescription.value;
                    }


                    if (
                        secondStrong &&
                        applicationsLabel
                    ) {

                        secondStrong.textContent =
                            applicationsLabel.value;
                    }


                    if (
                        secondSmall &&
                        applicationsDescription
                    ) {

                        secondSmall.textContent =
                            applicationsDescription.value;
                    }

                }

            }


            else {

                const supportName =
                    document.getElementById(
                        "editSupportName"
                    );

                const supportDesignation =
                    document.getElementById(
                        "editSupportDesignation"
                    );

                const supportEmail =
                    document.getElementById(
                        "editSupportEmail"
                    );

                const supportLocation =
                    document.getElementById(
                        "editSupportLocation"
                    );


                const contactHeading =
                    document.querySelector(
                        ".contact-main h2"
                    );

                const contactDescription =
                    document.querySelector(
                        ".contact-main p:not(.eyebrow)"
                    );


                if (
                    contactHeading &&
                    supportName
                ) {

                    contactHeading.textContent =
                        supportName.value;
                }


                if (
                    contactDescription &&
                    supportDesignation
                ) {

                    contactDescription.textContent =
                        supportDesignation.value;
                }


                const emailElement =
                    document.getElementById(
                        "supportEmail"
                    );


                const locationElement =
                    document.getElementById(
                        "supportLocation"
                    );


                if (
                    emailElement &&
                    supportEmail
                ) {

                    emailElement.textContent =
                        supportEmail.value;
                }


                if (
                    locationElement &&
                    supportLocation
                ) {

                    locationElement.textContent =
                        supportLocation.value;
                }

            }


            editBackdrop.classList.add(
                "hidden"
            );


            document.body.style.overflow =
                "";

        };

}


/* =========================================================
   22. EDIT BUTTONS
   ========================================================= */

const editHeadingButton =
    document.getElementById(
        "editHeading"
    );


const editManagementButton =
    document.getElementById(
        "editManagement"
    );


const editSupportButton =
    document.getElementById(
        "editSupport"
    );


const editCloseButton =
    document.getElementById(
        "editClose"
    );


if (editHeadingButton) {

    editHeadingButton.addEventListener(
        "click",
        () => openEdit("heading")
    );

}


if (editManagementButton) {

    editManagementButton.addEventListener(
        "click",
        () => openEdit("management")
    );

}


if (editSupportButton) {

    editSupportButton.addEventListener(
        "click",
        () => openEdit("support")
    );

}


if (editCloseButton) {

    editCloseButton.addEventListener(
        "click",
        () => {

            const editBackdrop =
                document.getElementById(
                    "edit-backdrop"
                );


            if (editBackdrop) {

                editBackdrop.classList.add(
                    "hidden"
                );

                document.body.style.overflow =
                    "";

            }

        }
    );

}


/* =========================================================
   23. ADMIN COUNTS
   ========================================================= */

function updateAdminCounts() {

    const complaintsCount =
        document.getElementById(
            "complaintsAdminCount"
        );


    const applicationsCount =
        document.getElementById(
            "applicationsAdminCount"
        );


    if (complaintsCount) {

        complaintsCount.textContent =
            complaints.length;

    }


    if (applicationsCount) {

        applicationsCount.textContent =
            applicationSeed.length;

    }

}


/* =========================================================
   24. ADMIN DASHBOARD
   ========================================================= */

const dashboardBackdrop =
    document.getElementById(
        "dashboard-backdrop"
    );


const dashboardSidebar =
    document.getElementById(
        "dashboard-sidebar"
    );


const dashboardEditorBackdrop =
    document.getElementById(
        "dashboard-editor-backdrop"
    );


const dashboardEditor =
    document.getElementById(
        "dashboardEditor"
    );


const adminAccount = {

    username:
        "Complaint Admin",

    email:
        "admin@rgukt.ac.in",

    password:
        "admin123"

};


function refreshDashboard() {

    const username =
        document.getElementById(
            "dashboardUsername"
        );


    const email =
        document.getElementById(
            "dashboardEmail"
        );


    if (username) {

        username.textContent =
            adminAccount.username;
    }


    if (email) {

        email.textContent =
            adminAccount.email;

        email.href =
            "mailto:" +
            adminAccount.email;
    }

}


function openDashboard() {

    refreshDashboard();


    if (dashboardBackdrop) {

        dashboardBackdrop.classList.remove(
            "hidden"
        );
    }


    if (dashboardSidebar) {

        dashboardSidebar.classList.add(
            "show"
        );
    }


    document.body.style.overflow =
        "hidden";

}


function closeDashboard() {

    if (dashboardSidebar) {

        dashboardSidebar.classList.remove(
            "show"
        );
    }


    if (dashboardBackdrop) {

        dashboardBackdrop.classList.add(
            "hidden"
        );
    }


    document.body.style.overflow =
        "";

}


function closeDashboardEditor() {

    if (dashboardEditorBackdrop) {

        dashboardEditorBackdrop.classList.add(
            "hidden"
        );
    }


    if (dashboardEditor) {

        dashboardEditor.innerHTML =
            "";
    }

}


const openDashboardButton =
    document.getElementById(
        "openDashboard"
    );


const dashboardCloseButton =
    document.getElementById(
        "dashboardClose"
    );


const dashboardEditorCloseButton =
    document.getElementById(
        "dashboardEditorClose"
    );


if (openDashboardButton) {

    openDashboardButton.addEventListener(
        "click",
        openDashboard
    );

}


if (dashboardCloseButton) {

    dashboardCloseButton.addEventListener(
        "click",
        closeDashboard
    );

}


if (dashboardBackdrop) {

    dashboardBackdrop.addEventListener(
        "click",
        closeDashboard
    );

}


if (dashboardEditorCloseButton) {

    dashboardEditorCloseButton.addEventListener(
        "click",
        closeDashboardEditor
    );

}


if (dashboardEditorBackdrop) {

    dashboardEditorBackdrop.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                dashboardEditorBackdrop
            ) {

                closeDashboardEditor();

            }

        }
    );

}


/* =========================================================
   25. DASHBOARD EDITOR
   ========================================================= */

function openEditor(mode) {

    if (!dashboardEditorBackdrop ||
        !dashboardEditor) {

        return;
    }


    dashboardEditorBackdrop.classList.remove(
        "hidden"
    );


    if (mode === "profile") {

        dashboardEditor.innerHTML = `

            <p class="eyebrow">
                PROFILE
            </p>

            <h2>
                Change Profile
            </h2>

            <label>
                Display Name
            </label>

            <input
                id="dashboardNameInput"
                value="${escapeHTML(
                    adminAccount.username
                )}"
            >

            <label>
                Email
            </label>

            <input
                id="dashboardEmailInput"
                type="email"
                value="${escapeHTML(
                    adminAccount.email
                )}"
            >

            <button
                type="button"
                class="dashboard-save"
                id="dashboardSave"
            >
                Save Changes
            </button>

        `;


        const save =
            document.getElementById(
                "dashboardSave"
            );


        if (save) {

            save.onclick =
                () => {

                    const name =
                        document.getElementById(
                            "dashboardNameInput"
                        ).value.trim();


                    const email =
                        document.getElementById(
                            "dashboardEmailInput"
                        ).value.trim();


                    if (
                        !name ||
                        !email
                    ) {

                        return;
                    }


                    adminAccount.username =
                        name;

                    adminAccount.email =
                        email;


                    refreshDashboard();

                    closeDashboardEditor();

                };

        }

    }


    else if (
        mode === "password"
    ) {

        const registeredEmail =
            adminAccount.email;


        dashboardEditor.innerHTML = `

            <p class="eyebrow">
                SECURITY
            </p>

            <h2>
                Change Password
            </h2>

            <p>
                For security, the password cannot
                be changed directly here. A secure
                password reset link will be sent to
                the registered email address below.
            </p>

            <div class="registered-email-card">

                <i class="
                    fa-solid
                    fa-envelope-circle-check
                "></i>

                <div>

                    <span>
                        REGISTERED EMAIL
                    </span>

                    <strong>
                        ${escapeHTML(
                            registeredEmail
                        )}
                    </strong>

                </div>

            </div>

            <div
                id="resetNotice"
                class="reset-notice"
            ></div>

            <button
                type="button"
                class="dashboard-save"
                id="dashboardSave"
            >

                <i class="
                    fa-solid
                    fa-paper-plane
                "></i>

                Send Reset Link

            </button>

        `;


        const save =
            document.getElementById(
                "dashboardSave"
            );


        if (save) {

            save.onclick =
                () => {

                    const notice =
                        document.getElementById(
                            "resetNotice"
                        );


                    if (notice) {

                        notice.innerHTML = `

                            <i class="
                                fa-solid
                                fa-circle-check
                            "></i>

                            Password reset link has
                            been sent to

                            <strong>
                                ${escapeHTML(
                                    registeredEmail
                                )}
                            </strong>.

                        `;

                        notice.classList.add(
                            "show"
                        );

                    }

                };

        }

    }


    else if (
        mode === "settings"
    ) {

        dashboardEditor.innerHTML = `

            <p class="eyebrow">
                ACCOUNT SETTINGS
            </p>

            <h2>
                Update Email
            </h2>

            <p>
                Use this email for account
                notifications and password recovery.
            </p>

            <label>
                Email Address
            </label>

            <input
                id="dashboardEmailInput"
                type="email"
                value="${escapeHTML(
                    adminAccount.email
                )}"
            >

            <button
                type="button"
                class="dashboard-save"
                id="dashboardSave"
            >
                Save Email
            </button>

        `;


        const save =
            document.getElementById(
                "dashboardSave"
            );


        if (save) {

            save.onclick =
                () => {

                    const email =
                        document.getElementById(
                            "dashboardEmailInput"
                        ).value.trim();


                    if (!email) {
                        return;
                    }


                    adminAccount.email =
                        email;


                    refreshDashboard();

                    closeDashboardEditor();

                };

        }

    }

}


/* =========================================================
   26. DASHBOARD BUTTONS
   ========================================================= */

const changeUsername =
    document.getElementById(
        "changeUsername"
    );


const changePassword =
    document.getElementById(
        "changePassword"
    );


const changeEmail =
    document.getElementById(
        "changeEmail"
    );


if (changeUsername) {

    changeUsername.addEventListener(
        "click",
        () => openEditor("profile")
    );

}


if (changePassword) {

    changePassword.addEventListener(
        "click",
        () => openEditor("password")
    );

}


if (changeEmail) {

    changeEmail.addEventListener(
        "click",
        () => openEditor("settings")
    );

}


/* =========================================================
   27. INITIALIZE PAGE
   ========================================================= */

console.log(
    "Campus Connect complaint admin JavaScript loaded."
);


/*
 * First show an empty/loading state.
 */

renderComplaints();


/*
 * Then load the real complaints from MySQL.
 */

loadComplaintsFromDatabase();


/*
 * Initialize counts.
 */

updateAdminCounts();


/*
 * Initialize dashboard.
 */

refreshDashboard();
/* =========================================================
   CONTACT NAVIGATION
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    // Select ALL Contact links
    const contactLinks = document.querySelectorAll('a[href="#contact"]');

    // Existing Contact card
    const contactCard = document.getElementById("contact");

    if (contactLinks.length && contactCard) {

        contactLinks.forEach(function (contactLink) {

            contactLink.addEventListener("click", function (event) {

                event.preventDefault();

                // Smoothly scroll to the Contact card
                contactCard.scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                });

                // Highlight the Contact card
                contactCard.classList.add("highlight-contact");

                // Remove highlight after 2 seconds
                setTimeout(function () {
                    contactCard.classList.remove("highlight-contact");
                }, 2000);

            });

        });

    }

});
// =========================================================
// ADMIN COMPLAINT SEARCH
// =========================================================

const adminComplaintSearch =
    document.getElementById("admin-complaint-search");

if (adminComplaintSearch) {

    adminComplaintSearch.addEventListener("input", function (event) {

        // Keep the search box focused
        event.preventDefault();

        const search = this.value.toLowerCase().trim();

        const rows = document.querySelectorAll(".complaint-row");

        rows.forEach(function (row) {

            const text = row.innerText.toLowerCase();

            if (search === "" || text.includes(search)) {
                row.style.display = "";
            } else {
                row.style.display = "none";
            }

        });

    });

}