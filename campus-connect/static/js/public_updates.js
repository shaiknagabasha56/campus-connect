/* ============================================================
   CAMPUS CONNECT — PUBLIC UPDATES MODULE (read-only)

   Include this ONE file on every user-facing category page
   (academic / non-academic / clubs / cells). It fetches that
   page's live updates from the database and injects them into
   the page's existing "Latest Updates" section.

   It does NOT touch any of the 27 page-specific *.js files.
   Those files already build their search/filter/click-preview
   logic around ".na-update-item" elements — some via proper
   event delegation (feed-style academic/non-academic pages,
   e.g. cse.js), some via a one-time element snapshot (list-style
   club/cell pages, e.g. aws.js). This module knows which pattern
   each page uses and, for the snapshot pages, binds the click
   preview itself so newly-inserted cards still work.

   REQUIRES: the page's ".na-updates" wrapper must carry
   data-org-slug="<slug>", e.g. <section class="na-updates" data-org-slug="cse">
   ============================================================ */

(() => {
    "use strict";

    const $ = (s, root = document) => root.querySelector(s);
    const $$ = (s, root = document) => Array.from(root.querySelectorAll(s));

    /* ============================================================
       HELPERS
       ============================================================ */

    function escapeHtml(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // "2026-07-12" -> "12-07-2026" (matches this project's existing markup)
    function formatDateDMY(value) {
        if (!value) return "";
        const [y, m, d] = String(value).substring(0, 10).split("-");
        if (!y || !m || !d) return "";
        return `${d}-${m}-${y}`;
    }

    // "15:30:00" -> "3:30 PM"
    function formatTime12(value) {
        if (!value) return "";
        const [hStr, mStr] = String(value).split(":");
        let h = parseInt(hStr, 10);
        const m = (mStr || "00").padStart(2, "0");
        if (Number.isNaN(h)) return "";
        const suffix = h >= 12 ? "PM" : "AM";
        h = h % 12;
        if (h === 0) h = 12;
        return `${h}:${m} ${suffix}`;
    }

    // Heuristic only — the database has no "new/old" status field.
    // A post is "new" while it's within the last NEW_WINDOW_DAYS days.
    const NEW_WINDOW_DAYS = 14;
    function computeStatus(postDate) {
        if (!postDate) return "old";
        const posted = new Date(`${String(postDate).substring(0, 10)}T00:00:00`);
        if (Number.isNaN(posted.getTime())) return "old";
        const diffDays = (Date.now() - posted.getTime()) / 86400000;
        return diffDays <= NEW_WINDOW_DAYS ? "new" : "old";
    }

    function truncate(text, max = 150) {
        const value = text || "";
        return value.length > max ? value.slice(0, max).trim() + "…" : value;
    }

    async function fetchOrgUpdates(slug) {
        const response = await fetch(`/updates/organization/${encodeURIComponent(slug)}`, {
            credentials: "same-origin"
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || data.success === false) {
            throw new Error(data.message || `Failed to load updates (${response.status})`);
        }
        return data;
    }

    /* ============================================================
       FEED-STYLE PAGES (academic-pages / non-academic-pages)
       Container: .na-updates-feed, cards: <article>
       Page JS (e.g. cse.js) uses proper event delegation on the
       container for search/filter/click-preview, so we only need
       to inject the cards — everything else keeps working as-is.
       ============================================================ */

    function buildFeedCard(update, orgName) {
        const article = document.createElement("article");
        article.className = "na-update-item";
        article.setAttribute("role", "button");
        article.setAttribute("tabindex", "0");

        const date = formatDateDMY(update.post_date);
        const time = formatTime12(update.post_time);
        const image = imageUrl(update.cover_image);
        const applies = Number(update.enable_application) === 1 ||
            update.enable_application === true || update.enable_application === "true";

        article.dataset.status = computeStatus(update.post_date);
        article.dataset.title = update.title || "";
        article.dataset.date = date;
        article.dataset.time = time;
        article.dataset.uploadedBy = orgName || "";
        article.dataset.deadline = formatDateDMY(update.deadline);
        article.dataset.category = update.category_tag || "";
        article.dataset.categoryColor = "";
        article.dataset.email = update.contact_email || "";
        article.dataset.image = image;
        article.dataset.apply = applies ? "true" : "false";
        if (applies && update.application_url) article.dataset.applyLink = update.application_url;
        article.dataset.body = truncate(update.description, 150);
        article.dataset.full = update.description || "";

        article.innerHTML = `
            <div class="na-update-marker"></div>
            <div>
                <div class="na-update-date">${escapeHtml(date)}<span class="na-time">${escapeHtml(time)}</span></div>
                <p class="na-update-title">${escapeHtml(update.title || "")}</p>
                <p class="na-update-body">${escapeHtml(truncate(update.description, 150))}</p>
            </div>
        `;
        return article;
    }

    function renderFeed(container, updates, orgName) {
        container.innerHTML = "";
        updates.forEach((update) => container.appendChild(buildFeedCard(update, orgName)));
    }

    /* ============================================================
       LIST-STYLE PAGES (clubs-pages / cells-pages)
       Container: .na-updates-list, cards: <button>
       Page JS (e.g. aws.js) binds the filter buttons and the
       click-preview against a ONE-TIME element snapshot taken at
       DOMContentLoaded, so cards we insert afterwards are invisible
       to it. We bind the click-preview ourselves for every card
       this module creates (filter staleness is a separate, purely
       cosmetic, pre-existing issue — same one already noted on the
       admin side).
       ============================================================ */

    function buildListCard(update, orgName) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "na-update-item na-update-clickable";

        const uploadDate = formatDateDMY(update.post_date);
        const uploadTime = formatTime12(update.post_time);
        const image = imageUrl(update.cover_image);
        const applies = Number(update.enable_application) === 1 ||
            update.enable_application === true || update.enable_application === "true";

        button.dataset.status = computeStatus(update.post_date);
        button.dataset.title = update.title || "";
        button.dataset.image = image;
        button.dataset.uploadDate = uploadDate;
        button.dataset.uploadTime = uploadTime;
        button.dataset.uploadedBy = orgName || "";
        button.dataset.deadline = formatDateDMY(update.deadline);
        button.dataset.category = update.category_tag || "";
        button.dataset.categoryColor = "";
        button.dataset.description = update.description || "";
        button.dataset.email = update.contact_email || "";
        button.dataset.apply = applies ? "true" : "false";
        if (applies && update.application_url) button.dataset.applyLink = update.application_url;

        button.innerHTML = `
            <span class="na-update-marker"></span>
            <span class="na-update-content">
                <span class="na-update-date">${escapeHtml(uploadDate)}<span class="na-time">${escapeHtml(uploadTime)}</span></span>
                <span class="na-update-title">${escapeHtml(update.title || "")}</span>
                <span class="na-update-body">${escapeHtml(truncate(update.description, 150))}</span>
                <span class="na-update-click-hint"><i class="fa-solid fa-arrow-up-right-from-square"></i> Click to view details</span>
            </span>
        `;

        button.style.cursor = "pointer";
        button.addEventListener("click", () => openUpdatePreview(button));
        return button;
    }

    function renderList(container, updates, orgName) {
        container.innerHTML = "";
        updates.forEach((update) => container.appendChild(buildListCard(update, orgName)));
    }

    function imageUrl(value) {
        if (!value) return "";
        return /^https?:\/\//i.test(value) ? value : `/static/${value.replace(/^\/+/, "")}`;
    }

    function openStudentForm(kind, slug) {
        const existing = $("#sharedStudentRequest");
        if (existing) { existing.remove(); return; }
        const isComplaint = kind === "complaint";
        const overlay = document.createElement("div");
        overlay.id = "sharedStudentRequest";
        overlay.style.cssText = "position:fixed;inset:0;z-index:10000;background:rgba(15,23,42,.58);display:grid;place-items:center;padding:20px";
        overlay.innerHTML = `<form style="width:min(560px,100%);max-height:90vh;overflow:auto;background:#fff;border-radius:16px;padding:24px;display:grid;gap:10px;font-family:Poppins,sans-serif"><button type="button" data-close style="justify-self:end;border:0;padding:8px;cursor:pointer">Close</button><h2 style="margin:0">${isComplaint ? "Raise a Complaint" : "Submit Application"}</h2><label>Name<input name="name" required style="display:block;width:100%;padding:9px"></label><label>Email<input name="email" type="email" required style="display:block;width:100%;padding:9px"></label><label>Roll / ID<input name="roll" required style="display:block;width:100%;padding:9px"></label><label>Branch<input name="branch" style="display:block;width:100%;padding:9px"></label><label>Year<input name="year" style="display:block;width:100%;padding:9px"></label><label>Phone<input name="phone" style="display:block;width:100%;padding:9px"></label>${isComplaint ? '<label>Subject<input name="title" required style="display:block;width:100%;padding:9px"></label><label>Complaint<textarea name="description" required rows="4" style="display:block;width:100%;padding:9px"></textarea></label>' : '<label>Why are you applying?<textarea name="reason" rows="4" style="display:block;width:100%;padding:9px"></textarea></label>'}<button style="border:0;border-radius:8px;padding:12px;background:#2563eb;color:#fff;cursor:pointer" type="submit">Submit</button><p role="status" style="margin:0"></p></form>`;
        document.body.appendChild(overlay);
        const form = overlay.querySelector("form");
        overlay.querySelector("[data-close]").onclick = () => overlay.remove();
        overlay.onclick = event => { if (event.target === overlay) overlay.remove(); };
        form.onsubmit = async event => {
            event.preventDefault();
            const formData = new FormData(form);
            formData.set("organization_slug", slug);
            if (isComplaint) formData.set("category", "Department request");
            try {
                const response = await fetch(isComplaint ? "/complaints/submit" : "/complaints/club-submissions/applications", {method:"POST", body:formData, credentials:"same-origin"});
                const result = await response.json().catch(() => ({}));
                if (!response.ok || !result.success) throw new Error(result.message || "Could not submit your request.");
                form.querySelector("[role=status]").textContent = "Submitted successfully.";
                form.reset();
            } catch (error) { form.querySelector("[role=status]").textContent = error.message; }
        };
    }

    // Ports the exact same "#updateModalOverlay" logic every list-style
    // page's own JS already has (e.g. aws.js) — reused here only for
    // the cards this module creates itself.
    function openUpdatePreview(item) {
        const overlay = $("#updateModalOverlay");
        if (!overlay) return;

        const imageWrap = $("#updateModalImageWrap");
        const imageEl = $("#updateModalImage");
        const categoryEl = $("#updateModalCategory");
        const titleEl = $("#updateModalTitle");
        const uploaderEl = $("#updateModalUploader");
        const dateEl = $("#updateModalDate");
        const deadlineRow = $("#updateModalDeadlineRow");
        const deadlineEl = $("#updateModalDeadline");
        const descEl = $("#updateModalDesc");
        const contactRow = $("#updateModalContactRow");
        const emailLink = $("#updateModalEmail");
        const emailText = $("#updateModalEmailText");
        const applyBtn = $("#updateModalApply");

        const data = {
            title: item.dataset.title || "",
            image: item.dataset.image || "",
            uploadDate: item.dataset.uploadDate || "",
            uploadTime: item.dataset.uploadTime || "",
            uploadedBy: item.dataset.uploadedBy || "",
            deadline: item.dataset.deadline || "",
            category: item.dataset.category || "",
            categoryColor: item.dataset.categoryColor || "",
            description: item.dataset.description || "",
            email: item.dataset.email || "",
            apply: item.dataset.apply,
            applyLink: item.dataset.applyLink || ""
        };

        if (titleEl) titleEl.textContent = data.title || "Untitled Update";

        if (categoryEl) {
            if (data.category) {
                categoryEl.textContent = data.category;
                categoryEl.style.background = data.categoryColor || "var(--accent)";
                categoryEl.style.display = "inline-block";
            } else {
                categoryEl.style.display = "none";
            }
        }

        if (imageEl && imageWrap) {
            if (data.image) {
                imageEl.src = data.image;
                imageEl.alt = data.title || "Update image";
                imageWrap.style.display = "block";
                imageEl.onerror = () => (imageWrap.style.display = "none");
            } else {
                imageEl.src = "";
                imageWrap.style.display = "none";
            }
        }

        if (uploaderEl) uploaderEl.textContent = data.uploadedBy || "—";

        if (dateEl) {
            const parts = [];
            if (data.uploadDate) parts.push(data.uploadDate);
            if (data.uploadTime) parts.push(data.uploadTime);
            dateEl.textContent = parts.length ? parts.join(" · ") : "—";
        }

        if (deadlineRow && deadlineEl) {
            if (data.deadline) {
                deadlineEl.textContent = "Deadline: " + data.deadline;
                deadlineRow.classList.remove("hidden");
            } else {
                deadlineRow.classList.add("hidden");
            }
        }

        if (descEl) descEl.textContent = data.description || "";

        if (contactRow && emailLink && emailText) {
            if (data.email) {
                emailLink.href = "mailto:" + data.email;
                emailText.textContent = data.email;
                contactRow.classList.remove("hidden");
            } else {
                contactRow.classList.add("hidden");
            }
        }

        if (applyBtn) {
            if (data.apply === "true") {
                applyBtn.textContent = "Apply Now";
                applyBtn.className = "update-modal-apply enabled";
                applyBtn.disabled = false;
                applyBtn.onclick = () => {
                    if (data.applyLink) window.open(data.applyLink, "_blank", "noopener");
                };
            } else if (data.apply === "false") {
                applyBtn.textContent = "Applications Closed";
                applyBtn.className = "update-modal-apply disabled";
                applyBtn.disabled = true;
                applyBtn.onclick = null;
            } else {
                applyBtn.textContent = "";
                applyBtn.className = "update-modal-apply hidden";
                applyBtn.disabled = true;
                applyBtn.onclick = null;
            }
        }

        overlay.classList.add("show");
        overlay.setAttribute("aria-hidden", "false");
        document.body.style.overflow = "hidden";
    }

    /* ============================================================
       INIT
       ============================================================ */

    async function install() {
        const wrapper = $(".na-updates[data-org-slug]");
        const slug = wrapper?.dataset.orgSlug;
        if (!slug) return; // page has no updates section, or wasn't tagged — nothing to do

        const feedContainer = $(".na-updates-feed", wrapper);
        const listContainer = $(".na-updates-list", wrapper);
        if (!feedContainer && !listContainer) return;

        try {
            const result = await fetchOrgUpdates(slug);
            const updates = Array.isArray(result.updates) ? result.updates : [];
            const orgName = result.organization?.name || "";

            if (feedContainer) renderFeed(feedContainer, updates, orgName);
            else renderList(listContainer, updates, orgName);

            // Club pages provide their own richer forms. All other category
            // pages receive the same persisted application and complaint flow.
            if (!$("#joinClubForm") && !$("#sharedComplaintButton")) {
                const button = document.createElement("button");
                button.id = "sharedComplaintButton";
                button.type = "button";
                button.textContent = "Raise a complaint";
                button.style.cssText = "margin:12px 0;border:0;border-radius:7px;padding:9px 13px;background:#dc2626;color:#fff;cursor:pointer";
                button.onclick = () => openStudentForm("complaint", slug);
                wrapper.appendChild(button);
                document.addEventListener("click", event => {
                    const apply = event.target.closest("#updateModalApply.enabled");
                    if (!apply) return;
                    event.preventDefault(); event.stopImmediatePropagation();
                    openStudentForm("application", slug);
                }, true);
            }
        } catch (error) {
            console.error(`public-updates: failed to load updates for "${slug}":`, error);
        }
    }

    document.addEventListener("DOMContentLoaded", () => {
        setTimeout(install, 0);
    });
})();
