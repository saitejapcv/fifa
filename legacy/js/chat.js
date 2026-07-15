(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const create = (tag, className = '') => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    return node;
  };

  const quickActions = [
    { label: 'Find seat', prompt: 'Find the safest route to my seat from the best current gate.' },
    { label: 'Nearest restroom', prompt: 'Show the nearest restroom with the lowest wait.' },
    { label: 'Report incident', prompt: 'I need to report an incident near my location.' },
    { label: 'Gate waits', prompt: 'Which entry gate should fans use right now?' },
    { label: 'Transit home', prompt: 'What is the best post-match transit option?' }
  ];

  const escapeTime = () => new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date());

  const openPanel = () => {
    const shell = $('#app-shell');
    const toggle = $('#chat-toggle');
    shell?.classList.add('chat-open');
    toggle?.setAttribute('aria-expanded', 'true');
    $('#chat-input')?.focus();
  };

  const closePanel = () => {
    const shell = $('#app-shell');
    const toggle = $('#chat-toggle');
    shell?.classList.remove('chat-open');
    toggle?.setAttribute('aria-expanded', 'false');
    toggle?.focus();
  };

  const appendMessage = (sender, text, response = null) => {
    const messages = $('#chat-messages');
    if (!messages) return null;
    const item = create('div', `chat-message ${sender}`);
    const avatar = create('div', 'chat-avatar');
    const content = create('div');
    const bubble = create('div', 'chat-bubble');
    const timestamp = create('div', 'chat-timestamp');

    avatar.textContent = sender === 'user' ? 'You' : 'AI';
    bubble.textContent = String(text || '');
    timestamp.textContent = escapeTime();
    content.append(bubble);
    if (response?.cards?.length) {
      response.cards.forEach((card) => content.append(createResponseCard(card)));
    }
    if (response?.fallbackReason && response.source !== 'gemini') {
      const note = create('div', 'chat-timestamp');
      note.textContent = `Local fallback: ${response.fallbackReason}`;
      content.append(note);
    }
    content.append(timestamp);
    item.append(avatar, content);
    messages.append(item);
    messages.scrollTop = messages.scrollHeight;
    return item;
  };

  const createResponseCard = (card) => {
    const node = create('div', 'response-card');
    const header = create('div', 'response-card-header');
    const body = create('div', 'response-card-body');
    header.textContent = card.title || 'Details';

    if (Array.isArray(card.rows) && card.rows.length) {
      const table = create('table');
      table.style.width = '100%';
      const tbody = create('tbody');
      card.rows.forEach((row) => {
        const tr = create('tr');
        row.forEach((cell) => {
          const td = create('td');
          td.textContent = String(cell ?? '');
          td.style.padding = '2px 6px 2px 0';
          tr.append(td);
        });
        tbody.append(tr);
      });
      table.append(tbody);
      body.append(table);
    } else if (Array.isArray(card.steps)) {
      const list = create('ol');
      list.style.listStyle = 'decimal';
      list.style.paddingLeft = '1rem';
      card.steps.forEach((step) => {
        const li = create('li');
        li.textContent = step;
        list.append(li);
      });
      body.append(list);
    } else {
      body.textContent = card.body || '';
    }

    node.append(header, body);
    return node;
  };

  const showTyping = () => {
    const messages = $('#chat-messages');
    if (!messages) return null;
    const wrapper = create('div', 'chat-message ai');
    const avatar = create('div', 'chat-avatar');
    const indicator = create('div', 'typing-indicator');
    avatar.textContent = 'AI';
    for (let index = 0; index < 3; index += 1) {
      indicator.append(create('span', 'typing-dot'));
    }
    wrapper.append(avatar, indicator);
    messages.append(wrapper);
    messages.scrollTop = messages.scrollHeight;
    return wrapper;
  };

  const actionFromResponse = (label) => {
    const normalized = String(label || '').toLowerCase();
    if (normalized.includes('map') || normalized.includes('seat')) window.StadiumApp.setView('map-view');
    if (normalized.includes('restroom') || normalized.includes('wait')) window.StadiumApp.setView('queues-view');
    if (normalized.includes('incident')) window.StadiumApp.setView('incidents-view');
    if (normalized.includes('gate')) window.StadiumApp.setView('gates-view');
    if (normalized.includes('transit')) window.StadiumApp.setView('transit-view');
    if (normalized.includes('accessible')) window.StadiumApp.setView('accessibility-view');
  };

  const appendActions = (actions = []) => {
    if (!actions.length) return;
    const messages = $('#chat-messages');
    const row = create('div', 'chat-chips');
    actions.forEach((action) => {
      const button = create('button', 'chip');
      button.type = 'button';
      button.textContent = action;
      button.addEventListener('click', () => actionFromResponse(action));
      row.append(button);
    });
    messages?.append(row);
  };

  const sendMessage = async (rawMessage) => {
    const message = String(rawMessage || '').replace(/\s+/g, ' ').trim();
    if (!message) {
      window.StadiumApp.toast('Message required', 'Enter a stadium operations question before sending.', 'warning');
      return;
    }
    if (message.length > 500) {
      window.StadiumApp.toast('Message too long', 'Keep assistant requests under 500 characters.', 'danger');
      return;
    }

    openPanel();
    appendMessage('user', message);
    const typing = showTyping();

    try {
      const response = await window.GeminiClient.generate(message, window.StadiumApp.getContext());
      typing?.remove();
      appendMessage('ai', response.summary, response);
      appendActions(response.actions);
      window.StadiumApp.announce('Assistant response received.');
    } catch (error) {
      typing?.remove();
      appendMessage('ai', 'I could not process that request. Try a route, queue, gate, incident, transit, or accessibility question.');
      window.StadiumApp.toast('Assistant error', error.message, 'danger');
    }
  };

  const renderQuickActions = () => {
    const container = $('#quick-action-chips');
    if (!container) return;
    container.replaceChildren(...quickActions.map((action) => {
      const button = create('button', 'chip');
      button.type = 'button';
      button.textContent = action.label;
      button.addEventListener('click', () => sendMessage(action.prompt));
      return button;
    }));
  };

  const bindVoiceInput = () => {
    const button = $('#voice-button');
    if (!button) return;
    button.addEventListener('click', () => {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        window.StadiumApp.toast('Voice unavailable', 'This browser does not expose speech recognition. Type your request instead.', 'warning');
        return;
      }
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      button.disabled = true;
      recognition.addEventListener('result', (event) => {
        const transcript = event.results?.[0]?.[0]?.transcript || '';
        $('#chat-input').value = transcript.slice(0, 500);
      });
      recognition.addEventListener('end', () => {
        button.disabled = false;
        $('#chat-input')?.focus();
      });
      recognition.addEventListener('error', () => {
        button.disabled = false;
        window.StadiumApp.toast('Voice capture failed', 'Microphone input could not be captured.', 'danger');
      });
      recognition.start();
    });
  };

  const bindEvents = () => {
    $('#chat-toggle')?.addEventListener('click', () => {
      const shell = $('#app-shell');
      if (shell?.classList.contains('chat-open')) closePanel();
      else openPanel();
    });
    $('#chat-close')?.addEventListener('click', closePanel);
    $('#chat-form')?.addEventListener('submit', (event) => {
      event.preventDefault();
      const input = $('#chat-input');
      const message = input?.value || '';
      input.value = '';
      sendMessage(message);
    });
    bindVoiceInput();
  };

  document.addEventListener('DOMContentLoaded', () => {
    bindEvents();
    renderQuickActions();
    appendMessage('ai', 'Stadium Assistant online. Ask about seats, queues, gates, incidents, transit, accessibility, or sustainability.', {
      cards: [{
        title: 'Fast actions',
        rows: [
          ['Find seat', 'Route around congestion'],
          ['Nearest restroom', 'Compare live wait times'],
          ['Report incident', 'Classify and escalate']
        ]
      }]
    });
  });

  window.ChatController = {
    openPanel,
    closePanel,
    sendMessage,
    appendMessage
  };
})();
