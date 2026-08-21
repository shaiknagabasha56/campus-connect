const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");

menuToggle?.addEventListener("click", () => {
  const open = navLinks.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", open ? "true" : "false");
});

document.querySelectorAll(".nav-links a").forEach(link => {
  link.addEventListener("click", () => {
    navLinks.classList.remove("open");
    menuToggle?.setAttribute("aria-expanded", "false");
  });
});

document.querySelectorAll(".category-card,.description-card,.developer-card").forEach(card => {
  card.addEventListener("pointerdown", () => card.classList.add("pressed"));
  card.addEventListener("pointerup", () => card.classList.remove("pressed"));
  card.addEventListener("pointercancel", () => card.classList.remove("pressed"));
});


// Feedback audience switcher
const feedbackTabs = document.querySelectorAll(".feedback-tab");
const feedbackPanels = document.querySelectorAll(".feedback-panel");

feedbackTabs.forEach(tab => {
  tab.addEventListener("click", () => {
    const target = tab.dataset.feedback;

    feedbackTabs.forEach(item => {
      const selected = item === tab;
      item.classList.toggle("active", selected);
      item.setAttribute("aria-selected", selected ? "true" : "false");
    });

    feedbackPanels.forEach(panel => {
      const show = panel.dataset.panel === target;
      panel.classList.toggle("active", show);
    });
  });
});
