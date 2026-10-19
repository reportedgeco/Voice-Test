/**
 * ReportEdge Voice Concierge
 * ---------------------------------------------------------------
 * Free, zero-backend voice agent using the browser's built-in
 * Web Speech API (SpeechRecognition + speechSynthesis).
 *
 * Flow:  greet -> ask name -> ask individual/company -> show tool cards
 *        + speak overview -> user picks (voice or click) -> navigate to
 *        tool page -> speak explanation + relatable example.
 *
 * Requires tools-config.js to be loaded first (defines REPORTEDGE_TOOLS).
 * State is kept in sessionStorage so it survives page navigation.
 */
(function () {
  "use strict";

  var TOOLS = typeof REPORTEDGE_TOOLS !== "undefined" ? REPORTEDGE_TOOLS : null;
  if (!TOOLS) {
    console.error("[ReportEdge Voice] tools-config.js must be loaded first.");
    return;
  }

  /* ---------- Settings ---------- */
  var STORE_KEY = "re_voice_state_v1";
  var LANG = "en-IN"; // Indian English; change to "en-US" etc. if you like

  /* ---------- State ---------- */
  var state = load() || { step: "idle", name: "", type: "", pendingTool: "" };
  function load() {
    try { return JSON.parse(sessionStorage.getItem(STORE_KEY)); } catch (e) { return null; }
  }
  function save() {
    try { sessionStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) {}
  }

  /* ---------- Speech support ---------- */
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  var synth = window.speechSynthesis;
  var recognizer = null;
  var listening = false;
  var muted = false;
  var speaking = false;

  /* ---------- UI ---------- */
  var css = "\
#rev-fab{position:fixed;left:20px;bottom:20px;width:60px;height:60px;border-radius:50%;border:none;cursor:pointer;background:#2563eb;color:#fff;font-size:26px;box-shadow:0 6px 20px rgba(0,0,0,.25);z-index:99999}\
#rev-fab:hover{background:#1d4ed8}\
#rev-panel{position:fixed;left:20px;bottom:92px;width:360px;max-width:calc(100vw - 40px);max-height:75vh;display:none;flex-direction:column;background:#fff;color:#111;border-radius:16px;box-shadow:0 12px 40px rgba(0,0,0,.3);z-index:99999;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;overflow:hidden}\
#rev-panel.open{display:flex}\
#rev-head{background:#2563eb;color:#fff;padding:12px 14px;display:flex;align-items:center;justify-content:space-between;font-weight:600}\
#rev-head button{background:transparent;border:none;color:#fff;font-size:18px;cursor:pointer;margin-left:8px}\
#rev-log{padding:12px;overflow-y:auto;flex:1;display:flex;flex-direction:column;gap:8px;font-size:14px}\
.rev-msg{padding:8px 11px;border-radius:12px;max-width:88%;line-height:1.4;white-space:pre-wrap}\
.rev-bot{background:#f1f5f9;align-self:flex-start}\
.rev-user{background:#dbeafe;align-self:flex-end}\
#rev-cards{display:flex;flex-direction:column;gap:6px;padding:0 12px 8px}\
.rev-card{border:1px solid #cbd5e1;border-radius:10px;padding:8px 10px;cursor:pointer;background:#fff;text-align:left;font-size:13px}\
.rev-card:hover{border-color:#2563eb;background:#eff6ff}\
.rev-card b{display:block;margin-bottom:2px}\
#rev-choice{display:flex;gap:8px;padding:0 12px 8px}\
#rev-choice button{flex:1;padding:9px;border-radius:10px;border:1px solid #2563eb;background:#fff;color:#2563eb;font-weight:600;cursor:pointer}\
#rev-choice button:hover{background:#2563eb;color:#fff}\
#rev-foot{display:flex;gap:6px;padding:10px;border-top:1px solid #e2e8f0;align-items:center}\
#rev-input{flex:1;padding:8px 10px;border:1px solid #cbd5e1;border-radius:10px;font-size:14px}\
#rev-foot button{border:none;border-radius:10px;padding:8px 10px;cursor:pointer;background:#e2e8f0;font-size:16px}\
#rev-mic.on{background:#ef4444;color:#fff}\
#rev-hear{margin:0 12px 8px;padding:8px;border-radius:10px;border:none;background:#16a34a;color:#fff;font-weight:600;cursor:pointer;display:none}\
";
  var styleEl = document.createElement("style");
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  var root = document.createElement("div");
  root.innerHTML =
    '<button id="rev-fab" aria-label="Open voice assistant" title="Talk to ReportEdge assistant">🎙️</button>' +
    '<div id="rev-panel" role="dialog" aria-label="ReportEdge voice assistant">' +
    '<div id="rev-head"><span>ReportEdge Assistant</span><span><button id="rev-mute" title="Mute voice">🔊</button><button id="rev-close" title="Close">✕</button></span></div>' +
    '<div id="rev-log"></div>' +
    '<div id="rev-choice" style="display:none"><button data-t="individual">Individual</button><button data-t="company">Company</button></div>' +
    '<div id="rev-cards"></div>' +
    '<button id="rev-hear">▶ Hear the explanation</button>' +
    '<div id="rev-foot"><input id="rev-input" placeholder="Type here or tap the mic…" autocomplete="off"/><button id="rev-mic" title="Speak">🎤</button><button id="rev-send" title="Send">➤</button></div>' +
    "</div>";
  document.body.appendChild(root);

  var $ = function (id) { return document.getElementById(id); };
  var fab = $("rev-fab"), panel = $("rev-panel"), logEl = $("rev-log"),
      cardsEl = $("rev-cards"), choiceEl = $("rev-choice"), inputEl = $("rev-input"),
      micBtn = $("rev-mic"), hearBtn = $("rev-hear");

  function addMsg(text, who) {
    var d = document.createElement("div");
    d.className = "rev-msg " + (who === "user" ? "rev-user" : "rev-bot");
    d.textContent = text;
    logEl.appendChild(d);
    logEl.scrollTop = logEl.scrollHeight;
  }

  /* ---------- Text to speech ---------- */
  function pickVoice() {
    var voices = synth ? synth.getVoices() : [];
    return (
      voices.find(function (v) { return v.lang === LANG; }) ||
      voices.find(function (v) { return v.lang && v.lang.indexOf("en") === 0; }) ||
      null
    );
  }

  // Speaks text, then calls cb (used to start the mic afterwards).
  function say(text, cb) {
    addMsg(text, "bot");
    if (!synth || muted) { if (cb) cb(); return; }
    stopListening();
    synth.cancel();
    var u = new SpeechSynthesisUtterance(text);
    var v = pickVoice();
    if (v) u.voice = v;
    u.lang = LANG;
    u.rate = 1;
    var done = false;
    function finish() { if (done) return; done = true; speaking = false; if (cb) cb(); }
    u.onstart = function () { speaking = true; hearBtn.style.display = "none"; };
    u.onend = finish;
    u.onerror = function (e) {
      // Autoplay policy can block speech after a page navigation.
      if (e && e.error === "not-allowed") { hearBtn.style.display = "block"; }
      finish();
    };
    synth.speak(u);
  }

  /* ---------- Speech to text ---------- */
  function startListening() {
    if (!SR || muted || listening || speaking || !panel.classList.contains("open")) return;
    try {
      recognizer = new SR();
      recognizer.lang = LANG;
      recognizer.interimResults = false;
      recognizer.maxAlternatives = 1;
      recognizer.onstart = function () { listening = true; micBtn.classList.add("on"); };
      recognizer.onend = function () { listening = false; micBtn.classList.remove("on"); };
      recognizer.onerror = function () { listening = false; micBtn.classList.remove("on"); };
      recognizer.onresult = function (e) {
        var text = e.results[0][0].transcript;
        handleUser(text);
      };
      recognizer.start();
    } catch (e) { /* already started or blocked */ }
  }
  function stopListening() {
    if (recognizer && listening) { try { recognizer.stop(); } catch (e) {} }
    listening = false;
    micBtn.classList.remove("on");
  }

  /* ---------- Helpers ---------- */
  function norm(s) { return (s || "").toLowerCase().replace(/[^a-z0-9\s\-]/g, " ").replace(/\s+/g, " ").trim(); }

  function extractName(raw) {
    var t = (raw || "").trim().replace(/[.!?,]+$/g, "");
    t = t.replace(/^(hi|hello|hey)[\s,]+/i, "");
    t = t.replace(/^(my name is|my name's|i am|i'm|im|this is|it is|it's|call me|name is)\s+/i, "");
    t = t.split(/\s+/).slice(0, 2).join(" ");
    return t ? t.charAt(0).toUpperCase() + t.slice(1) : "";
  }

  function detectType(raw) {
    var t = norm(raw);
    if (/(company|business|firm|organi[sz]ation|corporate|broker|accountant|cfo|agency|enterprise)/.test(t)) return "company";
    if (/(individual|personal|myself|salaried|employee|person|taxpayer|tax payer|freelanc|me)/.test(t)) return "individual";
    return "";
  }

  function findTool(raw, type) {
    var t = norm(raw);
    var list = TOOLS[type].tools, best = null, bestScore = 0;
    list.forEach(function (tool, i) {
      var score = 0;
      tool.match.forEach(function (m) { if (t.indexOf(norm(m)) !== -1) score += norm(m).length; });
      norm(tool.name).split(" ").forEach(function (w) { if (w.length > 3 && t.indexOf(w) !== -1) score += 2; });
      if (t.indexOf(["first", "second", "third", "fourth", "fifth"][i] || "~~") !== -1) score += 3;
      if (score > bestScore) { bestScore = score; best = tool; }
    });
    return best;
  }

  /* ---------- Conversation flow ---------- */
  function begin() {
    state = { step: "ask_name", name: "", type: "", pendingTool: "" };
    save();
    clearUI();
    say("Hi! Welcome to ReportEdge. What is your name?", startListening);
  }

  function clearUI() {
    logEl.innerHTML = "";
    cardsEl.innerHTML = "";
    choiceEl.style.display = "none";
  }

  function askType() {
    state.step = "ask_type"; save();
    choiceEl.style.display = "flex";
    say("Hi " + state.name + ", how are you today? Are you an individual taxpayer, or a company?", startListening);
  }

  function showTools(type) {
    state.type = type; state.step = "pick_tool"; save();
    choiceEl.style.display = "none";
    cardsEl.innerHTML = "";
    TOOLS[type].tools.forEach(function (tool) {
      var b = document.createElement("button");
      b.className = "rev-card";
      b.innerHTML = "<b></b><span></span>";
      b.firstChild.textContent = tool.name;
      b.lastChild.textContent = tool.summary.split(".")[0] + ".";
      b.addEventListener("click", function () { chooseTool(tool); });
      cardsEl.appendChild(b);
    });
    say(
      TOOLS[type].introLine + " Which one would you like to know more about? You can say its name or tap it on screen.",
      startListening
    );
  }

  function chooseTool(tool) {
    state.pendingTool = tool.id; state.step = "navigating"; save();
    stopListening();
    var clean = function (p) { return p.replace(/\.html$/, "").replace(/\/$/, ""); };
    var onPage = clean(new URL(tool.url, location.href).pathname) === clean(location.pathname);
    if (onPage) { explainTool(tool); return; }
    addMsg("Taking you to " + tool.name + "…", "bot");
    setTimeout(function () { location.href = tool.url; }, 400);
  }

  function explainTool(tool) {
    state.step = "explained"; state.pendingTool = ""; state.lastTool = tool.id; save();
    panel.classList.add("open");
    say(
      tool.name + ". " + tool.summary + " " + tool.example +
        " Would you like to hear about another tool? Just say its name, or say 'show all tools'.",
      startListening
    );
  }

  function findToolById(id) {
    var found = null;
    ["individual", "company"].forEach(function (k) {
      TOOLS[k].tools.forEach(function (t) { if (t.id === id) found = t; });
    });
    return found;
  }

  function handleUser(raw) {
    raw = (raw || "").trim();
    if (!raw) return;
    addMsg(raw, "user");
    inputEl.value = "";
    var t = norm(raw);

    // Global commands
    if (/(start over|restart|begin again)/.test(t)) { begin(); return; }
    if (/(stop|quiet|shut up|be quiet)/.test(t)) { synth && synth.cancel(); stopListening(); return; }
    if (/(show all|all tools|list tools|what tools|other tools|another tool|go back)/.test(t) && state.type) {
      showTools(state.type); return;
    }
    if (/(switch|change).*(company|business)/.test(t)) { showTools("company"); return; }
    if (/(switch|change).*(individual|personal)/.test(t)) { showTools("individual"); return; }

    switch (state.step) {
      case "ask_name": {
        var name = extractName(raw);
        if (!name) { say("Sorry, I didn't catch that. What is your name?", startListening); return; }
        state.name = name; save();
        askType();
        break;
      }
      case "ask_type": {
        var type = detectType(raw);
        if (!type) { say("Sorry, are you an individual taxpayer, or a company?", startListening); return; }
        showTools(type);
        break;
      }
      case "pick_tool":
      case "explained": {
        var tool = findTool(raw, state.type || "individual");
        if (!tool) {
          // try the other category too
          var other = state.type === "company" ? "individual" : "company";
          tool = findTool(raw, other);
        }
        if (tool) { chooseTool(tool); }
        else { say("I'm not sure which tool you mean. Please say the name of a tool, like " + TOOLS[state.type || "individual"].tools[0].name + ", or tap one on screen.", startListening); }
        break;
      }
      default:
        begin();
    }
  }

  /* ---------- Events ---------- */
  function openPanel() {
    panel.classList.add("open");
    if (state.step === "idle" || !state.name) { begin(); }
    else {
      // Restore UI for returning/navigated user
      if (state.type) showToolsSilently(state.type);
      say("Welcome back" + (state.name ? ", " + state.name : "") + ". Say a tool name, or say 'start over'.", startListening);
    }
  }

  function showToolsSilently(type) {
    cardsEl.innerHTML = "";
    TOOLS[type].tools.forEach(function (tool) {
      var b = document.createElement("button");
      b.className = "rev-card";
      b.innerHTML = "<b></b><span></span>";
      b.firstChild.textContent = tool.name;
      b.lastChild.textContent = tool.summary.split(".")[0] + ".";
      b.addEventListener("click", function () { chooseTool(tool); });
      cardsEl.appendChild(b);
    });
  }

  fab.addEventListener("click", function () {
    if (panel.classList.contains("open")) { panel.classList.remove("open"); synth && synth.cancel(); stopListening(); }
    else openPanel();
  });
  $("rev-close").addEventListener("click", function () { panel.classList.remove("open"); synth && synth.cancel(); stopListening(); });
  $("rev-mute").addEventListener("click", function () {
    muted = !muted;
    $("rev-mute").textContent = muted ? "🔇" : "🔊";
    if (muted) { synth && synth.cancel(); stopListening(); }
  });
  $("rev-send").addEventListener("click", function () { handleUser(inputEl.value); });
  inputEl.addEventListener("keydown", function (e) { if (e.key === "Enter") handleUser(inputEl.value); });
  micBtn.addEventListener("click", function () {
    if (!SR) { addMsg("Voice input isn't supported in this browser. Please type, or use Chrome or Edge.", "bot"); return; }
    if (listening) stopListening(); else { synth && synth.cancel(); speaking = false; startListening(); }
  });
  choiceEl.addEventListener("click", function (e) {
    var t = e.target.getAttribute && e.target.getAttribute("data-t");
    if (t) { addMsg(t === "company" ? "Company" : "Individual", "user"); showTools(t); }
  });
  hearBtn.addEventListener("click", function () {
    var tool = findToolById(state.lastTool || "");
    hearBtn.style.display = "none";
    if (tool) explainTool(tool);
  });

  if (synth && synth.onvoiceschanged !== undefined) synth.onvoiceschanged = function () {};

  /* ---------- Resume after navigation ---------- */
  if (state.step === "navigating" && state.pendingTool) {
    var tool = findToolById(state.pendingTool);
    if (tool) {
      state.lastTool = tool.id;
      panel.classList.add("open");
      if (state.type) showToolsSilently(state.type);
      // If the browser blocks auto speech, the "Hear the explanation" button appears.
      explainTool(tool);
    }
  }
})();
