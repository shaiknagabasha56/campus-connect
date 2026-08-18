async function logoutUser() {
        try {
          await fetch("/api/logout", { method: "POST" });
        } catch (e) {
          // ignore network errors, still send the user back to login
        }
        window.location.href = "/login";
      }

(function(){
      const slides = Array.from(document.querySelectorAll('.slide'));
      const dotsWrap = document.getElementById('dots');
      const prevBtn = document.querySelector('.arrow.prev');
      const nextBtn = document.querySelector('.arrow.next');
      let idx = 0;
      let autoTimer = null;
      const AUTO_INTERVAL = 5000;

      // create dots
      slides.forEach((s,i)=>{
        const d = document.createElement('div');
        d.className = 'dot' + (i===0? ' active':'');
        d.dataset.i = i;
        d.addEventListener('click', ()=> goTo(i));
        dotsWrap.appendChild(d);
      });

      function setActive(newIndex){
        slides.forEach((s,i)=>{
          s.classList.toggle('active', i===newIndex);
        });
        Array.from(dotsWrap.children).forEach((d,i)=> d.classList.toggle('active', i===newIndex));
        idx = newIndex;
      }

      function goTo(i){
        setActive((i+slides.length) % slides.length);
        resetAuto();
      }

      function next(){ goTo(idx+1); }
      function prev(){ goTo(idx-1); }

      prevBtn.addEventListener('click', prev);
      nextBtn.addEventListener('click', next);

      function resetAuto(){
        if(autoTimer) clearInterval(autoTimer);
        autoTimer = setInterval(next, AUTO_INTERVAL);
      }
      resetAuto();

      // simple nav-search focusing (no backend)
      const navSearch = document.getElementById('nav-search');
      navSearch.addEventListener('keydown', (e)=>{
        if(e.key === 'Enter'){
          const q = navSearch.value.trim().toLowerCase();
          if(!q) return;
          // naive highlight: filter announcement cards by title/content
          const cards = document.querySelectorAll('#notice-cards .card');
          cards.forEach(card=>{
            const text = card.innerText.toLowerCase();
            card.style.display = text.includes(q) ? '' : 'none';
          });
        }
      });
      
      // PROFILE DASHBOARD TOGGLE
const profileIcon = document.querySelector('.profile');
const dashboard = document.getElementById('profileDashboard');
const overlay = document.getElementById('dashboardOverlay');
const closeBtn = document.querySelector('.close-dashboard');

function openDashboard(){
  dashboard.classList.add('active');
  overlay.classList.add('active');
  dashboard.setAttribute('aria-hidden', 'false');
}

function closeDashboard(){
  dashboard.classList.remove('active');
  overlay.classList.remove('active');
  dashboard.setAttribute('aria-hidden', 'true');
}

profileIcon.addEventListener('click', openDashboard);
closeBtn.addEventListener('click', closeDashboard);
overlay.addEventListener('click', closeDashboard);

// Handle sub-panels
const optionButtons = document.querySelectorAll('.dash-btn[data-panel]');
const subPanels = document.querySelectorAll('.sub-dashboard');
const backButtons = document.querySelectorAll('.back-btn');

optionButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const panelId = btn.getAttribute('data-panel');
    document.getElementById(panelId).classList.add('active');
  });
});

backButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    btn.closest('.sub-dashboard').classList.remove('active');
  });
});

