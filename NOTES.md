# Notes

- 2026-11-19: Learner asked for lessons to be published as artifacts ("public artifact"). Publish each lesson as a claude.ai artifact as well as saving it to ./lessons/. Artifacts start private; the learner shares them from the artifact page.
- Published lessons: see build/published.json, which maps each lesson file to its artifact URL. To publish, run `python scripts/build_artifacts.py`. It writes single-file copies to build/, with CSS and JS inlined and links between lessons rewritten to artifact URLs. Then publish each build/<name>.html with its `url` (or with no url for a new lesson), add the new URL to published.json, and rebuild/republish so the cross-links resolve.
- 2026-11-19: Learner asked to go straight on to lessons 2 and 3 without reporting results from lesson 1, so there is no evidence of mastery yet. Ask how the practice went before writing lesson 4.
- Lessons 1 to 3 share a running clinic-booking scenario (WhatsApp bot request → reframe → 4Cs). Lesson 4 (Metrics) can continue it: what outcome would show the clinic booking problem is solved?
- Follow IDG's module order: Understanding the Problem, then the Five Whys, then the 4Cs, then Metrics, Assumptions and Risks, and Customer Experience.
- Example scenarios in lessons should be set in a workplace / public-sector context to match the mission.
