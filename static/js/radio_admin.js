(() => {
  "use strict";

  const API = {
    channels: "/radio/admin/api/channels",
    items: "/radio/admin/api/items"
  };

  let channels = {};
  let activeChannel = "college";
  let editingItemId = null;

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));

  function toast(message) {
    const el = $("#radioToast");
    if (!el) return;

    el.textContent = message;
    el.classList.add("show");

    window.setTimeout(() => {
      el.classList.remove("show");
    }, 2200);
  }

  async function request(url, options = {}) {
    const response = await fetch(url, {
      credentials: "same-origin",
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {})
      }
    });

    const text = await response.text();

    let data = {};

    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      throw new Error("Invalid server response.");
    }

    if (!response.ok || data.success === false) {
      throw new Error(
        data.message ||
        `Request failed (${response.status})`
      );
    }

    return data;
  }

  function current() {
    return channels[activeChannel] || null;
  }

  function setConnection(connected) {
    const badge = $("#connectionBadge");

    if (!badge) return;

    badge.classList.toggle("connected", connected);

    badge.innerHTML = connected
      ? "<span></span> Database connected"
      : "<span></span> Connection failed";
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function updateChannelCards() {
    $$(".radio-channel-card").forEach(card => {
      const key = card.dataset.channel;
      const channel = channels[key];

      card.classList.toggle(
        "active",
        key === activeChannel
      );

      const status = card.querySelector(
        `[data-status-for="${key}"]`
      );

      if (!status || !channel) return;

      const live =
        Boolean(channel.is_live) ||
        Boolean(channel.live);

      status.textContent = live ? "Live" : "Offline";
      status.classList.toggle("live", live);
    });
  }

  function renderChannel() {
    const channel = current();

    if (!channel) return;

    $("#panelTitle").textContent =
      channel.name || activeChannel;

    $("#panelDescription").textContent =
      channel.description || "";

    $("#channelName").value =
      channel.name || "";

    $("#channelDescription").value =
      channel.description || "";

    $("#channelStreamUrl").value =
      channel.stream_url || "";

    $("#channelEnabled").checked =
      Boolean(channel.is_enabled);

    const live =
      Boolean(channel.is_live) ||
      Boolean(channel.live);

    $("#liveLabel").textContent =
      live ? "LIVE" : "OFFLINE";

    $("#liveLabel").classList.toggle(
      "live",
      live
    );

    $("#liveToggle").classList.toggle(
      "live",
      live
    );

    $("#liveToggle").setAttribute(
      "aria-pressed",
      live ? "true" : "false"
    );

    $("#liveToggle").innerHTML = live
      ? "<span></span> Stop Live"
      : "<span></span> Start Live";

    updateChannelCards();
    renderItems();
  }

  function renderItems() {
    const list = $("#itemsList");
    const channel = current();

    if (!list || !channel) return;

    const items = Array.isArray(channel.items)
      ? channel.items
      : [];

    $("#itemsTitle").textContent =
      channel.channel_key === "college"
        ? "College Radio Stations"
        : `${channel.name} Content`;

    $("#itemsDescription").textContent =
      channel.channel_key === "college"
        ? "Manage the frequencies shown on the homepage tuner."
        : `Manage ${channel.name.toLowerCase()} content.`;

    if (!items.length) {
      list.innerHTML = `
        <div class="empty-items">
          <i class="fa-regular fa-folder-open"></i>
          <div>No content has been added yet.</div>
        </div>
      `;
      return;
    }

    list.innerHTML = items.map(item => {
      const frequency =
        item.frequency != null
          ? `${Number(item.frequency).toFixed(1)} MHz`
          : "";

      const artist =
        item.artist
          ? ` • ${escapeHtml(item.artist)}`
          : "";

      const active =
        Number(item.is_active) === 1
          ? "Active"
          : "Inactive";

      return `
        <article class="radio-item">
          <div class="radio-item-main">
            <div class="radio-item-title">
              ${escapeHtml(item.title)}
            </div>

            <div class="radio-item-meta">
              ${frequency}${artist}
              ${frequency || artist ? " • " : ""}
              ${active}
            </div>
          </div>

          <div class="radio-item-actions">
            <button
              type="button"
              class="mini-btn"
              data-edit-item="${item.id}"
            >
              <i class="fa-solid fa-pen"></i>
              Edit
            </button>

            <button
              type="button"
              class="mini-btn"
              data-delete-item="${item.id}"
            >
              <i class="fa-solid fa-trash"></i>
              Delete
            </button>
          </div>
        </article>
      `;
    }).join("");

    $$("[data-edit-item]").forEach(button => {
      button.addEventListener("click", () => {
        openEditItem(Number(button.dataset.editItem));
      });
    });

    $$("[data-delete-item]").forEach(button => {
      button.addEventListener("click", () => {
        deleteItem(Number(button.dataset.deleteItem));
      });
    });
  }

  async function loadChannels() {
    try {
      const data = await request(API.channels);

      const list = Array.isArray(data.channels)
        ? data.channels
        : [];

      channels = {};

      list.forEach(channel => {
        channels[channel.channel_key] = {
          ...channel,
          items: []
        };
      });

      // The channels endpoint only returns channel records.
      // Get the complete state from the student API to populate
      // item lists and preserve one source of truth for content.
      const stateResponse = await fetch(
        "/radio/api/state",
        {
          credentials: "same-origin",
          cache: "no-store"
        }
      );

      if (stateResponse.ok) {
        const state = await stateResponse.json();

        Object.entries(state.channels || {})
          .forEach(([key, stateChannel]) => {
            if (!channels[key]) return;

            channels[key].live =
              stateChannel.live;

            channels[key].is_live =
              stateChannel.live;

            channels[key].stations =
              stateChannel.stations || [];

            channels[key].items =
              (stateChannel.stations || []).map(
                item => ({
                  id: item.id,
                  title:
                    item.title ||
                    item.name ||
                    "",
                  artist:
                    item.artist || null,
                  description:
                    item.description || null,
                  frequency:
                    item.frequency ?? null,
                  media_url:
                    item.stream_url ||
                    item.audio_url ||
                    item.url ||
                    null,
                  is_active: 1,
                  display_order: 0
                })
              );
          });
      }

      setConnection(true);
      updateChannelCards();
      renderChannel();

    } catch (error) {
      console.error(error);
      setConnection(false);
      toast(error.message || "Could not load Radio.");
    }
  }

  async function saveChannel() {
    const channel = current();

    if (!channel) return;

    const payload = {
      name: $("#channelName").value.trim(),
      description:
        $("#channelDescription").value.trim(),
      stream_url:
        $("#channelStreamUrl").value.trim() || null,
      is_enabled:
        $("#channelEnabled").checked
    };

    try {
      await request(
        `/radio/admin/api/channels/${encodeURIComponent(activeChannel)}`,
        {
          method: "PUT",
          body: JSON.stringify(payload)
        }
      );

      toast("Channel saved.");
      await loadChannels();

    } catch (error) {
      console.error(error);
      toast(error.message || "Could not save channel.");
    }
  }

  let liveRoom = null;
  let liveMicrophoneTrack = null;

  async function getLiveKitAdminToken() {
    const response = await fetch("/radio/admin/api/live/token", {
      credentials: "same-origin",
      cache: "no-store"
    });

    const data = await response.json();

    if (!response.ok || data.success === false) {
      throw new Error(
        data.message || `Could not get LiveKit token (${response.status})`
      );
    }

    return data;
  }

  async function startLiveBroadcast() {
    if (!window.LivekitClient) {
      throw new Error("LiveKit client library is not loaded.");
    }

    const data = await getLiveKitAdminToken();

    liveRoom = new LivekitClient.Room({
      adaptiveStream: true,
      dynacast: true
    });

    liveRoom.on(
      LivekitClient.RoomEvent.Disconnected,
      () => {
        liveMicrophoneTrack = null;
        liveRoom = null;
      }
    );

    await liveRoom.connect(data.livekit_url, data.token);

    liveMicrophoneTrack =
      await LivekitClient.createLocalAudioTrack({
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      });

    await liveRoom.localParticipant.publishTrack(
      liveMicrophoneTrack
    );

    return true;
  }

  async function stopLiveBroadcast() {
    if (liveMicrophoneTrack) {
      liveMicrophoneTrack.stop();
      liveMicrophoneTrack = null;
    }

    if (liveRoom) {
      liveRoom.disconnect();
      liveRoom = null;
    }
  }

  async function setChannelLive(isLive) {
    await request(
      `/radio/admin/api/channels/${encodeURIComponent(activeChannel)}`,
      {
        method: "PUT",
        body: JSON.stringify({
          is_live: isLive
        })
      }
    );
  }

  async function toggleLive() {
    const channel = current();

    if (!channel) return;

    const live =
      Boolean(channel.is_live) ||
      Boolean(channel.live);

    const button = $("#liveToggle");

    if (button) {
      button.disabled = true;
    }

    try {
      if (!live) {
        // First establish the actual microphone broadcast.
        await startLiveBroadcast();

        // Only mark the channel LIVE after the microphone is publishing.
        await setChannelLive(true);

        toast(`${channel.name} is now LIVE.`);

      } else {
        await stopLiveBroadcast();

        await setChannelLive(false);

        toast(`${channel.name} stopped.`);
      }

      await loadChannels();

    } catch (error) {
      console.error("Live broadcast error:", error);

      // If broadcasting failed, clean up the LiveKit connection.
      if (!live) {
        await stopLiveBroadcast().catch(() => {});
      }

      toast(
        error.message ||
        "Could not start the live broadcast."
      );

    } finally {
      if (button) {
        button.disabled = false;
      }
    }
  }


  function openModal() {
    $("#itemModal").classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    $("#itemModal").classList.add("hidden");
    document.body.style.overflow = "";
    editingItemId = null;
  }

  function resetItemForm() {
    $("#itemTitle").value = "";
    $("#itemFrequency").value =
      activeChannel === "college"
        ? "93.1"
        : "";

    $("#itemArtist").value = "";
    $("#itemOrder").value = "0";
    $("#itemMediaUrl").value = "";
    if ($("#itemAudioFile")) $("#itemAudioFile").value = "";
    if ($("#audioUploadStatus")) {
      $("#audioUploadStatus").textContent =
        "Choose a file, then save the Radio item.";
      $("#audioUploadStatus").className = "upload-note";
    }
    $("#itemDescription").value = "";
    $("#itemActive").checked = true;

    $("#frequencyField").style.display =
      activeChannel === "college"
        ? ""
        : "none";
  }

  function openAddItem() {
    editingItemId = null;

    $("#itemModalTitle").textContent =
      activeChannel === "college"
        ? "Add College Radio Station"
        : `Add ${current()?.name || "Radio"} Content`;

    resetItemForm();
    openModal();
  }

  function findItem(id) {
    return (
      current()?.items || []
    ).find(
      item => Number(item.id) === Number(id)
    );
  }

  function openEditItem(id) {
    const item = findItem(id);

    if (!item) return;

    editingItemId = id;

    $("#itemModalTitle").textContent =
      "Edit Radio Content";

    $("#itemTitle").value =
      item.title || "";

    $("#itemFrequency").value =
      item.frequency ?? "";

    $("#itemArtist").value =
      item.artist || "";

    $("#itemOrder").value =
      item.display_order ?? 0;

    $("#itemMediaUrl").value =
      item.media_url || "";

    $("#itemDescription").value =
      item.description || "";

    $("#itemActive").checked =
      Number(item.is_active) === 1;

    $("#frequencyField").style.display =
      activeChannel === "college"
        ? ""
        : "none";

    openModal();
  }


  async function uploadSelectedAudio() {
    const fileInput = $("#itemAudioFile");
    const status = $("#audioUploadStatus");
    const file = fileInput?.files?.[0];

    if (!file) return null;

    status.textContent = "Uploading audio to Cloudinary...";
    status.className = "upload-note uploading";

    const formData = new FormData();
    formData.append("audio", file);

    try {
      const response = await fetch("/radio/admin/api/upload", {
        method: "POST",
        credentials: "same-origin",
        body: formData
      });

      const text = await response.text();
      let data = {};

      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        throw new Error("Invalid upload response.");
      }

      if (!response.ok || data.success === false) {
        throw new Error(data.message || `Upload failed (${response.status})`);
      }

      status.textContent = "Audio uploaded successfully.";
      status.className = "upload-note success";

      return data.url;
    } catch (error) {
      status.textContent = error.message || "Audio upload failed.";
      status.className = "upload-note error";
      throw error;
    }
  }


  async function saveItem() {
    const title =
      $("#itemTitle").value.trim();

    if (!title) {
      toast("Title is required.");
      return;
    }

    let mediaUrl = $("#itemMediaUrl").value.trim() || null;

    if ($("#itemAudioFile")?.files?.length) {
      try {
        mediaUrl = await uploadSelectedAudio();
      } catch {
        return;
      }
    }

    const payload = {
      channel_key: activeChannel,
      title,
      artist:
        $("#itemArtist").value.trim() || null,
      description:
        $("#itemDescription").value.trim() || null,
      frequency:
        activeChannel === "college"
          ? ($("#itemFrequency").value || null)
          : null,
      media_url: mediaUrl,
      display_order:
        Number($("#itemOrder").value || 0),
      is_active:
        $("#itemActive").checked
    };

    try {
      if (editingItemId) {
        delete payload.channel_key;

        await request(
          `/radio/admin/api/items/${editingItemId}`,
          {
            method: "PUT",
            body: JSON.stringify(payload)
          }
        );

        toast("Radio content updated.");

      } else {
        await request(
          API.items,
          {
            method: "POST",
            body: JSON.stringify(payload)
          }
        );

        toast("Radio content added.");
      }

      closeModal();
      await loadChannels();

    } catch (error) {
      console.error(error);
      toast(error.message || "Could not save content.");
    }
  }

  async function deleteItem(id) {
    const item = findItem(id);

    if (!item) return;

    if (
      !window.confirm(
        `Delete "${item.title}"?`
      )
    ) {
      return;
    }

    try {
      await request(
        `/radio/admin/api/items/${id}`,
        {
          method: "DELETE"
        }
      );

      toast("Radio content deleted.");
      await loadChannels();

    } catch (error) {
      console.error(error);
      toast(error.message || "Could not delete content.");
    }
  }

  function selectChannel(key) {
    if (!channels[key]) return;

    activeChannel = key;
    renderChannel();
  }

  $$(".radio-channel-card").forEach(card => {
    card.addEventListener("click", () => {
      selectChannel(card.dataset.channel);
    });
  });

  $("#saveChannelButton")
    .addEventListener("click", saveChannel);

  $("#liveToggle")
    .addEventListener("click", toggleLive);

  $("#reloadButton")
    .addEventListener("click", loadChannels);

  $("#addItemButton")
    .addEventListener("click", openAddItem);

  $("#saveItemButton")
    .addEventListener("click", saveItem);

  $("#itemAudioFile")?.addEventListener("change", () => {
    const file = $("#itemAudioFile").files?.[0];
    const status = $("#audioUploadStatus");
    if (!status) return;

    if (file) {
      status.textContent =
        `${file.name} selected — it will upload when you save.`;
      status.className = "upload-note";
    }
  });

  $$("[data-close-modal]").forEach(element => {
    element.addEventListener("click", closeModal);
  });

  $("#radioLogoutButton")
    .addEventListener("click", () => {
      window.history.back();
    });

  loadChannels();
})();