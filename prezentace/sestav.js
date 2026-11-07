// Sestaví prezentaci „Co všechno Bombito umí“ z obsah.js → pracovni/Bombito-pro-trenery.pptx
const pptxgen = require("pptxgenjs");
const path = require("path");
const OBSAH = require("./obsah");
const IMG = path.join(__dirname, "pracovni", "img");
const LOGO = path.join(__dirname, "..", "icons", "bombito-512.png");

const THEME = {
  name: "Trenér", headFontFace: "Bebas Neue", bodyFontFace: "DM Sans",
  colors: { dk1: "1B2430", lt1: "FFFFFF", dk2: "216321", lt2: "F4F5F2", accent1: "339933", accent2: "E8622C",
    accent3: "4A5564", accent4: "E8C468", accent5: "A8C0DE", accent6: "C74F1E", hlink: "339933", folHlink: "216321" }
};
const HEX = { court: "339933", courtDark: "216321", paper: "F4F5F2" };
const ROZMER = { tel: [780, 1688], sirka: [1688, 780], pc: [2560, 1600], pdf: [1288, 1821] };
const SW = 13.333, SH = 7.5;
const BLOKY = {
  A: "Začínáme", B: "Tvoje hráčky", C: "Testování", D: "Co čísla znamenají", E: "Vývoj hráčky",
  F: "Zápasy", G: "Turnaje a minihry", H: "Přehledy", I: "Report pro rodiče", J: "Data a nastavení"
};
const URL_NAPOVEDA = (q) => "https://mek2424.github.io/Bombito/?napoveda=" + encodeURIComponent(q);

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE";
pres.title = "Bombito pro trenéry";
pres.author = "Mek";
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
// Barvy natvrdo (hex), aby nebyl potřeba dodatečný zápis motivu do PPTX.
const C = { text1: "1B2430", background1: "FFFFFF", background2: "F4F5F2", accent1: "339933", accent2: "E8622C", accent3: "4A5564" };

pres.defineSlideMaster({ title: "Titulní", background: { color: HEX.courtDark }, objects: [
  { placeholder: { options: { name: "title", type: "title", x: 0.8, y: 2.3, w: 7.2, h: 2.4, fontFace: "Bebas Neue", fontSize: 80, color: C.background1, valign: "bottom", align: "left", margin: 0 }, text: "" } },
  { placeholder: { options: { name: "body", type: "body", x: 0.8, y: 4.9, w: 6.6, h: 1.2, fontFace: "DM Sans", fontSize: 20, color: C.background2, valign: "top", align: "left", margin: 0 }, text: "" } }
] });
pres.defineSlideMaster({ title: "Předěl", background: { color: HEX.court }, objects: [
  { placeholder: { options: { name: "title", type: "title", x: 3.6, y: 2.35, w: 9, h: 1.6, fontFace: "Bebas Neue", fontSize: 72, color: C.background1, valign: "bottom", align: "left", margin: 0 }, text: "" } },
  { placeholder: { options: { name: "body", type: "body", x: 3.6, y: 4.05, w: 8.6, h: 1.3, fontFace: "DM Sans", fontSize: 20, color: C.background1, valign: "top", align: "left", margin: 0 }, text: "" } }
] });
pres.defineSlideMaster({ title: "Obsah", background: { color: HEX.paper }, objects: [
  { placeholder: { options: { name: "title", type: "title", x: 0.7, y: 0.55, w: 5.2, h: 1.3, fontFace: "Bebas Neue", fontSize: 40, color: C.accent1, valign: "top", align: "left", margin: 0 }, text: "" } }
], slideNumber: { x: 12.3, y: 7.0, w: 0.6, h: 0.3, fontFace: "DM Sans", fontSize: 10, color: "4A5564", align: "right" } });

