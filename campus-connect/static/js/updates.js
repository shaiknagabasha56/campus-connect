/* ============================================================
   CAMPUS CONNECT — SHARED UPDATES MODULE (v2, self-contained)
   ============================================================ */

(() => {
    "use strict";

    const API_URL = "/updates";
    let currentEditId = null;

    const $ = (s, root = document) => root.querySelector(s);
    const $$ = (s, root = document) => Array.from(root.querySelectorAll(s));

    /* ============================================================
       SMALL HELPERS
       ============================================================ */

    function notify(message) {
        const t = $("#adminToast");

        if (t) {
            t.textContent = message;
            t.classList.add("show");

            setTimeout(() => t.classList.remove("show"), 2200);
            return;
        }

        alert(message);
    }

    function escapeHtml(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function formatDate(value) {
        if (!value) return "";

        const dateValue = String(value).substring(0, 10);
        const date = new Date(`${dateValue}T00:00:00`);

        if (Number.isNaN(date.getTime())) {
            return dateValue;
        }

        return date.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    }

    function formatTime(value) {
        if (!value) return "";
        return String(value).substring(0, 5);
    }

    function toInputDate(value) {
        if (!value) return "";
        return String(value).substring(0, 10);
    }

    /*
     * ============================================================
     * IMAGE URL HELPER
     * ============================================================
     *
     * Cloudinary returns a complete URL:
     *
     * https://res.cloudinary.com/...
     *
     * Old/local images may look like:
     *
     * images/example.jpg
     *
     * So:
     * - Full http/https URL -> use directly
     * - Local path -> prepend /static/
     */

    function getImageUrl(image) {
        if (!image) return "";

        if (
            image.startsWith("http://") ||
            image.startsWith("https://")
        ) {
            return image;
        }

        return `/static/${image}`;
    }

    async function apiRequest(url, options = {}) {
        const response = await fetch(url, {
            credentials: "same-origin",
            ...options
        });

        const text = await response.text();

        let data = {};

        try {
            data = text ? JSON.parse(text) : {};
        } catch (error) {
            console.error(
                "Invalid server response:",
                response.status,
                text
            );

            throw new Error("Invalid response from server.");
        }

        if (!response.ok || data.success === false) {
            throw new Error(
                data.message || `Request failed (${response.status})`
            );
        }

        return data;
    }

    function getUpdatesContainer() {
        return (
            $(".na-updates-list") ||
            $(".updates-list") ||
            $("#updatesList")
        );
    }

    /* ============================================================
       CARD RENDERING
       ============================================================ */

    function applyUpdateData(element, update) {
        if (!element || !update) return;

        // FIX:
        // Supports both Cloudinary URLs and local static paths.
        const imageUrl = getImageUrl(update.cover_image);

        element.dataset.updateId = update.id ?? "";
        element.dataset.title = update.title || "";
        element.dataset.category = update.category_tag || "";

        element.dataset.uploadDate = formatDate(update.post_date);
        element.dataset.uploadTime = formatTime(update.post_time);

        element.dataset.postDate = toInputDate(update.post_date);
        element.dataset.postTime = formatTime(update.post_time);

        element.dataset.eventDate = toInputDate(update.event_date);
        element.dataset.deadline = toInputDate(update.deadline);

        element.dataset.description = update.description || "";
        element.dataset.email = update.contact_email || "";

        element.dataset.apply =
            (
                Number(update.enable_application) === 1 ||
                update.enable_application === true ||
                update.enable_application === "true"
            )
                ? "true"
                : "false";

        element.dataset.applyLink = update.application_url || "";

        // Store the correct image URL.
        element.dataset.image = imageUrl;

        const dateEl = element.querySelector(".na-update-date");
        const titleEl = element.querySelector(".na-update-title");
        const bodyEl = element.querySelector(".na-update-body");

        if (dateEl) {
            const date = element.dataset.uploadDate;
            const time = element.dataset.uploadTime;

            dateEl.textContent =
                date + (time ? ` ${time}` : "");
        }

        if (titleEl) {
            titleEl.textContent = update.title || "";
        }

        if (bodyEl) {
            const d = update.description || "";

            bodyEl.textContent =
                d.length > 180
                    ? `${d.slice(0, 180)}…`
                    : d;
        }
    }

    function createUpdateElement(update) {
        const card = document.createElement("button");

        card.type = "button";

        card.className =
            "na-update-item na-update-clickable admin-update-item";

        card.innerHTML = `
            <span class="na-update-marker"></span>

            <span class="na-update-content">

                <span class="na-update-date"></span>

                <span class="na-update-title"></span>

                <span class="na-update-body"></span>

                <span class="na-update-click-hint">
                    <i class="fa-solid fa-arrow-up-right-from-square"></i>
                    Click to view details
                </span>

                <span
                    class="admin-update-pencil"
                    role="button"
                    tabindex="0"
                    title="Edit update"
                >
                    <i class="fa-solid fa-pen"></i>
                </span>

            </span>
        `;

        applyUpdateData(card, update);

        bindCard(card);

        return card;
    }

    /*
     * Pencil = edit
     * Rest of card = preview
     */

    function bindCard(card) {
        card.style.cursor = "pointer";

        card.addEventListener("click", (event) => {
            if (
                event.target.closest(
                    ".admin-update-pencil"
                )
            ) {
                return;
            }

            openUpdatePreview(card);
        });

        const pencil =
            card.querySelector(".admin-update-pencil");

        if (pencil) {
            pencil.addEventListener("click", (event) => {
                event.preventDefault();
                event.stopPropagation();

                const id = card.dataset.updateId;

                if (id) {
                    openEditForm(id);
                }
            });
        }
    }

    async function loadUpdates() {
        const container = getUpdatesContainer();

        if (!container) return [];

        try {
            const result = await apiRequest(API_URL);

            const updates = Array.isArray(result.updates)
                ? result.updates
                : [];

            container.innerHTML = "";

            updates.forEach((update) => {
                container.appendChild(
                    createUpdateElement(update)
                );
            });

            return updates;

        } catch (error) {
            console.error(
                "Failed to load updates:",
                error
            );

            notify(
                "Could not load updates from the server."
            );

            return [];
        }
    }

    /* ============================================================
       ADMIN MODAL
       ============================================================ */

    function openAdminModal(kicker, title) {
        const modal = $("#adminModal");

        if (!modal) return;

        const k = $("#adminKicker");
        const t = $("#adminModalTitle");

        if (k) {
            k.textContent = kicker;
        }

        if (t) {
            t.textContent = title;
        }

        modal.classList.remove("hidden");
    }

    function closeAdminModal() {
        const modal = $("#adminModal");

        if (!modal) return;

        modal.classList.add("hidden");

        const body = $("#adminModalBody");

        if (body) {
            body.innerHTML = "";
        }

        currentEditId = null;
    }

    function bindModalClose() {
        $$("[data-admin-close]").forEach(
            (b) => (b.onclick = closeAdminModal)
        );
    }

    /* ============================================================
       FORM FIELD BUILDERS
       ============================================================ */

    function field(
        label,
        id,
        type = "text",
        value = "",
        opts = {}
    ) {
        if (type === "textarea") {
            return `
                <div class="admin-field ${opts.full ? "full" : ""}">

                    <label>
                        ${label}
                        ${
                            opts.required
                                ? ' <span>*</span>'
                                : ""
                        }
                    </label>

                    <textarea
                        id="${id}"
                        rows="5"
                        maxlength="${opts.max || 1000}"
                    >${escapeHtml(value)}</textarea>

                    <div class="admin-count">
                        <span id="${id}Count">
                            ${(value || "").length}
                        </span>
                        /${opts.max || 1000}
                    </div>

                </div>
            `;
        }

        if (type === "select") {
            return `
                <div class="admin-field ${opts.full ? "full" : ""}">

                    <label>${label}</label>

                    <select id="${id}">
                        ${opts.options
                            .map(
                                (o) => `
                                    <option
                                        ${
                                            o === value
                                                ? "selected"
                                                : ""
                                        }
                                    >
                                        ${o}
                                    </option>
                                `
                            )
                            .join("")}
                    </select>

                </div>
            `;
        }

        return `
            <div class="admin-field ${opts.full ? "full" : ""}">

                <label>
                    ${label}
                    ${
                        opts.required
                            ? ' <span>*</span>'
                            : ""
                    }
                </label>

                <input
                    id="${id}"
                    type="${type}"
                    value="${escapeHtml(value)}"
                    ${
                        opts.max
                            ? `maxlength="${opts.max}"`
                            : ""
                    }
                >

            </div>
        `;
    }

    function imageField(id, label) {
        return `
            <div class="admin-field full admin-upload">

                <label>${label}</label>

                <div
                    id="${id}Preview"
                    class="admin-upload-preview"
                >
                    No image selected
                </div>

                <input
                    id="${id}"
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp"
                >

                <small class="admin-help">
                    JPG, PNG or WEBP · maximum 5 MB
                </small>

                <div class="admin-error"></div>

            </div>
        `;
    }

    function actions(
        label = "Save Changes",
        extra = ""
    ) {
        return `
            <div class="admin-actions">

                ${extra}

                <button
                    class="admin-secondary"
                    type="button"
                    data-admin-close
                >
                    Cancel
                </button>

                <button
                    class="admin-primary"
                    type="button"
                    id="adminSave"
                >
                    ${label}
                </button>

            </div>
        `;
    }

    function bindCount(id) {
        const el = $("#" + id);
        const count = $("#" + id + "Count");

        if (el && count) {
            el.oninput = () => {
                count.textContent = el.value.length;
            };
        }
    }

    function bindImage(id, existing = "") {
        const input = $("#" + id);
        const preview = $("#" + id + "Preview");

        if (!input || !preview) return;

        if (existing) {
            preview.style.backgroundImage =
                `url('${existing}')`;

            preview.textContent = "";
        }

        input.onchange = () => {
            const file = input.files[0];

            const error =
                input.parentElement.querySelector(
                    ".admin-error"
                );

            if (!file) return;

            if (
                ![
                    "image/jpeg",
                    "image/png",
                    "image/webp"
                ].includes(file.type)
            ) {
                error.textContent =
                    "Use JPG, PNG or WEBP only.";

                return;
            }

            if (file.size > 5 * 1024 * 1024) {
                error.textContent =
                    "Image must be 5 MB or smaller.";

                return;
            }

            error.textContent = "";

            const reader = new FileReader();

            reader.onload = () => {
                preview.style.backgroundImage =
                    `url('${reader.result}')`;

                preview.textContent = "";
            };

            reader.readAsDataURL(file);
        };
    }

    /* ============================================================
       ADD / EDIT FORM
       ============================================================ */

    const CATEGORY_OPTIONS = [
        "Event",
        "Activity",
        "Hackathon",
        "Project",
        "Meeting",
        "Competition",
        "Announcement",
        "Workshop",
        "Other"
    ];

    function mapUpdateRecord(update) {
        return {
            title: update.title || "",

            category:
                update.category_tag ||
                "Announcement",

            postDate:
                toInputDate(update.post_date),

            postTime:
                formatTime(update.post_time),

            eventDate:
                toInputDate(update.event_date),

            deadline:
                toInputDate(update.deadline),

            description:
                update.description || "",

            email:
                update.contact_email || "",

            apply:
                Number(update.enable_application) === 1 ||
                update.enable_application === true ||
                update.enable_application === "true",

            applyLink:
                update.application_url || "",

            // FIX:
            // Supports Cloudinary URLs and local paths.
            image:
                getImageUrl(update.cover_image)
        };
    }

    function renderUpdateForm(d, id) {
        currentEditId = id || null;

        openAdminModal(
            id
                ? "EDIT UPDATE"
                : "CREATE UPDATE",

            id
                ? "Edit Update"
                : "Create New Update"
        );

        const body = $("#adminModalBody");

        if (!body) return;

        body.innerHTML = `
            <div class="admin-form-grid">

                ${imageField(
                    "updateImage",
                    "Cover Image"
                )}

                ${field(
                    "Category Tag",
                    "uCategory",
                    "select",
                    d.category || "Announcement",
                    {
                        options: CATEGORY_OPTIONS
                    }
                )}

                ${field(
                    "Title",
                    "uTitle",
                    "text",
                    d.title || "",
                    {
                        full: true,
                        max: 100,
                        required: true
                    }
                )}

                ${field(
                    "Post Date",
                    "uPostDate",
                    "date",
                    d.postDate || "",
                    {
                        required: true
                    }
                )}

                ${field(
                    "Post Time",
                    "uPostTime",
                    "time",
                    d.postTime || ""
                )}

                ${field(
                    "Event / Activity Date",
                    "uEventDate",
                    "date",
                    d.eventDate || ""
                )}

                ${field(
                    "Deadline",
                    "uDeadline",
                    "date",
                    d.deadline || ""
                )}

                ${field(
                    "Contact Email",
                    "uEmail",
                    "email",
                    d.email || ""
                )}

                ${field(
                    "Description",
                    "uDescription",
                    "textarea",
                    d.description || "",
                    {
                        full: true,
                        max: 1000,
                        required: true
                    }
                )}

                <div class="admin-field full">

                    <label>
                        <input
                            id="uApply"
                            type="checkbox"
                            ${
                                d.apply
                                    ? "checked"
                                    : ""
                            }
                        >

                        Enable Apply / Register Button
                    </label>

                </div>

                ${field(
                    "Application Form URL",
                    "uApplyLink",
                    "url",
                    d.applyLink || "",
                    {
                        full: true,
                        max: 500
                    }
                )}

            </div>

            ${actions(
                id
                    ? "Save Changes"
                    : "Create Update",

                id
                    ? `
                        <button
                            class="admin-danger"
                            id="deleteUpdate"
                            type="button"
                        >
                            Delete Update
                        </button>
                    `
                    : ""
            )}
        `;

        bindCount("uDescription");

        bindImage(
            "updateImage",
            d.image
        );

        bindModalClose();

        $("#adminSave").onclick =
            saveFromForm;

        const del =
            $("#deleteUpdate");

        if (del) {
            del.onclick = () => {

                if (
                    !confirm(
                        "Are you sure you want to delete this update?"
                    )
                ) {
                    return;
                }

                deleteUpdateById(
                    currentEditId
                );
            };
        }
    }

    function openAddForm() {
        renderUpdateForm({}, null);
    }

    async function openEditForm(id) {
        try {
            const result =
                await apiRequest(
                    `${API_URL}/${id}`
                );

            renderUpdateForm(
                mapUpdateRecord(result.update),
                id
            );

        } catch (error) {

            console.error(
                "Failed to load update:",
                error
            );

            notify(
                error.message ||
                "Failed to load update."
            );
        }
    }

    function validateForm() {
        const title =
            $("#uTitle")?.value.trim();

        const category =
            $("#uCategory")?.value;

        const description =
            $("#uDescription")?.value.trim();

        const postDate =
            $("#uPostDate")?.value;

        if (!title) {
            notify(
                "Please enter an update title."
            );

            return false;
        }

        if (!category) {
            notify(
                "Please select a category."
            );

            return false;
        }

        if (!postDate) {
            notify(
                "Please select the post date."
            );

            return false;
        }

        if (!description) {
            notify(
                "Please enter a description."
            );

            return false;
        }

        return true;
    }

    function buildFormData() {
        const formData =
            new FormData();

        formData.append(
            "title",
            $("#uTitle")?.value.trim() || ""
        );

        formData.append(
            "category_tag",
            $("#uCategory")?.value || ""
        );

        formData.append(
            "post_date",
            $("#uPostDate")?.value || ""
        );

        formData.append(
            "post_time",
            $("#uPostTime")?.value || ""
        );

        formData.append(
            "event_date",
            $("#uEventDate")?.value || ""
        );

        formData.append(
            "deadline",
            $("#uDeadline")?.value || ""
        );

        formData.append(
            "description",
            $("#uDescription")?.value.trim() || ""
        );

        formData.append(
            "contact_email",
            $("#uEmail")?.value.trim() || ""
        );

        formData.append(
            "enable_application",
            $("#uApply")?.checked
                ? "true"
                : "false"
        );

        formData.append(
            "application_url",
            $("#uApplyLink")?.value.trim() || ""
        );

        const imageInput =
            $("#updateImage");

        if (
            imageInput?.files?.[0]
        ) {
            formData.append(
                "cover_image",
                imageInput.files[0]
            );
        }

        return formData;
    }

    async function saveFromForm() {
        if (!validateForm()) return;

        const formData =
            buildFormData();

        try {

            const result =
                currentEditId

                    ? await apiRequest(
                        `${API_URL}/${currentEditId}`,
                        {
                            method: "POST",
                            body: formData
                        }
                    )

                    : await apiRequest(
                        API_URL,
                        {
                            method: "POST",
                            body: formData
                        }
                    );

            await loadUpdates();

            closeAdminModal();

            notify(
                result.message ||
                "Update saved successfully."
            );

        } catch (error) {

            console.error(
                "Save update failed:",
                error
            );

            notify(
                error.message ||
                "Failed to save update."
            );
        }
    }

    async function deleteUpdateById(id) {
        if (!id) {
            notify(
                "No update selected."
            );

            return;
        }

        try {

            const result =
                await apiRequest(
                    `${API_URL}/${id}`,
                    {
                        method: "DELETE"
                    }
                );

            await loadUpdates();

            closeAdminModal();

            notify(
                result.message ||
                "Update deleted successfully."
            );

        } catch (error) {

            console.error(
                "Delete update failed:",
                error
            );

            notify(
                error.message ||
                "Failed to delete update."
            );
        }
    }

    /* ============================================================
       MANAGE UPDATES
       ============================================================ */

    function openManageUpdatesModal() {
        openAdminModal(
            "UPDATES",
            "Manage Updates"
        );

        const body =
            $("#adminModalBody");

        if (!body) return;

        const cards =
            $$(".na-update-item",
                getUpdatesContainer() ||
                document
            );

        body.innerHTML = `
            <div class="admin-toolbar">

                <h3>
                    ${cards.length}
                    existing update${
                        cards.length === 1
                            ? ""
                            : "s"
                    }
                </h3>

                <button
                    class="admin-add"
                    id="addUpdate"
                    type="button"
                >
                    ＋ Add Update
                </button>

            </div>

            <div class="admin-list">

                ${
                    cards.length

                        ? cards
                            .map(
                                (el) => `
                                    <div
                                        class="admin-list-item"
                                    >

                                        <div>

                                            <strong>
                                                ${escapeHtml(
                                                    el.dataset.title ||
                                                    "Untitled"
                                                )}
                                            </strong>

                                            <small>
                                                ${escapeHtml(
                                                    el.dataset.category ||
                                                    ""
                                                )}
                                            </small>

                                        </div>

                                        <div
                                            class="admin-list-actions"
                                        >

                                            <button
                                                class="admin-mini-btn"
                                                data-edit-id="${el.dataset.updateId}"
                                            >
                                                Edit
                                            </button>

                                            <button
                                                class="admin-mini-btn delete"
                                                data-delete-id="${el.dataset.updateId}"
                                            >
                                                Delete
                                            </button>

                                        </div>

                                    </div>
                                `
                            )
                            .join("")

                        : "<p>No updates yet.</p>"
                }

            </div>
        `;

        bindModalClose();

        $("#addUpdate").onclick =
            openAddForm;

        $$("[data-edit-id]")
            .forEach(
                (b) =>
                    (b.onclick = () =>
                        openEditForm(
                            b.dataset.editId
                        ))
            );

        $$("[data-delete-id]")
            .forEach(
                (b) =>
                    (b.onclick = () => {

                        if (
                            !confirm(
                                "Are you sure you want to delete this update?"
                            )
                        ) {
                            return;
                        }

                        deleteUpdateById(
                            b.dataset.deleteId
                        );
                    })
            );
    }

    /* ============================================================
       CLICK-TO-PREVIEW DETAIL MODAL
       ============================================================ */

    function openUpdatePreview(update) {
        const overlay =
            $("#updateModalOverlay");

        if (!overlay) return;

        const imageWrap =
            $("#updateModalImageWrap");

        const imageEl =
            $("#updateModalImage");

        const categoryEl =
            $("#updateModalCategory");

        const titleEl =
            $("#updateModalTitle");

        const uploaderEl =
            $("#updateModalUploader");

        const dateEl =
            $("#updateModalDate");

        const deadlineRow =
            $("#updateModalDeadlineRow");

        const deadlineEl =
            $("#updateModalDeadline");

        const descEl =
            $("#updateModalDesc");

        const contactRow =
            $("#updateModalContactRow");

        const emailLink =
            $("#updateModalEmail");

        const emailText =
            $("#updateModalEmailText");

        const applyBtn =
            $("#updateModalApply");

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

        if (titleEl) {
            titleEl.textContent =
                data.title ||
                "Untitled Update";
        }

        if (categoryEl) {

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
        }

        /*
         * ========================================================
         * CLOUDINARY IMAGE PREVIEW
         * ========================================================
         */

        if (imageEl && imageWrap) {

            if (data.image) {

                // data.image is now either:
                // 1. Cloudinary full URL
                // 2. /static/local-image path

                imageEl.src =
                    data.image;

                imageEl.alt =
                    data.title ||
                    "Update image";

                imageWrap.style.display =
                    "block";

                imageEl.onerror = () => {

                    console.error(
                        "Failed to load update image:",
                        data.image
                    );

                    imageWrap.style.display =
                        "none";
                };

            } else {

                imageEl.src = "";

                imageWrap.style.display =
                    "none";
            }
        }

        if (uploaderEl) {
            uploaderEl.textContent =
                data.uploadedBy || "—";
        }

        if (dateEl) {

            const parts = [];

            if (data.uploadDate) {
                parts.push(
                    data.uploadDate
                );
            }

            if (data.uploadTime) {
                parts.push(
                    data.uploadTime
                );
            }

            dateEl.textContent =
                parts.length
                    ? parts.join(" · ")
                    : "—";
        }

        if (
            deadlineRow &&
            deadlineEl
        ) {

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
        }

        if (descEl) {
            descEl.textContent =
                data.description || "";
        }

        if (
            contactRow &&
            emailLink &&
            emailText
        ) {

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
        }

        if (applyBtn) {

            if (data.apply === "true") {

                applyBtn.textContent =
                    "Apply Now";

                applyBtn.className =
                    "update-modal-apply enabled";

                applyBtn.disabled = false;

                applyBtn.onclick = () => {

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

            } else if (
                data.apply === "false"
            ) {

                applyBtn.textContent =
                    "Applications Closed";

                applyBtn.className =
                    "update-modal-apply disabled";

                applyBtn.disabled = true;

                applyBtn.onclick = null;

            } else {

                applyBtn.textContent = "";

                applyBtn.className =
                    "update-modal-apply hidden";

                applyBtn.disabled = true;

                applyBtn.onclick = null;
            }
        }

        overlay.classList.add("show");

        overlay.setAttribute(
            "aria-hidden",
            "false"
        );

        document.body.style.overflow =
            "hidden";
    }

    /* ============================================================
       INIT
       ============================================================ */

    function install() {

        // Take over the "Manage updates"
        // gear button.

        const gear =
            $('[data-edit-section="updates"]');

        if (gear) {
            gear.onclick =
                openManageUpdatesModal;
        }

        loadUpdates();

        // Academic and non-academic admin templates use the same dashboard
        // markup as clubs. Load the shared, database-backed inbox there too.
        if (document.getElementById("adminDataPage") &&
            !window.__campusInboxInitialized &&
            !document.getElementById("campusInboxScript")) {
            const inboxScript = document.createElement("script");
            inboxScript.id = "campusInboxScript";
            inboxScript.src = "/static/js/club_admin_submissions.js";
            document.head.appendChild(inboxScript);
        }
    }

    document.addEventListener(
        "DOMContentLoaded",
        () => {
            setTimeout(
                install,
                0
            );
        }
    );

    window.sharedUpdates = {

        loadUpdates,

        openAddForm,

        openEditForm,

        deleteUpdateById
    };

})();
