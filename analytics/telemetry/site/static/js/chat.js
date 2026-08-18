/* "Ask Fred" — the S.C.O.U.T. project chat widget. Talks only to the endpoint on
 * #scout-chat[data-endpoint] (the Cloudflare Worker). No dependencies. Degrades to a friendly
 * note if unconfigured. */
(function () {
  var root = document.getElementById('scout-chat');
  if (!root) return;
  var endpoint = root.getAttribute('data-endpoint') || '';
  var configured = endpoint && endpoint.indexOf('example.workers.dev') === -1;

  var BOT_META = 'Fred · S.C.O.U.T. assistant';
  var STARTERS = ['What is S.C.O.U.T.?', 'Who is on the team?', 'How does the buoy work?'];

  // Two launchers can open the panel: the navbar icon (desktop) and the floating button
  // (mobile, where the navbar social row is hidden). Both carry .chat-toggle; wire them all.
  var toggles = [].slice.call(document.querySelectorAll('.chat-toggle'));
  var closeBtn = root.querySelector('.chat-close');
  var log = root.querySelector('.chat-log');
  var form = root.querySelector('.chat-form');
  var input = root.querySelector('.chat-input');

  var history = [];   // {role, content}, sent to the Worker
  var busy = false;
  var greeted = false;

  function esc(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

  // A message is a row: the bubble, plus (for Fred) a small meta line underneath — the
  // "Fred · S.C.O.U.T. assistant" credit, mirroring Intercom/Fin. Returns the row so a
  // transient bubble (the typing indicator) can be removed whole.
  function addMsg(role, text, opts) {
    opts = opts || {};
    var row = document.createElement('div');
    row.className = 'chat-row chat-row-' + role;
    var bubble = document.createElement('div');
    bubble.className = 'chat-msg chat-' + role + (opts.typing ? ' chat-typing' : '');
    bubble.innerHTML = esc(text).replace(/\n/g, '<br>');
    row.appendChild(bubble);
    if (role === 'bot' && !opts.plain) {
      var meta = document.createElement('div');
      meta.className = 'chat-meta';
      meta.textContent = BOT_META;
      row.appendChild(meta);
    }
    log.appendChild(row);
    log.scrollTop = log.scrollHeight;
    return row;
  }

  // Tappable starter questions, shown once with Fred's greeting (Intercom home pattern).
  function addStarters() {
    var wrap = document.createElement('div');
    wrap.className = 'chat-chips';
    STARTERS.forEach(function (q) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'chat-chip';
      b.textContent = q;
      b.addEventListener('click', function () { wrap.remove(); submit(q); });
      wrap.appendChild(b);
    });
    log.appendChild(wrap);
    log.scrollTop = log.scrollHeight;
  }

  // Visibility is driven by the .chat-open class on the root. The centred panel fades/rises in;
  // it never dims or blocks the page, and stays open while you use the rest of the site.
  function isOpen() { return root.classList.contains('chat-open'); }
  function setExpanded(v) { toggles.forEach(function (t) { t.setAttribute('aria-expanded', v); }); }
  function visibleToggle() {
    for (var i = 0; i < toggles.length; i++) if (toggles[i].offsetParent) return toggles[i];
    return toggles[0];
  }

  function openPanel() {
    root.classList.add('chat-open');
    setExpanded('true');
    if (!greeted) {
      greeted = true;
      if (configured) {
        addMsg('bot', "Hi, I'm Fred — the S.C.O.U.T. project assistant. Ask me about the "
          + 'research, the hardware and software, the team, or the plan.');
        addStarters();
      } else {
        addMsg('bot', "Hi, I'm Fred — the S.C.O.U.T. project assistant. I'm not connected yet, "
          + "but once the team deploys the chat service I'll answer your questions here.");
      }
    }
    setTimeout(function () { input.focus(); }, 60);
  }

  function closePanel() {
    root.classList.remove('chat-open');
    setExpanded('false');
    var t = visibleToggle();
    if (t) t.focus();
  }

  toggles.forEach(function (t) {
    t.addEventListener('click', function () { isOpen() ? closePanel() : openPanel(); });
  });
  closeBtn.addEventListener('click', closePanel);
  // The widget is deliberately non-blocking: clicking the page does NOT close it (you're meant
  // to use the site while chatting). It closes only via the header chevron or Escape.
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && isOpen()) closePanel();
  });

  form.addEventListener('submit', function (e) { e.preventDefault(); submit(input.value); });

  function submit(q) {
    q = (q || '').trim();
    if (!q || busy) return;
    input.value = '';
    addMsg('user', q);
    history.push({ role: 'user', content: q });
    if (!configured) {
      addMsg('bot', "I'm not connected yet — check back once the service is live.");
      return;
    }
    ask();
  }

  function ask() {
    busy = true;
    var typing = addMsg('bot', '…', { plain: true, typing: true });
    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: history.slice(-8) })
    })
      .then(function (r) {
        if (!r.ok) {
          // Log why. The Worker returns {error, detail, upstream}; discarding it meant a
          // decommissioned model id showed up as a generic "something went wrong" with the
          // real cause sitting unread in the response body.
          return r.json().catch(function () { return {}; }).then(function (e) {
            var why = (e && (e.detail || e.error)) || ('http ' + r.status);
            console.error('[Ask S.C.O.U.T.] chat failed —', r.status, why);
            throw new Error(why);
          });
        }
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
