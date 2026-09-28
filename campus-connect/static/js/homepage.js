async function logoutUser() {

    try {

        const response = await fetch("/auth/logout", {
            method: "POST"
        });

        if (response.redirected) {
          window.location.href = response.url;
          return;
        }

        const data = await response.json();

        if (data.success) {

            window.location.href = "/auth/login";

        } else {

            console.error("Logout failed.");

        }

    } catch (error) {

        console.error("Logout error:", error);

    }

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
      
  // ============================================================
// PROFILE DASHBOARD TOGGLE
// ============================================================

const profileIcon = document.querySelector('.profile');
const dashboard = document.getElementById('profileDashboard');
const overlay = document.getElementById('dashboardOverlay');
const closeBtn = document.querySelector('.close-dashboard');


// ------------------------------------------------------------
// OPEN PROFILE DASHBOARD
// ------------------------------------------------------------

function openDashboard() {

    if (!dashboard || !overlay) return;

    dashboard.classList.add('active');

    overlay.classList.add('active');

    dashboard.setAttribute(
        'aria-hidden',
        'false'
    );
}


// ------------------------------------------------------------
// CLOSE PROFILE DASHBOARD
// ------------------------------------------------------------

function closeDashboard() {

    if (!dashboard || !overlay) return;

    // Close all sub-panels
    subPanels.forEach(panel => {
        panel.classList.remove('active');
    });

    dashboard.classList.remove('active');

    overlay.classList.remove('active');

    dashboard.setAttribute(
        'aria-hidden',
        'true'
    );
}


// ------------------------------------------------------------
// PROFILE ICON CLICK
// ------------------------------------------------------------

if (profileIcon) {

    profileIcon.addEventListener(
        'click',
        openDashboard
    );

}


// ------------------------------------------------------------
// CLOSE BUTTON
// ------------------------------------------------------------

if (closeBtn) {

    closeBtn.addEventListener(
        'click',
        closeDashboard
    );

}


// ------------------------------------------------------------
// OVERLAY CLICK
// ------------------------------------------------------------

if (overlay) {

    overlay.addEventListener(
        'click',
        closeDashboard
    );

}


// ============================================================
// SUB PANELS
// ============================================================

const optionButtons =
    document.querySelectorAll('[data-panel]');

const subPanels =
    document.querySelectorAll('.sub-dashboard');

const backButtons =
    document.querySelectorAll('.back-btn');


// ------------------------------------------------------------
// OPEN SUB PANEL
// ------------------------------------------------------------

optionButtons.forEach(button => {

    button.addEventListener('click', () => {

        const panelId =
            button.getAttribute('data-panel');

        if (!panelId) return;


        const selectedPanel =
            document.getElementById(panelId);

        if (!selectedPanel) return;


        // Close every other sub-panel
        subPanels.forEach(panel => {

            panel.classList.remove('active');

        });


        // Open selected panel
        selectedPanel.classList.add('active');

    });

});


// ------------------------------------------------------------
// BACK BUTTON
// ------------------------------------------------------------

backButtons.forEach(button => {

    button.addEventListener('click', () => {

        const currentPanel =
            button.closest('.sub-dashboard');

        if (!currentPanel) return;

        currentPanel.classList.remove('active');

    });

});


// ============================================================
// EDIT PROFILE
// ============================================================

const editProfileForm = document.getElementById('editProfileForm');

if (editProfileForm) {

    editProfileForm.addEventListener('submit', async function (event) {

        event.preventDefault();

        const usernameInput = document.getElementById('editUsername');
        const emailInput = document.getElementById('editEmail');
        const message = document.getElementById('profileMessage');
        const saveButton = editProfileForm.querySelector('button[type="submit"]');

        if (!usernameInput || !emailInput || !message) {
            console.error('Edit profile elements are missing.');
            return;
        }

        const username = usernameInput.value.trim();
        const email = emailInput.value.trim().toLowerCase();

        // --------------------------------------------
        // VALIDATION
        // --------------------------------------------

        if (!username) {
            message.textContent = 'Username is required.';
            message.className = 'error-message';
            return;
        }

        if (!email) {
            message.textContent = 'Email is required.';
            message.className = 'error-message';
            return;
        }

        // Prevent duplicate clicks while request is running.
        if (saveButton) {
            saveButton.disabled = true;
            saveButton.dataset.originalText = saveButton.textContent;
            saveButton.textContent = 'Saving...';
        }

        message.textContent = 'Saving changes...';
        message.className = 'success-message';

        try {

            const response = await fetch('/auth/update-profile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: username,
                    email: email
                })
            });

            // Read response as text first so an HTML error page
            // does not cause response.json() to throw.
            const responseText = await response.text();

            let result;

            try {
                result = JSON.parse(responseText);
            } catch (jsonError) {
                console.error(
                    'Profile update returned non-JSON response:',
                    responseText
                );

                throw new Error(
                    `Server returned HTTP ${response.status}`
                );
            }

            if (!response.ok || !result.success) {

                message.textContent =
                    result.message || 'Failed to update profile.';

                message.className = 'error-message';

                return;
            }

            // --------------------------------------------
            // SUCCESS
            // --------------------------------------------

            message.textContent =
                result.message || 'Profile updated successfully.';

            message.className = 'success-message';

            // Update username in sidebar immediately.
            const profileName = document.querySelector('.pd-name');

            if (profileName) {
                profileName.textContent = username;
            }

            // Update email in sidebar immediately.
            const profileEmail = document.querySelector('.pd-email');

            if (profileEmail) {
                profileEmail.textContent = email;
            }

            // Update dashboard avatar.
            const newInitial =
                username.charAt(0).toUpperCase();

            const dashboardAvatar =
                document.querySelector('.pd-avatar');

            if (dashboardAvatar) {
                dashboardAvatar.textContent = newInitial;
            }

            // Update top profile icon.
            const profileInitial =
                document.querySelector('.profile-initial');

            if (profileInitial) {
                profileInitial.textContent = newInitial;
            }

            // Keep the form values synchronized.
            usernameInput.value = username;
            emailInput.value = email;

        } catch (error) {

            console.error(
                'Profile update error:',
                error
            );

            message.textContent =
                'Unable to update profile. Please try again.';

            message.className = 'error-message';

        } finally {

            // Always restore the Save button.
            if (saveButton) {
                saveButton.disabled = false;
                saveButton.textContent =
                    saveButton.dataset.originalText || 'Save Changes';
            }
        }

    });

}

