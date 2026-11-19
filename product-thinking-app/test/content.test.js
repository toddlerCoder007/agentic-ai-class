// Run with: node product-thinking-app/test/content.test.js
const assert = require("assert");
const C = require("../content.js");

let checked = 0;
for (const [mapId, map] of Object.entries(C.maps)) {
  const ids = [...map.quests, ...(map.bossQuest ? [map.bossQuest] : [])];
  for (const id of ids) assert.ok(C.quests[id], `${mapId}: quest ${id} is missing`);
  for (const e of map.ents) {
    if (e.quest) assert.ok(ids.includes(e.quest), `${mapId}: entity quest ${e.quest} not listed on the map`);
    if (e.to) assert.ok(C.maps[e.to], `${mapId}: portal to unknown map ${e.to}`);
    if (e.needs) assert.ok(C.quests[e.needs], `${mapId}: portal needs unknown quest ${e.needs}`);
    if (e.type === "sign") assert.ok(C.lessons[e.lesson], `${mapId}: sign has no lesson`);
    assert.ok(e.x > 0 && e.x < map.width, `${mapId}: entity outside the map`);
  }
  for (const id of ids) assert.ok(map.ents.some((e) => e.quest === id), `${mapId}: nobody gives quest ${id}`);
}

for (const [id, q] of Object.entries(C.quests)) {
  assert.ok(q.intro.length && q.outro.length && q.speaker && q.title, `${id}: missing text`);
  if (q.mode === "order") {
    assert.strictEqual(q.start.length, q.chain.length, `${id}: start order length`);
    assert.deepStrictEqual([...q.start].sort(), q.chain.map((_, i) => i), `${id}: start is not a permutation`);
    assert.notDeepStrictEqual(q.start, q.chain.map((_, i) => i), `${id}: chain starts already solved`);
    assert.ok(q.explain && q.top && q.wrongNote, `${id}: missing order text`);
    continue;
  }
  assert.ok(q.items.length > 0, `${id}: no items`);
  // Quick recall shows items away from their quest, so each quest says how they read on their own:
  // "standalone", or a one-line scenario shown above the question.
  assert.ok(typeof q.recall === "string" && q.recall.length > 0, `${id}: no recall setting`);
  assert.ok(q.items.some((it) => it.recall !== false), `${id}: nothing left for quick recall`);
  q.items.forEach((it, n) => {
    const opts = it.options || q.labels;
    assert.ok(opts && opts.length >= 2, `${id}[${n}]: no options`);
    assert.ok(Number.isInteger(it.answer) && it.answer >= 0 && it.answer < opts.length, `${id}[${n}]: answer out of range`);
    assert.ok(it.why, `${id}[${n}]: no explanation`);
    assert.ok(it.prompt || q.prompt, `${id}[${n}]: no prompt`);
    if (it.whyWrong) {
      assert.strictEqual(it.whyWrong.length, opts.length, `${id}[${n}]: whyWrong length`);
      assert.strictEqual(it.whyWrong[it.answer], null, `${id}[${n}]: whyWrong set for the right answer`);
    }
    checked++;
  });
}

// The best possible score must reach the top level.
let max = 0;
for (const q of Object.values(C.quests)) max += (q.mode === "order" ? q.chain.length : q.items.length) * 10 + (q.boss ? 60 : 20);
assert.ok(max >= C.levels[C.levels.length - 1].at, `top level unreachable: max ${max}`);

// Every pet stage must be reachable from quests that exist, in order.
assert.ok(!C.pet.stages[0].needs, "pet must start at its first stage");
C.pet.stages.slice(1).forEach((s, i) => {
  assert.ok(s.needs === "any" || (C.quests[s.needs] && C.quests[s.needs].boss), `pet stage ${i + 1} needs an unknown quest`);
});
for (const mood of ["egg", "happy", "ok", "sulky"]) assert.ok(C.pet.lines[mood], `pet line missing: ${mood}`);

console.log(`content ok: ${Object.keys(C.quests).length} quests, ${checked} choice items, max EXP ${max}`);
