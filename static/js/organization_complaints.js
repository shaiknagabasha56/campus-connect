/* Category-specific complaint inbox.
 * This deliberately uses /category-complaints/* and never touches the
 * existing general /complaints endpoints or their table/status workflow.
 */
(() => {
  const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

  async function loadInbox() {
    const response = await fetch("/category-complaints/admin/list", {
      credentials: "same-origin",
      headers: { Accept: "application/json" }
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.success) throw new Error(data.message || "Unable to load category complaints.");
    return data.complaints || [];
  }

  function showDetail(item, detail) {
    detail.innerHTML = `
      <div class="detail-top">
        <div><span class="cse-admin-eyebrow">CATEGORY COMPLAINT</span>
          <h3>${esc(item.student_name || "Student")}</h3><p>${esc(item.reference_id || "")}</p>
        </div>
        <span class="detail-status">Received</span>
      </div>
      <div class="detail-grid">
        <div class="detail-field"><label>Student name</label><div>${esc(item.student_name || "—")}</div></div>
        <div class="detail-field"><label>Roll / ID</label><div>${esc(item.roll_number || "—")}</div></div>
        <div class="detail-field"><label>Email</label><div>${esc(item.email || "—")}</div></div>
        <div class="detail-field"><label>Phone</label><div>${esc(item.phone || "—")}</div></div>
        <div class="detail-field"><label>Branch</label><div>${esc(item.branch || "—")}</div></div>
        <div class="detail-field"><label>Year</label><div>${esc(item.year || "—")}</div></div>
        <div class="detail-field"><label>Semester</label><div>${esc(item.semester || "—")}</div></div>
        <div class="detail-field"><label>Submitted</label><div>${esc(item.created_at || "—")}</div></div>
        <div class="detail-field full"><label>Subject</label><div>${esc(item.subject || "")}</div></div>
        <div class="detail-field full"><label>Complaint details</label><div style="white-space:pre-wrap">${esc(item.description || "")}</div></div>
      </div>`;
  }

  document.addEventListener("click", async event => {
    const trigger = event.target.closest('[data-admin-view="complaints"]');
    if (!trigger) return;
    event.preventDefault();
    event.stopImmediatePropagation();

    const page = document.getElementById("adminDataPage");
    const list = document.getElementById("adminDataList");
    const detail = document.getElementById("adminDataDetail");
    if (!page || !list || !detail) return;

    document.getElementById("dataPageTitle").textContent = "Category Complaints";
    document.getElementById("dataPageDesc").textContent = "Complaints submitted from this organization's page only.";
    document.getElementById("dataPageEyebrow").textContent = "PRIVATE ORGANIZATION INBOX";
    page.dataset.currentType = "category-complaints";
    page.classList.add("show");
    page.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    list.innerHTML = '<div class="admin-filter-card"><div class="admin-filter-title"><div>Complaints received</div><span id="orgComplaintCount">Loading…</span></div></div><div id="orgComplaintCards">Loading complaints…</div>';
    detail.innerHTML = '<div class="admin-empty-detail"><i class="fa-regular fa-folder-open"></i><h3>Select a complaint</h3><p>Choose a complaint to read its details.</p></div>';

    try {
      const complaints = await loadInbox();
      const count = document.getElementById("orgComplaintCount");
      const holder = document.getElementById("orgComplaintCards");
      if (count) count.textContent = `${complaints.length} Total`;
      holder.innerHTML = complaints.length ? complaints.map(item => `
        <article class="admin-submission-card" data-org-page-complaint="${esc(item.id)}">
          <div class="admin-card-row"><div><h4>${esc(item.student_name || "Student")}</h4><p>${esc(item.subject || "Complaint")}</p></div><span class="detail-status">Received</span></div>
          <p>${esc(item.reference_id)} · ${esc(item.roll_number || "No ID")}</p>
          <span class="mini">${esc(item.created_at || "")}</span>
        </article>`).join("") : '<div class="admin-no-results"><i class="fa-solid fa-inbox"></i><p>No category complaints have been submitted yet.</p></div>';
      holder.addEventListener("click", e => {
        const card = e.target.closest("[data-org-page-complaint]");
        if (!card) return;
        const item = complaints.find(row => String(row.id) === card.dataset.orgPageComplaint);
        if (item) showDetail(item, detail);
      });
    } catch (error) {
      list.innerHTML = `<p class="admin-no-results">${esc(error.message)}</p>`;
    }
  }, true);
})();
