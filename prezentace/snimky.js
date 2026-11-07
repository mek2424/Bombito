// Fotí screenshoty Bombita v Chromiu (Playwright): testovací data do localStorage, vzhled Trenéra.
//   node snimky.js            … všechny scény ze sceny.js
//   node snimky.js d_overall  … jen vybrané scény
// Výstup: pracovni/snimky/<název>.png (780×1688 = telefon 390×844 při 2×).
const fs = require("fs");
const path = require("path");
const http = require("http");
const { chromium } = require("playwright");

const REPO = process.env.REPO || path.join(__dirname, "..");
const NM = path.join(__dirname, "node_modules");
const DATA = process.env.DATA || path.join(__dirname, "data", "testovaci-data.json");
const OUT = path.join(__dirname, "pracovni", "snimky");
fs.mkdirSync(OUT, { recursive: true });
const TYPY = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".png": "image/png",
  ".woff2": "font/woff2", ".woff": "font/woff", ".ttf": "font/ttf", ".mp3": "audio/mpeg", ".svg": "image/svg+xml" };
const server = http.createServer((req, res) => {
  const u = decodeURIComponent(req.url.split("?")[0]);
  const soubor = u.startsWith("/__nm/") ? path.join(NM, u.slice(6)) : path.join(REPO, u === "/" ? "index.html" : u);
  if (!fs.existsSync(soubor) || fs.statSync(soubor).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { "Content-Type": (TYPY[path.extname(soubor)] || "application/octet-stream") + "; charset=utf-8" });
  res.end(fs.readFileSync(soubor));
});
const TELEFON = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true };
const NASIRKU = { viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true };
const POCITAC = { viewport: { width: 1280, height: 800 } };

(async () => {
  await new Promise(r => server.listen(0, "127.0.0.1", r));
  const base = `http://127.0.0.1:${server.address().port}`;
  const sceny = require("./sceny");
  const jen = process.argv.slice(2);
  const b = await chromium.launch({ args: ["--lang=cs-CZ"] });
  for (const [nazev, sc] of Object.entries(sceny)) {
    if (jen.length && !jen.includes(nazev)) continue;
    const data = JSON.parse(fs.readFileSync(DATA, "utf8"));
    if (sc.upravy) sc.upravy(data);
    const vzhled = Object.assign({ skin: "trener", dark: false, primary: "#2B7D2B", accent: "#E8622C", pismo: "patrick" }, sc.vzhled || {});
    const rez = { telefon: TELEFON, nasirku: NASIRKU, pocitac: POCITAC }[sc.rezim || "telefon"];
    const ctx = await b.newContext(Object.assign({ deviceScaleFactor: 2, locale: "cs-CZ", timezoneId: "Europe/Prague", acceptDownloads: true }, rez));
    const page = await ctx.newPage();
    const chyby = [];
    page.on("pageerror", e => chyby.push(e.message));
    await page.addInitScript(({ data, vzhled, extra }) => {
      if (window.top !== window) return;
      if (sessionStorage.getItem("__nalito")) return;
      localStorage.clear();
      localStorage.setItem("bombito_v4", JSON.stringify(data));
      localStorage.setItem("bombito_vzhled", JSON.stringify(vzhled));
      Object.entries(extra || {}).forEach(([k, v]) => localStorage.setItem(k, v));
      sessionStorage.setItem("__nalito", "1");
      try { delete Navigator.prototype.serviceWorker; } catch (e) {}
    }, { data, vzhled, extra: Object.assign({ bombito_last_export: String(Date.now()) }, sc.localStorage) });
    await page.route("**/*", (route) => {
      const u = route.request().url();
      if (u.startsWith(base)) return route.continue();
      if (/fonts\.googleapis\.com/.test(u)) {
        const css = ["bebas-neue/400.css", "dm-sans/400.css", "dm-sans/500.css", "dm-sans/600.css", "dm-sans/700.css", "dm-sans/400-italic.css",
          "patrick-hand/400.css", "caveat/400.css", "caveat/700.css", "kalam/400.css", "kalam/700.css"]
          .filter(f => fs.existsSync(path.join(NM, "@fontsource", f))).map(f => `@import url("${base}/__nm/@fontsource/${f}");`).join("\n");
        return route.fulfill({ status: 200, contentType: "text/css", body: css });
      }
      return route.abort();
    });
    const h = {
      pockej: (ms) => page.waitForTimeout(ms || 500),
      snimek: async (n, o) => { await page.waitForTimeout(300); await page.screenshot(Object.assign({ path: path.join(OUT, n + ".png") }, o || {})); },
      tlacitka: (re) => page.evaluate((src) => [...document.querySelectorAll("button,a,[role=button],[onclick],summary,label,.tab")]
        .filter(e => e.offsetParent && new RegExp(src, "i").test(e.textContent + " " + (e.getAttribute("aria-label") || "")))
        .map(e => (e.id ? "#" + e.id + " " : "") + String(e.className).slice(0, 30) + " | " + (e.getAttribute("onclick") || "").slice(0, 50) + " | " + (e.textContent.trim().replace(/\s+/g, " ") || e.getAttribute("aria-label") || "").slice(0, 50)).slice(0, 25), re.source || re),
      mer: (sel) => page.evaluate((sel) => sel.map(([n, s, txt]) => {
        let els = [...document.querySelectorAll(s)].filter(e => e.offsetParent || e.getClientRects().length);
        if (txt) els = els.filter(e => new RegExp(txt).test(e.textContent));
        const e = els[0]; if (!e) return n + ": NIC";
        const r = e.getBoundingClientRect(); return `${n}: x=${Math.round((r.left + r.width / 2) * 2)} y=${Math.round((r.top + r.height / 2) * 2)}`;
      }).join("\n"), sel),
      base, out: OUT
    };
    try {
      await page.goto(`${base}/${sc.cesta || "index.html"}`);
      await page.waitForTimeout(sc.cekej || 2500);
      await sc.kroky(page, h);
      console.log("✓", nazev, chyby.length ? "JS: " + chyby.join(" | ").slice(0, 200) : "");
    } catch (e) {
      console.log("✗", nazev, "—", e.message.split("\n")[0]);
      try { await page.screenshot({ path: path.join(OUT, "_chyba-" + nazev + ".png") }); } catch (x) {}
    }
    await ctx.close();
  }
  await b.close(); server.close();
})();
