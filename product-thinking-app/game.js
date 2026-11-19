/* Problem Quest: world, quests, bosses, pet, drawing. */
(function () {
  "use strict";
  var C = window.PQ_CONTENT, E = window.PQ;
  function $(id) { return document.getElementById(id); }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  /* ---------- constants ---------- */
  var VH = 160, GY = 128, SPR = 1.25;          // view height, ground line, sprite pixel size (world units)
  var WALK = 95, JUMP = -250, GRAV = 700;
  var PET_MAX = 5, BERRY_MAX = 9;
  var DEFAULTS = { exp: 0, done: {}, map: "hub", muted: false, right: 0, wrong: 0, started: false, petFull: 3, petJoy: 3, berries: 0 };

  var state = E.load(DEFAULTS);
  function sanitize() {
    if (!C.maps[state.map]) state.map = "hub";
    if (!state.done || typeof state.done !== "object" || Array.isArray(state.done)) state.done = {};
    ["exp", "right", "wrong"].forEach(function (k) { state[k] = Math.max(0, Math.floor(+state[k] || 0)); });
    state.petFull = clamp(Math.floor(+state.petFull || 0), 0, PET_MAX);
    state.petJoy = clamp(Math.floor(+state.petJoy || 0), 0, PET_MAX);
    state.berries = clamp(Math.floor(+state.berries || 0), 0, BERRY_MAX);
  }
  sanitize();
  E.setMuted(state.muted);

  var stage = $("stage"), cv = $("game"), ctx = cv.getContext("2d");
  var dlg = $("dialog"), body = $("dlgBody");
  var scale = 3, dpr = 1, VW = 320, offY = 0, sideMode = false;
  var t = 0, camX = 0, fade = 0;
  var player = { x: 60, y: GY, vx: 0, vy: 0, onGround: true, face: 1, walkT: 0, hurt: 0 };
  var pet = { x: 40, y: GY, face: 1, hop: 0, bubble: null, nextWhy: 6, off: -15 };
  var trail = [], particles = [], floats = [], near = null, promptKey = "", run = null;
  var lastBoss = C.pet.stages[C.pet.stages.length - 1].needs;

  /* ---------- progress helpers ---------- */
  function curMap() { return C.maps[state.map]; }
  function levelIndex(exp) { var i = 0; C.levels.forEach(function (l, n) { if (exp >= l.at) i = n; }); return i; }
  function anyQuestDone() { return Object.keys(state.done).length > 0; }
  function petStage() {
    var s = 0;
    C.pet.stages.forEach(function (st, i) {
      if (!st.needs) return;
      if (st.needs === "any" ? anyQuestDone() : state.done[st.needs]) s = Math.max(s, i);
    });
    return s;
  }
  function petMood() {
    if (petStage() === 0) return "egg";
    if (state.petFull <= 0) return "sulky";
    if (state.petFull >= 3 && state.petJoy >= 3) return "happy";
    return "ok";
  }
  function isLocked(e) { return !!(e.needs && !state.done[e.needs]); }
  function questsLeft(m) { return m.quests.filter(function (id) { return !state.done[id]; }).length; }

  /* ---------- HUD ---------- */
  function updateHud() {
    var li = levelIndex(state.exp), cur = C.levels[li], next = C.levels[li + 1];
    $("lvl").textContent = li + 1;
    $("lvlTitle").textContent = cur.title;
    $("expFill").style.width = (next ? (state.exp - cur.at) / (next.at - cur.at) * 100 : 100) + "%";
    $("mapName").textContent = curMap().name;
    var mute = $("btnMute");
    mute.classList.toggle("off", state.muted);
    mute.setAttribute("aria-label", state.muted ? "Sound off" : "Sound on");
    mute.querySelector(".lbl").textContent = state.muted ? " Off" : " On";
    var mood = petMood(), chip = $("btnPet");
    chip.classList.toggle("happy", mood === "happy");
    chip.classList.toggle("sulky", mood === "sulky");
    chip.title = C.pet.stages[petStage()].name + (mood === "egg" ? "" : ": " + mood);
  }
  function toast(text) {
    var box = $("toasts"), d = el("div", "toast", text);
    while (box.children.length >= 3) box.removeChild(box.firstChild);
    box.appendChild(d);
    setTimeout(function () { if (d.parentNode) d.parentNode.removeChild(d); }, 3300);
  }
  function addExp(n) {
    var before = levelIndex(state.exp);
    state.exp += n;
    floats.push({ text: "+" + n + " EXP", x: player.x, y: player.y - 30, life: 1.2, color: "#ffcf4a" });
    var after = levelIndex(state.exp);
    if (after > before) { toast("Level " + (after + 1) + ": " + C.levels[after].title); E.sfx("level"); }
    updateHud();
  }

  /* ---------- busy state (any sheet or overlay open) ---------- */
  function isBusy() { return document.body.classList.contains("busy"); }
  function setBusy() {
    var b = !dlg.hidden || !$("title").hidden || !$("log").hidden || !$("cert").hidden;
    document.body.classList.toggle("busy", b);
    if (b) { releaseInput(); $("prompt").hidden = true; promptKey = ""; }
  }
  function releaseInput() {
    E.input.left = E.input.right = E.input.jump = E.input.act = false;
    Array.prototype.forEach.call(document.querySelectorAll("#pad .down"), function (b) { b.classList.remove("down"); });
  }
  function blurActive() { var a = document.activeElement; if (a && a !== document.body && a.blur) a.blur(); }

  /* ---------- travel ---------- */
  function placePlayer(fromMap) {
    var m = curMap(), x = 60;
    m.ents.forEach(function (e) { if (e.type === "portal" && e.to === fromMap && x === 60) x = e.x + 22; });
    if (state.map === "hub" && !fromMap) x = 60;
    player.x = clamp(x, 10, m.width - 10); player.y = GY; player.vx = player.vy = 0; player.onGround = true;
    pet.x = player.x - 15; pet.y = GY; trail.length = 0;
    camX = camTarget();
  }
  function travel(to) {
    var from = state.map;
    state.map = to; E.sfx("portal"); fade = 1; particles.length = 0; floats.length = 0;
    placePlayer(from); updateHud(); E.save(state);
    toast(curMap().name);
  }

  /* ---------- dialogue and quest runner ---------- */
  function primaryBtn(label, fn) {
    var row = el("div", "row"), b = el("button", "btn primary", label);
    b.type = "button";
    b.appendChild(el("span", "k", "Enter"));
    b.addEventListener("click", fn);
    row.appendChild(b); body.appendChild(row);
    run.primary = fn;
    return row;
  }
  function hasItems(q) { return q.mode === "order" || !!(q.items && q.items.length); }

  function openQuest(q, ent) {
    E.sfx("talk");
    var scored = !q.talk && !q.petPlay;
    run = { q: q, ent: ent || null, scored: scored, replay: !scored || !!state.done[q.id], phase: "intro", line: 0 };
    if (ent) standBeside(ent);
    if (!q.intro || !q.intro.length) { run.phase = "play"; resetItems(); }
    dlg.hidden = false; setBusy(); render();
  }
  /* Step the player back so they face whoever they talk to instead of standing inside them. */
  function standBeside(ent) {
    var gap = ent.type === "boss" ? 38 : 17;
    var side = player.x <= ent.x ? -1 : 1;
    if (ent.type === "boss") side = -1;
    player.face = -side;
    if (Math.abs(player.x - ent.x) >= gap) return;
    var m = curMap(), tx = clamp(ent.x + side * gap, 10, m.width - 10), ok = player.y >= GY;
    m.platforms.forEach(function (p) { if (Math.abs(p.y - player.y) < 0.5 && tx > p.x + 2 && tx < p.x + p.w - 2) ok = true; });
    if (ok) { player.x = tx; trail.length = 0; }
  }
  function say(speaker, lines, opts) {
    openQuest({ talk: true, speaker: speaker, intro: lines, link: opts && opts.link }, opts && opts.ent);
    if (opts && opts.onDone) run.onDone = opts.onDone;
  }
  function closeDialog() { dlg.hidden = true; run = null; blurActive(); setBusy(); }

  function resetItems() {
    var q = run.q;
    run.bonus = run.scored && petMood() === "happy";
    run.maxHearts = (q.boss ? 4 : 3) + (run.bonus ? 1 : 0);
    run.hearts = run.maxHearts; run.missed = {}; run.fb = null; run.note = null;
    if (q.mode === "order") {
      run.built = 0; run.remaining = q.start.slice(); run.tried = {}; run.linkMissed = false; run.total = q.chain.length;
    } else {
      run.queue = q.items.map(function (_, i) { return i; }); run.total = q.items.length;
    }
    run.hp = run.total;
  }

  function render() {
    var q = run.q;
    body.innerHTML = ""; run.primary = null; run.pick = null; dlg.scrollTop = 0;
    $("dlgWho").textContent = q.speaker;
    var playing = run.phase === "play" || run.phase === "feedback" || run.phase === "fail";
    var hearts = $("dlgHearts");
    hearts.hidden = !(playing && run.scored);
    if (!hearts.hidden) {
      hearts.innerHTML = "";
      for (var i = 0; i < run.maxHearts; i++) hearts.appendChild(el("span", i < run.hearts ? "" : "lost", "♥"));
      hearts.setAttribute("aria-label", run.hearts + " of " + run.maxHearts + " hearts");
    }
    $("dlgBoss").hidden = !(q.boss && playing);
    if (q.boss && playing) $("dlgBossFill").style.width = (run.hp / run.total * 100) + "%";
    if (run.phase === "intro" || run.phase === "outro") return renderLines();
    if (run.phase === "fail") return renderFail();
    if (q.mode === "order") return renderOrder();
    renderChoice();
  }

  function renderLines() {
    var q = run.q, intro = run.phase === "intro", lines = intro ? q.intro : q.outro;
    var last = run.line === lines.length - 1;
    body.appendChild(el("p", "say", lines[run.line]));
    if (last && intro && q.link) {
      var p = el("p", "say"), a = el("a", null, q.link.label);
      a.href = q.link.href; a.target = "_blank"; a.rel = "noopener";
      p.appendChild(a); body.appendChild(p);
    }
    if (intro && run.line === 0 && run.scored && run.replay)
      body.appendChild(el("p", "practice", "Practice round. You have already earned the EXP for this quest."));
    if (intro && last && run.scored && petMood() === "happy")
      body.appendChild(el("p", "practice", "Your Whyling is cheering you on: one extra heart."));
    var label = !last ? "Next" : (intro && hasItems(q) ? "Start" : "Done");
    primaryBtn(label, function () {
      E.sfx("talk");
      if (!last) { run.line++; return render(); }
      if (intro && hasItems(q)) { run.phase = "play"; resetItems(); return render(); }
      finish();
    });
  }

  function fbBlock(ok, text, gain, berry) {
    var fb = el("div", "fb " + (ok ? "right" : "wrong"));
    fb.appendChild(el("b", null, ok ? "Correct" : "Not quite"));
    fb.appendChild(el("span", null, text));
    if (gain) fb.appendChild(el("span", "xp", "  +" + gain + " EXP" + (berry ? " · +1 berry" : "")));
    return fb;
  }
  function afterItems() {
    var q = run.q;
    if (q.outro && q.outro.length) { run.phase = "outro"; run.line = 0; render(); } else finish();
  }

  function renderChoice() {
    var q = run.q, answered = run.phase === "feedback";
    var idx = answered ? run.cur : (run.cur = run.queue[0]);
    var it = q.items[idx], opts = it.options || q.labels;
    if (it.context) body.appendChild(el("p", "practice", it.context));
    body.appendChild(el("p", "q-prompt", it.prompt || q.prompt));
    if (it.text) body.appendChild(el("blockquote", "q-card", it.text));
    var short = opts.every(function (o) { return o.length <= 22; });
    var wrap = el("div", "opts" + (short ? " short" : ""));
    opts.forEach(function (o, i) {
      var b = el("button", "opt"); b.type = "button";
      b.appendChild(el("span", "n", String(i + 1)));
      b.appendChild(el("span", null, o));
      if (answered) { b.disabled = true; if (i === run.fb.chosen) b.classList.add(run.fb.ok ? "right" : "wrong"); }
      else b.addEventListener("click", function () { pick(i); });
      wrap.appendChild(b);
    });
    body.appendChild(wrap);
    if (!answered) { run.pick = function (i) { if (i < opts.length) pick(i); }; return; }
    var text = run.fb.text;
    if (!run.fb.ok && run.scored && run.hearts > 0) text += " This one will come back.";
    body.appendChild(fbBlock(run.fb.ok, text, run.fb.gain, run.fb.berry));
    if (run.scored && run.hearts <= 0) primaryBtn("Continue", function () { run.phase = "fail"; render(); });
    else if (run.queue.length) primaryBtn("Next", function () { run.phase = "play"; render(); });
    else primaryBtn(q.petPlay ? "Back to pet" : "Continue", afterItems);
    dlg.scrollTop = dlg.scrollHeight;                       // keep the feedback and the Next button in view
  }

  function earnBerry() {
    if (state.berries >= BERRY_MAX) return false;
    state.berries++; return true;
  }
  function pick(i) {
    var q = run.q, it = q.items[run.cur], ok = i === it.answer, first = !run.missed[run.cur], gain = 0, berry = false;
    if (ok) {
      run.queue.shift(); run.hp--;
      if (!run.replay) {
        gain = first ? 10 : 4;
        if (first) { state.right++; berry = earnBerry(); }
        addExp(gain);
      }
      if (q.petPlay) { state.petJoy = Math.min(PET_MAX, state.petJoy + 1); updateHud(); }
      if (q.boss) bossHit(run.ent);
      E.sfx(q.boss ? "hit" : "right"); petCheer();
    } else {
      if (first && !run.replay) state.wrong++;
      run.missed[run.cur] = true;
      if (run.scored) { run.hearts--; run.queue.push(run.queue.shift()); player.hurt = 0.5; }
      else run.queue.shift();
      E.sfx("wrong");
    }
    var text = ok ? it.why : ((it.whyWrong && it.whyWrong[i]) || it.why);
    if (ok && q.petPlay) text += " Your Whyling does a happy flip.";
    run.fb = { chosen: i, ok: ok, gain: gain, berry: berry, text: text };
    run.phase = "feedback";
    E.save(state); render();
  }

  function renderOrder() {
    var q = run.q, done = run.built === q.chain.length;
    body.appendChild(el("p", "q-prompt", q.prompt));
    var ol = el("ol", "chain");
    ol.appendChild(el("li", "top", q.top));
    for (var i = 0; i < run.built; i++) ol.appendChild(el("li", "link", q.chain[i]));
    if (!done) ol.appendChild(el("li", "slot", run.built === 0 ? "Start here: which finding states the symptom itself?" : "Why? Pick the next link below."));
    body.appendChild(ol);
    if (done) {
      body.appendChild(fbBlock(true, q.explain, 0));
      primaryBtn("Continue", afterItems);
      return;
    }
    var wrap = el("div", "opts");
    run.remaining.forEach(function (ci, n) {
      var b = el("button", "opt"); b.type = "button";
      b.appendChild(el("span", "n", String(n + 1)));
      b.appendChild(el("span", null, q.chain[ci]));
      if (run.tried[ci]) { b.disabled = true; b.classList.add("wrong"); }
      else b.addEventListener("click", function () { pickLink(ci); });
      wrap.appendChild(b);
    });
    body.appendChild(wrap);
    if (run.note) body.appendChild(fbBlock(false, run.note, 0));
    run.pick = function (n) { var ci = run.remaining[n]; if (ci != null && !run.tried[ci]) pickLink(ci); };
  }
  function pickLink(ci) {
    var q = run.q;
    if (ci === run.built) {
      run.built++; run.remaining.splice(run.remaining.indexOf(ci), 1);
      run.tried = {}; run.note = null; run.hp--;
      if (!run.replay) {
        var first = !run.linkMissed;
        if (first) { state.right++; earnBerry(); }
        addExp(first ? 10 : 4);
      }
      run.linkMissed = false;
      bossHit(run.ent); E.sfx("hit"); petCheer();
    } else {
      if (!run.linkMissed && !run.replay) state.wrong++;
      run.linkMissed = true; run.tried[ci] = true; run.hearts--; run.note = q.wrongNote;
      player.hurt = 0.5; E.sfx("wrong");
      if (run.hearts <= 0) run.phase = "fail";
    }
    E.save(state); render();
  }

  function renderFail() {
    body.appendChild(el("p", "say", "You ran out of hearts. Nothing is lost: the explanations you just read are the point. Have another go."));
    var row = primaryBtn("Try again", function () { run.phase = "play"; resetItems(); render(); });
    var leave = el("button", "btn", "Leave"); leave.type = "button";
    leave.addEventListener("click", closeDialog);
    row.appendChild(leave);
  }

  function finish() {
    var q = run.q, ent = run.ent, cb = run.onDone;
    var first = run.scored && !state.done[q.id];
    var stageBefore = petStage();
    closeDialog();
    if (first) {
      state.done[q.id] = true;
      if (stageBefore > 0) {
        state.petFull = Math.max(0, state.petFull - 2);
        state.petJoy = Math.max(0, state.petJoy - 1);
      }
      if (q.boss) state.petJoy = Math.min(PET_MAX, state.petJoy + 2);
      addExp(q.boss ? 60 : 20);
      toast(q.boss ? q.speaker + " defeated!" : "Quest complete: " + q.title);
      var stageAfter = petStage();
      if (stageAfter > stageBefore) {
        toast(stageBefore === 0 ? "Your egg hatched into a Whyling!" : "Your Whyling grew into a " + C.pet.stages[stageAfter].name + "!");
        pet.hop = 1.2; burst(pet.x, pet.y - 8, 18, "#5fd6c4");
      }
      if (q.boss) {
        if (ent) burst(ent.x, ent.y - 26, 46, "#ffcf4a");
        E.sfx("win");
        if (q.id === lastBoss) setTimeout(function () { if (!isBusy()) showCert(); }, 1600);
        else toast("A new portal has opened at Crossroads Camp");
      } else if (questsLeft(curMap()) === 0) {
        toast("The boss is ready to face you");
      }
      if (petMood() === "sulky") toast("Your Whyling is hungry. Open Pet to feed it.");
    }
    E.save(state); updateHud();
    if (cb) cb();
  }

  /* ---------- world interactions ---------- */
  function guideTalk(ent) {
    var lines, onDone = null;
    if (state.done[lastBoss]) {
      lines = ["You’ve cleared all three lands, and look how your Whyling has grown. Here is your certificate."];
      onDone = showCert;
    } else if (state.done.boss2) {
      lines = ["The chain is untangled. One old rule was the whole story.",
        "Four-C Citadel is open. There you’ll write the problem down so a whole team can agree on it."];
    } else if (state.done.boss1) {
      lines = ["The Bot Request is reframed. Nicely done.",
        "Whywood Forest is open. The first problem you hear is usually a symptom, and the forest will teach you to dig for the cause."];
    } else {
      lines = ["Welcome to Crossroads Camp. I’m Juno. Around here, requests arrive dressed as solutions: “we need a chatbot”, “we need a superapp”.",
        "Your job is to find the real problem underneath. As IDG puts it: “Great digital products start with problems, not solutions.”",
        "Take this egg with you. Right answers on the first try earn berries, and whatever hatches will want feeding. Tap it, or press Pet, to look after it.",
        "Start with the first portal: Disguise Village. Help everyone with a ! above their head, then face the boss."];
    }
    say("Guide Juno", lines, { ent: ent, onDone: onDone });
  }
  function interact() {
    var e = near; if (!e) return;
    if (e.type === "npc") {
      if (e.id === "guide") guideTalk(e); else openQuest(C.quests[e.quest], e);
    } else if (e.type === "boss") {
      var q = C.quests[e.quest], left = questsLeft(curMap());
      if (left && !state.done[e.quest])
        say(q.speaker, ["You are not ready. " + left + " of the locals still " + (left === 1 ? "needs" : "need") + " your help. Look for the ! above their heads."], { ent: e });
      else openQuest(q, e);
    } else if (e.type === "portal") {
      if (isLocked(e)) say("Sealed portal", ["This portal opens when you defeat " + C.quests[e.needs].speaker + "."]);
      else travel(e.to);
    } else if (e.type === "sign") {
      var L = C.lessons[e.lesson];
      say("Signpost", ["This land is built on Lesson " + L.n + ": " + L.title + ". Read the full lesson any time."],
        { link: { href: L.url, label: "Open Lesson " + L.n + ": " + L.title } });
    }
  }
  function promptText(e) {
    if (e.type === "npc") return "Talk to " + e.name;
    if (e.type === "boss") return (state.done[e.quest] ? "Rematch " : "Challenge ") + C.quests[e.quest].speaker;
    if (e.type === "portal") return isLocked(e) ? e.label + " (sealed)" : "Enter " + e.label;
    return "Read the signpost";
  }

  /* ---------- pet ---------- */
  function petCheer() { pet.hop = 0.6; if (petStage() > 0) pet.bubble = { text: "♥", life: 1 }; }
  function openPet() {
    if (isBusy()) return;
    E.sfx("talk");
    run = { pet: true };
    dlg.hidden = false; setBusy(); renderPet();
  }
  function pips(n, cls) {
    var p = el("span", "pips" + (cls ? " " + cls : ""));
    for (var i = 0; i < PET_MAX; i++) p.appendChild(el("i", i < n ? "on" : ""));
    p.setAttribute("role", "img"); p.setAttribute("aria-label", n + " of " + PET_MAX);
    return p;
  }
  function recallPool() {
    var pool = [];
    Object.keys(state.done).forEach(function (id) {
      var q = C.quests[id];
      if (!q || !q.items) return;
      q.items.forEach(function (it) {
        if (it.recall === false) return;
        pool.push({ context: q.recall === "standalone" ? null : q.recall, prompt: it.prompt || q.prompt, text: it.text,
          options: it.options || q.labels, answer: it.answer, why: it.why });
      });
    });
    return pool;
  }
  function renderPet() {
    var st = petStage(), mood = petMood(), stages = C.pet.stages;
    body.innerHTML = ""; run.primary = null; run.pick = null; dlg.scrollTop = 0;
    $("dlgWho").textContent = st === 0 ? "Your egg" : "Your " + C.pet.name;
    $("dlgHearts").hidden = true; $("dlgBoss").hidden = true;
    body.appendChild(el("p", "say", C.pet.lines[mood]));
    var next = stages[st + 1], hint = "Stage " + (st + 1) + " of " + stages.length + ": " + stages[st].name + ".";
    if (next) hint += " Next: " + next.name + (next.needs === "any" ? ", after your first quest." : ", after you defeat " + C.quests[next.needs].speaker + ".");
    body.appendChild(el("p", "practice", hint));
    if (st === 0) {
      body.appendChild(el("p", "practice", "Berries saved for later: " + state.berries + " of " + BERRY_MAX + "."));
      primaryBtn("Close", closeDialog);
      return;
    }
    var m = el("div", "meters");
    m.appendChild(el("span", null, "Fullness")); m.appendChild(pips(state.petFull));
    m.appendChild(el("span", null, "Joy")); m.appendChild(pips(state.petJoy, "joy"));
    body.appendChild(m);
    var row = el("div", "row");
    var feed = el("button", "btn primary", "Feed a berry (" + state.berries + ")"); feed.type = "button";
    feed.disabled = state.berries <= 0 || state.petFull >= PET_MAX;
    feed.addEventListener("click", function () {
      state.berries--; state.petFull = Math.min(PET_MAX, state.petFull + 1);
      E.sfx("right"); petCheer(); E.save(state); updateHud(); renderPet();
    });
    var pool = recallPool();
    var play = el("button", "btn", "Play quick recall"); play.type = "button";
    play.disabled = !pool.length;
    play.addEventListener("click", function () {
      var it = pool[Math.floor(Math.random() * pool.length)];
      closeDialog();
      openQuest({ petPlay: true, speaker: "Quick recall", intro: [], items: [it], outro: [] }, null);
      run.onDone = openPet;
    });
    var close = el("button", "btn", "Close"); close.type = "button";
    close.addEventListener("click", closeDialog);
    row.appendChild(feed); row.appendChild(play); row.appendChild(close);
    body.appendChild(row);
    run.primary = closeDialog;
    body.appendChild(el("p", "practice", "Right answers on the first try earn berries. Quick recall asks one question from a quest you have finished and raises Joy. A full, happy Whyling gives you an extra heart in quests. It gets hungrier with each new quest you finish, never while you are away."));
  }

  /* ---------- overlays ---------- */
  function startGame() {
    E.unlock();
    var firstTime = !state.started;
    state.started = true; $("title").hidden = true; blurActive(); setBusy(); E.save(state);
    if (firstTime && !anyQuestDone() && state.map === "hub") {
      var g = curMap().ents.filter(function (e) { return e.id === "guide"; })[0];
      guideTalk(g);
    }
  }
  function resetAll() {
    var muted = state.muted;
    state = JSON.parse(JSON.stringify(DEFAULTS)); state.muted = muted;
    E.save(state); placePlayer(null); updateHud();
  }
  function armTwice(btn, label, fn) {
    var armed = false, idle = btn.textContent;
    btn.addEventListener("click", function () {
      if (!armed) { armed = true; btn.textContent = label; setTimeout(function () { armed = false; btn.textContent = idle; }, 4000); return; }
      armed = false; btn.textContent = idle; fn();
    });
  }
  function renderLog() {
    var b = $("logBody"); b.innerHTML = "";
    var st = petStage(), box = el("div", "log-map");
    box.appendChild(el("h3", null, "Companion"));
    box.appendChild(el("span", null, (st === 0 ? "Egg" : C.pet.name + ", " + C.pet.stages[st].name) + " · stage " + (st + 1) + " of " + C.pet.stages.length + " · " + state.berries + " berries"));
    b.appendChild(box);
    ["m1", "m2", "m3"].forEach(function (id) {
      var m = C.maps[id], L = C.lessons[m.lesson], gate = null;
      C.maps.hub.ents.forEach(function (e) { if (e.to === id) gate = e; });
      var locked = gate && isLocked(gate);
      box = el("div", "log-map");
      box.appendChild(el("h3", null, m.name + (locked ? " (sealed)" : "")));
      var ul = el("ul");
      m.quests.concat([m.bossQuest]).forEach(function (qid) {
        var d = !!state.done[qid];
        ul.appendChild(el("li", d ? "done" : (locked ? "locked" : ""), (d ? "✓ " : "• ") + C.quests[qid].title));
      });
      box.appendChild(ul);
      var a = el("a", null, "Read Lesson " + L.n + ": " + L.title);
      a.href = L.url; a.target = "_blank"; a.rel = "noopener";
      box.appendChild(a);
      b.appendChild(box);
    });
  }
  function showCert() {
    var total = state.right + state.wrong, li = levelIndex(state.exp);
    $("certStats").textContent = "You finished at level " + (li + 1) + " (" + C.levels[li].title + ")" +
      (total ? ", with " + state.right + " of " + total + " first answers right" : "") +
      ". Your egg grew into a " + C.pet.stages[petStage()].name + ".";
    var links = $("certLinks"); links.innerHTML = "";
    C.lessons.forEach(function (L) {
      var a = el("a", null, "Lesson " + L.n + ": " + L.title); a.href = L.url; a.target = "_blank"; a.rel = "noopener"; links.appendChild(a);
    });
    var cs = el("a", null, "Cheat sheet"); cs.href = C.cheatsheet; cs.target = "_blank"; cs.rel = "noopener"; links.appendChild(cs);
    $("cert").hidden = false; setBusy(); E.sfx("win");
  }
  function closeOverlays() { $("log").hidden = true; $("cert").hidden = true; blurActive(); setBusy(); }

  /* ---------- effects ---------- */
  function burst(x, y, n, color) {
    for (var i = 0; i < n; i++) {
      var a = Math.random() * Math.PI * 2, s = 30 + Math.random() * 90;
      particles.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 40, life: 0.5 + Math.random() * 0.6, color: i % 3 ? color : "#ffffff" });
    }
  }
  function bossHit(ent) {
    if (!ent) return;
    ent.hit = 0.45; burst(ent.x, ent.y - 28, 12, "#ff7f90");
    floats.push({ text: "HIT!", x: ent.x, y: ent.y - 76, life: 0.9, color: "#ff7f90" });
  }

  /* ---------- sprites ---------- */
  var HEAD = ["...hhhhhh...", "..hhhhhhhh..", ".hhhhhhhhhh."];
  var HAT = ["...cccccc...", "..cccccccc..", "cccccccccccc"];
  var FACE = [".hhhsssssss.", ".hhsssesses.", ".hhsssesses.", ".hhssssssss.", "..hsssmmss.."];
  var TORSO = ["..tttttttt..", ".stttttttts.", ".stttttttts.", "..tttttttt..", "..pppppppp.."];
  var LEGS_A = ["..ppp..ppp..", "..ppp..ppp..", ".bbbb..bbbb."];
  var LEGS_B = ["...pppppp...", "....pppp....", "...bbbbbb..."];
  var LOOKS = {
    player: { h: "#4a2c1a", s: "#ffd9b0", t: "#ff6b5e", p: "#3b4a8f" },
    guide: { h: "#2a2140", s: "#e8b88a", t: "#2fa39a", p: "#4a3a2a", c: "#ffcf4a" },
    elder: { h: "#e9e6f5", s: "#f0c8a0", t: "#7a5cc4", p: "#3a2f5c" },
    pip: { h: "#b0452f", s: "#ffd9b0", t: "#4aa3ff", p: "#2f4a6b", c: "#e0453a" },
    bea: { h: "#2a2140", s: "#c98e62", t: "#ff9f6b", p: "#5c3a4a" },
    ranger: { h: "#4a2c1a", s: "#e8b88a", t: "#3f8f5a", p: "#4a3a2a", c: "#2e6b45" },
    healer: { h: "#b0452f", s: "#ffd9b0", t: "#f4f2ff", p: "#8a88b0" },
    scribe: { h: "#6b4226", s: "#f0c8a0", t: "#b56bd6", p: "#3a2f5c" },
    mina: { h: "#2a2140", s: "#c98e62", t: "#ffcf4a", p: "#7a4a2a", c: "#ff7f90" },
    rao: { h: "#2a2140", s: "#a8704a", t: "#5f7ad6", p: "#232252", c: "#232252" }
  };
  var spriteCache = {};
  function charSprite(look, frame) {
    var key = look + frame;
    if (spriteCache[key]) return spriteCache[key];
    var L = LOOKS[look] || LOOKS.player;
    var pal = { h: L.h, s: L.s, t: L.t, p: L.p, c: L.c, e: "#1b1a3a", m: "#c9644a", b: "#2a2140" };
    var rows = (L.c ? HAT : HEAD).concat(FACE, TORSO, frame ? LEGS_B : LEGS_A);
    return (spriteCache[key] = E.sprite(rows, pal));
  }
  function drawChar(look, x, y, face, frame) {
    var s = charSprite(look, frame), w = s.width * SPR, h = s.height * SPR;
    ctx.save(); ctx.translate(x, y - h);
    if (face < 0) ctx.scale(-1, 1);
    ctx.drawImage(s, -w / 2, 0, w, h);
    ctx.restore();
  }

  /* ---------- drawing primitives ---------- */
  function rect(x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); }
  function rrPath(x, y, w, h, r) {
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h);
  }
  function rr(x, y, w, h, r, c) { ctx.fillStyle = c; rrPath(x, y, w, h, r); ctx.fill(); }
  function circ(x, y, r, c) { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); }
  function oval(x, y, rx, ry, c) { ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, Math.PI * 2); ctx.fill(); }
  function tri(x1, y1, x2, y2, x3, y3, c) { ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineTo(x3, y3); ctx.closePath(); ctx.fill(); }
  var FONT = '"Jersey 15", "Courier New", monospace';
  function label(text, x, y, color, bg) {
    ctx.font = "600 6.5px " + FONT; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    var w = ctx.measureText(text).width + 6;
    rr(x - w / 2, y - 4.5, w, 9, 2.5, bg || "rgba(23,22,58,0.8)");
    ctx.fillStyle = color || "#f4f2ff"; ctx.fillText(text, x, y + 0.5);
  }
  function star(x, y, r, c) {
    ctx.fillStyle = c; ctx.beginPath();
    for (var i = 0; i < 10; i++) {
      var a = -Math.PI / 2 + i * Math.PI / 5, rad = i % 2 ? r * 0.45 : r;
      ctx.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad);
    }
    ctx.closePath(); ctx.fill();
  }

  /* ---------- themes and scenery ---------- */
  var THEMES = {
    meadow: { sky: ["#7cc8ff", "#e3f6ff"], sun: "#fff3b0", cloud: "#ffffff", hill: "#86cf86", hill2: "#b4e3b0", grass: "#58b04c", grassTop: "#7ad468", dirt: "#8a5a3c", dirt2: "#74492f" },
    village: { sky: ["#6ec3f5", "#ffe9c7"], sun: "#ffe08a", cloud: "#ffffff", hill: "#9ccf7f", hill2: "#c4e3a8", grass: "#6dbb4f", grassTop: "#93d96b", dirt: "#9a673f", dirt2: "#80532f" },
    forest: { sky: ["#1f5a63", "#9fd6b4"], sun: "#eafff0", cloud: "#cfeede", hill: "#2e6b55", hill2: "#4f8f73", grass: "#3f9a55", grassTop: "#5cc070", dirt: "#5b4030", dirt2: "#4a3326" },
    citadel: { sky: ["#33295f", "#f0a0a8"], sun: "#ffe9c7", cloud: "#c9b6e8", hill: "#5a4a8a", hill2: "#7a68aa", grass: "#8d97b8", grassTop: "#b4bcd8", dirt: "#55547a", dirt2: "#444366" }
  };
  var decoCache = {};
  function decoFor(id) {
    if (decoCache[id]) return decoCache[id];
    var m = C.maps[id], list = [], seed = id.charCodeAt(0) + id.charCodeAt(id.length - 1) * 7;
    for (var x = -120, i = 0; x < m.width + 120; x += 62, i++)
      list.push({ x: x + E.hash(seed + i * 13) * 26, v: E.hash(seed + i * 29), k: Math.floor(E.hash(seed + i * 53) * 3) });
    return (decoCache[id] = list);
  }
  function drawDeco(theme, d) {
    var x = d.x, v = d.v, k = d.k;
    if (theme === "village") {
      if (k === 2) return roundTree(x, v);
      var w = 28 + v * 8, h = 20 + v * 6;
      rect(x, GY - h, w, h, ["#f3e2c2", "#e9d2b2"][k]);
      tri(x - 4, GY - h, x + w / 2, GY - h - 15, x + w + 4, GY - h, ["#c8553d", "#7a5cc4"][k]);
      rect(x + w / 2 - 4, GY - 12, 8, 12, "#6b4226");
      rect(x + 4, GY - h + 5, 6, 6, "#bfe9ff");
    } else if (theme === "forest") {
      if (k === 0) return roundTree(x, v);
      var ph = 34 + v * 22;
      rect(x - 2, GY - 10, 4, 10, "#4a3326");
      for (var i = 0; i < 3; i++) tri(x - 13 + i * 2, GY - 8 - i * ph / 4, x, GY - 8 - i * ph / 4 - ph / 2.2, x + 13 - i * 2, GY - 8 - i * ph / 4, ["#1f5a45", "#256b50", "#2e7d5b"][i]);
    } else if (theme === "citadel") {
      if (k === 2) { rect(x, GY - 26, 6, 26, "#6b6694"); rect(x - 2, GY - 29, 10, 3, "#8a86b4"); return; }
      var th = 46 + v * 22;
      rect(x, GY - th, 22, th, k ? "#6b6694" : "#5d5886");
      for (var c = 0; c < 3; c++) rect(x + c * 8.5 - 1, GY - th - 5, 6, 5, k ? "#6b6694" : "#5d5886");
      rr(x + 8, GY - th + 10, 6, 10, 3, "#2a2550");
      rect(x + 21, GY - th + 2, 1, 12, "#2a2550");
      tri(x + 22, GY - th + 2, x + 31, GY - th + 5, x + 22, GY - th + 8, "#ffcf4a");
    } else {
      if (k === 0) return roundTree(x, v);
      if (k === 1) {
        tri(x - 16, GY, x, GY - 26 - v * 6, x + 16, GY, "#ff9f6b");
        tri(x - 5, GY, x, GY - 14, x + 5, GY, "#5c3a2a");
      } else {
        rect(x, GY - 30, 1.5, 30, "#6b4226");
        tri(x + 1.5, GY - 30, x + 13, GY - 26, x + 1.5, GY - 22, "#ffcf4a");
      }
    }
  }
  function roundTree(x, v) {
    var h = 16 + v * 8;
    rect(x - 2, GY - h, 4, h, "#6b4226");
    circ(x - 7, GY - h - 2, 8, "#3f9a55"); circ(x + 7, GY - h - 2, 8, "#3f9a55"); circ(x, GY - h - 9, 10, "#4fb066");
  }
  function hills(color, par, base, amp, freq) {
    ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(0, GY + 1);
    for (var sx = 0; sx <= VW + 4; sx += 4) {
      var wx = sx + camX * par;
      ctx.lineTo(sx, base + Math.sin(wx * freq) * amp + Math.sin(wx * freq * 2.3 + 1.7) * amp * 0.4);
    }
    ctx.lineTo(VW + 4, GY + 1); ctx.closePath(); ctx.fill();
  }

  /* ---------- entities ---------- */
  function drawPortal(e) {
    var locked = isLocked(e);
    if (locked && e.hideLocked) return;
    var x = e.x, y = e.y;
    rr(x - 13, y - 3, 26, 4, 2, "#3a3870");
    var cols = locked ? ["#8a88b0", "#a9a7c8", "#c9c8de"] : ["#7ae0ff", "#b58cff", "#ffffff"];
    for (var i = 0; i < 3; i++) {
      ctx.globalAlpha = locked ? 0.4 : 0.6 + 0.2 * Math.sin(t * 3 + i * 2);
      oval(x, y - 18, 10 - i * 3 + Math.sin(t * 2 + i) * 0.7, 15 - i * 4.5, cols[i]);
    }
    ctx.globalAlpha = 1;
    if (!locked) for (var s = 0; s < 3; s++) {
      var a = t * 1.6 + s * 2.1;
      rect(x + Math.cos(a) * 12, y - 18 + Math.sin(a) * 17, 1.5, 1.5, "#ffffff");
    }
    label(locked ? e.label + " · sealed" : e.label, x, y - 40, locked ? "#bdb9ea" : "#f4f2ff");
  }
  function drawSign(e) {
    rect(e.x - 1, e.y - 16, 2, 16, "#6b4226");
    rr(e.x - 10, e.y - 26, 20, 12, 1.5, "#c99355");
    rect(e.x - 7, e.y - 23, 14, 1.2, "#6b4226"); rect(e.x - 7, e.y - 20, 10, 1.2, "#6b4226"); rect(e.x - 7, e.y - 17, 12, 1.2, "#6b4226");
    label("Lesson " + C.lessons[e.lesson].n, e.x, e.y - 33);
  }
  function drawNpc(e) {
    var bob = Math.sin(t * 2 + e.x) > 0.6 ? 1 : 0;
    drawChar(e.look, e.x, e.y, player.x >= e.x ? 1 : -1, bob);
    label(e.name, e.x, e.y + 7);
    var by = e.y - 30 + Math.sin(t * 4 + e.x) * 1.5;
    if (e.id === "guide") { circ(e.x, by, 5, "#ffcf4a"); mark("?", e.x, by, "#3a2a00"); }
    else if (state.done[e.quest]) { circ(e.x, by, 4.5, "#62e08f"); mark("✓", e.x, by, "#0f3a22"); }
    else { circ(e.x, by, 5.5, "#ffcf4a"); mark("!", e.x, by, "#3a2a00"); }
  }
  function mark(ch, x, y, color) {
    ctx.font = "700 8px " + FONT; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillStyle = color; ctx.fillText(ch, x, y + 0.6);
  }
  function drawBoss(e) {
    var q = C.quests[e.quest], x = e.x, y = e.y;
    if (state.done[e.quest]) {
      rr(x - 9, y - 8, 18, 8, 1.5, "#6b6694"); rect(x - 2, y - 16, 4, 8, "#8a86b4");
      star(x, y - 26 + Math.sin(t * 2) * 1.5, 9, "#ffcf4a");
      label(q.speaker + " ✓", x, y - 44, "#62e08f");
      return;
    }
    var asleep = questsLeft(curMap()) > 0;
    ctx.save();
    if (e.hit > 0) { ctx.translate(Math.sin(t * 70) * 2.5, 0); if (Math.floor(t * 24) % 2) ctx.globalAlpha = 0.45; }
    else if (asleep) ctx.globalAlpha = 0.7;
    if (q.boss === "bot") drawBot(x, y, asleep);
    else if (q.boss === "chain") drawChain(x, y, asleep);
    else drawScroll(x, y, asleep);
    ctx.restore();
    label(asleep ? q.speaker + " · help the locals first" : q.speaker, x, y - 66, asleep ? "#bdb9ea" : "#ff7f90");
  }
  function drawBot(x, y, asleep) {
    y += Math.sin(t * 2) * 1.5 - 5;
    tri(x - 4, y - 4, x, y + 3 + Math.sin(t * 20) * 1.5, x + 4, y - 4, "#ffcf4a");
    rr(x - 10, y - 11, 20, 7, 2, "#6f83a8");
    rect(x - 22, y - 30, 5, 13, "#6f83a8"); rect(x + 17, y - 30, 5, 13, "#6f83a8");
    rr(x - 17, y - 42, 34, 32, 4, "#8fa3c8");
    rr(x - 13, y - 38, 26, 17, 2, "#1b1a3a");
    var eye = asleep ? "#6f83a8" : "#ffcf4a", blink = Math.sin(t * 1.3) > 0.96;
    rect(x - 9, y - 33, 6, blink || asleep ? 1.5 : 6, eye); rect(x + 3, y - 33, 6, blink || asleep ? 1.5 : 6, eye);
    rect(x - 6, y - 25, 12, 1.5, eye);
    rect(x - 1, y - 49, 2, 7, "#6f83a8");
    circ(x, y - 51, 2.6, Math.sin(t * 5) > 0 && !asleep ? "#ff7f90" : "#ffcf4a");
    rr(x - 9, y - 19, 18, 6, 1.5, "#c9d4ea");
    ctx.font = "700 4.5px " + FONT; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillStyle = "#3b4a8f"; ctx.fillText("BOT?", x, y - 15.8);
  }
  function drawChain(x, y, asleep) {
    ctx.lineWidth = 3;
    for (var i = 0; i < 5; i++) {
      var lx = x + (i - 2) * 9 + Math.sin(t * 1.6 + i * 1.3) * (asleep ? 0.5 : 2.5);
      var ly = y - 16 - (i % 2) * 11 - Math.abs(Math.sin(t * 2 + i * 0.9)) * (asleep ? 1 : 8);
      ctx.strokeStyle = i % 2 ? "#9aa3c0" : "#c6cde4";
      ctx.beginPath(); ctx.ellipse(lx, ly, 8, 5.5, i % 2 ? 0.8 : -0.6, 0, Math.PI * 2); ctx.stroke();
      if (i === 2) {
        rect(lx - 4, ly - 2, 2.5, asleep ? 1 : 3, "#ff7f90"); rect(lx + 1.5, ly - 2, 2.5, asleep ? 1 : 3, "#ff7f90");
      }
    }
  }
  function drawScroll(x, y, asleep) {
    y += Math.sin(t * 1.8) * 1.2 - 2;
    rr(x - 15, y - 48, 30, 44, 2, "#f3e7c4");
    rr(x - 18, y - 52, 36, 7, 3.5, "#d9c48f"); rr(x - 18, y - 8, 36, 7, 3.5, "#d9c48f");
    for (var i = 0; i < 4; i++) rect(x - 10, y - 26 + i * 4.5, 20 - (i % 2) * 6, 1.3, "#d6c598");
    rect(x - 7, y - 40, 4, asleep ? 1.2 : 5, "#3a2f5c"); rect(x + 3, y - 40, 4, asleep ? 1.2 : 5, "#3a2f5c");
    rect(x - 4, y - 32, 8, 1.5, "#3a2f5c");
  }

  function drawPet() {
    var st = petStage(), mood = petMood(), x = pet.x, y = pet.y;
    var hopY = pet.hop > 0 ? Math.abs(Math.sin(pet.hop * 10)) * 7 : 0;
    if (st === 0) {
      ctx.save(); ctx.translate(x, y - hopY); ctx.rotate(Math.sin(t * 4) * 0.1);
      oval(0, -7, 5.5, 7, "#fff6dc");
      circ(-2, -9, 1.3, "#5fd6c4"); circ(2.5, -5.5, 1.1, "#5fd6c4"); circ(0.5, -11.5, 0.9, "#ffcf4a");
      ctx.restore();
      return;
    }
    var r = [0, 4.5, 5.5, 6, 6.5][st];
    var bodyCol = mood === "sulky" ? "#8fb3b0" : "#5fd6c4";
    var bob = mood === "happy" ? Math.abs(Math.sin(t * 6)) * 2 : mood === "sulky" ? 0 : Math.abs(Math.sin(t * 3)) * 0.8;
    var hover = st >= 3 ? 5 + Math.sin(t * 3) * 1.2 : 0;
    var cy = y - r - bob - hover - hopY, f = pet.face;
    if (st === 4) { ctx.globalAlpha = 0.25 + 0.1 * Math.sin(t * 3); circ(x, cy, r + 4, "#ffcf4a"); ctx.globalAlpha = 1; }
    if (st >= 3) {
      var flap = Math.sin(t * 14) * 2;
      tri(x - r + 1, cy - 1, x - r - 6, cy - 5 + flap, x - r - 1, cy + 3, "#d9fff6");
      tri(x + r - 1, cy - 1, x + r + 6, cy - 5 + flap, x + r + 1, cy + 3, "#d9fff6");
    }
    if (st >= 2) { tri(x - r + 1, cy - r + 2, x - r - 1, cy - r - 4, x - 1, cy - r + 1, "#3fa89a"); tri(x + r - 1, cy - r + 2, x + r + 1, cy - r - 4, x + 1, cy - r + 1, "#3fa89a"); }
    if (!hover) { rect(x - 3.5, y - 1.5 - hopY - bob, 2.5, 1.5, "#3fa89a"); rect(x + 1, y - 1.5 - hopY - bob, 2.5, 1.5, "#3fa89a"); }
    circ(x, cy, r, bodyCol);
    oval(x + f * 0.8, cy + r * 0.35, r * 0.6, r * 0.45, "#d9fff6");
    if (st === 1) { ctx.fillStyle = "#fff6dc"; ctx.beginPath(); ctx.arc(x, cy - 1, r + 0.6, Math.PI * 1.08, Math.PI * 1.92); ctx.closePath(); ctx.fill(); }
    // the "why" curl on its head
    ctx.strokeStyle = "#ffcf4a"; ctx.lineWidth = 1.2; ctx.beginPath();
    ctx.moveTo(x, cy - r); ctx.lineTo(x, cy - r - 2);
    ctx.arc(x + 1.6, cy - r - 3.4, 1.9, Math.PI * 0.75, Math.PI * 2.2); ctx.stroke();
    if (st === 4) star(x + 1.6, cy - r - 9, 2.6, "#ffcf4a");
    // eyes
    var ex = x + f * 1.4, ey = cy - 0.8;
    ctx.strokeStyle = "#17163a"; ctx.lineWidth = 1;
    if (mood === "happy") {
      ctx.beginPath(); ctx.arc(ex - 2, ey + 0.6, 1.2, Math.PI, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(ex + 2, ey + 0.6, 1.2, Math.PI, Math.PI * 2); ctx.stroke();
    } else if (mood === "sulky" || Math.sin(t * 1.7 + 1) > 0.97) {
      rect(ex - 3, ey, 2.2, 0.9, "#17163a"); rect(ex + 0.8, ey, 2.2, 0.9, "#17163a");
    } else { rect(ex - 2.8, ey - 1, 1.6, 2.2, "#17163a"); rect(ex + 1.2, ey - 1, 1.6, 2.2, "#17163a"); }
    if (pet.bubble) label(pet.bubble.text, x, cy - r - 12, pet.bubble.text === "♥" ? "#ff7f90" : "#17163a", pet.bubble.text === "♥" ? null : "#ffffff");
  }

  /* ---------- camera and frame ---------- */
  function camTarget() {
    var m = curMap(), visW = VW, focus = player.x, panel = run && sideMode;
    if (panel) { visW = VW * 0.54; if (run.ent) focus = (player.x + run.ent.x) / 2; }
    if (!panel && m.width <= VW) return (m.width - VW) / 2;
    return clamp(focus - visW / 2, 0, Math.max(0, m.width - visW));
  }
  function resize() {
    var w = stage.clientWidth, h = stage.clientHeight;
    if (!w || !h) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    sideMode = w >= 640 && w >= h * 1.25;
    stage.classList.toggle("side", sideMode);
    scale = Math.min(h / VH, w / 200);
    VW = w / scale; offY = h / scale - VH;
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    stage.style.setProperty("--band", Math.round((VH - GY + 70) * scale) + "px");
    camX = camTarget();
  }

  function update(dt) {
    t += dt;
    var m = curMap(), busy = isBusy();
    if (!busy) {
      var ax = (E.input.right ? 1 : 0) - (E.input.left ? 1 : 0);
      player.vx = ax * WALK;
      if (ax) player.face = ax;
      if (E.input.jump && player.onGround) { player.vy = JUMP; player.onGround = false; E.sfx("jump"); }
      if (E.input.act) interact();
    } else player.vx = 0;
    E.input.jump = false; E.input.act = false;

    var prevY = player.y;
    player.vy += GRAV * dt;
    player.x = clamp(player.x + player.vx * dt, 8, m.width - 8);
    player.y += player.vy * dt;
    player.onGround = false;
    if (player.vy >= 0) {
      m.platforms.forEach(function (p) {
        if (player.x > p.x - 3 && player.x < p.x + p.w + 3 && prevY <= p.y + 0.01 && player.y >= p.y) {
          player.y = p.y; player.vy = 0; player.onGround = true;
        }
      });
      if (player.y >= GY) { player.y = GY; player.vy = 0; player.onGround = true; }
    }
    if (player.vx && player.onGround) player.walkT += dt; else player.walkT = 0;
    if (player.hurt > 0) player.hurt -= dt;

    // pet follows the player's recent path
    trail.push({ t: t, x: player.x, y: player.y });
    while (trail.length > 2 && trail[1].t < t - 0.3) trail.shift();
    var s = trail[0], sulky = petMood() === "sulky";
    pet.off += (-player.face * 15 - pet.off) * Math.min(1, dt * 4);
    var tx = s.x + pet.off;
    if (Math.abs(tx - pet.x) > 0.6) pet.face = tx > pet.x ? 1 : -1; else pet.face = player.face;
    pet.x += (tx - pet.x) * Math.min(1, dt * (sulky ? 3 : 10));
    pet.y += (s.y - pet.y) * Math.min(1, dt * (sulky ? 6 : 14));
    if (pet.hop > 0) pet.hop -= dt;
    if (pet.bubble && (pet.bubble.life -= dt) <= 0) pet.bubble = null;
    if (!busy && petStage() > 0 && (pet.nextWhy -= dt) <= 0) {
      pet.nextWhy = 9 + Math.random() * 8;
      pet.bubble = { text: sulky ? "…" : "why?", life: 1.6 };
    }

    m.ents.forEach(function (e) { if (e.hit > 0) e.hit -= dt; });
    particles.forEach(function (p) { p.life -= dt; p.vy += 260 * dt; p.x += p.vx * dt; p.y += p.vy * dt; });
    particles = particles.filter(function (p) { return p.life > 0; });
    floats.forEach(function (f) { f.life -= dt; f.y -= 18 * dt; });
    floats = floats.filter(function (f) { return f.life > 0; });
    if (fade > 0) fade = Math.max(0, fade - dt * 2.2);

    // nearest thing to interact with
    var best = null, bd = 24;
    if (!busy) m.ents.forEach(function (e) {
      if (e.y == null) e.y = GY;
      if (e.type === "portal" && e.hideLocked && isLocked(e)) return;
      var d = Math.abs(e.x - player.x);
      if (d < bd && Math.abs(e.y - player.y) < 22) { bd = d; best = e; }
    });
    near = best;
    var key = best ? promptText(best) : "";
    if (key !== promptKey) {
      promptKey = key;
      var pb = $("prompt");
      pb.hidden = !key;
      pb.textContent = key + (key && !document.body.classList.contains("touch") ? "  ·  E" : "");
    }
    camX += (camTarget() - camX) * Math.min(1, dt * 8);
  }

  function draw() {
    var m = curMap(), th = THEMES[m.theme], k = scale * dpr;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    var g = ctx.createLinearGradient(0, 0, 0, cv.height);
    g.addColorStop(0, th.sky[0]); g.addColorStop(1, th.sky[1]);
    ctx.fillStyle = g; ctx.fillRect(0, 0, cv.width, cv.height);
    ctx.setTransform(k, 0, 0, k, 0, offY * k);
    ctx.imageSmoothingEnabled = false;

    circ(VW * 0.8, 26, 11, th.sun);
    for (var i = 0; i < 5; i++) {
      var cxp = ((i * 97 + t * (2 + i) - camX * 0.08) % (VW + 90) + (VW + 90)) % (VW + 90) - 45, cyp = 14 + (i * 23) % 42;
      ctx.globalAlpha = 0.85; oval(cxp, cyp, 14, 4.5, th.cloud); oval(cxp + 7, cyp - 3, 8, 4, th.cloud); ctx.globalAlpha = 1;
    }
    hills(th.hill2, 0.12, 86, 13, 0.017);
    hills(th.hill, 0.25, 102, 9, 0.026);

    var cx = Math.round(camX * k) / k;
    ctx.translate(-cx, 0);
    decoFor(state.map).forEach(function (d) { if (d.x > cx - 60 && d.x < cx + VW + 60) drawDeco(m.theme, d); });

    var x0 = cx - 4, wd = VW + 8;
    rect(x0, GY, wd, 3, th.grassTop); rect(x0, GY + 3, wd, 3, th.grass); rect(x0, GY + 6, wd, VH - GY, th.dirt);
    for (var wx = Math.floor(x0 / 14) * 14; wx < x0 + wd; wx += 14) {
      var h1 = E.hash(wx * 0.37);
      if (h1 > 0.45) rect(wx + h1 * 8, GY + 10 + E.hash(wx * 0.91) * 14, 3, 2, th.dirt2);
    }
    m.platforms.forEach(function (p) {
      rect(p.x, p.y, p.w, 3, th.grassTop); rect(p.x, p.y + 3, p.w, 2, th.grass);
      rect(p.x + 2, p.y + 5, p.w - 4, 4, th.dirt); rect(p.x + 7, p.y + 9, p.w - 14, 3, th.dirt2);
    });

    m.ents.forEach(function (e) {
      if (e.y == null) e.y = GY;
      if (e.x < cx - 60 || e.x > cx + VW + 60) return;
      if (e.type === "portal") drawPortal(e);
      else if (e.type === "sign") drawSign(e);
      else if (e.type === "npc") drawNpc(e);
      else if (e.type === "boss") drawBoss(e);
    });

    drawPet();
    if (!(player.hurt > 0 && Math.floor(t * 20) % 2)) {
      var frame = !player.onGround ? 1 : (player.vx ? Math.floor(player.walkT * 9) % 2 : 0);
      drawChar("player", player.x, player.y, player.face, frame);
    }
    particles.forEach(function (p) { ctx.globalAlpha = Math.min(1, p.life * 2); rect(p.x, p.y, 2, 2, p.color); });
    ctx.globalAlpha = 1;
    floats.forEach(function (f) {
      ctx.globalAlpha = Math.min(1, f.life * 2);
      ctx.font = "700 7px " + FONT; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillStyle = "#17163a"; ctx.fillText(f.text, f.x + 0.6, f.y + 0.6);
      ctx.fillStyle = f.color; ctx.fillText(f.text, f.x, f.y);
    });
    ctx.globalAlpha = 1;
    if (fade > 0) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = fade; ctx.fillStyle = "#17163a"; ctx.fillRect(0, 0, cv.width, cv.height); ctx.globalAlpha = 1;
    }
  }

  var lastTs = 0;
  function frame(ts) {
    var dt = Math.min(0.034, (ts - lastTs) / 1000 || 0.016);
    lastTs = ts;
    update(dt); draw();
    requestAnimationFrame(frame);
  }

  /* ---------- wiring ---------- */
  window.addEventListener("keydown", function (ev) {
    E.unlock();
    var k = ev.key, tg = ev.target;
    var onCtl = !!tg && (tg.tagName === "BUTTON" || tg.tagName === "A");
    var confirmKey = k === "Enter" || k === " ";
    if (!$("title").hidden) {
      if (confirmKey && !onCtl) { ev.preventDefault(); startGame(); }
      return;
    }
    if (!$("log").hidden || !$("cert").hidden) {
      if (k === "Escape") closeOverlays();
      return;
    }
    if (run) {
      if (k === "Escape") { closeDialog(); return; }
      if (ev.repeat) return;
      if (/^[1-9]$/.test(k) && run.pick) { ev.preventDefault(); run.pick(+k - 1); return; }
      if (confirmKey && onCtl) return;                       // the focused control's own click handles it
      if ((confirmKey || k === "e" || k === "E") && run.primary) { ev.preventDefault(); run.primary(); }
      return;
    }
    var a = E.KEYMAP[k];
    if (!a) return;
    if (confirmKey && onCtl) return;
    ev.preventDefault();
    if (a === "left" || a === "right") E.input[a] = true;
    else if (!ev.repeat) E.input[a] = true;
  });
  window.addEventListener("keyup", function (ev) {
    var a = E.KEYMAP[ev.key];
    if (a === "left" || a === "right") E.input[a] = false;
  });
  window.addEventListener("blur", releaseInput);

  function hudClick(id, fn) { $(id).addEventListener("click", function () { E.unlock(); this.blur(); fn(); }); }
  hudClick("btnLog", function () { if (isBusy()) return; renderLog(); $("log").hidden = false; setBusy(); });
  hudClick("btnPet", openPet);
  hudClick("btnMute", function () { state.muted = !state.muted; E.setMuted(state.muted); E.save(state); updateHud(); if (!state.muted) E.sfx("talk"); });
  hudClick("prompt", function () { if (!isBusy()) interact(); });
  $("dlgClose").addEventListener("click", closeDialog);
  $("logClose").addEventListener("click", closeOverlays);
  $("certClose").addEventListener("click", closeOverlays);
  $("btnStart").addEventListener("click", startGame);
  armTwice($("btnFresh"), "Erase and restart? Tap again", function () { resetAll(); refreshTitle(); startGame(); });
  armTwice($("btnReset"), "Erase everything? Tap again", function () { resetAll(); closeOverlays(); $("title").hidden = false; refreshTitle(); setBusy(); });

  cv.addEventListener("pointerdown", function (ev) {
    E.unlock();
    if (isBusy()) return;
    var r = cv.getBoundingClientRect();
    var wx = (ev.clientX - r.left) / scale + camX, wy = (ev.clientY - r.top) / scale - offY;
    if (Math.abs(wx - pet.x) < 13 && Math.abs(wy - (pet.y - 9)) < 16) openPet();
  });

  function refreshTitle() {
    var progress = state.started && (anyQuestDone() || state.exp > 0);
    $("btnStart").textContent = progress ? "Continue" : "Start the quest";
    $("btnFresh").hidden = !progress;
  }

  if ((window.matchMedia && window.matchMedia("(pointer: coarse)").matches)) document.body.classList.add("touch");
  window.addEventListener("touchstart", function () { document.body.classList.add("touch"); }, { passive: true, once: true });
  E.bindPad($("pad"));

  if (window.ResizeObserver) new ResizeObserver(resize).observe(stage);
  window.addEventListener("resize", resize);
  if (document.fonts && document.fonts.load) { try { document.fonts.load("600 12px " + FONT); } catch (e) { /* ignore */ } }

  resize(); placePlayer(null); refreshTitle(); updateHud(); setBusy();
  requestAnimationFrame(frame);

  /* test hook: read-only view of the game for automated checks */
  window.PQ_DEBUG = {
    get state() { return state; }, get player() { return player; }, get run() { return run; }, get near() { return near; },
    petStage: petStage, petMood: petMood,
    step: function (frames) { for (var i = 0; i < frames; i++) update(1 / 60); draw(); },
    view: function () { return { VW: VW, scale: scale, offY: offY, camX: camX, side: sideMode }; }
  };
})();
