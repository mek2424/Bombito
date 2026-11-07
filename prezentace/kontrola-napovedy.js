// Ověří, že každý odkaz „Nápověda › …“ z obsah.js otevře v aplikaci správnou otázku jako PRVNÍ.
// Aplikace běží ve vzhledu Trenéra (otázky s tr:1 jsou jen tam), stejně jako na screenshotech.
// Vypíše: hledaný výraz → první nalezená otázka. Kontroluj očima, že odpovídá tématu slidu.
const path = require("path"); const fs = require("fs"); const http = require("http");
const { chromium } = require("playwright");
const OBSAH = require("./obsah");
const REPO = path.join(__dirname, "..");
const server = http.createServer((req, res) => { const u = decodeURIComponent(req.url.split("?")[0]); const f = path.join(REPO, u === "/" ? "index.html" : u);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); } res.end(fs.readFileSync(f)); });
(async () => {
  await new Promise(r => server.listen(0, "127.0.0.1", r)); const base = `http://127.0.0.1:${server.address().port}`;
  const b = await chromium.launch(); const data = fs.readFileSync(path.join(__dirname, "data", "testovaci-data.json"), "utf8");
  for (const s of OBSAH.filter(s => s.napoveda)) {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 } }); const page = await ctx.newPage();
    await page.addInitScript((d) => { if (!sessionStorage.getItem("x")) { localStorage.setItem("bombito_v4", d); localStorage.setItem("bombito_last_export", String(Date.now())); localStorage.setItem("bombito_vzhled", JSON.stringify({ skin: "trener", dark: false, primary: "#2B7D2B", accent: "#E8622C", pismo: "patrick" })); sessionStorage.setItem("x", 1); } }, data);
    await page.route("**/*", r => r.request().url().startsWith(base) ? r.continue() : r.abort());
    await page.goto(`${base}/index.html?napoveda=${encodeURIComponent(s.napoveda)}`); await page.waitForTimeout(2200);
    const prvni = await page.evaluate(() => { const e = [...document.querySelectorAll("#modalContent summary, #modalContent .hq")].find(x => x.offsetParent); return e ? e.textContent.trim().slice(0, 90) : "— NIC NENALEZENO —"; });
    console.log(`${s.nadpis.padEnd(28)} „${s.napoveda}“ → ${prvni}`);
    await ctx.close();
  }
  await b.close(); server.close();
})();
