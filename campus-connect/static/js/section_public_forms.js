/* Campus Connect - student forms for CELL, DEPARTMENT and OFFICE pages.
 *
 * These pages used to show a demo "Submitted successfully" message and throw the
 * form data away. This script sends the data to the same endpoints the club
 * pages use, so it lands in the admin inbox of that page:
 *
 *   complaint form      -> POST /complaints/submit
 *   join-cell form      -> POST /complaints/club-submissions/members
 *   "Apply Now" on an announcement -> POST /complaints/club-submissions/applications
 *
 * The organization is taken from the page's data-org-slug attribute (the same
 * one public_updates.js uses to load announcements).
 */
(() => {
  "use strict";

  const holder = document.querySelector("[data-org-slug]");
  const slug = holder ? (holder.dataset.orgSlug || "").trim().toLowerCase() : "";
  if (!slug) return;

  /* ------------------------------------------------------------ helpers */

  async function send(url, formData) {
    formData.set("organization_slug", slug);
    const response = await fetch(url, { method: "POST", body: formData, credentials: "same-origin" });
    if (response.redirected) { window.location.href = response.url; throw new Error("Please log in again."); }
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.success) throw new Error(result.message || "Could not submit. Please try again.");
    return result;
  }

  function messageBox(form) {
    return form.querySelector(".form-success") || document.getElementById("complaintFormSuccess") || form.querySelector(".form-error");
  }

  function show(form, text, ok) {
    const box = messageBox(form);
    if (!box) { if (!ok) alert(text); return; }
    const error = form.querySelector(".form-error");
    if (error && error !== box) error.style.display = "none";
    box.textContent = text;
    box.style.display = "block";
    if (!ok) box.style.color = "#dc2626"; else box.style.color = "";
  }

  // closes whichever kind of popup the form lives in
  function closePopup(form) {
    const backdrop = form.closest(".modal-backdrop");            // department / office pages
    if (backdrop) {
      backdrop.classList.add("hidden");
      document.body.classList.remove("modal-open");
      return;
    }
    const overlay = form.closest(".action-form-overlay");        // cell pages
    if (overlay) {
      overlay.classList.remove("show");
      overlay.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    }
  }

  function done(form, text) {
    show(form, text, true);
    form.reset();
    setTimeout(() => {
      closePopup(form);
      const box = messageBox(form);
      if (box) { box.textContent = ""; box.style.display = "none"; }
    }, 1500);
  }

  /* ------------------------------------------------ complaint (labels -> fields) */
  // The department / office complaint form has no name="" attributes, so the
  // fields are recognised by their labels.
  const LABELS = {
    "id no": "roll", "name": "name", "email": "email", "phone number": "phone", "phone": "phone",
    "branch": "branch", "year": "year", "current semester": "semester",
    "section": "branch", "complaint type": "category", "complaint description": "description"
  };

  function readByLabel(form) {
    const data = new FormData();
    form.querySelectorAll(".form-group").forEach(group => {
      const label = group.querySelector("label");
      const field = group.querySelector("input, select, textarea");
      const key = label && field ? LABELS[label.textContent.trim().toLowerCase()] : null;
      if (key) data.set(key, field.value.trim());
    });
    return data;
  }

  /* ------------------------------------------------ application overlay */
  function openApplicationForm() {
    let overlay = document.getElementById("sectionApplicationOverlay");
    if (overlay) { overlay.style.display = "grid"; return; }

    overlay = document.createElement("div");
    overlay.id = "sectionApplicationOverlay";
    overlay.style.cssText = "position:fixed;inset:0;z-index:9500;background:rgba(15,23,42,.58);display:grid;place-items:center;padding:20px";
    const field = "display:block;width:100%;padding:10px;margin-top:4px;border:1px solid #cbd5e1;border-radius:8px;font:inherit";
    overlay.innerHTML = `
      <form style="width:min(620px,100%);max-height:90vh;overflow:auto;background:#fff;border-radius:16px;padding:24px;display:grid;gap:10px;font-family:Poppins,sans-serif">
        <button type="button" data-close style="justify-self:end;border:0;background:#eef2f7;border-radius:8px;padding:8px 12px;cursor:pointer">Close</button>
        <h2 style="margin:0;color:#172033">Submit Application</h2>
        <label>Name<input name="name" required style="${field}"></label>
        <label>Email<input name="email" type="email" required style="${field}"></label>
        <label>Roll / ID<input name="roll" required style="${field}"></label>
        <label>Branch<input name="branch" style="${field}"></label>
        <label>Year<input name="year" style="${field}"></label>
        <label>Semester<input name="semester" style="${field}"></label>
        <label>Phone<input name="phone" style="${field}"></label>
        <label>Reason<textarea name="reason" rows="4" style="${field}"></textarea></label>
        <button type="submit" style="border:0;background:#2563eb;color:#fff;border-radius:8px;padding:12px;cursor:pointer;font:inherit">Submit Application</button>
        <p data-message role="status" style="margin:0"></p>
      </form>`;
    document.body.appendChild(overlay);

    const form = overlay.querySelector("form");
    const message = overlay.querySelector("[data-message]");
    const close = () => overlay.remove();
    overlay.querySelector("[data-close]").onclick = close;
    overlay.addEventListener("click", event => { if (event.target === overlay) close(); });

    form.onsubmit = async event => {
      event.preventDefault();
      message.style.color = "";
      try {
        await send("/complaints/club-submissions/applications", new FormData(form));
        message.textContent = "Application submitted successfully.";
        form.reset();
        setTimeout(close, 1500);
      } catch (error) {
        message.style.color = "#dc2626";
        message.textContent = error.message;
      }
    };
  }

  /* ------------------------------------------------ wiring (capture phase) */
  // Capture phase + stopImmediatePropagation = runs before, and replaces, the old
  // "demo form" handlers that each page script registered.
  document.addEventListener("submit", async event => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;

    const isJoin = form.id === "joinClubForm";
    const isCellComplaint = form.id === "complaintForm";
    const isDeptComplaint = form.classList.contains("demo-form") && !!form.closest("#complaint-modal");
    if (!isJoin && !isCellComplaint && !isDeptComplaint) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    const button = form.querySelector("[type=submit]");
    if (button) button.disabled = true;

    try {
      if (isJoin) {
        await send("/complaints/club-submissions/members", new FormData(form));
        done(form, "Submitted successfully.");
        return;
      }

      const data = isDeptComplaint ? readByLabel(form) : new FormData(form);
      // cell form uses id_no / subject / complaint; the department form uses labels
      if (!data.get("roll") && data.get("id_no")) data.set("roll", data.get("id_no"));
      if (!data.get("description") && data.get("complaint")) data.set("description", data.get("complaint"));
      if (!data.get("title")) {
        const text = (data.get("subject") || "").toString().trim() ||
                     (data.get("description") || "").toString().trim().slice(0, 70);
        data.set("title", text || "Complaint");
      }
      if (!data.get("category")) data.set("category", "General");

      await send("/complaints/submit", data);
      done(form, "Complaint submitted successfully. It has been sent to the admin.");
    } catch (error) {
      show(form, error.message, false);
    } finally {
      if (button) button.disabled = false;
    }
  }, true);

  // "Apply Now" inside an announcement -> in-site application form (same as the club pages)
  document.addEventListener("click", event => {
    const cellButton = event.target.closest("#updateModalApply");
    const deptButton = event.target.closest("#modal-apply-btn");
    let apply = false;
    if (cellButton) apply = cellButton.classList.contains("enabled");
    if (deptButton) apply = !deptButton.disabled && deptButton.style.display !== "none" && !deptButton.classList.contains("disabled");
    if (!apply) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    openApplicationForm();
  }, true);
})();
