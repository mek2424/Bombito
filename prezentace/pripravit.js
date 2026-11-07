// Připraví obrázky pro sestav.js: zaoblí rohy všech screenshotů a nařeže výřezy podle obsah.js.
// pracovni/snimky/*.png → pracovni/img/*.png (celé) + pracovni/img/<název>-v<y>.png (výřezy)
const sharp = require("sharp"); const fs = require("fs"); const path = require("path");
const OBSAH = require("./obsah");
const SRC = path.join(__dirname, "pracovni", "snimky"), DST = path.join(__dirname, "pracovni", "img");
fs.mkdirSync(DST, { recursive: true });
const maska = (w, h, r) => Buffer.from(`<svg width="${w}" height="${h}"><rect width="${w}" height="${h}" rx="${r}" ry="${r}"/></svg>`);
(async () => {
  const chybi = new Set();
  for (const s of OBSAH) for (const im of (s.img || [])) if (!fs.existsSync(path.join(SRC, im[0] + ".png"))) chybi.add(im[0]);
  if (chybi.size) { console.error("Chybí screenshoty (doplň scénu v sceny.js):", [...chybi].join(", ")); process.exit(1); }
  let n = 0;
  for (const f of fs.readdirSync(SRC).filter(f => f.endsWith(".png") && !f.startsWith("_"))) {
    const m = await sharp(path.join(SRC, f)).metadata();
    await sharp(path.join(SRC, f)).composite([{ input: maska(m.width, m.height, m.width < m.height ? 46 : 30), blend: "dest-in" }]).png().toFile(path.join(DST, f)); n++;
  }
  let v = 0;
  for (const s of OBSAH) for (const im of (s.img || [])) {
    if (!im[2]) continue;
    const [x, y, w, h] = im[2];
    await sharp(path.join(SRC, im[0] + ".png")).extract({ left: x, top: y, width: w, height: h })
      .composite([{ input: maska(w, h, 30), blend: "dest-in" }]).png().toFile(path.join(DST, `${im[0]}-v${y}.png`)); v++;
  }
  console.log(`obrázků: ${n}, výřezů: ${v}`);
})();
