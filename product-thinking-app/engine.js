/* Problem Quest engine: save, sound, input, sprite builder. */
window.PQ = (function () {
  "use strict";

  /* ---------- save (works without storage) ---------- */
  var SAVE_KEY = "problem-quest-v1";
  function load(defaults) {
    var state = JSON.parse(JSON.stringify(defaults));
    try {
      var raw = JSON.parse(localStorage.getItem(SAVE_KEY) || "null");
      if (raw && raw.v === 1) {
        Object.keys(defaults).forEach(function (k) {
          if (typeof raw[k] === typeof defaults[k] && raw[k] !== null) state[k] = raw[k];
        });
      }
    } catch (e) { /* storage blocked or corrupt: start fresh */ }
    return state;
  }
  function save(state) {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(Object.assign({ v: 1 }, state))); } catch (e) { /* ignore */ }
  }

  /* ---------- sound ---------- */
  var actx = null, muted = false;
  function unlock() {
    if (actx) { if (actx.state === "suspended") actx.resume(); return; }
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try { actx = new AC(); } catch (e) { actx = null; }
  }
  function tone(freq, dur, type, vol, slide, delay) {
    if (!actx || muted) return;
    var t = actx.currentTime + (delay || 0);
    var o = actx.createOscillator(), g = actx.createGain();
    o.type = type || "square";
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
    g.gain.setValueAtTime(vol || 0.06, t);
    g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    o.connect(g); g.connect(actx.destination);
    o.start(t); o.stop(t + dur + 0.03);
  }
  var SFX = {
    jump: function () { tone(360, 0.1, "square", 0.04, 640); },
    talk: function () { tone(520, 0.05, "triangle", 0.06); },
    right: function () { tone(660, 0.09, "triangle", 0.09); tone(990, 0.14, "triangle", 0.09, null, 0.08); },
    wrong: function () { tone(210, 0.22, "sawtooth", 0.05, 110); },
    hit: function () { tone(170, 0.14, "square", 0.07, 60); tone(880, 0.1, "triangle", 0.07, null, 0.05); },
    portal: function () { tone(280, 0.35, "sine", 0.08, 920); },
    level: function () { [523, 659, 784, 1047].forEach(function (f, i) { tone(f, 0.14, "square", 0.05, null, i * 0.09); }); },
    win: function () { [523, 659, 784, 1047, 784, 1047, 1319].forEach(function (f, i) { tone(f, 0.16, "triangle", 0.08, null, i * 0.11); }); }
  };
  function sfx(name) { if (SFX[name]) SFX[name](); }

  /* ---------- input ---------- */
  var input = { left: false, right: false, jump: false, act: false };
  var KEYMAP = {
    ArrowLeft: "left", a: "left", A: "left",
    ArrowRight: "right", d: "right", D: "right",
    ArrowUp: "jump", w: "jump", W: "jump", " ": "jump",
    e: "act", E: "act", Enter: "act"
  };
  function bindPad(pad) {
    Array.prototype.forEach.call(pad.querySelectorAll("[data-key]"), function (btn) {
      var k = btn.getAttribute("data-key");
      var held = k === "left" || k === "right";
      function down(ev) { ev.preventDefault(); unlock(); input[k] = true; btn.classList.add("down"); }
      function up(ev) { ev.preventDefault(); if (held) input[k] = false; btn.classList.remove("down"); }
      btn.addEventListener("pointerdown", down);
      btn.addEventListener("pointerup", up);
      btn.addEventListener("pointercancel", up);
      btn.addEventListener("pointerleave", up);
      btn.addEventListener("contextmenu", function (ev) { ev.preventDefault(); });
    });
  }

  /* ---------- sprites: rows of letters + palette -> canvas ---------- */
  function sprite(rows, pal) {
    var c = document.createElement("canvas");
    c.width = rows[0].length; c.height = rows.length;
    var g = c.getContext("2d");
    rows.forEach(function (row, y) {
      for (var x = 0; x < row.length; x++) {
        var col = pal[row[x]];
        if (col) { g.fillStyle = col; g.fillRect(x, y, 1, 1); }
      }
    });
    return c;
  }

  /* deterministic pseudo-random in [0,1) from an integer */
  function hash(n) { var x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }

  return {
    load: load, save: save,
    unlock: unlock, sfx: sfx, setMuted: function (m) { muted = !!m; },
    input: input, KEYMAP: KEYMAP, bindPad: bindPad,
    sprite: sprite, hash: hash
  };
})();