// ============================================================
// CHANGE PASSWORD
// ============================================================

const changePasswordForm =
    document.getElementById(
        'changePasswordForm'
    );


if (changePasswordForm) {

    changePasswordForm.addEventListener(
        'submit',
        async function (event) {

            event.preventDefault();


            const currentPassword =
                document.getElementById(
                    'currentPassword'
                );

            const newPassword =
                document.getElementById(
                    'newPassword'
                );

            const confirmPassword =
                document.getElementById(
                    'confirmPassword'
                );

            const message =
                document.getElementById(
                    'passwordMessage'
                );


            if (
                !currentPassword ||
                !newPassword ||
                !confirmPassword
            ) {

                return;

            }


            const currentValue =
                currentPassword.value;

            const newValue =
                newPassword.value;

            const confirmValue =
                confirmPassword.value;


            // --------------------------------------------
            // EMPTY FIELD VALIDATION
            // --------------------------------------------

            if (
                !currentValue ||
                !newValue ||
                !confirmValue
            ) {

                message.textContent =
                    'Please fill all password fields.';

                message.className =
                    'error-message';

                return;

            }


            // --------------------------------------------
            // PASSWORD MATCH
            // --------------------------------------------

            if (
                newValue !== confirmValue
            ) {

                message.textContent =
                    'New passwords do not match.';

                message.className =
                    'error-message';

                return;

            }


            // --------------------------------------------
            // PASSWORD LENGTH
            // --------------------------------------------

            if (newValue.length < 8) {

                message.textContent =
                    'Password must be at least 8 characters.';

                message.className =
                    'error-message';

                return;

            }


            try {

                // ----------------------------------------
                // SEND TO FLASK
                // ----------------------------------------

                const response = await fetch(
                    '/auth/update-password',
                    {
                        method: 'POST',

                        headers: {
                            'Content-Type':
                                'application/json'
                        },

                        body: JSON.stringify({

                            current_password:
                                currentValue,

                            new_password:
                                newValue,

                            confirm_password:
                                confirmValue

                        })
                    }
                );


                const result =
                    await response.json();


                // ----------------------------------------
                // SHOW SERVER MESSAGE
                // ----------------------------------------

                message.textContent =
                    result.message;


                // ----------------------------------------
                // SUCCESS
                // ----------------------------------------

                if (result.success) {

                    message.className =
                        'success-message';


                    // Clear password fields
                    currentPassword.value =
                        '';

                    newPassword.value =
                        '';

                    confirmPassword.value =
                        '';

                }

                else {

                    message.className =
                        'error-message';

                }


            }

            catch (error) {

                console.error(
                    'Password update error:',
                    error
                );


                message.textContent =
                    'Something went wrong. Please try again.';

                message.className =
                    'error-message';

            }

        }
    );

}
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
document.addEventListener("DOMContentLoaded", () => {
  // ============================================================
  // CAMPUS RADIO
  // Uses the existing homepage Radio markup and the Flask Radio API.
  // The backend is the authoritative source for all audio.
  // ============================================================

  const menuItems = Array.from(document.querySelectorAll(".menu-item"));
  const needle = document.getElementById("needle");
  const dial = document.getElementById("dial");
  const ticksContainer = document.getElementById("ticks");
  const freqNum = document.getElementById("freqNum");
  const freqLabel = document.getElementById("freqLabel");
  const metaName = document.getElementById("metaName");
  const metaState = document.getElementById("metaState");
  const playPauseBtn = document.getElementById("playPauseBtn");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const audio = document.getElementById("player");

  if (
    !menuItems.length ||
    !needle ||
    !dial ||
    !ticksContainer ||
    !freqNum ||
    !freqLabel ||
    !metaName ||
    !metaState ||
    !playPauseBtn ||
    !prevBtn ||
    !nextBtn ||
    !audio
  ) {
    console.warn("Campus Radio: required HTML elements were not found.");
    return;
  }

  const ANGLE_MIN = -110;
  const ANGLE_MAX = 110;
  const FREQ_MIN = 88.0;
  const FREQ_MAX = 108.0;

  const STATE_URL = "/radio/api/state";

  const USE_TEMPORARY_DEMO_FALLBACK = false;

  const fallbackCategories = [
    {
      id: "college",
      name: "College Radio",
      draggable: true,
      stations: [
        {
          freq: 88.3,
          title: "Campus Jazz 88.3",
          stream: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3"
        },
        {
          freq: 90.1,
          title: "Campus News 90.1",
          stream: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3"
        },
        {
          freq: 93.1,
          title: "Campus Radio 93.1",
          stream: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3"
        },
        {
          freq: 96.5,
          title: "Campus Rock 96.5",
          stream: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3"
        },
        {
          freq: 100.3,
          title: "Student Talks 100.3",
          stream: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3"
        },
        {
          freq: 104.5,
          title: "Classical 104.5",
          stream: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3"
        },
        {
          freq: 107.9,
          title: "Late Night 107.9",
          stream: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3"
        }
      ]
    },
    {
      id: "commentary",
      name: "Live Commentary",
      draggable: false,
      stream: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3",
      title: "Live Commentary"
    },
    {
      id: "meetings",
      name: "Meetings",
      draggable: false,
      stream: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3",
      title: "Seminar Meetings"
    },
    {
      id: "songs",
      name: "Special Songs",
      draggable: false,
      stream: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
      title: "Special Songs"
    }
  ];

  let categories = fallbackCategories;
  let activeCategoryIndex = 0;
  let currentFreq = 93.1;
  let needleAngle = 0;
  let dragging = false;
  let pointerId = null;
  let lastStationIndex = -1;
  let backendConnected = false;
  let liveRoom = null;
  let liveChannelId = null;
  let liveAttachedTrack = null;
  const LIVE_CHANNELS = new Set(["college", "commentary"]);

  function map(value, inMin, inMax, outMin, outMax) {
    return outMin + (outMax - outMin) * (
      (value - inMin) / (inMax - inMin)
    );
  }

  function freqToAngle(freq) {
    return map(
      freq,
      FREQ_MIN,
      FREQ_MAX,
      ANGLE_MIN,
      ANGLE_MAX
    );
  }

  function angleToFreq(angle) {
    return parseFloat(
      map(
        angle,
        ANGLE_MIN,
        ANGLE_MAX,
        FREQ_MIN,
        FREQ_MAX
      ).toFixed(1)
    );
  }

  function currentCategory() {
    return categories[activeCategoryIndex] || categories[0];
  }

  function isCollegeMode() {
    return currentCategory()?.id === "college";
  }

  function setMeta(name, state) {
    metaName.textContent = name;
    metaState.textContent = state;
  }

  function updatePlayButton() {
    const hasAudioSource = Boolean(audio.currentSrc || audio.src || liveRoom);

    // The button must be clickable whenever a real audio URL is loaded.
    playPauseBtn.disabled = !hasAudioSource;

    if (audio.paused) {
      playPauseBtn.textContent = "▶ Play";
      playPauseBtn.setAttribute("aria-label", "Play radio");
    } else {
      playPauseBtn.textContent = "⏸ Pause";
      playPauseBtn.setAttribute("aria-label", "Pause radio");
    }
  }

  function buildTicks() {
    ticksContainer.innerHTML = "";

    const rect = dial.getBoundingClientRect();
    const size = Math.min(rect.width, rect.height);

    if (!size) return;

    const radius = size / 2 - 18;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Frequency labels: 88, 90, 92 ... 108
    for (let f = FREQ_MIN; f <= FREQ_MAX + 0.001; f += 2) {
      const angle = freqToAngle(f);
      const rad = angle * Math.PI / 180;
      const r = radius - 8;

      const label = document.createElement("div");
      label.className = "radio-tick-label";
      label.style.position = "absolute";
      label.style.left = `${centerX + r * Math.sin(rad)}px`;
      label.style.top = `${centerY - r * Math.cos(rad)}px`;
      label.style.transform = "translate(-50%, -50%)";
      label.style.fontSize = "12px";
      label.style.color = "rgba(255,255,255,0.82)";
      label.style.fontWeight = "700";
      label.style.pointerEvents = "none";
      label.textContent = f.toFixed(0);

      ticksContainer.appendChild(label);
    }

    // Small dots between the numbered marks.
    for (let f = FREQ_MIN + 1; f < FREQ_MAX; f += 2) {
      const angle = freqToAngle(f);
      const rad = angle * Math.PI / 180;
      const r = radius - 24;

      const dot = document.createElement("div");
      dot.className = "radio-tick-dot";
      dot.style.position = "absolute";
      dot.style.left = `${centerX + r * Math.sin(rad)}px`;
      dot.style.top = `${centerY - r * Math.cos(rad)}px`;
      dot.style.transform = "translate(-50%, -50%)";
      dot.style.width = "5px";
      dot.style.height = "5px";
      dot.style.borderRadius = "50%";
      dot.style.background = "rgba(255,255,255,0.35)";
      dot.style.pointerEvents = "none";

      ticksContainer.appendChild(dot);
    }
  }

  function updateNeedle(angle, switchStation = true) {
    needleAngle = Math.max(
      ANGLE_MIN,
      Math.min(ANGLE_MAX, angle)
    );

    needle.style.transform = `rotate(${needleAngle}deg)`;

    if (!isCollegeMode()) return;

    currentFreq = angleToFreq(needleAngle);
    freqNum.textContent = currentFreq.toFixed(1);
    freqLabel.textContent = `FM • ${currentFreq.toFixed(1)} MHz`;
    needle.setAttribute("aria-valuenow", currentFreq.toFixed(1));

    if (switchStation) {
      tryAutoSwitchStation();
    }
  }

  function nearestStationIndex(freq) {
    const stations = currentCategory()?.stations || [];

    if (!stations.length) return -1;

    let nearest = 0;
    let distance = Infinity;

    stations.forEach((station, index) => {
      const stationFreq = Number(
        station.freq ??
        station.frequency ??
        0
      );

      const d = Math.abs(stationFreq - freq);

      if (d < distance) {
        distance = d;
        nearest = index;
      }
    });

    return nearest;
  }


  function getLiveKitClient() { return window.LivekitClient || window.LiveKitClient || null; }

  async function disconnectLiveRoom() {
    if (liveAttachedTrack) { try { liveAttachedTrack.detach(audio); } catch (_) {} liveAttachedTrack = null; }
    audio.pause(); audio.removeAttribute("src"); audio.srcObject = null; audio.load();
    if (liveRoom) { try { liveRoom.disconnect(); } catch (_) {} }
    liveRoom = null; liveChannelId = null;
    syncPlayButton();
  }

  async function joinLiveRoom(channelId, title) {
    const LiveKit = getLiveKitClient();
    if (!LiveKit) throw new Error("LiveKit client library is not loaded.");
    await disconnectLiveRoom();
    const response = await fetch("/radio/api/live/token", {
      method:"GET"
    });
    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (_) {
      throw new Error(`Live token endpoint returned HTTP ${response.status}, not JSON.`);
    }

    if (!response.ok || data.success === false || !data.token || !data.livekit_url) {
      throw new Error(
        data?.message ||
        `Live connection failed (${response.status})`
      );
    }

    const room = new LiveKit.Room({ adaptiveStream: true, dynacast: true });
    room.on(LiveKit.RoomEvent.TrackSubscribed, (track) => {
      if (!track || track.kind !== LiveKit.Track.Kind.Audio) return;
      if (liveAttachedTrack) { try { liveAttachedTrack.detach(audio); } catch (_) {} }
      liveAttachedTrack = track;
      track.attach(audio);
      audio.autoplay = true;
      setMeta(title, "LIVE • Connected");
      syncPlayButton();
      audio.play().catch(() => { setMeta(title, "LIVE • Click Play to listen"); syncPlayButton(); });
    });
    room.on(LiveKit.RoomEvent.TrackUnsubscribed, (track) => {
      if (track === liveAttachedTrack) { try { track.detach(audio); } catch (_) {} liveAttachedTrack = null; audio.pause(); audio.srcObject = null; setMeta(title, "LIVE • Waiting for audio"); syncPlayButton(); }
    });
    room.on(LiveKit.RoomEvent.Disconnected, () => {
      if (liveRoom !== room) return;
      liveRoom = null; liveChannelId = null; liveAttachedTrack = null; audio.pause(); audio.srcObject = null; setMeta(title, "Live stream disconnected"); syncPlayButton();
    });
    await room.connect(data.livekit_url, data.token);
    liveRoom = room; liveChannelId = channelId;
    room.remoteParticipants.forEach(p => p.trackPublications.forEach(pub => { if (pub.kind === LiveKit.Track.Kind.Audio) pub.setSubscribed(true).catch(() => {}); }));
    setMeta(title, "LIVE • Connected");
    playPauseBtn.disabled = false;
    playPauseBtn.textContent = "▶ Listen Live";
    playPauseBtn.setAttribute("aria-label", "Listen to live radio");
  }

  function playStream(url, title, stateText = "Ready", autoPlay = false) {
    if (typeof url !== "string" || !url.trim()) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();

      playPauseBtn.disabled = true;
      playPauseBtn.textContent = "▶ Play";
      playPauseBtn.setAttribute("aria-label", "Play radio");

      setMeta(title, stateText);
      return false;
    }

    audio.pause();
    audio.src = url;
    audio.load();

    // A valid source has been assigned. Enable Play immediately.
    // Playback itself is still controlled by the user unless autoPlay is true.
    playPauseBtn.disabled = false;
    playPauseBtn.textContent = "▶ Play";
    playPauseBtn.setAttribute("aria-label", "Play radio");

    setMeta(title, stateText);

    if (autoPlay) {
      audio.play().catch(() => {
        setMeta(title, "Click Play to listen");
        updatePlayButton();
      });
    }

    return true;
  }

  function tryAutoSwitchStation() {
    if (!isCollegeMode()) return;

    const stations = currentCategory()?.stations || [];
    if (!stations.length) return;

    const index = nearestStationIndex(currentFreq);
    if (index < 0) return;

    const station = stations[index];
    const stationFreq = Number(
      station.freq ??
      station.frequency ??
      currentFreq
    );

    // Only lock onto a station when the tuner is reasonably close.
    const distance = Math.abs(stationFreq - currentFreq);

    if (distance > 0.45) {
      lastStationIndex = -1;
      setMeta(
        "Tuning",
        `${currentFreq.toFixed(1)} MHz`
      );
      return;
    }

    if (index === lastStationIndex) {
      return;
    }

    lastStationIndex = index;
    currentFreq = stationFreq;

    updateNeedle(
      freqToAngle(currentFreq),
      false
    );

    const title =
      station.title ||
      station.name ||
      `College Radio • ${currentFreq.toFixed(1)} MHz`;

    if (currentCategory()?.live && LIVE_CHANNELS.has("college")) {
      joinLiveRoom("college", String(title || "College Radio")).catch(error => {
        console.error("Live College Radio connection error:", error);
        setMeta(title, error.message || "Live stream unavailable");
        playPauseBtn.disabled = true;
      });
      return;
    }

    const stream =
      station.stream ||
      station.stream_url ||
      station.audio_url ||
      station.url;

    playStream(
      stream,
      `${title} • ${currentFreq.toFixed(1)} MHz`,
      backendConnected ? "Ready" : "Demo",
      false
    );
  }

  function updateActiveMenu() {
    const id = currentCategory()?.id;

    menuItems.forEach(item => {
      const active = item.getAttribute("data-id") === id;
      item.classList.toggle("active", active);
      item.setAttribute(
        "aria-current",
        active ? "true" : "false"
      );
    });
  }

  function loadCategory(index, autoPlay = false) {
    activeCategoryIndex =
      (index + categories.length) % categories.length;

    const cat = currentCategory();

    updateActiveMenu();
    lastStationIndex = -1;

    if (!cat) return;

    if (cat.draggable) {
      needle.classList.remove("disabled");

      if (!Number.isFinite(currentFreq)) {
        currentFreq = 93.1;
      }

      updateNeedle(
        freqToAngle(currentFreq),
        true
      );

      freqNum.textContent = currentFreq.toFixed(1);
      freqLabel.textContent =
        `FM • ${currentFreq.toFixed(1)} MHz`;

      if (cat.live && LIVE_CHANNELS.has(cat.id)) {
        joinLiveRoom(cat.id, String(cat.title || cat.name || cat.id)).catch(error => {
          console.error("Live College Radio connection error:", error);
          setMeta(cat.title || cat.name, error.message || "Live stream unavailable");
          playPauseBtn.disabled = true;
        });
      } else if (liveRoom) {
        disconnectLiveRoom();
      }

      return;
    }

    needle.classList.add("disabled");

    const stream =
      cat.stream ||
      cat.stream_url ||
      cat.audio_url ||
      cat.url;

    const title =
      cat.title ||
      cat.name;

    freqLabel.textContent =
      `FM • ${cat.name || "Campus Radio"}`;

    if (cat.live && LIVE_CHANNELS.has(cat.id)) {
      joinLiveRoom(cat.id, String(title || cat.name || cat.id)).catch(error => {
        console.error("Live Radio connection error:", error);
        setMeta(title, error.message || "Live stream unavailable");
        playPauseBtn.disabled = true;
      });
      return;
    }

    if (liveRoom) disconnectLiveRoom();

    setMeta(
      title,
      stream ? "Ready" : "Offline"
    );

    playStream(
      stream,
      title,
      stream
        ? (backendConnected ? "Ready" : "Demo")
        : "Offline",
      autoPlay
    );
  }

  function applyBackendState(data) {
    if (!data || typeof data !== "object") {
      throw new Error("Invalid Radio API response");
    }

    const source = data.channels || data;

    const result = [];

    const ids = [
      "college",
      "commentary",
      "meetings",
      "songs"
    ];

    ids.forEach(id => {
      const channel = source[id];

      if (!channel) return;

      const item = {
        id,
        name:
          channel.name ||
          channel.title ||
          fallbackCategories.find(c => c.id === id)?.name ||
          id,
        title:
          channel.title ||
          channel.name ||
          id,
        draggable: id === "college",
        stream:
          channel.stream_url ||
          channel.audio_url ||
          channel.url ||
          null,
        live: Boolean(channel.live) || Boolean(channel.is_live),
        stations: Array.isArray(channel.stations)
          ? channel.stations.map(station => ({
              ...station,
              freq: Number(
                station.freq ??
                station.frequency ??
                88
              ),
              stream:
                station.stream ||
                station.stream_url ||
                station.audio_url ||
                station.url ||
                null,
              title:
                station.title ||
                station.name ||
                "College Radio"
            }))
          : []
      };

      result.push(item);
    });

    // Also support APIs that return a top-level stations array.
    if (
      result.some(c => c.id === "college") &&
      Array.isArray(data.stations)
    ) {
      const college = result.find(c => c.id === "college");

      if (!college.stations.length) {
        college.stations = data.stations.map(station => ({
          ...station,
          freq: Number(
            station.freq ??
            station.frequency ??
            88
          ),
          stream:
            station.stream ||
            station.stream_url ||
            station.audio_url ||
            station.url ||
            null,
          title:
            station.title ||
            station.name ||
            "College Radio"
        }));
      }
    }

    if (result.length) {
      categories = result;
      backendConnected = true;
    }
  }

  async function refreshRadioState() {
    try {
      const response = await fetch(STATE_URL, {
        method: "GET",
        headers: {
          Accept: "application/json"
        },
        cache: "no-store"
      });

      if (!response.ok) {
        throw new Error(
          `Radio API returned HTTP ${response.status}`
        );
      }

      const data = await response.json();

      applyBackendState(data);

      loadCategory(
        Math.min(
          activeCategoryIndex,
          categories.length - 1
        ),
        false
      );
    } catch (error) {
      console.warn(
        "Radio API unavailable. Using temporary Radio fallback.",
        error
      );

      if (!USE_TEMPORARY_DEMO_FALLBACK) {
        categories = [
          {
            id: "college",
            name: "College Radio",
            draggable: true,
            stations: []
          },
          {
            id: "commentary",
            name: "Live Commentary",
            draggable: false,
            stream: null,
            title: "Live Commentary"
          },
          {
            id: "meetings",
            name: "Meetings",
            draggable: false,
            stream: null,
            title: "Meetings"
          },
          {
            id: "songs",
            name: "Special Songs",
            draggable: false,
            stream: null,
            title: "Special Songs"
          }
        ];

        backendConnected = false;
        loadCategory(activeCategoryIndex, false);
      }
    }
  }

  // ------------------------------------------------------------
  // PLAY / PAUSE
  // ------------------------------------------------------------

  // Keep the button state synchronized with the actual audio element.
  function syncPlayButton() {
    const hasSource = Boolean(audio.currentSrc || audio.src || liveRoom);
    playPauseBtn.disabled = !hasSource;

    if (audio.paused) {
      playPauseBtn.textContent = liveRoom ? "▶ Listen Live" : "▶ Play";
      playPauseBtn.setAttribute(
        "aria-label",
        liveRoom ? "Listen to live radio" : "Play radio"
      );
    } else {
      playPauseBtn.textContent = "⏸ Pause";
      playPauseBtn.setAttribute("aria-label", "Pause radio");
    }
  }

  playPauseBtn.addEventListener("click", () => {
    if (liveRoom) {
      if (audio.paused) audio.play().catch(() => setMeta(metaName.textContent, "Click Play to listen live"));
      else audio.pause();
      return;
    }

    if (!audio.src) {
      setMeta(
        metaName.textContent,
        backendConnected
          ? "No audio available"
          : "Demo stream unavailable"
      );
      return;
    }

    if (audio.paused) {
      audio.play().catch(() => {
        setMeta(
          metaName.textContent,
          "Unable to play"
        );
      });
    } else {
      audio.pause();
    }
  });

  // ------------------------------------------------------------
  // PREVIOUS / NEXT
  // ------------------------------------------------------------

  prevBtn.addEventListener("click", () => {
    loadCategory(
      activeCategoryIndex - 1,
      true
    );
  });

  nextBtn.addEventListener("click", () => {
    loadCategory(
      activeCategoryIndex + 1,
      true
    );
  });

  // ------------------------------------------------------------
  // SIDEBAR / RADIO CATEGORIES
  // ------------------------------------------------------------

  menuItems.forEach(item => {
    item.addEventListener("click", () => {
      const id = item.getAttribute("data-id");

      const index = categories.findIndex(
        category => category.id === id
      );

      if (index >= 0) {
        loadCategory(index, false);
      }
    });
  });

  // ------------------------------------------------------------
  // NEEDLE DRAGGING
  // ------------------------------------------------------------

  function getCenter(element) {
    const rect = element.getBoundingClientRect();

    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    };
  }

  needle.addEventListener("pointerdown", event => {
    if (!isCollegeMode()) return;

    event.preventDefault();

    dragging = true;
    pointerId = event.pointerId;

    try {
      needle.setPointerCapture(pointerId);
    } catch (_) {}

    needle.style.transition = "none";
  });

  window.addEventListener("pointermove", event => {
    if (!dragging || event.pointerId !== pointerId) {
      return;
    }

    const center = getCenter(dial);

    const dx = event.clientX - center.x;
    const dy = event.clientY - center.y;

    let angle =
      Math.atan2(dy, dx) * 180 / Math.PI;

    angle += 90;

    if (angle > 180) {
      angle -= 360;
    }

    angle = Math.max(
      ANGLE_MIN,
      Math.min(ANGLE_MAX, angle)
    );

    updateNeedle(angle, true);
  });

  window.addEventListener("pointerup", event => {
    if (!dragging || event.pointerId !== pointerId) {
      return;
    }

    dragging = false;

    try {
      needle.releasePointerCapture(pointerId);
    } catch (_) {}

    pointerId = null;
    needle.style.transition =
      "transform 0.35s cubic-bezier(.2,.9,.3,1)";
  });

  // ------------------------------------------------------------
  // KEYBOARD TUNING
  // ------------------------------------------------------------

  window.addEventListener("keydown", event => {
    if (!isCollegeMode()) return;

    if (
      event.target &&
      (
        event.target.tagName === "INPUT" ||
        event.target.tagName === "TEXTAREA" ||
        event.target.tagName === "SELECT"
      )
    ) {
      return;
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      updateNeedle(
        needleAngle + 2,
        true
      );
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      updateNeedle(
        needleAngle - 2,
        true
      );
    }

    if (event.key === " ") {
      event.preventDefault();
      playPauseBtn.click();
    }
  });

  // ------------------------------------------------------------
  // AUDIO EVENTS
  // ------------------------------------------------------------

  audio.addEventListener("play", () => {
    metaState.textContent = "Playing";
    syncPlayButton();
  });

  audio.addEventListener("pause", () => {
    metaState.textContent = "Paused";
    syncPlayButton();
  });

  audio.addEventListener("ended", () => {
    metaState.textContent = "Ended";
    syncPlayButton();
  });

  audio.addEventListener("error", () => {
    metaState.textContent = "Stream unavailable";
    // Keep Play available so the user can retry the loaded source.
    playPauseBtn.disabled = !Boolean(audio.currentSrc || audio.src);
    playPauseBtn.textContent = "▶ Play";
    playPauseBtn.setAttribute("aria-label", "Play radio");
  });

  // ------------------------------------------------------------
  // RESIZE
  // ------------------------------------------------------------

  window.addEventListener("resize", buildTicks);

  // ------------------------------------------------------------
  // INITIALIZE
  // ------------------------------------------------------------

  currentFreq = 93.1;

  buildTicks();

  updateNeedle(
    freqToAngle(currentFreq),
    false
  );

  freqNum.textContent = currentFreq.toFixed(1);
  freqLabel.textContent = "FM • 93.1 MHz";

  loadCategory(0, false);

  // Try the real Flask API. If it does not exist yet,
  // the temporary fallback keeps the Radio controls usable.
  refreshRadioState();
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
  themeToggle.setAttribute('aria-pressed', document.body.classList.contains('dark-theme') ? 'true' : 'false');

  // Old icon swap – the panel no longer has #themeIcon, so skip when it is absent
  if(!themeIcon) return;
  if(document.body.classList.contains('dark-theme')){
    // Sun icon for light mode
    themeIcon.innerHTML = '<path d="M8 0a.5.5 0 0 1 .5.5V2h-1V.5A.5.5 0 0 1 8 0zm4.95 1.05a.5.5 0 0 1 .7.7l-1.06 1.06-.7-.7 1.06-1.06zM16 8a.5.5 0 0 1-.5.5H14v-1h1.5A.5.5 0 0 1 16 8zm-1.05 4.95a.5.5 0 0 1-.7.7l-1.06-1.06.7-.7 1.06 1.06zM8 16a.5.5 0 0 1-.5-.5V14h1v1.5a.5.5 0 0 1-.5.5zm-4.95-1.05a.5.5 0 0 1-.7-.7l1.06-1.06.7.7-1.06 1.06zM0 8a.5.5 0 0 1 .5-.5H2v1H.5A.5.5 0 0 1 0 8zm1.05-4.95a.5.5 0 0 1 .7-.7l1.06 1.06-.7.7L1.05 3.05z"/>'; 
  } else {
    // Moon icon for dark mode
    themeIcon.innerHTML = '<path d="M6 0a6 6 0 1 0 6 6A6 6 0 0 0 6 0zm0 11a5 5 0 1 1 5-5 5 5 0 0 1-5 5z"/>';
  }
});