let n = 0;
const id = (s) => `${s}-${++n}`;
function kolecko(slide, cislo, x, y, d) {
  d = d || 0.46;
  slide.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color: C.accent2 }, line: { color: C.background1, width: 2 }, objectName: id("kolecko") });
  slide.addText(String(cislo), { x, y, w: d, h: d, align: "center", valign: "middle", margin: 0, fontFace: "Bebas Neue", fontSize: 22, color: C.background1, isTextBox: true, objectName: id("cislo") });
}
// Rozmístí obrázky do pravé části snímku, vrátí rámečky [{x,y,w,h,sw,sh}]
function rozmisti(imgs, siroky, tok) {
  const X0 = siroky ? 5.15 : 6.25, X1 = SW - 0.6, Y0 = 0.55, Y1 = SH - 0.6;
  const W = X1 - X0, H = Y1 - Y0;
  const r = imgs.map(([, d, v]) => v ? [v[2], v[3]] : ROZMER[d]);
  const svisle = imgs.length > 1 && r.every(([w, h]) => w > h * 1.15);
  let ramy = [];
  if (svisle) {
    const gap = tok ? 0.55 : 0.3;
    let w = W, hs = r.map(([a, b]) => w * b / a), celk = hs.reduce((s, h) => s + h, 0) + gap;
    if (celk > H) { const k = (H - gap) / (celk - gap); w *= k; hs = hs.map(h => h * k); celk = H; }
    let y = Y0 + (H - celk) / 2;
    hs.forEach((h, i) => { ramy.push({ x: X1 - w, y, w, h }); y += h + gap; });
  } else {
    const gap = tok ? 0.7 : 0.4;
    let h = H, ws = r.map(([a, b]) => h * a / b), celk = ws.reduce((s, w) => s + w, 0) + gap * (imgs.length - 1);
    if (celk > W) { const k = (W - gap * (imgs.length - 1)) / (celk - gap * (imgs.length - 1)); h *= k; ws = ws.map(w => w * k); celk = W; }
    let x = X1 - celk; const y = Y0 + (H - h) / 2;
    ws.forEach((w, i) => { ramy.push({ x, y, w, h }); x += w + gap; });
  }
  ramy.svisle = svisle;
  return Object.assign(ramy.map((q, i) => Object.assign(q, { sw: r[i][0], sh: r[i][1], druh: imgs[i][2] ? "vyrez" : imgs[i][1], v: imgs[i][2] || [0, 0] })), { svisle });
}
function sipky(slide, ramy) {
  for (let i = 0; i + 1 < ramy.length; i++) {
    const a = ramy[i], b = ramy[i + 1];
    if (ramy.svisle) {
      const x = a.x + a.w / 2 - 0.22, y = a.y + a.h + (b.y - a.y - a.h) / 2 - 0.2;
      slide.addShape(pres.shapes.DOWN_ARROW, { x, y, w: 0.44, h: 0.4, fill: { color: C.accent2 }, line: { type: "none" }, objectName: id("sipka") });
    } else {
      const x = a.x + a.w + (b.x - a.x - a.w) / 2 - 0.22, y = a.y + a.h / 2 - 0.22;
      slide.addShape(pres.shapes.RIGHT_ARROW, { x, y, w: 0.44, h: 0.44, fill: { color: C.accent2 }, line: { type: "none" }, objectName: id("sipka") });
    }
  }
}
function napoveda(slide, slovo, w) {
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.7, y: 6.45, w: Math.min(w, 4.9), h: 0.5, rectRadius: 0.25, fill: { color: C.background1 }, line: { color: "DCDFD9", width: 0.75 }, objectName: id("napoveda-ram") });
  slide.addShape(pres.shapes.OVAL, { x: 0.8, y: 6.53, w: 0.34, h: 0.34, fill: { color: C.accent1 }, line: { type: "none" }, objectName: id("napoveda-ikona") });
  slide.addText("?", { x: 0.8, y: 6.53, w: 0.34, h: 0.34, align: "center", valign: "middle", margin: 0, fontFace: "DM Sans", bold: true, fontSize: 13, color: C.background1, isTextBox: true, objectName: id("napoveda-otaznik") });
  slide.addText([{ text: "Nápověda › ", options: { color: C.accent3, hyperlink: { url: URL_NAPOVEDA(slovo), tooltip: "Otevřít v Bombitu" } } }, { text: `${slovo}`, options: { bold: true, color: C.accent1, underline: { style: "sng" }, hyperlink: { url: URL_NAPOVEDA(slovo), tooltip: "Otevřít v Bombitu" } } }],
    { x: 1.25, y: 6.45, w: Math.min(w, 4.9) - 0.6, h: 0.5, fontFace: "DM Sans", fontSize: 13, valign: "middle", margin: 0, isTextBox: true, objectName: id("napoveda-text") });
}
function obrazek(slide, soubor, q) {
  if (q.druh === "tel") {
    const b = 0.07;
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: q.x - b, y: q.y - b, w: q.w + 2 * b, h: q.h + 2 * b, rectRadius: 0.22, fill: { color: C.text1 }, line: { type: "none" },
      shadow: { type: "outer", color: "1B2430", opacity: 0.25, blur: 8, offset: 3, angle: 90 }, objectName: id("telefon") });
  } else {
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: q.x, y: q.y, w: q.w, h: q.h, rectRadius: 0.12, fill: { color: C.background1 }, line: { color: "DCDFD9", width: 0.75 },
      shadow: { type: "outer", color: "1B2430", opacity: 0.18, blur: 10, offset: 3, angle: 90 }, objectName: id("ramecek") });
  }
  slide.addImage({ path: path.join(IMG, soubor + ".png"), x: q.x, y: q.y, w: q.w, h: q.h, altText: "Snímek obrazovky z aplikace Trenér", objectName: id("screenshot") });
}

