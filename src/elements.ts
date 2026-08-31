// The element tree. THERE IS NO n FIELD ANY MORE: the display name is DERIVED
// from the id, one capital per word, and the id carries whatever spacing or
// casing that takes — "teddy bear" -> "Teddy Bear", and "uFO" -> "UFO", which
// is one of the two acronyms ("iD" -> "ID" is the other) and the reason the
// derivation only ever touches a word's first letter. That is the whole trick: a written-out name is a NEAR-MISS
// repeat of a string roadroller has already seen, and a near miss costs real
// bits where an exact repeat costs almost none. Dropping the derivable ones was
// worth ~380 B packed; dropping the last nine, by spacing their ids, was worth
// a further 56 B measured. A space is safe everywhere an id goes — dataset
// values, the "a+b" RECIPE keys, and JSON in the one save entry — and n is
// filled in below, so every consumer still sees a plain string.
// c = colour swatch, bg = custom swatch background (any CSS background stack),
// e = emoji icon, s = inline SVG body on a 0 0 32 32 viewBox (rendered as an
// <svg class="s">, so it picks up the square swatches' size rules, and c still
// supplies the glow), r = recipes (unordered pairs of ids). Several recipes may
// make one element, and an alternate may be cyclic (Lava + Stone melts back
// into Lava) — that is flavour for a pair players try, never a cheaper route.
//
// THE PAIRS STAY NESTED, and this was measured rather than assumed. Flattening
// r to ["red","green","red","cyan", …] takes 835 chars out of the chunk and
// puts 195 B BACK ON the zip — 13134 -> 13329 with both fits redone, and
// 13200 -> 13387 with the reorder off on both sides, so it is not an artefact
// of a stale fn-order. The brackets are the cheapest bytes in this file to
// predict and they earn it twice over: "[" and "]," tell roadroller which HALF
// of a pair an id is, and flattened every separator is the same comma. Cheap
// punctuation that buys context is not the same as waste.
//
// MATTER IS THE THROAT OF THE TREE: it is the sole route to Earth, Air and
// Water, so nearly everything is unreachable until it is found. Deliberate —
// know it before rewiring around it.
//
// MAGIC AND THE CRYSTAL BALL ARE MUTUALLY CYCLIC: Magic + Glass makes the Ball,
// the Ball + a Rainbow makes Magic. It resolves only because BOTH ends keep a
// route that does not run through the other (Magic from Wood + Star and from
// Pumpkin + Night, the Ball from Violet + Glass). Measured: drop any one or two
// of those three and everything still resolves; drop ALL THREE and Magic, the
// Ball and the Unicorn go unreachable together. One independent way in,
// somewhere in the pair, is the invariant to preserve here.
//
// THE QUOTES ARE NOT HERE. A field on a live object is reachable, so closure
// could not drop strings a shipping build has no room for. They live in
// src/quotes.ts behind __DIRECTOR__, keyed by id and kept in this table's order.
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
  // ONE ROUTE, which is the colour run's own idiom rather than an omission:
  // every colour but the White has exactly one, and this is the same sentence
  // the Orange, the Violet, the Indigo and the Brown already say — a primary
  // plus the secondary NEXT TO IT on the wheel. Turquoise is what sits between
  // the Cyan and the Green, so that is the pair. Cyan + White would be a pale
  // cyan, which is what Red + White does for the Pink, and Blue + Cyan reads as
  // a bluer cyan; neither says turquoise without the player guessing.
  // Against the Cyan because "cyan" is in three recipes and "green" in
  // thirteen, and the entry keeps this run's { id, c, r } shape exactly.
  { id:"turquoise", c:"#2ec4a6",
    r:[["cyan","green"]] },
  // The wheel's other clean gap, and the same one-route sentence: the Yellow
  // with the Green beside it. The pair reads ["green","yellow"] so the Green
  // closes the Turquoise's pair and opens this one — the pairs are unordered,
  // so this is only ever a packing choice, and it is NOT measured, unlike most
  // of the orders in this file.
  // The two that are left stay out: Blue + Cyan is an Azure the SKY already
  // owns at #7ec8ff, and Red + Magenta is a Rose the Pink owns at #ffa8c5.
  // Both would put a near-duplicate swatch on the board. Four of six is where
  // this run ends.
  // LIME IS NOT THIS COLOUR'S NAME, deliberately: Fruit + Yellow is a Banana
  // and Fruit + Orange is a Pumpkin, so the word was worth more as a fruit than
  // as a colour. It went to Fruit + CHARTREUSE rather than Fruit + Green, which
  // is the better half of the bargain — a lime is that yellow-green exactly,
  // and it leaves this colour with a consumer instead of a dead end.
  { id:"chartreuse", c:"#a8dc32",
    r:[["green","yellow"]] },
  // THREE ROUTES, where every colour but the White has one — deliberate, and
  // the reason is that the three are not one sentence said three times. Red +
  // Magenta is the wheel, the same primary-plus-adjacent-secondary the Orange
  // and the Violet say. Red + Black is the DARKENING, which no colour here had
  // said before. Red + Blood is what the word actually means, and it gives the
  // Blood a fifth consumer and the Black a ninth.
  // The name is what makes this gap safe: the wheel's last free slot is a Rose
  // otherwise, and a rose sits on top of the Pink at #ffa8c5. Crimson is deep
  // where the Pink is pale, so the two read apart on a board of swatches.
  // "red" leads all three so the entry is one prefix repeated.
  { id:"crimson", c:"#b3123c",
    r:[["red","magenta"],["red","black"],["red","blood"]] },
  // The DARKENING again, one entry after the Crimson invented it, which is what
  // makes it an idiom rather than a one-off: a teal is a dark cyan the way a
  // crimson is a dark red. Kept against the Crimson for that reading and for
  // the tail — both pairs end `,"black"]`, an exact repeat.
  // Three blue-greens on one board is the tightest neighbourhood in the table,
  // so this swatch is dark on purpose: the Cyan at #33e9e9, the Turquoise at
  // #2ec4a6 and this separate by BRIGHTNESS, not by hue.
  { id:"teal", c:"#0f6b6b",
    r:[["cyan","black"]] },
  // The LIGHTENING, which balances the two darkenings above it: the Pink is
  // Red + White and had been saying that alone, and this is the same sentence
  // for the Brown. Placed here so the pale one sits with the dark ones and the
  // three read as the one idea.
  // The swatch is the whole difficulty, not the recipe — the Sand at #e0c078
  // is ALREADY this table's pale tan, with the Ash at #b9b3ad and the Clay at
  // #c1663c beside it. So this one separates on saturation rather than hue:
  // the Sand is golden, this is drained and paler, and the Ash is greyer still.
  { id:"beige", c:"#e8ddc4",
    r:[["brown","white"]] },
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
  // THE SAME SHINE THE METAL WEARS, said in gold: a diagonal highlight band
  // over a vertical tone ramp, the two stacked in that order so the band
  // reads as light ON the surface rather than a stripe painted into it. The
  // stack is deliberately the Metal's own, gradient for gradient and stop for
  // stop — a near-repeat of a run roadroller has already modelled costs a
  // fraction of a fresh one, and the two materials wanting to look like
  // members of the same set is the whole point anyway.
  { id:"gold", c:"#f7c948",
    bg:"linear-gradient(120deg, transparent 0 30%, #fff8d0aa 30% 38%, transparent 38% 62%," +
       "#fff8d055 62% 68%, transparent 68%)," +
       "linear-gradient(180deg, #ffeaa0 0%, #f7c948 38%, #a9741a 62%, #ffdd7a 100%)",
    r:[["yellow","orange"],["metal","yellow"]] },
  { id:"copper", c:"#b87333",
    bg:"linear-gradient(120deg, transparent 0 30%, #ffe0c0aa 30% 38%, transparent 38% 62%," +
       "#ffe0c055 62% 68%, transparent 68%)," +
       "linear-gradient(180deg, #e8b184 0%, #b87333 38%, #6e3a12 62%, #dda36b 100%)",
    r:[["brown","metal"]] },
  // THE THIRD OF THE SHINE, and the stack is the Metal's again — same bands,
  // same four stops, only the ramp said in a brighter, cooler set of greys so
  // it reads as polished rather than as the Metal's raw steel.
  { id:"silver", c:"#dfe6ec",
    bg:"linear-gradient(120deg, transparent 0 30%, #ffffffcc 30% 38%, transparent 38% 62%," +
       "#ffffff77 62% 68%, transparent 68%)," +
       "linear-gradient(180deg, #ffffff 0%, #dfe6ec 38%, #98a3ae 62%, #f2f6f9 100%)",
    r:[["grey","white"]] },
  { id:"water", e:"\u{1F4A7}",
    r:[["blue","matter"],["fire","ice"],["ice","sun"],["snowman","sun"],["fire","snowman"]] },
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
  { id:"brick", e:"\u{1F9F1}",
    r:[["clay","air"],["clay","sun"],["clay","red"]] },
  { id:"house", e:"\u{1F3E0}",
    r:[["brick","tool"],["brick","wood"],["brick","human"]] },
  // beside the House rather than the Glass: "house" is in the file eight times
  // and "glass" thirteen, so the House is the rarer of its two ingredients
  { id:"window", e:"\u{1FA9F}",
    r:[["glass","house"]] },
  { id:"hospital", e:"\u{1F3E5}",
    r:[["doctor","house"]] },
  { id:"hut", e:"\u{1F6D6}",
    r:[["house","wood"],["human","wood"]] },
  // THE RARE-STRING RULE LOSES THIS ONE, measured rather than assumed. "gold"
  // is four occurrences against "house"'s thirteen, so the Window's comment
  // above says to file this with the Gold — and doing that costs 15 B, 13136
  // against 13151. The rule is about what a recipe's ingredients cost to
  // predict, and it is outweighed here by where the ENTRY sits: up beside the
  // Gold this lands between the metals and the water run, splitting two runs
  // to join one string, and every element after it takes a shifted two-char
  // code for the trouble. Down here it is the fourth building off the House,
  // behind the Window, the Hospital and the Hut, and it costs nothing at all.
  { id:"bank", e:"\u{1F3E6}",
    r:[["gold","house"]] },
  { id:"beer", e:"\u{1F37A}",
    r:[["gold","water"]] },
  // Blood TAKES Red + Water, the pair the Wine used to own. The Wine is not
  // lost: it comes back from the three light reds, and that is what makes
  // the swap safe — Pink, Magenta and Violet all sit above Water in the
  // tree, so every route to a Wine is open the moment the Water is.
  { id:"wine", e:"\u{1F377}",
    r:[["pink","water"],["magenta","water"],["violet","water"]] },
  // The Crimson is the second way in, and the pair with it is CYCLIC — Red +
  // Blood is a Crimson, Crimson + Water is a Blood. Safe for the reason the
  // Magic and the Crystal Ball are: both ends keep a way in that misses the
  // other, the Blood through Red + Water and the Crimson through Red + Magenta
  // and Red + Black. "water" trails both pairs so the repeat is exact.
  { id:"blood", e:"\u{1FA78}",
    r:[["red","water"],["crimson","water"],["human","syringe"]] },
  { id:"coffee", e:"\u{2615}",
    r:[["black","water"],["brown","milk"],["black","milk"]] },
  { id:"lava", c:"#ff5a1f",
    bg:"radial-gradient(circle at 27% 32%, #ffe08a 0 3.5%, transparent 7%)," +
       "radial-gradient(circle at 72% 62%, #ffc04dcc 0 4%, transparent 8%)," +
       "linear-gradient(108deg, #2b0e07 0 14%, transparent 14% 27%, #1f0905 27% 35%," +
       "transparent 35% 58%, #2b0e07 58% 68%, transparent 68% 84%, #1f0905 84% 92%, transparent 92%)," +
       "linear-gradient(180deg, #ffb020 0%, #ff5a1f 45%, #a32206 100%)",
    r:[["earth","fire"],["red","stone"],["orange","stone"],["lava","stone"]] },
  { id:"volcano", e:"\u{1F30B}",
    r:[["lava","earth"]] },
  { id:"mountain", e:"\u{26F0}\u{FE0F}",
    r:[["volcano","rain"],["volcano","water"]] },
  // Animal + habitat, the idiom the Camel, the Crab and the Horse already
  // teach — and the Mountain was the last node of its depth with nothing
  // at all downstream of it. Placed against Mountain because "mountain" is
  // the string one line up and "animal" is in thirty recipes.
  { id:"goat", e:"\u{1F410}",
    r:[["animal","mountain"]] },
  { id:"stone", e:"\u{1FAA8}",
    r:[["lava","water"],["lava","rain"],["lava","air"],["grey","matter"],
       ["sun","troll"]] },
  // THE SEVENTH CYCLIC PAIR, and the only one the folklore wrote first: the
  // Night makes a Troll out of the Stone and the Sun turns him straight back
  // into it. Safe the way the others are — the Stone keeps three routes out of
  // the Lava and the Grey, none of them through the Troll, so the pair costs a
  // move and gives a laugh rather than stranding anything.
  { id:"troll", e:"\u{1F9CC}",
    r:[["night","stone"]] },
  // A TOUCH DARKER THAN IT WAS, and the Silver is the reason: the two share a
  // stack, so the only thing telling them apart on a crowded board is where
  // the ramp sits. The Silver has nowhere to go above white, so the Metal
  // moved instead — every stop down one step, the bands down with them, which
  // reads as raw steel against the Silver's polish.
  { id:"metal", c:"#a9b5c1",
    bg:"linear-gradient(120deg, transparent 0 30%, #ffffff99 30% 38%, transparent 38% 62%," +
       "#ffffff44 62% 68%, transparent 68%)," +
       "linear-gradient(180deg, #ccd6df 0%, #93a0ad 38%, #59636e 62%, #b0bcc7 100%)",
    r:[["fire","stone"],["rust","acid"]] },
  // RUST EATS METAL AND ACID GIVES IT BACK. metal + air/water/salt corrodes;
  // rust + acid strips it back to bare metal, the one REVERSAL in the table.
  // Safe because Metal keeps fire + stone, a route that does not run through
  // Rust -- the same independent-way-in invariant Magic and the Crystal Ball
  // are held to above. Drop fire + stone and the pair strands them both.
  //
  // The swatch is a SURFACE EVENT, not a colour: rust blooms over Metal's own
  // steel ramp so both materials show at once. Nothing else in the table has
  // two materials in one swatch, which is what keeps it clear of Brown,
  // Orange and Sand at the warm end. See experiments/rust-tile.html.
  { id:"anchor", e:"\u{2693}",
    r:[["boat","metal"],["metal","sea"]] },
  { id:"rust", c:"#c1571f",
    bg:"radial-gradient(circle at 30% 32%, #d2691ee6 0 26%, transparent 44%)," +
       "radial-gradient(circle at 70% 62%, #a33f0bdd 0 24%, transparent 42%)," +
       "radial-gradient(circle at 52% 18%, #e08b3fcc 0 16%, transparent 30%)," +
       "radial-gradient(circle at 18% 78%, #8a2f08cc 0 14%, transparent 28%)," +
       "linear-gradient(120deg, #8f9aa6 0 46%, #6f7b88 46% 100%)",
    r:[["metal","air"],["metal","water"],["metal","salt"],
       ["red","metal"],["orange","metal"]] },
  { id:"tool", e:"\u{1F6E0}\u{FE0F}",
    r:[["fire","metal"]] },
  { id:"pick", e:"\u{26CF}\u{FE0F}",
    r:[["stone","tool"]] },
  { id:"scale", e:"\u{2696}\u{FE0F}",
    r:[["gold","tool"]] },
  { id:"shovel", e:"\u{1FA8F}",
    r:[["sand","tool"],["earth","tool"]] },
  { id:"sand", c:"#e0c078",
    bg:"radial-gradient(circle at 30% 30%, #fff2c8aa 0 3%, transparent 6%)," +
       "radial-gradient(circle at 70% 45%, #b98a4d88 0 3%, transparent 6%)," +
       "radial-gradient(circle at 45% 70%, #fff2c899 0 2.5%, transparent 5%)," +
       "linear-gradient(115deg, #ecd08a 0 54%, #d3ab5e 54% 100%)",
    // Earth + Beige is Earth + Yellow said in the paler colour, and it is the
    // BEIGE'S ONLY CONSUMER — the colour was a dead end until this line.
    r:[["earth","air"],["stone","air"],["earth","yellow"],["earth","beige"]] },
  { id:"glass", c:"#bfe6f2",
    bg:"linear-gradient(135deg, transparent 0 28%, #ffffff99 28% 37%, transparent 37% 54%, #ffffff55 54% 60%, transparent 60% 100%)," +
       "linear-gradient(180deg, #d8f1f8 0%, #a8d8ea 60%, #8ec4dc 100%)",
    r:[["sand","fire"],["sand","electricity"],["sand","lightning"]] },
  { id:"mirror", e:"\u{1FA9E}",
    r:[["glass","metal"],["glass","grey"]] },
  { id:"hourglass", e:"⌛",
    r:[["glass","sand"]] },
  { id:"sun", e:"☀️",
    r:[["fire","sky"],["yellow","sky"],["star","world"]] },
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
    r:[["black","sky"],["violet","sky"],["indigo","sky"]] },
  { id:"star", e:"⭐",
    r:[["night","white"],["night","yellow"]] },
  { id:"moon", e:"\u{1F319}",
    r:[["night","sun"]] },
  { id:"telescope", e:"\u{1F52D}",
    r:[["night","glass"],["star","glass"]] },
  { id:"ghost", e:"\u{1F47B}",
    r:[["night","air"],["ash","night"]] },
  { id:"cloud", e:"☁️",
    r:[["sky","water"],["water","air"],["grey","sky"],["white","sky"],["fire","water"]] },
  { id:"rain", e:"\u{1F327}️",
    r:[["cloud","water"]] },
  { id:"lightning", e:"\u{1F329}️",
    r:[["cloud","electricity"],["cloud","yellow"],["cloud","orange"]] },
  { id:"storm", e:"\u{26C8}️",
    r:[["lightning","rain"],["electricity","rain"]] },
  { id:"umbrella", e:"\u{2602}\u{FE0F}",
    r:[["rain","tool"],["storm","tool"],["human","rain"],["human","storm"]] },
  { id:"parachute", e:"\u{1FA82}",
    r:[["human","sky"]] },
  { id:"tornado", e:"\u{1F32A}️",
    r:[["air","storm"]] },
  { id:"life", e:"\u{1F9EC}",
    r:[["lightning","water"],["sun","water"]] },
  { id:"alien", e:"\u{1F47D}",
    r:[["life","star"]] },
  // The first of the two acronyms, and the id spells it: the derivation only
  // ever uppercases a WORD'S FIRST LETTER, so "uFO" comes back out as "UFO"
  // and the last n field in the table went with it. The iD, down in the paper
  // run, is spelled the same way.
  { id:"uFO", e:"\u{1F6F8}",
    r:[["alien","sky"]] },
  { id:"jellyfish", e:"\u{1FABC}",
    r:[["water","life"]] },
  // Sea + Life is what a coral IS, Sea + Pink is what it looks like — two
  // directions, and "sea" leads both so the repeat is exact.
  { id:"coral", e:"\u{1FAB8}",
    r:[["sea","life"],["sea","pink"]] },
  { id:"egg", e:"\u{1F95A}",
    r:[["stone","life"]] },
  { id:"cooking", e:"\u{1F373}",
    r:[["egg","fire"],["egg","tool"]] },
  // The Blood is the second way into the Animal, and the one that stops it
  // being a single-route node: Life in the Earth is a plant kingdom, Life in
  // the Blood is an animal one. "life" trails both pairs so the repeat is
  // exact — a near-miss is what costs roadroller real bits.
  { id:"animal", e:"\u{1F43E}",
    r:[["earth","life"],["blood","life"]] },
  // IN THE ANIMALS, and measured: 13065 here against 13069 beside the Cheese.
  // That is the rare-string rule losing twice running — "cheese" is in the file
  // four times and "animal" thirty-two — so what the Eggplant found is not the
  // whole story either. The likelier reading is that neither rarity nor repeats
  // are the thing: it is the NEIGHBOURHOOD'S SHAPE. Every entry around this one
  // is `{ id, e, r:[["animal", …]] }`, so a new one costs almost nothing here,
  // and the vegetables won the Eggplant for the same reason rather than for its
  // doubled "plant". Build both before believing any of it.
  { id:"rat", e:"\u{1F400}",
    r:[["animal","cheese"]] },
  { id:"lizard", e:"\u{1F98E}",
    r:[["stone","animal"],["animal","green"],["egg","lizard"]] },
  { id:"turtle", e:"\u{1F422}",
    r:[["lizard","sea"]] },
  // The third thing the Lizard makes, and the two directions the reptiles were
  // missing: the Desert one and the Tree one. Kept in the Lizard's own run
  // because "lizard" is the string on both sides of this entry — the Turtle
  // above and the Frog below — where "desert" is in two recipes and "tree" in
  // nine, so the rare string is the one worth hugging.
  { id:"snake", e:"\u{1F40D}",
    r:[["desert","lizard"],["tree","lizard"]] },
  // A lizard's bones at that scale are only one thing, which is what makes the
  // single route safe here where a plain colour would have been ambiguous. It
  // also spends the BONE, the most lopsided node in the table: eleven routes
  // into it and, before this, two out — the Dog and the Ash.
  // Kept in the Lizard's run because "lizard" is the string on both sides of
  // this entry, and it trails the pair the way the Snake's two do.
  // The bones of a bird, and the extinct bird is the dodo — no other reading is
  // open here. It sits IN FRONT of the Dinosaur so the two `["bone", …]`
  // entries touch and the prefix repeats; it is also what turns that entry's
  // one clever pair into a rule a player can predict once they have found it.
  // A fourth thing off the Bone, which had eleven routes in and three out.
  { id:"dodo", e:"\u{1F9A4}",
    r:[["bone","bird"]] },
  { id:"dinosaur", e:"\u{1F996}",
    r:[["bone","lizard"]] },
  // What the Dinosaur is FOR — it was a leaf the moment it landed, and this is
  // its first consumer. Plant + beast is also the diet, the same move the
  // Gorilla makes with the Banana: what it eats is what it became.
  // "dinosaur" leads the pair so it lands against the id one line up.
  { id:"sauropod", e:"\u{1F995}",
    r:[["dinosaur","plant"]] },
  { id:"frog", e:"\u{1F438}",
    r:[["lizard","water"]] },
  // THE CAMEL GAVE ANIMAL + SAND TO THE CRAB and kept Desert + Animal, which
  // it had been handed one commit earlier — that is the only reason the swap
  // is safe, and it is the Snowman lesson applied in advance rather than
  // repaired afterwards. Desert + Animal is the better sole route anyway: a
  // desert says camel far more particularly than sand does, and sand is what
  // the crab actually lives in.
  { id:"camel", e:"\u{1F42A}",
    r:[["desert","animal"]] },
  { id:"crab", e:"\u{1F980}",
    r:[["animal","island"]] },
  // The Crab is the shore, the Sea is the deep — same creature, further out.
  // Against the Crab because "crab" is a single occurrence before this line
  // and "sea" is in six recipes, and it gives the Crab its first consumer.
  // The Shrimp is deliberately NOT here: it wants this same pair, and a crab,
  // a lobster and a shrimp are one silhouette at three sizes in a table with
  // no size to tell them apart.
  { id:"lobster", e:"\u{1F99E}",
    r:[["crab","sea"]] },
  { id:"scorpion", e:"\u{1F982}",
    r:[["animal","sand"],["bug","sand"]] },
  { id:"horse", e:"\u{1F434}",
    r:[["animal","field"]] },
  { id:"donkey", e:"\u{1FACF}",
    r:[["grey","horse"]] },
  { id:"sheep", e:"\u{1F411}",
    r:[["animal","cloud"]] },
  { id:"yarn", e:"\u{1F9F6}",
    r:[["sheep","tool"]] },
  { id:"spider", e:"\u{1F577}\u{FE0F}",
    r:[["animal","yarn"]] },
  { id:"web", e:"\u{1F578}\u{FE0F}",
    r:[["spider","yarn"]] },
  { id:"scarf", e:"\u{1F9E3}",
    r:[["human","yarn"]] },
  // Figure + material is the effigy, the sentence the Statue, the Snowman and
  // the Robot all say with Human on one side; this is that with the Bear on it
  // instead, and Yarn is the only soft material the table has. It is also the
  // first thing the Bear makes that is not a Polar Bear or its own Bone.
  // Kept in the Yarn run beside the Scarf — both of Yarn's consumers now sit
  // together — because "yarn" is three occurrences against "bear"'s seven.
  // Two directions rather than one said twice, the Castle's move: Yarn is what
  // it is made of, the Baby is who it is for. "bear" leads both pairs so the
  // repeat is exact where a near-miss would cost real bits.
  { id:"teddy bear", e:"\u{1F9F8}",
    r:[["bear","yarn"],["bear","baby"]] },
  { id:"hippo", e:"\u{1F99B}",
    r:[["horse","water"]] },
  { id:"wolf", e:"\u{1F43A}",
    r:[["animal","moon"]] },
  { id:"fox", e:"\u{1F98A}",
    r:[["orange","wolf"],["animal","orange"]] },
  { id:"bone", e:"\u{1F9B4}",
    r:[["animal","fire"],["wolf","fire"],["horse","fire"],["unicorn","fire"],
       ["bear","fire"],["polar bear","fire"],["dog","fire"],["cow","fire"],
       ["bear","horse"],["wolf","horse"],["bear","dog"]] },
  { id:"dog", e:"\u{1F415}",
    r:[["wolf","bone"],["dog","wolf"]] },
  { id:"cow", e:"\u{1F404}",
    r:[["animal","plant"]] },
  { id:"milk", e:"\u{1F95B}",
    r:[["cow","water"],["white","water"]] },
  { id:"cat", e:"\u{1F408}",
    r:[["animal","fish"],["animal","milk"]] },
  { id:"black cat", e:"\u{1F408}\u{200D}\u{2B1B}",
    r:[["cat","black"],["cat","night"],["cat","wizard"]] },
  { id:"cheese", e:"\u{1F9C0}",
    r:[["acid","milk"],["milk","yellow"]] },
  { id:"squirrel", e:"\u{1F43F}\u{FE0F}",
    r:[["animal","nut"]] },
  { id:"monkey", e:"\u{1F412}",
    r:[["animal","tree"],["animal","peanut"]] },
  { id:"orangutan", e:"\u{1F9A7}",
    r:[["orange","monkey"]] },
  { id:"human", e:"\u{1F9CD}",
    r:[["monkey","tool"],["monkey","fire"],["clay","life"],["statue","life"]] },
  { id:"chef", e:"\u{1F468}\u{200D}\u{1F373}",
    r:[["cooking","human"]] },
  { id:"knife", e:"\u{1F52A}",
    r:[["chef","tool"]] },
  { id:"burger", e:"\u{1F354}",
    r:[["chef","cow"],["cooking","cow"]] },
  { id:"sushi", e:"\u{1F363}",
    r:[["chef","fish"]] },
  { id:"french fries", e:"\u{1F35F}",
    r:[["potato","chef"],["potato","cooking"]] },
  // Bread + Cheese is what a pizza IS, where Cheese + Cooking is only how it
  // is made — and it gives the Pizza back a second route after the Fondue
  // took Chef + Cheese below. The Bread is defined far down the table, past
  // the Wheat it comes from; the reference reaches it because encode-recipes
  // indexes the whole table before any of it is read.
  { id:"pizza", e:"\u{1F355}",
    r:[["cheese","cooking"],["bread","cheese"]] },
  // THE PIZZA GAVE UP Chef + Cheese, the Eggplant's story exactly. RECIPE is
  // last-write-wins over a sorted "a+b" key, so the pair could not be shared:
  // whichever of the two sits LATER in the table takes it and the other's
  // route dies silently, findable only by playing for it. That is also why
  // this cannot go where the rare-string rule wants it — "cheese" is five
  // occurrences against "chef"'s twelve, so the rule says file it up beside
  // the Cheese at the top of the food run, and up there the Pizza would sit
  // later and quietly take the pair back. The placement is FORCED, and it is
  // the one line in this entry that is not a preference.
  // Safe for the reason the Eggplant's was: the Pizza keeps Cheese + Cooking,
  // and the Cooking is nowhere downstream of the Chef, so the route it keeps
  // is a real one and not a branch of the one it lost.
  // Beside the Champagne measured 1 B cheaper, 13173 against 13174. Not taken:
  // a byte is inside the noise these placements swing by, and the entry that
  // takes a pair off another one belongs where the reader can see it happen.
  { id:"fondue", e:"\u{1FAD5}",
    r:[["cheese","fire"],["cheese","chef"]] },
  { id:"party", e:"\u{1F389}",
    r:[["beer","pizza"],["beer","sushi"],["cheese","wine"],["burger","french fries"]] },
  { id:"fireworks", e:"\u{1F386}",
    r:[["party","sky"],["party","night"]] },
  // THE SECOND PLACEMENT THE RARE-STRING RULE LOSES, and it lost the same way
  // the Bank's did. "wine" is ONE occurrence in the file against "party"'s
  // two, so the rule says file this up in the drinks run beside the Wine —
  // and that costs 16 B, 13162 against 13146 down here beside the Fireworks,
  // the Party's other consumer.
  // The LATER of the two placements won here and on the Bank, and it looked
  // like a rule — an entry inserted early shifts every following element's
  // two-character code, one inserted late disturbs almost nothing. The
  // Playground killed it: measured both ends, the EARLY placement won by 3 B.
  // So there is no rule, only the A/B. Take it, keep the number, and see the
  // Playground's comment for the third measurement.
  { id:"champagne", e:"\u{1F37E}",
    r:[["party","wine"]] },
  { id:"ice cream", e:"\u{1F368}",
    r:[["ice","milk"],["chef","ice"]] },
  { id:"salad", e:"\u{1F957}",
    r:[["chef","plant"]] },
  // IN THE FOOD, and it is the second measurement in a row favouring the
  // NEIGHBOURHOOD'S SHAPE over string rarity: 13062 here against 13066 beside
  // the Rat, though "rat" is in the file twice and "chef" seven times. The
  // Burger, the Sushi, the Pizza and the Salad above are all `r:[["chef", …]]`
  // and so is this, which appears to matter more than hugging a rare id —
  // dropping it into that run came in THREE BYTES UNDER the build without it.
  { id:"ratatouille", e:"\u{1F372}",
    r:[["chef","rat"]] },
  { id:"eyeglasses", e:"\u{1F453}",
    r:[["human","glass"],["book","tool"]] },
  { id:"sunglasses", e:"\u{1F576}\u{FE0F}",
    r:[["black","eyeglasses"]] },
  { id:"goggles", e:"\u{1F97D}",
    r:[["eyeglasses","scientist"],["acid","eyeglasses"]] },
  // THE GOGGLES' FIRST CONSUMER: they had two routes in and nothing out, the
  // same dead end the School sat in until the Student. Wearable + place, which
  // is the Mermaid's move and the Astronaut's — what it is, and where it is
  // worn. Placed against the Goggles because "goggles" appears once in the
  // whole file and "sea" fourteen times.
  { id:"diving mask", e:"\u{1F93F}",
    r:[["goggles","sea"]] },
  // with the Eyeglasses, the table's other person-plus-material wearable. The
  // ground the shoe is for is EARTH: there is no separate ground element, and
  // Human + Stone is already the Statue.
  { id:"shoe", e:"\u{1F45F}",
    r:[["human","earth"],["human","sand"]] },
  { id:"boot", e:"\u{1F97E}",
    r:[["mountain","shoe"],["field","shoe"],["park","shoe"]] },
  // THE SCARF'S MOVE with the Shoe where the Human stands: Human + Yarn is
  // what you wear it on, Shoe + Yarn is what you wear it in. Filed at the end
  // of the shoe run rather than beside the Yarn because "shoe" is three
  // occurrences against the Yarn's five — and it leaves the Boot's three
  // "shoe" recipes hard against the Shoe that defines them.
  { id:"socks", e:"\u{1F9E6}",
    r:[["shoe","yarn"]] },
  { id:"climbing", e:"\u{1F9D7}",
    r:[["human","mountain"]] },
  { id:"racing", e:"\u{1F3C7}",
    r:[["horse","human"]] },
  { id:"skiing", e:"\u{26F7}\u{FE0F}",
    r:[["mountain","snow"]] },
  // AGAINST THE SKIING FOR THE EMOJI, not for the ingredients: U+26F8 is the
  // codepoint immediately after the Skiing's U+26F7 and wears the same VS16,
  // so the whole escape is a near-exact repeat of the line above it. The Shoe
  // it is built from is a dozen lines up either way — the shoe run and the
  // sports run are neighbours — so there was nothing to lose by taking it.
  // Both of these need the variation selector: the U+26Fx sports default to
  // TEXT presentation, and without it a browser is free to draw the outline.
  { id:"ice skate", e:"\u{26F8}\u{FE0F}",
    r:[["ice","shoe"]] },
  { id:"ninja", e:"\u{1F977}",
    r:[["human","black"]] },
  { id:"wizard", e:"\u{1F9D9}",
    r:[["human","magic"],["human","crystal ball"],["owl","book"]] },
  // Two directions, not one said twice: the Bat is what TURNS you, the Blood
  // is what keeps you. It is also the first thing the Blood feeds that is not
  // an Animal, and it moves the Vampire a depth (9, against the Bat route's
  // 10).
  // The pair reads ["blood","human"] and NOT ["human","blood"], which is the
  // repeat rule losing by a byte: 13190 against 13191. Leading with "human"
  // would have made an exact repeat of the pair beside it and this whole run
  // is `["human", …]` — it still costs more, because "blood" is the rare
  // string and putting it first is what lets the common one close the pair.
  // One byte, measured both ways, like everything else here.
  { id:"vampire", e:"\u{1F9DB}",
    r:[["human","bat"],["blood","human"]] },
  { id:"statue", e:"\u{1F5FF}",
    r:[["human","stone"],["stone","pick"],["artist","stone"]] },
  { id:"farmer", e:"\u{1F9D1}\u{200D}\u{1F33E}",
    r:[["human","field"]] },
  // BETWEEN THE FARMER AND THE ARTIST, and it is the EMOJI that chose the
  // seat, not the recipe: all three are \u{1F9D1}\u{200D} plus one glyph,
  // so eleven characters of this entry are an exact repeat of the line above.
  // 13194 here against 13203 beside the Doctor — which is also a person ZWJ,
  // but two entries further out and behind a four-escape emoji of its own.
  // The fire pair is ["fire","human"], one byte under ["human","fire"] (13194
  // vs 13195), the same way round the Vampire's Blood went. The RED pair goes
  // the other way and by eight: ["human","red"] 13200, ["red","human"] 13208.
  // So there is no rule here either — leading with the rare string won the
  // Blood and the Fire, and leading with the repeat wins the Red. Both orders
  // are one build apart; measure the pair, do not reason about it.
  //
  // Red + Human is the plain-colour way in the Earth, the Cloud and the Animal
  // already have: same depth as the Fire route (9), so it is a second door at
  // the same height rather than a shortcut past one.
  { id:"firefighter", e:"\u{1F9D1}\u{200D}\u{1F692}",
    r:[["fire","human"],["human","red"]] },
  // THE FIREFIGHTER'S FIRST CONSUMER — two routes in and nothing out, the
  // third of those this commit closes after the Goggles and the Scissors.
  // No placement to weigh here, unlike the Bank and the Champagne above:
  // "firefighter" is one occurrence against "tool"'s twenty-one, and the Tool
  // is in recipes the whole table over rather than in a run there is any
  // sense in joining. What the Tool makes of a person is what that person
  // carries, which is the sentence the Pencil and the Book already say.
  { id:"extinguisher", e:"\u{1F9EF}",
    r:[["firefighter","tool"]] },
  { id:"artist", e:"\u{1F9D1}\u{200D}\u{1F3A8}",
    r:[["human","palette"]] },
  { id:"brush", e:"\u{1F58C}\u{FE0F}",
    r:[["artist","tool"]] },
  { id:"painting", e:"\u{1F5BC}\u{FE0F}",
    r:[["artist","brush"],["brush","palette"],["artist","paper"]] },
  // with the Artist and the Painting because it is the third colour-carrying
  // person, and because "human" is the string every entry in this stretch uses
  { id:"clown", e:"\u{1F921}",
    r:[["human","rainbow"]] },
  { id:"circus", e:"\u{1F3AA}",
    r:[["clown","house"]] },
  // beside the Circus rather than up in the animals: "animal" appears a dozen
  // times across the table and the packer knows it wherever this sits, while
  // "circus" appears exactly once, so the rare string is the one worth hugging
  { id:"elephant", e:"\u{1F418}",
    r:[["circus","animal"]] },
  // A named animal plus a colour, the table's most-worn idiom — the Donkey,
  // the Fox, the Black Cat, the Orangutan, the Shark, the Swan, the Polar
  // Bear and the Tiger are all this sentence. Brown alone would be ambiguous
  // against a dozen beasts, but against the ELEPHANT it has one answer. Snow
  // is the second direction: brown is what it looks like, the ice age is what
  // it is. Pressed against the Elephant, which was a leaf until now and whose
  // id is a single occurrence in the file against brown's six.
  // Bone + Elephant is the same sentence the Dinosaur and the Dodo say: the
  // bones of a living lineage give you the extinct member of it. Third instance
  // of it, which is what makes it an idiom rather than a trick.
  // "elephant" trails the first two pairs so they repeat exactly.
  { id:"mammoth", e:"\u{1F9A3}",
    r:[["brown","elephant"],["bone","elephant"],["elephant","snow"]] },
  { id:"mermaid", e:"\u{1F9DC}\u{200D}\u{2640}\u{FE0F}",
    r:[["human","fish"]] },
  // HUMAN + SNOW IS THE SNOWMAN'S ONLY ROUTE, and it is load-bearing: two of
  // Water's recipes run back through the Snowman, so anything taking this pair
  // strands it. Santa was briefly given it and had to pay two alternates back
  // to keep the tree whole; Santa comes off the Wizard instead now, and those
  // alternates went with the problem they were solving.
  { id:"snowman", e:"\u{26C4}",
    r:[["human","snow"]] },
  { id:"swimming", e:"\u{1F3CA}",
    r:[["human","water"],["human","sea"]] },
  { id:"santa", e:"\u{1F385}",
    r:[["wizard","snow"],["christmas","human"]] },
  // MUTUALLY CYCLIC WITH THE SANTA, the way Magic and the Crystal Ball are: he
  // trims the Tree and the Tree is where he comes from. Both ends keep a route
  // out of the pair — the Christmas from Rainbow + Tree, the Santa from
  // Wizard + Snow — so neither goes unreachable if the other is never tried.
  { id:"christmas", e:"\u{1F384}",
    r:[["rainbow","tree"],["santa","tree"]] },
  { id:"gift", e:"\u{1F381}",
    r:[["christmas","night"],["christmas","santa"]] },
  { id:"robot", e:"\u{1F916}",
    r:[["human","metal"]] },
  { id:"astronaut", e:"\u{1F9D1}\u{200D}\u{1F680}",
    r:[["human","moon"],["human","star"]] },
  { id:"zombie", e:"\u{1F9DF}",
    r:[["human","green"],["ghost","human"]] },
  { id:"skull", e:"\u{1F480}",
    r:[["bone","human"]] },
  { id:"x-ray", e:"\u{1FA7B}",
    r:[["bone","doctor"]] },
  { id:"teacher", e:"\u{1F9D1}\u{200D}\u{1F3EB}",
    r:[["book","human"],["eyeglasses","human"]] },
  { id:"school", e:"\u{1F3EB}",
    r:[["teacher","house"]] },
  // Human + Teacher is who teaches you, Human + School is where — two
  // directions on one idea rather than one said twice. It also gives the
  // SCHOOL its first consumer: it had one route in and nothing out. Placed
  // here because "school" appeared exactly once in the file until now.
  { id:"student", e:"\u{1F9D1}\u{200D}\u{1F393}",
    r:[["human","teacher"],["human","school"]] },
  { id:"scientist", e:"\u{1F9D1}\u{200D}\u{1F52C}",
    r:[["acid","human"]] },
  { id:"doctor", e:"\u{1F9D1}\u{200D}\u{2695}\u{FE0F}",
    r:[["medicine","human"]] },
  { id:"judge", e:"\u{1F9D1}\u{200D}\u{2696}\u{FE0F}",
    r:[["human","scale"],["scale","student"]] },
  { id:"syringe", e:"\u{1F489}",
    r:[["doctor","tool"]] },
  { id:"bird", e:"\u{1F426}",
    r:[["air","animal"],["animal","worm"]] },
  { id:"nest", e:"\u{1FAB9}",
    r:[["bird","tree"],["bird","house"],["eagle","mountain"],["eagle","house"]] },
  { id:"chick", e:"\u{1F425}",
    // Five ways through an Egg, and then the plain one: a yellow bird is a
    // chick, the same sentence the Flamingo and the Swan say in their colours.
    // The Nest is the fifth and the odd one — every other Egg route names the
    // parent, and this one names the place instead.
    r:[["egg","bird"],["duck","egg"],["egg","flamingo"],["egg","swan"],["bird","yellow"],
       ["egg","nest"]] },
  { id:"penguin", e:"\u{1F427}",
    r:[["bird","ice"]] },
  { id:"duck", e:"\u{1F986}",
    r:[["bird","water"]] },
  { id:"fish", e:"\u{1F41F}",
    r:[["animal","water"],["animal","blue"]] },
  { id:"sea", e:"\u{1F30A}",
    // Teal + Water is the TEAL'S ONLY CONSUMER, and it is the colour this
    // element already claims — "the ocean keeps its deepest secrets in shades
    // of teal" is the quote one screen away. "water" trails, like the two above.
    r:[["island","water"],["fish","water"],["mermaid","house"],["teal","water"]] },
  { id:"boat", e:"\u{26F5}",
    r:[["sea","wood"],["island","wood"]] },
  { id:"octopus", e:"\u{1F419}",
    r:[["animal","sea"],["animal","coral"]] },
  { id:"salt", e:"\u{1F9C2}",
    r:[["sea","fire"],["sea","sun"],["white","stone"]] },
  { id:"shark", e:"\u{1F988}",
    r:[["grey","fish"],["white","fish"]] },
  { id:"owl", e:"\u{1F989}",
    r:[["bird","night"]] },
  { id:"bat", e:"\u{1F987}",
    r:[["animal","night"]] },
  { id:"flamingo", e:"\u{1F9A9}",
    r:[["bird","pink"]] },
  // Bird + Pink is the Flamingo one line up; Animal + Pink is that same
  // sentence one category wider, the colour idiom the Fox and the Polar Bear
  // already teach. Kept beside the Flamingo rather than up with the beasts
  // because "pink" is in three recipes and "animal" is in thirty-one — the
  // rare string is the one to hug, and both of pink's animals now sit
  // together.
  // Boar + Pink is the Boar's own move run backwards — the Brown made it wild,
  // the Pink brings it home — and the two are CYCLIC because of it. It holds
  // for the usual reason: the Pig keeps Animal + Pink, which misses the Boar
  // entirely, and the Boar has nothing that misses the Pig. So the Pig is the
  // load-bearing half here; take Animal + Pink away and BOTH go unreachable.
  // "pink" trails both pairs.
  { id:"pig", e:"\u{1F416}",
    r:[["animal","pink"],["boar","pink"]] },
  // Two directions off the Pig: the Brown is what a boar IS against the Pig's
  // pink, and the Park is where it went — the tame one turned loose. It gives
  // the Park a consumer it did not have.
  // "pig" trails both pairs, and the Bacon below trails it twice more, so four
  // recipes in a row end the same way.
  { id:"boar", e:"\u{1F417}",
    r:[["brown","pig"],["park","pig"]] },
  // What the Pig is for: the first thing it makes, and the bridge from the
  // beasts into the food run the Burger and the Pizza already hold. Two
  // directions rather than one said twice — Cooking is the process, the Chef
  // is who does it. Pressed against the Pig above because "pig" is the rarest
  // string in either recipe (one occurrence before this entry, against five
  // for "cooking" and ten for "chef"), and this entry spends it twice.
  { id:"bacon", e:"\u{1F953}",
    r:[["cooking","pig"],["chef","pig"]] },
  // THE BACON'S FIRST CONSUMER — one more leaf closed, after the Goggles, the
  // Scissors and the Firefighter. Up here rather than down beside the Bread
  // because "bacon" appeared exactly once in the file against the Bread's
  // twice, and MEASURED: against the Bacon it costs 0 B and lands on 13312
  // exactly, against the Croissant it costs 8 B and OVERFLOWS at 13320. That
  // is the largest swing any placement has shown in this run of elements, and
  // it is the difference between shipping and not.
  { id:"sandwich", e:"\u{1F96A}",
    r:[["bacon","bread"]] },
  { id:"swan", e:"\u{1F9A2}",
    r:[["white","duck"],["white","bird"]] },
  // Bird + colour, the Flamingo's and the Swan's sentence, and this is the
  // TURQUOISE'S ONLY CONSUMER — the colour was a leaf until here. It is also
  // the one colour with a single answer against a bird: turquoise IS the
  // peacock. "bird" leads both pairs.
  { id:"peacock", e:"\u{1F99A}",
    r:[["bird","rainbow"],["bird","turquoise"]] },
  { id:"eagle", e:"\u{1F985}",
    r:[["bird","crown"]] },
  // AN ABSTRACTION, not a bird, and the pair is why: the branch and the bird
  // compose into the idea, which is how every abstraction here is built — the
  // Party out of beer and pizza, the Wedding and the School and the Circus out
  // of things that are not themselves ideas. Naming it Dove instead would fit
  // the icon and break the recipe: a dove is not made of a plant, and the white
  // bird is the Swan already. The emoji is the peace symbol doing its usual
  // job, and the quote says "branch" out loud so the discovery lands.
  // Kept in the bird run, "bird" leading, like the two pairs one line up.
  // Bird + Olive is the same picture with the branch NAMED, which is the route
  // that needs no story told for it; Bird + Plant stays because it is the
  // shallow way in — the Olive is four steps further out, so without it the
  // Peace would be a late discovery rather than a reachable one.
  { id:"peace", e:"\u{1F54A}",
    r:[["bird","plant"],["bird","olive"]] },
  { id:"phoenix", e:"\u{1F426}\u{200D}\u{1F525}",
    r:[["bird","fire"],["ash","fire"]] },
  // AGAINST THE PHOENIX, not the other black bird: both are the Bird's own
  // emoji with a ZWJ and one glyph after it, so eleven characters of this
  // entry repeat the line above — the Farmer's argument, and it beats sitting
  // with the Penguin whose route it took by 2 B, the Owl by 12, the Black Cat
  // by 13. The Penguin keeps the Ice, which was always the truer half of it.
  { id:"crow", e:"\u{1F426}\u{200D}\u{2B1B}",
    r:[["bird","black"]] },
  { id:"worm", e:"\u{1FAB1}",
    r:[["animal","earth"]] },
  { id:"bug", e:"\u{1F41B}",
    r:[["egg","plant"]] },
  { id:"ant", e:"\u{1F41C}",
    r:[["bug","earth"],["black","bug"]] },
  { id:"fly", e:"\u{1FAB0}",
    r:[["air","bug"]] },
  { id:"cricket", e:"\u{1F997}",
    r:[["bug","plant"]] },
  { id:"ladybug", e:"\u{1F41E}",
    r:[["bug","red"]] },
  { id:"roach", e:"\u{1FAB3}",
    r:[["bug","house"],["bug","brown"],["bug","zombie"]] },
  { id:"bee", e:"\u{1F41D}",
    r:[["animal","blossom"],["animal","yellow"]] },
  // IN THE INSECTS, not beside the Blood: 13186 here against 13192 up there,
  // even though "blood" is in the file three times and "animal" thirty-four.
  // The rare-string rule loses again, and for the reason the Rat block gives —
  // every entry down here is already `r:[["animal", …]]`, so the shape is paid
  // for and this one rides it. The Bee is the neighbour it earns: both are
  // small fliers off the same Animal.
  { id:"mosquito", e:"\u{1F99F}",
    r:[["blood","animal"]] },
  // ANY FLOWER PLUS A RAINBOW, and then the fourth route that is not that
  // sentence at all: Blossom + Bug is the metamorphosis, not the colour, and it
  // is the one an insect-hunting player finds first. The three rainbow routes
  // still say one thing between them, which usually
  // fails the two-directions test — but the Rose and the Sunflower are both
  // CHILDREN of the Blossom, so a player who has already spent theirs on one
  // is not sent back for another. Forgiving rather than redundant, and it gives
  // the Rose and the Sunflower their first consumers: both were terminal.
  //
  // Still beside the Bee, whose own recipe is Animal + Blossom, even now that
  // two of its three ingredients live at the far end of the table with the
  // flowers: 13087 here against 13093 down there.
  { id:"butterfly", e:"\u{1F98B}",
    r:[["blossom","rainbow"],["rose","rainbow"],["sunflower","rainbow"],["blossom","bug"]] },
  { id:"honey", e:"\u{1F36F}",
    r:[["bee","blossom"]] },
  { id:"bear", e:"\u{1F43B}",
    r:[["animal","honey"]] },
  { id:"polar bear", e:"\u{1F43B}\u{200D}\u{2744}\u{FE0F}",
    r:[["bear","ice"],["bear","snow"],["bear","white"],["animal","white"]] },
  { id:"acid", e:"\u{1F9EA}",
    r:[["green","water"]] },
  { id:"electricity", e:"⚡",
    r:[["acid","metal"],["kite","lightning"]] },
  { id:"light bulb", e:"\u{1F4A1}",
    r:[["electricity","glass"]] },
  { id:"plug", e:"\u{1F50C}",
    r:[["copper","electricity"]] },
  { id:"ice", e:"\u{1F9CA}",
    r:[["cyan","water"],["water","night"]] },
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
    r:[["diamond","glass"],["glass","tool"],["glass","scientist"],
       ["glass","white"]] },
  { id:"rainbow", e:"\u{1F308}",
    r:[["white","prism"],["sun","rain"],["prism","sun"],
       ["light bulb","prism"]] },
  { id:"magic", e:"\u{1FA84}",
    r:[["wood","star"],["pumpkin","night"],["rainbow","crystal ball"],["crystal ball","wizard"]] },
  { id:"crystal ball", e:"\u{1F52E}",
    r:[["magic","glass"],["violet","glass"],["magic","mirror"]] },
  { id:"unicorn", e:"\u{1F984}",
    r:[["horse","magic"],["animal","magic"]] },
  { id:"plant", e:"\u{1F33F}",
    r:[["earth","sun"],["life","sun"],["green","life"]] },
  { id:"medicine", e:"\u{1F48A}",
    r:[["plant","acid"]] },
  { id:"potato", e:"\u{1F954}",
    r:[["plant","brown"],["farmer","field"]] },
  // TWO ROUTES THAT SAY DIFFERENT THINGS. Orange + Plant is the table's own
  // colour-plus-category idiom, the one Rose and Pumpkin and Flamingo already
  // use; Earth + Orange is the Peanut argument instead — the orange thing that
  // grows in the ground — so the second route comes at it from the soil rather
  // than saying the first one again in other words.
  { id:"carrot", e:"\u{1F955}",
    r:[["orange","plant"],["earth","orange"]] },
  // beside the Carrot, not up in the animals: "animal" is everywhere in this
  // table and "carrot" is one line old, so the rare string is the one to hug —
  // the Elephant measured three bytes UNDER its baseline on that reasoning
  // WITH THE VEGETABLES, AND THE PLACEMENT RULE BENDS HERE. Everything since
  // the Elephant has sat beside its RAREST ingredient — "violet" is in the
  // file five times and "egg" eight, against "plant"'s twelve — but all three
  // placements were built and the vegetables won: 13056 here, 13061 beside the
  // Egg, 13067 beside the Violet. The reason WAS that this entry leaned on
  // "plant" twice, once in each recipe — but the Bug has since taken Egg +
  // Plant, so only the Violet route is left and the doubled string is gone.
  // The measurement above is therefore stale for this entry; it stays with the
  // vegetables because Plant is still its surviving half, not because of a
  // repeat. Re-measure before moving it.
  { id:"eggplant", e:"\u{1F346}",
    r:[["violet","plant"]] },
  // THE SAME ARGUMENT AS THE EGGPLANT, one line up: this entry spends "plant"
  // twice too, so it sits with the vegetables rather than beside the Farmer,
  // who is the rarer string. Measured a tie at 12766 either side of the
  // Carrot, and the repeat is what breaks it. Plant + Yellow is the colour
  // idiom the Carrot and the Eggplant already speak; Farmer + Plant is the
  // second thing said differently, and it hands the FARMER A SECOND CONSUMER
  // — the Potato's field was the only one.
  { id:"corn", e:"\u{1F33D}",
    r:[["plant","yellow"],["farmer","plant"]] },
  { id:"popcorn", e:"\u{1F37F}",
    r:[["corn","fire"],["cooking","corn"]] },
  { id:"rabbit", e:"\u{1F407}",
    r:[["animal","carrot"]] },
  { id:"cactus", e:"\u{1F335}",
    r:[["plant","sand"],["green","sand"]] },
  { id:"desert", e:"\u{1F3DC}\u{FE0F}",
    r:[["cactus","sand"]] },
  // a horizon rather than an object: sky above, green below, hard stop between
  { id:"field", c:"#5fb54a",
    bg:"linear-gradient(180deg, #a8dbff 0%, #7ec8ff 46%, #5fb54a 46%, #3f8c36 100%)",
    r:[["earth","plant"],["earth","green"]] },
  // THE CORN'S SENTENCE ONE RANK UP, which is the move the Crown makes on the
  // Ring: Plant + Yellow is the Corn, and the Field is Plant in the Earth, so
  // Field + Yellow is the golden crop standing in it. Sun + Field is the same
  // crop ripened rather than coloured — two directions, not one said twice.
  // Pressed against the Field because it spends "field" in both recipes and
  // "field" is the rarer string in either, which is the Bacon's rule.
  //
  // THE SECOND SVG IN THE TABLE, after Matter, and the reason is that Unicode
  // has no wheat. U+1F33E is named SHEAF OF RICE and is drawn like one — a
  // bent panicle with the grains drooping AWAY from the stem, where a wheat
  // ear is stiff and upright with the grains pressed against it. At 32px the
  // droop is the only thing that survives, so the glyph reads "rice" to anyone
  // who knows the difference and "grass" to everyone else. It stays on the
  // FARMER, \u{1F9D1}\u{200D}\u{1F33E}, where the grain is a prop in a hand
  // and only has to read as "crop"; standing alone as the crop itself, two
  // rows from the Corn, it has to do more than that.
  //
  // COSTS +104 B, MEASURED — 13191 to 13295. The awned version, with three
  // strokes past the tip for the bristles that are what actually separate
  // wheat from every other grain, is the better drawing and costs +146 B,
  // which is 25 B OVER the budget. Both are drawn and argued in
  // experiments/wheat-icon.html; take the awns when there is room, and the
  // stale fn-order re-fit is the first place to look for it.
  //
  // AND DO NOT ESTIMATE AN SVG FROM THE TABLE'S OWN RATE. This was first
  // costed at ~55 B from the character count at the table's 1.86 bits/char,
  // and was wrong by three times: the table is that cheap because it is
  // overwhelmingly REPEATED text, and an SVG is novel markup that packs at
  // about 2.7 bits/char. Budget a byte for every three raw characters.
  { id:"wheat", c:"#e9a53f",
    s:"<g transform='translate(16 14)'>" +
      "<rect x='-1.2' y='-1' width='2.4' height='16' rx='1.2' fill='#b9782a'/>" +
      "<g fill='#e9a53f'>" +
      "<ellipse cx='-3.7' cy='4' rx='2.5' ry='3.9' transform='rotate(-30 -3.7 4)'/>" +
      "<ellipse cx='3.7' cy='4' rx='2.5' ry='3.9' transform='rotate(30 3.7 4)'/>" +
      "<ellipse cx='-3.4' cy='-2' rx='2.5' ry='3.9' transform='rotate(-30 -3.4 -2)'/>" +
      "<ellipse cx='3.4' cy='-2' rx='2.5' ry='3.9' transform='rotate(30 3.4 -2)'/>" +
      "<ellipse cx='0' cy='-7.5' rx='2.5' ry='4.2'/></g></g>",
    r:[["field","yellow"],["field","sun"]] },
  // AND THE WHOLE REASON THE WHEAT EXISTS — but not the reason it was first
  // written down, and the difference is worth keeping. The Bread was built to
  // wear the Chef-and-Cooking DOUBLET the Burger, the French Fries and the
  // Bacon wear, where either verb makes the same dish; the Corn could not give
  // it one, Popcorn already owning both Corn + Cooking and Corn + Fire.
  //
  // THE DOUBLET IS NOT WHAT THE WHEAT ENDED UP CARRYING. The two verbs split
  // here instead: Cooking is the bare process and gives the plain loaf, the
  // Chef is the skilled hand and gives the Croissant below. That reads better
  // than the doublet did, and it re-states the Bacon's own line — "Cooking is
  // the process, the Chef is who does it" — as a distinction rather than as
  // two names for one thing.
  // So the table now says: the verbs AGREE unless the skilled version is a
  // different dish. The Burger, the Fries and the Bacon are the agreeing case;
  // the Bread and the Croissant are the splitting one, and so is the Pizza
  // against the Fondue, which stops being the anomaly it looked like.
  // Against the Wheat, whose id it spends and which is among the rarest
  // strings in the file.
  { id:"bread", e:"\u{1F35E}",
    r:[["cooking","wheat"]] },
  // THE BREAD'S THIRD CONSUMER, after the Pizza and the Sandwich, and the one
  // that makes it a hub rather than a leaf. Two directions rather than one
  // said twice: Bread + Pig is what the thing IS — the Bacon's own animal
  // between two halves of the Bread — and Bread + Cooking is the lazier route
  // a player reaches for first, the Bread simply put on the heat.
  // Against the Bread and NOT up in the pig run beside the Sandwich, measured
  // both ways: 13329 here against 13339 there. That is the opposite of where
  // the Sandwich landed, which wanted the pig run and refused the Bread by the
  // same 8-10 B — one more count against there being any rule to this.
  { id:"hot dog", e:"\u{1F32D}",
    r:[["bread","pig"],["bread","cooking"]] },
  // THE SKILLED HALF of that split, and the Chef's most demanding job in the
  // table: same grain, same baker, and what separates the loaf from the pastry
  // is the hand rather than the ingredient. Pressed against the Bread so the
  // two halves of the argument above sit together and "wheat" is one line up.
  { id:"croissant", e:"\u{1F950}",
    r:[["chef","wheat"]] },
  { id:"waffle", e:"\u{1F9C7}",
    r:[["egg","wheat"]] },
  { id:"park", e:"\u{1F3DE}\u{FE0F}",
    r:[["field","water"]] },
  // AND HERE THE PATTERN THE BANK AND THE CHAMPAGNE SUGGESTED BREAKS, which is
  // why it was measured rather than trusted. Both of those went to the LATER
  // of two placements, by 15 B and 16 B; this one is 3 B CHEAPER in the early
  // one — 13177 beside the Park against 13180 down beside the Angel, where it
  // would have joined the Baby's own figure-plus-place run and repeated
  // "baby" one line up.
  // Three measurements, no rule: placement is worth an A/B and is not worth a
  // theory, which is the finding tools/fn-order.mjs already carries about
  // function order for the same compressor. Take the A/B, keep the number.
  { id:"playground", e:"\u{1F6DD}",
    r:[["baby","park"]] },
  // TREE AND NUT MAKE EACH OTHER — Blossom + Tree is the Nut, a wet Nut is the
  // Tree. Cyclic the way Magic and the Crystal Ball are, and it resolves for
  // the same reason: Tree keeps Water + Plant, a route that does not run
  // through Nut, so the pair always has one independent way in. Nut needs no
  // second route of its own, but Tree must never lose that one.
  { id:"tree", e:"\u{1F333}",
    r:[["water","plant"],["nut","water"],["nut","rain"]] },
  { id:"palm", e:"\u{1F334}",
    r:[["sand","tree"]] },
  { id:"island", e:"\u{1F3DD}\u{FE0F}",
    r:[["sand","palm"]] },
  { id:"world", e:"\u{1F30D}",
    r:[["earth","sea"]] },
  { id:"map", e:"\u{1F5FA}\u{FE0F}",
    r:[["paper","world"]] },
  { id:"fruit", e:"\u{1F34E}",
    r:[["tree","sun"]] },
  { id:"juice", e:"\u{1F9C3}",
    r:[["fruit","water"]] },
  { id:"banana", e:"\u{1F34C}",
    r:[["fruit","yellow"]] },
  // Fruit + colour, the sentence the Banana above and the Pumpkin below both
  // say, and this one spends the Chartreuse — the colour a lime actually is.
  // "fruit" leads the pair so all three read `["fruit", …]` exactly.
  //
  // The second route is the Lemon, and the two of them are MUTUALLY CYCLIC the
  // way Magic and the Crystal Ball are: Lemon + Green is a Lime, Lime + Yellow
  // is a Lemon. It resolves for the same reason that one does — both ends keep
  // a way in that does not run through the other, the Lime through Fruit +
  // Chartreuse and the Lemon through Fruit + Acid. MEASURED, the way that pair
  // was: drop either one and everything still resolves — the survivor carries
  // the other through the cycle — but drop BOTH and the Lime and the Lemon go
  // unreachable together. One independent way in, somewhere in the pair, is
  // the invariant here too.
  // "lemon" trails the pair so it lands against the entry below it.
  { id:"lime", e:"\u{1F34B}\u{200D}\u{1F7E9}",
    r:[["fruit","chartreuse"],["green","lemon"]] },
  // The sour half, and the two directions are the chemistry and the colour:
  // Acid is what a lemon IS, the Lime plus the Yellow is what it looks like.
  // "fruit" leads again, so the Banana, the Lime and this all share a prefix.
  { id:"lemon", e:"\u{1F34B}",
    r:[["fruit","acid"],["lime","yellow"]] },
  // Fruit + colour again, and it is here to be an INGREDIENT: the Peace was
  // Bird + Plant, a generic branch doing the work of a specific one, and this
  // is the branch the story actually names.
  { id:"olive", e:"\u{1FAD2}",
    r:[["fruit","green"]] },
  // Monkey + Banana is the pair everyone tries the moment they hold both, and
  // Grey + Monkey is the same colour-plus-category move that makes the
  // Orangutan two entries up — the diet and the colour, coming at it from
  // different directions rather than saying one thing twice.
  { id:"gorilla", e:"\u{1F98D}",
    r:[["monkey","banana"],["grey","monkey"]] },
  // Fruit + colour once more — the Banana is yellow, the Pumpkin orange, the
  // Lime chartreuse, and a brown one is this. "fruit" trails both pairs here
  // because the Palm route already put it there.
  { id:"coconut", e:"\u{1F965}",
    r:[["palm","fruit"],["brown","fruit"]] },
  { id:"pumpkin", e:"\u{1F383}",
    r:[["fruit","orange"]] },
  { id:"axe", e:"\u{1FA93}",
    r:[["tree","tool"]] },
  { id:"wood", e:"\u{1FAB5}",
    r:[["tree","axe"],["tree","saw"],["brown","tree"]] },
  { id:"saw", e:"\u{1FA9A}",
    r:[["wood","tool"]] },
  // Two directions, and the grass/tree confusion is the point of them: Plant +
  // Wood is what bamboo IS — a grass with a trunk — and Green + Tree is what
  // it looks like from across a garden. Kept against the Wood because "wood"
  // is the rarer of its two strings here, and "tree" closes the second pair
  // the way the Wood's own two do.
  { id:"bamboo", e:"\u{1F38D}",
    r:[["plant","wood"],["green","tree"]] },
  // Beside its food rather than up with the beasts, the way the Bacon sits
  // beside the Pig: "bamboo" is a single occurrence before this entry and this
  // entry spends it twice, where "animal" is in forty recipes and "bear" in
  // eight. Both pairs trail it, so it lands against the id one line up.
  // Two directions in the ordinary sense too — the Animal is any creature that
  // lives on the stuff, the Bear is which creature it turned out to be.
  { id:"panda", e:"\u{1F43C}",
    r:[["animal","bamboo"],["bear","bamboo"]] },
  // Animal + habitat once more, but the noun is what the beast is FOR rather
  // than where it lives — Wood is the thing a beaver fells and builds with.
  // Placed against the Wood above, not up with the beasts, because "wood" is
  // in ten recipes against "animal"'s forty.
  { id:"beaver", e:"\u{1F9AB}",
    r:[["animal","wood"]] },
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
       ["book","fire"],["fire","painting"],["sun","vampire"]] },
  { id:"mushroom", e:"\u{1F344}",
    r:[["rain","wood"]] },
  // TWO MORE MUTUAL CYCLES, and they hold the same way Magic and the Crystal
  // Ball do: the Tool works a Student into a Pencil and a Teacher into a Book,
  // while the Student comes from the Teacher and the Teacher from the Book.
  // Both ends keep a route that does not run through the other — the Pencil
  // from Wood + Charcoal, the Student from Human + School, the Book from
  // Paper + Pencil, the Teacher from Eyeglasses + Human — so the school
  // resolves from either side. Flavour for a pair players try, never the
  // cheaper way in: a Teacher already costs a Book, and a Student a Teacher.
  { id:"pencil", e:"\u{270F}\u{FE0F}",
    r:[["wood","charcoal"],["student","tool"]] },
  { id:"paper", e:"\u{1F4C4}",
    r:[["stone","tree"],["white","wood"]] },
  { id:"book", e:"\u{1F4D6}",
    r:[["paper","pencil"],["teacher","tool"]] },
  { id:"palette", e:"\u{1F3A8}",
    r:[["rainbow","wood"]] },
  { id:"kite", e:"\u{1FA81}",
    r:[["air","paper"]] },
  { id:"scissors", e:"\u{2702}\u{FE0F}",
    r:[["paper","tool"]] },
  // AND THE SCISSORS' FIRST, for the reason the Diving Mask is the Goggles':
  // "scissors" appears once in the whole file and "dog" four times, so the
  // poodle is filed with the stationery rather than with the beasts. The Lion
  // sits away from the animals on the same argument. A dog that has been at
  // the groomer's is the joke, and the clip is the one thing a poodle is.
  { id:"poodle", e:"\u{1F429}",
    r:[["dog","scissors"]] },
  { id:"bookmark", e:"\u{1F516}",
    r:[["book","paper"]] },
  // THE SECOND ACRONYM, spelled the way the uFO is and for the same reason:
  // the derivation only ever uppercases a word's FIRST letter, so "iD" is what
  // comes back out as "ID". Human + Paper is the whole joke — a person written
  // down is the piece of paper that says who they are.
  // In the paper run rather than beside the Human, which is the placement rule
  // the Crown and the Lion already follow: "paper" is in six recipes and
  // "human" in twenty-odd, so the rare string is the one to hug.
  { id:"iD", e:"\u{1FAAA}",
    r:[["human","paper"]] },
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
  // U+1F451 was the COMPLETION BADGE until this commit — the HUD goal line and
  // both goal overlays wore it — so the badge moved to the trophy to free it.
  // Gold + Diamond is Metal + Diamond one rank up, the sentence the Ring above
  // already taught; Gold + Metal is the cheaper way in, three steps shallower,
  // for anyone who reaches the gold long before the charcoal and the lava.
  { id:"crown", e:"\u{1F451}",
    r:[["gold","diamond"],["gold","metal"]] },
  // beside the Crown it comes from: "crown" is one line old here and "human"
  // is in twenty-odd recipes, so the rare string is the one to hug
  { id:"king", e:"\u{1FAC5}",
    r:[["crown","human"]] },
  // King + House is who it belongs to, Stone + House is what it is made of —
  // two directions rather than one said twice. Beside the King for the same
  // reason the King sits beside the Crown: "king" is the string one line up
  // and "house" is already in four recipes.
  { id:"castle", e:"\u{1F3F0}",
    r:[["king","house"],["stone","house"]] },
  // fourth of the royal run and the second thing the Crown makes: the king of
  // the animals, put together exactly that way. Kept here rather than up with
  // the beasts because "animal" is in a dozen recipes and "crown" is in two.
  { id:"lion", e:"\u{1F981}",
    r:[["animal","crown"]] },
  // the table's second big cat, after the Cat and the Black Cat, and the
  // colour-plus-category move once more: Animal + Orange is the Fox, so the
  // orange version of the LION is the one striped big cat. Beside the Lion,
  // whose id appears twice in the file against orange's dozen.
  { id:"tiger", e:"\u{1F405}",
    r:[["lion","orange"]] },
  { id:"wedding", e:"\u{1F492}",
    r:[["human","ring"]] },
  { id:"baby", e:"\u{1F476}",
    r:[["human","life"],["wedding","life"]] },
  // The Baby's second consumer after the Teddy Bear, and the Sky's sixth.
  // Figure + place, which is the Mermaid's move and the Astronaut's: what it
  // is, and where it is. "baby" leads so it repeats the id one line up.
  { id:"angel", e:"\u{1F47C}",
    r:[["baby","sky"]] },
  { id:"blossom", e:"\u{1F33C}",
    r:[["plant","pink"],["life","plant"]] },
  { id:"cherry blossom", e:"\u{1F338}",
    r:[["blossom","pink"]] },
  { id:"nut", e:"\u{1F330}",
    r:[["blossom","tree"]] },
  // PEANUT TAKES THE PAIR TREE USED TO OWN — the Brown/Earth swap again, and
  // safe for the same reason it was there: Tree keeps Water + Plant, a route
  // that does not run through Nut, and eight recipes are downstream of Tree.
  // The pair fits better here anyway; a peanut is the nut that grows in the
  // ground. Placed against Nut so the id it is built from is the string
  // immediately above it.
  { id:"peanut", e:"\u{1F95C}",
    r:[["nut","earth"]] },
  { id:"sunflower", e:"\u{1F33B}",
    r:[["sun","blossom"],["blossom","yellow"]] },
  { id:"rose", e:"\u{1F339}",
    r:[["blossom","red"],["plant","red"]] },
] as RawDef[]).map(e => (e.n = e.id.replace(/(^| )./g, (c) => c.toUpperCase()), e)) as ElementDef[];

// THE RECIPE IDS ABOVE ARE WORDS IN THIS FILE AND TWO CHARACTERS IN THE BUNDLE.
// The `encode-recipes` plugin in rollup.config.mjs rewrites every id inside an
// r:[...] to a two-character code indexing this table, and expands __DECODE__
// into the pass that turns them back into words right here — before BY_ID and
// RECIPE are built, so everything downstream, the "a+b" keys in localStorage
// included, sees exactly the strings it always did. Worth 161 B packed,
// measured; the reasons for the exact encoding are in the plugin's comment.
// Only a golfed build encodes: for `npm start` and the director's cut this is
// 0 and the ids above are already the words they look like.
__DECODE__;

export const STARTERS = ["red", "green", "blue"];

export const BY_ID: Record<string, ElementDef> = {};
ELEMENTS.map(e => (BY_ID[e.id] = e));

// "a+b" (ids sorted) -> result id
export const RECIPE: Record<string, string> = {};
ELEMENTS.map(e => (e.r || []).map(p => (RECIPE[[...p].sort().join("+")] = e.id)));

export const N = (id: string): string => BY_ID[id].n;
