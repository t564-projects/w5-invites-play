# w5-invites-play

**Trail Pack** is a collection of little hiking puzzles, like a Mario Party for hikers. Each mini-game is built around a real hiking decision, uses real trek data, and ends with a real photo and a fun fact from the trek.

This project is part of the EDU T564A class, Week 5: build something that invites play.

## Mini-games

- ⛰️ **Climb High, Sleep Low** (playable): plan the nights of the Everest Base Camp trek without getting altitude sickness. Choose where to sleep each night, using the real villages, heights and distances. The rules come from Wilderness Medical Society and CDC guidance: above 3,000 m, raise your sleeping altitude by no more than about 500 m a night, take a rest day every 3–4 days, and keep each day's walk within a limit. Some lodges are full on some nights. Every stage has only one to three valid plans, so you have to reason it out. Each day tells you what would go wrong on the real trail, and each solved stage gives a ranger tip, a fun fact and a photo.
- 🎒 **Pack Fit** (coming soon): fit gear into the pack with needs, limits and things that can't touch.
- 🗺️ **Contour Route** (coming soon): read the contour lines and find the safe way up.
- 🔤 **Trail Words** (coming soon): find hiking words and learn what they mean.

## Run it

Open `index.html` in a browser. No server or build step is needed. It works on a phone browser too.

## Files

- `index.html`, `style.css`, `game.js`: the game.
- `data.js`: the real routes (villages, heights, distances, facts), the treks and the gear data for the next mini-game.
- `levels.js`: the stages. Generated, don't edit by hand.
- `tools/gen.js`: makes `levels.js`. It tries combinations of days, daily walking limit and full lodges, counts the valid itineraries with a solver, and keeps stages with only a few answers.
- `tools/test.html`: open it in a browser (or headless Chrome) to play every valid itinerary of every stage through the real game logic.
- `photos/` and `credits.js`: trek photos with their credits.

## Data, photos and facts

Heights and distances are rounded from published itineraries and vary a few percent between sources. The walking time is a simple game estimate from distance and climbing. Photos are free-licensed images from [Wikimedia Commons](https://commons.wikimedia.org/) (CC BY or CC BY-SA), with the credit shown under each photo. The full list is in `photos/credits.json`. Facts come from Wikipedia and published trek guides.
