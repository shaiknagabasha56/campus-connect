const seedComplaints = [
  {id:"RGUKT-CMP-2401", title:"Hostel water supply issue", category:"Hostel", priority:"High", status:"in-progress", description:"Water supply has been irregular in the residential block since yesterday evening. The issue affects students during morning and evening hours.", date:"Today, 10:42 AM", anonymous:false, name:"Student", roll:"N200123", phone:"+91 XXXXX XXXXX", attachments:[]},
  {id:"RGUKT-CMP-2402", title:"Campus maintenance concern", category:"Infrastructure", priority:"Medium", status:"under-review", description:"A maintenance issue has been noticed near the academic block and requires inspection by the concerned department.", date:"Yesterday, 6:15 PM", anonymous:false, name:"Student", roll:"N200456", phone:"+91 XXXXX XXXXX", attachments:[]},
  {id:"RGUKT-CMP-2403", title:"Anonymous infrastructure report", category:"Infrastructure", priority:"High", status:"new", description:"This complaint was submitted anonymously. The reported issue requires attention and supporting evidence may be attached below.", date:"20 Aug, 4:30 PM", anonymous:true, attachments:[]},
  {id:"RGUKT-CMP-2404", title:"Library access concern", category:"Academic", priority:"Low", status:"resolved", description:"The reported issue regarding access timings has been reviewed and resolved by the concerned department.", date:"18 Aug, 11:20 AM", anonymous:false, name:"Student", roll:"N200789", phone:"+91 XXXXX XXXXX", attachments:[]},
  {id:"RGUKT-CMP-2405", title:"Transport schedule issue", category:"Transport", priority:"Medium", status:"in-progress", description:"Students reported an inconsistency in the published transport schedule and requested clarification.", date:"16 Aug, 8:05 AM", anonymous:false, name:"Student", roll:"N200908", phone:"+91 XXXXX XXXXX", attachments:[]}
];

let complaints = [];
let currentFilter = "all";
let searchTerm = "";

const list = document.getElementById("complaints-list");
const backdrop = document.getElementById("preview-backdrop");

function prettyStatus(status){
  return status === "under-review" ? "Under Review" : status.split("-").map(x=>x[0].toUpperCase()+x.slice(1)).join(" ");
}

function renderComplaints() {

    const filtered = complaints.filter(c => {

        // Check status filter
        const matchesStatus =
            currentFilter === "all" ||
            c.status === currentFilter;

        // Check search
        const search = searchTerm.toLowerCase().trim();

        const matchesSearch =
            !search ||

            // Complaint title
            c.title.toLowerCase().includes(search) ||

            // Description
            c.description.toLowerCase().includes(search) ||

            // Category
            c.category.toLowerCase().includes(search) ||

            // Priority
            c.priority.toLowerCase().includes(search) ||

            // Status
            c.status.toLowerCase().includes(search) ||

            // Display status e.g. "Under Review"
            prettyStatus(c.status).toLowerCase().includes(search) ||

            // Student name
            (c.name || "").toLowerCase().includes(search) ||

            // Roll number
            (c.roll || "").toLowerCase().includes(search) ||

            // Complaint reference ID
            (c.id || "").toLowerCase().includes(search);

        return matchesStatus && matchesSearch;
    });

    list.innerHTML = filtered.length
        ? filtered.map(c => `
            <button class="complaint-row" data-id="${c.id}">

                <span class="row-marker"></span>

                <span>
                    <h3>${escapeHTML(c.title)}</h3>

                    <p>${escapeHTML(c.description)}</p>

                    <span class="row-bottom">
                        <i class="fa-solid fa-tag"></i>
                        ${escapeHTML(c.category)}

                        &nbsp;

                        <i class="fa-solid fa-flag"></i>
                        ${escapeHTML(c.priority)}

                        &nbsp;

                        <i class="fa-regular fa-clock"></i>
                        ${escapeHTML(c.date)}
                    </span>
                </span>

                <span class="status-badge ${c.status}">
                    ${prettyStatus(c.status)}
                </span>

            </button>
        `).join("")

        : `
            <div style="
                padding:45px;
                text-align:center;
                color:#8290a1;
                font-size:14px;
            ">
                No complaints found.
            </div>
        `;
}

