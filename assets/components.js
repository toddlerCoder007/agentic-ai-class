/* Product Thinking course — reusable lesson components.
   Exposes window.PT = { classifyQuiz, solutionWords, findSolutionWords, reframeCheck }.
   No dependencies. */
(function () {
  "use strict";

  // Words that usually mean a statement names something to build or buy.
  var SOLUTION_WORDS = [
    "app", "apps", "ai", "chatbot", "bot", "bots", "dashboard", "portal", "platform",
    "system", "systems", "crm", "website", "site", "tool", "tools", "software", "superapp",
    "automation", "automate", "cloud", "database", "api", "llm", "gpt", "whatsapp",
    "integration", "upgrade", "migrate", "migration", "digitalise", "digitalize", "feature",
    "features", "solution", "module"
  ];

  function findSolutionWords(text) {
    var words = (text || "").toLowerCase().match(/[a-z]+/g) || [];
    var hits = [];
    words.forEach(function (w) {
      if (SOLUTION_WORDS.indexOf(w) !== -1 && hits.indexOf(w) === -1) hits.push(w);
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

  window.PT = { classifyQuiz: classifyQuiz, solutionWords: SOLUTION_WORDS, findSolutionWords: findSolutionWords, reframeCheck: reframeCheck };
})();
