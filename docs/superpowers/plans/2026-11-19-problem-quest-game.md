# Problem Quest Implementation Plan

**Goal:** Build the Problem Quest side-scrolling RPG from the approved design and publish it as an artifact.

**Architecture:** A static page. A canvas draws the world (pixel art made in code); DOM overlays carry all readable text (dialogue, quests, HUD) so lesson sentences stay crisp. All lesson text and map layout live in one data file; a small build script inlines everything into one HTML file for publishing.

**Tech Stack:** HTML, CSS, vanilla JavaScript, Canvas 2D, Web Audio, localStorage. Python 3 for the build script. No libraries.

**Spec:** `docs/superpowers/specs/2026-11-19-problem-quest-game-design.md`

**Execution:** done in this session, since the owner approved the design and said to go ahead.

## Global Constraints
- Code lives in `product-thinking-app/`.
- Original name, characters and art.
- No typing in quests; every answer shows the lesson's explanation.
- Keyboard and touch both work; page never scrolls sideways at 400px wide.
- Game works with storage unavailable.

## Review Focus
- Storage blocked or holding an old/corrupt save: game still starts at the camp.
- Portrait phone: dialogue fits, options are tappable, pad does not cover the dialogue.
- Key that opens a dialogue must not also answer it.
- Leaving a quest midway and re-entering starts it cleanly.
- Sound must not start before the first tap or key press.

## Tasks
1. **Content** (`content.js`, `test/content.test.js`): quests, bosses, maps, lesson links. Test: every quest referenced by a map exists, every `answer` index is in range, every item has a `why`.
2. **Engine** (`engine.js`): save/load, sound effects, keyboard and touch input, sprite builder.
3. **Game** (`game.js`, `index.html`, `style.css`): maps, movement, NPCs, portals, dialogue and quest runner, three bosses, HUD, quest log, certificate.
4. **Build** (`build.py`): inline CSS and JS into `dist/problem-quest.html` in the artifact's fragment form.
5. **Verify**: run the content test; play through in the browser at desktop and phone size.
6. **Publish** `dist/problem-quest.html` as an artifact.
