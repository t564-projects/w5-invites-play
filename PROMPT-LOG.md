# Prompt log

Each entry: the prompt as I sent it, a short description of what was built, and the commit that holds it. Newest at the bottom. "No commit" means the turn was a question or setup with nothing to commit on its own.

Each entry also lists the model and token usage for that prompt, read from the Claude Code session transcript. "New input" is what the model read fresh (including text written to the cache); "cached input" is earlier conversation re-read from the cache on every model call, so it is large and grows as the conversation does. Output tokens are what the model wrote, including tool calls.

## 1. Game ideas

> I need to create a game here. I really like games like jewel color sort, meowdoku, or bus traffic fever (that you sort of have something to think about). Now, I want to create a new version of it. Maybe something sports, surfing, hiking, something like that. Give me a few options of how can I sort of mix and match and what I can do

Model: Sonnet 5.5 (`claude-sonnet-5-5`). Tokens: 1,362 output, 16,613 new input, 22,857 cached input, over 1 model call.

Gave five concepts (Wave Queue, Trail Pack, Summit Seats, Chairlift Shuffle, Relay Handoff) and which mechanics each borrows from the three reference games. No commit.

## 2. Trail Pack with real treks

> I like the trail pack but maybe we can do something that relates to real famous trekkings so we have different backgrounds, and matching like how many days, size of backpack and stuff like that, can we do that?
>
> (sent while I was working) actually gimme multiple choice questions to make design decisions before you code the whole thing

Model: Sonnet 5.5 (`claude-sonnet-5-5`). Tokens: 35,256 output, 36,462 new input, 247,927 cached input, over 5 model calls.

Wrote a first `index.html` draft before the second message arrived, then asked the design questions. The answers: days set the sack size, the pack list is shown in early stages and only conditions later, a trek map for progression, and a polished mobile-first web game. A first answer showed "crates" was confusing, so I explained it as stuff sacks and asked again. Rebuilt `index.html` as a sorting game in the Jewel Color Sort style: five treks (Inca Trail, Tour du Mont Blanc, Torres del Paine, Kilimanjaro, Everest Base Camp), 14 stages, a trail map, sound, confetti and saved progress. Only syntax-checked; not played in a browser. Committed with entry 4.

## 3. Change direction to a Meowdoku-style placement game

> thats not really what I had in mind, it looks kind of terrible. maybe we should do something more around a meowdoku - where you have the backpack and you have to choose where to put things - so you shouldnt have something near others (idk what, give me some options) - you have things that goes in specific pockets - and you also need to think of how many of each thing you can bring. You see more what I mean?
> Also I want something that shows real pictures and fun facts of the treks, get those from the internet

Model: Sonnet 5.5 (`claude-sonnet-5-5`). Tokens: 1,921 output, 926 new input, 75,916 cached input, over 1 model call.

