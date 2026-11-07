// Scény pro snimky.js — jedna scéna = jeden nebo víc screenshotů, které používá obsah.js.
// Název souboru (snimek("…")) musí sedět s názvem v obsah.js (img: [["x-karta", "tel"]]).
//
// Volby scény:
//   upravy(data)   … úprava testovacích dat před nalitím (např. prázdný tým)
//   rezim          … "telefon" (výchozí, 390×844), "nasirku" (844×390), "pocitac" (1280×800)
//   vzhled         … přepíše vzhled (výchozí Trenér, světlý), např. { dark: true }
//   localStorage   … další klíče do localStorage
//   cesta          … adresa místo index.html (např. "index.html?napoveda=záloha")
//   kroky(page, h) … co se má proklikat; h.pockej(ms), h.snimek(název), h.tlacitka(re), h.mer(sel), h.out
//
// Ovládání aplikace jde přes její globální funkce (selectPlayer, skTab, openHelp…), protože je to
// spolehlivější než klikání podle textu. Když se funkce v index.html přejmenuje, uprav ji i tady.

const prazdny = (d) => { d.players = []; d.matches = []; d.tournaments = []; d.minihry = []; d.teamNotes = []; d.seasons = []; d.subtitle = "SK Meteor Praha – U14"; };
const plus = async (page, h, co) => { await page.locator(".sk-fab, #skFab, button.fab").first().click(); await h.pockej(500); await page.getByText(co, { exact: true }).last().click(); await h.pockej(900); };
// Posune stránku (Bombito scrolluje uvnitř hlavního kontejneru, ne celé okno)
const rol = (page, px) => page.evaluate((px) => { const els = [document.scrollingElement, ...document.querySelectorAll("main, #main, .main, #app, .content, #content, [class*=scroll]")].filter(e => e && e.scrollHeight > e.clientHeight + 40);
  const e = els.sort((a, b) => b.scrollHeight - a.scrollHeight)[0]; if (e) e.scrollTop += px; window.scrollBy(0, px); }, px);
// Otevře kartu hráčky (výchozí Julie Zemanová, p1011) a případně záložku
const karta = async (page, h, id, tab) => { await page.evaluate((id) => selectPlayer(id), id || "p1011"); await h.pockej(1000); if (tab) { await page.getByText(tab, { exact: true }).first().click(); await h.pockej(1200); } };
const modalDolu = (page, k) => page.evaluate((k) => { const m = document.getElementById("modalContent"); const sc = [m, ...m.querySelectorAll("*"), m.parentElement, m.parentElement && m.parentElement.parentElement].find(e => e && e.scrollHeight > e.clientHeight + 40 && getComputedStyle(e).overflowY !== "visible"); if (sc) sc.scrollTop = k; }, k);

