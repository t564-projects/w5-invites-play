# w5-invites-play

**Trail Oops!** is a hiking version of a "dumb ways to die" microgame collection. Each microgame lasts a few seconds, asks you to do one thing fast ("Hang the food!", "Don't fall off the edge!"), and if you fail, your little hiker dies in a funny way and you get the real ranger tip. Survive a stage to unlock a real photo and fun fact from a famous trek.

This project is part of the EDU T564A class, Week 5: build something that invites play.

## How it works

- **Microgames:** 14 quick games, each a different action (drag, tap, hold, rhythm, dodge, pick one, scrub). Examples: hang the food from the bear, treat the water, dress for the rain, turn around on time, get to the uphill side when yaks pass, go "pole pole" (slowly) on Kilimanjaro, dodge lightning on the ridge, crouch in a Patagonian gust.
- **Stages:** 8 microgames, 3 lives, and it speeds up as you go. Each trek has 3 stages that get faster.
- **Treks:** Inca Trail, Tour du Mont Blanc, Torres del Paine, Kilimanjaro and Everest Base Camp. Each trek has its own mix of microgames. Survive all 3 stages of a trek to unlock the next.
- **Photos and facts:** every stage you survive unlocks a real photo (Wikimedia Commons, with the photographer's credit) and a fun fact, kept in a photo album for each trek.
- **Coins and shop:** each microgame you survive earns coins. Spend them on hiker outfits (a chullo hat for the Inca Trail, an alpine hat for Mont Blanc, and so on) and backgrounds. Every photo you unlock also becomes a free background.

## Run it

Open `index.html` in a browser. No server or build step is needed. It works on a phone browser too.

## Files

- `index.html`, `style.css`: the page and the cute pastel look.
- `game.js`: the shell (stages, lives, death cards, coins, shop, album, the hiker drawing).
- `microgames.js`: the 14 microgames.
- `data.js`: treks (photos with captions and facts), hiker outfits and backgrounds.
- `credits.js` and `photos/`: the photos and their credits (`photos/credits.json` has the same list).
- `tools/test.html`: open it in a browser (or headless Chrome). It plays every microgame through the real code twice (doing the task must survive, doing nothing must die), then plays a whole stage perfectly and a whole stage by doing nothing.

## Real tips

Every death card has a real tip, from the usual guidance for hikers: store food in a bear canister or hang it, treat your water, avoid cotton in the rain, set a turnaround time, never eat unknown plants, stay on marked trails, wear sunscreen at altitude, back away slowly from wildlife (about 25 m, or 100 m for bears), get off ridges in a thunderstorm, stand on the uphill side when yaks pass, go slowly at altitude, brace in strong wind, and fully put out your fire.

## Photos and facts

Photos are free-licensed images from [Wikimedia Commons](https://commons.wikimedia.org/) (CC BY or CC BY-SA). The game shows the photographer, licence and link with each photo. Facts come from Wikipedia and from the photos themselves.