// ------- snímky -------
let blok = "Úvod";
pres.addSection({ title: "Úvod" });
for (const s of OBSAH) {
  if (s.typ === "predel") { blok = `${s.pismeno} · ${BLOKY[s.pismeno]}`; pres.addSection({ title: blok }); }
  if (s.typ === "tahak") { blok = "Závěr"; pres.addSection({ title: blok }); }

  if (s.typ === "titul") {
    const sl = pres.addSlide({ masterName: "Titulní", sectionTitle: blok });
    sl.addImage({ path: LOGO, x: 0.8, y: 0.75, w: 1.0, h: 1.0, objectName: "logo" });
    sl.addText("BOMBITO · PRO TRENÉRY", { x: 2.0, y: 0.95, w: 6, h: 0.6, fontFace: "Bebas Neue", fontSize: 28, color: C.background2, charSpacing: 2, margin: 0, isTextBox: true, objectName: "stitek" });
    sl.addText("Co všechno Bombito umí", { placeholder: "title" });
    sl.addText("Od první hráčky po report pro rodiče", { placeholder: "body" });
    obrazek(sl, "b0-domu", { x: 8.55, y: 0.6, w: 2.9, h: 2.9 * 1688 / 780, druh: "tel" });
    sl.addNotes("Úvod (1 min). Bombito sleduje vývoj hráček: fyzické a herní testy, zápasy, milníky. Hráčky ho nevidí, je jen pro trenéra.\nVšechny obrázky jsou z aktuální verze aplikace s testovacími daty (vymyšlené hráčky). Štítek Nápověda na každém snímku otevře Bombito rovnou na tom tématu.");
  } else if (s.typ === "mapa") {
    const sl = pres.addSlide({ masterName: "Obsah", sectionTitle: blok });
    sl.addText("Co dnes uvidíte", { placeholder: "title" });
    Object.entries(BLOKY).forEach(([p, t], i) => {
      const col = i % 5, row = Math.floor(i / 5), x = 0.7 + col * 2.42, y = 2.0 + row * 2.3;
      sl.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w: 2.25, h: 2.0, rectRadius: 0.15, fill: { color: C.background1 }, line: { color: "DCDFD9", width: 0.75 }, objectName: id("dlazdice") });
      sl.addText(p, { x: x + 0.22, y: y + 0.12, w: 1, h: 0.95, fontFace: "Bebas Neue", fontSize: 50, color: i < 5 ? C.accent1 : C.accent2, margin: 0, valign: "middle", isTextBox: true, objectName: id("pismeno") });
      sl.addText(t, { x: x + 0.22, y: y + 1.05, w: 1.9, h: 0.8, fontFace: "DM Sans", fontSize: 15, bold: true, color: C.text1, margin: 0, valign: "middle", isTextBox: true, objectName: id("blok") });
    });
    sl.addNotes("Mapa (1 min). Deset bloků, zhruba hodina: od prázdného týmu přes testy a čísla, zápasy a turnaje až po report pro rodiče a zálohy.");
  } else if (s.typ === "predel") {
    const sl = pres.addSlide({ masterName: "Předěl", sectionTitle: blok });
    sl.addText(s.pismeno, { x: 0.8, y: 1.6, w: 2.6, h: 4.0, fontFace: "Bebas Neue", fontSize: 260, color: C.background1, transparency: 25, align: "center", valign: "middle", margin: 0, isTextBox: true, objectName: id("pismeno-bloku") });
    sl.addText(s.nadpis, { placeholder: "title" });
    sl.addText(s.pod, { placeholder: "body" });
    sl.addNotes(s.poznamky);
  } else if (s.typ === "tahak") {
    const sl = pres.addSlide({ masterName: "Obsah", sectionTitle: blok });
    sl.addText("Tahák", { placeholder: "title" });
    const radky = [
      ["A", "Plus = cokoli nového · exportuj tým"],
      ["B", "Přidat hráčku · pozice pod jménem"],
      ["C", "Skupinový test · stejné datum = oprava"],
      ["D", "T 50 = průměr · ťukni na Overall"],
      ["E", "Milníky ťukáním · lepík = poznámky"],
      ["F", "Spustit zápas · + − a 1·3·5 · Zpět"],
      ["G", "Turnaj seskupí zápasy · Forma 🔥"],
      ["H", "Domů řadí · Testy · Srovnání"],
      ["I", "PDF na kartě hráčky"],
      ["J", "Sezóna a data · víc týmů · Nastavení"]
    ];
    radky.forEach(([p, t], i) => {
      const col = i < 5 ? 0 : 1, row = i < 5 ? i : i - 5, x = 0.7 + col * 6.1, y = 1.55 + row * 1.0;
      sl.addShape(pres.shapes.OVAL, { x, y, w: 0.56, h: 0.56, fill: { color: i < 5 ? C.accent1 : C.accent2 }, line: { type: "none" }, objectName: id("tahak-kruh") });
      sl.addText(p, { x, y, w: 0.56, h: 0.56, align: "center", valign: "middle", fontFace: "Bebas Neue", fontSize: 24, color: C.background1, margin: 0, isTextBox: true, objectName: id("tahak-pismeno") });
      sl.addText(t, { x: x + 0.8, y: y - 0.05, w: 5.0, h: 0.66, fontFace: "DM Sans", fontSize: 16, color: C.text1, valign: "middle", margin: 0, isTextBox: true, objectName: id("tahak-text") });
    });
    sl.addNotes("Shrnutí (2 min). Kdo si má zapamatovat jednu věc: zálohuj — Bombito nemá server.");
  } else if (s.typ === "konec") {
    const sl = pres.addSlide({ masterName: "Titulní", sectionTitle: blok });
    sl.addImage({ path: LOGO, x: 0.8, y: 0.75, w: 1.0, h: 1.0, objectName: "logo-konec" });
    sl.addText("Otázky?", { placeholder: "title" });
    sl.addText("Odpovědi najdeš v Nápovědě pod otazníkem", { placeholder: "body" });
    obrazek(sl, "d-pavouk", { x: 8.55, y: 0.6, w: 2.9, h: 2.9 * 1688 / 780, druh: "tel" });
    sl.addNotes("Prostor na otázky. Nejdřív si přidejte pár hráček a zkuste skupinový test — zbytek přijde sám.");
  } else {
    // obsahový snímek
    const sl = pres.addSlide({ masterName: "Obsah", sectionTitle: blok });
    sl.addText(s.nadpis, { placeholder: "title" });
    const ramy = rozmisti(s.img, s.siroky, s.tok);
    const bwCelk = ramy[0].x - 0.7 - 0.35;
    s.img.forEach(([f, , v], i) => obrazek(sl, v ? `${f}-v${v[1]}` : f, ramy[i]));
    if (s.tok) sipky(sl, ramy);
    if (s.napoveda) napoveda(sl, s.napoveda, bwCelk);
    const bw = (s.siroky ? 5.15 : 6.25) - 0.7 - 0.35 - 0.65;
    s.body.forEach(([nad, txt], i) => {
      const y = 2.15 + i * 1.45;
      kolecko(sl, i + 1, 0.7, y);
      sl.addText(nad, { x: 1.35, y: y - 0.02, w: bw, h: 0.5, fontFace: "DM Sans", fontSize: 18, bold: true, color: C.text1, margin: 0, valign: "middle", isTextBox: true, objectName: id("bod") });
      if (txt) sl.addText(txt, { x: 1.35, y: y + 0.5, w: bw, h: 0.75, fontFace: "DM Sans", fontSize: 15, color: C.accent3, margin: 0, valign: "top", isTextBox: true, objectName: id("bod-text") });
    });
    (s.znacky || []).forEach(([i, cislo, px, py]) => {
      const q = ramy[i];
      kolecko(sl, cislo, q.x + (px - q.v[0]) / q.sw * q.w - 0.23, q.y + (py - q.v[1]) / q.sh * q.h - 0.23);
    });
    sl.addNotes(s.poznamky);
  }
}

(async () => {
  const out = path.join(__dirname, "pracovni", "Bombito-pro-trenery.pptx");
  await pres.writeFile({ fileName: out });
  console.log("hotovo", out, "snímků:", OBSAH.length);
})();
