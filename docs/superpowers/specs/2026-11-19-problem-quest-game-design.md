# Problem Quest: a side-scrolling RPG for the Product Thinking lessons

## Intent
Turn Lessons 1 to 3 (Solutions in Disguise, Start With the Whys, the 4Cs Problem Statement) into a fun game colleagues can play on desktop or phone, so they practise the three skills without reading the lesson pages first.

## Goals
- An original 2D side-scrolling RPG in the cute-pixel MMO genre (run, jump, platforms, portals, NPCs with quest bubbles, EXP and level-ups). Original name, characters and art; it does not copy any existing game.
- NPC quests carry the lesson content. Every answer shows the lesson's "why" explanation.
- Each lesson ends in a boss beaten by assembling an answer, with no typing.
- Works with keyboard and with on-screen touch buttons.
- Sound effects with a mute button, progress saved in the browser, signposts linking to the published lesson artifacts.
- Code lives in `product-thinking-app/`; published as a claude.ai artifact.

## Non-goals
- Lessons 4 onward, multiplayer, accounts, typed free-text answers, monster grinding.

## Anti-goals
- Action that drowns the learning: a player should not be able to finish without engaging with the content.
- Punishing wrong answers so hard that people quit. Wrong answers teach, then let you retry.

## Approaches considered
1. **Plain canvas + vanilla JS, pixel art drawn in code (chosen).** No dependencies, loads instantly, small enough for an artifact, full control of touch controls. Costs more hand-written code for physics and drawing.
2. **Phaser from a CDN.** Physics and scenes for free, but a large download, and artifact pages can only load from a few CDNs; more to go wrong for little gain at this size.
3. **DOM and CSS only.** Easiest text and layout, but jumping and scrolling feel stiff and it would not feel like a game.

## The game
**Hub and three maps**, joined by portals. A map unlocks when the previous boss is beaten.

| Map | Lesson | NPC quests | Boss (assembly) |
|---|---|---|---|
| Disguise Village | 1 | "Problem or solution?" calls from villagers (the 8 quiz items), the three questions, the four "what we hear" pairs | **The Bot Request**: pick the right who / goal / obstacle cards for the clinic WhatsApp-bot request, avoiding cards that name a solution |
| Whywood Forest | 2 | IDG grants chain walked as a dialogue, "fix this level or look elsewhere?" (the 6 screening items) | **The Tangled Chain**: put the five refund findings in order from symptom to root cause |
| Four-C Citadel | 3 | "Which C is this?" (the 8 licence-renewal items), which C says a problem isn't worth solving | **The Blank Statement**: slot clinic fact-sheet facts into Clarity, Consequence, Cause, Confirmation |

- **Player**: walks, jumps, talks (up arrow / Talk button at an NPC with a "!" bubble).
- **Quests**: a dialogue box with the NPC's line and answer buttons. Right answer: EXP and the explanation. Wrong: lose one heart, see the explanation, try again. Hearts refill at each map; running out just restarts that quest.
- **Bosses**: boss HP bar; each correct placement is a hit, each wrong one costs a heart and explains why.
- **Progression**: EXP, levels with a level-up flourish, a quest log, and a final "Problem Thinker" certificate screen with a recap of the three tools.
- **Intro**: a short how-to-play, since colleagues may not have seen the lessons.

## Virtual pet companion (added on request, builder's calls)
An original creature, the **Whyling**, follows the player. It adds a care loop in the virtual-pet genre without copying any branded toy.

- **Growth comes from the lessons.** Egg at the start; hatches after the first quest; grows once per boss beaten (Hatchling, Sprout, Fledgling, Wise Whyling). It never regresses.
- **Food comes from the lessons.** Each first-try right answer earns a berry (stock capped at 9). Feeding a berry raises Fullness.
- **Play is recall.** "Quick recall" asks one random question from quests already finished; a right answer raises Joy. No EXP, so it cannot be farmed.
- **Decay is per quest finished, never by the clock.** Fullness drops 2 and Joy drops 1 for each new quest completed. The worst state is "sulky" (it follows slowly). It cannot die.
- **Perk.** A full, happy Whyling gives one extra heart in quests.
- **Access.** Tap the pet in the world or use the Pet button in the top bar; no extra keys or pad buttons.
- Erasing progress resets the pet. It works with storage blocked.

## Builder's calls
- Files: `index.html`, `style.css`, `content.js` (all lesson text and answers), `engine.js` (loop, physics, input, audio, save), `game.js` (maps, NPCs, quests, bosses, drawing).
- Sound made with Web Audio; no audio files.
- Progress in `localStorage`, with the game fully working if storage is unavailable.
- Published privately by default; the owner switches sharing to public from the artifact's share menu.