function escapeHTML(value=""){
  return String(value).replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[ch]));
}

function openPreview(id){
  const c = complaints.find(x => x.id === id);
  if(!c) return;
  document.getElementById("preview-title").textContent = c.title;
  document.getElementById("preview-type").textContent = c.anonymous ? "ANONYMOUS COMPLAINT" : "COMPLAINT";
  const badge = document.getElementById("preview-status");
  badge.className = `status-badge ${c.status}`;
  badge.textContent = prettyStatus(c.status);
  document.getElementById("preview-date").textContent = c.date;
  document.getElementById("preview-description").textContent = c.description;
  document.getElementById("preview-reference").textContent = c.id;

  const meta = [
    ["Category", c.category],
    ["Priority", c.priority],
    ["Submitted As", c.anonymous ? "Anonymous" : (c.name || "Student")],
    ["Roll / ID", c.anonymous ? "Not shared" : (c.roll || "Not provided")]
  ];
  document.getElementById("preview-meta").innerHTML = meta.map(([k,v])=>`<div class="meta-box"><span>${escapeHTML(k)}</span><strong>${escapeHTML(v)}</strong></div>`).join("");
  renderAttachments(c.attachments || []);
  backdrop.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function closePreview(){
  backdrop.classList.add("hidden");
  document.body.style.overflow = "";
}

function renderAttachments(files){
  const holder = document.getElementById("attachment-preview");
  if(!files.length){
    holder.innerHTML = `<p style="margin:0;color:#8b98a8;font-size:13px">No attachments were provided.</p>`;
    return;
  }
  const wrap = document.createElement("div");
  wrap.className = "attachment-grid";
  files.forEach(file => {
    const url = file.url;
    const type = file.type || "";
    if(type.startsWith("image/")){
      const img = document.createElement("img"); img.src=url; img.alt=file.name; img.className="attachment-image"; wrap.appendChild(img);
    }else if(type.startsWith("video/")){
      const video = document.createElement("video"); video.src=url; video.controls=true; video.className="attachment-video"; wrap.appendChild(video);
    }else if(type.startsWith("audio/")){
      const audio = document.createElement("audio"); audio.src=url; audio.controls=true; audio.className="attachment-audio"; wrap.appendChild(audio);
    }else if(type === "application/pdf"){
      const link = document.createElement("a"); link.href=url; link.target="_blank"; link.className="file-link"; link.innerHTML=`<i class="fa-solid fa-file-pdf"></i><span>${escapeHTML(file.name)}</span>`; wrap.appendChild(link);
    }else{
      const link = document.createElement("a"); link.href=url; link.download=file.name; link.className="file-link"; link.innerHTML=`<i class="fa-solid fa-paperclip"></i><span>${escapeHTML(file.name)}</span>`; wrap.appendChild(link);
    }
  });
  holder.innerHTML = "";
  holder.appendChild(wrap);
}

document.querySelectorAll(".complaint-tab").forEach(tab => tab.addEventListener("click", () => {
  document.querySelectorAll(".complaint-tab").forEach(t=>t.classList.remove("active"));
  document.querySelectorAll(".form-panel").forEach(p=>p.classList.remove("active"));
  tab.classList.add("active");
  document.getElementById(tab.dataset.tab+"-panel").classList.add("active");
}));

document.querySelectorAll(".status-filter").forEach(btn => btn.addEventListener("click", () => {
  document.querySelectorAll(".status-filter").forEach(b=>b.classList.remove("active"));
  btn.classList.add("active");
  currentFilter = btn.dataset.status;
  renderComplaints();
}));

const complaintSearch = document.getElementById("complaint-search");

if (complaintSearch) {

    complaintSearch.addEventListener("input", function () {

        searchTerm = this.value;

        // First filter and display the matching complaints
        renderComplaints();

        // If search box is empty, don't scroll
        if (!searchTerm.trim()) {
            return;
        }

        // Get the first complaint currently displayed
        const firstComplaint = document.querySelector(".complaint-row");

        if (firstComplaint) {

            // Scroll down to the matching complaint
            firstComplaint.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });

        }

    });

}

