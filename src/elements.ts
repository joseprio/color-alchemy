// The element tree. n = display name, q = quote (shown once, on discovery),
// c = color swatch (spec: colors are plain squares; with bg set it is only
// the glow color), bg = custom swatch background (any CSS background stack —
// Night layers percentage-sized star dots over a blue-to-black gradient so it scales
// from the 18px encyclopedia icon to the 56px discovery card), e = emoji icon,
// s = inline SVG body drawn on a 0 0 32 32 viewBox (for an icon no emoji and no
// gradient stack can express — it renders as an <svg class="s">, so it picks up
// every size rule the square swatches use, and c still supplies the glow),
// r = recipes (unordered pairs of ids); several recipes may make one element
// (Bone has eleven routes — a four-legged creature and fire, or a predator and
// what it caught; fire does not reduce the fish or the bee at all, and a Bird
// answers it with a Phoenix; the Cloud has five, and every one of them is water
// meeting warmth or height; the Fire has five too — Matter or Air, taken with
// either of the two warm colours, plus a fire fanned by more Air; Ash and
// Rainbow have four; Chick, Glass, Ice, Plant, Polar Bear, Sand, Stone and
// White three; Bird, Black, Charcoal, Diamond, Dog, Lava, Lizard, Magic,
// Matter, Night, Phoenix, Prism, Sky, Storm, Sunflower, Unicorn and Water two
// each — the Unicorn takes its Magic from a Horse or from a plain
// Animal, a Diamond comes out of a Lava or the Volcano it came from, and the
// Night falls out of a Violet sky as readily as a Black one.
// A TOOL is the other half of four of those: it cuts the Wood, it grinds a
// Stone into Sand, it works a Charcoal into Black, and it cuts a Glass into a
// Prism. The first three are ties or long ways round; the PRISM is the one
// genuine shortcut in the table — 15 moves through the Tool where the Diamond
// route needs 24 — and it is deliberate, so do not price it as flavour.)
// MATTER IS THE THROAT OF THE WHOLE TREE, and that is deliberate rather than
// accidental — worth knowing before anything is rewired around it. It is made
// from two COMPLEMENTARY pairs (Violet + Yellow, Orange + Blue), and it hands
// three of the four classical elements straight back out when a colour is
// added: Brown for Earth, White for Air, Blue for Water. All three of those
// are now its SOLE route — green + orange belongs to Brown, blue + white is
// gone, blue + cyan is gone — so 88 of the 101 elements are unreachable until
// Matter is found. What is left without it is the 13 pure colours and Gold.
// Fire is the one classical element it does not make; that is the gap if this
// ever grows a fourth.
// An alternate may be cyclic — Fire + Ice remakes Water, which Ice needs,
// Penguin + Air hands back the Bird the Penguin came from, Wolf + Dog is just
// another Dog, Fire + Air is a fanned fire and nothing more, Lizard + Egg
// hatches another Lizard, and Lava + Stone just melts the Stone back into
// more Lava — it is flavor for a pair players try, never a cheaper route.
// n is OPTIONAL in the table below: for 98 of the 101 it is just the id with a
// capital, and writing it out again is the one field roadroller genuinely pays
// for — a near-miss repeat of a string it has already seen costs real bits,
// where an exact repeat (an id inside a recipe) costs almost none. Omitting the
// derivable ones is worth ~380 B packed. Filled in below, so every consumer
// still sees a plain string.
interface RawDef {
  id: string;
  n?: string;
  q: string;
  c?: string;
  bg?: string;
  e?: string;
  s?: string;
  r?: [string, string][];
}
export interface ElementDef extends RawDef { n: string }

