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

Model: Sonnet 5.5 (`claude-sonnet-5-5`). Tokens: 55,918 output, 88,146 new input, 3,586,584 cached input, over 24 model calls (measured before the turn finished, so slightly low).

Rebuilt the game as a placement puzzle in the Meowdoku style. A backpack grid with five pockets, 14 items that only fit certain pockets (some take two cells), exact quantities per trek, and four packing rules that are introduced one at a time. Wrote a solver (`tools/gen.js`) that generates 11 levels, each solvable, with 60 solutions in the first stage down to 2 in the hardest, and stores one solution for the hint button. Photos: searched Wikimedia Commons, downloaded two free-licensed photos for each of the five treks, and show the photographer and licence under each. Facts come from the Wikipedia articles. Tested in headless Chrome: replayed all 11 solutions through the real tap logic (all win), checked an illegal placement is rejected, and looked at screenshots of the home, trek, game and win screens. Not tested on a real phone. Replaced the sorting game from entry 2. Commit `26a39f6` (the log itself is in the next commit).
