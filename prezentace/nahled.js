// Náhledy k vizuální kontrole: každou stránku PDF vyrenderuje a složí po 9 do mřížek.
// Vypíše taky počet stran a počet odkazů do Nápovědy (má jich být 2 na každý slide s tématem).
const fs = require("fs"); const path = require("path");
const { chromium } = require("playwright");
const PDF = path.join(__dirname, "Bombito-pro-trenery.pdf"), OUT = path.join(__dirname, "pracovni", "nahled");
(async () => {
  fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true });
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const doc = await pdfjs.getDocument({ data: new Uint8Array(fs.readFileSync(PDF)) }).promise;
  let odkazy = 0;
  for (let i = 1; i <= doc.numPages; i++) odkazy += (await (await doc.getPage(i)).getAnnotations()).filter(a => a.url && a.url.includes("?napoveda=")).length;
  console.log(`stran: ${doc.numPages}, odkazů do Nápovědy: ${odkazy}`);
  const b = await chromium.launch(); const page = await b.newPage({ viewport: { width: 2000, height: 1150 } });
  // pdf.js vykreslí stránky v Chromiu; soubory mu podává malý lokální server
  const pdfjsDir = path.dirname(require.resolve("pdfjs-dist/package.json"));
  const srv = require("http").createServer((req, res) => { const u = req.url.split("?")[0];
    if (u === "/") { res.writeHead(200, { "Content-Type": "text/html" }); return res.end("<!doctype html><title>náhled</title>"); }
    const f = u === "/prezentace.pdf" ? PDF : path.join(pdfjsDir, u);
    if (!fs.existsSync(f)) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { "Content-Type": f.endsWith(".mjs") ? "text/javascript" : "application/octet-stream" }); res.end(fs.readFileSync(f)); });
  await new Promise(r => srv.listen(0, "127.0.0.1", r)); const base = `http://127.0.0.1:${srv.address().port}`;
  await page.goto(base + "/");
  for (let start = 1, m = 1; start <= doc.numPages; start += 9, m++) {
    await page.evaluate(() => { document.body.innerHTML = ""; document.body.style.cssText = "margin:0;background:#fff;display:grid;grid-template-columns:repeat(3,660px);gap:10px"; });
    await page.evaluate(async ({ base, start }) => {
      const pdfjs = await import(base + "/legacy/build/pdf.mjs");
      pdfjs.GlobalWorkerOptions.workerSrc = base + "/legacy/build/pdf.worker.mjs";
      const d = await pdfjs.getDocument(base + "/prezentace.pdf").promise;
      for (let i = start; i < start + 9 && i <= d.numPages; i++) {
        const p = await d.getPage(i); const v = p.getViewport({ scale: 660 / p.getViewport({ scale: 1 }).width });
        const c = document.createElement("canvas"); c.width = v.width; c.height = v.height; document.body.appendChild(c);
        await p.render({ canvasContext: c.getContext("2d"), viewport: v }).promise;
      }
    }, { base, start });
    await page.screenshot({ path: path.join(OUT, `mrizka-${m}.png`), fullPage: true });
  }
  await b.close(); srv.close();
})();
