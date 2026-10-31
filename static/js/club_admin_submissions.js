/* Live inbox shared by club, academic, and non-academic admin pages. */
(() => {
  if (window.__campusInboxInitialized) return;
  window.__campusInboxInitialized = true;
  const init = () => {
  const page = document.getElementById("adminDataPage");
  const list = document.getElementById("adminDataList");
  const detail = document.getElementById("adminDataDetail");
  if (!page || !list || !detail) return;

  const esc = value => String(value == null ? "" : value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
  const statusNames = {new:"pending","under-review":"under review","in-progress":"in progress",resolved:"resolved",rejected:"rejected"};
  const titleFor = type => type === "complaints" ? "Complaints" : type === "applications" ? "Applications" : "New Club Members";
  async function request(url, options) {
    const response = await fetch(url, {credentials:"same-origin", ...options});
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.success) throw new Error(result.message || "Could not load the inbox.");
    return result;
  }
  async function load(type) {
    if (type !== "complaints") return (await request(`/complaints/club-submissions/${type}`)).submissions || [];
    return ((await request("/complaints/api")).complaints || []).map(item => ({...item, display_status:statusNames[item.status] || item.status || "pending", branch:item.category || "Club activity", reason:item.description, reference:item.reference_id}));
  }
  function showDetails(type, item, rows) {
    const statuses = type === "complaints" ? ["pending","under review","in progress","resolved","rejected"] : ["pending","accepted","rejected"];
    const status = item.display_status || item.status || "pending";
    const heading = type === "complaints" ? item.title : item.name;
    detail.innerHTML = `<div class="detail-top"><div><span class="aws-admin-eyebrow">${esc(titleFor(type).toUpperCase())}</span><h3>${esc(heading)}</h3><p>${esc(type === "complaints" ? item.reference : item.email)}</p></div><span class="detail-status">${esc(status)}</span></div><div class="admin-status-control-card"><div><span class="admin-status-label">Update Status</span><p>This change is saved immediately.</p></div><div class="admin-status-action"><select id="liveStatus">${statuses.map(value => `<option value="${value}" ${value === status ? "selected" : ""}>${esc(value)}</option>`).join("")}</select><button id="saveLiveStatus" type="button">Update</button></div></div><div class="detail-grid"><div class="detail-field"><label>Name</label><div>${esc(item.anonymous ? "Anonymous" : item.name || "Not provided")}</div></div><div class="detail-field"><label>Phone</label><div>${esc(item.anonymous ? "Not shared" : item.phone || "Not provided")}</div></div><div class="detail-field"><label>Roll / ID</label><div>${esc(item.roll || "Not provided")}</div></div><div class="detail-field"><label>Branch / Category</label><div>${esc(item.branch || item.category || "Not provided")}</div></div><div class="detail-field full"><label>${type === "complaints" ? "Complaint" : "Reason"}</label><div>${esc(item.reason || "Not provided")}</div></div></div>`;
    document.getElementById("saveLiveStatus").onclick = async () => {
      const chosen = document.getElementById("liveStatus").value;
      try {
        if (type === "complaints") { await request(`/complaints/api/${encodeURIComponent(item.reference)}/status`, {method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status:chosen})}); item.display_status = chosen; }
        else { await request(`/complaints/club-submissions/${type}/${item.id}/status`, {method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status:chosen})}); item.status = chosen; }
        render(type, rows); detail.innerHTML = `<div class="admin-empty-detail"><h3>Status saved</h3><p>The student request has been updated.</p></div>`;
      } catch (error) { detail.querySelector(".admin-status-control-card p").textContent = error.message; }
    };
  }
  function render(type, rows) {
    list.innerHTML = `<div class="admin-filter-card"><div class="admin-filter-title"><div>${titleFor(type)}</div><span>${rows.length} Total</span></div></div><div id="liveSubmissionCards"></div>`;
    const holder = document.getElementById("liveSubmissionCards");
    holder.innerHTML = rows.length ? rows.map((item, index) => `<article class="admin-submission-card" data-live-index="${index}"><div class="admin-card-row"><div><h4>${esc(type === "complaints" ? item.title : item.name)}</h4><p>${esc(type === "complaints" ? item.reference_id : item.email)}</p></div><span class="admin-list-status">${esc(item.display_status || item.status)}</span></div><p>${esc(item.branch || item.category || "")}</p></article>`).join("") : `<div class="admin-no-results"><p>No ${titleFor(type).toLowerCase()} found.</p></div>`;
    holder.onclick = event => { const card = event.target.closest("[data-live-index]"); if (card) showDetails(type, rows[Number(card.dataset.liveIndex)], rows); };
  }
  async function open(type) {
    document.getElementById("dataPageTitle").textContent = titleFor(type);
    document.getElementById("dataPageDesc").textContent = "Live requests submitted by students to your club.";
    document.getElementById("dataPageEyebrow").textContent = "CLUB INBOX";
    page.classList.add("show"); page.setAttribute("aria-hidden","false"); document.body.style.overflow = "hidden";
    list.innerHTML = "<div class=\"admin-no-results\"><p>Loading…</p></div>";
    detail.innerHTML = "<div class=\"admin-empty-detail\"><h3>Select a request</h3><p>Choose a request to review it.</p></div>";
    try { render(type, await load(type)); } catch (error) { list.innerHTML = `<div class="admin-no-results"><p>${esc(error.message)}</p></div>`; }
  }
  // Stops legacy per-club scripts from showing their placeholder records.
  document.addEventListener("click", event => { const button = event.target.closest("[data-admin-view]"); if (!button) return; event.preventDefault(); event.stopImmediatePropagation(); open(button.dataset.adminView); }, true);
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
