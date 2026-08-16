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
  var panel = root.querySelector('.chat-panel');
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

  // Visibility is driven by the .chat-open class on the root, not the [hidden] attribute:
  // the panel animates (scale/opacity/visibility), so it must stay in the box model to spill
  // in and out of the icon.
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
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && isOpen()) closePanel();
  });
  // Click outside the panel and away from either launcher closes it. Excluding the toggles
  // keeps the same click that opened the panel from immediately closing it again.
  document.addEventListener('click', function (e) {
    if (!isOpen()) return;
    // A control inside the panel (e.g. a starter chip) may remove itself in its own handler;
    // by the time this runs its target is detached, so panel.contains() would be false. Treat a
    // detached target as an in-widget click, not an outside one.
    if (!document.contains(e.target)) return;
    if (panel.contains(e.target)) return;
    for (var i = 0; i < toggles.length; i++) if (toggles[i].contains(e.target)) return;
    closePanel();
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
