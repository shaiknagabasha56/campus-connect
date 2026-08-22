const seedComplaints = [
  {id:"RGUKT-CMP-2401", title:"Hostel water supply issue", category:"Hostel", priority:"High", status:"in-progress", description:"Water supply has been irregular in the residential block since yesterday evening. The issue affects students during morning and evening hours.", date:"Today, 10:42 AM", anonymous:false, name:"Student", roll:"N200123", phone:"+91 XXXXX XXXXX", attachments:[]},
  {id:"RGUKT-CMP-2402", title:"Campus maintenance concern", category:"Infrastructure", priority:"Medium", status:"under-review", description:"A maintenance issue has been noticed near the academic block and requires inspection by the concerned department.", date:"Yesterday, 6:15 PM", anonymous:false, name:"Student", roll:"N200456", phone:"+91 XXXXX XXXXX", attachments:[]},
  {id:"RGUKT-CMP-2403", title:"Anonymous infrastructure report", category:"Infrastructure", priority:"High", status:"new", description:"This complaint was submitted anonymously. The reported issue requires attention and supporting evidence may be attached below.", date:"20 Aug, 4:30 PM", anonymous:true, attachments:[]},
  {id:"RGUKT-CMP-2404", title:"Library access concern", category:"Academic", priority:"Low", status:"resolved", description:"The reported issue regarding access timings has been reviewed and resolved by the concerned department.", date:"18 Aug, 11:20 AM", anonymous:false, name:"Student", roll:"N200789", phone:"+91 XXXXX XXXXX", attachments:[]},
  {id:"RGUKT-CMP-2405", title:"Transport schedule issue", category:"Transport", priority:"Medium", status:"in-progress", description:"Students reported an inconsistency in the published transport schedule and requested clarification.", date:"16 Aug, 8:05 AM", anonymous:false, name:"Student", roll:"N200908", phone:"+91 XXXXX XXXXX", attachments:[]}
];

let complaints = [...seedComplaints];
let currentFilter = "all";

const list = document.getElementById("complaints-list");
const backdrop = document.getElementById("preview-backdrop");

function prettyStatus(status){
  return status === "under-review" ? "Under Review" : status.split("-").map(x=>x[0].toUpperCase()+x.slice(1)).join(" ");
}

function renderComplaints(){
  const filtered = complaints.filter(c => currentFilter === "all" || c.status === currentFilter);
  list.innerHTML = filtered.length ? filtered.map((c, i) => `
    <button class="complaint-row" data-id="${c.id}">
      <span class="row-marker"></span>
      <span>
        <h3>${escapeHTML(c.title)}</h3>
        <p>${escapeHTML(c.description)}</p>
        <span class="row-bottom"><i class="fa-solid fa-tag"></i> ${escapeHTML(c.category)} &nbsp; <i class="fa-solid fa-flag"></i> ${escapeHTML(c.priority)} &nbsp; <i class="fa-regular fa-clock"></i> ${escapeHTML(c.date)}</span>
      </span>
      <span class="status-badge ${c.status}">${prettyStatus(c.status)}</span>
    </button>`).join("") : `<div style="padding:45px;text-align:center;color:#8290a1;font-size:14px">No complaints found for this status.</div>`;
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

list.addEventListener("click", e => {
  const row = e.target.closest(".complaint-row");
  if(row) openPreview(row.dataset.id);
});

document.querySelectorAll("#normal-form, #anonymous-form").forEach(form => form.addEventListener("submit", e => {
  e.preventDefault();
  const fd = new FormData(form);
  const anonymous = form.id === "anonymous-form";
  const attachments = [...form.querySelector('input[type="file"]').files].map(file => ({name:file.name,type:file.type,url:URL.createObjectURL(file)}));
  const complaint = {
    id:"RGUKT-CMP-"+Math.floor(100000+Math.random()*899999),
    title:fd.get("title"), category:fd.get("category"), priority:fd.get("priority"),
    status:"new", description:fd.get("description"), date:"Just now", anonymous,
    name:anonymous ? "" : fd.get("name"), roll:anonymous ? "" : fd.get("roll"),
    phone:anonymous ? "" : fd.get("phone"), attachments
  };
  complaints.unshift(complaint);
  currentFilter="all";
  document.querySelectorAll(".status-filter").forEach(b=>b.classList.toggle("active",b.dataset.status==="all"));
  renderComplaints();
  form.reset();
  const msg=document.getElementById("form-message");
  msg.textContent=`Your complaint has been submitted successfully. Reference ID: ${complaint.id}`;
  msg.className="form-message show success";
  setTimeout(()=>msg.className="form-message",5000);
}));

document.getElementById("preview-close").addEventListener("click",closePreview);
backdrop.addEventListener("click",e=>{if(e.target===backdrop)closePreview()});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!backdrop.classList.contains("hidden"))closePreview()});

renderComplaints();
