document.addEventListener("DOMContentLoaded", () => {
  const modalTitle = document.getElementById("confirmTitle");
  const confirmButton = document.getElementById("confirmOk");
  if (!modalTitle || !confirmButton) return;

  async function saveProfile(data) {
    const response = await fetch("/clubs/api/admin/profile", {
      method: "PUT",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(data)
    });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.message || "Could not save club data.");
  }

  async function saveLeader(order, data) {
    const response = await fetch(`/clubs/api/admin/leaders/${order}`, {
      method: "PUT",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(data)
    });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.message || "Could not save club leader.");
  }

  confirmButton.addEventListener("click", () => {
    const title = modalTitle.textContent;
    setTimeout(async () => {
      try {
        if (title === "Save club identity?") {
          await saveProfile({
            title: document.querySelector(".na-cat-header h1")?.textContent.trim(),
            description: document.querySelector(".na-cat-header p")?.textContent.trim()
          });
        } else if (title === "Save quick info?") {
          const rows = [...document.querySelectorAll(".na-info-row")];
          await saveProfile({
            coordinator_label: "Convener",
            coordinator_name: rows[0]?.querySelector("div")?.textContent.trim(),
            contact: rows[1]?.querySelector("div")?.textContent.trim(),
            location: rows[2]?.querySelector("div")?.textContent.trim(),
            meeting_details: rows[3]?.querySelector("div")?.textContent.trim()
          });
        } else if (title === "Save contact details?") {
          const items = [...document.querySelectorAll(".aws-contact-item")];
          await saveProfile({
            email: items[0]?.querySelector("strong")?.textContent.trim(),
            phone: items[1]?.querySelector("strong")?.textContent.trim(),
            location: items[2]?.querySelector("strong")?.textContent.trim(),
            instagram: document.querySelector(".fa-instagram")?.closest("a")?.href || "",
            linkedin: document.querySelector(".fa-linkedin-in")?.closest("a")?.href || "",
            youtube: document.querySelector(".fa-youtube")?.closest("a")?.href || ""
          });
        } else if (title === "Save club head changes?") {
          const cards = [...document.querySelectorAll(".aws-head-card")];
          await Promise.all(cards.map((card, index) => saveLeader(index + 1, {
            name: card.querySelector("h3")?.textContent.trim(),
            position: card.querySelector("p")?.textContent.trim(),
            profile_picture: card.querySelector("img")?.src || ""
          })));
        }
      } catch (error) {
        console.error(error);
      }
    }, 0);
  });
});
