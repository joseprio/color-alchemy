// THE QUOTES, AND EVERY CONTAINER THEY SIT IN — the director's cut only.
//
// One quote per element, shown three ways: on the full-screen discovery card,
// under the result in the cauldron, and on the element's row in the codex.
// Nothing here reaches a shipping build. Each of the three call sites in
// game.ts is a `__DIRECTOR__ ? ... : ""`, and __DIRECTOR__ is a literal by the
// time closure runs, so ADVANCED folds every one of them to an empty string,
// then finds these four exports unreferenced and deletes them — the table, the
// markup and the rules that style it. That is the whole reason the quotes live
// in their own module rather than as a `q` field on ElementDef: a field on a
// live object is reachable, and 101 strings that closure cannot prove dead are
// 101 strings roadroller has to model.
//
// So this file is written for READING, not for packing. It is the one place in
// the game where a byte costs nothing.

// id -> quote. Ids are elements.ts's own; a missing one renders as "undefined"
// rather than throwing, which is the right failure for a cut nobody ships.
export const QUOTE: Record<string, string> = {
  red: "All hands to battle stations!",
  green: "In every wood, in every spring, there is a different green.",
  blue: "The closest color to truth.",
  yellow: "Pikachu, I choose you!",
  magenta: "The fire that red attempts to be, and purple secretly desires.",
  cyan: "Cyan is sus",
  white: "Let there be light.",
  orange: "The new black.",
  violet: "The last color of the rainbow.",
  indigo: "Here because Newton insisted.",
  pink: "You can never go wrong with a little pink, a lot works too.",
  brown: "The very shade of earth itself.",
  matter: "Energy waiting to happen.",
  air: "The air is full of ideas. They are knocking you in the head all the time.",
  sky: "Only from the heart can you touch the sky.",
  gold: "Gold can do much, but love can do all.",
  water: "Be like water, my friend.",
  fire: "Fire transforms all things it touches.",
  earth: "Keep your feet on the ground and keep reaching for the stars.",
  clay: "Shape clay into a vessel; it is the space within that makes it useful.",
  pottery: "Who is the Potter, pray, and who the Pot?",
  beer: "Beer is proof that God loves us and wants us to be happy.",
  wine: "Wine is sunlight, held together by water.",
  lava: "The floor is lava!",
  volcano: "A cannon of immense size.",
  stone: "Every stone holds a statue; the sculptor merely reveals it.",
  metal: "Soft enough to wire, hard enough to shield, liquid enough to pour.",
  tool: "We shape our tools, and thereafter our tools shape us.",
  sand: "It's coarse and rough and irritating and it gets everywhere.",
  glass: "Glass, china, and reputation are easily cracked, and never well mended.",
  mirror: "Who's the Fairest of Them All?",
  hourglass: "Like sands through the hourglass, so are the days of our lives.",
  sun: "Even the darkest night will end and the sun will rise.",
  night: "A world lit by itself.",
  star: "The forget-me-nots of the angels.",
  moon: "Everyone is a moon, and has a dark side which he never shows to anybody.",
  cloud: "Resembles the thoughts in our mind! Both change from second to second!",
  rain: "If you want the rainbow, you have to put up with the rain.",
  lightning: "Never strikes twice.",
  storm: "It was the most terrible, yet majestic spectacle.",
  tornado: "I've a feeling we're not in Kansas anymore.",
  life: "It finds a way.",
  egg: "Which came first?",
  animal: "All animals are equal, but some are more equal than others.",
  lizard: "Life's better on a warm rock.",
  horse: "My kingdom for a horse!",
  hippo: "The world's most dangerous couch potato.",
  wolf: "If you live with wolves, you must learn to howl.",
  fox: "The fox changes his skin, but not his habits.",
  bone: "Flesh decays; bone endures.",
  dog: "The more I learn about people, the more I like my dog.",
  cow: "One end is moo, the other, milk.",
  milk: "Got milk?",
  cheese: "The nectar of the Gods.",
  squirrel: "You can't keep a squirrel on the ground.",
  bird: "To have faith is to have wings.",
  chick: "Are you my mother?",
  penguin: "Always dressed to impress and ready for any occasion.",
  duck: "If it looks like a duck and quacks like a duck, it's a duck.",
  fish: "So long, and thanks for all the fish.",
  owl: "Spanish or Vanish",
  flamingo: "Be a flamingo in a flock of pigeons.",
  peacock: "I'm a peacock, you gotta let me fly!",
  phoenix: "From the ashes, a fire shall be woken",
  bee: "Busy bees make more honey.",
  honey: "Life is the flower for which love is the honey.",
  bear: "Sometimes you eat the bear, and sometimes the bear eats you.",
  polarbear: "The undisputed king of the ice.",
  acid: "Water that bites.",
  electricity: "So subtle and powerful that it seems to be the very soul of the universe.",
  lightbulb: "I have not failed. I've just found 10,000 ways that won't work.",
  ice: "Let it go!",
  snow: "Winter is coming.",
  prism: "Every eye is a different prism, showing a different world.",
  rainbow: "Somewhere over the rainbow, skies are blue.",
  magic: "Any sufficiently advanced technology is indistinguishable from magic.",
  crystalball: "Reply hazy, try again.",
  unicorn: "Always be yourself. Unless you can be a unicorn, then always be a unicorn.",
  plant: "Grow where you are planted.",
  cactus: "Adapt to your environment, grow thick skin, and stay sharp.",
  field: "Pray for a good harvest, but keep on plowing.",
  park: "Not an island of nature, but a bridge connecting humans back to it.",
  tree: "He who plants a tree, plants a hope.",
  fruit: "An apple a day keeps the doctor away.",
  pumpkin: "Trick or treat!",
  wood: "Chop your own wood and it will warm you twice.",
  charcoal: "Charcoal never forgets that it was once wood.",
  ash: "Ashes to ashes, dust to dust.",
  mushroom: "All are edible, but some only once.",
  pencil: "A pencil and a dream can take you anywhere.",
  paper: "Paper has more patience than people.",
  book: "A room without books is like a body without a soul.",
  palette: "I dream of painting and then I paint my dream.",
  kite: "Kites rise highest against the wind, not with it.",
  black: "Only in the darkness can you see the stars.",
  grey: "A gray day provides the best light.",
  diamond: "Life tries to crush you, but you choose whether to become dust or a diamond.",
  ring: "One ring to bring them all, and in the darkness bind them.",
  flower: "Where flowers bloom so does hope.",
  sunflower: "Wherever the sun goes, the sunflower will follow.",
  rose: "A rose by any other name would smell as sweet.",
};

// The discovery card: an italic line under the new element's name.
export const cardQuote = (id: string): string =>
  "<i>\u201C" + QUOTE[id] + "\u201D</i>";

// The cauldron well, appended to the name already sitting there.
export const wellQuote = (id: string): string =>
  " \u2014 \u201C" + QUOTE[id] + "\u201D";

// The codex row, under the name and the recipes that made it.
export const codexQuote = (id: string): string =>
  '<div class="Q">' + QUOTE[id] + "</div>";

// The rules for those three containers, appended to the sheet by css.ts. They
// are here rather than in style.css for the same reason the strings are: a
// selector in the stylesheet ships whether or not anything wears the class,
// and in a shipping build nothing ever will. Not run through cssnano — it is
// concatenated onto the minified sheet at runtime — so it is written out plain.
export const QUOTE_CSS = `
#ds .c i { color: #8fb4d8; }
.Q { color: #55708e; font-size: 11px; font-style: italic; }
`;
