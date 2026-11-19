# w5-invites-play

**Trail Pack** is a Meowdoku-style logic puzzle on a hiking backpack, with real treks. Place the right gear in every pocket of the pack using pure logic, then see a real photo and a fun fact from the trek.

This project is part of the EDU T564A class, Week 5: build something that invites play.

## How to play

The pack is an N×N grid split into N coloured pockets. Each pocket holds one specific gear item (shown in its corner and in the tags under the pack).

- **One per pocket.** Each pocket gets exactly one item.
- **One per row and column.** The weight is spread across the pack.
- **Keep apart.** Gear that doesn't get along can't touch, even diagonally: food vs smelly things (bug spray, stove fuel, wet boots), wet gear vs electronics and down, sharp or hot gear vs soft gear. The level lists the exact pairs.
- **Heavy low, light high** (some levels): ▼ gear sits in the bottom half, ▲ gear in the top half.
- **Size grows with the trek:** 5×5 for the first stages, up to 8×8 on Everest Base Camp.

Tap a square once to mark ✕ (gear can't be here), twice to place the gear, three times to clear. Every puzzle has exactly one solution that you can reach by logic alone, with no guessing. Wrong placements turn red and say why.

Extras: a timer with your best time per stage, 💡 hints (+30 seconds), and 🪄 auto-✕, which crosses out the squares a placed item rules out.

Five treks, 14 stages: Inca Trail, Tour du Mont Blanc, Torres del Paine, Kilimanjaro, Everest Base Camp. Each solved stage shows a real photo and a fun fact.

## Run it

Open `index.html` in a browser. No server or build step is needed. It works on a phone browser too.

## Files

- `index.html`, `style.css`, `game.js`: the game.
- `data.js`: gear, rules and the treks (with their fun facts).
- `levels.js`: the 14 levels. Generated, don't edit by hand.
- `tools/gen.js`: makes `levels.js`. It builds a random valid pack with a hidden answer, grows the pockets around it, and keeps the layout only if a solver finds exactly one solution and a logic-only solver can reach it. Run `node tools/gen.js`. Difficulty tiers: 1 = fill in what is forced, 2 = needs deeper elimination between pockets, 3 = needs group reasoning.
- `tools/test.html`: open it in a browser (or headless Chrome) to replay every level's solution through the real game logic.
- `photos/` and `credits.js`: trek photos with their credits.

## Photos and facts

Photos are free-licensed images from [Wikimedia Commons](https://commons.wikimedia.org/) (CC BY or CC BY-SA). The game shows each photographer, licence and link under the photo. The full list is in `photos/credits.json`. Fun facts come from the Wikipedia articles on each trek.