module.exports = {
  // A · Začínáme
  b0_domu: { kroky: async (page, h) => { await h.snimek("b0-domu"); } },
  x_menu: { kroky: async (page, h) => { await page.click("#menuToggle"); await h.pockej(600); await h.snimek("x-menu"); } },
  a_sidebar: { kroky: async (page, h) => { await page.click("#sidebarToggle"); await h.pockej(600); await h.snimek("a-sidebar"); } },
  x_plus: { kroky: async (page, h) => { await page.locator(".sk-fab, #skFab, button.fab").first().click(); await h.pockej(600); await h.snimek("x-plus"); } },
  // poslední záloha před 12 dny → ukáže se připomínka zálohy
  a_zaloha: { localStorage: { bombito_last_export: String(Date.now() - 12 * 864e5) }, kroky: async (page, h) => { await h.pockej(2500); await h.snimek("a-zaloha-bublina"); } },
  a_sezona_data: { kroky: async (page, h) => { await page.evaluate(() => openSezonaData()); await h.pockej(800); await h.snimek("a-sezona-data"); } },
  a_napoveda: { kroky: async (page, h) => { await page.evaluate(() => openHelp()); await h.pockej(700); await page.fill("#helpSearchInput", "záloha"); await h.pockej(500); await h.snimek("a-napoveda-zaloha"); } },

  // B · Tvoje hráčky (prázdný tým)
  b_prazdny: { upravy: prazdny, kroky: async (page, h) => { await h.snimek("b-prazdny"); } },
  b_pridat: { upravy: prazdny, kroky: async (page, h) => {
    await plus(page, h, "Přidat hráčku");
    await page.fill("#pName", "Tereza Malá"); await page.fill("#pYear", "2013"); await page.fill("#pDres", "7"); await h.snimek("b-pridat-vyplneno");
  } },
  x_karta: { kroky: async (page, h) => { await karta(page, h); await h.pockej(200); await h.snimek("x-karta"); } },
  b_pozice: { upravy: prazdny, kroky: async (page, h) => {
    await plus(page, h, "Přidat hráčku"); await page.fill("#pName", "Tereza Malá"); await page.fill("#pYear", "2013"); await page.fill("#pDres", "7");
    await page.evaluate(() => addPlayer()); await h.pockej(1200);
    await page.evaluate(() => openPozice()); await h.pockej(900);
    await page.locator("#modalContent button").filter({ hasText: /Smeč/ }).first().click().catch(() => {}); await h.pockej(300);
    await page.locator("#modalContent button").filter({ hasText: /Účko|Univerz/ }).first().click().catch(() => {}); await h.pockej(500);
    await h.snimek("b-pozice-vybrano");
  } },

  // C · Testování
  c_skupinovy: { kroky: async (page, h) => { await plus(page, h, "Skupinový test"); await h.snimek("c-skupinovy"); await modalDolu(page, 700); await h.pockej(400); await h.snimek("c-skupinovy-2"); } },
  c_test_fyz: { kroky: async (page, h) => { await karta(page, h); await page.getByText("Test", { exact: true }).first().click(); await h.pockej(700); await page.evaluate(() => openAddTest('fyz')); await h.pockej(900); await h.snimek("c-test-fyz"); } },
  c_fyzicke: { kroky: async (page, h) => { await karta(page, h, null, "Fyzické"); await rol(page, 650); await h.pockej(500); await h.snimek("c-fyzicke-2"); } },
  c_herni: { kroky: async (page, h) => { await karta(page, h, null, "Herní"); await rol(page, 600); await h.pockej(400); await h.snimek("c-herni"); } },

  // D · Co čísla znamenají
  d_overall: { kroky: async (page, h) => { await karta(page, h); await page.evaluate(() => showOverallBreakdown('p1011')); await h.pockej(1000); await h.snimek("d-overall"); } },
  d_pavouk: { kroky: async (page, h) => { await karta(page, h, null, "Pavouk"); await rol(page, 520); await h.pockej(500); await h.snimek("d-pavouk"); await rol(page, 800); await h.pockej(500); await h.snimek("d-pavouk-2"); } },

  // E · Vývoj hráčky
  e_milniky: { kroky: async (page, h) => { await karta(page, h, null, "Milníky"); await rol(page, 520); await h.pockej(500); await h.snimek("e-milniky"); } },
  e_odznaky: { kroky: async (page, h) => { await karta(page, h); await page.getByRole("button", { name: /Odznaky/ }).first().click(); await h.pockej(900); await h.snimek("e-odznaky"); } },
  e_lepik: { kroky: async (page, h) => { await karta(page, h); await page.locator("[class*=lepik], [class*=lp-], .sticky, [onclick*=lepik], [onclick*=Lepik]").first().click().catch(() => {}); await h.pockej(900); await h.snimek("e-lepik"); } },
  e_denik: { kroky: async (page, h) => { await page.evaluate(() => skTab('denik')); await h.pockej(1500); await h.snimek("e-denik"); } },

  // F · Zápasy
  f_zapas_setup: { kroky: async (page, h) => { await plus(page, h, "Spustit zápas"); await h.snimek("f-zapas-setup"); } },
  f_zivy: { kroky: async (page, h) => {
    await plus(page, h, "Spustit zápas"); await page.fill("#modalContent input[type=text]", "TJ Sokol Hostivař").catch(() => {});
    await page.getByText("OBOJÍ").first().click().catch(() => page.locator("#modalContent input[type=radio]").nth(2).check().catch(() => {}));
    await page.evaluate(() => createMatch()); await h.pockej(1500);
    const plusy = page.locator("button").filter({ hasText: /^\s*\+\s*$/ });
    for (const i of [0, 0, 3, 5, 0]) { await plusy.nth(i).click().catch(() => {}); await h.pockej(250); }
    await h.pockej(600); await h.snimek("f-zivy-body");
  } },
  f_trenink_stat: { kroky: async (page, h) => { await plus(page, h, "Tréninková statistika"); await h.snimek("f-trenink-stat"); } },
  f_zapasy: { kroky: async (page, h) => { await page.evaluate(() => skTab('zapasy')); await h.pockej(1400); await h.snimek("f-zapasy"); } },

  // G · Turnaje a minihry
  g_turnaje: { kroky: async (page, h) => { await page.evaluate(() => openTournaments()); await h.pockej(1000); await h.snimek("g-turnaje");
    await page.locator("#modalContent [onclick*=ourn], #modalContent .tn-card, #modalContent .card").first().click().catch(() => {}); await h.pockej(1000); await h.snimek("g-turnaj-detail"); } },
  g_minihry: { kroky: async (page, h) => { await page.evaluate(() => openMinihry()); await h.pockej(1000); await h.snimek("g-minihry"); } },

  // H · Přehledy
  h_razeni: { kroky: async (page, h) => { await page.evaluate(() => domuMenuToggle('raz', new MouseEvent('click'))); await h.pockej(600); await h.snimek("h-razeni"); } },
  h_testy_pc: { rezim: "pocitac", kroky: async (page, h) => { await page.evaluate(() => skTab('ov')); await h.pockej(1500); await h.snimek("h-testy-pc"); } },
  h_srovnani: { kroky: async (page, h) => { await page.evaluate(() => skTab('cmp')); await h.pockej(1200); await page.evaluate(() => { toggleCmpP('p1011'); toggleCmpP('p1016'); }); await h.pockej(1500); await h.snimek("h-srovnani-2hracky"); } },

  // I · Report pro rodiče (PDF se otevírá v novém okně)
  i_pdf: { kroky: async (page, h) => { await karta(page, h);
    const [nova] = await Promise.all([page.context().waitForEvent("page", { timeout: 8000 }).catch(() => null), page.getByRole("button", { name: /PDF/ }).first().click()]);
    await h.pockej(2500);
    if (nova) { await nova.waitForTimeout(2500); await nova.screenshot({ path: require("path").join(h.out, "i-pdf.png") }); } else await h.snimek("i-pdf"); } },

  // J · Data a nastavení
  j_tymy: { kroky: async (page, h) => { await page.evaluate(() => openTymy()); await h.pockej(900); await h.snimek("j-tymy"); } },
  j_nastaveni: { kroky: async (page, h) => { await page.evaluate(() => openEditor()); await h.pockej(900); await h.snimek("j-nastaveni"); } },
  j_tmavy: { vzhled: { dark: true }, kroky: async (page, h) => { await h.snimek("j-tmavy"); } }
};
