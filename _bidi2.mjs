import bidiFactory from "bidi-js";
const bidi = bidiFactory();
const s = "جهة فاعلة 105 ← 130 عبر";
const emb = bidi.getEmbeddingLevels(s, "rtl");
console.log("mirror of ← =", JSON.stringify(bidi.getMirroredCharacter("←")));
const m = bidi.getMirroredCharactersMap(s, emb);
console.log("mirrored map:", [...m.entries()].map(([i, c]) => [i, s[i], c]));
