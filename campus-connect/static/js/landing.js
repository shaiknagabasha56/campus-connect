/* =========================================================
   CAMPUS CONNECT — LANDING PAGE + CINEMATIC INTRO
========================================================= */

const transitionWords = [
  { normal: "ACADEMICS", accent: "" },
  { normal: "NON-ACADEMICS", accent: "" },
  { normal: "CLUBS", accent: "" },
  { normal: "CELLS", accent: "" },
  { normal: "COMPLAINTS", accent: "" },
  { normal: "EMERGENCIES", accent: "" },
  { normal: "ALL OUR", accent: "CAMPUS UPDATES" },
  { normal: "IN ONE PLACE", accent: "" },
  { normal: "CAMPUS", accent: "CONNECT" }
];

const transition = document.getElementById("cinematicTransition");
const wordElement = document.getElementById("cinematicWord");

const settings = {
  screenBeforeWord: 20,
  wordVisible: 150,
  betweenWords: 15,
  finalBlackScreen: 50
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));
}

function setWord(item) {
  const normal = escapeHtml(item.normal || "");
  const accent = escapeHtml(item.accent || "");
  wordElement.innerHTML = normal + (accent ? `<span class="accent"> ${accent}</span>` : "");
}

let originalHtmlOverflow = "";
let originalBodyOverflow = "";

function disablePageScroll() {
  originalHtmlOverflow = document.documentElement.style.overflow;
  originalBodyOverflow = document.body.style.overflow;

  document.documentElement.style.overflow = "hidden";
  document.body.style.overflow = "hidden";
}

function enablePageScroll() {
  document.documentElement.style.overflow = originalHtmlOverflow;
  document.body.style.overflow = originalBodyOverflow;
}

async function playCinematicTransition() {
  if (!transition || !wordElement) return;

  disablePageScroll();

  transition.classList.remove("word-in", "word-out", "is-active");
  wordElement.innerHTML = "";
  void transition.offsetWidth;
  transition.classList.add("is-active");

  await sleep(settings.screenBeforeWord);

  for (let i = 0; i < transitionWords.length; i++) {
    setWord(transitionWords[i]);

    transition.classList.remove("word-out");
    void wordElement.offsetWidth;
    transition.classList.add("word-in");

    await sleep(settings.wordVisible);

    transition.classList.remove("word-in");
    transition.classList.add("word-out");

    await sleep(settings.betweenWords);
    transition.classList.remove("word-out");
  }

  await sleep(settings.finalBlackScreen);
  transition.classList.remove("is-active");
  wordElement.innerHTML = "";

  // Re-enable the page scrollbar only after the intro is completely finished.
  enablePageScroll();
}

window.addEventListener("load", () => {
  playCinematicTransition();
});
