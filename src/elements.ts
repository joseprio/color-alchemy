// The element tree. n = display name, q = quote (shown once, on discovery),
// c = color swatch (spec: colors are plain squares; with bg set it is only
// the glow color), bg = custom swatch background (any CSS background stack —
// Night layers percentage-sized star dots over a blue-to-black gradient so it scales
// from the 18px encyclopedia icon to the 56px discovery card), e = emoji icon,
// s = inline SVG body drawn on a 0 0 32 32 viewBox (for an icon no emoji and no
// gradient stack can express — it renders as an <svg class="sw">, so it picks up
// every size rule the square swatches use, and c still supplies the glow),
// r = recipes (unordered pairs of ids); several recipes may make one element
// (Bone has eleven routes — a four-legged creature and fire, or a predator and
// what it caught; fire does not reduce the fish or the bee at all, and a Bird
// answers it with a Phoenix; White Light, Sand and Rainbow have three; Bird,
// Charcoal, Dog, Water, Wood and Cloud two each).
// An alternate may be cyclic — Fire + Ice remakes Water, which Ice needs,
// Penguin + Air hands back the Bird the Penguin came from, Wolf + Dog is just
// another Dog, Fire + Charcoal burns the Charcoal back down to Fire, Fire + Air
// is a fanned fire and nothing more, and Axe + Tree makes the Wood the Axe
// itself was cut from — it is flavor for a pair players try, never a cheaper
// route.
export interface ElementDef {
  id: string;
  n: string;
  q: string;
  c?: string;
  bg?: string;
  e?: string;
  s?: string;
  r?: [string, string][];
}

