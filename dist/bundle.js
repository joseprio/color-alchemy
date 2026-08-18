document.getElementById("sty").innerHTML = "*{box-sizing:border-box}body,html{height:100%}body{align-items:center;background:#05060f;background-image:radial-gradient(1200px 600px at 80% -10%,#1a1035 0,transparent 60%),radial-gradient(900px 500px at 10% 110%,#071f2a 0,transparent 60%);color:#cfe3ff;display:flex;flex-direction:column;font:14px/1.45 monospace;margin:0;overflow-x:hidden;touch-action:manipulation}header{margin:14px 0 0;text-align:center}h1{background:linear-gradient(90deg,#ff3b30,#ff9430,#ffdc32,#34d158,#33e9e9,#2f6bff,#9a4dff);-webkit-background-clip:text;background-clip:text;color:transparent;font-size:26px;font-weight:700;letter-spacing:.18em;margin:0}#goal{color:#8fb4d8;margin:4px 0 0}#goal,#hud{font-size:13px}#hud{align-items:center;display:flex;flex-wrap:wrap;gap:18px;justify-content:center;margin:10px 0 4px}#hud b{color:#fff;font-weight:700}#bestq{color:#ffd75e}#bestq:empty{display:none}#hnt,#mnu,#snd{background:#101528;border:1px solid #2a3555;border-radius:6px;color:#7f9fc0;cursor:pointer;font:inherit;font-size:12px;padding:2px 10px}@media (pointer:coarse){#hnt,#mnu,#snd{min-height:44px;padding:10px 14px}}#hnt i,#mnu i,#snd i{color:#55708e;font-style:normal;margin-left:6px}#snd.off{border-color:#1b2540;color:#55708e}#grid{display:grid;gap:10px;grid-template-columns:repeat(auto-fill,92px);justify-content:center;margin:12px 0 8px;padding:0 4px 8px;width:min(96vw,640px)}.tile{animation:a .25s ease-out;background:#0c1122cc;border:1px solid #223052;border-radius:12px;cursor:pointer;padding:10px 4px 8px;text-align:center;transition:transform .08s,border-color .12s,background .12s;user-select:none;-webkit-user-select:none;width:92px}@keyframes a{0%{opacity:0;transform:scale(.4)}to{opacity:1;transform:scale(1)}}.tile:hover{border-color:#3d5584}.tile.sel{background:#1a1a10cc;border-color:#ffd75e;box-shadow:0 0 14px #ffd75e33;transform:scale(1.06)}.tile.cur{outline:2px solid #33e9e9;outline-offset:2px}.tile.dragsrc{opacity:.35}.tile.drop{background:#101f14cc;border-color:#7dff9a;box-shadow:0 0 14px #7dff9a44;transform:scale(1.06)}.tile.settled{animation:none}.tile.bad{animation:b .4s cubic-bezier(.36,.07,.19,.97);border-color:#ff6b6b}@keyframes b{10%,90%{transform:translateX(-2px)}20%,80%{transform:translateX(4px)}30%,50%,70%{transform:translateX(-7px)}40%,60%{transform:translateX(7px)}}.tile.hit{animation:c .5s ease-out;border-color:#33e9e9}@keyframes c{0%{box-shadow:0 0 0 0 #33e9e955;transform:scale(1)}45%{box-shadow:0 0 18px 4px #33e9e955;transform:scale(1.13)}to{box-shadow:0 0 0 0 #33e9e900;transform:scale(1)}}.tile.ghost{animation:none;left:0;margin:0;opacity:.92;pointer-events:none;position:fixed;top:0;transform:translate(-50%,-55%) scale(1.08);transition:none;z-index:1}.ico{align-items:center;display:flex;font-size:32px;height:42px;justify-content:center;line-height:1}.sw{border-radius:6px;box-shadow:0 0 10px 1px var(--g,transparent);height:32px;width:32px}.nm{color:#b9d2ee;font-size:12px;margin-top:6px}footer{color:#55708e;font-size:11px;margin:4px 0 18px;padding:0 12px}#toast,footer{text-align:center}#toast{background:#131a30f0;border:1px solid #33436e;border-radius:8px;bottom:34px;color:#cfe3ff;font-size:13px;left:50%;max-width:calc(100vw - 24px);opacity:0;padding:8px 16px;pointer-events:none;position:fixed;transform:translateX(-50%);transition:opacity .2s;z-index:3}#toast.show{opacity:1}.veil{align-items:center;background:#030409cc;display:none;inset:0;justify-content:center;position:fixed;z-index:4}.veil.show{display:flex}.card{background:#0c1122;border:1px solid #33e9e9;border-radius:14px;box-shadow:0 0 40px #33e9e922;max-width:min(88vw,420px);padding:26px 34px;text-align:center}.card .big{display:flex;font-size:56px;justify-content:center;line-height:1;margin-bottom:10px}.card .big .sw{border-radius:10px;height:56px;width:56px}.card .tag{color:#33e9e9;font-size:11px;letter-spacing:.3em}.card h2{color:#fff;font-size:22px;margin:6px 0 2px}.card .quote{color:#8fb4d8;font-style:italic;margin:8px 0 2px}.card .recipe{color:#55708e;font-size:12px;margin:6px 0 0}.card .hint{color:#3d5584;font-size:11px;margin:14px 0 0}.mstage{align-items:center;display:flex;height:64px;justify-content:center;margin-bottom:8px;position:relative}.mstage .sw{height:38px;width:38px}.mhalf{display:flex;font-size:36px;line-height:1;position:absolute}.mA{animation:d .55s ease-in forwards}.mB{animation:e .55s ease-in forwards}@keyframes d{0%{transform:translateX(-88px) scale(.95)}70%{opacity:1}to{opacity:0;transform:translateX(0) scale(.5)}}@keyframes e{0%{transform:translateX(88px) scale(.95)}70%{opacity:1}to{opacity:0;transform:translateX(0) scale(.5)}}.mring{animation:f .55s ease-out .5s forwards;border:3px solid #fff;border-radius:50%;height:26px;opacity:0;position:absolute;width:26px}@keyframes f{0%{opacity:1;transform:scale(.4)}to{opacity:0;transform:scale(4.5)}}.mres{animation:g .5s cubic-bezier(.2,1.9,.4,1) .6s forwards;display:flex;font-size:52px;line-height:1;position:absolute;transform:scale(0)}.mres .sw{border-radius:10px;height:52px;width:52px}@keyframes g{to{transform:scale(1)}}.mbody.anim{animation:h .45s ease-out .85s forwards;opacity:0}@keyframes h{0%{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}#overlay .card{border-color:#ffd75e;box-shadow:0 0 50px #ffd75e22}#overlay .tag{color:#ffd75e}#overlay .line{color:#cfe3ff;margin:6px 0 0}#overlay .best{color:#ffd75e}#overlay .newbest{color:#7dff9a;font-weight:700;letter-spacing:.1em}#obtns{display:flex;gap:12px;justify-content:center;margin-top:18px}#obtns button{background:#101528;border:1px solid #33436e;border-radius:8px;color:#cfe3ff;cursor:pointer;font:inherit;padding:8px 16px}#obtns button.obfocus{border-color:#ffd75e;box-shadow:0 0 12px #ffd75e33;color:#ffd75e}.tscreen{align-items:center;display:none;flex-direction:column;gap:8px;inset:0;justify-content:center;position:fixed;z-index:2}.tscreen.show{display:flex}body.menu #grid,body.menu #hud,body.menu footer,body.menu header{display:none}#ttlwrap{width:fit-content}#ttl{animation:i 5s linear infinite;background:linear-gradient(90deg,#ff3b30,#ff9430,#ffdc32,#34d158,#33e9e9,#2f6bff,#9a4dff,#ff3b30);-webkit-background-clip:text;background-clip:text;background-size:200% 100%;color:transparent;filter:drop-shadow(0 0 18px #ffffff22);font-family:Arial Black,Arial,Helvetica,sans-serif;font-size:min(17vw,100px);font-weight:900;letter-spacing:0;line-height:1}@keyframes i{to{background-position:200% 0}}#tsub{color:#8fb4d8;font-family:Arial,Helvetica,sans-serif;font-size:min(6.9vw,40px);font-variant:small-caps;font-weight:700;justify-content:space-between;line-height:1.1;margin:6px 0 30px;width:100%}#menu,#tsub{display:flex}#menu{flex-direction:column;gap:10px;width:250px}#menu[hidden]{display:none}#mback,#menu button{background:#101528cc;border:1px solid #33436e;border-radius:10px;color:#cfe3ff;cursor:pointer;font:inherit;font-family:Arial,Helvetica,sans-serif;font-size:16px;letter-spacing:.04em;padding:10px 16px}#mback.obfocus,#menu button.obfocus{border-color:#ffd75e;box-shadow:0 0 12px #ffd75e33;color:#ffd75e}#menu button.armed{border-color:#a04040;color:#ff8080}#mpanel{align-items:center;display:flex;flex-direction:column;gap:10px;width:min(92vw,460px)}#mpanel[hidden]{display:none}#mhead{color:#ffd75e;font-size:13px;letter-spacing:.3em}#mlist{background:#0c1122cc;border:1px solid #223052;border-radius:12px;max-height:46vh;overflow-y:auto;padding:12px 14px;text-align:left;width:100%}.hsrow{display:flex;gap:12px;justify-content:space-between;padding:6px 0}.hsrow b{color:#ffd75e}.hsnote{color:#55708e;font-size:11px;margin-top:8px;text-align:center}.erow{align-items:flex-start;border-bottom:1px solid #16203a;display:flex;gap:10px;padding:6px 0}.erow:last-of-type{border-bottom:0}.eico{align-items:center;display:flex;font-size:20px;justify-content:center;line-height:1.3;min-width:24px}.eico .sw{border-radius:4px;height:18px;width:18px}.erec{color:#8fb4d8;font-size:12px;font-style:normal;margin-left:6px}.equote{color:#55708e;font-size:11px;font-style:italic}";

