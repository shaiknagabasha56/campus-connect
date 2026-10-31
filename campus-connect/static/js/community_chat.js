(() => {
  const widget = document.getElementById('rg-chat-widget');
  if (!widget) return;

  const panel = document.getElementById('rg-chat-panel');
  const toggle = document.getElementById('rg-chat-toggle');
  const close = document.getElementById('rg-chat-close');
  const messages = document.getElementById('rg-chat-messages');
  const input = document.getElementById('rg-chat-input');
  const send = document.getElementById('rg-send-btn');
  const emojiButton = document.getElementById('rg-emoji-btn');
  const emojiPicker = document.getElementById('rg-emoji-picker');
  const pollsList = document.getElementById('rg-polls-list');
  const pollQuestion = document.getElementById('rg-poll-question');
  const pollOptions = document.getElementById('rg-poll-options-inputs');
  const pollFeedback = document.getElementById('rg-poll-feedback');
  const currentUserId = Number(widget.dataset.currentUserId || 0);
  let activeTab = 'chat';
  let lastMessageSignature = null;
  let pollSignature = null;
  let busy = false;

  const request = async (url, options = {}) => {
    const response = await fetch(url, {
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      ...options
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.success === false) throw new Error(data.message || 'Something went wrong.');
    return data;
  };

  const make = (tag, className, text) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  };

  function setPanel(open) {
    panel.classList.toggle('rg-open', open);
    panel.setAttribute('aria-hidden', String(!open));
    toggle.style.display = open ? 'none' : 'flex';
    if (open) {
      if (activeTab === 'chat') input.focus();
      loadMessages();
      loadPolls();
    } else hideEmojiPicker();
  }
  toggle.addEventListener('click', () => setPanel(true));
  close.addEventListener('click', () => setPanel(false));

  function activateTab(tab) {
    activeTab = tab;
    document.querySelectorAll('.rg-chat-tab').forEach(button => {
      const selected = button.dataset.chatTab === tab;
      button.classList.toggle('rg-active', selected);
      button.setAttribute('aria-selected', String(selected));
    });
    document.querySelectorAll('.rg-chat-view').forEach(view => view.classList.remove('rg-chat-view-active'));
    document.getElementById(`rg-chat-view-${tab}`).classList.add('rg-chat-view-active');
    if (tab === 'chat') input.focus();
    if (tab === 'polls') loadPolls();
  }
  document.querySelectorAll('.rg-chat-tab').forEach(button => button.addEventListener('click', () => activateTab(button.dataset.chatTab)));

  function hideEmojiPicker() {
    emojiPicker.classList.remove('rg-show');
    emojiButton.setAttribute('aria-expanded', 'false');
  }
  emojiButton.addEventListener('click', () => {
    const show = !emojiPicker.classList.contains('rg-show');
    emojiPicker.classList.toggle('rg-show', show);
    emojiButton.setAttribute('aria-expanded', String(show));
  });
  emojiPicker.addEventListener('click', event => {
    const button = event.target.closest('.rg-emoji');
    if (!button) return;
    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? input.value.length;
    input.value = input.value.slice(0, start) + button.textContent + input.value.slice(end);
    input.focus();
    input.setSelectionRange(start + button.textContent.length, start + button.textContent.length);
    hideEmojiPicker();
  });
  document.addEventListener('click', event => {
    if (!emojiPicker.contains(event.target) && event.target !== emojiButton) hideEmojiPicker();
  });

  function formatTime(value) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  function renderMessages(items) {
    const signature = items.map(item => `${item.id}:${item.message}`).join('|');
    if (signature === lastMessageSignature) return;
    const wasNearBottom = messages.scrollHeight - messages.scrollTop - messages.clientHeight < 90;
    messages.replaceChildren();
    if (!items.length) {
      messages.appendChild(make('div', 'rg-chat-empty', 'No messages yet. Start the conversation!'));
    }
    items.forEach(item => {
      const own = Number(item.user_id) === currentUserId;
      const row = make('article', `rg-message-row ${own ? 'rg-message-own' : ''}`);
      const bubble = make('div', `rg-message-bubble ${own ? 'rg-message-bubble-own' : ''}`);
      bubble.appendChild(make('div', 'rg-message-name', own ? 'You' : (item.sender_name || 'Campus member')));
      bubble.appendChild(make('div', 'rg-message-text', item.message));
      bubble.appendChild(make('time', 'rg-message-time', formatTime(item.created_at)));
      row.appendChild(bubble);
      messages.appendChild(row);
    });
    lastMessageSignature = signature;
    if (wasNearBottom || !lastMessageSignature) messages.scrollTop = messages.scrollHeight;
  }

  async function loadMessages() {
    try {
      const data = await request('/api/community/messages');
      renderMessages(data.messages || []);
    } catch (error) {
      if (!lastMessageSignature) messages.replaceChildren(make('div', 'rg-chat-error', error.message));
    }
  }

  async function sendMessage() {
    const message = input.value.trim();
    if (!message || busy) return;
    busy = true;
    send.disabled = true;
    try {
      await request('/api/community/messages', { method: 'POST', body: JSON.stringify({ message }) });
      input.value = '';
      hideEmojiPicker();
      await loadMessages();
      messages.scrollTop = messages.scrollHeight;
    } catch (error) {
      alert(error.message);
    } finally {
      busy = false;
      send.disabled = false;
      input.focus();
    }
  }
  send.addEventListener('click', sendMessage);
  input.addEventListener('keydown', event => {
    if (event.key === 'Enter') { event.preventDefault(); sendMessage(); }
  });

  function renderPolls(polls) {
    const signature = polls.map(p => `${p.id}:${p.options.map(o => `${o.id}-${o.votes}`).join(',')}:${p.user_vote}`).join('|');
    if (signature === pollSignature) return;
    pollsList.replaceChildren();
    if (!polls.length) pollsList.appendChild(make('div', 'rg-chat-empty', 'No polls yet. Create the first campus poll!'));
    polls.forEach(poll => {
      const card = make('article', 'rg-poll-card');
      const meta = make('div', 'rg-poll-meta', `By ${poll.creator_name || 'Campus member'} · ${formatTime(poll.created_at)}`);
      card.append(meta, make('h4', 'rg-poll-question-text', poll.question));
      const total = poll.options.reduce((sum, option) => sum + Number(option.votes || 0), 0);
      poll.options.forEach(option => {
        const button = make('button', `rg-poll-choice ${Number(poll.user_vote) === Number(option.id) ? 'rg-voted' : ''}`);
        button.type = 'button';
        button.disabled = false;
        const percent = total ? Math.round((Number(option.votes) / total) * 100) : 0;
        const label = make('span', 'rg-poll-choice-label', option.text);
        const count = make('span', 'rg-poll-choice-count', `${option.votes} · ${percent}%`);
        const bar = make('span', 'rg-poll-choice-bar');
        const fill = make('span', 'rg-poll-choice-fill');
        fill.style.width = `${percent}%`;
        bar.appendChild(fill);
        button.append(label, count, bar);
        button.addEventListener('click', () => castVote(poll.id, option.id));
        card.appendChild(button);
      });
      card.appendChild(make('div', 'rg-poll-total', `${total} vote${total === 1 ? '' : 's'} · ${poll.user_vote ? 'You can change your vote' : 'Tap an option to vote'}`));
      pollsList.appendChild(card);
    });
    pollSignature = signature;
  }

  async function loadPolls() {
    try {
      const data = await request('/api/community/polls');
      renderPolls(data.polls || []);
    } catch (error) {
      if (!pollSignature) pollsList.replaceChildren(make('div', 'rg-chat-error', error.message));
    }
  }

  async function castVote(pollId, optionId) {
    try {
      await request(`/api/community/polls/${pollId}/vote`, { method: 'POST', body: JSON.stringify({ option_id: optionId }) });
      pollSignature = '';
      await loadPolls();
    } catch (error) { alert(error.message); }
  }

  document.getElementById('rg-add-poll-option').addEventListener('click', () => {
    const current = pollOptions.querySelectorAll('.rg-poll-option-input').length;
    if (current >= 6) return;
    const field = make('input', 'rg-poll-option-input');
    field.type = 'text'; field.maxLength = 100; field.placeholder = `Option ${current + 1}`;
    pollOptions.appendChild(field);
  });

  document.getElementById('rg-create-poll').addEventListener('click', async () => {
    const question = pollQuestion.value.trim();
    const options = Array.from(pollOptions.querySelectorAll('.rg-poll-option-input')).map(field => field.value.trim()).filter(Boolean);
    pollFeedback.textContent = '';
    try {
      await request('/api/community/polls', { method: 'POST', body: JSON.stringify({ question, options }) });
      pollQuestion.value = '';
      pollOptions.innerHTML = '<input class="rg-poll-option-input" type="text" maxlength="100" placeholder="Option 1"><input class="rg-poll-option-input" type="text" maxlength="100" placeholder="Option 2">';
      pollSignature = '';
      await loadPolls();
      pollFeedback.textContent = 'Poll created successfully.';
      pollFeedback.className = 'rg-poll-feedback rg-success';
    } catch (error) {
      pollFeedback.textContent = error.message;
      pollFeedback.className = 'rg-poll-feedback rg-error';
    }
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && panel.classList.contains('rg-open')) setPanel(false);
  });

  loadMessages();
  loadPolls();
  window.setInterval(() => {
    if (document.visibilityState === 'visible') {
      loadMessages();
      loadPolls();
    }
  }, 5000);
})();
