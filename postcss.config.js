// cssnano, same preset galaxy-raid uses. Two consumers, and they must stay in
// step: rollup.config.mjs pipes src/style.css through `npx postcss` at config
// load, and postbuild.mjs hands html-minifier the same command for any CSS
// still left in the template.
//
// preset "advanced" is the aggressive one — it also renames @keyframes
// (reduceIdents) and rebases z-index. Both are safe here only because nothing
// in src/*.ts reads an animation name or a z-index back out of the CSS; if that
// changes, drop to "default" rather than debugging a silent restyle.
module.exports = {
  plugins: [require("cssnano")({ preset: "advanced" })],
};