const ELEMENTS = [
    { id: "red", n: "Red", c: "#ff3b30", q: "The first spark. Everything warm starts here." },
    { id: "green", n: "Green", c: "#34d158", q: "The color of things that insist on growing." },
    { id: "blue", n: "Blue", c: "#2f6bff", q: "Deep and calm, like the start of a sky." },
    { id: "yellow", n: "Yellow", c: "#ffdc32", q: "Two lights make a brighter one. This is not paint.",
        r: [["red", "green"]] },
    { id: "magenta", n: "Magenta", c: "#ff44ff", q: "A color your brain made up. There is no magenta wavelength.",
        r: [["red", "blue"]] },
    { id: "cyan", n: "Cyan", c: "#33e9e9", q: "Shallow seas and old terminals.",
        r: [["green", "blue"]] },
    { id: "white", n: "White Light", c: "#ffffff", q: "Every color at once, hiding in plain sight.",
        r: [["blue", "yellow"], ["red", "cyan"], ["green", "magenta"]] },
    { id: "orange", n: "Orange", c: "#ff9430", q: "Named after the fruit — not the other way around.",
        r: [["red", "yellow"]] },
    { id: "violet", n: "Violet", c: "#9a4dff", q: "The last color the rainbow remembers.",
        r: [["blue", "magenta"]] },
    { id: "indigo", n: "Indigo", c: "#4a30d8", q: "Newton wanted seven colors, so he found room for this one.",
        r: [["blue", "violet"]] },
    { id: "pink", n: "Pink", c: "#ffa8c5", q: "Softness, weaponized.",
        r: [["red", "white"]] },
    { id: "air", n: "Air", e: "\u{1F4A8}", q: "You only notice it when it moves.",
        r: [["blue", "white"]] },
    { id: "sky", n: "Sky", c: "#7ec8ff", q: "Look up. It keeps going.",
        bg: "radial-gradient(circle at 68% 30%, #fff3a0 0 6%, #ffdc32 6% 13%, transparent 17%)," +
            "radial-gradient(circle at 68% 30%, #ffdc3244 0 22%, transparent 30%)," +
            "linear-gradient(180deg, #a8dbff 0%, #7ec8ff 55%, #4f9fe8 100%)",
        r: [["sun", "air"]] },
    { id: "gold", n: "Gold", c: "#f7c948", q: "Alchemists chased this for centuries. You mixed two squares.",
        r: [["yellow", "orange"]] },
    { id: "aurora", n: "Aurora", e: "\u{1F30C}", q: "Solar wind, painting after midnight.",
        r: [["green", "night"], ["magenta", "night"]] },
    { id: "water", n: "Water", e: "\u{1F4A7}", q: "It only looks blue because it borrowed the sky.",
        r: [["blue", "cyan"], ["fire", "ice"]] },
    { id: "fire", n: "Fire", e: "\u{1F525}", q: "The oldest alchemy there is.",
        r: [["red", "orange"]] },
    { id: "earth", n: "Earth", c: "#a4713f", q: "The other three get the poetry. This one grows the food.",
        bg: "radial-gradient(circle at 30% 35%, #7a4a26cc 0 5%, transparent 9%)," +
            "radial-gradient(circle at 62% 60%, #5c3a1e 0 4%, transparent 8%)," +
            "radial-gradient(circle at 78% 28%, #b98a55 0 4%, transparent 8%)," +
            "radial-gradient(circle at 42% 78%, #5c3a1e 0 4.5%, transparent 8%)," +
            "radial-gradient(circle at 15% 65%, #b98a55aa 0 3.5%, transparent 7%)," +
            "linear-gradient(180deg, #a4713f 0%, #7c5230 55%, #59391f 100%)",
        r: [["green", "orange"]] },
    { id: "lava", n: "Lava", c: "#ff5a1f", q: "The ground, briefly reconsidering.",
        bg: "radial-gradient(circle at 27% 32%, #ffe08a 0 3.5%, transparent 7%)," +
            "radial-gradient(circle at 72% 62%, #ffc04dcc 0 4%, transparent 8%)," +
            "linear-gradient(108deg, #2b0e07 0 14%, transparent 14% 27%, #1f0905 27% 35%," +
            "transparent 35% 58%, #2b0e07 58% 68%, transparent 68% 84%, #1f0905 84% 92%, transparent 92%)," +
            "linear-gradient(180deg, #ffb020 0%, #ff5a1f 45%, #a32206 100%)",
        r: [["earth", "fire"]] },
    { id: "stone", n: "Stone", c: "#9aa4ad", q: "Cooled, hardened, and in no hurry.",
        bg: "radial-gradient(circle at 30% 32%, #6f7880 0 5%, transparent 9%)," +
            "radial-gradient(circle at 66% 58%, #c8d0d8aa 0 4%, transparent 8%)," +
            "radial-gradient(circle at 78% 26%, #5c646c 0 3.5%, transparent 7%)," +
            "radial-gradient(circle at 40% 76%, #b6c0c8aa 0 3.5%, transparent 7%)," +
            "linear-gradient(160deg, #aab4bd 0%, #8b959d 55%, #626a72 100%)",
        r: [["lava", "water"]] },
    { id: "metal", n: "Metal", c: "#c3ced9", q: "Stone, refined until it rings.",
        bg: "linear-gradient(120deg, transparent 0 30%, #ffffffaa 30% 38%, transparent 38% 62%," +
            "#ffffff55 62% 68%, transparent 68%)," +
            "linear-gradient(180deg, #e6edf3 0%, #aab6c2 38%, #6e7a86 62%, #cdd7e0 100%)",
        r: [["fire", "stone"]] },
    { id: "axe", n: "Axe", e: "\u{1FA93}", q: "The first machine. Everything after is optimization.",
        r: [["fire", "metal"]] },
    { id: "sand", n: "Sand", c: "#e0c078", q: "What mountains become, given enough wind.",
        bg: "radial-gradient(circle at 30% 30%, #fff2c8aa 0 3%, transparent 6%)," +
            "radial-gradient(circle at 70% 45%, #b98a4d88 0 3%, transparent 6%)," +
            "radial-gradient(circle at 45% 70%, #fff2c899 0 2.5%, transparent 5%)," +
            "linear-gradient(115deg, #ecd08a 0 54%, #d3ab5e 54% 100%)",
        r: [["earth", "air"], ["earth", "sun"], ["stone", "air"]] },
    { id: "glass", n: "Glass", c: "#bfe6f2", q: "Sand, taught to tell the truth.",
        bg: "linear-gradient(135deg, transparent 0 28%, #ffffff99 28% 37%, transparent 37% 54%, #ffffff55 54% 60%, transparent 60% 100%)," +
            "linear-gradient(180deg, #d8f1f8 0%, #a8d8ea 60%, #8ec4dc 100%)",
        r: [["sand", "fire"]] },
    { id: "mirror", n: "Mirror", e: "\u{1FA9E}", q: "Mirror Mirror on the Wall",
        r: [["glass", "metal"]] },
    { id: "sun", n: "Sun", e: "☀️", q: "A very local star.",
        r: [["fire", "air"]] },
    // Black + Sky, so the gradient is exactly that: the day's blue at the top
    // edge, falling to the Black it was mixed with. Stars unchanged.
    { id: "night", n: "Night", c: "#4a7fd0", q: "The sky, resting.",
        bg: "radial-gradient(circle at 22% 28%, #fff 0 4%, transparent 8%)," +
            "radial-gradient(circle at 65% 16%, #fff 0 3%, transparent 6%)," +
            "radial-gradient(circle at 82% 52%, #ffffffcc 0 3.5%, transparent 7%)," +
            "radial-gradient(circle at 38% 62%, #ffffffbb 0 3%, transparent 6%)," +
            "radial-gradient(circle at 58% 84%, #fff 0 2.5%, transparent 5%)," +
            "radial-gradient(circle at 12% 76%, #ffffff99 0 3%, transparent 6%)," +
            "linear-gradient(160deg, #3f6ea8 0%, #16294d 45%, #04060c 100%)",
        r: [["black", "sky"]] },
    { id: "star", n: "Star", e: "⭐", q: "A pinhole in the dark.",
        r: [["night", "white"]] },
    { id: "moon", n: "Moon", e: "\u{1F319}", q: "Borrowed light, worn well.",
        r: [["night", "sun"]] },
    { id: "cloud", n: "Cloud", e: "☁️", q: "A lake, daydreaming.",
        r: [["sky", "water"], ["water", "air"]] },
    { id: "rain", n: "Rain", e: "\u{1F327}️", q: "The cloud, giving it all back.",
        r: [["cloud", "water"]] },
    { id: "lightning", n: "Lightning", e: "\u{1F329}️", q: "The sky, losing its temper.",
        r: [["cloud", "electricity"]] },
    { id: "storm", n: "Storm", e: "\u{26C8}️", q: "The weather, done negotiating.",
        r: [["lightning", "rain"]] },
    { id: "tornado", n: "Tornado", e: "\u{1F32A}️", q: "Air, finally focused.",
        r: [["air", "storm"]] },
    { id: "life", n: "Life", e: "\u{1F9EC}", q: "One spark in the right puddle, and here we all are.",
        r: [["lightning", "water"]] },
    { id: "animal", n: "Animal", e: "\u{1F43E}", q: "Life, plus the decision to move.",
        r: [["earth", "life"]] },
    { id: "horse", n: "Horse", e: "\u{1F434}", q: "A horse! A horse! My kingdom for a horse!",
        r: [["animal", "field"]] },
    { id: "wolf", n: "Wolf", e: "\u{1F43A}", q: "The animal that answered the moon.",
        r: [["animal", "moon"]] },
    { id: "bone", n: "Bone", e: "\u{1F9B4}", q: "What the fire could not talk out of leaving.",
        r: [["animal", "fire"], ["wolf", "fire"], ["horse", "fire"], ["unicorn", "fire"],
            ["bear", "fire"], ["polarbear", "fire"], ["dog", "fire"], ["cow", "fire"],
            ["bear", "horse"], ["wolf", "horse"], ["bear", "dog"]] },
    { id: "dog", n: "Dog", e: "\u{1F415}", q: "A wolf that decided to stay.",
        r: [["wolf", "bone"], ["dog", "wolf"]] },
    { id: "cow", n: "Cow", e: "\u{1F404}", q: "Grass, on the long way round to milk.",
        r: [["animal", "grass"]] },
    { id: "bird", n: "Bird", e: "\u{1F426}", q: "The animal that gave up on the ground.",
        r: [["air", "animal"], ["air", "penguin"]] },
    { id: "penguin", n: "Penguin", e: "\u{1F427}", q: "A bird that traded the sky for the sea.",
        r: [["bird", "ice"]] },
    { id: "fish", n: "Fish", e: "\u{1F41F}", q: "Life, never seeing the need to leave.",
        r: [["animal", "water"]] },
    { id: "owl", n: "Owl", e: "\u{1F989}", q: "The night, keeping an eye on things.",
        r: [["bird", "night"]] },
    { id: "phoenix", n: "Phoenix", e: "\u{1F426}\u{200D}\u{1F525}", q: "From the ashes, a fire shall be woken",
        r: [["bird", "fire"]] },
    { id: "bee", n: "Bee", e: "\u{1F41D}", q: "The flower's travel agent.",
        r: [["animal", "flower"]] },
    { id: "honey", n: "Honey", e: "\u{1F36F}", q: "The one food that never spoils.",
        r: [["bee", "flower"]] },
    { id: "bear", n: "Bear", e: "\u{1F43B}", q: "It found the honey. It always finds the honey.",
        r: [["animal", "honey"]] },
    { id: "polarbear", n: "Polar Bear", e: "\u{1F43B}\u{200D}\u{2744}\u{FE0F}", q: "A bear that decided the winter was fine.",
        r: [["bear", "ice"]] },
    { id: "acid", n: "Acid", e: "\u{1F9EA}", q: "Water that learned to bite.",
        r: [["green", "water"]] },
    { id: "electricity", n: "Electricity", e: "⚡", q: "A slow argument between a metal and an acid.",
        r: [["acid", "metal"]] },
    { id: "ice", n: "Ice", e: "\u{1F9CA}", q: "Water, holding its breath.",
        r: [["water", "night"]] },
    { id: "snow", n: "Snow", e: "\u{1F328}️", q: "Rain that stopped to arrange itself.",
        r: [["cloud", "ice"]] },
    // the one icon that has to show a mechanism: white light in, spectrum out
    { id: "prism", n: "Prism", c: "#bfe6f2", q: "It takes light apart to see how it works.",
        s: '<path d="M16 3 30 28H2Z" fill="#cfeaf544" stroke="#eaf8ff" stroke-width="1.6" stroke-linejoin="round"/>' +
            '<path d="M0 11h12" stroke="#fff" stroke-width="2.4"/>' +
            '<g stroke-width="2.4" stroke-linecap="round">' +
            '<path d="M22 15 32 7" stroke="#ff3b30"/><path d="M22 15 32 10" stroke="#ff9430"/>' +
            '<path d="M22 15 32 13" stroke="#ffdc32"/><path d="M22 15 32 16" stroke="#34d158"/>' +
            '<path d="M22 15 32 19" stroke="#33e9e9"/><path d="M22 15 32 22" stroke="#2f6bff"/>' +
            '<path d="M22 15 32 25" stroke="#9a4dff"/></g>',
        r: [["diamond", "glass"]] },
    { id: "rainbow", n: "Rainbow", e: "\u{1F308}", q: "White light, confessing everything.",
        r: [["white", "prism"], ["sun", "rain"], ["prism", "sun"]] },
    { id: "magic", n: "Magic", e: "✨", q: "Science we haven't named yet.",
        r: [["star", "aurora"]] },
    { id: "unicorn", n: "Unicorn", e: "\u{1F984}", q: "It was real the whole time.",
        r: [["horse", "magic"]] },
    { id: "sunset", n: "Sunset", e: "\u{1F305}", q: "The sun's long goodbye.",
        r: [["sun", "pink"]] },
    { id: "grass", n: "Grass", e: "\u{1F33F}", q: "Patience, photosynthesizing.",
        r: [["earth", "water"], ["green", "life"]] },
    // a horizon rather than an object: sky above, green below, hard stop between
    { id: "field", n: "Field", c: "#5fb54a", q: "Grass, as far as the argument goes.",
        bg: "linear-gradient(180deg, #a8dbff 0%, #7ec8ff 46%, #5fb54a 46%, #3f8c36 100%)",
        r: [["earth", "grass"]] },
    { id: "tree", n: "Tree", e: "\u{1F333}", q: "A century of standing still, on purpose.",
        r: [["water", "grass"]] },
    { id: "wood", n: "Wood", e: "\u{1FAB5}", q: "A tree, minus the patience.",
        r: [["axe", "tree"]] },
    { id: "charcoal", n: "Charcoal", c: "#8a3a14", q: "Wood, with everything unnecessary burned away.",
        bg: "radial-gradient(circle at 34% 38%, #7c3312cc 0 4%, transparent 8%)," +
            "radial-gradient(circle at 68% 66%, #6b2a10aa 0 3%, transparent 7%)," +
            "linear-gradient(125deg, #2c2c2f 0 28%, #171719 28% 44%, #333338 44% 60%," +
            "#1b1b1e 60% 78%, #27272b 78% 100%)",
        r: [["wood", "fire"]] },
    // The one color no amount of mixing light can reach, so it arrives through
    // the materials instead. A plain black square would vanish into the tile, so
    // the swatch keeps a soft top-left sheen and lends a grey — not black — glow.
    { id: "black", n: "Black", c: "#5b6472", q: "No light at all, which took some arranging.",
        bg: "radial-gradient(circle at 30% 26%, #2a2f3a 0 18%, transparent 42%)," +
            "linear-gradient(155deg, #17191f 0%, #0a0b0e 55%, #000000 100%)",
        r: [["charcoal", "stone"]] },
    { id: "grey", n: "Grey", c: "#7f8894", q: "The average of every argument.",
        r: [["black", "white"]] },
    { id: "diamond", n: "Diamond", e: "\u{1F48E}", q: "Carbon, under enough pressure to become interesting.",
        r: [["charcoal", "lava"]] },
    { id: "flower", n: "Flower", e: "\u{1F338}", q: "The grass, showing off.",
        r: [["grass", "pink"]] },
    { id: "sunflower", n: "Sunflower", e: "\u{1F33B}", q: "A flower with a favorite.",
        r: [["sun", "flower"], ["flower", "yellow"]] },
];
const STARTERS = ["red", "green", "blue"];
const BY_ID = {};
ELEMENTS.forEach(e => (BY_ID[e.id] = e));
// "a+b" (ids sorted) -> result id
const RECIPE = {};
ELEMENTS.forEach(e => (e.r || []).forEach(p => (RECIPE[[...p].sort().join("+")] = e.id)));
const N = (id) => BY_ID[id].n;

