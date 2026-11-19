/* Product Thinking course — reusable lesson components.
   Exposes window.PT = { classifyQuiz, solutionWords, findSolutionWords, reframeCheck,
   orderChain, fourCsCheck, renderChecks }.
   No dependencies. */
(function () {
  "use strict";

  // Words that usually mean a statement names something to build or buy.
  // "system" and "site" are left out: the lessons treat them as fine when they describe
  // the obstacle or cause ("the two record systems don't share data"). Proposing one
  // ("build a new system") is caught by SOLUTION_PHRASE instead.
  var SOLUTION_WORDS = [
    "app", "apps", "ai", "chatbot", "bot", "bots", "dashboard", "portal", "platform",
    "crm", "website", "tool", "tools", "software", "superapp",
    "automation", "automate", "cloud", "database", "api", "llm", "gpt", "whatsapp",
    "integration", "upgrade", "migrate", "migration", "digitalise", "digitalize", "feature",
    "features", "solution", "module"
  ];
  var SOLUTION_PHRASE = /\b(?:new|build|buy|implement|introduce|replace)\s+(?:(?:a|an|the|our)\s+)?(?:[a-z-]+\s+){0,2}(?:systems?|sites?)\b/g;

  function findSolutionWords(text) {
    var lower = (text || "").toLowerCase();
    var words = lower.match(/[a-z]+/g) || [];
    var hits = [];
    words.forEach(function (w) {
      if (SOLUTION_WORDS.indexOf(w) !== -1 && hits.indexOf(w) === -1) hits.push(w);
    });
    (lower.match(SOLUTION_PHRASE) || []).forEach(function (p) {
      if (hits.indexOf(p) === -1) hits.push(p);
    });
    return hits;
  }

  function el(tag, attrs, text) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    if (text != null) n.textContent = text;
    return n;
  }

  /* Classification quiz.
     mount: element. opts: { labels: [a, b], items: [{ text, answer: 0|1, why }] }
     Labels should have the same word and character count so they give no hints. */
  function classifyQuiz(mount, opts) {
    var answered = 0, correct = 0;
    var score = el("p", { class: "score", "aria-live": "polite" });
    function updateScore() {
      score.textContent = answered === 0
        ? opts.items.length + " statements. Pick one label for each."
        : correct + " of " + answered + " right so far (" + opts.items.length + " total).";
    }
    opts.items.forEach(function (item, i) {
      var box = el("div", { class: "cq-item" });
      box.appendChild(el("p", { class: "cq-stmt" }, item.text));
      var row = el("div", { class: "cq-choices", role: "group", "aria-label": "Statement " + (i + 1) });
      var fb = el("div", { "aria-live": "polite" });
      var buttons = opts.labels.map(function (label, idx) {
        var b = el("button", { type: "button", class: "btn", id: "cq-" + mount.id + "-" + i + "-" + idx }, label);
        b.addEventListener("click", function () {
          buttons.forEach(function (x) { x.disabled = true; });
          b.classList.add("picked");
          var ok = idx === item.answer;
          answered++; if (ok) correct++;
          fb.className = "feedback " + (ok ? "right" : "wrong");
          fb.innerHTML = "";
          fb.appendChild(el("b", null, (ok ? "Right. " : "Not quite. It's “" + opts.labels[item.answer] + ".” ")));
          fb.appendChild(document.createTextNode(item.why));
          updateScore();
        });
        row.appendChild(b);
        return b;
      });
      box.appendChild(row);
      box.appendChild(fb);
      mount.appendChild(box);
    });
    updateScore();
    mount.appendChild(score);
  }

  /* Reframe check: given {who, goal, obstacle} strings, return a list of
     { ok, text } checks for instant feedback. */
  function reframeCheck(f) {
    var checks = [];
    var who = (f.who || "").trim(), goal = (f.goal || "").trim(), obs = (f.obstacle || "").trim();
    checks.push({ ok: who.split(/\s+/).length >= 2, text: "Names a specific group of people, not just “users” or “the public”." });
    if (/^(users?|the public|everyone|citizens|people)\.?$/i.test(who)) checks[0].ok = false;
    checks.push({ ok: goal.length >= 10, text: "Says what they are trying to get done." });
    checks.push({ ok: obs.length >= 10, text: "Describes what gets in their way." });
    var hits = findSolutionWords(who + " " + goal + " " + obs);
    checks.push({
      ok: hits.length === 0,
      text: hits.length === 0
        ? "Mentions no technology or product. It is a problem, not a solution."
        : "Mentions a solution word (" + hits.join(", ") + "). Rewrite without naming what to build.",
      hits: hits
    });
    checks.push({ ok: /\d/.test(who + goal + obs), text: "Bonus: includes a number (how many, how long, how often). This becomes evidence later." , bonus: true });
    return checks;
  }

  /* Order-the-chain exercise. The learner moves cards up and down, then checks.
     mount: element. opts: { top, bottom, correct: [strings in correct order],
     start: [indexes into correct, the scrambled starting order], explain } */
  function orderChain(mount, opts) {
    var order = opts.start.slice();
    var list = el("ol", { class: "chain" });
    var fb = el("div", { "aria-live": "polite" });
    var ends = el("p", { class: "chain-end" }, opts.top);
    function render(focusIdx, dir) {
      list.innerHTML = "";
      order.forEach(function (ci, pos) {
        var li = el("li", { class: "chain-item" });
        li.appendChild(el("span", { class: "chain-text" }, opts.correct[ci]));
        var ctr = el("span", { class: "chain-ctrls" });
        var up = el("button", { type: "button", class: "mini", "aria-label": "Move up: " + opts.correct[ci] }, "↑");
        var dn = el("button", { type: "button", class: "mini", "aria-label": "Move down: " + opts.correct[ci] }, "↓");
        up.disabled = pos === 0; dn.disabled = pos === order.length - 1;
        up.addEventListener("click", function () { swap(pos, pos - 1); render(pos - 1, "up"); });
        dn.addEventListener("click", function () { swap(pos, pos + 1); render(pos + 1, "dn"); });
        ctr.appendChild(up); ctr.appendChild(dn); li.appendChild(ctr);
        list.appendChild(li);
        if (focusIdx === pos) setTimeout(function () { (dir === "up" && !up.disabled ? up : dn.disabled ? up : dn).focus(); }, 0);
      });
      fb.className = ""; fb.textContent = "";
    }
    function swap(a, b) { var t = order[a]; order[a] = order[b]; order[b] = t; }
    var check = el("button", { type: "button", class: "btn primary" }, "Check the order");
    check.addEventListener("click", function () {
      var wrong = 0;
      order.forEach(function (ci, pos) {
        var ok = ci === pos;
        list.children[pos].classList.toggle("ok", ok);
        list.children[pos].classList.toggle("bad", !ok);
        if (!ok) wrong++;
      });
      fb.className = "feedback " + (wrong ? "wrong" : "right");
      fb.innerHTML = "";
      fb.appendChild(el("b", null, wrong ? wrong + " out of place. " : "Right. "));
      fb.appendChild(document.createTextNode(wrong
        ? "Read it from the top as “…why? Because…”. Each line should explain the one above it."
        : opts.explain));
    });
    mount.appendChild(ends);
    mount.appendChild(list);
    mount.appendChild(el("p", { class: "chain-end" }, opts.bottom));
    mount.appendChild(check);
    mount.appendChild(fb);
    render();
  }

  /* A Cause should give a reason, not restate the symptom. These phrases mark an explanation
     ("because…", "was set up when…"); common words like "only" or "never" do not, since a
     symptom such as "can only be booked by phone" uses them too. */
  var CAUSE_MARKER = /\b(?:because|since|due to|as a result|so that|lack of|no one|nobody|(?:was|were|is|are|has been|have been)\s+(?:originally\s+|never\s+|only\s+)?(?:built|set up|designed|written|copied|made|created|set|planned|chosen|based))\b/i;

  /* 4Cs draft check. f = { clarity, consequence, cause, confirmation }. */
  function fourCsCheck(f) {
    var get = function (k) { return (f[k] || "").trim(); };
    var all = ["clarity", "consequence", "cause", "confirmation"].map(get).join(" ");
    var hits = findSolutionWords(all);
    return [
      { ok: get("clarity").split(/\s+/).length >= 8, text: "Clarity says who is affected, what they’re trying to do and what’s broken." },
      { ok: /\d/.test(get("clarity")), text: "Clarity shows how badly it’s broken, with a number (how long, how often or how many)." },
      { ok: get("consequence").split(/\s+/).length >= 6, text: "Consequence says what happens if nobody solves it." },
      { ok: CAUSE_MARKER.test(get("cause")),
        text: "Cause gives a reason the problem exists (ideally where your Five Whys landed), not a restatement of the symptom." },
      { ok: /\d/.test(get("confirmation")), text: "Confirmation cites evidence: a figure, a source or a count." },
      { ok: hits.length === 0, text: hits.length === 0
          ? "No solution has crept in. All four fields describe the problem."
          : "A solution has crept in (" + hits.join(", ") + "). Take it out. Solutions come after the statement." }
    ];
  }

  function renderChecks(ul, checks) {
    ul.innerHTML = "";
    checks.forEach(function (c) {
      var li = el("li", null, c.text);
      li.className = c.ok ? "pass" : (c.bonus ? "" : "fail");
      if (!c.ok && c.bonus) li.style.paddingLeft = "1.4rem";
      ul.appendChild(li);
    });
    return checks.filter(function (c) { return !c.bonus; }).every(function (c) { return c.ok; });
  }

  window.PT = { classifyQuiz: classifyQuiz, solutionWords: SOLUTION_WORDS, findSolutionWords: findSolutionWords,
    reframeCheck: reframeCheck, orderChain: orderChain, fourCsCheck: fourCsCheck, renderChecks: renderChecks };
})();
