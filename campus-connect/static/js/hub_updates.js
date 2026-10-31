document.addEventListener("DOMContentLoaded", () => {
  const list = document.getElementById("na-ann-list");
  if (!list || !list.dataset.updatesCategory) return;
  const endpoint = `/updates/public/category/${encodeURIComponent(list.dataset.updatesCategory)}`;
  const colors = ["#2563eb", "#06b6d4", "#f97316", "#0d9488", "#8b5cf6", "#e11d48", "#10b981"];

  const formatDate = value => {
    if (!value) return "";
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? String(value) :
      d.toLocaleDateString("en-GB", {day:"2-digit", month:"2-digit", year:"numeric"}).replaceAll("/", "-");
  };
  const formatTime = value => {
    if (!value) return "";
    const parts = String(value).split(":");
    if (parts.length < 2) return String(value);
    let h = Number(parts[0]); const suffix = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h}:${parts[1]} ${suffix}`;
  };

  function render(updates) {
    list.replaceChildren();
    if (!updates.length) {
      const empty = document.createElement("li");
      empty.className = "na-ann-empty";
      empty.textContent = "No updates available yet.";
      list.appendChild(empty);
      return;
    }
    updates.forEach((update, index) => {
      const color = colors[index % colors.length];
      const li = document.createElement("li");
      const marker = document.createElement("span");
      marker.className = "na-ann-marker"; marker.style.background = color;
      const body = document.createElement("div"); body.className = "na-ann-body";
      const meta = document.createElement("span"); meta.className = "na-ann-date";
      meta.append(document.createTextNode(formatDate(update.post_date || update.created_at)));
      const time = document.createElement("span"); time.className = "na-ann-time";
      time.textContent = formatTime(update.post_time); meta.appendChild(time);
      const cat = document.createElement("span"); cat.className = "na-ann-cat";
      cat.style.background = color; cat.textContent = update.organization_name || update.category_tag || "Update";
      meta.appendChild(cat);
      const text = document.createElement("p"); text.className = "na-ann-text";
      text.textContent = update.description || update.title || "New update";
      body.append(meta, text); li.append(marker, body); list.appendChild(li);
    });
  }

  async function load() {
    try {
      const response = await fetch(endpoint, {headers: {"Accept":"application/json"}});
      if (!response.ok) throw new Error(`Updates request failed (${response.status})`);
      const data = await response.json();
      if (data.success && Array.isArray(data.updates)) render(data.updates);
    } catch (error) { console.error("Could not load hub updates:", error); }
  }
  load();
});