export const ELEMENTS = ([
  { id:"red", c:"#ff3b30", q:"All hands to battle stations!" },
  { id:"green", c:"#34d158", q:"In every wood, in every spring, there is a different green." },
  { id:"blue", c:"#2f6bff", q:"The closest color to truth." },
  { id:"yellow", c:"#ffdc32", q:"Pikachu, I choose you!",
    r:[["red","green"]] },
  { id:"magenta", c:"#ff44ff", q:"The fire that red attempts to be, and purple secretly desires.",
    r:[["red","blue"]] },
  { id:"cyan", c:"#33e9e9", q:"Cyan is sus",
    r:[["green","blue"]] },
  { id:"white", c:"#ffffff", q:"Let there be light.",
    r:[["blue","yellow"],["red","cyan"],["green","magenta"]] },
  { id:"orange", c:"#ff9430", q:"The new black.",
    r:[["red","yellow"]] },
  { id:"violet", c:"#9a4dff", q:"The last color of the rainbow.",
    r:[["blue","magenta"]] },
  { id:"indigo", c:"#4a30d8", q:"Here because Newton insisted.",
    r:[["blue","violet"]] },
  { id:"pink", c:"#ffa8c5", q:"You can never go wrong with a little pink, a lot works too.",
    r:[["red","white"]] },
  // Brown TAKES the pair Earth used to own. Earth is not lost: it comes back
  // below as Brown + Matter, which is the only reason this swap is safe —
  // green + orange was Earth's single route, and 72 of the elements after it
  // are downstream of Earth.
  { id:"brown", c:"#8b5a2b", q:"The very shade of earth itself.",
    r:[["green","orange"]] },
  // Both routes are a COMPLEMENTARY PAIR — violet against yellow, orange
  // against blue — which is the whole idea: the two halves of the colour wheel
  // cancelling out and leaving something with weight instead of light. Placed
  // here rather than by depth because every string it uses (the two hexes, the
  // four ingredient ids) is already in this stretch of the table, and an exact
  // repeat costs roadroller almost nothing.
  { id:"matter", c:"#7ec8ff", q:"Energy waiting to happen.",
    s:"<g transform='translate(16 16)' fill='none' stroke='#7ec8ff' stroke-width='2'>" +
      "<ellipse rx='13' ry='5'/>" +
      "<ellipse rx='13' ry='5' transform='rotate(60)'/>" +
      "<ellipse rx='13' ry='5' transform='rotate(-60)'/>" +
      "<circle r='4' fill='#eaf8ff' stroke='none'/></g>",
    r:[["violet","yellow"],["blue","orange"]] },
  { id:"air", e:"\u{1F4A8}", q:"The air is full of ideas. They are knocking you in the head all the time.",
    r:[["white","matter"]] },
  { id:"sky", c:"#7ec8ff", q:"Only from the heart can you touch the sky.",
    bg:"radial-gradient(circle at 68% 30%, #fff3a0 0 6%, #ffdc32 6% 13%, transparent 17%)," +
       "radial-gradient(circle at 68% 30%, #ffdc3244 0 22%, transparent 30%)," +
       "linear-gradient(180deg, #a8dbff 0%, #7ec8ff 55%, #4f9fe8 100%)",
    r:[["air","blue"],["air","cyan"]] },
  { id:"gold", c:"#f7c948", q:"Gold can do much, but love can do all.",
    r:[["yellow","orange"]] },
  { id:"water", e:"\u{1F4A7}", q:"Be like water, my friend.",
    r:[["blue","matter"],["fire","ice"]] },
  { id:"fire", e:"\u{1F525}", q:"Fire transforms all things it touches.",
    r:[["red","matter"],["orange","matter"],["red","air"],["orange","air"],["fire","air"]] },
  { id:"earth", c:"#a4713f", q:"Keep your feet on the ground and keep reaching for the stars.",
    bg:"radial-gradient(circle at 30% 35%, #7a4a26cc 0 5%, transparent 9%)," +
       "radial-gradient(circle at 62% 60%, #5c3a1e 0 4%, transparent 8%)," +
       "radial-gradient(circle at 78% 28%, #b98a55 0 4%, transparent 8%)," +
       "radial-gradient(circle at 42% 78%, #5c3a1e 0 4.5%, transparent 8%)," +
       "radial-gradient(circle at 15% 65%, #b98a55aa 0 3.5%, transparent 7%)," +
       "linear-gradient(180deg, #a4713f 0%, #7c5230 55%, #59391f 100%)",
    r:[["brown","matter"]] },
  { id:"clay", c:"#c1663c", q:"Shape clay into a vessel; it is the space within that makes it useful.",
    bg:"radial-gradient(circle at 33% 26%, #ffc49faa 0 11%, transparent 32%),"
       + "linear-gradient(150deg, #d4794c 0%, #c1663c 46%, #8f4526 100%)",
    r:[["earth","water"]] },
  { id:"pottery", e:"\u{1F3FA}", q:"Who is the Potter, pray, and who the Pot?",
    r:[["clay","fire"]] },
  { id:"beer", e:"\u{1F37A}", q:"Beer is proof that God loves us and wants us to be happy.",
    r:[["gold","water"]] },
  { id:"wine", e:"\u{1F377}", q:"Wine is sunlight, held together by water.",
    r:[["red","water"]] },
  { id:"lava", c:"#ff5a1f", q:"The floor is lava!",
    bg:"radial-gradient(circle at 27% 32%, #ffe08a 0 3.5%, transparent 7%)," +
       "radial-gradient(circle at 72% 62%, #ffc04dcc 0 4%, transparent 8%)," +
       "linear-gradient(108deg, #2b0e07 0 14%, transparent 14% 27%, #1f0905 27% 35%," +
       "transparent 35% 58%, #2b0e07 58% 68%, transparent 68% 84%, #1f0905 84% 92%, transparent 92%)," +
       "linear-gradient(180deg, #ffb020 0%, #ff5a1f 45%, #a32206 100%)",
    r:[["earth","fire"],["lava","stone"]] },
  { id:"volcano", e:"\u{1F30B}", q:"A cannon of immense size.",
    r:[["lava","earth"]] },
  { id:"stone", e:"\u{1FAA8}", q:"Every stone holds a statue; the sculptor merely reveals it.",
    r:[["lava","water"],["lava","rain"],["lava","air"]] },
  { id:"metal", c:"#c3ced9", q:"Soft enough to wire, hard enough to shield, liquid enough to pour.",
    bg:"linear-gradient(120deg, transparent 0 30%, #ffffffaa 30% 38%, transparent 38% 62%," +
       "#ffffff55 62% 68%, transparent 68%)," +
       "linear-gradient(180deg, #e6edf3 0%, #aab6c2 38%, #6e7a86 62%, #cdd7e0 100%)",
    r:[["fire","stone"]] },
  { id:"tool", e:"\u{1F6E0}\u{FE0F}", q:"We shape our tools, and thereafter our tools shape us.",
    r:[["fire","metal"]] },
  { id:"sand", c:"#e0c078", q:"It's coarse and rough and irritating and it gets everywhere.",
    bg:"radial-gradient(circle at 30% 30%, #fff2c8aa 0 3%, transparent 6%)," +
       "radial-gradient(circle at 70% 45%, #b98a4d88 0 3%, transparent 6%)," +
       "radial-gradient(circle at 45% 70%, #fff2c899 0 2.5%, transparent 5%)," +
       "linear-gradient(115deg, #ecd08a 0 54%, #d3ab5e 54% 100%)",
    r:[["earth","air"],["stone","air"],["stone","tool"]] },
  { id:"glass", c:"#bfe6f2", q:"Glass, china, and reputation are easily cracked, and never well mended.",
    bg:"linear-gradient(135deg, transparent 0 28%, #ffffff99 28% 37%, transparent 37% 54%, #ffffff55 54% 60%, transparent 60% 100%)," +
       "linear-gradient(180deg, #d8f1f8 0%, #a8d8ea 60%, #8ec4dc 100%)",
    r:[["sand","fire"],["sand","electricity"],["sand","lightning"]] },
  { id:"mirror", e:"\u{1FA9E}", q:"Who's the Fairest of Them All?",
    r:[["glass","metal"]] },
  { id:"hourglass", e:"⌛", q:"Like sands through the hourglass, so are the days of our lives.",
    r:[["glass","sand"]] },
  { id:"sun", e:"☀️", q:"Even the darkest night will end and the sun will rise.",
    r:[["fire","sky"]] },
  // Violet + Sky or Black + Sky, and the gradient is exactly that: the violet
  // at the top edge, falling to the Black the other route mixed in. Stars
  // unchanged.
  { id:"night", c:"#8a56e0", q:"A world lit by itself.",
    bg:"radial-gradient(circle at 22% 28%, #fff 0 4%, transparent 8%)," +
       "radial-gradient(circle at 65% 16%, #fff 0 3%, transparent 6%)," +
       "radial-gradient(circle at 82% 52%, #ffffffcc 0 3.5%, transparent 7%)," +
       "radial-gradient(circle at 38% 62%, #ffffffbb 0 3%, transparent 6%)," +
       "radial-gradient(circle at 58% 84%, #fff 0 2.5%, transparent 5%)," +
       "radial-gradient(circle at 12% 76%, #ffffff99 0 3%, transparent 6%)," +
       "linear-gradient(160deg, #7b3fd0 0%, #241047 45%, #04060c 100%)",
    r:[["black","sky"],["violet","sky"]] },
  { id:"star", e:"⭐", q:"The forget-me-nots of the angels.",
    r:[["night","white"]] },
  { id:"moon", e:"\u{1F319}", q:"Everyone is a moon, and has a dark side which he never shows to anybody.",
    r:[["night","sun"]] },
  { id:"cloud", e:"☁️", q:"Resembles the thoughts in our mind! Both change from second to second!",
    r:[["sky","water"],["water","air"],["grey","sky"],["fire","water"],["sun","water"]] },
  { id:"rain", e:"\u{1F327}️", q:"If you want the rainbow, you have to put up with the rain.",
    r:[["cloud","water"]] },
  { id:"lightning", e:"\u{1F329}️", q:"Never strikes twice.",
    r:[["cloud","electricity"]] },
  { id:"storm", e:"\u{26C8}️", q:"It was the most terrible, yet majestic spectacle.",
    r:[["lightning","rain"],["electricity","rain"]] },
  { id:"tornado", e:"\u{1F32A}️", q:"I've a feeling we're not in Kansas anymore.",
    r:[["air","storm"]] },
  { id:"life", e:"\u{1F9EC}", q:"It finds a way.",
    r:[["lightning","water"]] },
  { id:"egg", e:"\u{1F95A}", q:"Which came first?",
    r:[["stone","life"]] },
  { id:"animal", e:"\u{1F43E}", q:"All animals are equal, but some are more equal than others.",
    r:[["earth","life"]] },
  { id:"lizard", e:"\u{1F98E}", q:"Life's better on a warm rock.",
    r:[["stone","animal"],["egg","lizard"]] },
  { id:"horse", e:"\u{1F434}", q:"My kingdom for a horse!",
    r:[["animal","field"]] },
  { id:"hippo", e:"\u{1F99B}", q:"The world's most dangerous couch potato.",
    r:[["horse","water"]] },
  { id:"wolf", e:"\u{1F43A}", q:"If you live with wolves, you must learn to howl.",
    r:[["animal","moon"]] },
  { id:"fox", e:"\u{1F98A}", q:"The fox changes his skin, but not his habits.",
    r:[["orange","wolf"]] },
  { id:"bone", e:"\u{1F9B4}", q:"Flesh decays; bone endures.",
    r:[["animal","fire"],["wolf","fire"],["horse","fire"],["unicorn","fire"],
       ["bear","fire"],["polarbear","fire"],["dog","fire"],["cow","fire"],
       ["bear","horse"],["wolf","horse"],["bear","dog"]] },
  { id:"dog", e:"\u{1F415}", q:"The more I learn about people, the more I like my dog.",
    r:[["wolf","bone"],["dog","wolf"]] },
  { id:"cow", e:"\u{1F404}", q:"One end is moo, the other, milk.",
    r:[["animal","plant"]] },
  { id:"milk", e:"\u{1F95B}", q:"Got milk?",
    r:[["cow","water"]] },
  { id:"cheese", e:"\u{1F9C0}", q:"The nectar of the Gods.",
    r:[["acid","milk"]] },
  { id:"squirrel", e:"\u{1F43F}\u{FE0F}", q:"You can't keep a squirrel on the ground.",
    r:[["animal","tree"]] },
  { id:"bird", e:"\u{1F426}", q:"To have faith is to have wings.",
    r:[["air","animal"],["air","penguin"]] },
  { id:"chick", e:"\u{1F425}", q:"Are you my mother?",
    r:[["egg","bird"],["duck","egg"],["egg","flamingo"]] },
  { id:"penguin", e:"\u{1F427}", q:"Always dressed to impress and ready for any occasion.",
    r:[["bird","ice"]] },
  { id:"duck", e:"\u{1F986}", q:"If it looks like a duck and quacks like a duck, it's a duck.",
    r:[["bird","water"]] },
  { id:"fish", e:"\u{1F41F}", q:"So long, and thanks for all the fish.",
    r:[["animal","water"]] },
  { id:"owl", e:"\u{1F989}", q:"Spanish or Vanish",
    r:[["bird","night"]] },
  { id:"flamingo", e:"\u{1F9A9}", q:"Be a flamingo in a flock of pigeons.",
    r:[["bird","pink"]] },
  { id:"peacock", e:"\u{1F99A}", q:"I'm a peacock, you gotta let me fly!",
    r:[["bird","rainbow"]] },
  { id:"phoenix", e:"\u{1F426}\u{200D}\u{1F525}", q:"From the ashes, a fire shall be woken",
    r:[["bird","fire"],["ash","fire"]] },
  { id:"bee", e:"\u{1F41D}", q:"Busy bees make more honey.",
    r:[["animal","flower"]] },
  { id:"honey", e:"\u{1F36F}", q:"Life is the flower for which love is the honey.",
    r:[["bee","flower"]] },
  { id:"bear", e:"\u{1F43B}", q:"Sometimes you eat the bear, and sometimes the bear eats you.",
    r:[["animal","honey"]] },
  { id:"polarbear",n:"Polar Bear", e:"\u{1F43B}\u{200D}\u{2744}\u{FE0F}", q:"The undisputed king of the ice.",
    r:[["bear","ice"],["bear","snow"],["bear","white"]] },
  { id:"acid", e:"\u{1F9EA}", q:"Water that bites.",
    r:[["green","water"]] },
  { id:"electricity", e:"⚡", q:"So subtle and powerful that it seems to be the very soul of the universe.",
    r:[["acid","metal"]] },
  { id:"lightbulb", n:"Light Bulb", e:"\u{1F4A1}", q:"I have not failed. I've just found 10,000 ways that won't work.",
    r:[["electricity","glass"]] },
  { id:"ice", e:"\u{1F9CA}", q:"Let it go!",
    r:[["cyan","water"],["white","water"],["water","night"]] },
  { id:"snow", e:"\u{1F328}️", q:"Winter is coming.",
    r:[["cloud","ice"]] },
  // the one icon that has to show a mechanism: white light in, spectrum out
  { id:"prism", c:"#bfe6f2", q:"Every eye is a different prism, showing a different world.",
    s:'<path d="M16 3 30 28H2Z" fill="#cfeaf544" stroke="#eaf8ff" stroke-width="1.6" stroke-linejoin="round"/>' +
      '<path d="M0 11h12" stroke="#fff" stroke-width="2.4"/>' +
      '<g stroke-width="2.4" stroke-linecap="round">' +
      '<path d="M22 15 32 7" stroke="#ff3b30"/><path d="M22 15 32 10" stroke="#ff9430"/>' +
      '<path d="M22 15 32 13" stroke="#ffdc32"/><path d="M22 15 32 16" stroke="#34d158"/>' +
      '<path d="M22 15 32 19" stroke="#33e9e9"/><path d="M22 15 32 22" stroke="#2f6bff"/>' +
      '<path d="M22 15 32 25" stroke="#9a4dff"/></g>',
    r:[["diamond","glass"],["glass","tool"]] },
  { id:"rainbow", e:"\u{1F308}", q:"Somewhere over the rainbow, skies are blue.",
    r:[["white","prism"],["sun","rain"],["prism","sun"],
       ["lightbulb","prism"]] },
  { id:"magic", e:"\u{1FA84}", q:"Any sufficiently advanced technology is indistinguishable from magic.",
    r:[["wood","star"],["pumpkin","night"]] },
  { id:"crystalball",n:"Crystal Ball", e:"\u{1F52E}", q:"Reply hazy, try again.",
    r:[["magic","glass"]] },
  { id:"unicorn", e:"\u{1F984}", q:"Always be yourself. Unless you can be a unicorn, then always be a unicorn.",
    r:[["horse","magic"],["animal","magic"]] },
  { id:"plant", e:"\u{1F33F}", q:"Grow where you are planted.",
    r:[["earth","sun"],["life","sun"],["green","life"]] },
  { id:"cactus", e:"\u{1F335}", q:"Adapt to your environment, grow thick skin, and stay sharp.",
    r:[["plant","sand"]] },
  // a horizon rather than an object: sky above, green below, hard stop between
  { id:"field", c:"#5fb54a", q:"Pray for a good harvest, but keep on plowing.",
    bg:"linear-gradient(180deg, #a8dbff 0%, #7ec8ff 46%, #5fb54a 46%, #3f8c36 100%)",
    r:[["earth","plant"]] },
  { id:"park", e:"\u{1F3DE}\u{FE0F}", q:"Not an island of nature, but a bridge connecting humans back to it.",
    r:[["field","water"]] },
  { id:"tree", e:"\u{1F333}", q:"He who plants a tree, plants a hope.",
    r:[["water","plant"]] },
  { id:"fruit", e:"\u{1F34E}", q:"An apple a day keeps the doctor away.",
    r:[["tree","sun"]] },
  { id:"pumpkin", e:"\u{1F383}", q:"Trick or treat!",
    r:[["fruit","orange"]] },
  { id:"wood", e:"\u{1FAB5}", q:"Chop your own wood and it will warm you twice.",
    r:[["tree","tool"]] },
  { id:"charcoal", c:"#8a3a14", q:"Charcoal never forgets that it was once wood.",
    bg:"radial-gradient(circle at 34% 38%, #7c3312cc 0 4%, transparent 8%)," +
       "radial-gradient(circle at 68% 66%, #6b2a10aa 0 3%, transparent 7%)," +
       "linear-gradient(125deg, #2c2c2f 0 28%, #171719 28% 44%, #333338 44% 60%," +
       "#1b1b1e 60% 78%, #27272b 78% 100%)",
    r:[["wood","fire"],["tree","fire"]] },
  // Charcoal taken one burn further: a pale, cold powder, so the swatch drops
  // charcoal's brown embers for a grey drift and keeps one dying ember in it.
  { id:"ash", c:"#b9b3ad", q:"Ashes to ashes, dust to dust.",
    bg:"radial-gradient(circle at 28% 30%, #efece8cc 0 6%, transparent 12%)," +
       "radial-gradient(circle at 70% 64%, #ff6a2aaa 0 3%, transparent 8%)," +
       "linear-gradient(140deg, #b3aca4 0%, #8a827b 46%, #625b55 100%)",
    r:[["charcoal","fire"],["bone","fire"],["fire","paper"],
       ["book","fire"]] },
  { id:"mushroom", e:"\u{1F344}", q:"All are edible, but some only once.",
    r:[["rain","wood"]] },
  { id:"pencil", e:"\u{270F}\u{FE0F}", q:"A pencil and a dream can take you anywhere.",
    r:[["wood","charcoal"]] },
  { id:"paper", e:"\u{1F4C4}", q:"Paper has more patience than people.",
    r:[["stone","tree"]] },
  { id:"book", e:"\u{1F4D6}", q:"A room without books is like a body without a soul.",
    r:[["paper","pencil"]] },
  { id:"palette", e:"\u{1F3A8}", q:"I dream of painting and then I paint my dream.",
    r:[["paper","rainbow"]] },
  { id:"kite", e:"\u{1FA81}", q:"Kites rise highest against the wind, not with it.",
    r:[["air","paper"]] },
  // The one color no amount of mixing light can reach, so it arrives through
  // the materials instead. A plain black square would vanish into the tile, so
  // the swatch keeps a soft top-left sheen and lends a grey — not black — glow.
  { id:"black", c:"#5b6472", q:"Only in the darkness can you see the stars.",
    bg:"radial-gradient(circle at 30% 26%, #2a2f3a 0 18%, transparent 42%)," +
       "linear-gradient(155deg, #17191f 0%, #0a0b0e 55%, #000000 100%)",
    r:[["charcoal","stone"],["charcoal","tool"]] },
  { id:"grey", c:"#7f8894", q:"A gray day provides the best light.",
    r:[["black","white"]] },
  { id:"diamond", e:"\u{1F48E}", q:"Life tries to crush you, but you choose whether to become dust or a diamond.",
    r:[["charcoal","lava"],["volcano","charcoal"]] },
  { id:"ring", e:"\u{1F48D}", q:"One ring to bring them all, and in the darkness bind them.",
    r:[["metal","diamond"]] },
  { id:"flower", e:"\u{1F338}", q:"Where flowers bloom so does hope.",
    r:[["plant","pink"]] },
  { id:"sunflower", e:"\u{1F33B}", q:"Wherever the sun goes, the sunflower will follow.",
    r:[["sun","flower"],["flower","yellow"]] },
  { id:"rose", e:"\u{1F339}", q:"A rose by any other name would smell as sweet.",
    r:[["flower","red"]] },
] as RawDef[]).map(e => (e.n = e.n || e.id[0].toUpperCase() + e.id.slice(1), e)) as ElementDef[];

export const STARTERS = ["red", "green", "blue"];

export const BY_ID: Record<string, ElementDef> = {};
ELEMENTS.map(e => (BY_ID[e.id] = e));

// "a+b" (ids sorted) -> result id
export const RECIPE: Record<string, string> = {};
ELEMENTS.map(e => (e.r || []).map(p => (RECIPE[[...p].sort().join("+")] = e.id)));

export const N = (id: string): string => BY_ID[id].n;