Proposed four design questions (which items can't sit together, how the backpack pockets work, how quantities are limited, where the photos come from). You stopped them before answering, so nothing was built. No commit.

## 4. Create the repo and commit

> actually, open a git repo for this under the same t564 project, and commit what we have so far (with the prompt following the other repos on that project)
>
> (sent while I was working) then we can continue

Model: Sonnet 5.5 (`claude-sonnet-5-5`). Tokens: 7,255 output, 16,441 new input, 672,728 cached input, over 8 model calls.

Looked at the other repos in the project (`w2`, `w3`, `w4`) to copy their conventions: `t564-projects` on GitHub, private, `main`, and a `PROMPT-LOG.md`. Ran `git init`, created the private repo `t564-projects/w5-invites-play` with `origin` set, and committed `index.html` (the sorting-game version from entry 2), then added this log. Not pushed. Commit `da54ef0` (the log itself is in the next commit).

## 5. Ask the design questions again, then build the new game

> yeah, lets go back to you asking with the multiple choice options

Answers to the questions: all four packing rules; pockets with allowed items; the trek sets the exact amounts; and for the photos, "you can look for other places for the photos and fun facts too, you are an AI right, it should be easy".

Model: Sonnet 5.5 (`claude-sonnet-5-5`). Tokens: 58,873 output, 91,852 new input, 3,950,392 cached input, over 26 model calls.

Rebuilt the game as a placement puzzle in the Meowdoku style. A backpack grid with five pockets, 14 items that only fit certain pockets (some take two cells), exact quantities per trek, and four packing rules that are introduced one at a time. Wrote a solver (`tools/gen.js`) that generates 11 levels, each solvable, with 60 solutions in the first stage down to 2 in the hardest, and stores one solution for the hint button. Photos: searched Wikimedia Commons, downloaded two free-licensed photos for each of the five treks, and show the photographer and licence under each. Facts come from the Wikipedia articles. Tested in headless Chrome: replayed all 11 solutions through the real tap logic (all win), checked an illegal placement is rejected, and looked at screenshots of the home, trek, game and win screens. Not tested on a real phone. Replaced the sorting game from entry 2. Commit `26a39f6` (the log itself is in the next commit).

## 6. Make it a real challenge

> its giving me exactly where to put everything, whats the challenge?
>
> (sent while I was working) but commit before actually doing new changes

Model: Sonnet 5.5 (`claude-sonnet-5-5`). Tokens: 21,700 output, 25,290 new input, 1,989,852 cached input, over 10 model calls.

The dashed highlight showed every legal spot for the picked item, and the jammed cells left only one or two choices, so the game told you where to put everything. Checked first that the version you were playing was already committed (`26a39f6`, `9353703`) and that only the new generator work was uncommitted. Then rebuilt the challenge: levels now start with a few locked clue items (📌) that the solver picks as the fewest that leave a small number of solutions (30 in stage 1, 1 in the last three), the highlight is gone, and rule breaks can be placed but turn red with the reason. The tray now lists the pockets each item fits, as information rather than the answer. Replayed all 11 solutions through the real tap logic (all win) and checked that water in the lid is flagged red and does not win. Not play-tested by hand, so the difficulty is untested. Commit `f462178` (the log itself is in the next commit).

## 7. Make it like real Meowdoku

> it still kind of stupid, easy and not fun at all. I love meowdoku and this one sucks

Answers to the questions I asked after looking the game up: "cant we have meowdoku rules adapted to the hike back rules (in matter of size, where, what can touch what, etc)"; backpack pockets and gear as the theme; features: ✕ marking and notes, timer and best times, real trek photos and facts as rewards (no lives).

Model: Sonnet 5.5 (`claude-sonnet-5-5`). Tokens: 51,760 output, 60,995 new input, 4,367,831 cached input, over 18 model calls.

I had misunderstood Meowdoku: I had built a packing puzzle. Searched the web and found the real rules: coloured regions, one cat per region, row and column, no touching even diagonally, one solution reached by logic. Rebuilt the game on that: the backpack is an N×N grid of coloured pockets, each pocket holds one specific gear item, one per pocket, row and column, incompatible gear can't touch even diagonally, and heavy gear goes low and light gear high. The grid grows with the trek (5×5 to 8×8). The level generator (`tools/gen.js`) keeps only puzzles with exactly one solution that a logic-only solver can reach, and tags each with a difficulty tier. Features: tap to ✕ or place, timer with best times, hints (+30 s), an auto-✕ assist, and the trek photos, facts and credits on the win screen. Replayed all 14 solutions through the real tap handler (all win) and checked that a wrong move is flagged red and does not win. Screenshots of the 6×6 and 8×8 boards found and fixed an overflow bug. Not play-tested by hand, so the difficulty is untested. Commit `ad2d8be` (the log itself is in the next commit).

## 8. Not fun for hikers: ask what to build

> it still kind of sucks, I wanted something more fun for the hike stuff, something that would keep the sort of thinking kind of game that I like, but that hikers would actually enjoy cause it sort of relates / teaches them you kno

Model: Sonnet 5.5 (`claude-sonnet-5-5`). Tokens: 2,849 output, 890 new input, 271,278 cached input, over 1 model call.

Agreed the hiking had only been decoration. Proposed four puzzles built around real decisions (itinerary planning, camp setup, pack vs forecast, topo-map route) and started to ask which to pick, but you interrupted before answering. No commit.

## 9. A set of little hike puzzles

> what if we have sort of little hike puzzles?
> - like the packing would be a puzzle like those ones that you need to fit people in a boat but they have constraints, you know? So like you need to fix X, Y and Z, but x cant go side by side with Z, needs at least 3 Y but if you have too much Y you cant fit Z and so on
> - then you can have something around the itinerary acclimatization
> - then you can have something around the map and so on
> - maybe something around find words related to hikes in a word puzzle
> - like a mario party you know? And then you see photos and fun facts
> gimme some options

Model: Sonnet 5.5 (`claude-sonnet-5-5`). Tokens: 2,151 output, 3,204 new input, 272,164 cached input, over 1 model call.

Listed seven mini-game options (Pack Fit, Climb High Sleep Low, Contour Map Route, Trail Words, River Crossing, Camp Setup, Layer Up), how they could fit together like Mario Party with a photo and fact after each, and suggested starting with four and building one first so you can play it before I build the rest. No commit.

## 10. Build the first mini-game: Climb High, Sleep Low

> yeah, lets do it like that

Model: Sonnet 5.5 (`claude-sonnet-5-5`). Tokens: 46,997 output, 55,311 new input, 4,018,272 cached input, over 13 model calls.

Searched the web for the real Everest Base Camp stages (heights, distances) and for the altitude guidance (Wilderness Medical Society and CDC: about 500 m a night above 3,000 m, a rest day every 3-4 days, an extra night per 1,000 m gained). Rebuilt the game as a hub of mini-games where the first one is playable: choose where to sleep each night on the real route, with a daily walking limit, the altitude rules and full lodges. A solver (`tools/gen.js`) keeps only stages with one to three valid plans. Wrong plans say what would go wrong on the real trail, and each solved stage gives a ranger tip, a fun fact and a real photo with its credit. The other three mini-games show as "coming soon". Played every valid plan of all six stages through the real tap handler (all win), checked that a rule-breaking plan is flagged, and looked at screenshots. The village heights and distances are rounded from published itineraries and the walking time is a simple estimate, which the game says. Not play-tested by hand. Replaced the Meowdoku-style game (still in the git history). Commit `77a8699` (the log itself is in the next commit).

## 11. It doesn't look like a real game

> nope, its still not what I wanted. It doest look like a real game

Answers to the questions I asked about the look: "the problem is that its too complex and not fun at all, it should be easier to play, fun, obvious, but challenging you know"; art style: cute pastel cartoon; controls: place tents, then watch the hike.

Model: Sonnet 5.5 (`claude-sonnet-5-5`). Tokens: 45,211 output, 49,215 new input, 3,221,428 cached input, over 9 model calls (measured before the turn finished, so slightly low).

The previous screen was a table and a grid of squares with four rules at once. Rebuilt everything you see in a cute pastel cartoon style: a scrollable mountain trail drawn in SVG with villages as little houses, a bear hiker, tent cards and a big Start hike button, with the stages as a winding map of round buttons. You tap a village to put up each night's tent, press Start hike, and watch the bear walk the plan: night falls on the trail, the lodge is full, or the bear turns green and dizzy. The generator now gives each stage only the rules introduced so far (daylight, then the 500 m climb, then rest days), so stage 1 has one rule, and every stage still has one or two valid plans. Played every valid plan of all six stages through the real tap handlers and hike animation (all win), checked that too-far and too-fast plans fail for the right reason, and looked at screenshots of the hub, stage map, a plan and a failed hike. Not play-tested by hand, and the sounds and animations are untested by ear and eye outside headless Chrome. Commit `c2b8756` (the log itself is in the next commit).
