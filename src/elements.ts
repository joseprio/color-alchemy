// The element tree. n = display name, c = color swatch (spec: colors are plain
// squares; with bg set it is only the glow color), bg = custom swatch background (any CSS background stack —
// Night layers percentage-sized star dots over a blue-to-black gradient so it scales
// from the 18px encyclopedia icon to the 56px discovery card), e = emoji icon,
// s = inline SVG body drawn on a 0 0 32 32 viewBox (for an icon no emoji and no
// gradient stack can express — it renders as an <svg class="s">, so it picks up
// every size rule the square swatches use, and c still supplies the glow),
// r = recipes (unordered pairs of ids); several recipes may make one element
// (Bone has eleven routes — a four-legged creature and fire, or a predator and
// what it caught; fire does not reduce the fish or the bee at all, and a Bird
// answers it with a Phoenix; the Fire has seven — Matter or Air, taken with
// either of the two warm colours, those same two colours put to standing Wood,
// plus a fire fanned by more Air; the Cloud has five, and every one of them is
// still water meeting warmth or height; Ash, Black, Lava, Polar Bear, Rainbow,
// Sand and Stone have four; Charcoal, Chick, Clay, Glass, Ice, Lightning,
// Lizard, Magic, Plant, Prism, Water and White three; Bee, Bird, Cactus,
// Cheese, Crystal Ball, Diamond, Dog, Field, Fish, Fox, Gold, Life, Matter,
// Mirror, Night, Paper, Penguin, Phoenix, Rose, Sky, Snow, Star, Storm, Sun,
// Sunflower, Unicorn and Wood two each — the Unicorn takes its Magic from a
// Horse or from a plain Animal, a Diamond comes out of a Lava or the Volcano
// it came from, and the Night falls out of a Violet sky as readily as a Black
// one.
// A PLAIN COLOUR IS THE CHEAPEST SECOND INGREDIENT there is — every one of the
// thirteen sits within three moves of the starters — so a colour laid on a
// thing is the shortcut wherever the table offers one, and that is the
// through-line of most of the alternates: Yellow on Earth is Sand in 6 against
// the Air route's 8, Green on Earth a Field in 6 against 12, White on Glass a
// Prism in 10 against 14, Yellow on a Cloud is Lightning in 7 against 14,
// White on an Animal a Polar Bear in 13 against 21. The one that runs the
// other way is deliberate flavour: Grey + Matter is Stone in 16, where
// Lava + Water needs 9.
// COLOURS COME IN PAIRS, and the table mirrors them wherever the idea is the
// same on both sides: Red and Orange both light Matter, Air and standing Wood,
// and both melt a Stone to Lava; Grey and White both hang a Cloud on the Sky;
// White and Cyan both freeze Water. When a warm or a pale colour gains a
// recipe, look for the twin before deciding it is finished.
// A TOOL is the other half of four recipes — it cuts the Wood, it grinds a
// Stone into Sand, it works a Charcoal into Black, and it cuts a Glass into a
// Prism — and since the colours arrived NONE of the four is the cheap way any
// more: the Prism it used to shortcut to in 14 is 10 through White, the Sand
// 6 through Yellow, the Wood 12 through Brown, the Black 14 through Earth.
// The Tool is flavour end to end now; price it that way.)
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
// An alternate may be cyclic — Fire + Ice remakes Water, and so does Sun +
// Ice, which is the same melt by the other warmth; Water is what Ice needs,
// Penguin + Air hands back the Bird the Penguin came from, Wolf + Dog is just
// another Dog, Fire + Air is a fanned fire and nothing more, Lizard + Egg
// hatches another Lizard, and Lava + Stone just melts the Stone back into
// more Lava — it is flavor for a pair players try, never a cheaper route.
// MAGIC AND THE CRYSTAL BALL ARE MUTUALLY CYCLIC, which is a different thing
// from the self-loops above: Magic + Glass makes the Ball, and the Ball + a
// Rainbow makes Magic. Two elements, each on a path back to the other, and
// neither pair is a self-loop. It resolves because BOTH ends keep a route
// that does not run through the other — Magic from Wood + Star and from
// Pumpkin + Night, the Ball from Violet + Glass — and only ONE of those three
// has to survive for the cycle to stay solvable. Measured: drop Violet +
// Glass alone and everything still resolves; drop both of Magic's other two
// and everything still resolves; drop ALL THREE and Magic, the Crystal Ball
// and the Unicorn downstream of them all go unreachable together, because
// each end would then be reachable only from the other and the solver drops
// the loop rather than entering it. That is the invariant to preserve if this
// corner is ever rewired: one independent way in, somewhere in the pair.
// n is OPTIONAL in the table below: for 98 of the 101 it is just the id with a
// capital, and writing it out again is the one field roadroller genuinely pays
// for — a near-miss repeat of a string it has already seen costs real bits,
// where an exact repeat (an id inside a recipe) costs almost none. Omitting the
// derivable ones is worth ~380 B packed. Filled in below, so every consumer
// still sees a plain string.
// THE QUOTES ARE NOT HERE. There was a `q` on every row once; a field on a live
// object is reachable, so closure could not drop 101 strings a shipping build
// has no room for. They are src/quotes.ts, behind __DIRECTOR__, and only the
// director's cut carries them.
interface RawDef {
  id: string;
  n?: string;
  c?: string;
  bg?: string;
  e?: string;
  s?: string;
  r?: [string, string][];
}
export interface ElementDef extends RawDef { n: string }