// Also close sub-panels if dashboard is closed
closeBtn.addEventListener('click', () => {
  subPanels.forEach(p => p.classList.remove('active'));
  closeDashboard();
});
overlay.addEventListener('click', () => {
  subPanels.forEach(p => p.classList.remove('active'));
  closeDashboard();
});

  function rotateAnnouncements(card, interval) {
    const announcements = card.querySelectorAll(".announcement");
    let index = 0;
    let intervalId;

    function startRotation() {
      intervalId = setInterval(() => {
        announcements[index].classList.remove("active");
        index = (index + 1) % announcements.length;
        announcements[index].classList.add("active");
      }, interval);
    }

    function stopRotation() {
      clearInterval(intervalId);
    }

    // Start rotation initially
    startRotation();

    // Pause when mouse enters, resume when mouse leaves
    card.addEventListener("mouseenter", stopRotation);
    card.addEventListener("mouseleave", startRotation);
  }

  document.querySelectorAll(".card").forEach(card => {
    let interval = parseInt(card.getAttribute("data-interval")) || 4000;
    rotateAnnouncements(card, interval);
  });


      // reset filter when clearing search
      navSearch.addEventListener('input', ()=>{
        if(navSearch.value.trim()===''){
          const cards = document.querySelectorAll('#notice-cards .card');
          cards.forEach(card=> card.style.display = '');
        }
      });

    })();
    
      (function(){
    const toggleBtn = document.getElementById('rg-chat-toggle');
    const panel = document.getElementById('rg-chat-panel');
    const closeBtn = document.getElementById('rg-chat-close');
    const messagesWrap = document.getElementById('rg-chat-messages');
    const input = document.getElementById('rg-chat-input');
    const sendBtn = document.getElementById('rg-send-btn');
    const emojiBtn = document.getElementById('rg-emoji-btn');
    const emojiPicker = document.getElementById('rg-emoji-picker');
    const suggestions = document.getElementById('rg-chat-suggestions');

    let emojiOpen = false;

    function openPanel(){
      panel.classList.add('rg-open');
      panel.setAttribute('aria-hidden','false');
      toggleBtn.style.display = 'none';
      input.focus();
    }
    function closePanel(){
      panel.classList.remove('rg-open');
      panel.setAttribute('aria-hidden','true');
      toggleBtn.style.display = 'flex';
      hideEmojiPicker();
    }

    toggleBtn.addEventListener('click', (e) => { openPanel(); });
    closeBtn.addEventListener('click', (e) => { closePanel(); });

    // append message helpers
    function appendUser(text){
      const el = document.createElement('div');
      el.className = 'rg-msg rg-user';
      el.textContent = text;
      messagesWrap.appendChild(el);
      scrollBottom();
    }
    function appendBot(text){
      const el = document.createElement('div');
      el.className = 'rg-msg rg-bot';
      el.textContent = text;
      messagesWrap.appendChild(el);
      scrollBottom();
    }
    function scrollBottom(){
      // small timeout to allow DOM to render then scroll
      setTimeout(()=> messagesWrap.scrollTop = messagesWrap.scrollHeight, 40);
    }

    // central send function (used for button, Enter, and suggested buttons)
    function sendMessage(textFromSuggestion){
      const text = (typeof textFromSuggestion === 'string' ? textFromSuggestion : input.value).trim();
      if(!text) return;

      // if it came from input, clear it
      if(typeof textFromSuggestion !== 'string') input.value = '';

      // hide emoji picker (so it doesn't block)
      hideEmojiPicker();

      appendUser(text);

      // placeholder bot reply (simulate)
      setTimeout(()=>{
        appendBot("You said: " + text);
      }, 700);
    }

    // send on click
    sendBtn.addEventListener('click', ()=> sendMessage());

    // send on Enter key
    input.addEventListener('keydown', function(e){
      if(e.key === "Enter"){
        e.preventDefault();
        sendMessage();
      }
    });

    // SUGGESTED BUTTONS: send immediately when clicked
    suggestions.addEventListener('click', function(e){
      const btn = e.target.closest('.rg-suggest');
      if(!btn) return;
      sendMessage(btn.textContent.trim());
    });

    // EMOJI PICKER: toggle, click to insert and auto-close
    function showEmojiPicker(){
      emojiPicker.classList.add('rg-show');
      emojiPicker.setAttribute('aria-hidden','false');
      emojiOpen = true;
      emojiBtn.setAttribute('aria-expanded','true');
    }
    function hideEmojiPicker(){
      emojiPicker.classList.remove('rg-show');
      emojiPicker.setAttribute('aria-hidden','true');
      emojiOpen = false;
      emojiBtn.setAttribute('aria-expanded','false');
    }

    emojiBtn.addEventListener('click', function(e){
      e.stopPropagation(); // avoid document click closing it
      if(emojiOpen) hideEmojiPicker();
      else showEmojiPicker();
    });

    // click an emoji to insert and close picker (and focus input)
    emojiPicker.addEventListener('click', function(e){
      const el = e.target.closest('.rg-emoji');
      if(!el) return;
      const emoji = el.dataset.emoji;
      if(emoji){
        input.value = input.value + emoji;
        hideEmojiPicker();
        input.focus();
      }
    });

    // close emoji picker on outside click or Esc
    document.addEventListener('click', function(e){
      // if click is outside picker and outside emojiBtn -> hide picker
      if(emojiOpen){
        if(!emojiPicker.contains(e.target) && e.target !== emojiBtn){
          hideEmojiPicker();
        }
      }
    });
    document.addEventListener('keydown', function(e){
      if(e.key === 'Escape' && emojiOpen) hideEmojiPicker();
      if(e.key === 'Escape' && panel.classList.contains('rg-open')) {
        // optional: pressing Esc closes panel (uncomment if desired)
        // closePanel();
      }
    });

    // accessibility: prevent click on messages area from closing things accidentally
    messagesWrap.addEventListener('click', (e)=> e.stopPropagation());

    // initial demo bot message already present; scroll to bottom
    scrollBottom();

    // If you want to close the whole panel when clicking outside, uncomment below:
    /*
    document.addEventListener('click', function(e){
      if(panel.classList.contains('rg-open')){
        if(!panel.contains(e.target) && e.target !== toggleBtn){
          closePanel();
        }
      }
    });
    */
  })();
  
  //radio_script
  document.addEventListener('DOMContentLoaded', ()=>{

  // Elements
  const menuItems = document.querySelectorAll('.menu-item');
  const needle = document.getElementById('needle');
  const dial = document.getElementById('dial');
  const ticksContainer = document.getElementById('ticks');
  const freqNum = document.getElementById('freqNum');
  const freqLabel = document.getElementById('freqLabel');
  const metaName = document.getElementById('metaName');
  const metaState = document.getElementById('metaState');
  const playPauseBtn = document.getElementById('playPauseBtn');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const audio = document.getElementById('player');

  // Config
  const ANGLE_MIN = -110;   // left-most needle angle (deg)
  const ANGLE_MAX =  110;   // right-most needle angle (deg)
  const FREQ_MIN = 88.0;
  const FREQ_MAX = 108.0;

  // Category definitions and streams (replace placeholder streams with yours)
  const categories = [
    { id:'college',  name:'College Radio',    draggable:true,
      // College has multiple stations at specific frequencies
      stations:[
        { freq: 88.3, title:'Campus Jazz 88.3', stream:'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
        { freq: 90.1, title:'Campus News 90.1', stream:'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
        { freq: 93.1, title:'KBS 1 FM (Sim) 93.1', stream:'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
        { freq: 96.5, title:'Campus Rock 96.5', stream:'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3' },
        { freq:100.3, title:'Student Talks 100.3', stream:'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3' },
        { freq:104.5, title:'Classical 104.5', stream:'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3' },
        { freq:107.9, title:'Late Night 107.9', stream:'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3' }
      ]
    },
    { id:'commentary', name:'Live Commentary', draggable:false,
      stream:'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3',
      title:'Live Commentary'
    },
    { id:'meetings',   name:'Meetings', draggable:false,
      stream:'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3',
      title:'Seminar Meetings'
    },
    { id:'songs',      name:'Special Songs', draggable:false,
      stream:'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      title:'Special Songs'
    }
  ];

  // state
  let activeCategoryIndex = 0;
  let currentFreq = 93.1;
  let isPlaying = true;
  let dragging = false;
  let lastAutoStationIndex = -1;
  let needleAngle = freqToAngle(currentFreq);

  // Utility: linear map
  function map(value, inMin, inMax, outMin, outMax){
    return outMin + (outMax - outMin) * ((value - inMin) / (inMax - inMin));
  }

  // Angle <-> Frequency mapping (linearly)
  function freqToAngle(freq){
    return map(freq, FREQ_MIN, FREQ_MAX, ANGLE_MIN, ANGLE_MAX);
  }
  function angleToFreq(angle){
    return parseFloat(map(angle, ANGLE_MIN, ANGLE_MAX, FREQ_MIN, FREQ_MAX).toFixed(1));
  }

  // Initialize the ticks (like mm/cm scale) around dial
  function buildTicks(){
    ticksContainer.innerHTML = '';
    const dialRect = dial.getBoundingClientRect();
    const radius = dialRect.width/2 - 18;
    const centerX = dialRect.width/2;
    const centerY = dialRect.height/2;

    // major ticks every 2 MHz
    for (let f = FREQ_MIN; f <= FREQ_MAX + 0.001; f += 2.0){
      const angle = freqToAngle(f);
      const rad = (angle) * Math.PI/180;
      // compute position slightly outside the inner circle
      const r = radius - 8;
      // convert (0 deg at up): math uses angle 0 at up positive clockwise -> use same rad
      // we computed angle to rotate needle similarly, so place positions accordingly
      const x = centerX + r * Math.sin(rad); // sin because 0 at up
      const y = centerY - r * Math.cos(rad);
      const el = document.createElement('div');
      el.style.position = 'absolute';
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
      el.style.transform = 'translate(-50%,-50%)';
      el.style.fontSize = '12px';
      el.style.color = 'rgba(255,255,255,0.75)';
      el.style.fontWeight = '600';
      el.innerText = `${f.toFixed(0)}`;
      el.title = `${f.toFixed(1)} MHz`;
      ticksContainer.appendChild(el);

      // minor tick (small dot) closer to edge
      const d = document.createElement('div');
      const r2 = radius - 24;
      const x2 = centerX + r2 * Math.sin(rad);
      const y2 = centerY - r2 * Math.cos(rad);
      d.style.position = 'absolute';
      d.style.left = `${x2}px`;
      d.style.top = `${y2}px`;
      d.style.transform = 'translate(-50%,-50%)';
      d.style.width = '6px';
      d.style.height = '6px';
      d.style.borderRadius = '50%';
      d.style.background = 'rgba(255,255,255,0.06)';
      ticksContainer.appendChild(d);
    }

    // Add small markers for each 1 MHz between
    for (let f = FREQ_MIN+1; f < FREQ_MAX; f += 2){
      const angle = freqToAngle(f);
      const rad = angle * Math.PI/180;
      const r2 = radius - 20;
      const x2 = centerX + r2 * Math.sin(rad);
      const y2 = centerY - r2 * Math.cos(rad);
      const d = document.createElement('div');
      d.style.position = 'absolute';
      d.style.left = `${x2}px`;
      d.style.top = `${y2}px`;
      d.style.transform = 'translate(-50%,-50%)';
      d.style.width = '4px';
      d.style.height = '4px';
      d.style.borderRadius = '50%';
      d.style.background = 'rgba(255,255,255,0.04)';
      ticksContainer.appendChild(d);
    }
  }

  // Update needle rotation & displayed frequency
  function updateNeedle(angle){
    needleAngle = Math.max(ANGLE_MIN, Math.min(ANGLE_MAX, angle));
    needle.style.transform = `rotate(${needleAngle}deg)`;
    if (isCollegeMode()) {
      currentFreq = angleToFreq(needleAngle);
      freqNum.textContent = currentFreq.toFixed(1);
      freqLabel.textContent = `FM • ${currentFreq.toFixed(1)} MHz`;
      needle.setAttribute('aria-valuenow', currentFreq.toFixed(1));
      // auto-switch to nearest college station when close
      tryAutoSwitchStation(currentFreq);
    }
  }

  // Detect nearest station and auto-switch (for College Radio)
  function tryAutoSwitchStation(freq){
    const cat = categories[activeCategoryIndex];
    if (!cat || !cat.stations) return;
    let nearest = -1, mind = Infinity;
    cat.stations.forEach((s,i)=>{
      const d = Math.abs(s.freq - freq);
      if (d < mind){ mind = d; nearest = i; }
    });
    // threshold (MHz) to auto switch
    const THRESH = 0.45;
    if (nearest !== -1 && mind <= THRESH && nearest !== lastAutoStationIndex){
      // switch
      const st = cat.stations[nearest];
      audio.src = st.stream;
      audio.play().catch(()=>{});
      lastAutoStationIndex = nearest;
      metaName.textContent = `${st.title} • ${st.freq.toFixed(1)} MHz`;
      metaState.textContent = 'Playing';
      isPlaying = true;
      playPauseBtn.textContent = '⏸ Pause';
    } else if (mind > THRESH){
      // not near any specific station -> don't auto-change or clear meta
      // keep lastAutoStationIndex as-is
      metaName.textContent = `Tuning • ${freq.toFixed(1)} MHz`;
    }
  }

  // Helper: check if active category is college
  function isCollegeMode(){ return categories[activeCategoryIndex].id === 'college' }

  // Load category (when clicking sidebar or next/prev)
  function loadCategory(index){
    activeCategoryIndex = (index + categories.length) % categories.length;
    // update sidebar active class
    menuItems.forEach(it => it.classList.remove('active'));
    const activeMenu = document.querySelector(`.menu-item[data-id="${categories[activeCategoryIndex].id}"]`);
    if (activeMenu) activeMenu.classList.add('active');

    // behavior
    const cat = categories[activeCategoryIndex];
    metaName.textContent = cat.name;
    lastAutoStationIndex = -1;

    if (cat.draggable){
      // College: enable needle dragging and set some frequency / center text
      needle.classList.remove('disabled');
      // keep currentFreq; ensure needle matches it
      updateNeedle(freqToAngle(currentFreq));
      // show label
      freqLabel.textContent = `FM • ${currentFreq.toFixed(1)} MHz`;
      // set audio to nearest station now
      tryAutoSwitchStation(currentFreq);
    } else {
  needle.classList.add('disabled');       // keep needle disabled
  audio.src = cat.stream;                 // set audio stream
  audio.play().catch(()=>{});             // play audio
  metaState.textContent = 'Playing';      // show playing state
  isPlaying = true;                        // update playing flag
  playPauseBtn.textContent = '⏸ Pause';   // update button text

  // Removed lines:
  // metaName.textContent = (cat.title || cat.name);
  // freqNum.textContent = cat.name;
  // freqLabel.textContent = cat.title || cat.name;
}
  }

  // Play/pause toggle
  playPauseBtn.addEventListener('click', ()=>{
    if (!audio.src) return;
    if (audio.paused){
      audio.play().catch(()=>{});
      isPlaying = true; metaState.textContent = 'Playing'; playPauseBtn.textContent = '⏸ Pause';
    } else{
      audio.pause();
      isPlaying = false; metaState.textContent = 'Paused'; playPauseBtn.textContent = '▶ Play';
    }
  });

  // Prev/Next buttons cycle categories
  prevBtn.addEventListener('click', ()=>{
    loadCategory(activeCategoryIndex - 1);
  });
  nextBtn.addEventListener('click', ()=>{
    loadCategory(activeCategoryIndex + 1);
  });

  // Sidebar clicks
  menuItems.forEach((el, idx)=>{
    el.addEventListener('click', ()=>{
      // find index of clicked id
      const id = el.getAttribute('data-id');
      const catIndex = categories.findIndex(c=>c.id===id);
      if (catIndex>=0) loadCategory(catIndex);
    });
  });

  // Needle dragging (pointer events)
  function getCenter(el){
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width/2, y: r.top + r.height/2 };
  }

  let pointerId = null;
  needle.addEventListener('pointerdown', (ev)=>{
    // only allow in college mode
    if (!isCollegeMode()) return;
    ev.preventDefault();
    dragging = true;
    pointerId = ev.pointerId;
    needle.setPointerCapture(pointerId);
    needle.style.transition = 'none';
  });

  window.addEventListener('pointermove', (ev)=>{
    if (!dragging || ev.pointerId !== pointerId) return;
    const c = getCenter(dial);
    const dx = ev.clientX - c.x;
    const dy = ev.clientY - c.y;
    // compute angle where 0 = top, positive = clockwise to right
    let deg = Math.atan2(dy, dx) * 180/Math.PI; // 0 at right
    deg = deg + 90; // shift so 0 is top
    if (deg > 180) deg -= 360; // normalize -180..180
    // clamp
    if (deg < ANGLE_MIN) deg = ANGLE_MIN;
    if (deg > ANGLE_MAX) deg = ANGLE_MAX;
    updateNeedle(deg);
  });

  window.addEventListener('pointerup', (ev)=>{
    if (!dragging || ev.pointerId !== pointerId) return;
    dragging = false;
    if (pointerId) {
      try { needle.releasePointerCapture(pointerId); } catch(e){}
      pointerId = null;
    }
    needle.style.transition = 'transform 0.35s cubic-bezier(.2,.9,.3,1)';
  });

  // When window resizes, rebuild ticks (positions depend on size)
  window.addEventListener('resize', ()=>{ buildTicks(); });

  // initial setup
  buildTicks();
  // set default frequency & needle
  currentFreq = 93.1;
  updateNeedle(freqToAngle(currentFreq));

  // load default category (College)
  loadCategory(0);

  // Make sure meta state toggles when audio plays/pauses naturally
  audio.addEventListener('play', ()=>{ metaState.textContent = 'Playing'; playPauseBtn.textContent = '⏸ Pause'; isPlaying = true; });
  audio.addEventListener('pause', ()=>{ metaState.textContent = 'Paused'; playPauseBtn.textContent = '▶ Play'; isPlaying = false; });

  // Accessibility: keyboard left/right to rotate needle when college mode active
  window.addEventListener('keydown', (e)=>{
    if (!isCollegeMode()) return;
    if (e.key === 'ArrowRight'){ updateNeedle(needleAngle + 2); }
    if (e.key === 'ArrowLeft'){ updateNeedle(needleAngle - 2); }
  });

  // Good to know: many browsers block autoplay; audio.play() may require user gesture.
  // When testing, click a menu item or Play button once to allow audio.
});


const calendarToggle = document.getElementById("calendar-toggle");
const calendarPanel = document.getElementById("calendar-panel");
const calendarDays = document.getElementById("calendar-days");
const monthYear = document.getElementById("month-year");
const prevBtn = document.getElementById("prev-month");
const nextBtn = document.getElementById("next-month");
const eventsEl = document.getElementById("events");

let currentDate = new Date();

// Toggle calendar panel
calendarToggle.addEventListener("click", () => {
  calendarPanel.classList.toggle("hidden");
});

function renderCalendar(date) {
  const year = date.getFullYear();
  const month = date.getMonth();

  // Month-Year header
  const monthNames = ["January","February","March","April","May","June",
    "July","August","September","October","November","December"];
  monthYear.textContent = `${monthNames[month]} ${year}`;

  // Clear old days
  calendarDays.innerHTML = "";

  // Find first day and last date
  const firstDay = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();

  // Padding before first day
  for (let i = 0; i < firstDay; i++) {
    const empty = document.createElement("div");
    calendarDays.appendChild(empty);
  }

  // Create days
  for (let d = 1; d <= lastDate; d++) {
    const day = document.createElement("div");
    day.textContent = d;
    day.classList.add("day");

    // Highlight today
    if (
      d === new Date().getDate() &&
      month === new Date().getMonth() &&
      year === new Date().getFullYear()
    ) {
      day.classList.add("today");
    }

    day.addEventListener("click", () => {
      eventsEl.textContent = `Events for ${d} ${monthNames[month]} ${year}: None`;
    });

    calendarDays.appendChild(day);
  }
}

// Navigation
prevBtn.addEventListener("click", () => {
  currentDate.setMonth(currentDate.getMonth() - 1);
  renderCalendar(currentDate);
});

nextBtn.addEventListener("click", () => {
  currentDate.setMonth(currentDate.getMonth() + 1);
  renderCalendar(currentDate);
});

// Load initial calendar
renderCalendar(currentDate);


//Dark or light theme:
const themeToggle = document.getElementById('themeToggle');
const themeIcon = document.getElementById('themeIcon');

themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark-theme');

  // Switch icon
  if(document.body.classList.contains('dark-theme')){
    // Sun icon for light mode
    themeIcon.innerHTML = '<path d="M8 0a.5.5 0 0 1 .5.5V2h-1V.5A.5.5 0 0 1 8 0zm4.95 1.05a.5.5 0 0 1 .7.7l-1.06 1.06-.7-.7 1.06-1.06zM16 8a.5.5 0 0 1-.5.5H14v-1h1.5A.5.5 0 0 1 16 8zm-1.05 4.95a.5.5 0 0 1-.7.7l-1.06-1.06.7-.7 1.06 1.06zM8 16a.5.5 0 0 1-.5-.5V14h1v1.5a.5.5 0 0 1-.5.5zm-4.95-1.05a.5.5 0 0 1-.7-.7l1.06-1.06.7.7-1.06 1.06zM0 8a.5.5 0 0 1 .5-.5H2v1H.5A.5.5 0 0 1 0 8zm1.05-4.95a.5.5 0 0 1 .7-.7l1.06 1.06-.7.7L1.05 3.05z"/>'; 
  } else {
    // Moon icon for dark mode
    themeIcon.innerHTML = '<path d="M6 0a6 6 0 1 0 6 6A6 6 0 0 0 6 0zm0 11a5 5 0 1 1 5-5 5 5 0 0 1-5 5z"/>';
  }
});