// Tiny WebAudio synth. The context is created lazily on the first call, which
// in practice is always inside a user-gesture handler, so autoplay policy is
// satisfied; every call is try/caught so a missing/blocked AudioContext
// (headless test runs) degrades to silence rather than an exception.
let AC = null;
// Mute is a preference, not run state: New game does not clear it and a reload
// restores it, which is why it is its own key rather than part of the saved run.
// Read through the same try/catch localStorage discipline game.ts uses.
const K_MUTE = "colorAlchemy.mute";
let muted = false;
try {
    muted = localStorage.getItem(K_MUTE) === "1";
}
catch { }
function setMuted(v) {
    muted = v;
    try {
        localStorage.setItem(K_MUTE, v ? "1" : "0");
    }
    catch { }
}
function ac() {
    if (!AC)
        AC = new (window.AudioContext || window.webkitAudioContext)();
    if (AC.state === "suspended")
        AC.resume();
    return AC;
}
function tone(f, at, dur, type = "square", vol = 0.12, slide = 0) {
    if (muted)
        return;
    try {
        const c = ac(), o = c.createOscillator(), g = c.createGain(), t = c.currentTime + at;
        o.type = type;
        o.frequency.setValueAtTime(f, t);
        if (slide)
            o.frequency.exponentialRampToValueAtTime(Math.max(30, f + slide), t + dur);
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(vol, t + 0.012);
        g.gain.exponentialRampToValueAtTime(0.001, t + dur);
        o.connect(g).connect(c.destination);
        o.start(t);
        o.stop(t + dur + 0.05);
    }
    catch { }
}
const SFX = {
    select() { tone(660, 0, 0.07, "square", 0.07); },
    cancel() { tone(430, 0, 0.06, "square", 0.05); },
    fail() { tone(190, 0, 0.22, "sawtooth", 0.09, -120); },
    dupe() { tone(520, 0, 0.09, "sine", 0.08); },
    hint() { tone(587, 0, 0.08, "triangle", 0.08); tone(880, 0.07, 0.13, "triangle", 0.08); },
    discover() { [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.07, 0.16, "triangle", 0.11)); },
    fanfare() { [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, i * 0.1, 0.32, "triangle", 0.12)); tone(262, 0, 0.9, "sine", 0.07); },
    grand() { [392, 523, 659, 784, 1047, 1319, 1568].forEach((f, i) => tone(f, i * 0.09, 0.36, "triangle", 0.12)); tone(196, 0, 1.1, "sine", 0.07); },
};

