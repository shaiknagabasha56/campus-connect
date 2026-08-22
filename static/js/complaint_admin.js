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


/* ---------- Admin-only controls; base complaint page behavior is unchanged ---------- */
const applicationSeed=[
{id:'APP-2026-101',title:'Scholarship support application',category:'Financial Aid',status:'Under Review',date:'Today, 9:20 AM',student:'Ravi Kumar',roll:'N200123',description:'Application submitted for scholarship assistance with supporting documents.',attachments:[]},
{id:'APP-2026-102',title:'Hostel room change request',category:'Hostel',status:'In Progress',date:'Yesterday, 3:45 PM',student:'Anjali Devi',roll:'N200456',description:'Student requested a room change due to accommodation concerns.',attachments:[]},
{id:'APP-2026-103',title:'Academic event registration',category:'Academic',status:'New',date:'20 Aug, 4:30 PM',student:'Kiran Reddy',roll:'N200789',description:'Registration submitted for the upcoming academic event.',attachments:[]},
{id:'APP-2026-104',title:'Bonafide certificate request',category:'Academic',status:'Resolved',date:'18 Aug, 11:20 AM',student:'Meera',roll:'N200908',description:'Bonafide certificate request reviewed and completed.',attachments:[]}
];
let managementType='complaints', managementStatus='All', selectedManagementId=null;
const managementBackdrop=document.getElementById('management-backdrop');
const managementList=document.getElementById('managementList');
const managementPreview=document.getElementById('managementPreview');
const managementFilters=document.getElementById('managementFilters');
const managementTitle=document.getElementById('managementTitle');
const managementEyebrow=document.getElementById('managementEyebrow');
const managementDescription=document.getElementById('managementDescription');
function adminStatusClass(s){return String(s).toLowerCase().replace(/ /g,'-')}
function currentManagementItems(){return managementType==='complaints'?complaints:applicationSeed}
function openManagement(type){managementType=type;managementStatus='All';selectedManagementId=null;managementTitle.textContent=type==='complaints'?'Complaints':'Applications';managementEyebrow.textContent=type==='complaints'?'COMPLAINT MANAGEMENT':'APPLICATION MANAGEMENT';managementDescription.textContent=type==='complaints'?'Click a complaint to view complete submitted details and attachments.':'Click an application to view complete submitted details and documents.';managementBackdrop.classList.remove('hidden');document.body.style.overflow='hidden';renderManagement()}
function closeManagement(){managementBackdrop.classList.add('hidden');document.body.style.overflow=''}
function getMStatus(item){return managementType==='complaints'?prettyStatus(item.status):item.status}
function renderManagement(){const items=currentManagementItems();const statuses=['All','New','Under Review','In Progress','Resolved'];managementFilters.innerHTML=statuses.map(s=>`<button class="management-filter ${s===managementStatus?'active':''}" data-ms="${s}">${s}</button>`).join('');const filtered=items.filter(i=>managementStatus==='All'||getMStatus(i)===managementStatus);managementList.innerHTML=filtered.length?filtered.map(i=>`<button class="management-item ${selectedManagementId===i.id?'active':''}" data-mid="${i.id}"><strong>${escapeHTML(i.title)}</strong><p>${managementType==='complaints'?(i.anonymous?'Anonymous submission':i.name||'Student'):i.student}</p><div class="mi-bottom"><span>${escapeHTML(i.category)} · ${escapeHTML(i.date)}</span><span class="status-badge ${adminStatusClass(getMStatus(i))}">${escapeHTML(getMStatus(i))}</span></div></button>`).join(''):'<div class="empty-management"><p>No items found.</p></div>';managementFilters.querySelectorAll('button').forEach(b=>b.onclick=()=>{managementStatus=b.dataset.ms;renderManagement()});managementList.querySelectorAll('.management-item').forEach(b=>b.onclick=()=>{selectedManagementId=b.dataset.mid;renderManagement();renderManagementPreview(selectedManagementId)})}
function renderManagementPreview(id){const item=currentManagementItems().find(x=>x.id===id);if(!item)return;const isComplaint=managementType==='complaints';const data=isComplaint?[['Reference ID',item.id],['Submission',item.anonymous?'Anonymous':'Normal'],['Category',item.category],['Priority',item.priority],['Status',prettyStatus(item.status)],['Date',item.date],['Name',item.anonymous?'Not shared':item.name||'Student'],['Roll / ID',item.anonymous?'Not shared':item.roll||'Not provided'],['Contact',item.anonymous?'Not shared':item.phone||'Not provided']]:[['Application ID',item.id],['Category',item.category],['Status',item.status],['Date',item.date],['Student',item.student],['Roll / ID',item.roll]];managementPreview.innerHTML=`<div class="admin-preview-head"><p class="eyebrow">${isComplaint?(item.anonymous?'ANONYMOUS COMPLAINT':'COMPLAINT DETAILS'):'APPLICATION DETAILS'}</p><h3>${escapeHTML(item.title)}</h3><p>Complete submitted information and supporting attachments.</p></div><div class="admin-meta-grid">${data.map(([k,v])=>`<div class="admin-data-box"><span>${escapeHTML(k)}</span><strong>${escapeHTML(v)}</strong></div>`).join('')}</div><div class="admin-description"><h4>${isComplaint?'COMPLAINT DETAILS':'APPLICATION DETAILS'}</h4><p>${escapeHTML(item.description)}</p></div><div class="admin-attachments"><h4>ATTACHMENTS</h4>${renderAdminAttachments(item.attachments||[])}</div>`}
function renderAdminAttachments(files){if(!files.length)return '<p style="color:#8b98a8;font-size:13px;margin:0">No attachments were provided.</p>';return files.map((f,i)=>`<button class="admin-attachment" data-att-index="${i}"><i class="fa-solid ${f.type?.startsWith('image/')?'fa-image':f.type?.startsWith('video/')?'fa-file-video':f.type?.startsWith('audio/')?'fa-file-audio':f.type==='application/pdf'?'fa-file-pdf':'fa-file-lines'}"></i><span>${escapeHTML(f.name)}</span><small style="margin-left:auto;color:#8b98a8">Preview</small></button>`).join('')}
managementPreview.addEventListener('click',e=>{const b=e.target.closest('.admin-attachment');if(!b)return;const item=currentManagementItems().find(x=>x.id===selectedManagementId);const file=item.attachments[Number(b.dataset.attIndex)];openAttachmentViewer(file)})
function openAttachmentViewer(file){const box=document.createElement('div');box.className='attachment-viewer-backdrop';let content='';if(file.type?.startsWith('image/'))content=`<img src="${file.url}" alt="${escapeHTML(file.name)}">`;else if(file.type?.startsWith('video/'))content=`<video src="${file.url}" controls autoplay></video>`;else if(file.type?.startsWith('audio/'))content=`<audio src="${file.url}" controls autoplay></audio>`;else if(file.type==='application/pdf')content=`<iframe src="${file.url}" style="width:100%;height:65vh;border:0;border-radius:10px"></iframe>`;else content=`<div class="doc-preview"><div><i class="fa-solid fa-file-lines"></i><h3>${escapeHTML(file.name)}</h3><p>Document preview/download available.</p>${file.url?`<a class="file-link" href="${file.url}" target="_blank" download>Open / Download</a>`:''}</div></div>`;box.innerHTML=`<div class="attachment-viewer"><button class="preview-close">×</button><h2 style="font-size:19px;margin:0 45px 14px 0;color:#334155">${escapeHTML(file.name)}</h2>${content}</div>`;document.body.appendChild(box);box.querySelector('.preview-close').onclick=()=>box.remove();box.onclick=e=>{if(e.target===box)box.remove()}}
document.querySelectorAll('.admin-manage-card').forEach(b=>b.addEventListener('click',()=>openManagement(b.dataset.management)));document.getElementById('closeManagement').onclick=closeManagement;managementBackdrop.addEventListener('click',e=>{if(e.target===managementBackdrop)closeManagement()});
function openEdit(kind){const b=document.getElementById('edit-backdrop'),c=document.getElementById('editContent');let title='',desc='',fields='';if(kind==='heading'){title='Edit Complaint Page';desc='Update the logo letter, page title and description.';fields=`<label>Logo Letter<input id="editLogo" value="R"></label><label>Title<input id="editTitle" value="${document.querySelector('.page-heading h1').textContent}"></label><label>Description<textarea id="editDesc">${document.querySelector('.page-heading p:not(.eyebrow)').textContent}</textarea></label>`}else if(kind==='management'){title='Manage Admin Buttons';desc='Edit the two management button labels and descriptions.';fields=`<label>Complaints Label<input id="editComplaintsLabel" value="Complaints"></label><label>Complaints Description<input id="editComplaintsDesc" value="Review submitted complaints and attached proof."></label><label>Applications Label<input id="editApplicationsLabel" value="Applications"></label><label>Applications Description<input id="editApplicationsDesc" value="Review student applications and submitted documents."></label>`}else{title='Edit Student Support Desk';desc='Update the support name, designation, email and location.';fields=`<label>Support Name<input id="editSupportName" value="Student Support Desk"></label><label>Designation<input id="editSupportDesignation" value="Complaint Resolution & Student Welfare"></label><label>Email<input id="editSupportEmail" value="${document.getElementById('supportEmail').textContent}"></label><label>Location<input id="editSupportLocation" value="${document.getElementById('supportLocation').textContent}"></label>`}c.innerHTML=`<h2>${title}</h2><p>${desc}</p><div class="edit-form">${fields}<button class="edit-save" id="editSave">Save Changes</button></div>`;b.classList.remove('hidden');document.body.style.overflow='hidden';document.getElementById('editSave').onclick=()=>{if(kind==='heading'){document.querySelector('.brand-mark').textContent=document.getElementById('editLogo').value||'R';document.querySelector('.page-heading h1').textContent=document.getElementById('editTitle').value;document.querySelector('.page-heading p:not(.eyebrow)').textContent=document.getElementById('editDesc').value}else if(kind==='management'){const cards=document.querySelectorAll('.admin-manage-card');cards[0].querySelector('strong').textContent=document.getElementById('editComplaintsLabel').value;cards[0].querySelector('small').textContent=document.getElementById('editComplaintsDesc').value;cards[1].querySelector('strong').textContent=document.getElementById('editApplicationsLabel').value;cards[1].querySelector('small').textContent=document.getElementById('editApplicationsDesc').value}else{document.querySelector('.contact-main h2').textContent=document.getElementById('editSupportName').value;document.querySelector('.contact-main p:not(.eyebrow)').textContent=document.getElementById('editSupportDesignation').value;document.getElementById('supportEmail').textContent=document.getElementById('editSupportEmail').value;document.getElementById('supportLocation').textContent=document.getElementById('editSupportLocation').value}b.classList.add('hidden');document.body.style.overflow=''}}
document.getElementById('editHeading').onclick=()=>openEdit('heading');document.getElementById('editManagement').onclick=()=>openEdit('management');document.getElementById('editSupport').onclick=()=>openEdit('support');document.getElementById('editClose').onclick=()=>{document.getElementById('edit-backdrop').classList.add('hidden');document.body.style.overflow=''};
function updateAdminCounts(){document.getElementById('complaintsAdminCount').textContent=complaints.length;document.getElementById('applicationsAdminCount').textContent=applicationSeed.length}updateAdminCounts();
