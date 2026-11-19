/* Trail Pack: static data (items, backpack layout, rules, treks). Works in the browser and in Node. */
const DATA = {
  // Backpack grid, row by row. Each cell belongs to a pocket.
  ZONES: [
    ['lid', 'lid', 'lid', 'lid'],
    ['left', 'main', 'main', 'right'],
    ['left', 'main', 'main', 'right'],
    ['left', 'main', 'main', 'right'],
    ['bottom', 'bottom', 'bottom', 'bottom']
  ],
  ZONE_NAMES: { lid: 'Lid pocket', left: 'Left pocket', main: 'Main compartment', right: 'Right pocket', bottom: 'Bottom compartment' },

  // size: number of cells (2-cell items can be rotated). weight: H heavy, M medium, L light.
  ITEMS: {
    water:  { e: '💧', name: 'Water bottle',  size: 1, weight: 'H', zones: ['left', 'right', 'main'],                tags: ['wet'],               color: '#7cc3ee' },
    food:   { e: '🥜', name: 'Food bag',      size: 1, weight: 'H', zones: ['main', 'bottom'],                        tags: ['food'],              color: '#f2b36b' },
    stove:  { e: '🔥', name: 'Stove + fuel',  size: 1, weight: 'H', zones: ['main', 'left', 'right'],                 tags: ['hot', 'smelly'],     color: '#ef8a5a' },
    tent:   { e: '⛺', name: 'Tent',          size: 2, weight: 'H', zones: ['main', 'bottom'],                        tags: [],                    color: '#7fd1a0' },
    bag:    { e: '🛌', name: 'Sleeping bag',  size: 2, weight: 'M', zones: ['bottom'],                                tags: ['soft', 'down'],      color: '#b895ee' },
    jacket: { e: '🧥', name: 'Down jacket',   size: 1, weight: 'M', zones: ['lid', 'main', 'bottom', 'left', 'right'], tags: ['soft', 'down'],      color: '#e77f7a' },
    rain:   { e: '☔', name: 'Rain jacket',   size: 1, weight: 'M', zones: ['lid', 'left', 'right', 'main'],          tags: ['wet'],               color: '#8c9cf0' },
    boots:  { e: '🥾', name: 'Wet boots',     size: 1, weight: 'M', zones: ['bottom', 'left', 'right'],               tags: ['wet', 'smelly'],     color: '#b9936a' },
    axe:    { e: '⛏️', name: 'Ice axe',       size: 1, weight: 'M', zones: ['left', 'right'],                         tags: ['sharp'],             color: '#7fe0dc' },
    camera: { e: '📷', name: 'Camera',        size: 1, weight: 'L', zones: ['lid'],                                   tags: ['electronic'],        color: '#a8b3c2' },
    lamp:   { e: '🔦', name: 'Headlamp',      size: 1, weight: 'L', zones: ['lid', 'left', 'right'],                  tags: ['electronic'],        color: '#f0d56a' },
    med:    { e: '🩹', name: 'First aid',     size: 1, weight: 'L', zones: ['lid', 'left', 'right'],                  tags: ['soft'],              color: '#f19bc0' },
    bug:    { e: '🦟', name: 'Bug spray',     size: 1, weight: 'L', zones: ['lid', 'left', 'right'],                  tags: ['smelly'],            color: '#b3c47a' },
    sun:    { e: '🧴', name: 'Sun cream',     size: 1, weight: 'L', zones: ['lid', 'left', 'right'],                  tags: [],                    color: '#f6dc7a' }
  },

  // Rules. 'weight' is about rows; the others are about neighbours (cells that share an edge).
  RULES: {
    weight: { icon: '⚖️', title: 'Heavy low, light high', text: 'Heavy items sit in the bottom three rows. Light items stay out of the bottom two rows.' },
    food:   { icon: '🐻', title: 'Food stays clean',      text: 'Food can’t touch smelly things (bug spray, stove fuel, wet boots).' },
    wet:    { icon: '💦', title: 'Keep it dry',           text: 'Wet things (water, rain jacket, wet boots) can’t touch electronics or down (camera, headlamp, sleeping bag, down jacket).' },
    sharp:  { icon: '🔪', title: 'Sharp & hot vs soft',   text: 'The ice axe and stove can’t touch soft things (sleeping bag, jackets, first aid).' }
  },

  // Real treks. Photos are free-licensed images from Wikimedia Commons (credits in photos/credits.json).
  // Facts come from the Wikipedia articles on each trek.
  TREKS: {
    inca: { name: 'Inca Trail', place: 'Peru', alt: '4,215 m high point', color: '#c9825b', sky: ['#ffe2a8', '#f59a6b'],
      photos: [
        { file: 'photos/inca-1.jpg', caption: 'Hikers at the start of the trail, at the Machu Picchu sanctuary welcome sign' },
        { file: 'photos/inca-2.jpg', caption: 'Camp above the clouds at Phuyupatamarca' }],
      facts: [
        'The Inca Trail to Machu Picchu is really three overlapping trails: Mollepata, Classic and One Day.',
        'The trail passes through cloud forest and alpine tundra, past Inca settlements, tunnels and ruins.',
        'It ends at the Sun Gate. The two longer routes climb above 4,200 m, high enough to cause altitude sickness.'] },
    tmb: { name: 'Tour du Mont Blanc', place: 'France · Italy · Switzerland', alt: '2,665 m high point', color: '#6f8fb5', sky: ['#bfe4ff', '#f4f9ff'],
      photos: [
        { file: 'photos/tmb-1.jpg', caption: 'The Mont Blanc massif above the Géant glacier' },
        { file: 'photos/tmb-2.jpg', caption: 'The trail north of the Col du Bonhomme, with early-summer snow' }],
      facts: [
        'The Tour du Mont Blanc is one of the most popular long-distance walks in Europe.',
        'It circles the Mont Blanc massif, roughly 165 km (103 mi) with about 10 km of total ascent and descent.',
        'The loop passes through parts of Switzerland, Italy and France.'] },
    paine: { name: 'Torres del Paine', place: 'Chile', alt: 'Patagonian wilderness', color: '#5f7a7c', sky: ['#cfd9e6', '#8fa5bd'],
      photos: [
        { file: 'photos/paine-1.jpg', caption: 'The Cuernos del Paine rising over a turquoise lake' },
        { file: 'photos/paine-2.jpg', caption: 'Beech forest and glacier in the French Valley' }],
      facts: [
        '“Paine” means “blue” in the Tehuelche (Aonikenk) language and is pronounced PIE-neh.',
        'The park sits in a transition zone between Magellanic subpolar forests and the Patagonian steppe.',
        'It was established as a national park in 1959, about 112 km north of Puerto Natales.'] },
    kili: { name: 'Kilimanjaro', place: 'Tanzania', alt: '5,895 m summit', color: '#c9895a', sky: ['#ffd37a', '#e56f4a'],
      photos: [
        { file: 'photos/kili-1.jpg', caption: 'Snow and a glacier wall on the upper mountain' },
        { file: 'photos/kili-2.jpg', caption: 'Trekkers in the Barranco Valley' }],
      facts: [
        'Kilimanjaro is the highest mountain in Africa, at 5,895 m (19,341 ft).',
        'It is the highest free-standing mountain above sea level in the world and a dormant volcano.',
        'It rises 4,900 m above its plateau base, and it is the fourth most prominent peak on Earth.'] },
    ebc: { name: 'Everest Base Camp', place: 'Nepal', alt: '5,364 m base camp', color: '#8197b3', sky: ['#9fd0ff', '#e9f4ff'],
      photos: [
        { file: 'photos/ebc-1.jpg', caption: 'Trekkers in the snow with the Himalayas behind' },
        { file: 'photos/ebc-2.jpg', caption: 'Sunset light on the peaks above the trek' }],
      facts: [
        'There are two base camps on Mount Everest, on opposite sides of the mountain.',
        'South Base Camp, the trek’s destination, is in Nepal at 5,364 m (17,598 ft).',
        'North Base Camp is in Tibet at 5,150 m (16,900 ft).'] }
  }
};
if (typeof module !== 'undefined') module.exports = DATA;
