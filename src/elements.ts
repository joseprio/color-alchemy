// The element tree. n = display name (OPTIONAL — omitted when it is just the id
// with a capital, which is the one field roadroller genuinely pays for: a
// near-miss repeat of a string it has already seen costs real bits where an
// exact repeat costs almost none, so omitting the derivable ones is worth
// ~380 B packed; it is filled in below so every consumer sees a plain string),
// c = colour swatch, bg = custom swatch background (any CSS background stack),
// e = emoji icon, s = inline SVG body on a 0 0 32 32 viewBox (rendered as an
// <svg class="s">, so it picks up the square swatches' size rules, and c still
// supplies the glow), r = recipes (unordered pairs of ids). Several recipes may
// make one element, and an alternate may be cyclic (Lava + Stone melts back
// into Lava) — that is flavour for a pair players try, never a cheaper route.
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
  { id:"hospital", e:"\u{1F3E5}",
    r:[["doctor","house"]] },
  { id:"beer", e:"\u{1F37A}",
    r:[["gold","water"]] },
  { id:"wine", e:"\u{1F377}",
    r:[["red","water"]] },
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
  { id:"stone", e:"\u{1FAA8}",
    r:[["lava","water"],["lava","rain"],["lava","air"],["grey","matter"]] },
  { id:"metal", c:"#c3ced9",
    bg:"linear-gradient(120deg, transparent 0 30%, #ffffffaa 30% 38%, transparent 38% 62%," +
       "#ffffff55 62% 68%, transparent 68%)," +
       "linear-gradient(180deg, #e6edf3 0%, #aab6c2 38%, #6e7a86 62%, #cdd7e0 100%)",
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
  { id:"sand", c:"#e0c078",
    bg:"radial-gradient(circle at 30% 30%, #fff2c8aa 0 3%, transparent 6%)," +
       "radial-gradient(circle at 70% 45%, #b98a4d88 0 3%, transparent 6%)," +
       "radial-gradient(circle at 45% 70%, #fff2c899 0 2.5%, transparent 5%)," +
       "linear-gradient(115deg, #ecd08a 0 54%, #d3ab5e 54% 100%)",
    r:[["earth","air"],["stone","air"],["earth","yellow"]] },
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
  { id:"tornado", e:"\u{1F32A}️",
    r:[["air","storm"]] },
  { id:"life", e:"\u{1F9EC}",
    r:[["lightning","water"],["sun","water"]] },
  { id:"alien", e:"\u{1F47D}",
    r:[["life","star"]] },
  // one of the few ids the derived name gets wrong — "Ufo" — so it pays for an
  // explicit n, the way Black Cat and Crystal Ball do
  { id:"ufo",n:"UFO", e:"\u{1F6F8}",
    r:[["alien","sky"]] },
  { id:"jellyfish", e:"\u{1FABC}",
    r:[["water","life"]] },
  { id:"coral", e:"\u{1FAB8}",
    r:[["sea","life"]] },
  { id:"egg", e:"\u{1F95A}",
    r:[["stone","life"]] },
  { id:"cooking", e:"\u{1F373}",
    r:[["egg","fire"],["egg","tool"]] },
  { id:"animal", e:"\u{1F43E}",
    r:[["earth","life"]] },
  { id:"lizard", e:"\u{1F98E}",
    r:[["stone","animal"],["animal","green"],["egg","lizard"]] },
  { id:"frog", e:"\u{1F438}",
    r:[["lizard","water"]] },
  { id:"camel", e:"\u{1F42A}",
    r:[["animal","sand"]] },
  { id:"horse", e:"\u{1F434}",
    r:[["animal","field"]] },
  { id:"donkey", e:"\u{1FACF}",
    r:[["grey","horse"]] },
  { id:"sheep", e:"\u{1F411}",
    r:[["animal","cloud"]] },
  { id:"yarn", e:"\u{1F9F6}",
    r:[["sheep","tool"]] },
  { id:"scarf", e:"\u{1F9E3}",
    r:[["human","yarn"]] },
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
    r:[["cow","water"],["white","water"]] },
  { id:"cat", e:"\u{1F408}",
    r:[["animal","yarn"],["animal","milk"]] },
  { id:"blackcat",n:"Black Cat", e:"\u{1F408}\u{200D}\u{2B1B}",
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
  { id:"burger", e:"\u{1F354}",
    r:[["chef","cow"],["cooking","cow"]] },
  { id:"sushi", e:"\u{1F363}",
    r:[["chef","fish"]] },
  { id:"frenchfries",n:"French Fries", e:"\u{1F35F}",
    r:[["potato","chef"],["potato","cooking"]] },
  { id:"pizza", e:"\u{1F355}",
    r:[["cheese","cooking"],["cheese","chef"]] },
  { id:"party", e:"\u{1F389}",
    r:[["beer","pizza"],["beer","sushi"],["cheese","wine"],["burger","frenchfries"]] },
  { id:"fireworks", e:"\u{1F386}",
    r:[["party","sky"],["party","night"]] },
  { id:"icecream",n:"Ice Cream", e:"\u{1F368}",
    r:[["ice","milk"],["chef","ice"]] },
  { id:"salad", e:"\u{1F957}",
    r:[["chef","plant"]] },
  { id:"eyeglasses", e:"\u{1F453}",
    r:[["human","glass"]] },
  // with the Eyeglasses, the table's other person-plus-material wearable. The
  // ground the shoe is for is EARTH: there is no separate ground element, and
  // Human + Stone is already the Statue.
  { id:"shoe", e:"\u{1F45F}",
    r:[["human","earth"],["human","sand"]] },
  { id:"ninja", e:"\u{1F977}",
    r:[["human","black"]] },
  { id:"wizard", e:"\u{1F9D9}",
    r:[["human","magic"],["human","crystalball"],["owl","book"]] },
  { id:"vampire", e:"\u{1F9DB}",
    r:[["human","bat"]] },
  { id:"statue", e:"\u{1F5FF}",
    r:[["human","stone"],["stone","tool"],["artist","stone"]] },
  { id:"farmer", e:"\u{1F9D1}\u{200D}\u{1F33E}",
    r:[["human","field"]] },
  { id:"artist", e:"\u{1F9D1}\u{200D}\u{1F3A8}",
    r:[["human","palette"]] },
  { id:"painting", e:"\u{1F5BC}\u{FE0F}",
    r:[["artist","palette"],["palette","paper"],["artist","paper"]] },
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
  { id:"mermaid", e:"\u{1F9DC}\u{200D}\u{2640}\u{FE0F}",
    r:[["human","fish"]] },
  // HUMAN + SNOW IS THE SNOWMAN'S ONLY ROUTE, and it is load-bearing: two of
  // Water's recipes run back through the Snowman, so anything taking this pair
  // strands it. Santa was briefly given it and had to pay two alternates back
  // to keep the tree whole; Santa comes off the Wizard instead now, and those
  // alternates went with the problem they were solving.
  { id:"snowman", e:"\u{26C4}",
    r:[["human","snow"]] },
  { id:"santa", e:"\u{1F385}",
    r:[["wizard","snow"]] },
  { id:"robot", e:"\u{1F916}",
    r:[["human","metal"]] },
  { id:"astronaut", e:"\u{1F9D1}\u{200D}\u{1F680}",
    r:[["human","moon"],["human","star"]] },
  { id:"zombie", e:"\u{1F9DF}",
    r:[["human","green"],["ghost","human"]] },
  { id:"teacher", e:"\u{1F9D1}\u{200D}\u{1F3EB}",
    r:[["book","human"],["eyeglasses","human"]] },
  { id:"school", e:"\u{1F3EB}",
    r:[["teacher","house"]] },
  { id:"doctor", e:"\u{1F9D1}\u{200D}\u{2695}\u{FE0F}",
    r:[["medicine","human"]] },
  { id:"bird", e:"\u{1F426}",
    r:[["air","animal"],["air","penguin"]] },
  { id:"chick", e:"\u{1F425}",
    r:[["egg","bird"],["duck","egg"],["egg","flamingo"],["egg","swan"]] },
  { id:"penguin", e:"\u{1F427}",
    r:[["bird","ice"],["bird","black"]] },
  { id:"duck", e:"\u{1F986}",
    r:[["bird","water"]] },
  { id:"fish", e:"\u{1F41F}",
    r:[["animal","water"],["animal","blue"]] },
  { id:"sea", e:"\u{1F30A}",
    r:[["island","water"],["fish","water"],["mermaid","house"]] },
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
  { id:"swan", e:"\u{1F9A2}",
    r:[["white","duck"],["white","bird"]] },
  { id:"peacock", e:"\u{1F99A}",
    r:[["bird","rainbow"]] },
  { id:"phoenix", e:"\u{1F426}\u{200D}\u{1F525}",
    r:[["bird","fire"],["ash","fire"]] },
  { id:"bee", e:"\u{1F41D}",
    r:[["animal","blossom"],["animal","yellow"]] },
  { id:"honey", e:"\u{1F36F}",
    r:[["bee","blossom"]] },
  { id:"bear", e:"\u{1F43B}",
    r:[["animal","honey"]] },
  { id:"polarbear",n:"Polar Bear", e:"\u{1F43B}\u{200D}\u{2744}\u{FE0F}",
    r:[["bear","ice"],["bear","snow"],["bear","white"],["animal","white"]] },
  { id:"acid", e:"\u{1F9EA}",
    r:[["green","water"]] },
  { id:"electricity", e:"⚡",
    r:[["acid","metal"],["kite","lightning"]] },
  { id:"lightbulb", n:"Light Bulb", e:"\u{1F4A1}",
    r:[["electricity","glass"]] },
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
    r:[["diamond","glass"],["glass","tool"],["glass","white"]] },
  { id:"rainbow", e:"\u{1F308}",
    r:[["white","prism"],["sun","rain"],["prism","sun"],
       ["lightbulb","prism"]] },
  { id:"magic", e:"\u{1FA84}",
    r:[["wood","star"],["pumpkin","night"],["rainbow","crystalball"],["crystalball","wizard"]] },
  { id:"crystalball",n:"Crystal Ball", e:"\u{1F52E}",
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
  { id:"park", e:"\u{1F3DE}\u{FE0F}",
    r:[["field","water"]] },
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
  { id:"fruit", e:"\u{1F34E}",
    r:[["tree","sun"]] },
  { id:"banana", e:"\u{1F34C}",
    r:[["fruit","yellow"]] },
  // Monkey + Banana is the pair everyone tries the moment they hold both, and
  // Grey + Monkey is the same colour-plus-category move that makes the
  // Orangutan two entries up — the diet and the colour, coming at it from
  // different directions rather than saying one thing twice.
  { id:"gorilla", e:"\u{1F98D}",
    r:[["monkey","banana"],["grey","monkey"]] },
  { id:"coconut", e:"\u{1F965}",
    r:[["palm","fruit"]] },
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
       ["book","fire"],["fire","painting"],["sun","vampire"]] },
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
  // U+1F451 was the COMPLETION BADGE until this commit — the HUD goal line and
  // both goal overlays wore it — so the badge moved to the trophy to free it.
  // Gold + Diamond is Metal + Diamond one rank up, the sentence the Ring above
  // already taught; Gold + Metal is the cheaper way in, three steps shallower,
  // for anyone who reaches the gold long before the charcoal and the lava.
  { id:"crown", e:"\u{1F451}",
    r:[["gold","diamond"],["gold","metal"]] },
  { id:"wedding", e:"\u{1F492}",
    r:[["human","ring"]] },
  { id:"baby", e:"\u{1F476}",
    r:[["human","life"],["wedding","life"]] },
  { id:"blossom", e:"\u{1F33C}",
    r:[["plant","pink"],["life","plant"]] },
  { id:"cherryblossom",n:"Cherry Blossom", e:"\u{1F338}",
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
] as RawDef[]).map(e => (e.n = e.n || e.id[0].toUpperCase() + e.id.slice(1), e)) as ElementDef[];

export const STARTERS = ["red", "green", "blue"];

export const BY_ID: Record<string, ElementDef> = {};
ELEMENTS.map(e => (BY_ID[e.id] = e));

// "a+b" (ids sorted) -> result id
export const RECIPE: Record<string, string> = {};
ELEMENTS.map(e => (e.r || []).map(p => (RECIPE[[...p].sort().join("+")] = e.id)));

export const N = (id: string): string => BY_ID[id].n;