// Background music: "astral blur", the 24 kHz floatbeat in experiments/, ported
// to run in the page. galaxy-raid plays its bytebeats through a
// ScriptProcessorNode filling one sample at a time (src/app/music.ts); this does
// the same, only the source is a stereo float engine rather than a one-liner, so
// the node has two output channels and the samples go out as-is.
//
// The original is a general synth framework — ADSR envelopes, 2- and 4-operator
// FM voices, wave-shapers, filters, delays, a Householder/Hadamard reverb, a
// mixer and a sequencer — and the tune uses maybe a third of it. What survives
// here is only what this song reaches: three waveforms, one envelope shape, one
// random LFO, the 2-op voice (a plain oscillator is the same voice with the
// modulator turned off), gain, the low-pass, the multi-tap delay, the diffuser.
// Dropped: tri/sqr/sawtf waves, the 4-op voice, wave-shaping synths, mod_wav,
// env_const, mono/softclip/dcremove, the single-tap delay, and the high-pass and
// mono branches of the filter.
//
// Everything that was an object with named fields is an array here — envelopes,
// LFOs, notes, effects, mixer channels — indexed by the constants below. It is
// the same data in a form that costs no property names.
//
// Two quirks of the original are reproduced deliberately, because they are what
// it sounds like, not what it means:
//   - `filter` allocates its history with Array(2).fill(Array(3).fill(...)), so
//     all three history rows AND both channels are one shared array. The biquad
//     it looks like collapses to a one-pole per section, fed by both channels in
//     turn. Faithfully collapsed here (K/G below), not "fixed".
//   - `diff` builds a `flip` array of random signs and then multiplies by 1.
//     Dead code; dropped.
// Its two real bugs are dropped too: `m.target in ["freq", ...]` is always false
// (`in` tests keys of an array), so every modulator is additive — which is what
// this tune wants anyway, all of its LFOs target a modulator phase; and
// notefreq() ignores the second argument it is handed.
/* ------------------------------------------------------------------ the song */
// Rows encoded one character each: a tick count as 'A'+n (< 'N'), then two
// characters per event — patch letter 'a'..'g', then the pitch as chr(110+p).
// Patch letters: a chord, b bass, c pulse, d pulse2, e bass-in, f bass-out,
// g note-off (the bass is the only voice that is ever released early).
const PATS = [
    "Ba[BabBaiBagEafMBaXBa_BadBagBafDabMBaTBa[BadBagEabMBaVBa]BabBagEafM",
    "Ba[BabBaiBagEafMBaXBa_BadBagBafDabMBaTBa[BadBagEabMBaVBa]BabBagEafCKebAgn",
    "Ba[bgBabBaiBagEafMAgnBaXbdBa_BadBagBafDabMAgnBaTb`Ba[BadBagEabMAgnBaVbbBa]BabBagEafMAgn",
    "Ba[bgBabBaiBagBafFcrFcuFcrAgnBaXbdBa_BadBagBafFabcrFcuFcrAgnBaTb`Ba[BadBagBabFcsFcsFcsAgnBaVbbBa]BabBagBafFcrFcpFcrAgn",
    "Ba[bgBabBaiBagBafFcrdwFcudzFcrd|AgnBaXbdBa_BadBagBafFabcrd~Fcud~FcrdzAgnBaTb`Ba[BadBagBabFcsd|Fcsd|FcsdzAgnBaVbbBa]BabBagBafFcrdwFcpduFcrduAgn",
    "Ba[bgBabBaiBagEafMAgnBaXbdBa_BadBagBafDabMAgnBaTb`Ba[BadBagEabMAgnBaVfbBa]BabBagEafM",
];
// which pattern plays when: the four-bar pattern, a variant, then it builds
const ARR = "012233442500";
// One patch per letter:
// [pitch offset, amp A D S R, mod A D S R, carrier, modulator, mod level,
//  LFO frequency multiple, LFO depth, mixer channel, is-the-bass]
// A mod level of 0 means no modulator at all: no second envelope, no LFO — the
// plain-oscillator voice.
const P = [
    [0, 2, 3, 0, 0, 2, 3, 0, 0, 0, 1, 1, 16, 0.03, 1, 0],
    [-24, 0.01, 0, 1, 0.01, 3.333, 3.333, 0, 0, 2, 0, 2, 4, 0.01, 2, 1],
    [0, 0.001, 0.75, 0, 0, 0.001, 0.75, 0, 0, 0, 1, 0.5, 1, 0.03, 4, 0],
    [0, 0.001, 0.75, 0, 0, 0.001, 0.75, 0, 0, 0, 1, 0.5, 1, 0.03, 3, 0],
    [-24, 3.333, 0, 1, 0.01, 0, 0, 0, 0, 2, 0, 0, 0, 0, 2, 1],
    [-24, 0.01, 6.666, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 2, 1],
];
const BASEFREQ = 453; // the pitch every note ratio multiplies
const { sin, cos, tan, min, max, floor, round, random, PI } = Math;
const lerp = (a, b, x) => x * b + (1 - x) * a;
/* ------------------------------------------------------------- the generator */
// Builds one sample function for a given sample rate. Everything the engine
// derives — tick length, envelope slopes, delay lengths, filter coefficients —
// is in seconds or Hz, so the song plays at its intended pitch and tempo at
// whatever rate the AudioContext runs at; the file was written for 24 kHz.
function sampler(SR) {
    const TL = (SR * 60) / 90 / 2; // samples per tick: 90 BPM, 2 ticks a beat
    // --- waves. mod is phase modulation in radians, folded into the same call ---
    const fmod = (a, b) => ((a % b) + b) % b;
    const W = [
        (x, m) => sin(2 * PI * x + m), // sine
        (x, _m) => fmod(2 * x + 1, 2) - 1, // saw
        (x, m) => W[0](x, 0.5 * (W[0](2 * x, m) + m)), // rounded square
    ];
    // --- envelope: [value, stage, held, active, attack, decay, sustain, release]
    // Stage 0 attack, 1 decay, 2 sustain, 3 release. Zero-length stages need no
    // special case: 1/SR/0 is Infinity, so the ramp reaches its target in one step.
    const env = (e) => {
        if (!e[3])
            return 0;
        const out = e[0], top = e[5] ? 1 : e[6];
        if (!e[2] && e[1] != 3)
            e[1] = 3;
        if (!e[1]) {
            e[0] = min(e[0] + 1 / SR / e[4], top);
            if (e[0] == top)
                e[1] = e[5] ? 1 : 2;
        }
        else if (e[1] == 1) {
            e[0] = max(e[0] - 1 / SR / e[5], e[6]);
            if (e[0] == e[6])
                e[1] = e[6] ? 2 : 3;
        }
        else if (e[1] == 3) {
            e[0] = max(e[0] - 1 / SR / e[7], 0);
            if (!e[0])
                e[3] = 0;
        }
        return out;
    };
    // --- LFO: smoothstep-interpolated random, bipolar. [freq, depth, phase, from, to]
    const lfo = (l) => {
        if (l[2] >= 1) {
            l[2] -= 1;
            l[3] = l[4];
            l[4] = 2 * random() - 1;
        }
        const p = l[2], c = 3 * p * p - 2 * p * p * p;
        l[2] += l[0] / SR;
        return (l[3] * (1 - c) + l[4] * c) * l[1];
    };
    // --- a voice: [ratio, carrier phase, mod phase, amp env, mod env, carrier,
    //               modulator, mod level, LFO, mixer channel, is-the-bass]
    const notes = [];
    const voice = (n) => {
        const step = (BASEFREQ * n[0]) / SR;
        const m = n[7] ? n[7] * W[n[6]](n[2] + lfo(n[8]), 0) * env(n[4]) : 0;
        const out = W[n[5]](n[1], m) * env(n[3]);
        n[1] = (n[1] + step) % 1;
        n[2] = (n[2] + step) % 1;
        return out;
    };
    /* ------------------------------------------------------------- effects ---- */
    // Each effect is [kind, ...state]: 0 gain, 1 low-pass, 2 multi-tap delay,
    // 3 diffuser. Kinds 2 and 3 run 8 internal channels.
    const CH = 8;
    const buf = (len) => new Float64Array(max(1, round(len)));
    const gain = (db) => [0, 2 ** (db / 6)];
    // The collapsed filter (see the header): per section, one state that both
    // channels run through, K the pole and G the gain.
    const lpf = (cut, order) => {
        const a = tan((PI * min(cut, 10300)) / SR), a2 = a * a, co = [];
        for (let i = 0; i < order; i++) {
            const r = sin((PI * (2 * i + 1)) / (4 * order)), s = a2 + 2 * a * r + 1;
            co.push((2 * (1 - a2)) / s + (4 * a * r) / s - 1, (4 * a2) / s);
        }
        return [1, co, new Float64Array(order)];
    };
    // [3, buffers, write index]: 8 taps of random length up to maxdur ms, mixed
    // by a Hadamard matrix. Feeds the reverb its density.
    const diff = (maxdur) => {
        const n = (maxdur / 1e3) * SR, bufs = [];
        for (let c = 0; c < CH; c++)
            bufs.push(buf(floor((n * c) / CH + (n / CH) * random()) + 1));
        return [3, bufs, 0];
    };
    // [2, buffers, write index, feedback, mix, mod depth, mod frequency]: 8 taps
    // spread over an octave of delay times, read at a slowly wobbling position and
    // mixed by a Householder matrix.
    const delay = (time, fdbk, mix, mod, modf) => {
        const bufs = [];
        for (let c = 0; c < CH; c++)
            bufs.push(buf(min((time / 1e3) * SR * 2 ** (c / CH), 1e6)));
        return [2, bufs, 0, fdbk, mix, (SR / 960) * mod, modf];
    };
    const fx = (f, sig) => {
        if (!f[0])
            return [sig[0] * f[1], sig[1] * f[1]];
        if (f[0] == 1) {
            const co = f[1], st = f[2], out = [sig[0], sig[1]];
            for (let i = 0; i < st.length; i++) {
                for (let c = 0; c < 2; c++) {
                    st[i] = co[2 * i] * st[i] + out[c];
                    out[c] = co[2 * i + 1] * st[i];
                }
            }
            return out;
        }
        // both multi-channel effects take either a stereo pair (spread to mono
        // across all 8 taps, dry kept as the 9th) or another effect's 9 values
        const wide = sig.length > 2 ? sig : Array(CH + 1).fill((sig[0] + sig[1]) / 2);
        const bufs = f[1], tap = [];
        if (f[0] == 3) {
            for (let i = 0; i < CH; i++) {
                const p = f[2] % bufs[i].length;
                tap[i] = bufs[i][p];
                bufs[i][p] = wide[i];
            }
            f[2]++;
            // Hadamard, then the 1/sqrt(8) that keeps it unitary
            for (let len = 1; len < CH; len *= 2) {
                for (let i = 0; i < CH; i += len * 2) {
                    for (let j = i; j < i + len; j++) {
                        const x = tap[j], y = tap[j + len];
                        tap[j] = x + y;
                        tap[j + len] = x - y;
                    }
                }
            }
            for (let i = 0; i < CH; i++)
                tap[i] *= (1 / CH) ** 0.5;
            return tap.concat(wide[CH]);
        }
        for (let i = 0; i < CH; i++) {
            const b = bufs[i], L = b.length;
            const pos = f[2] + f[5] * (1 - cos((f[6] * 2 * PI * f[2]) / SR / 2 ** (i / CH)));
            tap[i] = lerp(b[floor(pos) % L], b[(floor(pos) + 1) % L], pos % 1);
        }
        // Householder: every tap gets -2/n of the sum
        let sum = 0;
        for (let i = 0; i < CH; i++)
            sum += tap[i];
        sum *= -2 / CH;
        for (let i = 0; i < CH; i++)
            tap[i] += sum;
        for (let i = 0; i < CH; i++)
            bufs[i][f[2] % bufs[i].length] = wide[i] + tap[i] * f[3];
        f[2]++;
        return sig.length > 2
            ? [0, 1].map((c) => lerp(wide[CH], lerp(tap[c], wide[c], 0.5), f[4]))
            : [0, 1].map((c) => lerp(sig[c], tap[c], f[4]));
    };
    /* --------------------------------------------------------------- mixer ---- */
    // [destination channel (-1 is the output), effects...]. Channels are processed
    // top down and only ever send downward, so one pass resolves the whole graph.
    const MIX = [
        [-1, gain(-12), diff(20), diff(40), diff(80), diff(160), delay(200, 0.85, 0.75, 0.85, 1.5)],
        [0, lpf(1500, 2)],
        [-1, gain(-15)],
        [0, gain(3), lpf(2000, 2), delay(4, 0, 0.5, 1, 2)],
        [3, gain(3)],
    ];
    const SIG = MIX.map(() => [0, 0]);
    /* ----------------------------------------------------------- sequencer ---- */
    // The encoded patterns, flattened into [ticks, patch, pitch, patch, pitch, ...]
    const ROWS = [];
    for (const a of ARR) {
        const s = PATS[+a];
        for (let i = 0; i < s.length;) {
            const c = s.charCodeAt(i++);
            if (c < 78)
                ROWS.push([c - 65]);
            else
                ROWS[ROWS.length - 1].push(c - 97, s.charCodeAt(i++) - 110);
        }
    }
    let now = 0, next = 0, ptr = 0;
    return () => {
        if (now >= next) {
            const row = ROWS[ptr];
            for (let i = 1; i < row.length; i += 2) {
                const p = P[row[i]], pitch = row[i + 1];
                if (!p) {
                    // note-off: release every envelope of the bass voice
                    for (const n of notes)
                        if (n[10]) {
                            n[3][2] = 0;
                            if (n[4])
                                n[4][2] = 0;
                        }
                }
                else {
                    notes.push([
                        2 ** ((pitch + p[0]) / 12), 0, 0,
                        [0, 0, 1, 1, p[1], p[2], p[3], p[4]],
                        p[11] && [0, 0, 1, 1, p[5], p[6], p[7], p[8]],
                        p[9], p[10], p[11],
                        p[11] && [p[12] * BASEFREQ * 2 ** (pitch / 12), p[13], 1, 0, 0],
                        p[14], p[15],
                    ]);
                }
            }
            next += row[0] * TL;
            ptr = (ptr + 1) % ROWS.length; // the song loops
        }
        now++;
        const sum = [0, 0];
        for (let i = 0; i < notes.length;) {
            if (!notes[i][3][3]) {
                notes.splice(i, 1);
                continue;
            }
            const out = voice(notes[i]), s = SIG[notes[i][9]];
            s[0] += out;
            s[1] += out;
            i++;
        }
        for (let j = MIX.length; j--;) {
            let sig = SIG[j];
            for (let k = 1; k < MIX[j].length; k++)
                sig = fx(MIX[j][k], sig);
            const dst = MIX[j][0] < 0 ? sum : SIG[MIX[j][0]];
            dst[0] += sig[0];
            dst[1] += sig[1];
            SIG[j] = [0, 0];
        }
        return sum;
    };
}
/* ------------------------------------------------------------------ playback */
// Volume: the tune peaks around 0.73, so this keeps it under a third of full
// scale — background, not foreground.
const VOL = 0.4;
// The engine runs at the rate the song was written for and the output is
// interpolated up to whatever the context runs at, which is galaxy-raid's
// arrangement (its bytebeats step a song clock of their own) and halves the
// cost: 15% of a core at 48 kHz becomes 8% at 24 kHz. Generating at the context
// rate instead is a one-word change — sampler(c.sampleRate), step 1 — and sounds
// marginally cleaner if the budget ever stops mattering.
const SONG_SR = 24000;
let node = null;
// Idempotent, and called from a gesture handler so the context is allowed to
// start. Wrapped like sfx.ts: a blocked or missing AudioContext means silence,
// never an exception.
function startMusic() {
    if (node || muted)
        return;
    try {
        const c = ac(), next = sampler(SONG_SR), step = SONG_SR / c.sampleRate;
        let pos = 0, a = next(), b = next();
        node = c.createScriptProcessor(4096, 0, 2);
        node.onaudioprocess = (e) => {
            const l = e.outputBuffer.getChannelData(0), r = e.outputBuffer.getChannelData(1);
            for (let i = 0; i < l.length; i++) {
                pos += step;
                while (pos >= 1) {
                    pos--;
                    a = b;
                    b = next();
                }
                l[i] = (a[0] + (b[0] - a[0]) * pos) * VOL;
                r[i] = (a[1] + (b[1] - a[1]) * pos) * VOL;
            }
        };
        node.connect(c.destination);
    }
    catch { }
}
// Mutes the interface sounds too — one control for all the audio. A disconnected
// ScriptProcessorNode stops being pulled, so muting costs no CPU and the song
// resumes where it left off rather than restarting. Returns the new state.
function toggleMute() {
    setMuted(!muted);
    if (muted) {
        try {
            node.disconnect();
        }
        catch { }
    }
    else if (node) {
        try {
            node.connect(ac().destination);
        }
        catch { }
    }
    else
        startMusic(); // muted before the music ever started
    return muted;
}

