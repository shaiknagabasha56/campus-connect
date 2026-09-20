document.addEventListener("DOMContentLoaded", async () => {
  const slug = window.location.pathname.split("/").filter(Boolean)[1];
  if (!slug) return;

  function openApplicationForm() {
    if (document.getElementById("clubApplicationOverlay")) {
      document.getElementById("clubApplicationOverlay").style.display = "grid";
      return;
    }

    const overlay = document.createElement("div");
    overlay.id = "clubApplicationOverlay";
    overlay.style.cssText = "position:fixed;inset:0;z-index:9000;background:rgba(15,23,42,.58);display:grid;place-items:center;padding:20px";
    overlay.innerHTML = `
      <form id="clubApplicationForm" style="width:min(620px,100%);max-height:90vh;overflow:auto;background:#fff;border-radius:16px;padding:24px;display:grid;gap:10px;font-family:Poppins,sans-serif">
        <button type="button" id="closeClubApplication" style="justify-self:end;border:0;background:#eef2f7;border-radius:8px;padding:8px 12px;cursor:pointer">Close</button>
        <h2 style="margin:0;color:#172033">Submit Application</h2>
        <label>Name<input name="name" required style="display:block;width:100%;padding:10px;margin-top:4px"></label>
        <label>Email<input name="email" type="email" required style="display:block;width:100%;padding:10px;margin-top:4px"></label>
        <label>Roll / ID<input name="roll" required style="display:block;width:100%;padding:10px;margin-top:4px"></label>
        <label>Branch<input name="branch" style="display:block;width:100%;padding:10px;margin-top:4px"></label>
        <label>Year<input name="year" style="display:block;width:100%;padding:10px;margin-top:4px"></label>
        <label>Semester<input name="semester" style="display:block;width:100%;padding:10px;margin-top:4px"></label>
        <label>Phone<input name="phone" style="display:block;width:100%;padding:10px;margin-top:4px"></label>
        <label>Reason<textarea name="reason" rows="4" style="display:block;width:100%;padding:10px;margin-top:4px"></textarea></label>
        <button type="submit" style="border:0;background:#2563eb;color:#fff;border-radius:8px;padding:12px;cursor:pointer">Submit Application</button>
        <p id="clubApplicationMessage" role="status"></p>
      </form>`;
    document.body.appendChild(overlay);
    overlay.querySelector("#closeClubApplication").onclick = () => overlay.remove();
    overlay.addEventListener("click", event => { if (event.target === overlay) overlay.remove(); });
    overlay.querySelector("form").onsubmit = async event => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      formData.set("organization_slug", slug);
      try {
        const response = await fetch("/complaints/club-submissions/applications", {method:"POST", body:formData});
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.message || "Could not submit application.");
        overlay.querySelector("#clubApplicationMessage").textContent = "Application submitted successfully.";
        event.currentTarget.reset();
      } catch (error) {
        overlay.querySelector("#clubApplicationMessage").textContent = error.message;
      }
    };
  }

  document.addEventListener("click", event => {
    const applyButton = event.target.closest("#updateModalApply");
    if (!applyButton || !applyButton.classList.contains("enabled")) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    openApplicationForm();
  }, true);

  document.addEventListener("submit", async event => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;
    if (form.id !== "joinClubForm" && form.id !== "complaintForm") return;

    event.preventDefault();
    event.stopImmediatePropagation();
    const formData = new FormData(form);
    formData.set("organization_slug", slug);
    // The HTML uses the friendly ID No. field name; the database stores it
    // as roll so make the mapping explicit for both submission types.
    if (!formData.get("roll") && formData.get("id_no")) formData.set("roll", formData.get("id_no"));
    if (form.id === "complaintForm") {
      if (!formData.get("title") && formData.get("subject")) formData.set("title", formData.get("subject"));
      if (!formData.get("description") && formData.get("complaint")) formData.set("description", formData.get("complaint"));
      if (!formData.get("category")) formData.set("category", "Club activity");
    }

    try {
      const endpoint = form.id === "joinClubForm"
        ? "/complaints/club-submissions/members"
        : "/complaints/submit";
      const response = await fetch(endpoint, {method: "POST", body: formData});
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "Could not submit form.");
      const message = form.querySelector(".form-success") || document.getElementById("complaintFormSuccess");
      if (message) message.textContent = "Submitted successfully.";
      form.reset();
    } catch (error) {
      console.error(error);
      const message = form.querySelector(".form-success") || document.getElementById("complaintFormSuccess");
      if (message) message.textContent = error.message;
    }
  }, true);

  try {
    const response = await fetch(`/clubs/api/public/${encodeURIComponent(slug)}`);
    if (!response.ok) return;
    const result = await response.json();
    if (!result.success) return;

    const profile = result.profile || {};
    const leaders = result.leaders || [];
    const headerTitle = document.querySelector(".na-cat-header h1");
    const headerDescription = document.querySelector(".na-cat-header p");
    if (headerTitle && (profile.title || result.organization?.name)) {
      headerTitle.textContent = profile.title || result.organization.name;
    }
    if (headerDescription && profile.description) {
      headerDescription.textContent = profile.description;
    }

    const quickRows = document.querySelectorAll(".na-side-card .na-info-row");
    const quickValues = [
      profile.coordinator_name,
      profile.contact,
      profile.info_location || profile.location,
      profile.meeting_details
    ];
    quickRows.forEach((row, index) => {
      const value = quickValues[index];
      const target = row.querySelector("div");
      if (!target || !value) return;
      const label = target.querySelector(".na-info-label");
      target.textContent = "";
      if (label) target.appendChild(label);
      target.appendChild(document.createTextNode(value));
    });

    const contactItems = document.querySelectorAll(".aws-contact-item");
    if (profile.email && contactItems[0]) {
      contactItems[0].href = `mailto:${profile.email}`;
      contactItems[0].querySelector("strong").textContent = profile.email;
    }
    if (profile.phone && contactItems[1]) {
      contactItems[1].href = `tel:${profile.phone}`;
      contactItems[1].querySelector("strong").textContent = profile.phone;
    }
    if (profile.location && contactItems[2]) {
      contactItems[2].querySelector("strong").textContent = profile.location;
    }

    const socialLinks = {
      instagram: ".fa-instagram",
      linkedin: ".fa-linkedin-in",
      youtube: ".fa-youtube"
    };
    Object.entries(socialLinks).forEach(([field, selector]) => {
      const link = document.querySelector(`${selector}`)?.closest("a");
      if (link && profile[field]) link.href = profile[field];
    });

    document.querySelectorAll(".aws-head-card").forEach((card, index) => {
      const leader = leaders[index];
      if (!leader) return;
      const name = card.querySelector("h3");
      const position = card.querySelector("p");
      const image = card.querySelector("img");
      if (name) name.textContent = leader.name || name.textContent;
      if (position) position.textContent = leader.position || position.textContent;
      if (image && leader.profile_picture) image.src = leader.profile_picture;
    });
  } catch (error) {
    console.error("Could not load organization profile:", error);
  }
});
