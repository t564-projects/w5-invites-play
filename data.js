/* Trail Oops!: static data. Works in the browser and in Node. */
const DATA = {
  ORDER: ['inca', 'tmb', 'paine', 'kili', 'ebc'],

  // Real treks. Photos are free-licensed images from Wikimedia Commons (credits in credits.js).
  // Each stage you survive unlocks the next photo and its fun fact. Facts come from Wikipedia and the photos themselves.
  TREKS: {
    inca: { name: 'Inca Trail', place: 'Peru', alt: '4,215 m high point', icon: '🦙', c1: '#ffb36b', c2: '#ff7e8f',
      pool: ['balance', 'water', 'lost', 'polepole', 'jacket', 'sunscreen', 'berries', 'backaway', 'fire', 'bearbag'],
      photos: [
        { file: 'photos/inca-1.jpg', caption: 'Hikers at the start of the trail, at the Machu Picchu sanctuary welcome sign', fact: 'Only about 500 people a day, porters included, are allowed on the Inca Trail, so spots sell out months ahead.' },
        { file: 'photos/inca-2.jpg', caption: 'Camp above the clouds at Phuyupatamarca', fact: 'The trail passes through cloud forest and alpine tundra, and the two longer routes climb above 4,200 m, high enough to cause altitude sickness.' },
        { file: 'photos/inca-3.jpg', caption: 'A llama in the high grass of the Inca Trail', fact: 'Llamas have been used as pack animals in the Andes for thousands of years.' }] },
    tmb: { name: 'Tour du Mont Blanc', place: 'France · Italy · Switzerland', alt: '2,665 m high point', icon: '🏔️', c1: '#8ec9ff', c2: '#b9a6f7',
      pool: ['lightning', 'jacket', 'lost', 'balance', 'water', 'bearbag', 'sunscreen', 'berries', 'backaway', 'fire'],
      photos: [
        { file: 'photos/tmb-1.jpg', caption: 'The Mont Blanc massif above the Géant glacier', fact: 'The Tour du Mont Blanc circles the Mont Blanc massif and is roughly 165 km (103 mi) long.' },
        { file: 'photos/tmb-2.jpg', caption: 'The trail north of the Col du Bonhomme, with early-summer snow', fact: 'The loop passes through parts of France, Italy and Switzerland.' },
        { file: 'photos/tmb-3.jpg', caption: 'The stone-paved trail climbing through forest near the Col des Montets', fact: 'The Tour du Mont Blanc is one of the most popular long-distance walks in Europe.' }] },
    paine: { name: 'Torres del Paine', place: 'Chile', alt: 'Patagonian wilderness', icon: '🦅', c1: '#7fd1c8', c2: '#6f9bf0',
      pool: ['gust', 'lightning', 'jacket', 'backaway', 'fire', 'lost', 'water', 'balance', 'bearbag', 'sunscreen'],
      photos: [
        { file: 'photos/paine-1.jpg', caption: 'The Cuernos del Paine rising over a turquoise lake', fact: '“Paine” means “blue” in the Tehuelche (Aonikenk) language and is pronounced PIE-neh.' },
        { file: 'photos/paine-2.jpg', caption: 'Beech forest and glacier in the French Valley', fact: 'The park sits in a transition zone between Magellanic subpolar forests and the Patagonian steppe.' },
        { file: 'photos/paine-3.jpg', caption: 'Sunset over the camp and refugio at Paine Grande', fact: 'Torres del Paine was established as a national park in 1959, about 112 km north of Puerto Natales.' }] },
    kili: { name: 'Kilimanjaro', place: 'Tanzania', alt: '5,895 m summit', icon: '🦒', c1: '#ffd166', c2: '#ff8f6b',
      pool: ['polepole', 'sunscreen', 'turnaround', 'water', 'backaway', 'jacket', 'lost', 'fire', 'balance', 'berries'],
      photos: [
        { file: 'photos/kili-1.jpg', caption: 'Snow and a glacier wall on the upper mountain', fact: 'Kilimanjaro is the highest mountain in Africa, at 5,895 m (19,341 ft).' },
        { file: 'photos/kili-2.jpg', caption: 'Trekkers in the Barranco Valley', fact: 'It is the highest free-standing mountain above sea level in the world, and a dormant volcano.' },
        { file: 'photos/kili-3.jpg', caption: 'Trail sign at Shira Cave Camp, 3,750 m, in the moorland zone', fact: 'The sign at Shira Cave Camp (3,750 m) lists Uhuru Peak, the summit, as 25 km away, a 21-hour walk.' }] },
    ebc: { name: 'Everest Base Camp', place: 'Nepal', alt: '5,364 m base camp', icon: '🐂', c1: '#9fd0ff', c2: '#7a8fd1',
      pool: ['yak', 'turnaround', 'polepole', 'jacket', 'water', 'balance', 'gust', 'lightning', 'fire', 'lost'],
      photos: [
        { file: 'photos/ebc-1.jpg', caption: 'Trekkers in the snow with the Himalayas behind', fact: 'South Base Camp, the trek’s destination in Nepal, sits at 5,364 m (17,598 ft).' },
        { file: 'photos/ebc-2.jpg', caption: 'Sunset light on the peaks above the trek', fact: 'North Base Camp, on the Tibet side, is a little lower, at 5,150 m.' },
        { file: 'photos/ebc-3.jpg', caption: 'Tents and prayer flags at Everest Base Camp', fact: 'There are two base camps on Mount Everest, on opposite sides of the mountain.' }] }
  },

  // Hiker outfits. Each trek unlocks one. hat: which hat the bean wears. color: body colour.
  CHARS: {
    bean:   { name: 'Bean',          hat: 'beanie', color: '#7fb8e8', price: 0,  trek: null },
    chullo: { name: 'Poncho Pete',   hat: 'chullo', color: '#e87f8a', price: 12, trek: 'inca' },
    alpine: { name: 'Alpine Anna',   hat: 'alpine', color: '#8fd9b6', price: 12, trek: 'tmb' },
    gaucho: { name: 'Gaucho Gus',    hat: 'gaucho', color: '#b9a6f7', price: 15, trek: 'paine' },
    safari: { name: 'Safari Sam',    hat: 'safari', color: '#ffc46b', price: 18, trek: 'kili' },
    sherpa: { name: 'Sherpa Sid',    hat: 'sherpa', color: '#f06f6f', price: 22, trek: 'ebc' }
  },

  // Backgrounds for the microgames. Photo backgrounds ("photo:inca-1") unlock for free when you survive that stage.
  BGS: {
    meadow:   { name: 'Meadow',          sky: ['#bfe6ff', '#e8f7d4'], ground: '#a9dcb5', price: 0,  trek: null },
    terraces: { name: 'Golden terraces', sky: ['#ffe3a8', '#f9c88a'], ground: '#b8d98c', price: 10, trek: 'inca' },
    alpine:   { name: 'Alpine meadow',   sky: ['#cfe7ff', '#f4fbff'], ground: '#9fd4a8', price: 10, trek: 'tmb' },
    dusk:     { name: 'Patagonian dusk', sky: ['#8a9bd9', '#ffb8a0'], ground: '#6f8f86', price: 14, trek: 'paine' },
    savanna:  { name: 'Savanna sunset',  sky: ['#ffcf7a', '#ff9f6b'], ground: '#d9b36a', price: 16, trek: 'kili' },
    himalaya: { name: 'Himalayan night', sky: ['#2b3a67', '#7a8fd1'], ground: '#e8eef9', price: 20, trek: 'ebc' }
  }
};
if (typeof module !== 'undefined') module.exports = DATA;