// Core game: state, the element grid, combining, discovery cards, the two
// goal overlays, and persistence.
//
// Scoring: every combination ATTEMPT counts as a move — successes, failures
// and rediscoveries alike — and so does a HINT, which buys a productive pair
// for the same price — though repeating a hint you have not acted on yet is
// free (a perfect quest is 34 moves; a perfect full clear is 66). Two
// persistent bests:
//   colorAlchemy.bestQuest : fewest moves to hold both Rainbow and Unicorn.
//     Shown in the HUD once it exists.
//   colorAlchemy.bestFull  : fewest total moves to find ALL elements. The
//     HIDDEN highscore — only ever compared and shown on the completion
//     screen, which only a full clear reaches (closeOverlay wipes the card so
//     it cannot linger in the DOM either).
// The current run also persists (colorAlchemy.run), so closing the tab loses
// nothing; Restart (double-press to confirm) wipes the run, never the bests.
/* ------------------------------------------------------------- persistence */
// Bests are only meaningful against one recipe tree: a quest record set on an
// older, shorter tree would sit unbeatable forever after a balance change.
// Scope the best-score keys by a fingerprint of the tree, so any change to
// recipes or element count quietly starts a fresh board. The run itself stays
// unversioned — an in-flight run survives balance patches.
let vh = 5381;
for (const ch of JSON.stringify(Object.entries(RECIPE).sort()) + ELEMENTS.length) {
    vh = ((vh * 33) ^ ch.charCodeAt(0)) >>> 0;
}
const TREE = vh.toString(36);
const K_RUN = "colorAlchemy.run";
const K_QUEST = "colorAlchemy.bestQuest." + TREE;
const K_FULL = "colorAlchemy.bestFull." + TREE;
const store = {
    get(k) { try {
        return localStorage.getItem(k);
    }
    catch {
        return null;
    } },
    set(k, v) { try {
        localStorage.setItem(k, String(v));
    }
    catch { } },
};
/* ------------------------------------------------------------------- state */
let found = new Set(); // discovered element ids (this run)
const order = []; // discovery order (drives the grid)
// The codex is all-time knowledge, persisted separately from the run: every
// element ever discovered (in first-discovery order) and every recipe ever
// performed. New game wipes the board, never the codex — it is what the
// Encyclopedia shows, and what decides whether a discovery is a first EVER,
// which is what earns the merge animation. Not tree-scoped: knowledge
// survives balance patches, with stale entries filtered on load.
const codexF = [];
const codexK = new Set();
let moves = 0; // every combination attempt, incl. failures
let questDone = false; // Rainbow + Unicorn found this run
let fullDone = false; // all elements found this run
let sel = -1; // index (into order) of the first selection
let cursor = 0; // keyboard/gamepad focus index
let padMode = false; // show the focus ring only once kb/pad is used
const $ = (id) => document.getElementById(id);
const tiles = []; // DOM nodes parallel to `order`
const rkey = (a, b) => [a, b].sort().join("+");
function save() {
    store.set(K_RUN, JSON.stringify({ f: order, m: moves, q: questDone, c: fullDone }));
}
const K_CODEX = "colorAlchemy.codex";
function saveCodex() {
    store.set(K_CODEX, JSON.stringify({ f: codexF, k: [...codexK] }));
}
/* -------------------------------------------------------------------- HUD */
function hud() {
    $("moves").textContent = String(moves);
    $("count").textContent = found.size + " / " + ELEMENTS.length;
    const bq = store.get(K_QUEST);
    $("bestq").textContent = bq ? "Best quest: " + bq : "";
    $("goal").innerHTML = fullDone
        ? "Complete. \u{1F451}"
        : questDone
            ? "Endgame: discover all " + ELEMENTS.length + " elements"
            : "Forge the \u{1F308} <b>Rainbow</b> and the \u{1F984} <b>Unicorn</b>";
}
let toastTimer = 0;
// The one mute path: the key, the pad button and the HUD button all land here,
// so the label can never disagree with the state. Called at boot too, since the
// preference outlives the run.
function paintSound() {
    const b = $("snd");
    b.firstChild.textContent = muted ? "Muted" : "Sound";
    b.classList.toggle("off", muted);
}
function muteToggle() {
    toast(toggleMute() ? "Sound off" : "Sound on");
    paintSound();
}
function toast(msg) {
    const t = $("toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 1900);
}
/* -------------------------------------------------------------------- grid */
function iconHtml(el) {
    // an SVG icon rides on .sw too, so every size rule the swatches have applies
    if (el.s) {
        return '<svg class="sw" viewBox="0 0 32 32" style="--g:' + (el.c || "#8a5cf0") + '55">' +
            el.s + "</svg>";
    }
    if (el.c || el.bg) {
        // bg (a full CSS background stack) overrides the flat color; the plain
        // color always supplies the glow, since "gradient…55" is not a color
        return '<div class="sw" style="background:' + (el.bg || el.c) +
            ";--g:" + (el.c || "#8a5cf0") + '55"></div>';
    }
    return el.e || "";
}
function addTile(id) {
    const el = BY_ID[id];
    const d = document.createElement("div");
    d.className = "tile";
    d.dataset.id = id;
    d.innerHTML = '<div class="ico">' + iconHtml(el) + '</div><div class="nm">' + el.n + "</div>";
    const i = order.length;
    d.addEventListener("click", () => {
        if (performance.now() < clickGuard)
            return; // that click ended a drag
        padMode = false;
        renderFocus();
        selectAt(i);
    });
    // a reaction class clears itself; the arrival pop ends here too, and marks
    // the tile settled so no later class change replays it
    d.addEventListener("animationend", () => {
        d.classList.remove("bad", "hit");
        d.classList.add("settled");
    });
    d.addEventListener("pointerdown", e => startPress(e, i));
    d.addEventListener("pointermove", onPressMove);
    d.addEventListener("pointerup", onPressUp);
    d.addEventListener("pointercancel", cancelPress);
    order.push(id);
    tiles.push(d);
    $("grid").appendChild(d);
}
// One-shot tile reactions: "bad" shakes the pair that produced nothing, "hit"
// pulses the element a known combination just remade. Dropping both classes
// and forcing a reflow re-arms the CSS animation, so repeating the same combo
// reacts every time instead of only the first — and the two never overlap.
function flash(cls, ...ids) {
    for (const id of ids) {
        const t = tiles[order.indexOf(id)];
        if (!t)
            continue;
        t.classList.remove("bad", "hit");
        void t.offsetWidth;
        t.classList.add(cls);
    }
}
function renderFocus() {
    tiles.forEach((t, i) => {
        t.classList.toggle("sel", i === sel);
        t.classList.toggle("cur", padMode && i === cursor);
    });
}
function gridCols() {
    return Math.max(1, getComputedStyle($("grid")).gridTemplateColumns.split(" ").length);
}
function moveCursor(dx, dy) {
    const n = tiles.length, c = gridCols();
    if (dx)
        cursor = Math.min(n - 1, Math.max(0, cursor + dx));
    if (dy) {
        const x = cursor % c, y = (cursor / c) | 0;
        const ny = Math.min(((n - 1) / c) | 0, Math.max(0, y + dy));
        cursor = Math.min(n - 1, ny * c + x);
    }
    padMode = true;
    renderFocus();
    if (tiles[cursor])
        tiles[cursor].scrollIntoView({ block: "nearest" });
}
/* ------------------------------------------------------------ drag & drop */
// Drag one tile onto another to combine. Mouse/pen lift after a small
// movement threshold; touch lifts on a 220ms long-press so page scrolling
// stays possible: before the lift nothing is preventDefaulted, so the
// browser is free to claim the gesture as a pan (which fires pointercancel
// and quietly cancels the pending drag). Once lifted, boot()'s non-passive
// touchmove listener preventDefaults, so a pan can no longer start.
// The pointer is captured on the source tile, so its listeners see the whole
// gesture and the drop target is found with elementFromPoint (the ghost is
// pointer-events: none and cannot occlude it).
let pressIdx = -1; // tile index under an active press, -1 when idle
let pressX = 0, pressY = 0; // press origin, for the lift threshold
let lastX = 0, lastY = 0;
let dragging = false; // true once the tile is lifted
let ghost = null;
let dropEl = null;
let pressTimer = 0;
let clickGuard = 0; // clicks before this timestamp ended a drag, not a select
function startPress(e, i) {
    if (phase() !== "play" || pressIdx >= 0)
        return;
    if (e.pointerType === "mouse" && e.button !== 0)
        return;
    pressIdx = i;
    pressX = lastX = e.clientX;
    pressY = lastY = e.clientY;
    try {
        e.currentTarget.setPointerCapture(e.pointerId);
    }
    catch { }
    if (e.pointerType !== "mouse")
        pressTimer = setTimeout(lift, 220);
}
function lift() {
    if (pressIdx < 0 || dragging || phase() !== "play")
        return;
    dragging = true;
    sel = -1; // a pending click-selection mid-drag would confuse; clear silently
    renderFocus();
    const src = tiles[pressIdx];
    src.classList.add("dragsrc");
    ghost = src.cloneNode(true);
    ghost.classList.add("ghost");
    document.body.appendChild(ghost);
    moveGhost();
    SFX.select();
}
function tileAt(x, y) {
    const el = document.elementFromPoint(x, y);
    return el ? el.closest(".tile") : null;
}
function moveGhost() {
    if (!ghost)
        return;
    ghost.style.left = lastX + "px";
    ghost.style.top = lastY + "px";
    const t = tileAt(lastX, lastY);
    const next = t && t !== tiles[pressIdx] && t !== ghost ? t : null;
    if (dropEl !== next) {
        if (dropEl)
            dropEl.classList.remove("drop");
        dropEl = next;
        if (dropEl)
            dropEl.classList.add("drop");
    }
}
function onPressMove(e) {
    if (pressIdx < 0)
        return;
    lastX = e.clientX;
    lastY = e.clientY;
    if (!dragging) {
        const dx = lastX - pressX, dy = lastY - pressY;
        if (dx * dx + dy * dy > 36) {
            if (e.pointerType === "mouse")
                lift();
            else
                cancelPress(); // touch moved before the long-press: that's a scroll
        }
        return;
    }
    moveGhost();
}
function onPressUp(e) {
    if (pressIdx < 0)
        return;
    if (!dragging) {
        cancelPress();
        return;
    } // sub-threshold press: the click event selects
    lastX = e.clientX;
    lastY = e.clientY;
    const t = tileAt(lastX, lastY);
    const srcId = order[pressIdx];
    const dstId = t ? t.dataset.id : undefined;
    clickGuard = performance.now() + 350;
    cancelPress();
    if (dstId && dstId !== srcId)
        attempt(srcId, dstId);
    else
        SFX.cancel(); // dropped on nothing / on itself: no move
}
function cancelPress() {
    clearTimeout(pressTimer);
    if (pressIdx >= 0 && tiles[pressIdx])
        tiles[pressIdx].classList.remove("dragsrc");
    if (dropEl) {
        dropEl.classList.remove("drop");
        dropEl = null;
    }
    if (ghost) {
        ghost.remove();
        ghost = null;
    }
    pressIdx = -1;
    dragging = false;
}
function phase() {
    return $("modal").classList.contains("show") ? "modal"
        : $("overlay").classList.contains("show") ? "overlay"
            : $("title").classList.contains("show") ? "menu" : "play";
}
function selectAt(i) {
    if (phase() !== "play" || i < 0 || i >= order.length)
        return;
    cursor = i;
    if (sel === i) {
        sel = -1;
        SFX.cancel();
    }
    else if (sel < 0) {
        sel = i;
        SFX.select();
    }
    else {
        const a = order[sel], b = order[i];
        sel = -1;
        renderFocus();
        attempt(a, b);
        return;
    }
    renderFocus();
}
// keyboard/gamepad select: mark pad mode so the focus ring shows
function padSelect() {
    padMode = true;
    selectAt(cursor);
}
function clearSel() {
    if (sel >= 0) {
        sel = -1;
        SFX.cancel();
        renderFocus();
        return true;
    }
    return false;
}
function attempt(aId, bId) {
    moves++;
    const res = RECIPE[rkey(aId, bId)];
    if (res && !codexK.has(rkey(aId, bId))) {
        codexK.add(rkey(aId, bId));
        saveCodex();
    }
    if (res && !found.has(res)) {
        found.add(res);
        addTile(res);
        const firstEver = !codexF.includes(res);
        if (firstEver) {
            codexF.push(res);
            saveCodex();
        }
        openModal(res, aId, bId, firstEver);
        SFX.discover();
    }
    else if (res) {
        toast(N(aId) + " + " + N(bId) + " = " + N(res) + " — already discovered");
        flash("hit", res); // point at the element you already own
        SFX.dupe();
    }
    else {
        toast(N(aId) + " + " + N(bId) + " … nothing happens");
        flash("bad", aId, bId);
        SFX.fail();
    }
    hud();
    save();
}
/* -------------------------------------------------------------------- hint */
// Names two elements you already hold that make something you do not — and
// charges a move for it, exactly like an attempt. That price is the whole
// design: a hint is progress bought with score, so a hinted run can never
// quietly out-rank an unhinted one, and spamming the button is self-limiting.
// It reveals the PAIR and never the result, so the discovery card still lands.
//
// One hint at a time: until you have actually made it, pressing hint again
// just shows the same pair, free. You paid for that answer, so re-reading it
// is not a second purchase — only moving on to a NEW answer is. Which also
// means the price cannot be dodged by re-rolling for an easier pair.
//
// A hint expires the moment its result exists, however that happened: the
// standing pair is checked against the found set rather than remembered as done, so
// discovering it the long way, or through an alternate recipe, retires the
// hint just as well. Not persisted — a reload simply forgets it, which only
// ever costs the player, never the other way round.
let lastHint = null;
function showHint([a, b], tail) {
    toast("Hint: try " + N(a) + " + " + N(b) + tail);
    flash("hit", a, b); // the same pulse a known combination gets: look here
    SFX.hint();
}
function hint() {
    if (phase() !== "play")
        return;
    if (lastHint && !found.has(RECIPE[rkey(lastHint[0], lastHint[1])])) {
        showHint(lastHint, " — already paid for");
        return;
    }
    const picks = [];
    for (const el of ELEMENTS) {
        if (found.has(el.id))
            continue;
        for (const p of el.r || [])
            if (found.has(p[0]) && found.has(p[1]))
                picks.push(p);
    }
    // Nothing within reach is free — no move, no score. Defensive: running out of
    // productive pairs means the board is complete, which opens the completion
    // overlay and leaves play phase, so today this cannot be reached.
    if (!picks.length) {
        lastHint = null;
        toast("Nothing new within reach — no hint to give");
        SFX.cancel();
        return;
    }
    lastHint = picks[(Math.random() * picks.length) | 0];
    moves++;
    showHint(lastHint, " — costs a move");
    hud();
    save();
}
/* ------------------------------------------------- discovery card (modal) */
let modalAt = 0;
function openModal(id, aId, bId, firstEver) {
    const el = BY_ID[id];
    // A first-EVER discovery (never seen in any previous run) opens with the
    // merge animation: the two ingredients fly together, flash, and the new
    // element pops out; the card text fades in after. All pure CSS with
    // animation delays — nothing to cancel if the card is dismissed early.
    const stage = firstEver
        ? '<div class="mstage">' +
            '<span class="mhalf mA">' + iconHtml(BY_ID[aId]) + "</span>" +
            '<span class="mhalf mB">' + iconHtml(BY_ID[bId]) + "</span>" +
            '<span class="mring"></span>' +
            '<span class="mres">' + iconHtml(el) + "</span>" +
            "</div>"
        : '<div class="big">' + iconHtml(el) + "</div>";
    $("mcard").innerHTML = stage +
        '<div class="mbody' + (firstEver ? " anim" : "") + '">' +
        '<div class="tag">NEW ELEMENT</div>' +
        "<h2>" + el.n + "</h2>" +
        '<div class="quote">“' + el.q + "”</div>" +
        '<div class="recipe">' + N(aId) + " + " + N(bId) + "</div>" +
        '<div class="hint">tap / Enter / Ⓐ</div>' +
        "</div>";
    $("modal").classList.add("show");
    modalAt = performance.now();
}
function dismissModal(force) {
    if (phase() !== "modal")
        return;
    if (!force && performance.now() - modalAt < 250)
        return; // eat the double-click that opened it
    $("modal").classList.remove("show");
    checkMilestones();
}
let obFns = [];
let obCur = 0;
function openOverlay(html, buttons) {
    $("ocard").innerHTML = html + '<div id="obtns"></div>';
    const box = $("obtns");
    obFns = [];
    obCur = 0;
    buttons.forEach(([label, fn]) => {
        const b = document.createElement("button");
        b.textContent = label;
        b.addEventListener("click", fn);
        box.appendChild(b);
        obFns.push(fn);
    });
    obPaint();
    $("overlay").classList.add("show");
}
function obPaint() {
    [...$("obtns").children].forEach((b, i) => b.classList.toggle("obfocus", i === obCur));
}
function obMove(d) {
    obCur = (obCur + d + obFns.length) % obFns.length;
    obPaint();
}
function obGo() {
    if (obFns[obCur])
        obFns[obCur]();
}
function closeOverlay() {
    $("overlay").classList.remove("show");
    $("ocard").innerHTML = ""; // the hidden best must not linger in the DOM
}
// Compare-and-store; returns the HTML line describing the result.
function bestLine(key, val) {
    const prev = +(store.get(key) || 0);
    if (!prev || val < prev) {
        store.set(key, val);
        return '<div class="line newbest">★ NEW BEST ★</div>' +
            (prev ? '<div class="line best">previous best: ' + prev + "</div>" : "");
    }
    return '<div class="line best">best: ' + prev + "</div>";
}
function checkMilestones() {
    if (!questDone && found.has("rainbow") && found.has("unicorn")) {
        questDone = true;
        const q = bestLine(K_QUEST, moves);
        save();
        hud();
        if (found.size === ELEMENTS.length)
            return finishFull(q); // unicorn was the last element
        SFX.fanfare();
        openOverlay('<div class="big">\u{1F308}\u{1F984}</div>' +
            '<div class="tag">QUEST COMPLETE</div>' +
            "<h2>Rainbow &amp; Unicorn</h2>" +
            '<div class="line">forged in <b>' + moves + "</b> moves</div>" + q, [["Keep playing", () => { closeOverlay(); hud(); }],
            ["New game", () => { closeOverlay(); reset(); }]]);
        return;
    }
    if (!fullDone && found.size === ELEMENTS.length)
        finishFull("");
}
function finishFull(questHtml) {
    fullDone = true;
    // The HIDDEN highscore: compared and shown only here, on a full clear.
    const f = bestLine(K_FULL, moves);
    save();
    hud();
    SFX.grand();
    openOverlay('<div class="big">\u{1F451}</div>' +
        '<div class="tag">GRAND ALCHEMIST</div>' +
        "<h2>All " + ELEMENTS.length + " elements</h2>" +
        (questHtml ? '<div class="line">quest also completed — in <b>' + moves + "</b> moves</div>" : "") +
        '<div class="line">complete run: <b>' + moves + "</b> moves</div>" + f, [["New game", () => { closeOverlay(); reset(); }]]);
}
/* ------------------------------------------------------- title screen menu */
// Boot lands here; Escape / Start / the HUD "Menu" button reopen it. The
// title floats over the bare background (body.menu hides the game UI), and
// Highscore / Encyclopedia swap the button column for the #mpanel subscreen.
let mCur = 0;
let ngArmed = false; // "New game" double-press confirm, like the old Restart
let ngTimer = 0;
function menuButtons() {
    return [...$("menu").querySelectorAll("button")];
}
function mPaint() {
    menuButtons().forEach((b, i) => b.classList.toggle("obfocus", i === mCur));
}
function disarmNg() {
    ngArmed = false;
    clearTimeout(ngTimer);
    const b = menuButtons()[1];
    if (b) {
        b.textContent = "New game";
        b.classList.remove("armed");
    }
}
function newGame() {
    if (!ngArmed && (moves > 0 || found.size > STARTERS.length)) {
        ngArmed = true;
        const b = menuButtons()[1];
        b.textContent = "Sure? (wipes the run)";
        b.classList.add("armed");
        ngTimer = setTimeout(disarmNg, 2500);
        return;
    }
    disarmNg();
    reset();
    closeMenu();
}
function continueGame() {
    closeMenu();
    // a run that completed the game comes back to its completion screen
    if (fullDone)
        showRestoredCompletion();
    hud();
}
const MENU = [
    ["Continue", continueGame],
    ["New game", newGame],
    ["Highscore", () => openPanel("HIGHSCORES", highscoreHtml())],
    ["Encyclopedia", () => openPanel("ENCYCLOPEDIA", encycloHtml())],
];
function openMenu() {
    if (phase() !== "play")
        return;
    cancelPress();
    clearSel();
    const box = $("menu");
    box.innerHTML = "";
    MENU.forEach(([label, fn], i) => {
        const b = document.createElement("button");
        b.textContent = label;
        b.addEventListener("click", fn);
        b.addEventListener("pointerenter", () => { mCur = i; mPaint(); });
        box.appendChild(b);
    });
    mCur = 0;
    ngArmed = false;
    closePanel();
    mPaint();
    $("title").classList.add("show");
    document.body.classList.add("menu");
}
function closeMenu() {
    disarmNg();
    closePanel();
    $("title").classList.remove("show");
    document.body.classList.remove("menu");
}
function openPanel(head, listHtml) {
    $("mhead").textContent = head;
    $("mlist").innerHTML = listHtml;
    $("mlist").scrollTop = 0;
    $("menu").hidden = true;
    $("mpanel").hidden = false;
}
function closePanel() {
    $("mpanel").hidden = true;
    $("menu").hidden = false;
}
function menuMove(d) {
    if (!$("mpanel").hidden) {
        $("mlist").scrollTop += d * 60;
        return;
    }
    disarmNg();
    mCur = (mCur + d + MENU.length) % MENU.length;
    mPaint();
    SFX.select();
}
function menuGo() {
    if (!$("mpanel").hidden) {
        closePanel();
        return;
    }
    const b = menuButtons()[mCur];
    if (b)
        b.click(); // through click, so the New game arming flow is identical
}
function menuBack() {
    if (!$("mpanel").hidden) {
        closePanel();
        return;
    }
    if (ngArmed) {
        disarmNg();
        return;
    }
    continueGame();
}
function highscoreHtml() {
    const q = store.get(K_QUEST), f = store.get(K_FULL);
    return ('<div class="hsrow"><span>Quest — Rainbow &amp; Unicorn</span><b>' +
        (q ? q + " moves" : "—") + "</b></div>" +
        '<div class="hsrow"><span>Complete run — all ' + ELEMENTS.length + " elements</span><b>" +
        (f ? f + " moves" : "???") + "</b></div>" +
        (f ? "" : '<div class="hsnote">the complete-run best reveals itself only to a Grand Alchemist</div>'));
}
function encycloHtml() {
    // The all-time codex, in first-discovery order — the player's journal, and
    // it survives New game. Only recipes actually performed are listed;
    // alternates stay unspoiled.
    const rows = codexF.map(id => {
        const el = BY_ID[id];
        const known = (el.r || []).filter(p => codexK.has(rkey(p[0], p[1])));
        const rec = known.length
            ? known.map(p => N(p[0]) + " + " + N(p[1])).join(" &nbsp;&middot;&nbsp; ")
            : el.r ? "?" : "primordial";
        return ('<div class="erow"><span class="eico">' + iconHtml(el) + "</span><span>" +
            "<b>" + el.n + '</b><i class="erec">' + rec + "</i>" +
            '<div class="equote">' + el.q + "</div></span></div>");
    }).join("");
    return rows +
        '<div class="hsnote">' + codexF.length + " / " + ELEMENTS.length + " elements &middot; " +
        codexK.size + " / " + Object.keys(RECIPE).length + " combinations</div>";
}
/* ---------------------------------------------------------------- restart */
function reset() {
    cancelPress();
    closeOverlay();
    $("modal").classList.remove("show");
    found = new Set(); // the codex deliberately survives — New game wipes the board, not the knowledge
    order.length = 0;
    tiles.length = 0;
    $("grid").innerHTML = "";
    moves = 0;
    questDone = fullDone = false;
    sel = -1;
    cursor = 0;
    lastHint = null; // its ingredients just left the board
    STARTERS.forEach(id => { found.add(id); addTile(id); });
    renderFocus();
    hud();
    save();
}
/* -------------------------------------------------------------------- boot */
function boot() {
    $("mnu").addEventListener("click", openMenu);
    $("snd").addEventListener("click", muteToggle);
    paintSound();
    $("hnt").addEventListener("click", hint);
    $("mback").addEventListener("click", menuBack);
    $("modal").addEventListener("click", () => dismissModal());
    // non-passive so an active drag can stop a pan from starting; until the
    // long-press lifts the tile, touch scrolling behaves normally
    window.addEventListener("touchmove", e => { if (dragging)
        e.preventDefault(); }, { passive: false });
    // restore the codex (all-time knowledge) first
    try {
        const cx = JSON.parse(store.get(K_CODEX) || "null");
        if (cx) {
            (Array.isArray(cx.f) ? cx.f : []).filter(id => BY_ID[id])
                .forEach(id => { if (!codexF.includes(id))
                codexF.push(id); });
            (Array.isArray(cx.k) ? cx.k : []).filter(k => RECIPE[k])
                .forEach(k => codexK.add(k));
        }
    }
    catch { }
    STARTERS.forEach(id => { if (!codexF.includes(id))
        codexF.push(id); });
    // then the saved run
    let run = null;
    const raw = store.get(K_RUN);
    try {
        run = raw ? JSON.parse(raw) : null;
    }
    catch { }
    if (run && Array.isArray(run.f)) {
        const ids = run.f.filter(id => BY_ID[id]);
        STARTERS.forEach(id => { if (!ids.includes(id))
            ids.unshift(id); });
        ids.forEach(id => { found.add(id); addTile(id); });
        // migrate pre-codex saves: a run's discoveries and combos are knowledge
        ids.forEach(id => { if (!codexF.includes(id))
            codexF.push(id); });
        if (Array.isArray(run.k))
            run.k.filter(k => RECIPE[k]).forEach(k => codexK.add(k));
        moves = Math.max(0, run.m | 0);
        questDone = !!run.q;
        fullDone = !!run.c;
    }
    else {
        STARTERS.forEach(id => { found.add(id); addTile(id); });
    }
    hud();
    save();
    saveCodex();
    openMenu(); // every session starts on the title screen
}
// A run that completed the game returns to its completion screen on Continue.
function showRestoredCompletion() {
    openOverlay('<div class="big">\u{1F451}</div>' +
        '<div class="tag">GRAND ALCHEMIST</div>' +
        "<h2>All " + ELEMENTS.length + " elements</h2>" +
        '<div class="line">complete run: <b>' + moves + "</b> moves</div>" +
        '<div class="line best">best: ' + (+(store.get(K_FULL) || 0) || moves) + "</div>", [["New game", () => { closeOverlay(); reset(); }]]);
}
/* -------------------------------------------------------------- test hooks */
// Consumed by check.mjs through window.CA (wired in index.ts).
function caState() {
    return { found: [...found], moves, questDone, fullDone, sel, cursor, phase: phase() };
}

// Keyboard and gamepad. Mouse/touch need no module: tiles and buttons carry
// their own click handlers, and drag-and-drop lives with the tiles too
// (see game.ts — addTile and the drag & drop section).
// Mute answers in every phase — a title screen or an open discovery card is
// exactly when someone reaches for it — so both bindings jump the phase handling
// below. muteToggle is the HUD button's handler too, so the label always agrees.
/* --------------------------------------------------------------- keyboard */
function initKeyboard() {
    window.addEventListener("keydown", e => {
        const k = e.key;
        if (!e.repeat && k === "m") {
            muteToggle();
            e.preventDefault();
            return;
        }
        const p = phase();
        if (p === "modal") {
            // e.repeat guard: a held Enter must not dismiss the card it just opened
            if (!e.repeat && (k === "Enter" || k === " " || k === "Escape")) {
                dismissModal();
                e.preventDefault();
            }
            return;
        }
        if (p === "overlay") {
            if (k === "ArrowLeft" || k === "ArrowRight" || k === "Tab") {
                obMove(k === "ArrowLeft" ? -1 : 1);
                e.preventDefault();
            }
            else if (!e.repeat && (k === "Enter" || k === " ")) {
                obGo();
                e.preventDefault();
            }
            return;
        }
        if (p === "menu") {
            if (k === "ArrowUp" || k === "w")
                menuMove(-1);
            else if (k === "ArrowDown" || k === "s")
                menuMove(1);
            else if (!e.repeat && (k === "Enter" || k === " "))
                menuGo();
            else if (k === "Escape")
                menuBack();
            else
                return;
            e.preventDefault();
            return;
        }
        if (k === "ArrowLeft" || k === "a")
            moveCursor(-1, 0);
        else if (k === "ArrowRight" || k === "d")
            moveCursor(1, 0);
        else if (k === "ArrowUp" || k === "w")
            moveCursor(0, -1);
        else if (k === "ArrowDown" || k === "s")
            moveCursor(0, 1);
        else if (!e.repeat && (k === "Enter" || k === " "))
            padSelect();
        else if (!e.repeat && k === "h")
            hint(); // costs a move, so never on repeat
        else if (k === "Escape") {
            if (!clearSel())
                openMenu();
        } // Esc: cancel, else pause
        else
            return;
        e.preventDefault();
    });
}
const DELTA = {
    left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1],
};
let prevA = false, prevB = false, prevX = false, prevY = false, prevStart = false;
const dirHeld = {};
function pollPad(now) {
    let pad = null;
    try {
        const gps = navigator.getGamepads ? navigator.getGamepads() : [];
        for (const g of gps)
            if (g && g.connected) {
                pad = g;
                break;
            }
    }
    catch { }
    if (!pad)
        return;
    const p0 = pad; // const-bind: let-narrowing does not survive into closures
    const bt = (i) => !!(p0.buttons[i] && p0.buttons[i].pressed);
    const ax = (i) => (p0.axes && p0.axes[i]) || 0;
    const dirs = {
        left: bt(14) || ax(0) < -0.5,
        right: bt(15) || ax(0) > 0.5,
        up: bt(12) || ax(1) < -0.5,
        down: bt(13) || ax(1) > 0.5,
    };
    for (const d of Object.keys(dirs)) {
        if (dirs[d]) {
            const h = dirHeld[d];
            const fire = !h || (now - h.since > 330 && now - h.last > 140);
            if (!h)
                dirHeld[d] = { since: now, last: now };
            if (fire) {
                dirHeld[d].last = now;
                const p = phase();
                if (p === "play")
                    moveCursor(DELTA[d][0], DELTA[d][1]);
                else if (p === "overlay" && (d === "left" || d === "right"))
                    obMove(d === "left" ? -1 : 1);
                else if (p === "menu" && (d === "up" || d === "down"))
                    menuMove(d === "up" ? -1 : 1);
            }
        }
        else
            delete dirHeld[d];
    }
    const a = bt(0), b = bt(1), x = bt(2), y = bt(3), st = bt(9);
    if (a && !prevA) {
        const p = phase();
        if (p === "modal")
            dismissModal();
        else if (p === "overlay")
            obGo();
        else if (p === "menu")
            menuGo();
        else
            padSelect();
    }
    if (b && !prevB) {
        const p = phase();
        if (p === "modal")
            dismissModal();
        else if (p === "menu")
            menuBack();
        else if (p === "play") {
            if (!clearSel())
                openMenu();
        } // Ⓑ mirrors Escape
    }
    if (x && !prevX)
        muteToggle(); // Ⓧ mirrors M, in every phase
    if (y && !prevY && phase() === "play")
        hint(); // Ⓨ mirrors H; ignored elsewhere
    if (st && !prevStart) {
        const p = phase();
        if (p === "modal")
            dismissModal();
        else if (p === "overlay")
            obGo();
        else if (p === "menu")
            menuBack(); // Start toggles the pause menu closed
        else
            openMenu(); // and open
    }
    prevA = a;
    prevB = b;
    prevX = x;
    prevY = y;
    prevStart = st;
}

// Entry point: boots the game, wires inputs, runs the frame loop (gamepad
// polling), and exposes the window.CA test hooks check.mjs drives.
boot();
initKeyboard();
// The music needs a user gesture before the AudioContext may run, so it starts
// on the first one of either kind. startMusic is idempotent, so no removal.
document.addEventListener("pointerdown", startMusic);
document.addEventListener("keydown", startMusic);
// the only thing left needing a frame: the gamepad, which has no event API
const frame = (t) => {
    pollPad(t);
    requestAnimationFrame(frame);
};
requestAnimationFrame(frame);
window.CA = {
    ELEMENTS,
    RECIPE,
    attempt,
    selectAt,
    dismiss: () => dismissModal(true),
    reset,
    state: caState,
};