export const ELEMENTS = ([
  { id:"red", c:"#ff3b30" },
  { id:"green", c:"#34d158" },
  { id:"blue", c:"#2f6bff" },
  { id:"yellow", c:"#ffdc32",
    r:[["red","green"]] },
  { id:"magenta", c:"#ff44ff",
    r:[["red","blue"]] },
  { id:"cyan", c:"#33e9e9",
    r:[["green","blue"]] },
  { id:"white", c:"#ffffff",
    r:[["blue","yellow"],["red","cyan"],["green","magenta"]] },
  { id:"orange", c:"#ff9430",
    r:[["red","yellow"]] },
  { id:"violet", c:"#9a4dff",
    r:[["blue","magenta"]] },
  { id:"indigo", c:"#4a30d8",
    r:[["blue","violet"]] },
  { id:"pink", c:"#ffa8c5",
    r:[["red","white"]] },
  // Brown TAKES the pair Earth used to own. Earth is not lost: it comes back
  // below as Brown + Matter, which is the only reason this swap is safe —
  // green + orange was Earth's single route, and 72 of the elements after it
  // are downstream of Earth.
  { id:"brown", c:"#8b5a2b",
    r:[["green","orange"]] },
  // Both routes are a COMPLEMENTARY PAIR — violet against yellow, orange
  // against blue — which is the whole idea: the two halves of the colour wheel
  // cancelling out and leaving something with weight instead of light. Placed
  // here rather than by depth because every string it uses (the two hexes, the
  // four ingredient ids) is already in this stretch of the table, and an exact
  // repeat costs roadroller almost nothing.
  { id:"matter", c:"#7ec8ff",
    s:"<g transform='translate(16 16)' fill='none' stroke='#7ec8ff' stroke-width='2'>" +
      "<ellipse rx='13' ry='5'/>" +
      "<ellipse rx='13' ry='5' transform='rotate(60)'/>" +
      "<ellipse rx='13' ry='5' transform='rotate(-60)'/>" +
      "<circle r='4' fill='#eaf8ff' stroke='none'/></g>",
    r:[["violet","yellow"],["blue","orange"]] },
  { id:"air", e:"\u{1F4A8}",
    r:[["white","matter"]] },
  { id:"sky", c:"#7ec8ff",
    bg:"radial-gradient(circle at 68% 30%, #fff3a0 0 6%, #ffdc32 6% 13%, transparent 17%)," +
       "radial-gradient(circle at 68% 30%, #ffdc3244 0 22%, transparent 30%)," +
       "linear-gradient(180deg, #a8dbff 0%, #7ec8ff 55%, #4f9fe8 100%)",
    r:[["air","blue"],["air","cyan"]] },
  { id:"gold", c:"#f7c948",
    r:[["yellow","orange"],["metal","yellow"]] },
  { id:"water", e:"\u{1F4A7}",
    r:[["blue","matter"],["fire","ice"],["ice","sun"]] },
  { id:"fire", e:"\u{1F525}",
    r:[["red","matter"],["orange","matter"],["red","air"],["orange","air"],
       ["red","wood"],["orange","wood"],["fire","air"]] },
  { id:"earth", c:"#a4713f",
    bg:"radial-gradient(circle at 30% 35%, #7a4a26cc 0 5%, transparent 9%)," +
       "radial-gradient(circle at 62% 60%, #5c3a1e 0 4%, transparent 8%)," +
       "radial-gradient(circle at 78% 28%, #b98a55 0 4%, transparent 8%)," +
       "radial-gradient(circle at 42% 78%, #5c3a1e 0 4.5%, transparent 8%)," +
       "radial-gradient(circle at 15% 65%, #b98a55aa 0 3.5%, transparent 7%)," +
       "linear-gradient(180deg, #a4713f 0%, #7c5230 55%, #59391f 100%)",
    r:[["brown","matter"]] },
  { id:"clay", c:"#c1663c",
    bg:"radial-gradient(circle at 33% 26%, #ffc49faa 0 11%, transparent 32%),"
       + "linear-gradient(150deg, #d4794c 0%, #c1663c 46%, #8f4526 100%)",
    r:[["earth","water"],["earth","red"],["brown","water"]] },
  { id:"pottery", e:"\u{1F3FA}",
    r:[["clay","fire"]] },
  { id:"beer", e:"\u{1F37A}",
    r:[["gold","water"]] },
  { id:"wine", e:"\u{1F377}",
    r:[["red","water"]] },
  { id:"lava", c:"#ff5a1f",
    bg:"radial-gradient(circle at 27% 32%, #ffe08a 0 3.5%, transparent 7%)," +
       "radial-gradient(circle at 72% 62%, #ffc04dcc 0 4%, transparent 8%)," +
       "linear-gradient(108deg, #2b0e07 0 14%, transparent 14% 27%, #1f0905 27% 35%," +
       "transparent 35% 58%, #2b0e07 58% 68%, transparent 68% 84%, #1f0905 84% 92%, transparent 92%)," +
       "linear-gradient(180deg, #ffb020 0%, #ff5a1f 45%, #a32206 100%)",
    r:[["earth","fire"],["red","stone"],["orange","stone"],["lava","stone"]] },
  { id:"volcano", e:"\u{1F30B}",
    r:[["lava","earth"]] },
  { id:"stone", e:"\u{1FAA8}",
    r:[["lava","water"],["lava","rain"],["lava","air"],["grey","matter"]] },
  { id:"metal", c:"#c3ced9",
    bg:"linear-gradient(120deg, transparent 0 30%, #ffffffaa 30% 38%, transparent 38% 62%," +
       "#ffffff55 62% 68%, transparent 68%)," +
       "linear-gradient(180deg, #e6edf3 0%, #aab6c2 38%, #6e7a86 62%, #cdd7e0 100%)",
    r:[["fire","stone"]] },
  { id:"tool", e:"\u{1F6E0}\u{FE0F}",
    r:[["fire","metal"]] },
  { id:"sand", c:"#e0c078",
    bg:"radial-gradient(circle at 30% 30%, #fff2c8aa 0 3%, transparent 6%)," +
       "radial-gradient(circle at 70% 45%, #b98a4d88 0 3%, transparent 6%)," +
       "radial-gradient(circle at 45% 70%, #fff2c899 0 2.5%, transparent 5%)," +
       "linear-gradient(115deg, #ecd08a 0 54%, #d3ab5e 54% 100%)",
    r:[["earth","air"],["stone","air"],["stone","tool"],["earth","yellow"]] },
  { id:"glass", c:"#bfe6f2",
    bg:"linear-gradient(135deg, transparent 0 28%, #ffffff99 28% 37%, transparent 37% 54%, #ffffff55 54% 60%, transparent 60% 100%)," +
       "linear-gradient(180deg, #d8f1f8 0%, #a8d8ea 60%, #8ec4dc 100%)",
    r:[["sand","fire"],["sand","electricity"],["sand","lightning"]] },
  { id:"mirror", e:"\u{1FA9E}",
    r:[["glass","metal"],["glass","grey"]] },
  { id:"hourglass", e:"⌛",
    r:[["glass","sand"]] },
  { id:"sun", e:"☀️",
    r:[["fire","sky"],["yellow","sky"]] },
  // Violet + Sky or Black + Sky, and the gradient is exactly that: the violet
  // at the top edge, falling to the Black the other route mixed in. Stars
  // unchanged.
  { id:"night", c:"#8a56e0",
    bg:"radial-gradient(circle at 22% 28%, #fff 0 4%, transparent 8%)," +
       "radial-gradient(circle at 65% 16%, #fff 0 3%, transparent 6%)," +
       "radial-gradient(circle at 82% 52%, #ffffffcc 0 3.5%, transparent 7%)," +
       "radial-gradient(circle at 38% 62%, #ffffffbb 0 3%, transparent 6%)," +
       "radial-gradient(circle at 58% 84%, #fff 0 2.5%, transparent 5%)," +
       "radial-gradient(circle at 12% 76%, #ffffff99 0 3%, transparent 6%)," +
       "linear-gradient(160deg, #7b3fd0 0%, #241047 45%, #04060c 100%)",
    r:[["black","sky"],["violet","sky"]] },
  { id:"star", e:"⭐",
    r:[["night","white"],["night","yellow"]] },
  { id:"moon", e:"\u{1F319}",
    r:[["night","sun"]] },
  { id:"cloud", e:"☁️",
    r:[["sky","water"],["water","air"],["grey","sky"],["white","sky"],["fire","water"]] },
  { id:"rain", e:"\u{1F327}️",
    r:[["cloud","water"]] },
  { id:"lightning", e:"\u{1F329}️",
    r:[["cloud","electricity"],["cloud","yellow"],["cloud","orange"]] },
  { id:"storm", e:"\u{26C8}️",
    r:[["lightning","rain"],["electricity","rain"]] },
  { id:"tornado", e:"\u{1F32A}️",
    r:[["air","storm"]] },
  { id:"life", e:"\u{1F9EC}",
    r:[["lightning","water"],["sun","water"]] },
  { id:"egg", e:"\u{1F95A}",
    r:[["stone","life"]] },
  { id:"animal", e:"\u{1F43E}",
    r:[["earth","life"]] },
  { id:"lizard", e:"\u{1F98E}",
    r:[["stone","animal"],["animal","green"],["egg","lizard"]] },
  { id:"horse", e:"\u{1F434}",
    r:[["animal","field"]] },
  { id:"hippo", e:"\u{1F99B}",
    r:[["horse","water"]] },
  { id:"wolf", e:"\u{1F43A}",
    r:[["animal","moon"]] },
  { id:"fox", e:"\u{1F98A}",
    r:[["orange","wolf"],["animal","orange"]] },
  { id:"bone", e:"\u{1F9B4}",
    r:[["animal","fire"],["wolf","fire"],["horse","fire"],["unicorn","fire"],
       ["bear","fire"],["polarbear","fire"],["dog","fire"],["cow","fire"],
       ["bear","horse"],["wolf","horse"],["bear","dog"]] },
  { id:"dog", e:"\u{1F415}",
    r:[["wolf","bone"],["dog","wolf"]] },
  { id:"cow", e:"\u{1F404}",
    r:[["animal","plant"]] },
  { id:"milk", e:"\u{1F95B}",
    r:[["cow","water"]] },
  { id:"cheese", e:"\u{1F9C0}",
    r:[["acid","milk"],["milk","yellow"]] },
  { id:"squirrel", e:"\u{1F43F}\u{FE0F}",
    r:[["animal","tree"]] },
  { id:"bird", e:"\u{1F426}",
    r:[["air","animal"],["air","penguin"]] },
  { id:"chick", e:"\u{1F425}",
    r:[["egg","bird"],["duck","egg"],["egg","flamingo"]] },
  { id:"penguin", e:"\u{1F427}",
    r:[["bird","ice"],["bird","black"]] },
  { id:"duck", e:"\u{1F986}",
    r:[["bird","water"]] },
  { id:"fish", e:"\u{1F41F}",
    r:[["animal","water"],["animal","blue"]] },
  { id:"owl", e:"\u{1F989}",
    r:[["bird","night"]] },
  { id:"flamingo", e:"\u{1F9A9}",
    r:[["bird","pink"]] },
  { id:"peacock", e:"\u{1F99A}",
    r:[["bird","rainbow"]] },
  { id:"phoenix", e:"\u{1F426}\u{200D}\u{1F525}",
    r:[["bird","fire"],["ash","fire"]] },
  { id:"bee", e:"\u{1F41D}",
    r:[["animal","flower"],["animal","yellow"]] },
  { id:"honey", e:"\u{1F36F}",
    r:[["bee","flower"]] },
  { id:"bear", e:"\u{1F43B}",
    r:[["animal","honey"]] },
  { id:"polarbear",n:"Polar Bear", e:"\u{1F43B}\u{200D}\u{2744}\u{FE0F}",
    r:[["bear","ice"],["bear","snow"],["bear","white"],["animal","white"]] },
  { id:"acid", e:"\u{1F9EA}",
    r:[["green","water"]] },
  { id:"electricity", e:"⚡",
    r:[["acid","metal"]] },
  { id:"lightbulb", n:"Light Bulb", e:"\u{1F4A1}",
    r:[["electricity","glass"]] },
  { id:"ice", e:"\u{1F9CA}",
    r:[["cyan","water"],["white","water"],["water","night"]] },
  { id:"snow", e:"\u{1F328}️",
    r:[["cloud","ice"],["cloud","white"]] },
  // the one icon that has to show a mechanism: white light in, spectrum out
  { id:"prism", c:"#bfe6f2",
    s:'<path d="M16 3 30 28H2Z" fill="#cfeaf544" stroke="#eaf8ff" stroke-width="1.6" stroke-linejoin="round"/>' +
      '<path d="M0 11h12" stroke="#fff" stroke-width="2.4"/>' +
      '<g stroke-width="2.4" stroke-linecap="round">' +
      '<path d="M22 15 32 7" stroke="#ff3b30"/><path d="M22 15 32 10" stroke="#ff9430"/>' +
      '<path d="M22 15 32 13" stroke="#ffdc32"/><path d="M22 15 32 16" stroke="#34d158"/>' +
      '<path d="M22 15 32 19" stroke="#33e9e9"/><path d="M22 15 32 22" stroke="#2f6bff"/>' +
      '<path d="M22 15 32 25" stroke="#9a4dff"/></g>',
    r:[["diamond","glass"],["glass","tool"],["glass","white"]] },
  { id:"rainbow", e:"\u{1F308}",
    r:[["white","prism"],["sun","rain"],["prism","sun"],
       ["lightbulb","prism"]] },
  { id:"magic", e:"\u{1FA84}",
    r:[["wood","star"],["pumpkin","night"],["rainbow","crystalball"]] },
  { id:"crystalball",n:"Crystal Ball", e:"\u{1F52E}",
    r:[["magic","glass"],["violet","glass"]] },
  { id:"unicorn", e:"\u{1F984}",
    r:[["horse","magic"],["animal","magic"]] },
  { id:"plant", e:"\u{1F33F}",
    r:[["earth","sun"],["life","sun"],["green","life"]] },
  { id:"cactus", e:"\u{1F335}",
    r:[["plant","sand"],["green","sand"]] },
  // a horizon rather than an object: sky above, green below, hard stop between
  { id:"field", c:"#5fb54a",
    bg:"linear-gradient(180deg, #a8dbff 0%, #7ec8ff 46%, #5fb54a 46%, #3f8c36 100%)",
    r:[["earth","plant"],["earth","green"]] },
  { id:"park", e:"\u{1F3DE}\u{FE0F}",
    r:[["field","water"]] },
  { id:"tree", e:"\u{1F333}",
    r:[["water","plant"]] },
  { id:"fruit", e:"\u{1F34E}",
    r:[["tree","sun"]] },
  { id:"pumpkin", e:"\u{1F383}",
    r:[["fruit","orange"]] },
  { id:"wood", e:"\u{1FAB5}",
    r:[["tree","tool"],["brown","tree"]] },
  { id:"charcoal", c:"#8a3a14",
    bg:"radial-gradient(circle at 34% 38%, #7c3312cc 0 4%, transparent 8%)," +
       "radial-gradient(circle at 68% 66%, #6b2a10aa 0 3%, transparent 7%)," +
       "linear-gradient(125deg, #2c2c2f 0 28%, #171719 28% 44%, #333338 44% 60%," +
       "#1b1b1e 60% 78%, #27272b 78% 100%)",
    r:[["wood","fire"],["tree","fire"],["black","wood"]] },
  // Charcoal taken one burn further: a pale, cold powder, so the swatch drops
  // charcoal's brown embers for a grey drift and keeps one dying ember in it.
  { id:"ash", c:"#b9b3ad",
    bg:"radial-gradient(circle at 28% 30%, #efece8cc 0 6%, transparent 12%)," +
       "radial-gradient(circle at 70% 64%, #ff6a2aaa 0 3%, transparent 8%)," +
       "linear-gradient(140deg, #b3aca4 0%, #8a827b 46%, #625b55 100%)",
    r:[["charcoal","fire"],["bone","fire"],["fire","paper"],
       ["book","fire"]] },
  { id:"mushroom", e:"\u{1F344}",
    r:[["rain","wood"]] },
  { id:"pencil", e:"\u{270F}\u{FE0F}",
    r:[["wood","charcoal"]] },
  { id:"paper", e:"\u{1F4C4}",
    r:[["stone","tree"],["white","wood"]] },
  { id:"book", e:"\u{1F4D6}",
    r:[["paper","pencil"]] },
  { id:"palette", e:"\u{1F3A8}",
    r:[["paper","rainbow"]] },
  { id:"kite", e:"\u{1FA81}",
    r:[["air","paper"]] },
  // The one color no amount of mixing light can reach, so it arrives through
  // the materials instead. A plain black square would vanish into the tile, so
  // the swatch keeps a soft top-left sheen and lends a grey — not black — glow.
  { id:"black", c:"#5b6472",
    bg:"radial-gradient(circle at 30% 26%, #2a2f3a 0 18%, transparent 42%)," +
       "linear-gradient(155deg, #17191f 0%, #0a0b0e 55%, #000000 100%)",
    r:[["charcoal","stone"],["charcoal","tool"],["charcoal","earth"],
       ["ash","charcoal"]] },
  { id:"grey", c:"#7f8894",
    r:[["black","white"]] },
  { id:"diamond", e:"\u{1F48E}",
    r:[["charcoal","lava"],["volcano","charcoal"]] },
  { id:"ring", e:"\u{1F48D}",
    r:[["metal","diamond"]] },
  { id:"flower", e:"\u{1F338}",
    r:[["plant","pink"]] },
  { id:"sunflower", e:"\u{1F33B}",
    r:[["sun","flower"],["flower","yellow"]] },
  { id:"rose", e:"\u{1F339}",
    r:[["flower","red"],["plant","red"]] },
] as RawDef[]).map(e => (e.n = e.n || e.id[0].toUpperCase() + e.id.slice(1), e)) as ElementDef[];

export const STARTERS = ["red", "green", "blue"];

export const BY_ID: Record<string, ElementDef> = {};
ELEMENTS.map(e => (BY_ID[e.id] = e));

// "a+b" (ids sorted) -> result id
export const RECIPE: Record<string, string> = {};
ELEMENTS.map(e => (e.r || []).map(p => (RECIPE[[...p].sort().join("+")] = e.id)));

export const N = (id: string): string => BY_ID[id].n;
