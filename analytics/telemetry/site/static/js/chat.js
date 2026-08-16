/* "Ask S.C.O.U.T." chat widget. Talks only to the endpoint on #scout-chat[data-endpoint]
 * (the Cloudflare Worker). No dependencies. Degrades to a friendly note if unconfigured. */
(function () {
  var root = document.getElementById('scout-chat');
  if (!root) return;
  var endpoint = root.getAttribute('data-endpoint') || '';
  var configured = endpoint && endpoint.indexOf('example.workers.dev') === -1;

  var toggle = root.querySelector('.chat-toggle');
  var panel = root.querySelector('.chat-panel');
  var closeBtn = root.querySelector('.chat-close');
  var log = root.querySelector('.chat-log');
  var form = root.querySelector('.chat-form');
  var input = root.querySelector('.chat-input');

  var history = [];   // {role, content}, sent to the Worker
  var busy = false;
  var greeted = false;

  function esc(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

  function addMsg(role, text) {
    var el = document.createElement('div');
    el.className = 'chat-msg chat-' + role;
    el.innerHTML = esc(text).replace(/\n/g, '<br>');
    log.appendChild(el);
    log.scrollTop = log.scrollHeight;
    return el;
  }

  function openPanel() {
    panel.hidden = false;
    toggle.setAttribute('aria-expanded', 'true');
    root.classList.add('chat-open');
    if (!greeted) {
      greeted = true;
      addMsg('bot', configured
        ? 'Hi — ask me anything about S.C.O.U.T.: the research, the hardware and software, the team, or the plan.'
        : "The chat isn't connected yet. Once the team deploys the chat service, I'll answer questions about the project here.");
    }
    setTimeout(function () { input.focus(); }, 60);
  }

  function closePanel() {
    panel.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
    root.classList.remove('chat-open');
    toggle.focus();
  }

  toggle.addEventListener('click', function () { panel.hidden ? openPanel() : closePanel(); });
  closeBtn.addEventListener('click', closePanel);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !panel.hidden) closePanel();
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var q = (input.value || '').trim();
    if (!q || busy) return;
    input.value = '';
    addMsg('user', q);
    history.push({ role: 'user', content: q });
    if (!configured) {
      addMsg('bot', "Chat isn't connected yet — check back once the service is live.");
      return;
    }
    ask();
  });

  function ask() {
    busy = true;
    var typing = addMsg('bot', '…');
    typing.classList.add('chat-typing');
    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: history.slice(-8) })
    })
      .then(function (r) {
        if (!r.ok) throw new Error('http ' + r.status);
        return r.json();
      })
      .then(function (data) {
        typing.remove();
        var reply = (data && data.reply) || "Sorry, I couldn't answer that one.";
        addMsg('bot', reply);
        history.push({ role: 'assistant', content: reply });
      })
      .catch(function () {
        typing.remove();
        addMsg('bot', 'Something went wrong reaching the assistant. Please try again in a moment.');
      })
      .then(function () { busy = false; input.focus(); });
  }
})();