list.addEventListener("click", e => {
  const row = e.target.closest(".complaint-row");
  if(row) openPreview(row.dataset.id);
});
async function loadComplaintsFromDatabase() {

  try {

    const response = await fetch("/complaints/api");

    if (!response.ok) {
      throw new Error("Failed to load complaints");
    }

    const data = await response.json();

    if (data.success) {

    complaints = [
        ...seedComplaints,

        ...data.complaints.map(c => ({
            id: c.reference_id,
            title: c.title,
            category: c.category,
            priority: c.priority,
            status: c.status,
            description: c.description,

            date: c.created_at
                ? new Date(c.created_at).toLocaleString()
                : "Unknown",

            anonymous: Boolean(c.anonymous),

            name: c.name || "",
            roll: c.roll || "",
            phone: c.phone || "",

            attachments: c.attachments || []
        }))
    ];

    renderComplaints();
}

  } catch (error) {

    console.error(
      "Error loading complaints:",
      error
    );

  }

}
document.querySelectorAll("#normal-form, #anonymous-form").forEach(form => {

  form.addEventListener("submit", async e => {

    e.preventDefault();

    // Get all form data including attachments
    const formData = new FormData(form);

    // Tell Flask whether this is an anonymous complaint
    const anonymous = form.id === "anonymous-form";

    formData.set(
      "anonymous",
      anonymous ? "true" : "false"
    );

    const msg = document.getElementById("form-message");

    try {

      // Send complaint to Flask
      const response = await fetch("/complaints/submit", {
        method: "POST",
        body: formData
      });

      const data = await response.json();

      // Check Flask response
      if (!response.ok || !data.success) {

        throw new Error(
          data.message || "Failed to submit complaint."
        );

      }

      // Show success message
      msg.textContent =
        `Your complaint has been submitted successfully. Reference ID: ${data.reference_id}`;

      msg.className = "form-message show success";

      // Reset the form
      form.reset();

      // Reload complaints from MySQL
      await loadComplaintsFromDatabase();

      // Show all complaints
      currentFilter = "all";

      document.querySelectorAll(".status-filter").forEach(
        b => b.classList.toggle(
          "active",
          b.dataset.status === "all"
        )
      );

      renderComplaints();

      // Hide message after 5 seconds
      setTimeout(() => {
        msg.className = "form-message";
      }, 5000);

    } catch (error) {

      console.error(
        "Complaint submission error:",
        error
      );

      msg.textContent =
        error.message ||
        "Could not submit complaint. Please try again.";

      msg.className =
        "form-message show error";

    }

  });

});
document.getElementById("preview-close").addEventListener("click",closePreview);
backdrop.addEventListener("click",e=>{if(e.target===backdrop)closePreview()});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!backdrop.classList.contains("hidden"))closePreview()});

loadComplaintsFromDatabase();
// ==========================================
// CONTACT NAVIGATION HIGHLIGHT
// ==========================================

document.addEventListener("DOMContentLoaded", function () {

    // Get ALL Contact links
    const contactLinks = document.querySelectorAll('a[href="#contact"]');

    // Get Student Support Desk card
    const contactCard = document.getElementById("contact");

    if (contactLinks.length && contactCard) {

        // Add click event to every Contact link
        contactLinks.forEach(function (contactLink) {

            contactLink.addEventListener("click", function (event) {

                // Prevent #contact from appearing in URL
                event.preventDefault();

                // Scroll to Student Support Desk
                contactCard.scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                });

                // Highlight Student Support Desk
                contactCard.classList.add("highlight-contact");

                // Remove highlight after 2 seconds
                setTimeout(function () {
                    contactCard.classList.remove("highlight-contact");
                }, 2000);

            });

        });

    }

});