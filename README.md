# w5-invites-play

**Trail Pack** is a backpack-packing puzzle with real treks. Fit the right gear into the right pockets of a backpack without breaking the packing rules, then see a real photo and a fun fact from the trek.

This project is part of the EDU T564A class, Week 5: build something that invites play.

## How to play

- The tray shows exactly how many of each item the trek needs and which pockets it fits. Pick an item, then tap a spot in the backpack. Tap packed gear to take it out.
- Each level starts with a few items already locked in place (📌). They are clues. The rest can be worked out from the rules, and the later stages have exactly one solution.
- Each item only fits certain pockets (lid, left, main, right, bottom). Some items take two cells and can be rotated. Jammed spots (🔒) can't be used.
- Rules (they are introduced gradually):
  - **Heavy low, light high:** heavy items go in the bottom three rows, light items stay out of the bottom two.
  - **Food stays clean:** food can't touch smelly things (bug spray, stove fuel, wet boots).
  - **Keep it dry:** wet things can't touch electronics or down.
  - **Sharp and hot vs soft:** the ice axe and stove can't touch the sleeping bag, jackets or first aid.
- You can put anything anywhere, but items that break a rule turn red and say why. You win when everything is in and nothing is red. The 💡 button costs a star.
- Five treks, 11 stages: Inca Trail, Tour du Mont Blanc, Torres del Paine, Kilimanjaro, Everest Base Camp.

## Run it

Open `index.html` in a browser. No server or build step is needed. It works on a phone browser too.

## Files

- `index.html`, `style.css`, `game.js`: the game.
- `data.js`: items, backpack pockets, rules and the treks (with their fun facts).
- `levels.js`: the 11 levels. Generated, don't edit by hand.
- `tools/gen.js`: makes `levels.js`. It builds a random valid pack, then a solver picks the fewest clue items that leave a small number of solutions, so every level is solvable (30 solutions in the first stage, 1 in the last three). Run `node tools/gen.js`.
- `tools/test.html`: open it in a browser (or headless Chrome) to replay every level's solution through the real game logic.
- `photos/` and `credits.js`: trek photos with their credits.

## Photos and facts

Photos are free-licensed images from [Wikimedia Commons](https://commons.wikimedia.org/) (CC BY or CC BY-SA). The game shows each photographer, licence and link under the photo. The full list is in `photos/credits.json`. Fun facts come from the Wikipedia articles on each trek.