export const ELEMENTS: ElementDef[] = [
  { id:"red",     n:"Red",         c:"#ff3b30", q:"The first spark. Everything warm starts here." },
  { id:"green",   n:"Green",       c:"#34d158", q:"The color of things that insist on growing." },
  { id:"blue",    n:"Blue",        c:"#2f6bff", q:"Deep and calm, like the start of a sky." },
  { id:"yellow",  n:"Yellow",      c:"#ffdc32", q:"Two lights make a brighter one. This is not paint.",
    r:[["red","green"]] },
  { id:"magenta", n:"Magenta",     c:"#ff44ff", q:"A color your brain made up. There is no magenta wavelength.",
    r:[["red","blue"]] },
  { id:"cyan",    n:"Cyan",        c:"#33e9e9", q:"Shallow seas and old terminals.",
    r:[["green","blue"]] },
  { id:"white",   n:"White Light", c:"#ffffff", q:"Every color at once, hiding in plain sight.",
    r:[["blue","yellow"],["red","cyan"],["green","magenta"]] },
  { id:"orange",  n:"Orange",      c:"#ff9430", q:"Named after the fruit — not the other way around.",
    r:[["red","yellow"]] },
  { id:"violet",  n:"Violet",      c:"#9a4dff", q:"The last color the rainbow remembers.",
    r:[["blue","magenta"]] },
  { id:"indigo",  n:"Indigo",      c:"#4a30d8", q:"Newton wanted seven colors, so he found room for this one.",
    r:[["blue","violet"]] },
  { id:"pink",    n:"Pink",        c:"#ffa8c5", q:"Softness, weaponized.",
    r:[["red","white"]] },
  { id:"air",     n:"Air",         e:"\u{1F4A8}", q:"You only notice it when it moves.",
    r:[["blue","white"]] },
  { id:"sky",     n:"Sky",         c:"#7ec8ff", q:"Look up. It keeps going.",
    bg:"radial-gradient(circle at 68% 30%, #fff3a0 0 6%, #ffdc32 6% 13%, transparent 17%)," +
       "radial-gradient(circle at 68% 30%, #ffdc3244 0 22%, transparent 30%)," +
       "linear-gradient(180deg, #a8dbff 0%, #7ec8ff 55%, #4f9fe8 100%)",
    r:[["air","blue"]] },
  { id:"gold",    n:"Gold",        c:"#f7c948", q:"Alchemists chased this for centuries. You mixed two squares.",
    r:[["yellow","orange"]] },
  { id:"water",   n:"Water",       e:"\u{1F4A7}", q:"It only looks blue because it borrowed the sky.",
    r:[["blue","cyan"],["fire","ice"]] },
  { id:"fire",    n:"Fire",        e:"\u{1F525}", q:"The oldest alchemy there is.",
    r:[["red","air"],["fire","charcoal"],["fire","air"]] },
  { id:"earth",   n:"Earth",       c:"#a4713f", q:"The other three get the poetry. This one grows the food.",
    bg:"radial-gradient(circle at 30% 35%, #7a4a26cc 0 5%, transparent 9%)," +
       "radial-gradient(circle at 62% 60%, #5c3a1e 0 4%, transparent 8%)," +
       "radial-gradient(circle at 78% 28%, #b98a55 0 4%, transparent 8%)," +
       "radial-gradient(circle at 42% 78%, #5c3a1e 0 4.5%, transparent 8%)," +
       "radial-gradient(circle at 15% 65%, #b98a55aa 0 3.5%, transparent 7%)," +
       "linear-gradient(180deg, #a4713f 0%, #7c5230 55%, #59391f 100%)",
    r:[["green","orange"]] },
  { id:"clay",    n:"Clay",        c:"#c1663c", q:"Earth that agreed to hold a shape.",
    bg:"radial-gradient(circle at 33% 26%, #ffc49faa 0 11%, transparent 32%),"
       + "linear-gradient(150deg, #d4794c 0%, #c1663c 46%, #8f4526 100%)",
    r:[["earth","water"]] },
  { id:"pottery", n:"Pottery",     e:"\u{1F3FA}", q:"Clay that met a fire and kept the shape.",
    r:[["clay","fire"]] },
  { id:"lava",    n:"Lava",        c:"#ff5a1f", q:"The ground, briefly reconsidering.",
    bg:"radial-gradient(circle at 27% 32%, #ffe08a 0 3.5%, transparent 7%)," +
       "radial-gradient(circle at 72% 62%, #ffc04dcc 0 4%, transparent 8%)," +
       "linear-gradient(108deg, #2b0e07 0 14%, transparent 14% 27%, #1f0905 27% 35%," +
       "transparent 35% 58%, #2b0e07 58% 68%, transparent 68% 84%, #1f0905 84% 92%, transparent 92%)," +
       "linear-gradient(180deg, #ffb020 0%, #ff5a1f 45%, #a32206 100%)",
    r:[["earth","fire"]] },
  { id:"volcano", n:"Volcano",     e:"\u{1F30B}", q:"A mountain that kept the receipt.",
    r:[["lava","earth"]] },
  { id:"stone",   n:"Stone",       c:"#9aa4ad", q:"Cooled, hardened, and in no hurry.",
    bg:"radial-gradient(circle at 30% 32%, #6f7880 0 5%, transparent 9%)," +
       "radial-gradient(circle at 66% 58%, #c8d0d8aa 0 4%, transparent 8%)," +
       "radial-gradient(circle at 78% 26%, #5c646c 0 3.5%, transparent 7%)," +
       "radial-gradient(circle at 40% 76%, #b6c0c8aa 0 3.5%, transparent 7%)," +
       "linear-gradient(160deg, #aab4bd 0%, #8b959d 55%, #626a72 100%)",
    r:[["lava","water"]] },
  { id:"metal",   n:"Metal",       c:"#c3ced9", q:"Stone, refined until it rings.",
    bg:"linear-gradient(120deg, transparent 0 30%, #ffffffaa 30% 38%, transparent 38% 62%," +
       "#ffffff55 62% 68%, transparent 68%)," +
       "linear-gradient(180deg, #e6edf3 0%, #aab6c2 38%, #6e7a86 62%, #cdd7e0 100%)",
    r:[["fire","stone"]] },
  { id:"knife",   n:"Knife",       e:"\u{1F52A}", q:"The oldest tool that still lives in a drawer.",
    r:[["fire","metal"]] },
  { id:"axe",     n:"Axe",         e:"\u{1FA93}", q:"The first machine. Everything after is optimization.",
    r:[["wood","metal"]] },
  { id:"sand",    n:"Sand",        c:"#e0c078", q:"What mountains become, given enough wind.",
    bg:"radial-gradient(circle at 30% 30%, #fff2c8aa 0 3%, transparent 6%)," +
       "radial-gradient(circle at 70% 45%, #b98a4d88 0 3%, transparent 6%)," +
       "radial-gradient(circle at 45% 70%, #fff2c899 0 2.5%, transparent 5%)," +
       "linear-gradient(115deg, #ecd08a 0 54%, #d3ab5e 54% 100%)",
    r:[["earth","air"],["earth","sun"],["stone","air"]] },
  { id:"glass",   n:"Glass",       c:"#bfe6f2", q:"Sand, taught to tell the truth.",
    bg:"linear-gradient(135deg, transparent 0 28%, #ffffff99 28% 37%, transparent 37% 54%, #ffffff55 54% 60%, transparent 60% 100%)," +
       "linear-gradient(180deg, #d8f1f8 0%, #a8d8ea 60%, #8ec4dc 100%)",
    r:[["sand","fire"]] },
  { id:"mirror",  n:"Mirror",      e:"\u{1FA9E}", q:"Who's the Fairest of Them All?",
    r:[["glass","metal"]] },
  { id:"sun",     n:"Sun",         e:"☀️", q:"A very local star.",
    r:[["fire","sky"]] },
  // Black + Sky, so the gradient is exactly that: the day's blue at the top
  // edge, falling to the Black it was mixed with. Stars unchanged.
  { id:"night",   n:"Night",       c:"#4a7fd0", q:"The sky, resting.",
    bg:"radial-gradient(circle at 22% 28%, #fff 0 4%, transparent 8%)," +
       "radial-gradient(circle at 65% 16%, #fff 0 3%, transparent 6%)," +
       "radial-gradient(circle at 82% 52%, #ffffffcc 0 3.5%, transparent 7%)," +
       "radial-gradient(circle at 38% 62%, #ffffffbb 0 3%, transparent 6%)," +
       "radial-gradient(circle at 58% 84%, #fff 0 2.5%, transparent 5%)," +
       "radial-gradient(circle at 12% 76%, #ffffff99 0 3%, transparent 6%)," +
       "linear-gradient(160deg, #3f6ea8 0%, #16294d 45%, #04060c 100%)",
    r:[["black","sky"]] },
  { id:"star",    n:"Star",        e:"⭐", q:"A pinhole in the dark.",
    r:[["night","white"]] },
  { id:"moon",    n:"Moon",        e:"\u{1F319}", q:"Borrowed light, worn well.",
    r:[["night","sun"]] },
  { id:"cloud",   n:"Cloud",       e:"☁️", q:"A lake, daydreaming.",
    r:[["sky","water"],["water","air"]] },
  { id:"rain",    n:"Rain",        e:"\u{1F327}️", q:"The cloud, giving it all back.",
    r:[["cloud","water"]] },
  { id:"lightning",n:"Lightning",  e:"\u{1F329}️", q:"The sky, losing its temper.",
    r:[["cloud","electricity"]] },
  { id:"storm",   n:"Storm",       e:"\u{26C8}️", q:"The weather, done negotiating.",
    r:[["lightning","rain"]] },
  { id:"tornado", n:"Tornado",     e:"\u{1F32A}️", q:"Air, finally focused.",
    r:[["air","storm"]] },
  { id:"life",    n:"Life",        e:"\u{1F9EC}", q:"One spark in the right puddle, and here we all are.",
    r:[["lightning","water"]] },
  { id:"egg",     n:"Egg",         e:"\u{1F95A}", q:"Life, packed for the journey.",
    r:[["stone","life"]] },
  { id:"animal",  n:"Animal",      e:"\u{1F43E}", q:"Life, plus the decision to move.",
    r:[["earth","life"]] },
  { id:"lizard",  n:"Lizard",      e:"\u{1F98E}", q:"The first draft that never needed a second.",
    r:[["stone","animal"]] },
  { id:"horse",   n:"Horse",       e:"\u{1F434}", q:"My kingdom for a horse!",
    r:[["animal","field"]] },
  { id:"hippo",   n:"Hippo",       e:"\u{1F99B}", q:"River horse, and it means that literally.",
    r:[["horse","water"]] },
  { id:"wolf",    n:"Wolf",        e:"\u{1F43A}", q:"The animal that answered the moon.",
    r:[["animal","moon"]] },
  { id:"bone",    n:"Bone",        e:"\u{1F9B4}", q:"What the fire could not talk out of leaving.",
    r:[["animal","fire"],["wolf","fire"],["horse","fire"],["unicorn","fire"],
       ["bear","fire"],["polarbear","fire"],["dog","fire"],["cow","fire"],
       ["bear","horse"],["wolf","horse"],["bear","dog"]] },
  { id:"dog",     n:"Dog",         e:"\u{1F415}", q:"A wolf that decided to stay.",
    r:[["wolf","bone"],["dog","wolf"]] },
  { id:"cow",     n:"Cow",         e:"\u{1F404}", q:"A plant, on the long way round to milk.",
    r:[["animal","plant"]] },
  { id:"squirrel",n:"Squirrel",    e:"\u{1F43F}\u{FE0F}", q:"Buries more than it will ever dig up.",
    r:[["animal","tree"]] },
  { id:"bird",    n:"Bird",        e:"\u{1F426}", q:"The animal that gave up on the ground.",
    r:[["air","animal"],["air","penguin"]] },
  { id:"chick",   n:"Chick",       e:"\u{1F425}", q:"The egg, arguing its way out.",
    r:[["egg","bird"]] },
  { id:"penguin", n:"Penguin",     e:"\u{1F427}", q:"A bird that traded the sky for the sea.",
    r:[["bird","ice"]] },
  { id:"duck",    n:"Duck",        e:"\u{1F986}", q:"Kept the sky, took the water too.",
    r:[["bird","water"]] },
  { id:"fish",    n:"Fish",        e:"\u{1F41F}", q:"Life, never seeing the need to leave.",
    r:[["animal","water"]] },
  { id:"owl",     n:"Owl",         e:"\u{1F989}", q:"The night, keeping an eye on things.",
    r:[["bird","night"]] },
  { id:"phoenix", n:"Phoenix",     e:"\u{1F426}\u{200D}\u{1F525}", q:"From the ashes, a fire shall be woken",
    r:[["bird","fire"]] },
  { id:"bee",     n:"Bee",         e:"\u{1F41D}", q:"The flower's travel agent.",
    r:[["animal","flower"]] },
  { id:"honey",   n:"Honey",       e:"\u{1F36F}", q:"The one food that never spoils.",
    r:[["bee","flower"]] },
  { id:"bear",    n:"Bear",        e:"\u{1F43B}", q:"It found the honey. It always finds the honey.",
    r:[["animal","honey"]] },
  { id:"polarbear",n:"Polar Bear", e:"\u{1F43B}\u{200D}\u{2744}\u{FE0F}", q:"A bear that decided the winter was fine.",
    r:[["bear","ice"]] },
  { id:"acid",    n:"Acid",        e:"\u{1F9EA}", q:"Water that learned to bite.",
    r:[["green","water"]] },
  { id:"electricity",n:"Electricity", e:"⚡", q:"A slow argument between a metal and an acid.",
    r:[["acid","metal"]] },
  { id:"ice",     n:"Ice",         e:"\u{1F9CA}", q:"Water, holding its breath.",
    r:[["water","night"]] },
  { id:"snow",    n:"Snow",        e:"\u{1F328}️", q:"Rain that stopped to arrange itself.",
    r:[["cloud","ice"]] },
  // the one icon that has to show a mechanism: white light in, spectrum out
  { id:"prism",   n:"Prism",       c:"#bfe6f2", q:"It takes light apart to see how it works.",
    s:'<path d="M16 3 30 28H2Z" fill="#cfeaf544" stroke="#eaf8ff" stroke-width="1.6" stroke-linejoin="round"/>' +
      '<path d="M0 11h12" stroke="#fff" stroke-width="2.4"/>' +
      '<g stroke-width="2.4" stroke-linecap="round">' +
      '<path d="M22 15 32 7" stroke="#ff3b30"/><path d="M22 15 32 10" stroke="#ff9430"/>' +
      '<path d="M22 15 32 13" stroke="#ffdc32"/><path d="M22 15 32 16" stroke="#34d158"/>' +
      '<path d="M22 15 32 19" stroke="#33e9e9"/><path d="M22 15 32 22" stroke="#2f6bff"/>' +
      '<path d="M22 15 32 25" stroke="#9a4dff"/></g>',
    r:[["diamond","glass"]] },
  { id:"rainbow", n:"Rainbow",     e:"\u{1F308}", q:"White light, confessing everything.",
    r:[["white","prism"],["sun","rain"],["prism","sun"]] },
  { id:"magic",   n:"Magic",       e:"\u{1FA84}", q:"Science we haven't named yet.",
    r:[["wood","star"]] },
  { id:"crystalball",n:"Crystal Ball", e:"\u{1F52E}", q:"Glass that claims to have read ahead.",
    r:[["magic","glass"]] },
  { id:"unicorn", n:"Unicorn",     e:"\u{1F984}", q:"Always be yourself. Unless you can be a unicorn, then always be a unicorn.",
    r:[["horse","magic"]] },
  { id:"sunset",  n:"Sunset",      e:"\u{1F305}", q:"The sun's long goodbye.",
    r:[["sun","pink"]] },
  { id:"plant",   n:"Plant",       e:"\u{1F33F}", q:"Patience, photosynthesizing.",
    r:[["life","sun"],["green","life"]] },
  { id:"cactus",  n:"Cactus",      e:"\u{1F335}", q:"A plant that read the terms of the desert.",
    r:[["plant","sand"]] },
  // a horizon rather than an object: sky above, green below, hard stop between
  { id:"field",   n:"Field",       c:"#5fb54a", q:"Plants, as far as the argument goes.",
    bg:"linear-gradient(180deg, #a8dbff 0%, #7ec8ff 46%, #5fb54a 46%, #3f8c36 100%)",
    r:[["earth","plant"]] },
  { id:"park",    n:"Park",        e:"\u{1F3DE}\u{FE0F}", q:"A field with a fence and an opinion about litter.",
    r:[["field","water"]] },
  { id:"tree",    n:"Tree",        e:"\u{1F333}", q:"A century of standing still, on purpose.",
    r:[["water","plant"]] },
  { id:"fruit",   n:"Fruit",       e:"\u{1F34E}", q:"A tree, bribing something to carry its seeds.",
    r:[["tree","sun"]] },
  { id:"wood",    n:"Wood",        e:"\u{1FAB5}", q:"A tree, minus the patience.",
    r:[["tree","knife"],["axe","tree"]] },
  { id:"charcoal",n:"Charcoal",    c:"#8a3a14", q:"Wood, with everything unnecessary burned away.",
    bg:"radial-gradient(circle at 34% 38%, #7c3312cc 0 4%, transparent 8%)," +
       "radial-gradient(circle at 68% 66%, #6b2a10aa 0 3%, transparent 7%)," +
       "linear-gradient(125deg, #2c2c2f 0 28%, #171719 28% 44%, #333338 44% 60%," +
       "#1b1b1e 60% 78%, #27272b 78% 100%)",
    r:[["wood","fire"],["tree","fire"]] },
  { id:"pencil",  n:"Pencil",      e:"\u{270F}\u{FE0F}", q:"A tree and a fire, arguing on paper.",
    r:[["wood","charcoal"]] },
  // The one color no amount of mixing light can reach, so it arrives through
  // the materials instead. A plain black square would vanish into the tile, so
  // the swatch keeps a soft top-left sheen and lends a grey — not black — glow.
  { id:"black",   n:"Black",       c:"#5b6472", q:"No light at all, which took some arranging.",
    bg:"radial-gradient(circle at 30% 26%, #2a2f3a 0 18%, transparent 42%)," +
       "linear-gradient(155deg, #17191f 0%, #0a0b0e 55%, #000000 100%)",
    r:[["charcoal","stone"]] },
  { id:"grey",    n:"Grey",        c:"#7f8894", q:"The average of every argument.",
    r:[["black","white"]] },
  { id:"diamond", n:"Diamond",     e:"\u{1F48E}", q:"Carbon, under enough pressure to become interesting.",
    r:[["charcoal","lava"]] },
  { id:"flower",  n:"Flower",      e:"\u{1F338}", q:"The plant, showing off.",
    r:[["plant","pink"]] },
  { id:"sunflower",n:"Sunflower",  e:"\u{1F33B}", q:"A flower with a favorite.",
    r:[["sun","flower"],["flower","yellow"]] },
];

export const STARTERS = ["red", "green", "blue"];

export const BY_ID: Record<string, ElementDef> = {};
ELEMENTS.forEach(e => (BY_ID[e.id] = e));

// "a+b" (ids sorted) -> result id
export const RECIPE: Record<string, string> = {};
ELEMENTS.forEach(e => (e.r || []).forEach(p => (RECIPE[[...p].sort().join("+")] = e.id)));

export const N = (id: string): string => BY_ID[id].n;
